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
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: _buildDayColumns(),
      ),
    );
  }
  
  // Build a fixed week grid for larger screens
  Widget _buildDesktopWeekGrid() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _buildDayColumns(),
    );
  }
  
  // Build day columns for each weekday (memoized)
  List<Widget> _buildDayColumns() {
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
