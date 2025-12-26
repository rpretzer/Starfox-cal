import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/models/category.dart' as models;

class StorageService extends ChangeNotifier {
  static const String _meetingsBoxName = 'meetings';
  static const String _categoriesBoxName = 'categories';
  static const String _settingsBoxName = 'settings';
  
  late Box<Meeting> _meetingsBox;
  late Box<models.Category> _categoriesBox;
  late Box<dynamic> _settingsBox;
  
  // Current state
  String _currentWeekType = 'A';
  String _currentView = 'weekly';
  
  // Getters - with null safety checks
  List<Meeting> get meetings {
    try {
      return _meetingsBox.values.toList();
    } catch (e) {
      return [];
    }
  }
  
  List<models.Category> get categories {
    try {
      return _categoriesBox.values.toList();
    } catch (e) {
      return [];
    }
  }
  
  String get currentWeekType => _currentWeekType;
  String get currentView => _currentView;
  
  // Initialize the storage
  Future<void> init() async {
    try {
      print('[StorageService] Opening Hive boxes...');
      
      // Open Hive boxes with error handling for each
      // Use a timeout to prevent hanging on web
      try {
        _meetingsBox = await Hive.openBox<Meeting>(_meetingsBoxName)
            .timeout(const Duration(seconds: 10));
        print('[StorageService] Meetings box opened (${_meetingsBox.length} items)');
      } catch (e) {
        print('[StorageService] Error opening meetings box: $e');
        rethrow;
      }
      
      try {
        _categoriesBox = await Hive.openBox<models.Category>(_categoriesBoxName)
            .timeout(const Duration(seconds: 10));
        print('[StorageService] Categories box opened (${_categoriesBox.length} items)');
      } catch (e) {
        print('[StorageService] Error opening categories box: $e');
        rethrow;
      }
      
      try {
        _settingsBox = await Hive.openBox<dynamic>(_settingsBoxName)
            .timeout(const Duration(seconds: 10));
        print('[StorageService] Settings box opened');
      } catch (e) {
        print('[StorageService] Error opening settings box: $e');
        rethrow;
      }
      
      // Load saved settings or use defaults
      _currentWeekType = _settingsBox.get('currentWeekType', defaultValue: 'A');
      _currentView = _settingsBox.get('currentView', defaultValue: 'weekly');
      print('[StorageService] Settings loaded: weekType=$_currentWeekType, view=$_currentView');
      
      // If first run, initialize with default data
      if (_categoriesBox.isEmpty) {
        print('[StorageService] Categories box is empty, initializing defaults...');
        await _initDefaultCategories();
      } else {
        print('[StorageService] Categories box has ${_categoriesBox.length} items');
      }
      
      if (_meetingsBox.isEmpty) {
        print('[StorageService] Meetings box is empty, initializing defaults...');
        await _initDefaultMeetings();
      } else {
        print('[StorageService] Meetings box has ${_meetingsBox.length} items');
      }
      
      print('[StorageService] Initialization complete');
    } catch (e, stackTrace) {
      print('[StorageService] ERROR in init(): $e');
      print('[StorageService] Stack trace: $stackTrace');
      rethrow; // Re-throw to be caught by main initialization
    }
  }
  
  // Initialize with default categories
  Future<void> _initDefaultCategories() async {
    try {
      final defaultCategories = models.Category.getDefaultCategories();
      for (final category in defaultCategories) {
        await _categoriesBox.put(category.id, category);
      }
      print('Default categories initialized: ${defaultCategories.length}');
    } catch (e) {
      print('Error initializing default categories: $e');
      rethrow;
    }
  }
  
  // Initialize with default meetings
  Future<void> _initDefaultMeetings() async {
    try {
      final defaultMeetings = Meeting.getDefaultMeetings();
      for (final meeting in defaultMeetings) {
        await _meetingsBox.put(meeting.id, meeting);
      }
      print('Default meetings initialized: ${defaultMeetings.length}');
    } catch (e) {
      print('Error initializing default meetings: $e');
      rethrow;
    }
  }
  
  // Save or update a meeting
  Future<void> saveMeeting(Meeting meeting) async {
    await _meetingsBox.put(meeting.id, meeting);
    _meetingsCache.clear(); // Clear cache when meetings change
    notifyListeners();
  }
  
  // Delete a meeting
  Future<void> deleteMeeting(int id) async {
    await _meetingsBox.delete(id);
    _meetingsCache.clear(); // Clear cache when meetings change
    notifyListeners();
  }
  
