// Plain data models mapped from the Learnova API JSON responses.

class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    this.roles = const [],
  });

  final String id;
  final String email;
  final String name;
  final String? avatarUrl;
  final List<String> roles;

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        email: json['email'] as String,
        name: json['name'] as String,
        avatarUrl: json['avatarUrl'] as String?,
        roles: (json['roles'] as List?)?.cast<String>() ?? const [],
      );
}

class Instructor {
  Instructor({required this.id, required this.name, this.avatarUrl});
  final String id;
  final String name;
  final String? avatarUrl;

  factory Instructor.fromJson(Map<String, dynamic> json) => Instructor(
        id: json['id'] as String,
        name: json['name'] as String,
        avatarUrl: json['avatarUrl'] as String?,
      );
}

class Course {
  Course({
    required this.id,
    required this.slug,
    required this.title,
    this.subtitle,
    this.description,
    this.thumbnailUrl,
    required this.level,
    required this.priceCents,
    required this.isPro,
    required this.averageRating,
    required this.enrollmentCount,
    required this.lessonCount,
    this.instructor,
    this.curriculum = const [],
    this.requirements = const [],
    this.outcomes = const [],
  });

  final String id;
  final String slug;
  final String title;
  final String? subtitle;
  final String? description;
  final String? thumbnailUrl;
  final String level;
  final int priceCents;
  final bool isPro;
  final double averageRating;
  final int enrollmentCount;
  final int lessonCount;
  final Instructor? instructor;
  final List<CurriculumSection> curriculum;
  final List<String> requirements;
  final List<String> outcomes;

  bool get isFree => priceCents == 0 && !isPro;
  String get priceLabel => isFree ? 'Free' : '\$${(priceCents / 100).toStringAsFixed(2)}';

  factory Course.fromJson(Map<String, dynamic> json) => Course(
        id: json['id'] as String,
        slug: json['slug'] as String,
        title: json['title'] as String,
        subtitle: json['subtitle'] as String?,
        description: json['description'] as String?,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        level: json['level'] as String? ?? 'beginner',
        priceCents: (json['priceCents'] as num?)?.toInt() ?? 0,
        isPro: json['isPro'] as bool? ?? false,
        averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0,
        enrollmentCount: (json['enrollmentCount'] as num?)?.toInt() ?? 0,
        lessonCount: (json['lessonCount'] as num?)?.toInt() ?? 0,
        instructor: json['instructor'] is Map
            ? Instructor.fromJson(json['instructor'] as Map<String, dynamic>)
            : null,
        curriculum: (json['curriculum'] as List?)
                ?.map((s) => CurriculumSection.fromJson(s as Map<String, dynamic>))
                .toList() ??
            const [],
        requirements: (json['requirements'] as List?)?.cast<String>() ?? const [],
        outcomes: (json['outcomes'] as List?)?.cast<String>() ?? const [],
      );
}

class CurriculumSection {
  CurriculumSection({required this.id, required this.title, this.lessons = const []});
  final String id;
  final String title;
  final List<Lesson> lessons;

  factory CurriculumSection.fromJson(Map<String, dynamic> json) => CurriculumSection(
        id: json['id'] as String,
        title: json['title'] as String,
        lessons: (json['lessons'] as List?)
                ?.map((l) => Lesson.fromJson(l as Map<String, dynamic>))
                .toList() ??
            const [],
      );
}

class Lesson {
  Lesson({
    required this.id,
    required this.title,
    required this.durationSeconds,
    required this.isPreview,
  });
  final String id;
  final String title;
  final int durationSeconds;
  final bool isPreview;

  factory Lesson.fromJson(Map<String, dynamic> json) => Lesson(
        id: json['id'] as String,
        title: json['title'] as String,
        durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
        isPreview: json['isPreview'] as bool? ?? false,
      );
}

class Enrollment {
  Enrollment({required this.courseId, required this.progressPercent, required this.course});
  final String courseId;
  final int progressPercent;
  final Course course;

  factory Enrollment.fromJson(Map<String, dynamic> json) {
    final e = json['enrollment'] as Map<String, dynamic>;
    return Enrollment(
      courseId: e['courseId'] as String,
      progressPercent: (e['progressPercent'] as num?)?.toInt() ?? 0,
      course: Course.fromJson(json['course'] as Map<String, dynamic>),
    );
  }
}

class Certificate {
  Certificate({required this.code, required this.courseTitle, required this.issuedAt});
  final String code;
  final String courseTitle;
  final String issuedAt;

  factory Certificate.fromJson(Map<String, dynamic> json) => Certificate(
        code: json['code'] as String,
        courseTitle: json['courseTitle'] as String,
        issuedAt: json['issuedAt'] as String,
      );
}
