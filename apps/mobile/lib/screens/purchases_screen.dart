import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/models.dart';
import '../services/services.dart';
import '../widgets/empty_state.dart';

class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  final _billing = BillingService();
  late Future<List<Purchase>> _future = _billing.history();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Purchase history')),
      body: FutureBuilder<List<Purchase>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return EmptyState(
              icon: Icons.wifi_off_rounded,
              title: 'Couldn’t load your purchases',
              subtitle: 'Check your connection and try again.',
              action: FilledButton(
                onPressed: () => setState(() => _future = _billing.history()),
                child: const Text('Try again'),
              ),
            );
          }
          final items = snap.data ?? [];
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.receipt_long_outlined,
              title: 'No purchases yet',
              subtitle: 'Courses you buy and Pro payments will show up here.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final p = items[i];
              final failed = p.status == 'failed' || p.status == 'refunded';
              return Card(
                child: ListTile(
                  leading: const Icon(Icons.receipt_long_outlined),
                  title: Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                    [
                      if (p.createdAt != null) DateFormat.yMMMd().format(p.createdAt!.toLocal()),
                      if (p.status != 'succeeded') '${p.status[0].toUpperCase()}${p.status.substring(1)}',
                    ].join(', '),
                  ),
                  trailing: Text(
                    p.amountLabel,
                    style: theme.textTheme.titleMedium?.copyWith(
                      decoration: failed ? TextDecoration.lineThrough : null,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
