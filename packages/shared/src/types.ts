/** Domain-level enums and shared DTO shapes used by web, api and mobile. */

export const CourseLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;
export type CourseLevel = (typeof CourseLevel)[keyof typeof CourseLevel];

export const CourseStatus = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;
export type CourseStatus = (typeof CourseStatus)[keyof typeof CourseStatus];

export const VideoStatus = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed',
} as const;
export type VideoStatus = (typeof VideoStatus)[keyof typeof VideoStatus];

export const PaymentStatus = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PurchaseType = {
  COURSE: 'course',
  SUBSCRIPTION: 'subscription',
} as const;
export type PurchaseType = (typeof PurchaseType)[keyof typeof PurchaseType];

export const SubscriptionStatus = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const AuthProvider = {
  LOCAL: 'local',
  GOOGLE: 'google',
  GITHUB: 'github',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  /** Effective permission bitmask, serialised as string to survive JSON. */
  permissions: string;
  emailVerified: boolean;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourseSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  level: CourseLevel;
  priceCents: number;
  isPro: boolean;
  averageRating: number;
  ratingCount: number;
  enrollmentCount: number;
  instructor: { id: string; name: string; avatarUrl: string | null };
  category: { id: string; name: string; slug: string } | null;
}
