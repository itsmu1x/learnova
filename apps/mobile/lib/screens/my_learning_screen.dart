import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/empty_state.dart';
import '../widgets/page_insets.dart';
import 'learn_screen.dart';

class MyLearningScreen extends StatefulWidget {
  const MyLearningScreen({super.key});

  @override
  State<MyLearningScreen> createState() => _MyLearningScreenState();
}

class _MyLearningScreenState extends State<MyLearningScreen> {
  final _service = LearningService();
  late Future<List<Enrollment>> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.myEnrollments();
  }

  Future<void> _refresh() async {
    setState(() => _future = _service.myEnrollments());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: PageInsets(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('My learning', style: theme.textTheme.headlineMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Pick up where you left off',
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.hintColor),
                    ),
                  ],
                ),
              ),
            ),
            FutureBuilder<List<Enrollment>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverFillRemaining(child: Center(child: CircularProgressIndicator()));
                }
                if (snapshot.hasError) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.wifi_off_rounded,
                      title: 'Couldn’t load your courses',
                      subtitle: 'Check your connection and try again.',
                      action: FilledButton(onPressed: _refresh, child: const Text('Try again')),
                    ),
                  );
                }
                final items = snapshot.data ?? [];
                if (items.isEmpty) {
                  return const SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.play_circle_outline_rounded,
                      title: 'No courses yet',
                      subtitle: 'Find something on the Explore tab. Free courses start right away.',
                    ),
                  );
                }

                final avgProgress = items.isEmpty
                    ? 0
                    : (items.map((e) => e.progressPercent).reduce((a, b) => a + b) / items.length).round();

                return SliverList(
                  delegate: SliverChildListDelegate([
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: AppTheme.heroGradient,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${items.length} course${items.length == 1 ? '' : 's'} in progress',
                                    style: AppTheme.display(theme.textTheme.titleLarge?.copyWith(color: Colors.white)),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('$avgProgress% average progress', style: const TextStyle(color: Colors.white70)),
                                ],
                              ),
                            ),
                            CircularProgressIndicator(
                              value: avgProgress / 100,
                              backgroundColor: Colors.white24,
                              color: AppTheme.marigold,
                              strokeWidth: 6,
                            ),
                          ],
                        ),
                      ),
                    ),
                    ...items.map((e) => Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                          child: Card(
                            clipBehavior: Clip.antiAlias,
                            child: InkWell(
                              onTap: () => Navigator.of(context).push(
                                MaterialPageRoute(builder: (_) => LearnScreen(courseId: e.courseId)),
                              ),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 100,
                                    height: 80,
                                    child: e.course.thumbnailUrl != null
                                        ? CachedNetworkImage(
                                            imageUrl: e.course.thumbnailUrl!,
                                            fit: BoxFit.cover,
                                          )
                                        : Container(
                                            decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
                                            alignment: Alignment.center,
                                            padding: const EdgeInsets.all(8),
                                            child: Text(
                                              e.course.title,
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                  ),
                                  Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            e.course.title,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                                          ),
                                          const SizedBox(height: 10),
                                          ClipRRect(
                                            borderRadius: BorderRadius.circular(4),
                                            child: LinearProgressIndicator(
                                              value: e.progressPercent / 100,
                                              minHeight: 5,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            '${e.progressPercent}% complete',
                                            style: theme.textTheme.bodySmall?.copyWith(
                                              color: theme.colorScheme.primary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.only(right: 12),
                                    child: Icon(Icons.play_circle_fill_rounded, color: theme.colorScheme.primary, size: 32),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )),
                    const SizedBox(height: 24),
                  ]),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
