export interface CourseCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description?: string | null;
  thumbnailUrl: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  status?: string;
  priceCents: number;
  isPro: boolean;
  averageRating: number;
  ratingCount: number;
  enrollmentCount: number;
  lessonCount: number;
  totalDurationSeconds: number;
  instructor: { id: string; name: string; avatarUrl: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
}

export interface CurriculumSection {
  id: string;
  title: string;
  description: string | null;
  lessons: {
    id: string;
    title: string;
    description?: string | null;
    durationSeconds: number;
    isPreview: boolean;
  }[];
}

export interface CourseDetail extends CourseCard {
  requirements: string[];
  outcomes: string[];
  curriculum: CurriculumSection[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: string[];
  permissions: string;
  emailVerified: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  courseCount: number;
}
