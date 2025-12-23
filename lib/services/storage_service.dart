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
  
  // Getters
  List<Meeting> get meetings => _meetingsBox.values.toList();
  List<models.Category> get categories => _categoriesBox.values.toList();
  String get currentWeekType => _currentWeekType;
  String get currentView => _currentView;
  
  // Initialize the storage
  Future<void> init() async {
    // Open Hive boxes
    _meetingsBox = await Hive.openBox<Meeting>(_meetingsBoxName);
    _categoriesBox = await Hive.openBox<models.Category>(_categoriesBoxName);
    _settingsBox = await Hive.openBox<dynamic>(_settingsBoxName);
    
    // Load saved settings or use defaults
    _currentWeekType = _settingsBox.get('currentWeekType', defaultValue: 'A');
    _currentView = _settingsBox.get('currentView', defaultValue: 'weekly');
    
    // If first run, initialize with default data
    if (_categoriesBox.isEmpty) {
      await _initDefaultCategories();
    }
    
    if (_meetingsBox.isEmpty) {
      await _initDefaultMeetings();
    }
  }
  
  // Initialize with default categories
  Future<void> _initDefaultCategories() async {
    final defaultCategories = models.Category.getDefaultCategories();
    for (final category in defaultCategories) {
      await _categoriesBox.put(category.id, category);
    }
  }
  
  // Initialize with default meetings
  Future<void> _initDefaultMeetings() async {
    final defaultMeetings = Meeting.getDefaultMeetings();
    for (final meeting in defaultMeetings) {
      await _meetingsBox.put(meeting.id, meeting);
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
    return _meetingsBox.get(id);
  }
  
  // Get next available meeting ID
  int getNextMeetingId() {
    if (_meetingsBox.isEmpty) return 1;
    return _meetingsBox.values
        .map((meeting) => meeting.id)
        .fold(0, (curr, next) => curr > next ? curr : next) + 1;
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
    return _categoriesBox.get(id);
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
