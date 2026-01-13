import { useState } from 'react';
import { useStore } from '../store/useStore';
import TeamCalendar from './TeamCalendar';
import { Meeting } from '../types';
import ConflictsContainer from './ConflictsContainer';

interface TeamsViewProps {
  onMeetingClick: (meeting: Meeting) => void;
  onCreateMeeting?: (day: string, categoryId: string) => void;
}

export default function TeamsView({ onMeetingClick, onCreateMeeting }: TeamsViewProps) {
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

  // Show empty state if no categories
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No teams yet
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
          Go to Settings to add teams (categories) and organize your meetings by team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ConflictsContainer onMeetingClick={onMeetingClick} />
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
                  onCreateMeeting={onCreateMeeting}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

