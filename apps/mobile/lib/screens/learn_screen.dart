import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/empty_state.dart';
import '../widgets/mux_lesson_player.dart';
import 'ai_tutor_sheet.dart';
import 'certificate_earned_screen.dart';
import 'quiz_screen.dart';

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

enum _Tab { overview, summary, quiz }

class _LearnScreenState extends State<LearnScreen> {
  final _courses = CourseService();
  final _learning = LearningService();
  final _ai = AiService();
  Course? _course;
  Set<String> _completed = {};
  Lesson? _active;
  bool _loading = true;
  String? _error;
  bool _completing = false;

  _Tab _tab = _Tab.overview;
  Future<LessonExtras>? _extras;
  Future<String>? _tutorSummary;

  @override
  void initState() {
    super.initState();
    _load();
    if (widget.purchaseSuccess) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment received. The course is now yours.')),
        );
      });
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final course = await _courses.byId(widget.courseId);
      final completed = await _learning.completedLessonIds(widget.courseId).catchError((_) => <String>[]);
      final lessons = course.curriculum.expand((s) => s.lessons).toList();
      if (!mounted) return;
      setState(() {
        _course = course;
        _completed = completed.toSet();
        _loading = false;
      });
      // Start on the first unfinished lesson.
      _select(lessons.isEmpty
          ? null
          : lessons.firstWhere((l) => !_completed.contains(l.id), orElse: () => lessons.first));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  void _select(Lesson? lesson) {
    setState(() {
      _active = lesson;
      _tab = _Tab.overview;
      _tutorSummary = null;
      _extras = lesson == null ? null : _courses.lessonExtras(lesson.id);
    });
  }

  int get _total => _course?.curriculum.fold<int>(0, (n, s) => n + s.lessons.length) ?? 0;

  Future<void> _complete(Lesson lesson) async {
    final finishesCourse = !_completed.contains(lesson.id) && _completed.length + 1 == _total;
    setState(() => _completing = true);
    try {
      final certificateCode = await _learning.completeLesson(lesson.id);
      if (!mounted) return;
      setState(() => _completed = {..._completed, lesson.id});
      if (finishesCourse && certificateCode != null) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            fullscreenDialog: true,
            builder: (_) => CertificateEarnedScreen(courseTitle: _course!.title, code: certificateCode),
          ),
        );
      } else {
        _goToNext(lesson);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Couldn’t save your progress. Try again. ($e)')),
      );
    } finally {
      if (mounted) setState(() => _completing = false);
    }
  }

  void _goToNext(Lesson lesson) {
    final lessons = _course!.curriculum.expand((s) => s.lessons).toList();
    final i = lessons.indexWhere((l) => l.id == lesson.id);
    if (i >= 0 && i + 1 < lessons.length) _select(lessons[i + 1]);
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
    if (_course == null) {
      return Scaffold(
        appBar: AppBar(),
        body: EmptyState(
          icon: Icons.error_outline_rounded,
          title: 'Couldn’t open this course',
          subtitle: _error?.contains('not enrolled') == true
              ? 'You’re not enrolled in this course yet.'
              : 'Check your connection and try again.',
          action: FilledButton(onPressed: _load, child: const Text('Try again')),
        ),
      );
    }
    final course = _course!;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final total = _total;
    final percent = total == 0 ? 0 : ((_completed.length / total) * 100).round();
    final lesson = _active;

    return Scaffold(
      appBar: AppBar(
        title: Text(course.title, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: 'Ask the AI tutor',
            onPressed: lesson == null ? null : _openTutor,
            icon: const Icon(Icons.smart_toy_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: MuxLessonPlayer(
                    key: ValueKey(lesson?.id),
                    lessonId: lesson?.id,
                    title: lesson?.title,
                    thumbnailUrl: course.thumbnailUrl,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(999),
                        child: LinearProgressIndicator(value: percent / 100, minHeight: 6),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${_completed.length}/$total',
                      style: theme.textTheme.labelMedium?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                if (lesson != null) ...[
                  Text(lesson.title, style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 14),
                  SegmentedButton<_Tab>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(value: _Tab.overview, label: Text('Overview')),
                      ButtonSegment(value: _Tab.summary, label: Text('Summary')),
                      ButtonSegment(value: _Tab.quiz, label: Text('Quiz')),
                    ],
                    selected: {_tab},
                    onSelectionChanged: (s) => setState(() => _tab = s.first),
                  ),
                  const SizedBox(height: 16),
                  switch (_tab) {
                    _Tab.overview => _overview(course, lesson, theme),
                    _Tab.summary => _summary(lesson, theme),
                    _Tab.quiz => _quiz(lesson, theme),
                  },
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton.icon(
                          onPressed: _completed.contains(lesson.id) || _completing ? null : () => _complete(lesson),
                          icon: Icon(_completed.contains(lesson.id) ? Icons.check_rounded : Icons.check_circle_outline),
                          label: Text(_completed.contains(lesson.id) ? 'Completed' : 'Mark complete'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton.icon(
                        onPressed: _openTutor,
                        icon: const Icon(Icons.smart_toy_outlined),
                        label: const Text('Ask AI'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                ],
                Text('Course content', style: theme.textTheme.titleLarge),
                const SizedBox(height: 4),
                for (final section in course.curriculum) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 14, bottom: 8),
                    child: Text(
                      section.title,
                      style: theme.textTheme.labelLarge?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ),
                  Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      children: [
                        for (var i = 0; i < section.lessons.length; i++) ...[
                          if (i > 0) const Divider(indent: 16, endIndent: 16),
                          _LessonTile(
                            lesson: section.lessons[i],
                            selected: section.lessons[i].id == lesson?.id,
                            completed: _completed.contains(section.lessons[i].id),
                            onTap: () => _select(section.lessons[i]),
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

  Widget _overview(Course course, Lesson lesson, ThemeData theme) {
    final text = (lesson.description?.trim().isNotEmpty ?? false) ? lesson.description! : course.description;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: [
            if (lesson.durationSeconds > 0)
              Chip(
                avatar: const Icon(Icons.schedule_rounded, size: 16),
                label: Text('${(lesson.durationSeconds / 60).ceil()} min'),
                visualDensity: VisualDensity.compact,
              ),
            if (_completed.contains(lesson.id))
              const Chip(
                avatar: Icon(Icons.check_circle, size: 16, color: AppTheme.success),
                label: Text('Completed'),
                visualDensity: VisualDensity.compact,
              ),
          ],
        ),
        if (text != null && text.trim().isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            text,
            style: theme.textTheme.bodyLarge?.copyWith(height: 1.5, color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }

  Widget _summary(Lesson lesson, ThemeData theme) {
    return FutureBuilder<LessonExtras>(
      future: _extras,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()));
        }
        final saved = snap.data?.aiSummary;
        if (saved != null) return _SummaryCard(text: saved, label: 'Lesson summary');

        // No instructor summary yet: let the learner ask the tutor for one.
        if (_tutorSummary == null) {
          return _Panel(
            icon: Icons.auto_awesome_rounded,
            title: 'No summary for this lesson yet',
            body: 'The AI tutor can write a quick one for you.',
            action: FilledButton.tonal(
              onPressed: () => setState(() {
                _tutorSummary = _ai.askTutor(
                  'Summarize this lesson in 4 to 6 short bullet points.',
                  lessonId: lesson.id,
                );
              }),
              child: const Text('Summarize with AI'),
            ),
          );
        }
        return FutureBuilder<String>(
          future: _tutorSummary,
          builder: (context, s) {
            if (s.connectionState == ConnectionState.waiting) {
              return const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            if (s.hasError) {
              return _Panel(
                icon: Icons.error_outline_rounded,
                title: 'The tutor couldn’t summarize this lesson',
                body: '${s.error}',
                action: FilledButton.tonal(
                  onPressed: () => setState(() => _tutorSummary = null),
                  child: const Text('Try again'),
                ),
              );
            }
            return _SummaryCard(text: s.data ?? '', label: 'Written by the AI tutor');
          },
        );
      },
    );
  }

  Widget _quiz(Lesson lesson, ThemeData theme) {
    return FutureBuilder<LessonExtras>(
      future: _extras,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator()));
        }
        final quiz = snap.data?.quiz ?? const <QuizQuestion>[];
        if (quiz.isEmpty) {
          return _Panel(
            icon: Icons.quiz_outlined,
            title: 'No quiz for this lesson yet',
            body: 'Your instructor hasn’t added one. You can still ask the AI tutor to test you.',
            action: FilledButton.tonal(onPressed: _openTutor, child: const Text('Ask the tutor')),
          );
        }
        return _Panel(
          icon: Icons.quiz_rounded,
          title: '${quiz.length} question${quiz.length == 1 ? '' : 's'}',
          body: 'Check what you remember from this lesson. Answers are explained as you go.',
          action: FilledButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => QuizScreen(lessonTitle: lesson.title, questions: quiz)),
            ),
            child: const Text('Start quiz'),
          ),
        );
      },
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.text, required this.label});
  final String text;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.auto_awesome_rounded, size: 18, color: theme.colorScheme.onPrimaryContainer),
              const SizedBox(width: 8),
              Text(label, style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.onPrimaryContainer)),
            ],
          ),
          const SizedBox(height: 10),
          SelectableText(text, style: theme.textTheme.bodyLarge?.copyWith(height: 1.5)),
        ],
      ),
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.icon, required this.title, required this.body, this.action});
  final IconData icon;
  final String title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(height: 10),
            Text(title, style: theme.textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(body, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            if (action != null) ...[const SizedBox(height: 14), action!],
          ],
        ),
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
    final minutes = lesson.durationSeconds > 0 ? '${(lesson.durationSeconds / 60).ceil()} min' : null;

    return ListTile(
      selected: selected,
      selectedTileColor: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
      onTap: onTap,
      leading: Icon(
        completed ? Icons.check_circle : (selected ? Icons.play_circle_fill : Icons.play_circle_outline),
        color: completed
            ? AppTheme.success
            : selected
                ? theme.colorScheme.primary
                : theme.colorScheme.onSurfaceVariant,
      ),
      title: Text(lesson.title, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: minutes != null ? Text(minutes) : null,
    );
  }
}
