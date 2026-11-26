import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Consistent horizontal page padding below the status bar / notch.
class PageInsets extends StatelessWidget {
  const PageInsets({
    super.key,
    required this.child,
    this.top = 16,
    this.bottom = 0,
    this.horizontal = 16,
  });

  final Widget child;
  final double top;
  final double bottom;
  final double horizontal;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(horizontal, top, horizontal, bottom),
      child: child,
    );
  }
}

/// Navy hero panel with a cobalt glow, used at the top of tab screens.
class GradientBanner extends StatelessWidget {
  const GradientBanner({super.key, required this.child, this.top = 16, this.bottom = 0});

  final Widget child;
  final double top;
  final double bottom;

  @override
  Widget build(BuildContext context) {
    return PageInsets(
      top: top,
      bottom: bottom,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: AppTheme.heroGradient,
          borderRadius: BorderRadius.circular(28),
        ),
        child: child,
      ),
    );
  }
}
