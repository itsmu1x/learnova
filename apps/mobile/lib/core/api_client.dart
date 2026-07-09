import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'config.dart';

/// Thrown for any non-successful API response, carrying the server's error code.
class ApiException implements Exception {
  ApiException(this.message, {this.code, this.status});
  final String message;
  final String? code;
  final int? status;

  @override
  String toString() => message;
}

/// Central HTTP client. Attaches the bearer access token, unwraps the standard
/// `{ success, data }` envelope, and transparently refreshes expired tokens
/// using the stored refresh token (token rotation).
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {'Content-Type': 'application/json'},
      ),
    );
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: _accessKey);
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401 && !_isRefreshing) {
            final refreshed = await _tryRefresh();
            if (refreshed) {
              final retry = await _dio.fetch(error.requestOptions);
              return handler.resolve(retry);
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();

  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  bool _isRefreshing = false;

  static const _accessKey = 'learnova_access';
  static const _refreshKey = 'learnova_refresh';

  Future<void> saveTokens(String access, String refresh) async {
    await _storage.write(key: _accessKey, value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }

  Future<bool> hasSession() async => (await _storage.read(key: _accessKey)) != null;

  Future<bool> _tryRefresh() async {
    _isRefreshing = true;
    try {
      final refresh = await _storage.read(key: _refreshKey);
      if (refresh == null) return false;
      final res = await Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl)).post(
        '/auth/refresh',
        data: {'refreshToken': refresh},
      );
      final data = res.data['data'] as Map<String, dynamic>;
      await saveTokens(data['accessToken'] as String, data['refreshToken'] as String);
      return true;
    } catch (_) {
      await clearTokens();
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _request(() => _dio.get(path, queryParameters: query));

  Future<dynamic> post(String path, {Object? body}) =>
      _request(() => _dio.post(path, data: body));

  Future<dynamic> patch(String path, {Object? body}) =>
      _request(() => _dio.patch(path, data: body));

  Future<dynamic> delete(String path) => _request(() => _dio.delete(path));

  Future<dynamic> _request(Future<Response> Function() run) async {
    try {
      final res = await run();
      final body = res.data;
      if (body is Map && body['success'] == true) return body['data'];
      return body;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['error'] is Map) {
        throw ApiException(
          data['error']['message'] as String? ?? 'Request failed',
          code: data['error']['code'] as String?,
          status: e.response?.statusCode,
        );
      }
      throw ApiException(e.message ?? 'Network error', status: e.response?.statusCode);
    }
  }
}
