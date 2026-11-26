import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/certificate_actions.dart';

/// Full-screen moment shown when the last lesson of a course is completed.
class CertificateEarnedScreen extends StatefulWidget {
  const CertificateEarnedScreen({super.key, required this.courseTitle, required this.code});

  final String courseTitle;
  final String code;

  @override
  State<CertificateEarnedScreen> createState() => _CertificateEarnedScreenState();
}

class _CertificateEarnedScreenState extends State<CertificateEarnedScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _anim = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );

  @override
  void initState() {
    super.initState();
    // Skip the entrance when the system asks for reduced motion.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      MediaQuery.of(context).disableAnimations ? _anim.value = 1 : _anim.forward();
    });
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final badge = CurvedAnimation(parent: _anim, curve: Curves.elasticOut);
    final fade = CurvedAnimation(parent: _anim, curve: const Interval(0.35, 1, curve: Curves.easeOut));

    return Scaffold(
      backgroundColor: AppTheme.navy,
      appBar: AppBar(
        backgroundColor: AppTheme.navy,
        foregroundColor: Colors.white,
        leading: IconButton(
          tooltip: 'Close',
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Column(
              children: [
                const Spacer(),
                ScaleTransition(
                  scale: badge,
                  child: Container(
                    width: 148,
                    height: 148,
                    decoration: BoxDecoration(
                      color: AppTheme.marigold,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: AppTheme.marigold.withValues(alpha: 0.45), blurRadius: 48),
                      ],
                    ),
                    child: const Icon(Icons.workspace_premium_rounded, size: 84, color: AppTheme.navy),
                  ),
                ),
                const SizedBox(height: 32),
                FadeTransition(
                  opacity: fade,
                  child: Column(
                    children: [
                      Text(
                        'Certificate earned',
                        textAlign: TextAlign.center,
                        style: AppTheme.display(theme.textTheme.displaySmall?.copyWith(color: Colors.white)),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'You finished ${widget.courseTitle}.',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.titleMedium?.copyWith(color: Colors.white70, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          'Certificate ID ${widget.code}',
                          style: theme.textTheme.labelLarge?.copyWith(color: Colors.white70),
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                FadeTransition(
                  opacity: fade,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Builder(
                        builder: (btnContext) => FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppTheme.marigold,
                            foregroundColor: AppTheme.navy,
                          ),
                          onPressed: () => CertificateActions.share(
                            btnContext,
                            courseTitle: widget.courseTitle,
                            code: widget.code,
                          ),
                          icon: const Icon(Icons.ios_share_rounded),
                          label: const Text('Share certificate'),
                        ),
                      ),
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white38),
                        ),
                        onPressed: () => CertificateActions.download(context, widget.code),
                        icon: const Icon(Icons.download_rounded),
                        label: const Text('Download PDF'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
