import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../services/services.dart';

/// Share / download / verify, used by the "certificate earned" screen and the certificates list.
class CertificateActions {
  static Future<void> share(BuildContext context, {required String courseTitle, required String code}) async {
    final box = context.findRenderObject() as RenderBox?;
    await SharePlus.instance.share(
      ShareParams(
        subject: 'My Learnova certificate',
        text: 'I just finished "$courseTitle" on Learnova. Verify my certificate: '
            '${CertificateService.verifyUrl(code)}',
        // iPad needs an anchor for the share popover.
        sharePositionOrigin: box == null ? null : box.localToGlobal(Offset.zero) & box.size,
      ),
    );
  }

  static Future<void> download(BuildContext context, String code) =>
      _open(context, CertificateService.downloadUrl(code), LaunchMode.externalApplication);

  /// Opens the web certificate page (view, verify, download).
  static Future<void> view(BuildContext context, String code) =>
      _open(context, CertificateService.verifyUrl(code), LaunchMode.inAppBrowserView);

  static Future<void> _open(BuildContext context, Uri uri, LaunchMode mode) async {
    final ok = await launchUrl(uri, mode: mode).catchError((_) => false);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Couldn’t open the link. Try again in a moment.')),
      );
    }
  }
}
