import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Category } from '../types';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const {
    categories,
    settings,
    setMonthlyViewEnabled,
    saveCategory,
    deleteCategory,
  } = useStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4287f5');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const id = newCategoryName.toLowerCase().replace(/\s+/g, '-');
    const colorValue = parseInt(newCategoryColor.replace('#', ''), 16);
    
    saveCategory({
      id,
      name: newCategoryName.trim(),
      colorValue,
    });
    
    setNewCategoryName('');
    setNewCategoryColor('#4287f5');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(`#${category.colorValue.toString(16).padStart(6, '0')}`);
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    const colorValue = parseInt(newCategoryColor.replace('#', ''), 16);
    saveCategory({
      ...editingCategory,
      name: newCategoryName.trim(),
      colorValue,
    });
    
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#4287f5');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Meetings using this category will need to be updated.')) {
      return;
    }
    await deleteCategory(id);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#4287f5');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-8">
            {/* Monthly View Toggle */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                View Options
              </h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">Monthly View</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Enable monthly calendar view
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.monthlyViewEnabled}
                    onChange={(e) => setMonthlyViewEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </section>

            {/* Category Management */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Meeting Categories
              </h3>

              {/* Add/Edit Category Form */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        placeholder="#4287f5"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    {editingCategory ? (
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={handleSaveCategory}
                          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddCategory}
                        className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                      >
                        Add Category
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Category List */}
              <div className="space-y-2">
                {categories.map((category) => {
                  const color = `#${category.colorValue.toString(16).padStart(6, '0')}`;
                  return (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: color }}
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {category.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {category.id}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Meeting Series Management */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Meeting Series
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Meeting series management allows you to edit or delete all meetings in a recurring series at once.
                  This feature will be available in a future update.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

