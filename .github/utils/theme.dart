import 'package:flutter/material.dart';

class AppTheme {
  // Colors
  static const Color primaryColor = Color(0xFF4361EE);
  static const Color primaryLightColor = Color(0xFFEEF2FF);
  static const Color successColor = Color(0xFF2ECC71);
  static const Color warningColor = Color(0xFFF39C12);
  static const Color dangerColor = Color(0xFFE74C3C);
  
  // Light theme colors
  static const Color lightBackgroundColor = Color(0xFFF8F9FA);
  static const Color lightSurfaceColor = Colors.white;
  static const Color lightTextColor = Color(0xFF212529);
  static const Color lightSecondaryTextColor = Color(0xFF6C757D);
  
  // Dark theme colors
  static const Color darkBackgroundColor = Color(0xFF212529);
  static const Color darkSurfaceColor = Color(0xFF343A40);
  static const Color darkTextColor = Colors.white;
  static const Color darkSecondaryTextColor = Color(0xFFADB5BD);
  
  // Border radius
  static const double borderRadius = 8.0;
  
  // Transition speed
  static const Duration transitionDuration = Duration(milliseconds: 200);
  
  // Light theme
  static final ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.light(
      primary: primaryColor,
      secondary: primaryColor.withOpacity(0.8),
      surface: lightSurfaceColor,
      background: lightBackgroundColor,
      error: dangerColor,
    ),
    scaffoldBackgroundColor: lightBackgroundColor,
    appBarTheme: const AppBarTheme(
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      color: lightSurfaceColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: const BorderSide(color: Colors.grey),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: const BorderSide(color: primaryColor),
      ),
      filled: true,
      fillColor: Colors.white,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: primaryLightColor,
      disabledColor: Colors.grey.shade300,
      selectedColor: primaryColor,
      secondarySelectedColor: primaryColor,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      labelStyle: const TextStyle(color: primaryColor),
      secondaryLabelStyle: const TextStyle(color: Colors.white),
      brightness: Brightness.light,
    ),
    dividerTheme: const DividerThemeData(
      thickness: 1,
      color: Color(0xFFDEE2E6),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(color: lightTextColor),
      displayMedium: TextStyle(color: lightTextColor),
      displaySmall: TextStyle(color: lightTextColor),
      headlineLarge: TextStyle(color: lightTextColor),
      headlineMedium: TextStyle(color: lightTextColor),
      headlineSmall: TextStyle(color: lightTextColor),
      titleLarge: TextStyle(color: lightTextColor),
      titleMedium: TextStyle(color: lightTextColor),
      titleSmall: TextStyle(color: lightTextColor),
      bodyLarge: TextStyle(color: lightTextColor),
      bodyMedium: TextStyle(color: lightTextColor),
      bodySmall: TextStyle(color: lightSecondaryTextColor),
      labelLarge: TextStyle(color: lightTextColor),
      labelMedium: TextStyle(color: lightTextColor),
      labelSmall: TextStyle(color: lightSecondaryTextColor),
    ),
  );
  
  // Dark theme
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: primaryColor,
      secondary: primaryColor.withOpacity(0.8),
      surface: darkSurfaceColor,
      background: darkBackgroundColor,
      error: dangerColor,
    ),
    scaffoldBackgroundColor: darkBackgroundColor,
    appBarTheme: const AppBarTheme(
      backgroundColor: darkSurfaceColor,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    cardTheme: CardTheme(
      color: darkSurfaceColor,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: const BorderSide(color: primaryColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: BorderSide(color: Colors.grey.shade700),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(borderRadius),
        borderSide: const BorderSide(color: primaryColor),
      ),
      filled: true,
      fillColor: darkSurfaceColor,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: darkSurfaceColor,
      disabledColor: Colors.grey.shade800,
      selectedColor: primaryColor,
      secondarySelectedColor: primaryColor,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
      labelStyle: const TextStyle(color: darkTextColor),
      secondaryLabelStyle: const TextStyle(color: Colors.white),
      brightness: Brightness.dark,
    ),
    dividerTheme: const DividerThemeData(
      thickness: 1,
      color: Color(0xFF495057),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(color: darkTextColor),
      displayMedium: TextStyle(color: darkTextColor),
      displaySmall: TextStyle(color: darkTextColor),
      headlineLarge: TextStyle(color: darkTextColor),
      headlineMedium: TextStyle(color: darkTextColor),
      headlineSmall: TextStyle(color: darkTextColor),
      titleLarge: TextStyle(color: darkTextColor),
      titleMedium: TextStyle(color: darkTextColor),
      titleSmall: TextStyle(color: darkTextColor),
      bodyLarge: TextStyle(color: darkTextColor),
      bodyMedium: TextStyle(color: darkTextColor),
      bodySmall: TextStyle(color: darkSecondaryTextColor),
      labelLarge: TextStyle(color: darkTextColor),
      labelMedium: TextStyle(color: darkTextColor),
      labelSmall: TextStyle(color: darkSecondaryTextColor),
    ),
  );
}