  // Get a meeting by ID
  Meeting? getMeeting(int id) {
    try {
      return _meetingsBox.get(id);
    } catch (e) {
      return null;
    }
  }
  
  // Get next available meeting ID
  int getNextMeetingId() {
    try {
      if (_meetingsBox.isEmpty) return 1;
      final maxId = _meetingsBox.values
          .map((meeting) => meeting.id)
          .fold(0, (curr, next) => curr > next ? curr : next);
      return maxId + 1;
    } catch (e) {
      // Fallback if there's an error
      return DateTime.now().millisecondsSinceEpoch;
    }
  }
  
  // Save or update a category
  Future<void> saveCategory(models.Category category) async {
    await _categoriesBox.put(category.id, category);
    notifyListeners();
  }
  
  // Delete a category
  Future<void> deleteCategory(String id) async {
    await _categoriesBox.delete(id);
    notifyListeners();
  }
  
  // Get a category by ID
  models.Category? getCategory(String id) {
    try {
      return _categoriesBox.get(id);
    } catch (e) {
      return null;
    }
  }
  
  // Check if a category ID exists
  bool categoryExists(String id) {
    try {
      return _categoriesBox.containsKey(id);
    } catch (e) {
      return false;
    }
  }
  
  // Set current week type (A or B)
  Future<void> setCurrentWeekType(String weekType) async {
    if (_currentWeekType == weekType) return; // Skip if unchanged
    _currentWeekType = weekType;
    await _settingsBox.put('currentWeekType', weekType);
    _meetingsCache.clear(); // Clear cache when week type changes
    notifyListeners();
  }
  
  // Set current view (weekly, conflicts, or categories)
  Future<void> setCurrentView(String view) async {
    if (_currentView == view) return; // Skip if unchanged
    _currentView = view;
    await _settingsBox.put('currentView', view);
    notifyListeners();
  }
  
  // Cache for meetings by day to improve performance
  final Map<String, List<Meeting>> _meetingsCache = {};
  String? _lastCacheKey;
  
  // Get meetings for a specific day (with caching)
  List<Meeting> getMeetingsForDay(String day) {
    try {
      final cacheKey = '$day-$_currentWeekType';
      
      // Return cached result if available and cache is still valid
      if (_meetingsCache.containsKey(cacheKey) && _lastCacheKey == cacheKey) {
        return _meetingsCache[cacheKey]!;
      }
      
      final weekTypeEnum = _currentWeekType == 'A' ? WeekType.a : WeekType.b;
      
      final meetings = _meetingsBox.values.where((meeting) {
        return meeting.days.contains(day) && 
          (meeting.weekType == WeekType.both || 
           meeting.weekType == weekTypeEnum ||
           meeting.weekType == WeekType.monthly ||
           meeting.weekType == WeekType.quarterly);
      }).toList();
      
      // Clear cache if week type changed
      if (_lastCacheKey != null && !_lastCacheKey!.endsWith(_currentWeekType)) {
        _meetingsCache.clear();
      }
      
      _meetingsCache[cacheKey] = meetings;
      _lastCacheKey = cacheKey;
      return meetings;
    } catch (e) {
      // Return empty list if there's an error accessing the box
      return [];
    }
  }
  
  // Check for meeting conflicts on a specific day
  List<Map<String, dynamic>> getConflictsForDay(String day) {
    final meetings = getMeetingsForDay(day);
    final conflicts = <Map<String, dynamic>>[];
    
    for (var i = 0; i < meetings.length; i++) {
      for (var j = i + 1; j < meetings.length; j++) {
        final meetingA = meetings[i];
        final meetingB = meetings[j];
        
        // Check if times overlap
        if (meetingA.startTime == meetingB.startTime) {
          conflicts.add({
            'day': day,
            'time': meetingA.startTime,
            'meetings': [meetingA.id, meetingB.id]
          });
        }
      }
    }
    
    return conflicts;
  }
  
  // Move a meeting to a different day
  Future<void> moveMeetingToDay(int meetingId, String newDay) async {
    final meeting = getMeeting(meetingId);
    if (meeting == null) return;
    
    if (meeting.days.length > 1) {
      // Create a copy of the meeting for the new day
      final newMeeting = meeting.copyWith(
        id: getNextMeetingId(),
        days: [newDay],
      );
      await saveMeeting(newMeeting);
    } else {
      // Update the day for single-day meetings
      final updatedMeeting = meeting.copyWith(
        days: [newDay],
      );
      await saveMeeting(updatedMeeting);
    }
  }
}
