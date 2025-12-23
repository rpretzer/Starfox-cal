class AppConstants {
  // App name
  static const String appName = 'Sprint Calendar';
  
  // Views
  static const String weeklyView = 'weekly';
  static const String conflictsView = 'conflicts';
  static const String categoriesView = 'categories';
  
  // Week types
  static const String weekA = 'A';
  static const String weekB = 'B';
  
  // Days of the week
  static const List<String> daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];
  
  // Time slots (hours)
  static const int startHour = 8; // 8 AM
  static const int endHour = 18;  // 6 PM
  
  // UI constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double cardBorderRadius = 8.0;
  static const double iconSize = 24.0;
  static const double smallIconSize = 16.0;
  static const double largeIconSize = 32.0;
  
  // Animation durations
  static const Duration shortAnimation = Duration(milliseconds: 150);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Strings
  static const String addMeeting = 'Add Meeting';
  static const String editMeeting = 'Edit Meeting';
  static const String deleteMeeting = 'Delete Meeting';
  static const String cancel = 'Cancel';
  static const String save = 'Save';
  static const String delete = 'Delete';
  static const String name = 'Name';
  static const String category = 'Category';
  static const String day = 'Day';
  static const String time = 'Time';
  static const String requiredAttendance = 'Required Attendance';
  static const String notes = 'Notes';
  static const String assignedTo = 'Assigned To';
  static const String noMeetings = 'No meetings';
  static const String noConflicts = 'No conflicts detected in the current week view.';
  static const String conflictDetected = 'Conflict Detected';
  static const String rotateRepresentatives = 'Recommendation: Rotate representatives or adjust timing';
  static const String weeklyViewTitle = 'Weekly View';
  static const String conflictsViewTitle = 'Conflicts View';
  static const String categoriesViewTitle = 'Categories View';
  
  // Error messages
  static const String errorSavingMeeting = 'Error saving meeting';
  static const String errorDeletingMeeting = 'Error deleting meeting';
  static const String errorInvalidTime = 'Invalid time format';
  static const String errorNameRequired = 'Name is required';
  static const String errorTimeRequired = 'Time is required';
  static const String errorAttendanceRequired = 'Required attendance is required';
  
  // Tooltips
  static const String tooltipAddMeeting = 'Add a new meeting';
  static const String tooltipEditMeeting = 'Edit meeting details';
  static const String tooltipDeleteMeeting = 'Delete this meeting';
  static const String tooltipDragMeeting = 'Drag to reschedule';
  static const String tooltipMoreInfo = 'More information';
  
  // Frequency labels
  static Map<String, String> frequencyLabels = {
    'Both': 'Weekly',
    'A': 'Biweekly (Week A)',
    'B': 'Biweekly (Week B)',
    'Monthly': 'Monthly',
    'Quarterly': 'Quarterly',
  };
  
  // Key conflict days
  static const List<Map<String, String>> keyConflictDays = [
    {
      'day': 'Tuesday Noon',
      'conflicts': 'RDS Daily Stand-up, Reveille Working Group (Week B), Full Train Sync (Week A)',
    },
    {
      'day': 'Thursday Noon',
      'conflicts': 'RDS Daily Stand-up, Zelda Feature Refinement, RDS Critique',
    },
    {
      'day': 'Wednesday 10 AM',
      'conflicts': 'Starfox Daily Stand-up, CAB Meeting (when changes need approval)',
    },
  ];
}
