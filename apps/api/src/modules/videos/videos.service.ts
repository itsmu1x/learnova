import { schema, and, eq } from '@learnova/database';
import { ForbiddenError, NotFoundError, Permission, hasPermission } from '@learnova/shared';
import { VIDEO } from '@learnova/config';
import { db } from '../../core/database.js';
import { coursesService } from '../courses/courses.service.js';
import { coursesRepository } from '../courses/courses.repository.js';
import {
  createDirectUpload,
  getAssetStatus,
  getSignedPlayback,
  isMuxConfigured,
  resolveUploadAssetId,
} from '../../services/mux.service.js';

interface Actor {
  id: string;
  permissions: bigint;
}

async function getLessonOrThrow(lessonId: string) {
  const [lesson] = await db()
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.id, lessonId))
    .limit(1);
  if (!lesson) throw new NotFoundError('Lesson not found');
  return lesson;
}

function mapMuxStatus(status: string): 'processing' | 'ready' | 'failed' {
  if (status === 'ready') return 'ready';
  if (status === 'errored') return 'failed';
  return 'processing';
}

export const videosService = {
  /** Instructor: request a Mux direct-upload URL for the lesson video. */
  async initUpload(actor: Actor, lessonId: string, title: string) {
    const lesson = await getLessonOrThrow(lessonId);
    await coursesService.assertOwnership(actor, lesson.courseId);

    if (!isMuxConfigured()) {
      await db()
        .update(schema.videos)
        .set({ status: 'ready', provider: VIDEO.PROVIDER, providerVideoId: 'dev-placeholder' })
        .where(eq(schema.videos.lessonId, lessonId));
      return { devMode: true, message: 'Mux not configured; marked ready for local dev.' };
    }

    const { uploadId, uploadUrl } = await createDirectUpload(title);
    await db()
      .update(schema.videos)
      .set({
        provider: VIDEO.PROVIDER,
        providerVideoId: uploadId,
        status: 'uploading',
        uploadCredentials: { uploadId, uploadUrl },
        updatedAt: new Date(),
      })
      .where(eq(schema.videos.lessonId, lessonId));

    return { provider: VIDEO.PROVIDER, uploadId, uploadUrl };
  },

  /** Called after the client finishes uploading directly to Mux. */
  async markProcessing(actor: Actor, lessonId: string, durationSeconds?: number) {
    const lesson = await getLessonOrThrow(lessonId);
    await coursesService.assertOwnership(actor, lesson.courseId);

    const [video] = await db()
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.lessonId, lessonId))
      .limit(1);

    let assetId = video?.providerVideoId ?? null;
    if (isMuxConfigured() && video?.uploadCredentials) {
      const creds = video.uploadCredentials as { uploadId?: string };
      if (creds.uploadId) {
        assetId = (await resolveUploadAssetId(creds.uploadId)) ?? assetId;
      }
    }

    await db()
      .update(schema.videos)
      .set({
        status: 'processing',
        providerVideoId: assetId,
        durationSeconds: durationSeconds ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.videos.lessonId, lessonId));

    if (durationSeconds) {
      await db()
        .update(schema.lessons)
        .set({ durationSeconds })
        .where(eq(schema.lessons.id, lessonId));
      await coursesRepository.recomputeCounts(lesson.courseId);
    }

    return { status: 'processing', assetId };
  },

  async syncStatus(actor: Actor, lessonId: string) {
    const lesson = await getLessonOrThrow(lessonId);
    await coursesService.assertOwnership(actor, lesson.courseId);
    const [video] = await db()
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.lessonId, lessonId))
      .limit(1);
    if (!video?.providerVideoId) throw new NotFoundError('No Mux asset associated');

    if (!isMuxConfigured()) {
      return { status: video.status, providerStatus: 'dev' };
    }

    const providerStatus = await getAssetStatus(video.providerVideoId);
    const status = mapMuxStatus(providerStatus);
    await db().update(schema.videos).set({ status }).where(eq(schema.videos.lessonId, lessonId));
    return { status, providerStatus };
  },

  /**
   * Student playback: returns a signed Mux JWT + playback ID. Access requires the
   * lesson to be a preview, the user to be enrolled, or course ownership.
   */
  async getPlayback(actor: Actor, lessonId: string) {
    const lesson = await getLessonOrThrow(lessonId);
    const [video] = await db()
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.lessonId, lessonId))
      .limit(1);
    if (!video?.providerVideoId) throw new NotFoundError('Video not available yet');

    const course = await coursesRepository.findById(lesson.courseId);
    const isOwner =
      course?.instructorId === actor.id ||
      hasPermission(actor.permissions, Permission.MANAGE_ALL_COURSES);

    if (!lesson.isPreview && !isOwner) {
      const [enrollment] = await db()
        .select()
        .from(schema.enrollments)
        .where(
          and(eq(schema.enrollments.userId, actor.id), eq(schema.enrollments.courseId, lesson.courseId)),
        )
        .limit(1);
      if (!enrollment) throw new ForbiddenError('Enroll in this course to watch this lesson');
    }

    if (!isMuxConfigured()) {
      return {
        devMode: true,
        provider: VIDEO.PROVIDER,
        playbackId: video.providerVideoId,
        token: null,
      };
    }

    const { playbackId, token } = await getSignedPlayback(video.providerVideoId);
    return { provider: VIDEO.PROVIDER, playbackId, token };
  },
};
