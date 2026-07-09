import 'package:flutter/material.dart';

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

/// Rounded gradient hero banner used at the top of tab screens.
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
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4F46E5).withOpacity(0.22),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
