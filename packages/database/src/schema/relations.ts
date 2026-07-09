import { relations } from 'drizzle-orm';
import {
  authTokens,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from './auth.js';
import {
  categories,
  courses,
  lessonResources,
  lessons,
  quizzes,
  sections,
  videos,
} from './catalog.js';
import {
  certificates,
  enrollments,
  lessonProgress,
  notes,
  reviews,
} from './learning.js';
import { payments, purchases, subscriptions } from './commerce.js';

export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(userRoles),
  courses: many(courses),
  enrollments: many(enrollments),
  reviews: many(reviews),
  certificates: many(certificates),
  purchases: many(purchases),
  authTokens: many(authTokens),
  subscription: one(subscriptions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(userRoles),
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  category: one(categories, { fields: [courses.categoryId], references: [categories.id] }),
  sections: many(sections),
  lessons: many(lessons),
  enrollments: many(enrollments),
  reviews: many(reviews),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  course: one(courses, { fields: [sections.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  section: one(sections, { fields: [lessons.sectionId], references: [sections.id] }),
  course: one(courses, { fields: [lessons.courseId], references: [courses.id] }),
  video: one(videos),
  resources: many(lessonResources),
  quiz: one(quizzes),
  notes: many(notes),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  lesson: one(lessons, { fields: [videos.lessonId], references: [lessons.id] }),
}));

export const lessonResourcesRelations = relations(lessonResources, ({ one }) => ({
  lesson: one(lessons, { fields: [lessonResources.lessonId], references: [lessons.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  lesson: one(lessons, { fields: [quizzes.lessonId], references: [lessons.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] }),
  course: one(courses, { fields: [lessonProgress.courseId], references: [courses.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [notes.lessonId], references: [lessons.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  course: one(courses, { fields: [reviews.courseId], references: [courses.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, { fields: [purchases.userId], references: [users.id] }),
  course: one(courses, { fields: [purchases.courseId], references: [courses.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  purchase: one(purchases, { fields: [payments.purchaseId], references: [purchases.id] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));
