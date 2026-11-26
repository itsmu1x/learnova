import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import '../models/models.dart';
import '../services/services.dart';
import '../state/auth_state.dart';
import '../state/theme_state.dart';
import '../widgets/course_card.dart';
import '../widgets/pro_sheet.dart';
import 'certificates_screen.dart';
import 'purchases_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _Stats {
  _Stats(this.enrolled, this.completed, this.certificates);
  final int enrolled;
  final int completed;
  final int certificates;
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _loggingOut = false;
  final _billing = BillingService();
  late Future<Subscription?> _sub = _billing.subscription();
  late Future<_Stats> _stats = _loadStats();

  Future<_Stats> _loadStats() async {
    final results = await Future.wait([
      LearningService().myEnrollments(),
      CertificateService().mine(),
    ]);
    final enrollments = results[0] as List<Enrollment>;
    return _Stats(
      enrollments.length,
      enrollments.where((e) => e.progressPercent >= 100).length,
      (results[1] as List).length,
    );
  }

  Future<void> _refresh() async {
    setState(() {
      _sub = _billing.subscription();
      _stats = _loadStats();
    });
    await Future.wait([_sub.catchError((_) => null), _stats.catchError((_) => _Stats(0, 0, 0))]);
  }

  Future<void> _cancelPro(Subscription sub) async {
    final ends = sub.currentPeriodEnd;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Pro?'),
        content: Text(
          ends != null
              ? 'You won’t be charged again. Pro stays active until ${DateFormat.yMMMd().format(ends.toLocal())}.'
              : 'You won’t be charged again and Pro courses will lock.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Keep Pro')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Cancel Pro'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await _billing.cancelSubscription();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pro cancelled. You won’t be charged again.')));
      setState(() => _sub = _billing.subscription());
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Couldn’t cancel Pro: $e')));
    }
  }

  Future<void> _openSettings() async {
    final auth = context.read<AuthState>();
    final user = auth.user;
    if (user == null) return;

    final nameController = TextEditingController(text: user.name);
    final formKey = GlobalKey<FormState>();

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) {
        var saving = false;
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 8,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Settings', style: Theme.of(ctx).textTheme.titleLarge),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: nameController,
                      decoration: const InputDecoration(labelText: 'Display name'),
                      textCapitalization: TextCapitalization.words,
                      validator: (v) =>
                          (v == null || v.trim().length < 2) ? 'Enter at least 2 characters' : null,
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      initialValue: user.email,
                      readOnly: true,
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: saving
                          ? null
                          : () async {
                              if (!formKey.currentState!.validate()) return;
                              setSheetState(() => saving = true);
                              try {
                                await auth.updateProfile(name: nameController.text.trim());
                                if (ctx.mounted) Navigator.of(ctx).pop(true);
                              } catch (e) {
                                if (ctx.mounted) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(content: Text(e.toString())),
                                  );
                                }
                              } finally {
                                if (ctx.mounted) setSheetState(() => saving = false);
                              }
                            },
                      child: saving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save changes'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    nameController.dispose();
    if (saved == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated')),
      );
    }
  }

  Future<void> _openHelp() async {
    final email = context.read<AuthState>().user?.email ?? '';
    final ok = await launchUrl(
      Uri(
        scheme: 'mailto',
        path: 'support@learnova.dev',
        query: 'subject=${Uri.encodeComponent('Learnova help')}&body=${Uri.encodeComponent('Account: $email\n\n')}',
      ),
    ).catchError((_) => false);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No email app found. Write to support@learnova.dev.')),
      );
    }
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You will need to sign in again to access your courses.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            child: const Text('Log out'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _loggingOut = true);
    try {
      await context.read<AuthState>().logout();
    } finally {
      if (mounted) setState(() => _loggingOut = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user;
    final themeState = context.watch<ThemeState>();
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Text('Profile', style: theme.textTheme.headlineMedium),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(gradient: AppTheme.heroGradient, borderRadius: BorderRadius.circular(28)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: AppTheme.marigold,
                        foregroundColor: AppTheme.navy,
                        child: Text(
                          (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : '?',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.name ?? '',
                              style: AppTheme.display(theme.textTheme.titleLarge?.copyWith(color: Colors.white)),
                            ),
                            Text(
                              user?.email ?? '',
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white70),
                            ),
                          ],
                        ),
                      ),
                      FutureBuilder<Subscription?>(
                        future: _sub,
                        builder: (_, s) => s.data?.isActive == true ? const ProBadge() : const SizedBox.shrink(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  FutureBuilder<_Stats>(
                    future: _stats,
                    builder: (_, s) {
                      final st = s.data;
                      String v(int? n) => n == null ? '–' : '$n';
                      return Row(
                        children: [
                          _Stat(value: v(st?.enrolled), label: 'Courses'),
                          _Stat(value: v(st?.completed), label: 'Finished'),
                          _Stat(value: v(st?.certificates), label: 'Certificates'),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            FutureBuilder<Subscription?>(
              future: _sub,
              builder: (_, s) {
                if (s.connectionState == ConnectionState.waiting) return const SizedBox(height: 8);
                final sub = s.data;
                if (sub != null && sub.isActive) {
                  final ending = sub.cancelAt != null;
                  final date = sub.cancelAt ?? sub.currentPeriodEnd;
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Row(
                        children: [
                          const Icon(Icons.workspace_premium_rounded, color: AppTheme.marigold, size: 30),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Learnova Pro', style: theme.textTheme.titleMedium),
                                if (date != null)
                                  Text(
                                    '${ending ? 'Ends' : 'Renews'} ${DateFormat.yMMMd().format(date.toLocal())}',
                                    style: theme.textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
                                  ),
                              ],
                            ),
                          ),
                          if (!ending)
                            TextButton(onPressed: () => _cancelPro(sub), child: const Text('Cancel')),
                        ],
                      ),
                    ),
                  );
                }
                return Material(
                  color: AppTheme.marigold,
                  borderRadius: BorderRadius.circular(22),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(22),
                    onTap: () async {
                      await showProSheet(context);
                      if (mounted) setState(() => _sub = _billing.subscription());
                    },
                    child: const Padding(
                      padding: EdgeInsets.all(18),
                      child: Row(
                        children: [
                          Icon(Icons.workspace_premium_rounded, color: AppTheme.navy, size: 30),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Get Learnova Pro',
                                    style: TextStyle(color: AppTheme.navy, fontWeight: FontWeight.w800, fontSize: 16)),
                                Text('Every Pro course, one subscription',
                                    style: TextStyle(color: AppTheme.navy)),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right_rounded, color: AppTheme.navy),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  _Row(
                    icon: Icons.workspace_premium_outlined,
                    label: 'My certificates',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CertificatesScreen())),
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  _Row(
                    icon: Icons.receipt_long_outlined,
                    label: 'Purchase history',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PurchasesScreen())),
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  _Row(icon: Icons.person_outline_rounded, label: 'Edit profile', onTap: _openSettings),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Appearance', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: SegmentedButton<ThemeMode>(
                        showSelectedIcon: false,
                        segments: const [
                          ButtonSegment(value: ThemeMode.system, label: Text('System')),
                          ButtonSegment(value: ThemeMode.light, label: Text('Light')),
                          ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
                        ],
                        selected: {themeState.mode},
                        onSelectionChanged: (s) => themeState.set(s.first),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  _Row(icon: Icons.help_outline_rounded, label: 'Email support', onTap: _openHelp),
                  const Divider(indent: 16, endIndent: 16),
                  ListTile(
                    leading: Icon(Icons.logout_rounded, color: scheme.error),
                    title: Text('Log out', style: TextStyle(color: scheme.error, fontWeight: FontWeight.w600)),
                    trailing: _loggingOut
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: scheme.error),
                          )
                        : null,
                    enabled: !_loggingOut,
                    onTap: _confirmLogout,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: AppTheme.display(theme.textTheme.headlineSmall?.copyWith(color: Colors.white))),
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: Colors.white60)),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(icon),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      );
}
