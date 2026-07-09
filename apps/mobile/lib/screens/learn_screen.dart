import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/services.dart';
import 'ai_tutor_sheet.dart';

class LearnScreen extends StatefulWidget {
  const LearnScreen({super.key, required this.courseId});
  final String courseId;

  @override
  State<LearnScreen> createState() => _LearnScreenState();
}

class _LearnScreenState extends State<LearnScreen> {
  final _courses = CourseService();
  final _learning = LearningService();
  Course? _course;
  Set<String> _completed = {};
  Lesson? _active;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final course = await _courses.byId(widget.courseId);
    final completed = await _learning.completedLessonIds(widget.courseId).catchError((_) => <String>[]);
    final lessons = course.curriculum.expand((s) => s.lessons).toList();
    setState(() {
      _course = course;
      _completed = completed.toSet();
      _active = lessons.isNotEmpty ? lessons.first : null;
      _loading = false;
    });
  }

  Future<void> _complete(Lesson lesson) async {
    await _learning.completeLesson(lesson.id).catchError((_) {});
    setState(() => _completed = {..._completed, lesson.id});
  }

  void _openTutor() {
    if (_active == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => AiTutorSheet(lessonId: _active!.id, lessonTitle: _active!.title),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final course = _course!;
    final theme = Theme.of(context);
    final total = course.curriculum.fold<int>(0, (n, s) => n + s.lessons.length);
    final percent = total == 0 ? 0 : ((_completed.length / total) * 100).round();

    return Scaffold(
      appBar: AppBar(title: Text(course.title, overflow: TextOverflow.ellipsis)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openTutor,
        icon: const Icon(Icons.smart_toy_outlined),
        label: const Text('AI Tutor'),
      ),
      body: Column(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: Colors.black,
              alignment: Alignment.center,
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Icon(Icons.play_circle_fill, size: 56, color: Colors.white70),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Secure Mux player (token via /videos/${_active?.id}/playback)',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ),
              ]),
            ),
          ),
          LinearProgressIndicator(value: percent / 100),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(child: Text('$percent% complete', style: theme.textTheme.bodySmall)),
              if (_active != null)
                FilledButton.tonal(
                  onPressed: _completed.contains(_active!.id) ? null : () => _complete(_active!),
                  child: Text(_completed.contains(_active!.id) ? 'Completed' : 'Mark complete'),
                ),
            ]),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              children: [
                for (final section in course.curriculum) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(section.title.toUpperCase(),
                        style: theme.textTheme.labelSmall?.copyWith(color: theme.hintColor)),
                  ),
                  for (final lesson in section.lessons)
                    ListTile(
                      selected: lesson.id == _active?.id,
                      leading: Icon(
                        _completed.contains(lesson.id)
                            ? Icons.check_circle
                            : Icons.circle_outlined,
                        color: _completed.contains(lesson.id) ? Colors.green : theme.hintColor,
                      ),
                      title: Text(lesson.title),
                      onTap: () => setState(() => _active = lesson),
                    ),
                ],
                const SizedBox(height: 80),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
