import { useState } from 'react';
import { useStore } from '../store/useStore';
import TeamCalendar from './TeamCalendar';
import { Meeting } from '../types';

interface TeamsViewProps {
  onMeetingClick: (meeting: Meeting) => void;
}

export default function TeamsView({ onMeetingClick }: TeamsViewProps) {
  const { categories } = useStore();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());

  const toggleTeam = (categoryId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const isExpanded = expandedTeams.has(category.id);
        const color = `#${category.colorValue.toString(16).padStart(6, '0')}`;

        return (
          <div
            key={category.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Team Header with Twistie */}
            <button
              onClick={() => toggleTeam(category.id)}
              className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left touch-manipulation"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Twistie Icon */}
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {/* Color Indicator */}
                <div
                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                  {category.name}
                </h3>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                {isExpanded ? 'Collapse' : 'Expand'}
              </span>
            </button>

            {/* Team Calendar (shown when expanded) */}
            {isExpanded && (
              <div className="p-2 sm:p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700">
                <TeamCalendar
                  categoryId={category.id}
                  onMeetingClick={onMeetingClick}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

