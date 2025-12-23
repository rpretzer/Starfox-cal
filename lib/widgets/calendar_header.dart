import 'package:flutter/material.dart';
import 'package:starfox_calendar/utils/constants.dart';

class CalendarHeader extends StatelessWidget {
  final String currentView;
  final String currentWeekType;
  final void Function(String) onViewChanged;
  final void Function(String) onWeekTypeChanged;
  
  const CalendarHeader({
    super.key,
    required this.currentView,
    required this.currentWeekType,
    required this.onViewChanged,
    required this.onWeekTypeChanged,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 600;
          
          return Container(
            padding: EdgeInsets.all(
              isMobile ? AppConstants.smallPadding : AppConstants.defaultPadding,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 2,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: isMobile
                ? _buildMobileLayout(context)
                : _buildDesktopLayout(context),
          );
        },
      ),
    );
  }
  
  // Mobile layout - stacked vertically
  Widget _buildMobileLayout(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // View selector
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'View:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            _buildViewSelector(context),
          ],
        ),
        
        const SizedBox(height: AppConstants.smallPadding),
        
        // Week type selector
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Week:',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 4),
            _buildWeekTypeSelector(context),
          ],
        ),
      ],
    );
  }
  
  // Desktop layout - side by side
  Widget _buildDesktopLayout(BuildContext context) {
    return Row(
      children: [
        // View selector
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'View:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              _buildViewSelector(context),
            ],
          ),
        ),
        
        const SizedBox(width: AppConstants.defaultPadding),
        
        // Week type selector
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Week:',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              _buildWeekTypeSelector(context),
            ],
          ),
        ),
      ],
    );
  }
  
  // Build the view selector (Weekly, Conflicts, Categories)
  Widget _buildViewSelector(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
        ),
      ),
      child: Row(
        children: [
          _buildViewOption(
            context,
            AppConstants.weeklyView, 
            'Weekly', 
            Icons.calendar_view_week,
          ),
          _buildViewOption(
            context,
            AppConstants.conflictsView, 
            'Conflicts', 
            Icons.warning,
          ),
          _buildViewOption(
            context,
            AppConstants.categoriesView, 
            'Categories', 
            Icons.category,
          ),
        ],
      ),
    );
  }
  
  // Build a single view option button
  Widget _buildViewOption(BuildContext context, String view, String label, IconData icon) {
    final isSelected = currentView == view;
    final isMobile = MediaQuery.of(context).size.width < 600;
    
    return Expanded(
      child: InkWell(
        onTap: () => onViewChanged(view),
        child: Container(
          padding: EdgeInsets.symmetric(
            vertical: isMobile ? 10 : 8,
            horizontal: isMobile ? 6 : 4,
          ),
          decoration: BoxDecoration(
            color: isSelected 
                ? Theme.of(context).colorScheme.primary 
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: isMobile ? 18 : 16,
                color: isSelected 
                    ? Colors.white 
                    : Theme.of(context).colorScheme.primary,
              ),
              SizedBox(width: isMobile ? 6 : 4),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: isMobile ? 13 : 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected 
                        ? Colors.white 
                        : Theme.of(context).colorScheme.primary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  // Build the week type selector (A or B)
  Widget _buildWeekTypeSelector(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.5),
        ),
      ),
      child: Row(
        children: [
          _buildWeekTypeOption(context, AppConstants.weekA, 'Week A'),
          _buildWeekTypeOption(context, AppConstants.weekB, 'Week B'),
        ],
      ),
    );
  }
  
  // Build a single week type option button
  Widget _buildWeekTypeOption(BuildContext context, String weekType, String label) {
    final isSelected = currentWeekType == weekType;
    
    return Expanded(
      child: InkWell(
        onTap: () => onWeekTypeChanged(weekType),
        child: Container(
          padding: const EdgeInsets.symmetric(
            vertical: 8,
            horizontal: 4,
          ),
          decoration: BoxDecoration(
            color: isSelected 
                ? Theme.of(context).colorScheme.primary 
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppConstants.cardBorderRadius),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected 
                    ? Colors.white 
                    : Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
