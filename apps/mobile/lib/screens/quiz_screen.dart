import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../models/models.dart';

/// One question at a time; each answer is revealed with its explanation, then a score.
class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key, required this.lessonTitle, required this.questions});

  final String lessonTitle;
  final List<QuizQuestion> questions;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _index = 0;
  int? _picked;
  int _correct = 0;
  bool _done = false;

  QuizQuestion get _q => widget.questions[_index];

  void _pick(int i) {
    if (_picked != null) return;
    setState(() {
      _picked = i;
      if (i == _q.answerIndex) _correct++;
    });
  }

  void _next() {
    setState(() {
      if (_index + 1 < widget.questions.length) {
        _index++;
        _picked = null;
      } else {
        _done = true;
      }
    });
  }

  void _restart() => setState(() {
        _index = 0;
        _picked = null;
        _correct = 0;
        _done = false;
      });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = widget.questions.length;

    return Scaffold(
      appBar: AppBar(title: Text(widget.lessonTitle, overflow: TextOverflow.ellipsis)),
      body: SafeArea(
        child: _done ? _result(theme, total) : _question(theme, total),
      ),
    );
  }

  Widget _question(ThemeData theme, int total) {
    final scheme = theme.colorScheme;
    final q = _q;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        Row(
          children: [
            Text(
              'Question ${_index + 1} of $total',
              style: theme.textTheme.labelLarge?.copyWith(color: scheme.onSurfaceVariant),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(value: (_index + 1) / total, minHeight: 6),
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(q.question, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 20),
        for (var i = 0; i < q.options.length; i++) ...[
          _Option(
            text: q.options[i],
            state: _picked == null
                ? _OptionState.idle
                : i == q.answerIndex
                    ? _OptionState.correct
                    : i == _picked
                        ? _OptionState.wrong
                        : _OptionState.dimmed,
            onTap: () => _pick(i),
          ),
          const SizedBox(height: 10),
        ],
        if (_picked != null) ...[
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: scheme.surfaceContainer,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _picked == q.answerIndex ? 'Correct' : 'Not quite',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: _picked == q.answerIndex ? AppTheme.success : scheme.error,
                  ),
                ),
                if (q.explanation != null && q.explanation!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(q.explanation!, style: theme.textTheme.bodyMedium?.copyWith(height: 1.45)),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _next,
            child: Text(_index + 1 < total ? 'Next question' : 'See my score'),
          ),
        ],
      ],
    );
  }

  Widget _result(ThemeData theme, int total) {
    final passed = _correct / total >= 0.7;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: passed ? AppTheme.marigold : theme.colorScheme.surfaceContainer,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$_correct/$total',
                style: AppTheme.display(theme.textTheme.headlineLarge?.copyWith(
                  color: passed ? AppTheme.navy : theme.colorScheme.onSurface,
                )),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              passed ? 'Nicely done' : 'Worth another look',
              style: theme.textTheme.headlineSmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              passed
                  ? 'You remembered most of this lesson.'
                  : 'Rewatch the lesson or ask the AI tutor about the ones you missed.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: OutlinedButton(onPressed: _restart, child: const Text('Try again'))),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Done')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

enum _OptionState { idle, correct, wrong, dimmed }

class _Option extends StatelessWidget {
  const _Option({required this.text, required this.state, required this.onTap});
  final String text;
  final _OptionState state;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (Color border, Color fill, IconData? icon) = switch (state) {
      _OptionState.correct => (AppTheme.success, AppTheme.success.withValues(alpha: 0.1), Icons.check_circle_rounded),
      _OptionState.wrong => (scheme.error, scheme.error.withValues(alpha: 0.1), Icons.cancel_rounded),
      _OptionState.dimmed => (scheme.outlineVariant, scheme.surface, null),
      _OptionState.idle => (scheme.outlineVariant, scheme.surface, null),
    };
    return Material(
      color: fill,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: border, width: state == _OptionState.idle || state == _OptionState.dimmed ? 1 : 2),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: state == _OptionState.idle ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  text,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: state == _OptionState.dimmed ? scheme.onSurfaceVariant : null,
                      ),
                ),
              ),
              if (icon != null) Icon(icon, color: border),
            ],
          ),
        ),
      ),
    );
  }
}
