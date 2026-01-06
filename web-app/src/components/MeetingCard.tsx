import { useState, useRef } from 'react';
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
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isTouchDragging = useRef(false);
  const cardElementRef = useRef<HTMLDivElement | null>(null);

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

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      isTouchDragging.current = true;
      setIsDragging(true);
      
      // Create drag data similar to HTML5 drag
      const dragEvent = {
        dataTransfer: {
          effectAllowed: 'move',
          setData: (format: string, data: string) => {
            // Store data for touch drag
            (e.currentTarget as HTMLElement).setAttribute(`data-drag-${format}`, data);
          },
          getData: (format: string) => {
            return (e.currentTarget as HTMLElement).getAttribute(`data-drag-${format}`) || '';
          },
        },
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as any;
      
      dragEvent.dataTransfer.setData('text/plain', meeting.id.toString());
      dragEvent.dataTransfer.setData('meetingId', meeting.id.toString());
      
      // Create visual feedback
      const element = e.currentTarget as HTMLDivElement;
      cardElementRef.current = element;
      element.style.opacity = '0.5';
      element.style.transform = 'scale(0.95)';
      
      // Create drag ghost
      const dragImage = element.cloneNode(true) as HTMLElement;
      dragImage.style.position = 'fixed';
      dragImage.style.top = `${touch.clientY - 20}px`;
      dragImage.style.left = `${touch.clientX - 20}px`;
      dragImage.style.pointerEvents = 'none';
      dragImage.style.zIndex = '10000';
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'rotate(2deg)';
      dragImage.style.width = `${element.offsetWidth}px`;
      dragImage.id = `touch-drag-ghost-${meeting.id}`;
      document.body.appendChild(dragImage);
      
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      
      // Dispatch custom event for touch drag start
      const touchDragStartEvent = new CustomEvent('touchdragstart', {
        detail: { meetingId: meeting.id },
        bubbles: true,
      });
      window.dispatchEvent(touchDragStartEvent);
      
      onDragStart?.();
    }, 500); // 500ms long press
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDragging.current) {
      // Cancel long press if user moves too much
      if (touchStartPos.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
        
        if (deltaX > 10 || deltaY > 10) {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    
    // Update drag ghost position
    const dragGhost = document.getElementById(`touch-drag-ghost-${meeting.id}`);
    if (dragGhost) {
      dragGhost.style.top = `${touch.clientY - 20}px`;
      dragGhost.style.left = `${touch.clientX - 20}px`;
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isTouchDragging.current) {
      return;
    }

    // Clean up drag ghost
    const dragGhost = document.getElementById(`touch-drag-ghost-${meeting.id}`);
    if (dragGhost) {
      document.body.removeChild(dragGhost);
    }

    // Restore element style
    if (cardElementRef.current) {
      cardElementRef.current.style.opacity = '';
      cardElementRef.current.style.transform = '';
    }

    // Restore scrolling
    document.body.style.overflow = '';

    isTouchDragging.current = false;
    touchStartPos.current = null;

    // Dispatch custom event for touch drag end
    const touchDragEndEvent = new CustomEvent('touchdragend', {
      bubbles: true,
    });
    window.dispatchEvent(touchDragEndEvent);

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
      ref={cardElementRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        // Only trigger onClick if not dragging
        if (!isTouchDragging.current && !isDragging) {
          onClick();
        }
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className={`bg-white dark:bg-gray-700 border-l-4 rounded p-2 sm:p-3 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all cursor-move relative group touch-manipulation ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      style={{ borderLeftColor: color }}
    >
      {/* Action buttons - appear on hover */}
      {showDelete && (
        <div className="absolute top-1 right-1 flex gap-1 z-10">
          {meeting.meetingLink && (
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors"
              title={`Open ${meeting.meetingLinkType === 'zoom' ? 'Zoom' : meeting.meetingLinkType === 'teams' ? 'Teams' : meeting.meetingLinkType === 'meet' ? 'Meet' : 'meeting'} link`}
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
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </a>
          )}
          <button
            onClick={handleDelete}
            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
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
        </div>
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

