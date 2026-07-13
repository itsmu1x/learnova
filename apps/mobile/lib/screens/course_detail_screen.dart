import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/stat_chip.dart';
import 'learn_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  const CourseDetailScreen({super.key, required this.courseSlug});
  final String courseSlug;

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen> with WidgetsBindingObserver {
  final _courses = CourseService();
  final _learning = LearningService();
  Course? _course;
  EnrollmentStatus? _status;
  bool _loading = true;
  bool _enrolling = false;
  String? _error;
  String? _pendingCheckoutCourseId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _pendingCheckoutCourseId != null) {
      _refreshAfterCheckout(_pendingCheckoutCourseId!);
    }
  }

  Future<void> _refreshAfterCheckout(String courseId) async {
    try {
      // Webhook can lag a moment behind the browser redirect.
      for (var i = 0; i < 6; i++) {
        final status = await _learning.enrollmentStatus(courseId);
        if (!mounted) return;
        if (status.enrolled) {
          setState(() {
            _status = status;
            _pendingCheckoutCourseId = null;
          });
          _openLearn(courseId, purchaseSuccess: true);
          return;
        }
        await Future<void>.delayed(const Duration(milliseconds: 800));
      }
    } catch (_) {
      /* stay on detail */
    }
  }

  Future<void> _load() async {
    try {
      final c = await _courses.bySlug(widget.courseSlug);
      EnrollmentStatus? status;
      try {
        status = await _learning.enrollmentStatus(c.id);
      } catch (_) {
        status = null;
      }
      if (!mounted) return;
      setState(() {
        _course = c;
        _status = status;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _openLearn(String courseId, {bool purchaseSuccess = false}) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => LearnScreen(courseId: courseId, purchaseSuccess: purchaseSuccess),
      ),
    );
  }

  Future<void> _enroll() async {
    final course = _course!;
    if (_status?.enrolled == true) {
      _openLearn(course.id);
      return;
    }

    if (course.isPro) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Subscribe to Learnova Pro on the web to unlock this course.')),
      );
      return;
    }

    setState(() => _enrolling = true);
    try {
      if (course.isFree) {
        await _learning.enroll(course.id);
        if (!mounted) return;
        _openLearn(course.id);
        return;
      }

      final checkout = await _learning.checkoutCourse(course.id);
      final url = checkout['url'] as String?;
      if (url != null && url.isNotEmpty) {
        // Deep-link success_url (learnova://…) returns here; Custom Tabs closes cleanly.
        _pendingCheckoutCourseId = course.id;
        final uri = Uri.parse(url);
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.inAppBrowserView,
        );
        if (!launched) {
          final fallback = await launchUrl(uri, mode: LaunchMode.externalApplication);
          if (!fallback && mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Could not open Stripe checkout.')),
            );
          }
        }
        return;
      }

      // Dev fallback when Stripe isn’t configured — API may enroll immediately.
      if (!mounted) return;
      _openLearn(course.id, purchaseSuccess: true);
    } catch (e) {
      final message = e.toString();
      if (message.contains('Already enrolled') || message.contains('CONFLICT')) {
        if (mounted) _openLearn(course.id);
        return;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _enrolling = false);
    }
  }

  String get _ctaLabel {
    final course = _course!;
    final status = _status;
    if (status?.enrolled == true) {
      if (status!.completed) return 'Visit course';
      if (status.progressPercent > 0) return 'Continue learning';
      return 'Go to course';
    }
    if (course.isFree) return 'Enroll for free';
    if (course.isPro) return 'Get with Pro';
    return 'Buy now';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_course == null) {
      return Scaffold(appBar: AppBar(), body: Center(child: Text(_error ?? 'Not found')));
    }
    final course = _course!;
    final theme = Theme.of(context);
    final enrolled = _status?.enrolled == true;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                course.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, shadows: [
                  Shadow(color: Colors.black45, blurRadius: 8),
                ]),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  course.thumbnailUrl != null
                      ? CachedNetworkImage(imageUrl: course.thumbnailUrl!, fit: BoxFit.cover)
                      : Container(decoration: const BoxDecoration(gradient: AppTheme.heroGradient)),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (course.subtitle != null)
                    Text(
                      course.subtitle!,
                      style: theme.textTheme.bodyLarge?.copyWith(color: theme.hintColor),
                    ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatChip(icon: Icons.star_rounded, label: course.averageRating.toStringAsFixed(1), color: AppTheme.warning),
                      StatChip(icon: Icons.people_outline, label: '${course.enrollmentCount} students'),
                      StatChip(icon: Icons.play_lesson_outlined, label: '${course.lessonCount} lessons'),
                      StatChip(icon: Icons.school_outlined, label: course.level),
                      if (enrolled)
                        const StatChip(icon: Icons.check_circle, label: 'Owned', color: AppTheme.success),
                    ],
                  ),
                  if (course.instructor != null) ...[
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: theme.colorScheme.primaryContainer,
                          child: Text(course.instructor!.name[0].toUpperCase()),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Instructor', style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor)),
                            Text(course.instructor!.name, style: theme.textTheme.titleSmall),
                          ],
                        ),
                      ],
                    ),
                  ],
                  if (course.outcomes.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    Text("What you'll learn", style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    ...course.outcomes.map(
                      (o) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle_rounded, size: 18, color: AppTheme.success),
                            const SizedBox(width: 10),
                            Expanded(child: Text(o)),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 28),
                  Text('Course content', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 12),
                  ...course.curriculum.map(
                    (section) => _CurriculumSection(
                      section: section,
                      theme: theme,
                    ),
                  ),
                  if (course.description != null) ...[
                    const SizedBox(height: 20),
                    Text('Description', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(course.description!, style: theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
                  ],
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border(top: BorderSide(color: theme.dividerColor.withOpacity(0.3))),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4)),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    enrolled
                        ? '${_status!.progressPercent}% done'
                        : course.isPro
                            ? 'Pro'
                            : course.priceLabel,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: enrolled || course.isFree ? AppTheme.success : null,
                    ),
                  ),
                  Text(
                    enrolled
                        ? 'You have access'
                        : course.isFree
                            ? 'Free forever'
                            : course.isPro
                                ? 'Included with Pro'
                                : 'One-time purchase',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: FilledButton(
                  onPressed: _enrolling ? null : _enroll,
                  child: Text(_enrolling ? 'Please wait…' : _ctaLabel),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CurriculumSection extends StatefulWidget {
  const _CurriculumSection({required this.section, required this.theme});

  final CurriculumSection section;
  final ThemeData theme;

  @override
  State<_CurriculumSection> createState() => _CurriculumSectionState();
}

class _CurriculumSectionState extends State<_CurriculumSection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final scheme = widget.theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: scheme.surface,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: scheme.outlineVariant.withOpacity(0.5)),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.section.title,
                            style: widget.theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${widget.section.lessons.length} lessons',
                            style: widget.theme.textTheme.bodySmall?.copyWith(color: widget.theme.hintColor),
                          ),
                        ],
                      ),
                    ),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.expand_more, color: scheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ),
            AnimatedCrossFade(
              firstChild: const SizedBox.shrink(),
              secondChild: Column(
                children: [
                  for (var i = 0; i < widget.section.lessons.length; i++) ...[
                    if (i > 0)
                      Divider(
                        height: 1,
                        indent: 16,
                        endIndent: 16,
                        color: scheme.outlineVariant.withOpacity(0.35),
                      ),
                    _LessonRow(lesson: widget.section.lessons[i], theme: widget.theme),
                  ],
                ],
              ),
              crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
              duration: const Duration(milliseconds: 200),
              sizeCurve: Curves.easeInOut,
            ),
          ],
        ),
      ),
    );
  }
}

class _LessonRow extends StatelessWidget {
  const _LessonRow({required this.lesson, required this.theme});

  final Lesson lesson;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Icon(
            lesson.isPreview ? Icons.play_circle_filled : Icons.play_circle_outline,
            size: 22,
            color: lesson.isPreview ? theme.colorScheme.primary : theme.hintColor,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              lesson.title,
              style: theme.textTheme.bodyMedium,
            ),
          ),
          if (lesson.isPreview)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Preview',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          else if (lesson.durationSeconds > 0)
            Text(
              '${lesson.durationSeconds ~/ 60}m',
              style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
            ),
        ],
      ),
    );
  }
}
