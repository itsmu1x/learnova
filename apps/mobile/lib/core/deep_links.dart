import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import '../screens/learn_screen.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

/// Handles `learnova://` returns from Stripe Checkout (and cancel).
class DeepLinkHandler {
  DeepLinkHandler._();

  static final _appLinks = AppLinks();
  static bool _started = false;

  static Future<void> start() async {
    if (_started) return;
    _started = true;

    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        // Defer until the first frame so the navigator exists.
        WidgetsBinding.instance.addPostFrameCallback((_) => _handle(initial));
      }
    } catch (_) {
      /* ignore */
    }

    _appLinks.uriLinkStream.listen(_handle, onError: (_) {});
  }

  static void _handle(Uri uri) {
    if (uri.scheme != 'learnova') return;
    final nav = appNavigatorKey.currentState;
    if (nav == null) return;

    if (uri.host == 'learn') {
      final courseId = uri.pathSegments.isNotEmpty ? uri.pathSegments.first : null;
      if (courseId == null || courseId.isEmpty) return;
      final purchased = uri.queryParameters['purchase'] == 'success';
      nav.push(
        MaterialPageRoute(
          builder: (_) => LearnScreen(
            courseId: courseId,
            purchaseSuccess: purchased,
          ),
        ),
      );
      return;
    }

    if (uri.host == 'purchase' && uri.pathSegments.contains('cancelled')) {
      final ctx = appNavigatorKey.currentContext;
      if (ctx != null) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          const SnackBar(content: Text('Checkout cancelled — you can try again anytime.')),
        );
      }
    }
  }
}
