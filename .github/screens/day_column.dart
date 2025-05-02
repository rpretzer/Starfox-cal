import 'package:flutter/material.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
import 'package:starfox_calendar/utils/datetime_utils.dart';
import 'package:starfox_calendar/widgets/meeting_card.dart';

class DayColumn extends StatefulWidget {
  final String day;
  final List<Meeting> meetings;
  final Function(Meeting) onMeetingTap;
  final Function(int) onDrop;
  final StorageService storageService;
  
  const DayColumn({
    super.key,
    required this.day,
    required this.meetings,
    required this.onMeetingTap,
    required this.onDrop,
    required this.storageService,
  });

  @override
  State<DayColumn> createState() => _DayColumnState();
}

class _DayColumnState extends State<DayColumn> {
  bool _isDragOver = false;
  
  @override
  Widget build(BuildContext context) {
    // Sort meetings by time
    final sortedMeetings = List<Meeting>.from(widget.meetings);
    sortedMeetings.sort((a, b) => 
      DateTimeUtils.compareTime(a.startTime, b.startTime));
    
    return DragTarget<int>(
      onWillAccept: (data) => true,
      onAccept: (meetingId) {
        setState(() {
          _isDragOver = false;
        });
        widget.onDrop(meetingId);
      },
      onLeave: (data) {
        setState(() {
          _isDragOver = false;
        });
      },
      onWillAcceptWithDetails: (details) {
        setState(() {
          _isDragOver = true;
        });
        return true;
      },
      builder: (context, candidateData, rejectedData) {
        return Container(
          decoration: BoxDecoration(
            color: _isDragOver 
                ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
                : null,
            border: Border.all(
              color: _isDragOver 
                  ? Theme.of(context).colorScheme.primary
                  : Colors.transparent,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          ),
          child: Column(
            children: [
              // Day header
              Container(
                padding: const EdgeInsets.all(AppConstants.smallPadding),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 2,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    widget.day,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              
              // Meetings list
              Expanded(
                child: sortedMeetings.isEmpty
                    ? _buildEmptyState()
                    : _buildMeetingsList(sortedMeetings),
              ),
            ],
          ),
        );
      },
    );
  }
  
  // Build UI when there are no meetings
  Widget _buildEmptyState() {
    return const Center(
      child: Text(
        AppConstants.noMeetings,
        style: TextStyle(
          color: Colors.grey,
          fontStyle: FontStyle.italic,
        ),
      ),
    );
  }
  
  // Build the list of meetings
  Widget _buildMeetingsList(List<Meeting> meetings) {
    return ListView.builder(
      padding: const EdgeInsets.all(AppConstants.smallPadding),
      itemCount: meetings.length,
      itemBuilder: (context, index) {
        final meeting = meetings[index];
        return MeetingCard(
          meeting: meeting,
          storageService: widget.storageService,
          onTap: () => widget.onMeetingTap(meeting),
        );
      },
    );
  }
}
