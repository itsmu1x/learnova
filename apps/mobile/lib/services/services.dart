import '../core/api_client.dart';
import '../models/models.dart';

/// Course browsing & detail.
class CourseService {
  final _api = ApiClient.instance;

  Future<List<Course>> browse({String? search, String sort = 'popular'}) async {
    final data = await _api.get('/courses', query: {
      'limit': 24,
      'sort': sort,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return (data as List).map((c) => Course.fromJson(c as Map<String, dynamic>)).toList();
  }

  Future<Course> bySlug(String slug) async {
    final data = await _api.get('/courses/slug/$slug');
    return Course.fromJson(data as Map<String, dynamic>);
  }

  Future<Course> byId(String id) async {
    final data = await _api.get('/courses/id/$id');
    return Course.fromJson(data as Map<String, dynamic>);
  }
}

/// Enrollments, progress and continue-learning.
class LearningService {
  final _api = ApiClient.instance;

  Future<List<Enrollment>> myEnrollments() async {
    final data = await _api.get('/enrollments');
    return (data as List).map((e) => Enrollment.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> enroll(String courseId) => _api.post('/enrollments/$courseId');

  Future<Map<String, dynamic>> checkoutCourse(String courseId) async {
    final data = await _api.post('/payments/checkout/course/$courseId');
    return data as Map<String, dynamic>;
  }

  Future<void> completeLesson(String lessonId) =>
      _api.post('/enrollments/lessons/$lessonId/progress', body: {'completed': true});

  Future<List<String>> completedLessonIds(String courseId) async {
    final data = await _api.get('/enrollments/$courseId/progress');
    return (data as List)
        .where((p) => p['isCompleted'] == true)
        .map((p) => p['lessonId'] as String)
        .toList();
  }
}

/// AI tutor.
class AiService {
  final _api = ApiClient.instance;

  Future<String> askTutor(String question, {String? lessonId, List<Map<String, String>>? history}) async {
    final data = await _api.post('/ai/tutor', body: {
      'question': question,
      if (lessonId != null) 'lessonId': lessonId,
      if (history != null) 'history': history,
    });
    return (data as Map<String, dynamic>)['answer'] as String;
  }
}

/// Certificates.
class CertificateService {
  final _api = ApiClient.instance;

  Future<List<Certificate>> mine() async {
    final data = await _api.get('/certificates');
    return (data as List).map((c) => Certificate.fromJson(c as Map<String, dynamic>)).toList();
  }
}
