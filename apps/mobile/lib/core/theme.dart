import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Learnova brand tokens, matching the web app: cobalt cap + marigold tassel on deep navy.
class AppTheme {
  static const Color cobalt = Color(0xFF2756D8);
  static const Color cobaltDeep = Color(0xFF1C3FA8);
  static const Color cobaltBright = Color(0xFF6E8FF0);
  static const Color marigold = Color(0xFFFFAE1A);
  static const Color marigoldDeep = Color(0xFFB87400);
  static const Color navy = Color(0xFF0F1A3A);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = marigold;

  static const Color _canvas = Color(0xFFF5F6FA);
  static const Color _line = Color(0xFFE1E4EE);
  static const Color _mute = Color(0xFF5E6884);
  static const Color _darkCanvas = Color(0xFF0C1224);
  static const Color _darkSurface = Color(0xFF161D33);
  static const Color _darkLine = Color(0xFF2C3550);
  static const Color _darkMute = Color(0xFF9AA2BA);

  /// Navy panel with a cobalt glow, used for heroes and image placeholders.
  static const Gradient heroGradient = RadialGradient(
    center: Alignment(0.9, -0.9),
    radius: 1.4,
    colors: [cobalt, navy],
    stops: [0, 0.65],
  );
  static const Gradient cardGradient = heroGradient;

  static ThemeData light() => _base(
        const ColorScheme(
          brightness: Brightness.light,
          primary: cobalt,
          onPrimary: Colors.white,
          primaryContainer: Color(0xFFE7EDFC),
          onPrimaryContainer: cobaltDeep,
          secondary: marigold,
          onSecondary: navy,
          secondaryContainer: Color(0xFFFFF1D3),
          onSecondaryContainer: marigoldDeep,
          tertiary: navy,
          onTertiary: Colors.white,
          error: Color(0xFFDC2626),
          onError: Colors.white,
          surface: Colors.white,
          onSurface: navy,
          onSurfaceVariant: _mute,
          surfaceContainerLowest: _canvas,
          surfaceContainerLow: Color(0xFFF7F8FB),
          surfaceContainer: Color(0xFFEEF0F6),
          surfaceContainerHigh: Color(0xFFEEF0F6),
          surfaceContainerHighest: _line,
          outline: Color(0xFFC8CDDC),
          outlineVariant: _line,
          inverseSurface: navy,
          onInverseSurface: Colors.white,
        ),
      );

  static ThemeData dark() => _base(
        const ColorScheme(
          brightness: Brightness.dark,
          primary: cobaltBright,
          onPrimary: navy,
          primaryContainer: Color(0xFF1B2752),
          onPrimaryContainer: Color(0xFFBCCCF7),
          secondary: marigold,
          onSecondary: navy,
          secondaryContainer: Color(0xFF3A2A08),
          onSecondaryContainer: marigold,
          tertiary: Colors.white,
          onTertiary: navy,
          error: Color(0xFFF87171),
          onError: navy,
          surface: _darkSurface,
          onSurface: Color(0xFFECEFF7),
          onSurfaceVariant: _darkMute,
          surfaceContainerLowest: _darkCanvas,
          surfaceContainerLow: Color(0xFF121933),
          surfaceContainer: Color(0xFF1B2440),
          surfaceContainerHigh: Color(0xFF222A43),
          surfaceContainerHighest: _darkLine,
          outline: Color(0xFF4A5470),
          outlineVariant: _darkLine,
          inverseSurface: Color(0xFFECEFF7),
          onInverseSurface: navy,
        ),
      );

  /// Display face for headings; body text uses Figtree via the text theme.
  static TextStyle display(TextStyle? base) =>
      GoogleFonts.bricolageGrotesque(textStyle: base).copyWith(letterSpacing: -0.4);

  static ThemeData _base(ColorScheme scheme) {
    final body = GoogleFonts.figtreeTextTheme(
      ThemeData(brightness: scheme.brightness).textTheme,
    ).apply(bodyColor: scheme.onSurface, displayColor: scheme.onSurface);
    final text = body.copyWith(
      displaySmall: display(body.displaySmall?.copyWith(fontWeight: FontWeight.w600)),
      headlineLarge: display(body.headlineLarge?.copyWith(fontWeight: FontWeight.w600)),
      headlineMedium: display(body.headlineMedium?.copyWith(fontWeight: FontWeight.w600)),
      headlineSmall: display(body.headlineSmall?.copyWith(fontWeight: FontWeight.w600)),
      titleLarge: display(body.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
      titleMedium: body.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      titleSmall: body.titleSmall?.copyWith(fontWeight: FontWeight.w700),
    );
    const pill = StadiumBorder();

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      textTheme: text,
      scaffoldBackgroundColor: scheme.surfaceContainerLowest,
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surfaceContainerLowest,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: text.titleLarge,
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        margin: EdgeInsets.zero,
        color: scheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: BorderSide(color: scheme.outlineVariant),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(0, 52),
          shape: pill,
          elevation: 0,
          textStyle: text.labelLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(0, 52),
          shape: pill,
          side: BorderSide(color: scheme.outline),
          foregroundColor: scheme.onSurface,
          textStyle: text.labelLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(textStyle: text.labelLarge?.copyWith(fontWeight: FontWeight.w700)),
      ),
      chipTheme: ChipThemeData(
        shape: pill,
        side: BorderSide(color: scheme.outlineVariant),
        backgroundColor: scheme.surface,
        selectedColor: scheme.brightness == Brightness.light ? navy : Colors.white,
        labelStyle: text.labelLarge?.copyWith(fontWeight: FontWeight.w600),
        secondaryLabelStyle: text.labelLarge?.copyWith(
          fontWeight: FontWeight.w600,
          color: scheme.brightness == Brightness.light ? Colors.white : navy,
        ),
        checkmarkColor: scheme.brightness == Brightness.light ? Colors.white : navy,
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: scheme.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      listTileTheme: ListTileThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        iconColor: scheme.onSurfaceVariant,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: marigold,
        linearTrackColor: scheme.surfaceContainerHighest,
        circularTrackColor: scheme.surfaceContainerHighest,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: navy,
        contentTextStyle: text.bodyMedium?.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: scheme.surface,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      ),
      dividerTheme: DividerThemeData(color: scheme.outlineVariant, space: 1),
    );
  }
}
