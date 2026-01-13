import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Category } from '../types';
import { getAvailableTimezones, getTimezoneDisplayName, getCurrentTimezone } from '../utils/timeUtils';
import { useGlobalToast } from '../hooks/useGlobalToast';
import { WEB_SAFE_COLORS, getNextAvailableColor, hexToNumber, numberToHex } from '../utils/colorPalette';
import CalendarSyncModal from './CalendarSyncModal';

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const {
    categories,
    settings,
    setMonthlyViewEnabled,
    setTimezone,
    setTimeFormat,
    saveCategory,
    deleteCategory,
    getCategory,
  } = useStore();

  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#4287f5');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { showToast } = useGlobalToast();

  // Get used colors from existing categories
  const usedColors = useMemo(() => categories.map(c => c.colorValue), [categories]);

  // Initialize with next available color
  useMemo(() => {
    if (!editingCategory && newCategoryName === '') {
      const nextColor = getNextAvailableColor(usedColors);
      setNewCategoryColor(nextColor);
    }
  }, [usedColors, editingCategory, newCategoryName]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast('Please enter a team name', 'warning');
      return;
    }
    const colorValue = hexToNumber(newCategoryColor);
    if (usedColors.includes(colorValue)) {
      showToast('This color is already used', 'warning');
      return;
    }
    try {
      const id = newCategoryName.toLowerCase().replace(/\s+/g, '-');
      await saveCategory({ id, name: newCategoryName.trim(), colorValue });
      setNewCategoryName('');
      setNewCategoryColor(getNextAvailableColor([...usedColors, colorValue]));
      showToast(`Team "${newCategoryName.trim()}" added`, 'success');
    } catch (error) {
      showToast(`Failed to add team: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    const colorValue = hexToNumber(newCategoryColor);
    const otherUsedColors = categories.filter(c => c.id !== editingCategory.id).map(c => c.colorValue);
    if (otherUsedColors.includes(colorValue)) {
      showToast('This color is already used', 'warning');
      return;
    }
    try {
      await saveCategory({ ...editingCategory, name: newCategoryName.trim(), colorValue });
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryColor(getNextAvailableColor(usedColors));
      showToast(`Team updated`, 'success');
    } catch (error) {
      showToast(`Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this team? Meetings will need to be reassigned.')) return;
    try {
      const category = getCategory(id);
      await deleteCategory(id);
      showToast(`Team "${category?.name}" deleted`, 'success');
    } catch (error) {
      showToast(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(numberToHex(category.colorValue));
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor(getNextAvailableColor(usedColors));
  };

  if (showCalendarSync) {
    return <CalendarSyncModal onClose={() => setShowCalendarSync(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">
              &times;
            </button>
          </div>

          <div className="space-y-6">
            {/* Display Settings */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Display
              </h3>
              <div className="space-y-3">
                {/* Time Format */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-gray-100">Time Format</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTimeFormat('12h')}
                      className={`px-3 py-1 rounded text-sm ${
                        settings.timeFormat === '12h'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      12h
                    </button>
                    <button
                      onClick={() => setTimeFormat('24h')}
                      className={`px-3 py-1 rounded text-sm ${
                        settings.timeFormat === '24h'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      24h
                    </button>
                  </div>
                </div>

                {/* Timezone */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-gray-100">Timezone</span>
                  <select
                    value={settings.timezone || getCurrentTimezone()}
                    onChange={(e) => setTimezone(e.target.value === getCurrentTimezone() ? undefined : e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm max-w-[200px]"
                  >
                    <option value={getCurrentTimezone()}>System ({getCurrentTimezone()})</option>
                    {getAvailableTimezones().map((tz) => (
                      <option key={tz} value={tz}>{getTimezoneDisplayName(tz)}</option>
                    ))}
                  </select>
                </div>

                {/* Monthly View */}
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-gray-100">Monthly View</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.monthlyViewEnabled}
                      onChange={(e) => setMonthlyViewEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </section>

            {/* Teams */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Teams
              </h3>

              {/* Add/Edit Form */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Team name"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    onKeyDown={(e) => e.key === 'Enter' && (editingCategory ? handleSaveCategory() : handleAddCategory())}
                  />
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
                    style={{ backgroundColor: newCategoryColor }}
                    title="Pick color"
                  />
                  {editingCategory ? (
                    <>
                      <button onClick={handleSaveCategory} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600">
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={handleAddCategory} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600">
                      Add
                    </button>
                  )}
                </div>

                {/* Color Picker */}
                {showColorPicker && (
                  <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-12 gap-1">
                      {WEB_SAFE_COLORS.slice(0, 48).map((color) => {
                        const colorValue = hexToNumber(color);
                        const isUsed = usedColors.includes(colorValue) &&
                          (!editingCategory || categories.find(c => c.id === editingCategory.id)?.colorValue !== colorValue);
                        const isSelected = newCategoryColor.toUpperCase() === color.toUpperCase();
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              if (!isUsed) {
                                setNewCategoryColor(color);
                                setShowColorPicker(false);
                              }
                            }}
                            disabled={isUsed}
                            className={`w-6 h-6 rounded border ${
                              isSelected ? 'ring-2 ring-primary border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'
                            } ${isUsed ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                            style={{ backgroundColor: color }}
                            title={isUsed ? 'Already used' : color}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Teams List */}
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No teams yet</p>
                ) : (
                  categories.map((category) => {
                    const color = numberToHex(category.colorValue);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded" style={{ backgroundColor: color }} />
                          <span className="text-gray-900 dark:text-gray-100">{category.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Calendar Sync */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                Integrations
              </h3>
              <button
                onClick={() => setShowCalendarSync(true)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-900 dark:text-gray-100">Calendar Sync</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
