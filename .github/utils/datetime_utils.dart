import 'package:intl/intl.dart';

class DateTimeUtils {
  // Format a time string (e.g. "10:00 AM")
  static String formatTime(DateTime time) {
    return DateFormat('h:mm a').format(time);
  }
  
  // Parse a time string (e.g. "10:00 AM") to DateTime
  static DateTime? parseTime(String timeStr) {
    try {
      return DateFormat('h:mm a').parse(timeStr);
    } catch (e) {
      return null;
    }
  }
  
  // Convert "10:00 AM - 11:00 AM" to "10:00 AM" start time and "11:00 AM" end time
  static Map<String, String> splitTimeRange(String timeRange) {
    final parts = timeRange.split(' - ');
    if (parts.length != 2) {
      return {
        'startTime': '',
        'endTime': '',
      };
    }
    
    return {
      'startTime': parts[0],
      'endTime': parts[1],
    };
  }
  
  // Get day name from index (0 = Monday, 1 = Tuesday, etc.)
  static String getDayName(int index) {
    switch (index) {
      case 0:
        return 'Monday';
      case 1:
        return 'Tuesday';
      case 2:
        return 'Wednesday';
      case 3:
        return 'Thursday';
      case 4:
        return 'Friday';
      default:
        return '';
    }
  }
  
  // Get day index from name (Monday = 0, Tuesday = 1, etc.)
  static int getDayIndex(String dayName) {
    switch (dayName) {
      case 'Monday':
        return 0;
      case 'Tuesday':
        return 1;
      case 'Wednesday':
        return 2;
      case 'Thursday':
        return 3;
      case 'Friday':
        return 4;
      default:
        return -1;
    }
  }
  
  // Compare two time strings (e.g. "10:00 AM" and "11:00 AM")
  static int compareTime(String time1, String time2) {
    final dt1 = parseTime(time1);
    final dt2 = parseTime(time2);
    
    if (dt1 == null || dt2 == null) {
      return 0;
    }
    
    return dt1.compareTo(dt2);
  }
  
  // Check if a time is within a time range
  static bool isTimeInRange(String timeToCheck, String startTime, String endTime) {
    final dt = parseTime(timeToCheck);
    final start = parseTime(startTime);
    final end = parseTime(endTime);
    
    if (dt == null || start == null || end == null) {
      return false;
    }
    
    return dt.isAfter(start) && dt.isBefore(end);
  }
  
  // Check if two time ranges overlap
  static bool doTimeRangesOverlap(
    String start1, 
    String end1, 
    String start2, 
    String end2
  ) {
    final s1 = parseTime(start1);
    final e1 = parseTime(end1);
    final s2 = parseTime(start2);
    final e2 = parseTime(end2);
    
    if (s1 == null || e1 == null || s2 == null || e2 == null) {
      return false;
    }
    
    // If one range ends before or exactly when the other starts, they don't overlap
    if (e1.compareTo(s2) <= 0 || e2.compareTo(s1) <= 0) {
      return false;
    }
    
    return true;
  }
  
  // Format duration (e.g. "1h 30m")
  static String formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }
  
  // Calculate duration between two time strings
  static Duration? durationBetween(String startTime, String endTime) {
    final start = parseTime(startTime);
    final end = parseTime(endTime);
    
    if (start == null || end == null) {
      return null;
    }
    
    return end.difference(start);
  }
  
  // Format duration from two time strings (e.g. "1h 30m")
  static String formatTimeDifference(String startTime, String endTime) {
    final duration = durationBetween(startTime, endTime);
    
    if (duration == null) {
      return '';
    }
    
    return formatDuration(duration);
  }
}
