import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../services/services.dart';
import '../state/auth_state.dart';
import '../widgets/course_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/page_insets.dart';
import '../widgets/section_header.dart';
import 'course_detail_screen.dart';
import 'learn_screen.dart';

/// Browse + search courses with personalized hero.
class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  final _service = CourseService();
  final _learning = LearningService();
  final _searchCtrl = TextEditingController();
  Future<List<Course>>? _coursesFuture;
  Future<List<Enrollment>>? _enrollmentsFuture;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    setState(() {
      _coursesFuture = _service.browse();
      _enrollmentsFuture = _learning.myEnrollments();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearch(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      setState(() => _coursesFuture = _service.browse(search: value));
    });
  }

  String _greeting(String? name) {
    final hour = DateTime.now().hour;
    final time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return name != null && name.isNotEmpty ? '$time, $name' : time;
  }

  @override
  Widget build(BuildContext context) {
    final userName = context.watch<AuthState>().user?.name;
    final theme = Theme.of(context);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: GradientBanner(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting(userName),
                      style: theme.textTheme.titleLarge?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'What will you learn today?',
                      style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _searchCtrl,
                      onChanged: _onSearch,
                      style: const TextStyle(color: Colors.black87),
                      decoration: InputDecoration(
                        hintText: 'Search courses, topics, skills…',
                        prefixIcon: const Icon(Icons.search_rounded),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Continue learning
            FutureBuilder<List<Enrollment>>(
              future: _enrollmentsFuture,
              builder: (context, snap) {
                final active = (snap.data ?? []).where((e) => e.progressPercent < 100).toList();
                if (active.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                return SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SectionHeader(title: 'Continue learning'),
                      SizedBox(
                        height: 188,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          clipBehavior: Clip.none,
                          itemCount: active.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder: (context, i) => ContinueCourseCard(
                            enrollment: active[i],
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => LearnScreen(courseId: active[i].courseId),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            const SliverToBoxAdapter(child: SectionHeader(title: 'Popular courses')),

            FutureBuilder<List<Course>>(
              future: _coursesFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  );
                }
                if (snapshot.hasError) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: EmptyState(
                      icon: Icons.wifi_off_rounded,
                      title: 'Could not load courses',
                      subtitle: '${snapshot.error}',
                      action: FilledButton(onPressed: _reload, child: const Text('Retry')),
                      ),
                    ),
                  );
                }
                final courses = snapshot.data ?? [];
                if (courses.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: EmptyState(
                        icon: Icons.search_off_rounded,
                        title: 'No courses found',
                        subtitle: 'Try a different search term',
                      ),
                    ),
                  );
                }
                final tileWidth = (MediaQuery.sizeOf(context).width - 16 * 2 - 12) / 2;
                const textBlockHeight = 92.0;
                final tileAspectRatio = tileWidth / (tileWidth * 9 / 16 + textBlockHeight);

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: tileAspectRatio,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => CourseCard(
                        course: courses[i],
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => CourseDetailScreen(courseSlug: courses[i].slug),
                          ),
                        ),
                      ),
                      childCount: courses.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
