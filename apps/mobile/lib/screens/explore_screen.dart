import 'dart:async';

import 'package:flutter/material.dart';

import '../models/models.dart';
import '../services/services.dart';
import '../widgets/course_card.dart';
import '../widgets/empty_state.dart';
import 'course_detail_screen.dart';

const _sorts = {
  'popular': 'Popular',
  'newest': 'Newest',
  'rating': 'Top rated',
  'price_asc': 'Price: low to high',
};

/// Full catalog: search, topic filter and sort over a course grid.
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key, this.initialCategory, this.autofocus = false, this.standalone = false});

  final String? initialCategory;
  final bool autofocus;

  /// True when pushed as its own route (shows a back button) rather than shown as a tab.
  final bool standalone;

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final _service = CourseService();
  final _searchCtrl = TextEditingController();
  late Future<List<Course>> _future;
  List<Category> _categories = [];
  String? _category;
  String _sort = 'popular';
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _category = widget.initialCategory;
    _future = _fetch();
    _service.categories().then((c) {
      if (mounted) setState(() => _categories = c);
    }).catchError((_) {});
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<List<Course>> _fetch() =>
      _service.browse(search: _searchCtrl.text.trim(), sort: _sort, category: _category);

  void _reload() => setState(() => _future = _fetch());

  void _onSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), _reload);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      appBar: widget.standalone ? AppBar(title: const Text('Explore')) : null,
      body: RefreshIndicator(
        onRefresh: () async {
          _reload();
          await _future.catchError((_) => <Course>[]);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, widget.standalone ? 0 : 16, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!widget.standalone) ...[
                      Text('Explore', style: theme.textTheme.headlineMedium),
                      const SizedBox(height: 16),
                    ],
                    TextField(
                      controller: _searchCtrl,
                      autofocus: widget.autofocus,
                      onChanged: _onSearch,
                      textInputAction: TextInputAction.search,
                      decoration: InputDecoration(
                        hintText: 'Search courses and topics',
                        prefixIcon: const Icon(Icons.search_rounded),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(999),
                          borderSide: BorderSide(color: scheme.outlineVariant),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(999),
                          borderSide: BorderSide(color: scheme.outlineVariant),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 60,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  children: [
                    _SortChip(
                      value: _sort,
                      onChanged: (v) {
                        _sort = v;
                        _reload();
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('All topics'),
                      selected: _category == null,
                      onSelected: (_) {
                        _category = null;
                        _reload();
                      },
                    ),
                    for (final c in _categories) ...[
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: Text(c.name),
                        selected: _category == c.slug,
                        onSelected: (_) {
                          _category = c.slug;
                          _reload();
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ),
            FutureBuilder<List<Course>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                if (snapshot.hasError) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.wifi_off_rounded,
                      title: 'Couldn’t load courses',
                      subtitle: 'Check your connection and try again.',
                      action: FilledButton(onPressed: _reload, child: const Text('Try again')),
                    ),
                  );
                }
                final courses = snapshot.data ?? [];
                if (courses.isEmpty) {
                  return const SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.search_off_rounded,
                      title: 'No courses match',
                      subtitle: 'Try a shorter search or pick another topic.',
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 260,
                      mainAxisExtent: 262,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => CourseCard(
                        course: courses[i],
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => CourseDetailScreen(courseSlug: courses[i].slug)),
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

class _SortChip extends StatelessWidget {
  const _SortChip({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      onSelected: onChanged,
      itemBuilder: (_) => [
        for (final e in _sorts.entries) CheckedPopupMenuItem(value: e.key, checked: e.key == value, child: Text(e.value)),
      ],
      child: Chip(
        avatar: const Icon(Icons.swap_vert_rounded, size: 18),
        label: Text(_sorts[value]!),
      ),
    );
  }
}
