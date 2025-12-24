import 'package:flutter/material.dart';
import 'package:starfox_calendar/models/meeting.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';
import 'package:starfox_calendar/utils/datetime_utils.dart';

class MeetingDetailScreen extends StatefulWidget {
  final int meetingId;
  final StorageService storageService;
  
  const MeetingDetailScreen({
    super.key,
    required this.meetingId,
    required this.storageService,
  });

  @override
  State<MeetingDetailScreen> createState() => _MeetingDetailScreenState();
}

class _MeetingDetailScreenState extends State<MeetingDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Form controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _startTimeController = TextEditingController();
  final TextEditingController _endTimeController = TextEditingController();
  final TextEditingController _attendanceController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  final TextEditingController _assignedToController = TextEditingController();
  
  // Form values
  String _selectedCategoryId = '';
  String _selectedDayOfWeek = 'Monday';
  WeekType _selectedWeekType = WeekType.both;
  
  // Meeting being edited (null if adding a new meeting)
  Meeting? _meeting;
  
  // Initial load flag
  bool _isLoading = true;
  
  @override
  void initState() {
    super.initState();
    _loadMeeting();
  }
  
  @override
  void dispose() {
    // Dispose controllers
    _nameController.dispose();
    _startTimeController.dispose();
    _endTimeController.dispose();
    _attendanceController.dispose();
    _notesController.dispose();
    _assignedToController.dispose();
    super.dispose();
  }
  
  // Load meeting data (or initialize for a new meeting)
  void _loadMeeting() {
    if (widget.meetingId > 0) {
      // Editing an existing meeting
      _meeting = widget.storageService.getMeeting(widget.meetingId);
      
      if (_meeting != null) {
        // Populate form
        _nameController.text = _meeting!.name;
        
        // Extract start and end times
        final times = DateTimeUtils.splitTimeRange(_meeting!.time);
        _startTimeController.text = times['startTime'] ?? '';
        _endTimeController.text = times['endTime'] ?? '';
        
        _selectedCategoryId = _meeting!.categoryId;
        _selectedDayOfWeek = _meeting!.days.first; // Just use the first day for editing
        
        // Set week type
        _selectedWeekType = _meeting!.weekType;
        
        _attendanceController.text = _meeting!.requiresAttendance;
        _notesController.text = _meeting!.notes;
        _assignedToController.text = _meeting!.assignedTo;
      }
    } else {
      // Adding a new meeting
      final categories = widget.storageService.categories;
      if (categories.isNotEmpty) {
        _selectedCategoryId = categories.first.id;
      } else {
        // Fallback if no categories exist (shouldn't happen, but safety check)
        _selectedCategoryId = '';
      }
    }
    
    setState(() {
      _isLoading = false;
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_meeting == null ? AppConstants.addMeeting : AppConstants.editMeeting),
        actions: [
          if (_meeting != null)
            IconButton(
              icon: const Icon(Icons.delete),
              tooltip: AppConstants.tooltipDeleteMeeting,
              onPressed: _deleteMeeting,
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _buildForm(),
    );
  }
  
  // Build the form
  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(AppConstants.defaultPadding),
        children: [
          // Meeting name
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: AppConstants.name,
              hintText: 'Enter meeting name',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return AppConstants.errorNameRequired;
              }
              return null;
            },
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Category dropdown
          DropdownButtonFormField<String>(
            initialValue: _selectedCategoryId,
            decoration: const InputDecoration(
              labelText: AppConstants.category,
            ),
            items: widget.storageService.categories.map((category) {
              return DropdownMenuItem<String>(
                value: category.id,
                child: Row(
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: category.color,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(category.name),
                  ],
                ),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedCategoryId = value;
                });
              }
            },
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Week type dropdown
          DropdownButtonFormField<WeekType>(
            initialValue: _selectedWeekType,
            decoration: const InputDecoration(
              labelText: 'Frequency',
            ),
            items: WeekType.values.map((weekType) {
              return DropdownMenuItem<WeekType>(
                value: weekType,
                child: Text(AppConstants.frequencyLabels[weekType.toString().split('.').last] ?? ''),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedWeekType = value;
                });
              }
            },
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Day of week dropdown
          DropdownButtonFormField<String>(
            initialValue: _selectedDayOfWeek,
            decoration: const InputDecoration(
              labelText: AppConstants.day,
            ),
            items: AppConstants.daysOfWeek.map((day) {
              return DropdownMenuItem<String>(
                value: day,
                child: Text(day),
              );
            }).toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _selectedDayOfWeek = value;
                });
              }
            },
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Time inputs (start and end)
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _startTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Start Time',
                    hintText: 'e.g. 10:00 AM',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Required';
                    }
                    if (DateTimeUtils.parseTime(value) == null) {
                      return 'Invalid format';
                    }
                    return null;
                  },
                  onTap: () => _selectTime(context, _startTimeController),
                  readOnly: true,
                ),
              ),
              const SizedBox(width: AppConstants.defaultPadding),
              Expanded(
                child: TextFormField(
                  controller: _endTimeController,
                  decoration: const InputDecoration(
                    labelText: 'End Time',
                    hintText: 'e.g. 11:00 AM',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Required';
                    }
                    if (DateTimeUtils.parseTime(value) == null) {
                      return 'Invalid format';
                    }
                    
                    // Check if end time is after start time
                    final startTime = _startTimeController.text;
                    if (startTime.isNotEmpty && 
                        DateTimeUtils.compareTime(value, startTime) <= 0) {
                      return 'Must be after start';
                    }
                    
                    return null;
                  },
                  onTap: () => _selectTime(context, _endTimeController),
                  readOnly: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Required attendance
          TextFormField(
            controller: _attendanceController,
            decoration: const InputDecoration(
              labelText: AppConstants.requiredAttendance,
              hintText: 'e.g. All Starfox members',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return AppConstants.errorAttendanceRequired;
              }
              return null;
            },
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Notes (optional)
          TextFormField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: AppConstants.notes,
              hintText: 'Optional notes about this meeting',
            ),
            maxLines: 3,
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          
          // Assigned to (optional)
          TextFormField(
            controller: _assignedToController,
            decoration: const InputDecoration(
              labelText: AppConstants.assignedTo,
              hintText: 'Optional person responsible',
            ),
          ),
          const SizedBox(height: AppConstants.largePadding),
          
          // Save and cancel buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text(AppConstants.cancel),
              ),
              const SizedBox(width: AppConstants.defaultPadding),
              ElevatedButton(
                onPressed: _saveMeeting,
                child: const Text(AppConstants.save),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  // Show time picker for selecting start or end time
  Future<void> _selectTime(BuildContext context, TextEditingController controller) async {
    final initialTime = DateTimeUtils.parseTime(controller.text) ?? 
        DateTime(DateTime.now().year, 1, 1, 9, 0); // Default to 9:00 AM
    
    TimeOfDay? pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: initialTime.hour, minute: initialTime.minute),
    );
    
    if (pickedTime != null) {
      final dateTime = DateTime(
        DateTime.now().year,
        1,
        1,
        pickedTime.hour,
        pickedTime.minute,
      );
      
      setState(() {
        controller.text = DateTimeUtils.formatTime(dateTime);
      });
    }
  }
  
  // Save meeting
  void _saveMeeting() async {
    if (_formKey.currentState?.validate() ?? false) {
      // Form is valid
      
      // Prepare meeting data
      final id = _meeting?.id ?? widget.storageService.getNextMeetingId();
      final name = _nameController.text;
      final startTime = _startTimeController.text;
      final endTime = _endTimeController.text;
      
      // Create or update meeting
      final meeting = Meeting(
        id: id,
        name: name,
        categoryId: _selectedCategoryId,
        days: [_selectedDayOfWeek],
        startTime: startTime,
        endTime: endTime,
        weekType: _selectedWeekType,
        requiresAttendance: _attendanceController.text,
        notes: _notesController.text,
        assignedTo: _assignedToController.text,
      );
      
      // Save to storage
      await widget.storageService.saveMeeting(meeting);
      
      // Return to previous screen
      if (mounted) {
        Navigator.pop(context, true);
      }
    }
  }
  
  // Delete meeting
  void _deleteMeeting() async {
    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(AppConstants.deleteMeeting),
        content: const Text('Are you sure you want to delete this meeting?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(AppConstants.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              AppConstants.delete,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );
    
    // Delete if confirmed
    if (confirmed == true && _meeting != null) {
      await widget.storageService.deleteMeeting(_meeting!.id);
      
      // Return to previous screen
      if (mounted) {
        Navigator.pop(context, false);
      }
    }
  }
}
