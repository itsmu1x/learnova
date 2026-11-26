import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import '../services/services.dart';

const _perks = [
  (Icons.lock_open_rounded, 'Every Pro course, included'),
  (Icons.bolt_rounded, 'Priority answers from the AI tutor'),
  (Icons.workspace_premium_outlined, 'Certificates for every course you finish'),
];

/// Explains Pro and sends the learner to the web to subscribe.
// Subscribing happens on the web, not through in-app purchase, so the app makes no store payments.
Future<void> showProSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) {
      final theme = Theme.of(ctx);
      return SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: AppTheme.marigold, borderRadius: BorderRadius.circular(999)),
                  child: const Text('Pro', style: TextStyle(color: AppTheme.navy, fontWeight: FontWeight.w800)),
                ),
              ),
              const SizedBox(height: 14),
              Text('This course is part of Learnova Pro', style: theme.textTheme.headlineSmall),
              const SizedBox(height: 6),
              Text(
                '\$19 a month. Cancel any time from your profile.',
                style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 20),
              for (final (icon, text) in _perks)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Icon(icon, color: theme.colorScheme.primary),
                      const SizedBox(width: 12),
                      Expanded(child: Text(text, style: theme.textTheme.bodyLarge)),
                    ],
                  ),
                ),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () async {
                  Navigator.of(ctx).pop();
                  await launchUrl(BillingService.pricingUrl(), mode: LaunchMode.externalApplication);
                },
                child: const Text('Subscribe on learnova web'),
              ),
              const SizedBox(height: 8),
              Text(
                'After subscribing, come back here and the course will unlock.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
            ],
          ),
        ),
      );
    },
  );
}
