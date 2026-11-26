import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/course_card.dart';
import '../widgets/pro_sheet.dart';
import '../widgets/mux_lesson_player.dart';
import '../widgets/stat_chip.dart';
import 'instructor_screen.dart';
import 'learn_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  const CourseDetailScreen({super.key, required this.courseSlug});
  final String courseSlug;

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen>
    with WidgetsBindingObserver {
  final _courses = CourseService();
  final _learning = LearningService();
  Course? _course;
  EnrollmentStatus? _status;
  bool _loading = true;
  bool _enrolling = false;
  String? _error;
  String? _pendingCheckoutCourseId;
  Future<List<Review>>? _reviews;

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
    if (state == AppLifecycleState.resumed &&
        _pendingCheckoutCourseId != null) {
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
        _reviews = _courses.reviews(c.id);
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
        builder: (_) =>
            LearnScreen(courseId: courseId, purchaseSuccess: purchaseSuccess),
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
      await showProSheet(context);
      // They may have subscribed on the web meanwhile.
      final status = await _learning
          .enrollmentStatus(course.id)
          .catchError((_) => _status!);
      if (mounted) setState(() => _status = status);
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
          final fallback =
              await launchUrl(uri, mode: LaunchMode.externalApplication);
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
      if (message.contains('Already enrolled') ||
          message.contains('CONFLICT')) {
        if (mounted) _openLearn(course.id);
        return;
      }
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
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
      return Scaffold(
          appBar: AppBar(), body: Center(child: Text(_error ?? 'Not found')));
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
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    shadows: [
                      Shadow(color: Colors.black45, blurRadius: 8),
                    ]),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  course.thumbnailUrl != null
                      ? CachedNetworkImage(
                          imageUrl: course.thumbnailUrl!, fit: BoxFit.cover)
                      : Container(
                          decoration: const BoxDecoration(
                              gradient: AppTheme.heroGradient)),
                  if (course.isPro)
                    const Positioned(top: 100, left: 16, child: ProBadge()),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppTheme.navy.withValues(alpha: 0.85)
                        ],
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
                      style: theme.textTheme.bodyLarge
                          ?.copyWith(color: theme.hintColor),
                    ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      StatChip(
                          icon: Icons.star_rounded,
                          label: course.averageRating.toStringAsFixed(1),
                          color: AppTheme.marigoldDeep),
                      StatChip(
                          icon: Icons.people_outline,
                          label: '${course.enrollmentCount} students'),
                      StatChip(
                          icon: Icons.play_lesson_outlined,
                          label: '${course.lessonCount} lessons'),
                      StatChip(
                          icon: Icons.school_outlined,
                          label: CourseCard.levelLabel(course.level)),
                      if (enrolled)
                        const StatChip(
                            icon: Icons.check_circle,
                            label: 'Owned',
                            color: AppTheme.success),
                    ],
                  ),
                  if (course.instructor != null) ...[
                    const SizedBox(height: 24),
                    _InstructorCard(instructor: course.instructor!),
                  ],
                  if (course.outcomes.isNotEmpty) ...[
                    const SizedBox(height: 28),
                    Text("What you'll learn",
                        style: theme.textTheme.titleLarge),
                    const SizedBox(height: 12),
                    ...course.outcomes.map(
                      (o) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.check_circle_rounded,
                                size: 18, color: theme.colorScheme.primary),
                            const SizedBox(width: 10),
                            Expanded(child: Text(o)),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 28),
                  Text('Course content', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 12),
                  ...course.curriculum.map(
                    (section) => _CurriculumSection(
                      section: section,
                      theme: theme,
                    ),
                  ),
                  if (course.description != null) ...[
                    const SizedBox(height: 20),
                    Text('About this course',
                        style: theme.textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text(course.description!,
                        style:
                            theme.textTheme.bodyMedium?.copyWith(height: 1.5)),
                  ],
                  const SizedBox(height: 28),
                  _ReviewsSection(
                    course: course,
                    reviews: _reviews,
                    canReview: enrolled,
                    onWritten: () =>
                        setState(() => _reviews = _courses.reviews(course.id)),
                  ),
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
          border:
              Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
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
                      color:
                          enrolled || course.isFree ? AppTheme.success : null,
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
                    style: theme.textTheme.bodySmall
                        ?.copyWith(color: theme.hintColor),
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
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: scheme.outlineVariant),
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
                            style: widget.theme.textTheme.titleSmall
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${widget.section.lessons.length} lessons',
                            style: widget.theme.textTheme.bodySmall
                                ?.copyWith(color: widget.theme.hintColor),
                          ),
                        ],
                      ),
                    ),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.expand_more,
                          color: scheme.onSurfaceVariant),
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
                        color: scheme.outlineVariant,
                      ),
                    _LessonRow(
                        lesson: widget.section.lessons[i], theme: widget.theme),
                  ],
                ],
              ),
              crossFadeState: _expanded
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
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
    return InkWell(
      onTap: lesson.isPreview ? () => _playPreview(context) : null,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(
              lesson.isPreview
                  ? Icons.play_circle_filled
                  : Icons.lock_outline_rounded,
              size: 22,
              color: lesson.isPreview
                  ? theme.colorScheme.primary
                  : theme.hintColor,
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
                  'Watch free',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )
            else if (lesson.durationSeconds > 0)
              Text(
                '${(lesson.durationSeconds / 60).ceil()} min',
                style:
                    theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
              ),
          ],
        ),
      ),
    );
  }

  void _playPreview(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Free preview',
                  style: Theme.of(ctx)
                      .textTheme
                      .labelLarge
                      ?.copyWith(color: Theme.of(ctx).colorScheme.primary)),
              const SizedBox(height: 2),
              Text(lesson.title, style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child:
                    MuxLessonPlayer(lessonId: lesson.id, title: lesson.title),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InstructorCard extends StatelessWidget {
  const _InstructorCard({required this.instructor});
  final Instructor instructor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
              builder: (_) => InstructorScreen(instructorId: instructor.id)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: AppTheme.marigold,
                foregroundColor: AppTheme.navy,
                backgroundImage: instructor.avatarUrl != null
                    ? CachedNetworkImageProvider(instructor.avatarUrl!)
                    : null,
                child: instructor.avatarUrl == null
                    ? Text(
                        instructor.name.isEmpty
                            ? '?'
                            : instructor.name[0].toUpperCase(),
                        style: const TextStyle(
                            fontWeight: FontWeight.w800, fontSize: 20),
                      )
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your instructor',
                      style: theme.textTheme.labelMedium
                          ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                    Text(instructor.name, style: theme.textTheme.titleLarge),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded,
                  color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewsSection extends StatelessWidget {
  const _ReviewsSection({
    required this.course,
    required this.reviews,
    required this.canReview,
    required this.onWritten,
  });

  final Course course;
  final Future<List<Review>>? reviews;
  final bool canReview;
  final VoidCallback onWritten;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Reviews', style: theme.textTheme.titleLarge),
        const SizedBox(height: 10),
        Row(
          children: [
            Text(
              course.averageRating.toStringAsFixed(1),
              style: AppTheme.display(theme.textTheme.displaySmall),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stars(rating: course.averageRating.round()),
                Text(
                  '${course.ratingCount} rating${course.ratingCount == 1 ? '' : 's'}',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: scheme.onSurfaceVariant),
                ),
              ],
            ),
            const Spacer(),
            if (canReview)
              TextButton.icon(
                onPressed: () async {
                  final written = await showReviewSheet(context, course.id);
                  if (written == true) onWritten();
                },
                icon: const Icon(Icons.rate_review_outlined),
                label: const Text('Write a review'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        FutureBuilder<List<Review>>(
          future: reviews,
          builder: (context, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Center(child: CircularProgressIndicator()));
            }
            if (snap.hasError) {
              return Text(
                'Couldn’t load reviews right now.',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              );
            }
            final items = snap.data ?? [];
            if (items.isEmpty) {
              return Text(
                canReview
                    ? 'No reviews yet. Be the first to share what you thought.'
                    : 'No reviews yet.',
                style: theme.textTheme.bodyMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              );
            }
            return Column(
              children: [
                for (final r in items.take(10)) _ReviewTile(review: r)
              ],
            );
          },
        ),
      ],
    );
  }
}

