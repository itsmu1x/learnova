import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/config.dart';
import 'core/deep_links.dart';
import 'core/theme.dart';
import 'screens/auth_gate.dart';
import 'state/auth_state.dart';
import 'state/theme_state.dart';

void main() {
  // Release builds block plain http, so the LAN default would silently fail to connect.
  if (kReleaseMode && !AppConfig.apiBaseUrl.startsWith('https://')) {
    throw StateError('Release builds need --dart-define=API_BASE_URL=https://<your-api>/api/v1');
  }
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LearnovaApp());
}

class LearnovaApp extends StatefulWidget {
  const LearnovaApp({super.key});

  @override
  State<LearnovaApp> createState() => _LearnovaAppState();
}

class _LearnovaAppState extends State<LearnovaApp> {
  @override
  void initState() {
    super.initState();
    DeepLinkHandler.start();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthState()..bootstrap()),
        ChangeNotifierProvider(create: (_) => ThemeState()..load()),
      ],
      child: Consumer<ThemeState>(
        builder: (context, themeState, _) => MaterialApp(
          title: 'Learnova',
          navigatorKey: appNavigatorKey,
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: themeState.mode,
          home: const AuthGate(),
        ),
      ),
    );
  }
}
