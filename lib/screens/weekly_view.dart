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
          return _buildScrollableWeekGrid();
        } else {
          // For larger screens, show all days side by side
          return _buildDesktopWeekGrid();
        }
      },
    );
  }
  
  // Build a scrollable week grid for smaller screens
  Widget _buildScrollableWeekGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Use 85% of screen width for each day column on mobile
        final columnWidth = constraints.maxWidth * 0.85;
        
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _buildDayColumnsForMobile(columnWidth),
          ),
        );
      },
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
  List<Widget> _buildDayColumnsForMobile(double columnWidth) {
    return AppConstants.daysOfWeek.map((day) {
      // Get meetings for this day
      final meetings = storageService.getMeetingsForDay(day);
      
      return SizedBox(
        width: columnWidth,
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