class Stars extends StatelessWidget {
  const Stars({super.key, required this.rating, this.size = 18});
  final int rating;
  final double size;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 1; i <= 5; i++)
            Icon(
              i <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
              size: size,
              color: AppTheme.marigold,
            ),
        ],
      );
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});
  final Review review;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: scheme.primaryContainer,
                    child: Text(
                      review.userName.isEmpty
                          ? '?'
                          : review.userName[0].toUpperCase(),
                      style: TextStyle(
                          color: scheme.onPrimaryContainer,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Text(review.userName,
                          style: theme.textTheme.titleSmall)),
                  if (review.createdAt != null)
                    Text(
                      DateFormat.yMMMd().format(review.createdAt!.toLocal()),
                      style: theme.textTheme.bodySmall
                          ?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              Stars(rating: review.rating, size: 16),
              if (review.title != null && review.title!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(review.title!, style: theme.textTheme.titleSmall),
              ],
              if (review.body != null && review.body!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(review.body!,
                    style: theme.textTheme.bodyMedium?.copyWith(height: 1.45)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Star picker + optional title/body. Returns true once the review is saved.
Future<bool?> showReviewSheet(BuildContext context, String courseId) {
  final title = TextEditingController();
  final body = TextEditingController();
  var rating = 0;
  var saving = false;
  String? error;

  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setSheet) {
        final theme = Theme.of(ctx);
        Future<void> submit() async {
          if (rating == 0) {
            setSheet(() => error = 'Pick a star rating first.');
            return;
          }
          setSheet(() {
            saving = true;
            error = null;
          });
          try {
            await CourseService().writeReview(
              courseId,
              rating: rating,
              title: title.text.trim(),
              body: body.text.trim(),
            );
            if (ctx.mounted) Navigator.of(ctx).pop(true);
          } catch (e) {
            setSheet(() {
              saving = false;
              error = '$e';
            });
          }
        }

        return Padding(
          padding: EdgeInsets.fromLTRB(
              24, 0, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Rate this course', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  for (var i = 1; i <= 5; i++)
                    IconButton(
                      tooltip: '$i star${i == 1 ? '' : 's'}',
                      iconSize: 40,
                      onPressed: () => setSheet(() => rating = i),
                      icon: Icon(
                        i <= rating
                            ? Icons.star_rounded
                            : Icons.star_outline_rounded,
                        color: AppTheme.marigold,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: title,
                maxLength: 220,
                decoration: const InputDecoration(
                    labelText: 'Headline (optional)', counterText: ''),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: body,
                maxLength: 4000,
                minLines: 3,
                maxLines: 6,
                decoration: const InputDecoration(
                  labelText: 'What did you think? (optional)',
                  alignLabelWithHint: true,
                  counterText: '',
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 8),
                Text(error!, style: TextStyle(color: theme.colorScheme.error)),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: saving ? null : submit,
                child: Text(saving ? 'Posting…' : 'Post review'),
              ),
            ],
          ),
        );
      },
    ),
  ).whenComplete(() {
    title.dispose();
    body.dispose();
  });
}
