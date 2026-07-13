import 'package:flutter/material.dart';

enum BrandLogoVariant { mark, full }

/// Learnova brand mark. Artwork lives in `assets/brand/` (copied from `dummy/`).
class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.variant = BrandLogoVariant.mark,
    this.height = 32,
  });

  final BrandLogoVariant variant;
  final double height;

  String get _asset => switch (variant) {
        BrandLogoVariant.mark => 'assets/brand/logo-mark.png',
        BrandLogoVariant.full => 'assets/brand/logo-full.png',
      };

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      _asset,
      height: height,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.high,
      semanticLabel: 'Learnova',
    );
  }
}
