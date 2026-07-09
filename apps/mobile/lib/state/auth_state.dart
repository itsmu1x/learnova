import 'package:flutter/foundation.dart';

import '../core/api_client.dart';
import '../models/models.dart';

/// Holds the authenticated user and drives login/register/logout flows.
class AuthState extends ChangeNotifier {
  final _api = ApiClient.instance;

  AppUser? _user;
  bool _loading = true;

  AppUser? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  Future<void> bootstrap() async {
    if (await _api.hasSession()) {
      await _loadMe();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> _loadMe() async {
    try {
      final data = await _api.get('/auth/me');
      _user = AppUser.fromJson(data as Map<String, dynamic>);
    } catch (_) {
      _user = null;
    }
  }

  Future<void> login(String email, String password) async {
    final data = await _api.post('/auth/login', body: {'email': email, 'password': password});
    await _handleAuthResult(data as Map<String, dynamic>);
  }

  Future<void> register(String name, String email, String password) async {
    final data = await _api.post('/auth/register',
        body: {'name': name, 'email': email, 'password': password});
    await _handleAuthResult(data as Map<String, dynamic>);
  }

  Future<void> _handleAuthResult(Map<String, dynamic> data) async {
    await _api.saveTokens(data['accessToken'] as String, data['refreshToken'] as String);
    _user = AppUser.fromJson(data['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  Future<void> updateProfile({required String name}) async {
    await _api.patch('/users/me', body: {'name': name});
    await _loadMe();
    notifyListeners();
  }

  Future<void> logout() async {
    await _api.post('/auth/logout').catchError((_) {});
    await _api.clearTokens();
    _user = null;
    notifyListeners();
  }
}
