import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Meeting } from '../types';
import { formatTime } from '../utils/timeUtils';
import { useGlobalToast } from '../hooks/useGlobalToast';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export default function MeetingCard({ meeting, onClick, onDragStart, onDragEnd }: MeetingCardProps) {
  const { getCategory, deleteMeeting, settings } = useStore();
  const { showToast } = useGlobalToast();
  const category = getCategory(meeting.categoryId);
  const color = category ? `#${category.colorValue.toString(16).padStart(6, '0')}` : '#6c757d';
  const [isDragging, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', meeting.id.toString());
    e.dataTransfer.setData('meetingId', meeting.id.toString());
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    onDragStart?.();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (confirm(`Are you sure you want to delete "${meeting.name}"?`)) {
      try {
        const meetingName = meeting.name;
        await deleteMeeting(meeting.id);
        showToast(`Meeting "${meetingName}" deleted successfully`, 'success');
      } catch (error) {
        showToast(`Failed to delete meeting: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`bg-white dark:bg-gray-700 border-l-4 rounded p-2 sm:p-3 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all cursor-move relative group ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      style={{ borderLeftColor: color }}
    >
      {/* Delete button - appears on hover */}
      {showDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors z-10"
          title="Delete meeting"
          aria-label="Delete meeting"
        >
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      <div className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2 pr-6">{meeting.name}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">
        {formatTime(meeting.startTime, settings.timeFormat)} - {formatTime(meeting.endTime, settings.timeFormat)}
      </div>
      {category && (
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {category.name}
        </div>
      )}
    </div>
  );
}

