/// App-wide configuration. Override [apiBaseUrl] at build time with:
/// `flutter run --dart-define=API_BASE_URL=https://api.learnova.dev/api/v1`
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );
}
