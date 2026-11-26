import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/course_card.dart';
import '../widgets/empty_state.dart';
import 'course_detail_screen.dart';

/// Public instructor profile: header, stats, bio and their courses.
class InstructorScreen extends StatefulWidget {
  const InstructorScreen({super.key, required this.instructorId});
  final String instructorId;

  @override
  State<InstructorScreen> createState() => _InstructorScreenState();
}

class _InstructorScreenState extends State<InstructorScreen> {
  final _courses = CourseService();
  late Future<InstructorProfile> _future =
      _courses.instructor(widget.instructorId);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(),
      body: FutureBuilder<InstructorProfile>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || snap.data == null) {
            return EmptyState(
              icon: Icons.person_off_outlined,
              title: 'Couldn’t load this profile',
              subtitle: 'Check your connection and try again.',
              action: FilledButton(
                onPressed: () => setState(
                    () => _future = _courses.instructor(widget.instructorId)),
                child: const Text('Try again'),
              ),
            );
          }
          final p = snap.data!;
          final first = p.name.split(' ').first;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                    gradient: AppTheme.heroGradient,
                    borderRadius: BorderRadius.circular(28)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 44,
                      backgroundColor: AppTheme.marigold,
                      foregroundColor: AppTheme.navy,
                      backgroundImage: p.avatarUrl != null
                          ? CachedNetworkImageProvider(p.avatarUrl!)
                          : null,
                      child: p.avatarUrl == null
                          ? Text(
                              p.name.isEmpty ? '?' : p.name[0].toUpperCase(),
                              style: AppTheme.display(const TextStyle(
                                  fontSize: 40, fontWeight: FontWeight.w600)),
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text('Instructor',
                        style: theme.textTheme.labelLarge
                            ?.copyWith(color: AppTheme.marigold)),
                    Text(p.name,
                        style: AppTheme.display(theme.textTheme.headlineMedium
                            ?.copyWith(color: Colors.white))),
                    if (p.headline != null && p.headline!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(p.headline!,
                          style: theme.textTheme.bodyLarge
                              ?.copyWith(color: Colors.white70)),
                    ],
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        _Stat(
                            value: '${p.courseCount}',
                            label: p.courseCount == 1 ? 'Course' : 'Courses'),
                        _Stat(
                            value: NumberFormat.compact().format(p.students),
                            label: 'Learners'),
                        _Stat(
                          value: p.reviews > 0
                              ? p.rating.toStringAsFixed(1)
                              : 'New',
                          label: p.reviews > 0
                              ? 'Rating (${p.reviews})'
                              : 'No ratings yet',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text('About $first', style: theme.textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(
                (p.bio != null && p.bio!.trim().isNotEmpty)
                    ? p.bio!
                    : '$first hasn’t written a bio yet.',
                style: theme.textTheme.bodyLarge?.copyWith(
                    height: 1.5, color: theme.colorScheme.onSurfaceVariant),
              ),
              if (p.joinedAt != null) ...[
                const SizedBox(height: 8),
                Text(
                  'Teaching on Learnova since ${DateFormat.yMMMM().format(p.joinedAt!.toLocal())}',
                  style: theme.textTheme.bodySmall
                      ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ],
              const SizedBox(height: 24),
              Text('Courses by $first', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              if (p.courses.isEmpty)
                Text('No published courses yet.',
                    style: theme.textTheme.bodyMedium)
              else
                for (final c in p.courses)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: SizedBox(
                      height: 290,
                      child: CourseCard(
                        course: c,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) =>
                                  CourseDetailScreen(courseSlug: c.slug)),
                        ),
                      ),
                    ),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value,
              style: AppTheme.display(theme.textTheme.headlineSmall
                  ?.copyWith(color: Colors.white))),
          Text(label,
              style:
                  theme.textTheme.bodySmall?.copyWith(color: Colors.white60)),
        ],
      ),
    );
  }
}
