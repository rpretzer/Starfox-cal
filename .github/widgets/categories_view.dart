import 'package:flutter/material.dart';
import 'package:starfox_calendar/models/category.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
import 'package:starfox_calendar/widgets/representation_strategy_card.dart';

class CategoriesView extends StatelessWidget {
  final StorageService storageService;
  final Function(Meeting) onMeetingTapped;
  
  const CategoriesView({
    super.key,
    required this.storageService,
    required this.onMeetingTapped,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Categories list
        Expanded(
          child: _buildCategoriesList(context),
        ),
        
        // Representation strategy card
        const RepresentationStrategyCard(),
      ],
    );
  }
  
  // Build the categories list
  Widget _buildCategoriesList(BuildContext context) {
    final categories = storageService.categories;
    
    return ListView.builder(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final category = categories[index];
        return _buildCategoryCard(context, category);
      },
    );
  }
  
  // Build a single category card with its meetings
  Widget _buildCategoryCard(BuildContext context, Category category) {
    // Get all meetings for this category
    final meetings = storageService.meetings
        .where((meeting) => meeting.categoryId == category.id)
        .toList();
    
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
      ),
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category header
          Container(
            padding: const EdgeInsets.symmetric(
              vertical: AppConstants.smallPadding,
              horizontal: AppConstants.defaultPadding,
            ),
            color: category.color,
            width: double.infinity,
            child: Text(
              category.name,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          
          // Meetings table
          Padding(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            child: meetings.isEmpty
                ? _buildEmptyCategory()
                : _buildMeetingsTable(context, meetings),
          ),
        ],
      ),
    );
  }
  
  // Build empty category message
  Widget _buildEmptyCategory() {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: AppConstants.smallPadding),
      child: Text(
        'No meetings in this category',
        style: TextStyle(
          fontStyle: FontStyle.italic,
          color: Colors.grey,
        ),
      ),
    );
  }
  
  // Build the meetings table for a category
  Widget _buildMeetingsTable(BuildContext context, List<Meeting> meetings) {
    return Table(
      columnWidths: const {
        0: FlexColumnWidth(2),    // Meeting name
        1: FlexColumnWidth(1.5),  // Day & Time
        2: FlexColumnWidth(1),    // Frequency
        3: FlexColumnWidth(2),    // Required Attendance
        4: FlexColumnWidth(1),    // Assigned To
      },
      border: TableBorder.all(
        color: Colors.grey.shade300,
        width: 1,
      ),
      children: [
        // Table header
        TableRow(
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
          ),
          children: [
            _buildTableHeaderCell('Meeting'),
            _buildTableHeaderCell('Day & Time'),
            _buildTableHeaderCell('Frequency'),
            _buildTableHeaderCell('Required Attendance'),
            _buildTableHeaderCell('Assigned To'),
          ],
        ),
        
        // Table rows for each meeting
        ...meetings.map((meeting) => TableRow(
          children: [
            _buildTableCell(
              meeting.name,
              onTap: () => onMeetingTapped(meeting),
            ),
            _buildTableCell(
              '${meeting.days.join(", ")}\n${meeting.time}',
            ),
            _buildTableCell(
              _getFrequencyLabel(meeting.weekType),
            ),
            _buildTableCell(
              meeting.requiresAttendance,
            ),
            _buildTableCell(
              meeting.assignedTo.isEmpty ? 'Unassigned' : meeting.assignedTo,
            ),
          ],
        )).toList(),
      ],
    );
  }
  
  // Build a table header cell
  Widget _buildTableHeaderCell(String text) {
    return Padding(
      padding: const EdgeInsets.all(6.0),
      child: Text(
        text,
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }
  
  // Build a regular table cell
  Widget _buildTableCell(String text, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(6.0),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: onTap != null ? Colors.blue : null,
            decoration: onTap != null ? TextDecoration.underline : null,
          ),
        ),
      ),
    );
  }
  
  // Get frequency label from WeekType
  String _getFrequencyLabel(WeekType weekType) {
    final typeStr = weekType.toString().split('.').last;
    return AppConstants.frequencyLabels[typeStr] ?? 'Unknown';
  }
}
