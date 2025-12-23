// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'meeting.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MeetingAdapter extends TypeAdapter<Meeting> {
  @override
  final int typeId = 0;

  @override
  Meeting read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Meeting(
      id: fields[0] as int,
      name: fields[1] as String,
      categoryId: fields[2] as String,
      days: (fields[3] as List).cast<String>(),
      startTime: fields[4] as String,
      endTime: fields[5] as String,
      weekType: fields[6] as WeekType,
      requiresAttendance: fields[7] as String,
      notes: fields[8] as String,
      assignedTo: fields[9] as String,
    );
  }

  @override
  void write(BinaryWriter writer, Meeting obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.categoryId)
      ..writeByte(3)
      ..write(obj.days)
      ..writeByte(4)
      ..write(obj.startTime)
      ..writeByte(5)
      ..write(obj.endTime)
      ..writeByte(6)
      ..write(obj.weekType)
      ..writeByte(7)
      ..write(obj.requiresAttendance)
      ..writeByte(8)
      ..write(obj.notes)
      ..writeByte(9)
      ..write(obj.assignedTo);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MeetingAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class WeekTypeAdapter extends TypeAdapter<WeekType> {
  @override
  final int typeId = 2;

  @override
  WeekType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return WeekType.both;
      case 1:
        return WeekType.a;
      case 2:
        return WeekType.b;
      case 3:
        return WeekType.monthly;
      case 4:
        return WeekType.quarterly;
      default:
        return WeekType.both;
    }
  }

  @override
  void write(BinaryWriter writer, WeekType obj) {
    switch (obj) {
      case WeekType.both:
        writer.writeByte(0);
        break;
      case WeekType.a:
        writer.writeByte(1);
        break;
      case WeekType.b:
        writer.writeByte(2);
        break;
      case WeekType.monthly:
        writer.writeByte(3);
        break;
      case WeekType.quarterly:
        writer.writeByte(4);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is WeekTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
