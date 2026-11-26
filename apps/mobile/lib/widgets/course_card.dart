import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../models/models.dart';

/// Course thumbnail, or a navy placeholder with the title when there is no image.
class CourseThumb extends StatelessWidget {
  const CourseThumb({super.key, required this.course, this.titleSize = 14});

  final Course course;
  final double titleSize;

  @override
  Widget build(BuildContext context) {
    if (course.thumbnailUrl != null) {
      return CachedNetworkImage(
        imageUrl: course.thumbnailUrl!,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() => Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        alignment: Alignment.bottomLeft,
        padding: const EdgeInsets.all(12),
        child: Text(
          course.title,
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: AppTheme.display(
            TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: titleSize, height: 1.15),
          ),
        ),
      );
}

class ProBadge extends StatelessWidget {
  const ProBadge({super.key});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(color: AppTheme.marigold, borderRadius: BorderRadius.circular(999)),
        child: const Text(
          'Pro',
          style: TextStyle(color: AppTheme.navy, fontSize: 11, fontWeight: FontWeight.w800),
        ),
      );
}

/// Grid / shelf card: inset rounded thumbnail, level + category, title, rating, price.
class CourseCard extends StatelessWidget {
  const CourseCard({super.key, required this.course, required this.onTap});

  final Course course;
  final VoidCallback onTap;

  static String levelLabel(String level) =>
      level.isEmpty ? level : '${level[0].toUpperCase()}${level.substring(1)}';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: 16 / 10,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CourseThumb(course: course, titleSize: 13),
                      if (course.isPro) const Positioned(top: 8, left: 8, child: ProBadge()),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(4, 10, 4, 2),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        [levelLabel(course.level), if (course.categoryName != null) course.categoryName!].join(', '),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.labelSmall?.copyWith(color: scheme.onSurfaceVariant),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        course.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppTheme.display(theme.textTheme.titleSmall?.copyWith(height: 1.2)),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 16, color: AppTheme.marigold),
                          const SizedBox(width: 2),
                          Text(
                            course.averageRating.toStringAsFixed(1),
                            style: theme.textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const Spacer(),
                          Text(
                            course.isPro ? 'Pro' : course.priceLabel,
                            style: AppTheme.display(theme.textTheme.titleSmall),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The big "pick up where you left off" card on Home.
class ContinueHeroCard extends StatelessWidget {
  const ContinueHeroCard({super.key, required this.enrollment, required this.onTap});

  final Enrollment enrollment;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final course = enrollment.course;
    return Material(
      color: AppTheme.navy,
      borderRadius: BorderRadius.circular(28),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AspectRatio(
                aspectRatio: 16 / 8,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CourseThumb(course: course, titleSize: 18),
                      Center(
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                          child: const Icon(Icons.play_arrow_rounded, color: AppTheme.navy, size: 34),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 14, 8, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Continue learning',
                      style: theme.textTheme.labelLarge?.copyWith(color: AppTheme.marigold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      course.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTheme.display(theme.textTheme.titleLarge?.copyWith(color: Colors.white)),
                    ),
                    const SizedBox(height: 14),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: enrollment.progressPercent / 100,
                        minHeight: 6,
                        color: AppTheme.marigold,
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${enrollment.progressPercent}% complete',
                      style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
