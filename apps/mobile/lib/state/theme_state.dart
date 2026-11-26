import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The user's light/dark/system choice, remembered across launches.
class ThemeState extends ChangeNotifier {
  // Secure storage is already a dependency; this avoids adding shared_preferences for one value.
  static const _storage = FlutterSecureStorage();
  static const _key = 'learnova_theme_mode';

  ThemeMode _mode = ThemeMode.system;
  ThemeMode get mode => _mode;

  Future<void> load() async {
    final saved = await _storage.read(key: _key).catchError((_) => null);
    _mode = ThemeMode.values.firstWhere((m) => m.name == saved, orElse: () => ThemeMode.system);
    notifyListeners();
  }

  Future<void> set(ThemeMode mode) async {
    _mode = mode;
    notifyListeners();
    await _storage.write(key: _key, value: mode.name).catchError((_) {});
  }
}
