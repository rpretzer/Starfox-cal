import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  onClick: () => void;
}

export default function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  const { getCategory } = useStore();
  const category = getCategory(meeting.categoryId);
  const color = category ? `#${category.colorValue.toString(16).padStart(6, '0')}` : '#6c757d';
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', meeting.id.toString());
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`bg-white dark:bg-gray-700 border-l-4 rounded p-3 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all cursor-move ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      style={{ borderLeftColor: color }}
    >
      <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">{meeting.name}</div>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
        {meeting.startTime} - {meeting.endTime}
      </div>
      {category && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {category.name}
        </div>
      )}
    </div>
  );
}

