import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

part 'category.g.dart';

@HiveType(typeId: 1)
class Category {
  @HiveField(0)
  final String id;
  
  @HiveField(1)
  final String name;
  
  @HiveField(2)
  final int colorValue;
  
  Category({
    required this.id,
    required this.name,
    required this.colorValue,
  });
  
  Color get color => Color(colorValue);
  
  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'],
      name: json['name'],
      colorValue: json['colorValue'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'colorValue': colorValue,
    };
  }
  
  Category copyWith({
    String? id,
    String? name,
    int? colorValue,
  }) {
    return Category(
      id: id ?? this.id,
      name: name ?? this.name,
      colorValue: colorValue ?? this.colorValue,
    );
  }
  
  // Initial categories that come with the app
  static List<Category> getDefaultCategories() {
    return [
      Category(id: 'starfox', name: 'Starfox Team', colorValue: 0xFF4287f5),
      Category(id: 'rds', name: 'RDS Team', colorValue: 0xFFf54242),
      Category(id: 'mblart', name: 'MBL ART', colorValue: 0xFF42f56f),
      Category(id: 'zelda', name: 'Zelda Sub-team', colorValue: 0xFFf5ad42),
      Category(id: 'enterprise', name: 'Enterprise-Wide', colorValue: 0xFF8442f5),
      Category(id: 'partners', name: 'Bank Partners', colorValue: 0xFFf5429e),
    ];
  }
}
