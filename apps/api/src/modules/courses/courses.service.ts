import {
  CourseStatus,
  ForbiddenError,
  NotFoundError,
  Permission,
  hasPermission,
  slugify,
} from '@learnova/shared';
import { nanoid } from 'nanoid';
import { coursesRepository, type CourseFilters, type CourseRow } from './courses.repository.js';
import { recordAudit } from '../audit/audit.service.js';

interface Actor {
  id: string;
  permissions: bigint;
}

function canManage(course: CourseRow, actor: Actor): boolean {
  if (hasPermission(actor.permissions, Permission.MANAGE_ALL_COURSES)) return true;
  return course.instructorId === actor.id;
}

function serialize(row: { course: CourseRow; instructor: unknown; category: unknown }) {
  const { course, instructor, category } = row;
  return {
    ...course,
    permissions: undefined,
    instructor,
    category,
  };
}

export const coursesService = {
  async browse(filters: CourseFilters) {
    const { items, total } = await coursesRepository.list(filters);
    return { items: items.map(serialize), total };
  },

  async getBySlug(slug: string) {
    const row = await coursesRepository.findBySlug(slug);
    if (!row) throw new NotFoundError('Course not found');
    const curriculum = await coursesRepository.getCurriculum(row.course.id);
    return { ...serialize(row), curriculum };
  },

  async getById(id: string) {
    const row = await coursesRepository.findByIdWithRelations(id);
    if (!row) throw new NotFoundError('Course not found');
    const curriculum = await coursesRepository.getCurriculum(row.course.id);
    return { ...serialize(row), curriculum };
  },

  async create(
    actor: Actor,
    input: {
      title: string;
      subtitle?: string;
      description?: string;
      categoryId?: string;
      level?: string;
      priceCents?: number;
      isPro?: boolean;
    },
  ) {
    const slug = `${slugify(input.title)}-${nanoid(6)}`;
    const course = await coursesRepository.create({
      title: input.title,
      slug,
      subtitle: input.subtitle,
      description: input.description,
      categoryId: input.categoryId ?? null,
      level: (input.level as never) ?? 'beginner',
      priceCents: input.priceCents ?? 0,
      isPro: input.isPro ?? false,
      instructorId: actor.id,
      status: 'draft',
    });
    await recordAudit({
      actorId: actor.id,
      action: 'course.create',
      entityType: 'course',
      entityId: course.id,
      newData: { title: input.title },
    });
    return course;
  },

  async update(actor: Actor, id: string, input: Partial<CourseRow>) {
    const course = await coursesRepository.findById(id);
    if (!course) throw new NotFoundError('Course not found');
    if (!canManage(course, actor)) throw new ForbiddenError('You do not own this course');

    const previous = { title: course.title, priceCents: course.priceCents };
    const updated = await coursesRepository.update(id, input);
    await recordAudit({
      actorId: actor.id,
      action: 'course.update',
      entityType: 'course',
      entityId: id,
      previousData: previous,
      newData: { title: updated.title, priceCents: updated.priceCents },
    });
    return updated;
  },

  async setStatus(actor: Actor, id: string, status: CourseStatus) {
    const course = await coursesRepository.findById(id);
    if (!course) throw new NotFoundError('Course not found');
    if (!canManage(course, actor)) throw new ForbiddenError('You do not own this course');

    const updated = await coursesRepository.update(id, {
      status,
      publishedAt:
        status === CourseStatus.PUBLISHED && !course.publishedAt
          ? new Date().toISOString()
          : course.publishedAt,
    });
    await recordAudit({
      actorId: actor.id,
      action: `course.${status}`,
      entityType: 'course',
      entityId: id,
      previousData: { status: course.status },
      newData: { status },
    });
    return updated;
  },

  async remove(actor: Actor, id: string) {
    const course = await coursesRepository.findById(id);
    if (!course) throw new NotFoundError('Course not found');
    if (!canManage(course, actor)) throw new ForbiddenError('You do not own this course');
    await coursesRepository.softDelete(id);
    await recordAudit({
      actorId: actor.id,
      action: 'course.delete',
      entityType: 'course',
      entityId: id,
    });
  },

  async assertOwnership(actor: Actor, courseId: string): Promise<CourseRow> {
    const course = await coursesRepository.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');
    if (!canManage(course, actor)) throw new ForbiddenError('You do not own this course');
    return course;
  },
};
