import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/screens/meeting_detail_screen.dart';
import 'package:starfox_calendar/screens/settings_screen.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
import 'package:starfox_calendar/widgets/calendar_header.dart';
import 'package:starfox_calendar/widgets/categories_view.dart';
import 'package:starfox_calendar/widgets/conflicts_view.dart';
import 'package:starfox_calendar/screens/weekly_view.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  @override
  Widget build(BuildContext context) {
    return Consumer<StorageService>(
      builder: (context, storageService, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text(AppConstants.appName),
            actions: [
              // Settings button
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SettingsScreen(),
                    ),
                  );
                },
              ),
            ],
          ),
          body: Column(
            children: [
              // Calendar header with view and week type controls
              CalendarHeader(
                currentView: storageService.currentView,
                currentWeekType: storageService.currentWeekType,
                onViewChanged: (view) {
                  storageService.setCurrentView(view);
                },
                onWeekTypeChanged: (weekType) {
                  storageService.setCurrentWeekType(weekType);
                },
              ),
              
              // Main content based on current view
              Expanded(
                child: _buildContent(storageService),
              ),
            ],
          ),
          // Add meeting FAB
          floatingActionButton: FloatingActionButton(
            onPressed: () => _addMeeting(context),
            tooltip: AppConstants.tooltipAddMeeting,
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }
  
  // Build content based on current view
  Widget _buildContent(StorageService storageService) {
    switch (storageService.currentView) {
      case AppConstants.weeklyView:
        return WeeklyView(
          storageService: storageService,
          onMeetingTapped: (meeting) => _editMeeting(context, meeting),
        );
      case AppConstants.conflictsView:
        return ConflictsView(
          storageService: storageService,
          onMeetingTapped: (meeting) => _editMeeting(context, meeting),
        );
      case AppConstants.categoriesView:
        return CategoriesView(
          storageService: storageService,
          onMeetingTapped: (meeting) => _editMeeting(context, meeting),
        );
      default:
        return const Center(
          child: Text('Unknown view'),
        );
    }
  }
  
  // Add a new meeting
  void _addMeeting(BuildContext context) async {
    final storageService = Provider.of<StorageService>(context, listen: false);
    
    // Navigate to meeting detail screen for adding
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MeetingDetailScreen(
          meetingId: -1,  // -1 indicates a new meeting
          storageService: storageService,
        ),
      ),
    );
    
    // Handle result if needed
    if (result == true) {
      // Meeting was added
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Meeting added'),
        ),
      );
    }
  }
  
  // Edit an existing meeting
  void _editMeeting(BuildContext context, Meeting meeting) async {
    final storageService = Provider.of<StorageService>(context, listen: false);
    
    // Navigate to meeting detail screen for editing
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MeetingDetailScreen(
          meetingId: meeting.id,
          storageService: storageService,
        ),
      ),
    );
    
    // Handle result if needed
    if (result == true) {
      // Meeting was edited
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Meeting updated'),
        ),
      );
    } else if (result == false) {
      // Meeting was deleted
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Meeting deleted'),
        ),
      );
    }
  }
}
