import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:starfox_calendar/models/category.dart';
import 'package:starfox_calendar/services/storage_service.dart';
import 'package:starfox_calendar/utils/constants.dart';

class CategoryManagementScreen extends StatefulWidget {
  const CategoryManagementScreen({super.key});

  @override
  State<CategoryManagementScreen> createState() => _CategoryManagementScreenState();
}

class _CategoryManagementScreenState extends State<CategoryManagementScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Categories'),
      ),
      body: Consumer<StorageService>(
        builder: (context, storageService, child) {
          final categories = storageService.categories;
          
          return ListView(
            padding: const EdgeInsets.all(AppConstants.defaultPadding),
            children: [
              // Add category button
              ElevatedButton.icon(
                onPressed: () => _showAddCategoryDialog(context, storageService),
                icon: const Icon(Icons.add),
                label: const Text('Add Category'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.all(AppConstants.defaultPadding),
                ),
              ),
              
              const SizedBox(height: AppConstants.largePadding),
              
              // Categories list
              if (categories.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppConstants.largePadding),
                    child: Text(
                      'No categories yet. Add one to get started!',
                      style: TextStyle(
                        color: Colors.grey,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                )
              else
                ...categories.map((category) => _buildCategoryCard(
                  context,
                  category,
                  storageService,
                )).toList(),
            ],
          );
        },
      ),
    );
  }
  
  Widget _buildCategoryCard(
    BuildContext context,
    Category category,
    StorageService storageService,
  ) {
    // Check if category is in use
    final isInUse = storageService.meetings.any(
      (meeting) => meeting.categoryId == category.id,
    );
    
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.defaultPadding),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: category.color,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        title: Text(category.name),
        subtitle: isInUse
            ? const Text(
                'In use',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              )
            : null,
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => _showEditCategoryDialog(
                context,
                category,
                storageService,
              ),
              tooltip: 'Edit category',
            ),
            IconButton(
              icon: const Icon(Icons.delete),
              color: isInUse ? Colors.grey : Colors.red,
              onPressed: isInUse
                  ? null
                  : () => _showDeleteCategoryDialog(
                        context,
                        category,
                        storageService,
                      ),
              tooltip: isInUse ? 'Cannot delete: category in use' : 'Delete category',
            ),
          ],
        ),
      ),
    );
  }
  
  void _showAddCategoryDialog(
    BuildContext context,
    StorageService storageService,
  ) {
    _showCategoryDialog(
      context,
      storageService,
      category: null,
    );
  }
  
  void _showEditCategoryDialog(
    BuildContext context,
    Category category,
    StorageService storageService,
  ) {
    _showCategoryDialog(
      context,
      storageService,
      category: category,
    );
  }
  
  void _showCategoryDialog(
    BuildContext context,
    StorageService storageService, {
    Category? category,
  }) {
    final nameController = TextEditingController(
      text: category?.name ?? '',
    );
    Color selectedColor = category?.color ?? Colors.blue;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(category == null ? 'Add Category' : 'Edit Category'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Category Name',
                    hintText: 'Enter category name',
                  ),
                  autofocus: true,
                ),
                const SizedBox(height: AppConstants.defaultPadding),
                const Text(
                  'Color:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppConstants.smallPadding),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _getColorOptions().map((color) {
                    final isSelected = selectedColor.value == color.value;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          selectedColor = color;
                        });
                      },
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected ? Colors.black : Colors.transparent,
                            width: 3,
                          ),
                        ),
                        child: isSelected
                            ? const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 20,
                              )
                            : null,
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                final name = nameController.text.trim();
                if (name.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Category name cannot be empty'),
                    ),
                  );
                  return;
                }
                
                // Check if name already exists (excluding current category)
                final existingCategory = storageService.categories.firstWhere(
                  (c) => c.name.toLowerCase() == name.toLowerCase() && 
                         (category == null || c.id != category.id),
                  orElse: () => Category(
                    id: '',
                    name: '',
                    colorValue: 0,
                  ),
                );
                
                if (existingCategory.id.isNotEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('A category with this name already exists'),
                    ),
                  );
                  return;
                }
                
                final categoryToSave = category?.copyWith(
                      name: name,
                      colorValue: selectedColor.value,
                    ) ??
                    Category(
                      id: name.toLowerCase().replaceAll(' ', '_'),
                      name: name,
                      colorValue: selectedColor.value,
                    );
                
                storageService.saveCategory(categoryToSave);
                Navigator.pop(context);
              },
              child: Text(category == null ? 'Add' : 'Save'),
            ),
          ],
        ),
      ),
    );
  }
  
  void _showDeleteCategoryDialog(
    BuildContext context,
    Category category,
    StorageService storageService,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Category'),
        content: Text(
          'Are you sure you want to delete "${category.name}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              await storageService.deleteCategory(category.id);
              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Category "${category.name}" deleted'),
                  ),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  List<Color> _getColorOptions() {
    return [
      Colors.blue,
      Colors.red,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.pink,
      Colors.teal,
      Colors.indigo,
      Colors.cyan,
      Colors.amber,
      Colors.brown,
      Colors.grey,
    ];
  }
}

