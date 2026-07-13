import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/mux_lesson_player.dart';
import 'ai_tutor_sheet.dart';

class LearnScreen extends StatefulWidget {
  const LearnScreen({
    super.key,
    required this.courseId,
    this.purchaseSuccess = false,
  });

  final String courseId;
  final bool purchaseSuccess;

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
    if (widget.purchaseSuccess) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Purchase complete — enjoy your course!'),
            backgroundColor: AppTheme.success,
          ),
        );
      });
    }
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
      showDragHandle: true,
      builder: (_) => AiTutorSheet(lessonId: _active!.id, lessonTitle: _active!.title),
    );
  }

  String _durationLabel(int seconds) {
    if (seconds <= 0) return '';
    final m = (seconds / 60).ceil();
    return '$m min';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final course = _course!;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final total = course.curriculum.fold<int>(0, (n, s) => n + s.lessons.length);
    final percent = total == 0 ? 0 : ((_completed.length / total) * 100).round();
    final lesson = _active;

    return Scaffold(
      appBar: AppBar(
        title: Text(course.title, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: 'AI Tutor',
            onPressed: lesson == null ? null : _openTutor,
            icon: const Icon(Icons.smart_toy_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Column(
              children: [
                MuxLessonPlayer(
                  key: ValueKey(lesson?.id),
                  lessonId: lesson?.id,
                  title: lesson?.title,
                  thumbnailUrl: course.thumbnailUrl,
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: percent / 100,
                    minHeight: 6,
                    backgroundColor: scheme.surfaceContainerHighest,
                  ),
                ),
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    '$percent% complete · ${_completed.length} of $total lessons',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                if (lesson != null) ...[
                  Text(lesson.title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (lesson.durationSeconds > 0)
                        Chip(
                          avatar: const Icon(Icons.schedule, size: 16),
                          label: Text(_durationLabel(lesson.durationSeconds)),
                          visualDensity: VisualDensity.compact,
                        ),
                      if (lesson.isPreview)
                        Chip(
                          label: const Text('Preview'),
                          visualDensity: VisualDensity.compact,
                          backgroundColor: scheme.primaryContainer,
                        ),
                      if (_completed.contains(lesson.id))
                        const Chip(
                          avatar: Icon(Icons.check_circle, size: 16, color: AppTheme.success),
                          label: Text('Completed'),
                          visualDensity: VisualDensity.compact,
                        ),
                    ],
                  ),
                  if (lesson.description != null && lesson.description!.trim().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      lesson.description!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        height: 1.5,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ] else if (course.description != null && course.description!.trim().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(
                      course.description!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        height: 1.5,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.tonalIcon(
                          onPressed: _completed.contains(lesson.id) ? null : () => _complete(lesson),
                          icon: Icon(_completed.contains(lesson.id) ? Icons.check : Icons.check_circle_outline),
                          label: Text(_completed.contains(lesson.id) ? 'Completed' : 'Mark complete'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      FilledButton.icon(
                        onPressed: _openTutor,
                        icon: const Icon(Icons.smart_toy_outlined),
                        label: const Text('Ask AI'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                ],
                Text('Course content', style: theme.textTheme.titleMedium),
                const SizedBox(height: 10),
                for (final section in course.curriculum) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 6),
                    child: Text(
                      section.title.toUpperCase(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.hintColor,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                  Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Column(
                      children: [
                        for (var i = 0; i < section.lessons.length; i++) ...[
                          if (i > 0) Divider(height: 1, color: scheme.outlineVariant.withOpacity(0.4)),
                          _LessonTile(
                            lesson: section.lessons[i],
                            selected: section.lessons[i].id == lesson?.id,
                            completed: _completed.contains(section.lessons[i].id),
                            onTap: () => setState(() => _active = section.lessons[i]),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LessonTile extends StatelessWidget {
  const _LessonTile({
    required this.lesson,
    required this.selected,
    required this.completed,
    required this.onTap,
  });

  final Lesson lesson;
  final bool selected;
  final bool completed;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final minutes = lesson.durationSeconds > 0 ? '${(lesson.durationSeconds / 60).ceil()}m' : null;

    return ListTile(
      selected: selected,
      onTap: onTap,
      leading: Icon(
        completed ? Icons.check_circle : (selected ? Icons.play_circle_fill : Icons.play_circle_outline),
        color: completed
            ? AppTheme.success
            : selected
                ? theme.colorScheme.primary
                : theme.hintColor,
      ),
      title: Text(lesson.title, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: minutes != null ? Text(minutes) : null,
      trailing: lesson.isPreview
          ? Text('Preview', style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary))
          : null,
    );
  }
}
