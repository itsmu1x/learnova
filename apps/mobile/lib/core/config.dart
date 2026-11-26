/// App-wide configuration. Override at build time with:
/// `flutter run --dart-define=API_BASE_URL=https://api.learnova.dev/api/v1 --dart-define=WEB_URL=https://learnova.dev`
/// The http defaults are for local development only; release builds refuse them (see main.dart).
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.0.199:4000/api/v1',
  );

  /// Public web app, used for share links (certificate verification) and Pro pricing.
  static const String webUrl = String.fromEnvironment(
    'WEB_URL',
    defaultValue: 'http://192.168.0.199:3000',
  );
}
