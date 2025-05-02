import 'package:hive/hive.dart';

part 'meeting.g.dart';

enum WeekType {
  both,       // Every week
  a,          // Week A only
  b,          // Week B only
  monthly,    // Monthly
  quarterly   // Quarterly
}

@HiveType(typeId: 0)
class Meeting {
  @HiveField(0)
  final int id;
  
  @HiveField(1)
  final String name;
  
  @HiveField(2)
  final String categoryId;
  
  @HiveField(3)
  final List<String> days;
  
  @HiveField(4)
  final String startTime;
  
  @HiveField(5)
  final String endTime;
  
  @HiveField(6)
  final WeekType weekType;
  
  @HiveField(7)
  final String requiresAttendance;
  
  @HiveField(8)
  final String notes;
  
  @HiveField(9)
  final String assignedTo;
  
  Meeting({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.days,
    required this.startTime,
    required this.endTime,
    required this.weekType,
    required this.requiresAttendance,
    this.notes = '',
    this.assignedTo = '',
  });
  
  String get time => '$startTime - $endTime';
  
  factory Meeting.fromJson(Map<String, dynamic> json) {
    return Meeting(
      id: json['id'],
      name: json['name'],
      categoryId: json['categoryId'],
      days: List<String>.from(json['days']),
      startTime: json['startTime'],
      endTime: json['endTime'],
      weekType: WeekType.values.firstWhere(
        (e) => e.toString().split('.').last == json['weekType'].toString().toLowerCase(),
        orElse: () => WeekType.both,
      ),
      requiresAttendance: json['requiresAttendance'],
      notes: json['notes'] ?? '',
      assignedTo: json['assignedTo'] ?? '',
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'categoryId': categoryId,
      'days': days,
      'startTime': startTime,
      'endTime': endTime,
      'weekType': weekType.toString().split('.').last,
      'requiresAttendance': requiresAttendance,
      'notes': notes,
      'assignedTo': assignedTo,
    };
  }
  
  Meeting copyWith({
    int? id,
    String? name,
    String? categoryId,
    List<String>? days,
    String? startTime,
    String? endTime,
    WeekType? weekType,
    String? requiresAttendance,
    String? notes,
    String? assignedTo,
  }) {
    return Meeting(
      id: id ?? this.id,
      name: name ?? this.name,
      categoryId: categoryId ?? this.categoryId,
      days: days ?? List.from(this.days),
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      weekType: weekType ?? this.weekType,
      requiresAttendance: requiresAttendance ?? this.requiresAttendance,
      notes: notes ?? this.notes,
      assignedTo: assignedTo ?? this.assignedTo,
    );
  }
  
  // Get default meetings data
  static List<Meeting> getDefaultMeetings() {
    return [
      // Starfox Team Meetings
      Meeting(
        id: 1,
        name: 'Daily Stand-up',
        categoryId: 'starfox',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        startTime: '10:00 AM',
        endTime: '10:30 AM',
        weekType: WeekType.both,
        requiresAttendance: 'All Starfox members',
        notes: 'Daily collaboration and blockers discussion',
      ),
      Meeting(
        id: 2,
        name: 'Developer Sync',
        categoryId: 'starfox',
        days: ['Monday'],
        startTime: '2:00 PM',
        endTime: '3:00 PM',
        weekType: WeekType.both,
        requiresAttendance: 'MBL ART devs, testers + 1 RDS rep',
        notes: 'Weekly technical sync',
      ),
      Meeting(
        id: 3,
        name: 'Lead Sync',
        categoryId: 'starfox',
        days: ['Friday'],
        startTime: '12:00 PM',
        endTime: '1:00 PM',
        weekType: WeekType.both,
        requiresAttendance: 'Team leads from RDS and MBL ART',
        notes: 'Weekly leadership alignment',
      ),
      Meeting(
        id: 4,
        name: 'Iteration Retro and Planning',
        categoryId: 'starfox',
        days: ['Tuesday'],
        startTime: '4:00 PM',
        endTime: '5:00 PM',
        weekType: WeekType.a,
        requiresAttendance: 'All Starfox members',
        notes: 'Biweekly retrospective and planning',
      ),
      Meeting(
        id: 5,
        name: 'Design Backlog Refinement',
        categoryId: 'starfox',
        days: ['Tuesday'],
        startTime: '4:05 PM',
        endTime: '5:00 PM',
        weekType: WeekType.b,
        requiresAttendance: 'RDS designers + 1 dev rep',
        notes: 'Biweekly design work refinement',
      ),
      
      // Add more meetings here...
      // RDS Team Meetings
      Meeting(
        id: 7,
        name: 'RDS Daily Stand-up',
        categoryId: 'rds',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '12:00 PM',
        endTime: '12:30 PM',
        weekType: WeekType.both,
        requiresAttendance: 'RDS designers',
        notes: 'Daily RDS team sync',
      ),
      
      // Add the rest of your meetings here...
    ];
  }
}
