import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/services.dart';
import '../state/auth_state.dart';
import '../widgets/brand_logo.dart';
import '../widgets/course_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/section_header.dart';
import 'course_detail_screen.dart';
import 'explore_screen.dart';
import 'learn_screen.dart';

class _HomeData {
  _HomeData(this.resume, this.categories, this.popular, this.newest, this.topRated);
  final Enrollment? resume;
  final List<Category> categories;
  final List<Course> popular;
  final List<Course> newest;
  final List<Course> topRated;
}

/// Home tab: continue card, topics, and course shelves.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _courses = CourseService();
  final _learning = LearningService();
  late Future<_HomeData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_HomeData> _load() async {
    // Continue + categories are nice-to-have; the shelves are what the screen needs.
    final resume = _learning.continueLearning().then((l) => l.isEmpty ? null : l.first).catchError((_) => null);
    final cats = _courses.categories().catchError((_) => <Category>[]);
    final shelves = await Future.wait([
      _courses.browse(sort: 'popular', limit: 10),
      _courses.browse(sort: 'newest', limit: 10),
      _courses.browse(sort: 'rating', limit: 10),
    ]);
    return _HomeData(await resume, await cats, shelves[0], shelves[1], shelves[2]);
  }

  Future<void> _refresh() async {
    final next = _load();
    setState(() => _future = next);
    await next.catchError((_) => _HomeData(null, [], [], [], []));
  }

  void _openCourse(Course c) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => CourseDetailScreen(courseSlug: c.slug)));

  void _openExplore({String? category, bool focusSearch = false}) => Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ExploreScreen(initialCategory: category, autofocus: focusSearch, standalone: true),
        ),
      );

  String _greeting(String? name) {
    final hour = DateTime.now().hour;
    final time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    final first = name?.split(' ').first;
    return first != null && first.isNotEmpty ? '$time, $first' : time;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final name = context.watch<AuthState>().user?.name;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<_HomeData>(
          future: _future,
          builder: (context, snap) {
            final data = snap.data;
            return CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const BrandLogo(height: 28),
                            const SizedBox(width: 8),
                            Text('Learnova', style: theme.textTheme.titleLarge),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Text(_greeting(name), style: theme.textTheme.headlineMedium),
                        const SizedBox(height: 4),
                        Text(
                          'What do you want to learn today?',
                          style: theme.textTheme.bodyLarge?.copyWith(color: scheme.onSurfaceVariant),
                        ),
                        const SizedBox(height: 16),
                        Material(
                          color: scheme.surface,
                          shape: StadiumBorder(side: BorderSide(color: scheme.outlineVariant)),
                          child: InkWell(
                            customBorder: const StadiumBorder(),
                            onTap: () => _openExplore(focusSearch: true),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
                              child: Row(
                                children: [
                                  Icon(Icons.search_rounded, color: scheme.onSurfaceVariant),
                                  const SizedBox(width: 10),
                                  Text(
                                    'Search courses and topics',
                                    style: theme.textTheme.bodyLarge?.copyWith(color: scheme.onSurfaceVariant),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (snap.connectionState == ConnectionState.waiting && data == null)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (snap.hasError && data == null)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.wifi_off_rounded,
                      title: 'Couldn’t load courses',
                      subtitle: 'Check your connection and try again.',
                      action: FilledButton(onPressed: _refresh, child: const Text('Try again')),
                    ),
                  )
                else if (data != null) ...[
                  if (data.resume != null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                        child: ContinueHeroCard(
                          enrollment: data.resume!,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => LearnScreen(courseId: data.resume!.courseId)),
                          ),
                        ),
                      ),
                    ),
                  if (data.categories.isNotEmpty) ...[
                    const SliverToBoxAdapter(child: SectionHeader(title: 'Browse by topic')),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 44,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: data.categories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final c = data.categories[i];
                            return ActionChip(
                              label: Text(c.courseCount > 0 ? '${c.name}  ${c.courseCount}' : c.name),
                              onPressed: () => _openExplore(category: c.slug),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                  _Shelf(title: 'Popular right now', subtitle: 'What learners are taking this week', courses: data.popular, onTap: _openCourse),
                  _Shelf(title: 'Just published', subtitle: 'New from our instructors', courses: data.newest, onTap: _openCourse),
                  _Shelf(title: 'Highest rated', subtitle: 'Courses learners scored best', courses: data.topRated, onTap: _openCourse),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 28, 16, 32),
                      child: OutlinedButton.icon(
                        onPressed: _openExplore,
                        icon: const Icon(Icons.grid_view_rounded),
                        label: const Text('See all courses'),
                      ),
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Shelf extends StatelessWidget {
  const _Shelf({required this.title, required this.subtitle, required this.courses, required this.onTap});

  final String title;
  final String subtitle;
  final List<Course> courses;
  final ValueChanged<Course> onTap;

  @override
  Widget build(BuildContext context) {
    if (courses.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: title, subtitle: subtitle),
          SizedBox(
            height: 262,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: courses.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (_, i) => SizedBox(
                width: 232,
                child: CourseCard(course: courses[i], onTap: () => onTap(courses[i])),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
