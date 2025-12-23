import 'package:flutter/material.dart';
import 'package:starfox_calendar/models/category.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
import 'package:starfox_calendar/utils/datetime_utils.dart';

class MeetingCard extends StatelessWidget {
  final Meeting meeting;
  final StorageService storageService;
  final VoidCallback onTap;
  
  const MeetingCard({
    super.key,
    required this.meeting,
    required this.storageService,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Get the category for this meeting
    final category = storageService.getCategory(meeting.categoryId);
    
    return RepaintBoundary(
      child: Draggable<int>(
      data: meeting.id,
      feedback: Material(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        elevation: 8,
        child: Container(
          width: 200,
          padding: const EdgeInsets.all(AppConstants.smallPadding),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                meeting.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                meeting.time,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.5,
        child: _buildCard(context, category),
      ),
      child: _buildCard(context, category),
      ),
    );
  }
  
  // Build the actual card UI
  Widget _buildCard(BuildContext context, Category? category) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.smallPadding),
      clipBehavior: Clip.antiAlias,
      color: Theme.of(context).cardColor,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        side: BorderSide(
          color: category?.color ?? Colors.grey,
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppConstants.smallPadding),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Meeting name
                  Text(
                    meeting.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // Meeting time
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time,
                        size: 12,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        meeting.time,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      
                      // Duration (if both times are valid)
                      Expanded(
                        child: Builder(
                          builder: (context) {
                            final duration = DateTimeUtils.formatTimeDifference(
                              meeting.startTime, 
                              meeting.endTime
                            );
                            
                            if (duration.isNotEmpty) {
                              return Text(
                                ' ($duration)',
                                style: Theme.of(context).textTheme.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              );
                            } else {
                              return const SizedBox.shrink();
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // Required attendance
                  Text(
                    'Who: ${meeting.requiresAttendance}',
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
              
              // Info icon for showing tooltip
              Positioned(
                top: 0,
                right: 0,
                child: _buildInfoIcon(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  // Build the info icon that shows additional info when tapped
  Widget _buildInfoIcon(BuildContext context) {
    // Only show icon if there are notes or someone assigned
    if (meeting.notes.isEmpty && meeting.assignedTo.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return GestureDetector(
      onTap: () => _showTooltip(context),
      child: Container(
        width: 20,
        height: 20,
        decoration: BoxDecoration(
          color: Colors.grey.withOpacity(0.3),
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Icon(
            Icons.info_outline,
            size: 12,
            color: Colors.grey,
          ),
        ),
      ),
    );
  }
  
  // Show tooltip with meeting details
  void _showTooltip(BuildContext context) {
    final List<String> content = [];
    
    if (meeting.notes.isNotEmpty) {
      content.add('Notes: ${meeting.notes}');
    }
    
    if (meeting.assignedTo.isNotEmpty) {
      content.add('Assigned to: ${meeting.assignedTo}');
    }
    
    if (content.isEmpty) {
      content.add('No additional information available');
    }
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(meeting.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: content.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Text(item),
          )).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
