import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryColor = Color(0xFF1E88E5); // Modern Clinical Teal / Blue
  static const Color secondaryColor = Color(0xFF00897B); // Medical Green
  static const Color accentColor = Color(0xFFD32F2F); // Emergency Warning Red
  static const Color warningRed = Color(0xFFD32F2F);
  static const Color warningRedBg = Color(0xFFFFEBEE);
  static const Color warningBorder = Color(0xFFFFCDD2);
  
  static const Color cautionOrange = Color(0xFFE65100);
  static const Color cautionOrangeBg = Color(0xFFFFF3E0);
  static const Color cautionBorder = Color(0xFFFFE0B2);

  static const Color safeGreen = Color(0xFF2E7D32);
  static const Color safeGreenBg = Color(0xFFE8F5E9);
  static const Color safeGreenBorder = Color(0xFFC8E6C9);

  static const Color cardBg = Colors.white;
  static const Color surfaceMuted = Color(0xFFF8FAFC);
  static const Color textDark = Color(0xFF1E293B);
  static const Color textSubtle = Color(0xFF64748B);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: const Color(0xFFF1F5F9),
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF0F172A),
        iconTheme: IconThemeData(color: Color(0xFF0F172A)),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.dark,
      ),
      cardTheme: CardThemeData(
        elevation: 1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}
