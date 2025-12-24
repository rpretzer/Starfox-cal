import 'package:flutter/material.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
import 'package:starfox_calendar/widgets/day_column.dart';
class WeeklyView extends StatelessWidget {
  final StorageService storageService;
  final void Function(Meeting) onMeetingTapped;
  
  const WeeklyView({
    super.key,
    required this.storageService,
    required this.onMeetingTapped,
  });

  @override
  Widget build(BuildContext context) {
    return _buildWeekGrid(context);
  }
  
  // Build the week grid with day columns
  Widget _buildWeekGrid(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // For small screens (e.g. phones in portrait), use a horizontal scrollview
        if (constraints.maxWidth < 600) {
          return _buildScrollableWeekGrid(context, constraints);
        } else {
          // For larger screens, show all days side by side
          return _buildDesktopWeekGrid();
        }
      },
    );
  }
  
  // Build a scrollable week grid for smaller screens
  Widget _buildScrollableWeekGrid(
    BuildContext context,
    BoxConstraints constraints,
  ) {
    // Use 85% of screen width for each day column on mobile
    final columnWidth = constraints.maxWidth * 0.85;
    // Use available height from constraints, or get from MediaQuery as fallback
    double columnHeight;
    if (constraints.maxHeight.isFinite) {
      columnHeight = constraints.maxHeight;
    } else {
      // Fallback: try to get from MediaQuery, or use a reasonable default
      try {
        final mediaQuery = MediaQuery.of(context);
        columnHeight = mediaQuery.size.height * 0.7;
      } catch (e) {
        columnHeight = 600.0; // Final fallback
      }
    }
    
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: SizedBox(
        height: columnHeight,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: _buildDayColumnsForMobile(columnWidth, columnHeight),
        ),
      ),
    );
  }
  
  // Build a fixed week grid for larger screens
  Widget _buildDesktopWeekGrid() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _buildDayColumnsForDesktop(),
    );
  }
  
  // Build day columns for mobile with fixed width
  List<Widget> _buildDayColumnsForMobile(double columnWidth, double columnHeight) {
    return AppConstants.daysOfWeek.map((day) {
      // Get meetings for this day
      final meetings = storageService.getMeetingsForDay(day);
      
      return SizedBox(
        width: columnWidth,
        height: columnHeight,
        key: ValueKey('$day-${storageService.currentWeekType}'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: DayColumn(
            day: day,
            meetings: meetings,
            onMeetingTap: onMeetingTapped,
            onDrop: (meetingId) => _handleMeetingDrop(meetingId, day),
            storageService: storageService,
          ),
        ),
      );
    }).toList();
  }
  
  // Build day columns for desktop with expanded width
  List<Widget> _buildDayColumnsForDesktop() {
    return AppConstants.daysOfWeek.map((day) {
      // Get meetings for this day
      final meetings = storageService.getMeetingsForDay(day);
      
      return Expanded(
        key: ValueKey('$day-${storageService.currentWeekType}'),
        child: DayColumn(
          day: day,
          meetings: meetings,
          onMeetingTap: onMeetingTapped,
          onDrop: (meetingId) => _handleMeetingDrop(meetingId, day),
          storageService: storageService,
        ),
      );
    }).toList();
  }
  
  // Handle dropping a meeting on a day column
  void _handleMeetingDrop(int meetingId, String newDay) async {
    await storageService.moveMeetingToDay(meetingId, newDay);
  }
}
