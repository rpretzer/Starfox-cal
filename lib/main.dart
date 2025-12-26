import 'dart:async';
import 'package:flutter/foundation.dart' show kDebugMode, kIsWeb;
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/models/category.dart';
import 'package:starfox_calendar/screens/calendar_screen.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AppInitializer());
}

/// App initializer that handles async initialization
class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  StorageService? _storageService;
  String? _error;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    // Use a microtask to ensure the widget tree is built before async initialization
    Future.microtask(() => _initialize());
  }

  Future<void> _initialize() async {
    // Add a small delay to ensure Flutter is ready, especially on web
    await Future.delayed(const Duration(milliseconds: 50));
    
    try {
      if (kDebugMode) {
        debugPrint('[AppInit] Starting initialization...');
        debugPrint('[AppInit] Platform: ${kIsWeb ? "Web" : "Mobile"}');
      }

      // Step 1: Initialize Hive
      if (kDebugMode) {
        debugPrint('[AppInit] Step 1: Initializing Hive...');
      }
      
      try {
        await Hive.initFlutter();
        if (kDebugMode) {
          debugPrint('[AppInit] Hive initialized successfully');
        }
      } catch (e) {
        if (kDebugMode) {
          debugPrint('[AppInit] Hive.initFlutter() error: $e');
        }
        // On web, Hive might already be initialized, try to continue
        if (kIsWeb) {
          if (kDebugMode) {
            debugPrint('[AppInit] Continuing on web despite Hive init error...');
          }
        } else {
          rethrow;
        }
      }

      // Step 2: Register adapters (order matters - register enums before classes that use them)
      if (kDebugMode) {
        debugPrint('[AppInit] Step 2: Registering adapters...');
      }
      
      // Register WeekType enum adapter first (typeId: 2)
      if (!Hive.isAdapterRegistered(2)) {
        Hive.registerAdapter(WeekTypeAdapter());
        if (kDebugMode) {
          debugPrint('[AppInit] WeekTypeAdapter (typeId: 2) registered');
        }
      } else if (kDebugMode) {
        debugPrint('[AppInit] WeekTypeAdapter (typeId: 2) already registered');
      }
      
      // Register Meeting adapter (typeId: 0)
      if (!Hive.isAdapterRegistered(0)) {
        Hive.registerAdapter(MeetingAdapter());
        if (kDebugMode) {
          debugPrint('[AppInit] MeetingAdapter (typeId: 0) registered');
        }
      } else if (kDebugMode) {
        debugPrint('[AppInit] MeetingAdapter (typeId: 0) already registered');
      }
      
      // Register Category adapter (typeId: 1)
      if (!Hive.isAdapterRegistered(1)) {
        Hive.registerAdapter(CategoryAdapter());
        if (kDebugMode) {
          debugPrint('[AppInit] CategoryAdapter (typeId: 1) registered');
        }
      } else if (kDebugMode) {
        debugPrint('[AppInit] CategoryAdapter (typeId: 1) already registered');
      }
      
      if (kDebugMode) {
        debugPrint('[AppInit] All adapters registered successfully');
      }

      // Step 3: Initialize storage service
      if (kDebugMode) {
        debugPrint('[AppInit] Step 3: Initializing storage service...');
      }
      final storageService = StorageService();
      await storageService.init();
      if (kDebugMode) {
        debugPrint('[AppInit] Storage service initialized successfully');
      }

      // Step 4: Update state
      if (mounted) {
        setState(() {
          _storageService = storageService;
          _isInitialized = true;
        });
        if (kDebugMode) {
          debugPrint('[AppInit] Initialization complete - app ready');
        }
      } else {
        if (kDebugMode) {
          debugPrint('[AppInit] Widget not mounted, cannot update state');
        }
      }
    } catch (e, stackTrace) {
      if (kDebugMode) {
        debugPrint('[AppInit] FATAL ERROR: $e');
        debugPrint('[AppInit] Stack trace: $stackTrace');
      }
      
      // Also log to console for web debugging
      if (kIsWeb) {
        print('[AppInit] ERROR: $e');
        print('[AppInit] Stack trace: $stackTrace');
      }
      
      if (mounted) {
        setState(() {
          _error = _formatError(e, stackTrace);
          _isInitialized = true; // Set to true so we show error screen
        });
      }
    }
  }

  String _formatError(dynamic error, StackTrace stackTrace) {
    final buffer = StringBuffer();
    buffer.writeln('Error: ${error.toString()}');
    buffer.writeln('');
    buffer.writeln('Stack trace:');
    buffer.writeln(stackTrace.toString());
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: AppTheme.lightBackgroundColor,
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text(
                  'Sprint Calendar',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Initializing...',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.lightSecondaryTextColor,
                  ),
                ),
                if (kIsWeb && kDebugMode) ...[
                  const SizedBox(height: 16),
                  Text(
                    'Platform: Web',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.lightSecondaryTextColor,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    if (_error != null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: Scaffold(
          backgroundColor: AppTheme.lightBackgroundColor,
          appBar: AppBar(
            title: const Text('Initialization Error'),
            backgroundColor: AppTheme.dangerColor,
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppTheme.dangerColor,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Failed to Initialize App',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (kIsWeb)
                    const Text(
                      'Check the browser console (F12) for detailed error messages.',
                      style: TextStyle(
                        fontStyle: FontStyle.italic,
                        color: Colors.grey,
                      ),
                    ),
                  const SizedBox(height: 24),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      color: AppTheme.dangerColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppTheme.dangerColor.withOpacity(0.3),
                      ),
                    ),
                    child: SelectableText(
                      _error!,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _error = null;
                        _isInitialized = false;
                        _storageService = null;
                      });
                      _initialize();
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (_storageService == null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.warning, size: 48, color: Colors.orange),
                const SizedBox(height: 16),
                Text(
                  'Unknown state',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                const Text('Storage service is null'),
              ],
            ),
          ),
        ),
      );
    }

    return MyApp(storageService: _storageService!);
  }
}

class MyApp extends StatelessWidget {
  final StorageService storageService;

  const MyApp({
    super.key,
    required this.storageService,
  });

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<StorageService>(
      create: (_) => storageService,
      child: MaterialApp(
        title: 'Sprint Calendar',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        debugShowCheckedModeBanner: false,
        home: const CalendarScreen(),
      ),
    );
  }
}
