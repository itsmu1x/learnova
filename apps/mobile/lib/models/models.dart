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
    this.categoryName,
    this.ratingCount = 0,
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
  final String? categoryName;
  final int ratingCount;
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
        categoryName: json['category'] is Map ? (json['category'] as Map)['name'] as String? : null,
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
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
    this.description,
    required this.durationSeconds,
    required this.isPreview,
  });
  final String id;
  final String title;
  final String? description;
  final int durationSeconds;
  final bool isPreview;

  factory Lesson.fromJson(Map<String, dynamic> json) => Lesson(
        id: json['id'] as String,
        title: json['title'] as String,
        description: json['description'] as String?,
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

class EnrollmentStatus {
  EnrollmentStatus({
    required this.enrolled,
    required this.progressPercent,
    required this.completed,
  });

  final bool enrolled;
  final int progressPercent;
  final bool completed;

  factory EnrollmentStatus.fromJson(Map<String, dynamic> json) => EnrollmentStatus(
        enrolled: json['enrolled'] as bool? ?? false,
        progressPercent: (json['progressPercent'] as num?)?.toInt() ?? 0,
        completed: json['completed'] as bool? ?? false,
      );
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

class Category {
  Category({required this.slug, required this.name, required this.courseCount});
  final String slug;
  final String name;
  final int courseCount;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        slug: json['slug'] as String,
        name: json['name'] as String,
        courseCount: (json['courseCount'] as num?)?.toInt() ?? 0,
      );
}

class Review {
  Review({
    required this.id,
    required this.userId,
    required this.userName,
    required this.rating,
    this.title,
    this.body,
    required this.createdAt,
  });
  final String id;
  final String userId;
  final String userName;
  final int rating;
  final String? title;
  final String? body;
  final DateTime? createdAt;

  /// API rows look like `{ review: {...}, user: { id, name } }`.
  factory Review.fromJson(Map<String, dynamic> json) {
    final r = json['review'] as Map<String, dynamic>;
    final u = json['user'] as Map<String, dynamic>? ?? const {};
    return Review(
      id: r['id'] as String,
      userId: r['userId'] as String? ?? u['id'] as String? ?? '',
      userName: u['name'] as String? ?? 'Learner',
      rating: (r['rating'] as num?)?.toInt() ?? 0,
      title: r['title'] as String?,
      body: r['body'] as String?,
      createdAt: DateTime.tryParse(r['createdAt'] as String? ?? ''),
    );
  }
}

class QuizQuestion {
  QuizQuestion({
    required this.question,
    required this.options,
    required this.answerIndex,
    this.explanation,
  });
  final String question;
  final List<String> options;
  final int answerIndex;
  final String? explanation;

  factory QuizQuestion.fromJson(Map<String, dynamic> json) => QuizQuestion(
        question: json['question'] as String,
        options: (json['options'] as List).map((o) => '$o').toList(),
        answerIndex: (json['answerIndex'] as num?)?.toInt() ?? 0,
        explanation: json['explanation'] as String?,
      );
}

/// The AI extras an instructor generated for a lesson (both optional).
class LessonExtras {
  LessonExtras({this.aiSummary, this.quiz = const []});
  final String? aiSummary;
  final List<QuizQuestion> quiz;

  factory LessonExtras.fromJson(Map<String, dynamic> json) {
    final quiz = json['quiz'] is Map ? (json['quiz'] as Map)['questions'] : null;
    return LessonExtras(
      aiSummary: (json['aiSummary'] as String?)?.trim().isEmpty == true ? null : json['aiSummary'] as String?,
      quiz: quiz is List
          ? quiz
              .whereType<Map<String, dynamic>>()
              .where((q) => q['question'] != null && q['options'] is List)
              .map(QuizQuestion.fromJson)
              .toList()
          : const [],
    );
  }
}

class Subscription {
  Subscription({required this.status, this.currentPeriodEnd, this.cancelAt});
  final String status;
  final DateTime? currentPeriodEnd;
  final DateTime? cancelAt;

  bool get isActive => status == 'active' || status == 'trialing';

  factory Subscription.fromJson(Map<String, dynamic> json) => Subscription(
        status: json['status'] as String? ?? 'incomplete',
        currentPeriodEnd: DateTime.tryParse(json['currentPeriodEnd'] as String? ?? ''),
        cancelAt: DateTime.tryParse(json['cancelAtPeriodEnd'] as String? ?? ''),
      );
}

class Purchase {
  Purchase({
    required this.title,
    required this.amountCents,
    required this.currency,
    required this.status,
    required this.createdAt,
  });
  final String title;
  final int amountCents;
  final String currency;
  final String status;
  final DateTime? createdAt;

  String get amountLabel =>
      '${currency.toUpperCase() == 'USD' ? '\$' : '${currency.toUpperCase()} '}${(amountCents / 100).toStringAsFixed(2)}';

  /// API rows look like `{ purchase: {...}, course: {...} | null }`.
  factory Purchase.fromJson(Map<String, dynamic> json) {
    final p = json['purchase'] as Map<String, dynamic>;
    final course = json['course'] as Map<String, dynamic>?;
    return Purchase(
      title: course?['title'] as String? ?? (p['type'] == 'subscription' ? 'Learnova Pro' : 'Purchase'),
      amountCents: (p['amountCents'] as num?)?.toInt() ?? 0,
      currency: p['currency'] as String? ?? 'usd',
      status: p['status'] as String? ?? 'pending',
      createdAt: DateTime.tryParse(p['createdAt'] as String? ?? ''),
    );
  }
}
