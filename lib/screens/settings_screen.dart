import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: Consumer<StorageService>(
        builder: (context, storageService, child) {
          return ListView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            children: [
              // Default View
              Card(
                child: ListTile(
                  leading: const Icon(Icons.view_week),
                  title: const Text('Default View'),
                  subtitle: Text(_getViewName(storageService.currentView)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showViewSelector(context, storageService),
                ),
              ),
              
              const SizedBox(height: AppConstants.smallPadding),
              
              // Default Week Type
              Card(
                child: ListTile(
                  leading: const Icon(Icons.calendar_today),
                  title: const Text('Default Week Type'),
                  subtitle: Text('Week ${storageService.currentWeekType}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => _showWeekTypeSelector(context, storageService),
                ),
              ),
              
              const SizedBox(height: AppConstants.largePadding),
              
              // Data Management
              const Text(
                'Data Management',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppConstants.smallPadding),
              
              Card(
                child: ListTile(
                  leading: const Icon(Icons.delete_outline, color: Colors.red),
                  title: const Text('Clear All Data'),
                  subtitle: const Text('Remove all meetings and reset to defaults'),
                  onTap: () => _showClearDataDialog(context, storageService),
                ),
              ),
              
              const SizedBox(height: AppConstants.largePadding),
              
              // About
              const Text(
                'About',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: AppConstants.smallPadding),
              
              Card(
                child: ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text('App Version'),
                  subtitle: const Text('1.0.0'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _getViewName(String view) {
    switch (view) {
      case AppConstants.weeklyView:
        return 'Weekly';
      case AppConstants.conflictsView:
        return 'Conflicts';
      case AppConstants.categoriesView:
        return 'Categories';
      default:
        return 'Weekly';
    }
  }

  void _showViewSelector(BuildContext context, StorageService storageService) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Weekly'),
              leading: const Icon(Icons.view_week),
              onTap: () {
                storageService.setCurrentView(AppConstants.weeklyView);
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('Conflicts'),
              leading: const Icon(Icons.warning),
              onTap: () {
                storageService.setCurrentView(AppConstants.conflictsView);
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('Categories'),
              leading: const Icon(Icons.category),
              onTap: () {
                storageService.setCurrentView(AppConstants.categoriesView);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showWeekTypeSelector(BuildContext context, StorageService storageService) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Week A'),
              onTap: () {
                storageService.setCurrentWeekType(AppConstants.weekA);
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('Week B'),
              onTap: () {
                storageService.setCurrentWeekType(AppConstants.weekB);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showClearDataDialog(BuildContext context, StorageService storageService) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear All Data'),
        content: const Text(
          'This will delete all meetings and reset the app to default data. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              // Clear all meetings
              for (final meeting in storageService.meetings) {
                await storageService.deleteMeeting(meeting.id);
              }
              // Reset to defaults
              await storageService.init();
              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All data cleared')),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }
}

