import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../widgets/certificate_actions.dart';
import '../widgets/empty_state.dart';

/// The learner's certificates, opened from Profile.
class CertificatesScreen extends StatefulWidget {
  const CertificatesScreen({super.key});

  @override
  State<CertificatesScreen> createState() => _CertificatesScreenState();
}

class _CertificatesScreenState extends State<CertificatesScreen> {
  final _service = CertificateService();
  late Future<List<Certificate>> _future = _service.mine();

  void _reload() => setState(() => _future = _service.mine());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Certificates')),
      body: FutureBuilder<List<Certificate>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return EmptyState(
              icon: Icons.wifi_off_rounded,
              title: 'Couldn’t load your certificates',
              subtitle: 'Check your connection and try again.',
              action: FilledButton(onPressed: _reload, child: const Text('Try again')),
            );
          }
          final items = snapshot.data ?? [];
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.workspace_premium_outlined,
              title: 'No certificates yet',
              subtitle: 'Finish every lesson in a course to earn one.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _CertificateCard(certificate: items[i]),
            ),
          );
        },
      ),
    );
  }
}

class _CertificateCard extends StatelessWidget {
  const _CertificateCard({required this.certificate});
  final Certificate certificate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final issued = DateTime.tryParse(certificate.issuedAt);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(gradient: AppTheme.heroGradient, borderRadius: BorderRadius.circular(24)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(color: AppTheme.marigold, shape: BoxShape.circle),
                child: const Icon(Icons.workspace_premium_rounded, color: AppTheme.navy),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  issued != null ? 'Issued ${DateFormat.yMMMd().format(issued)}' : 'Certificate of completion',
                  style: theme.textTheme.labelLarge?.copyWith(color: Colors.white70),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            certificate.courseTitle,
            style: AppTheme.display(theme.textTheme.titleLarge?.copyWith(color: Colors.white)),
          ),
          const SizedBox(height: 4),
          Text('ID ${certificate.code}', style: theme.textTheme.bodySmall?.copyWith(color: Colors.white60)),
          const SizedBox(height: 16),
          Row(
            children: [
              Builder(
                builder: (btnContext) => _Action(
                  icon: Icons.ios_share_rounded,
                  label: 'Share',
                  onTap: () => CertificateActions.share(
                    btnContext,
                    courseTitle: certificate.courseTitle,
                    code: certificate.code,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _Action(
                icon: Icons.download_rounded,
                label: 'PDF',
                onTap: () => CertificateActions.download(context, certificate.code),
              ),
              const SizedBox(width: 8),
              _Action(
                icon: Icons.open_in_new_rounded,
                label: 'View',
                onTap: () => CertificateActions.view(context, certificate.code),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.white.withValues(alpha: 0.1),
        shape: const StadiumBorder(),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: Colors.white),
                const SizedBox(width: 6),
                Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
