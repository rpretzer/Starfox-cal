import 'package:flutter/material.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
class ConflictsView extends StatefulWidget {
  final StorageService storageService;
  final void Function(Meeting) onMeetingTapped;
  
  const ConflictsView({
    super.key,
    required this.storageService,
    required this.onMeetingTapped,
  });

  @override
  State<ConflictsView> createState() => _ConflictsViewState();
}

class _ConflictsViewState extends State<ConflictsView> {
  // Get all conflicts for all days (memoized)
  List<Map<String, dynamic>>? _cachedConflicts;
  String? _lastConflictsCacheKey;
  
  List<Map<String, dynamic>> _getAllConflicts() {
    final cacheKey = '${widget.storageService.currentWeekType}-${widget.storageService.meetings.length}';
    
    if (_cachedConflicts != null && _lastConflictsCacheKey == cacheKey) {
      return _cachedConflicts!;
    }
    
    final allConflicts = <Map<String, dynamic>>[];
    
    for (final day in AppConstants.daysOfWeek) {
      final conflicts = widget.storageService.getConflictsForDay(day);
      allConflicts.addAll(conflicts);
    }
    
    _cachedConflicts = allConflicts;
    _lastConflictsCacheKey = cacheKey;
    return allConflicts;
  }

  @override
  Widget build(BuildContext context) {
    // Get all conflicts for the entire week
    final allConflicts = _getAllConflicts();
    
    return Container(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: allConflicts.isEmpty
          ? _buildNoConflictsMessage(context)
          : _buildConflictsList(context, allConflicts),
    );
  }
  
  // Build message for when there are no conflicts
  Widget _buildNoConflictsMessage(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 48,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          const Text(
            AppConstants.noConflicts,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
  
  // Build the list of conflicts
  Widget _buildConflictsList(BuildContext context, List<Map<String, dynamic>> conflicts) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Title
        Text(
          'Meeting Conflicts',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppConstants.defaultPadding),
        
        // Conflicts list
        Expanded(
          child: ListView.builder(
            itemCount: conflicts.length,
            itemBuilder: (context, index) {
              final conflict = conflicts[index];
              return _buildConflictItem(context, conflict);
            },
          ),
        ),
        
        // Key conflict days
        const SizedBox(height: AppConstants.defaultPadding),
        Text(
          'Key Conflict Days:',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: AppConstants.smallPadding),
        ..._buildKeyConflictDays(context),
      ],
    );
  }
  
  // Build a single conflict item
  Widget _buildConflictItem(BuildContext context, Map<String, dynamic> conflict) {
    final day = conflict['day'] as String;
    final time = conflict['time'] as String;
    final meetingIds = conflict['meetings'] as List<int>;
    
    // Get the actual meeting objects
    final meetings = meetingIds
        .map((id) => widget.storageService.getMeeting(id))
        .where((meeting) => meeting != null)
        .cast<Meeting>()
        .toList();
    
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      color: Theme.of(context).colorScheme.errorContainer.withOpacity(0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        side: BorderSide(
          color: Theme.of(context).colorScheme.error.withOpacity(0.5),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Day and time
            Row(
              children: [
                Icon(
                  Icons.warning_amber_rounded,
                  color: Theme.of(context).colorScheme.error,
                  size: 20,
                ),
                const SizedBox(width: AppConstants.smallPadding),
                Text(
                  '$day at $time',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppConstants.smallPadding),
            
            // Conflicting meetings
            const Text(
              'Conflicting meetings:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            
            ...meetings.map((meeting) {
              // Get category for this meeting
              final category = widget.storageService.getCategory(meeting.categoryId);
              
              return ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: category?.color ?? Colors.grey,
                    shape: BoxShape.circle,
                  ),
                ),
                title: Text(meeting.name),
                subtitle: Text(
                  meeting.requiresAttendance,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                onTap: () => widget.onMeetingTapped(meeting),
              );
            }).toList(),
            
            const SizedBox(height: AppConstants.smallPadding),
            
            // Recommendation
            Text(
              AppConstants.rotateRepresentatives,
              style: TextStyle(
                fontStyle: FontStyle.italic,
                color: Theme.of(context).colorScheme.error,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  // Build the key conflict days section
  List<Widget> _buildKeyConflictDays(BuildContext context) {
    return AppConstants.keyConflictDays.map((conflictDay) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• '),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: DefaultTextStyle.of(context).style,
                  children: [
                    TextSpan(
                      text: '${conflictDay['day']}: ',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextSpan(
                      text: conflictDay['conflicts'],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }).toList();
  }
}
