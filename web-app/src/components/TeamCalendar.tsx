import { useEffect, useState, useRef } from 'react';
import { DAYS_OF_WEEK } from '../constants';
import { useStore } from '../store/useStore';
import MeetingCard from './MeetingCard';
import { Meeting } from '../types';
import { useGlobalToast } from '../hooks/useGlobalToast';

interface TeamCalendarProps {
  categoryId: string;
  onMeetingClick: (meeting: Meeting) => void;
}

// Team-specific DayColumn that filters by category
function TeamDayColumn({ day, categoryId, onMeetingClick }: { day: string; categoryId: string; onMeetingClick: (meeting: Meeting) => void }) {
  const { getMeetingsForDay, currentWeekType, moveMeetingToDay, meetings, getMeeting } = useStore();
  const { showToast } = useGlobalToast();
  const [dayMeetings, setDayMeetings] = useState<Meeting[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedMeetingId, setDraggedMeetingId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchDragState = useRef<{
    isActive: boolean;
    meetingId: number | null;
    lastTouch: { x: number; y: number } | null;
  }>({ isActive: false, meetingId: null, lastTouch: null });

  useEffect(() => {
    let cancelled = false;
    const loadMeetings = async () => {
      const result = await getMeetingsForDay(day);
      // Filter by category
      const filtered = result.filter(m => m.categoryId === categoryId);
      if (!cancelled) {
        // Sort by start time as default order
        const sorted = [...filtered].sort((a, b) => {
          const timeA = a.startTime.toLowerCase();
          const timeB = b.startTime.toLowerCase();
          return timeA.localeCompare(timeB);
        });
        setDayMeetings(sorted);
      }
    };
    loadMeetings();
    return () => {
      cancelled = true;
    };
  }, [day, currentWeekType, categoryId, meetings]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    
    // Calculate which position the meeting is being dragged over
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const meetingElements = containerRef.current.querySelectorAll('[data-meeting-id]');
      
      let index = 0;
      for (let i = 0; i < meetingElements.length; i++) {
        const element = meetingElements[i] as HTMLElement;
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top - rect.top;
        const elementBottom = elementRect.bottom - rect.top;
        
        if (y >= elementTop && y <= elementBottom) {
          // Check if we're in the upper or lower half
          const midPoint = (elementTop + elementBottom) / 2;
          index = y < midPoint ? i : i + 1;
          break;
        } else if (y < elementTop) {
          index = i;
          break;
        } else {
          index = i + 1;
        }
      }
      
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const meetingIdStr = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('meetingId');
    const meetingId = parseInt(meetingIdStr, 10);
    if (isNaN(meetingId)) return;

    const draggedMeeting = dayMeetings.find(m => m.id === meetingId);
    const isSameColumn = draggedMeeting !== undefined;

    if (isSameColumn) {
      // Reordering within the same column
      const currentIndex = dayMeetings.findIndex(m => m.id === meetingId);
      if (currentIndex === -1) return;

      const targetIndex = dragOverIndex !== null ? dragOverIndex : currentIndex;
      
      // Don't do anything if dropped in the same position
      if (currentIndex === targetIndex) {
        setDragOverIndex(null);
        setDraggedMeetingId(null);
        return;
      }

      // Reorder the meetings array
      const newMeetings = [...dayMeetings];
      const [removed] = newMeetings.splice(currentIndex, 1);
      newMeetings.splice(targetIndex, 0, removed);
      
      setDayMeetings(newMeetings);
      setDragOverIndex(null);
      setDraggedMeetingId(null);
      // Toast for reordering (optional, can be silent)
    } else {
      // Moving to a different day
      try {
        const meeting = getMeeting(meetingId);
        await moveMeetingToDay(meetingId, day);
        if (meeting) {
          showToast(`Meeting "${meeting.name}" moved to ${day}`, 'success');
        }
      } catch (error) {
        showToast(`Failed to move meeting: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
    }
  };

  const handleDragStart = (meetingId: number) => {
    setDraggedMeetingId(meetingId);
  };

  const handleDragEnd = () => {
    setDraggedMeetingId(null);
    setDragOverIndex(null);
  };

  // Touch drop handler
  const handleTouchDrop = async (e: React.TouchEvent) => {
    if (!touchDragState.current.isActive || !touchDragState.current.meetingId) return;
    
    e.preventDefault();
    setIsDragOver(false);
    
    const meetingId = touchDragState.current.meetingId;
    const draggedMeeting = dayMeetings.find(m => m.id === meetingId);
    const isSameColumn = draggedMeeting !== undefined;

    if (isSameColumn) {
      const currentIndex = dayMeetings.findIndex(m => m.id === meetingId);
      if (currentIndex === -1) {
        touchDragState.current = { isActive: false, meetingId: null, lastTouch: null };
        return;
      }

      const targetIndex = dragOverIndex !== null ? dragOverIndex : currentIndex;
      
      if (currentIndex === targetIndex) {
        setDragOverIndex(null);
        touchDragState.current = { isActive: false, meetingId: null, lastTouch: null };
        return;
      }

      const newMeetings = [...dayMeetings];
      const [removed] = newMeetings.splice(currentIndex, 1);
      newMeetings.splice(targetIndex, 0, removed);
      
      setDayMeetings(newMeetings);
      setDragOverIndex(null);
      touchDragState.current = { isActive: false, meetingId: null, lastTouch: null };
    } else {
      try {
        const meeting = getMeeting(meetingId);
        await moveMeetingToDay(meetingId, day);
        if (meeting) {
          showToast(`Meeting "${meeting.name}" moved to ${day}`, 'success');
        }
      } catch (error) {
        showToast(`Failed to move meeting: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
      touchDragState.current = { isActive: false, meetingId: null, lastTouch: null };
    }
    
    setDraggedMeetingId(null);
  };

  // Listen for touch drag events from MeetingCard and handle document-level touch tracking
  useEffect(() => {
    const handleTouchDragStart = (e: CustomEvent) => {
      const meetingId = parseInt(e.detail?.meetingId || '0', 10);
      if (meetingId) {
        touchDragState.current = {
          isActive: true,
          meetingId,
          lastTouch: null,
        };
        setDraggedMeetingId(meetingId);
      }
    };

    const handleTouchDragEnd = () => {
      touchDragState.current = { isActive: false, meetingId: null, lastTouch: null };
      setIsDragOver(false);
      setDragOverIndex(null);
      setDraggedMeetingId(null);
    };

    // Track touch moves at document level to detect when dragging over this column
    const handleDocumentTouchMove = (e: TouchEvent) => {
      if (!touchDragState.current.isActive || !containerRef.current) return;
      
      const touch = e.touches[0];
      if (!touch) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const isOverColumn = touch.clientX >= rect.left && touch.clientX <= rect.right &&
                          touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      
      if (isOverColumn) {
        const y = touch.clientY - rect.top;
        setIsDragOver(true);
        
        // Calculate drop index
        const meetingElements = containerRef.current.querySelectorAll('[data-meeting-id]');
        let index = 0;
        for (let i = 0; i < meetingElements.length; i++) {
          const element = meetingElements[i] as HTMLElement;
          const elementRect = element.getBoundingClientRect();
          const elementTop = elementRect.top - rect.top;
          const elementBottom = elementRect.bottom - rect.top;
          
          if (y >= elementTop && y <= elementBottom) {
            const midPoint = (elementTop + elementBottom) / 2;
            index = y < midPoint ? i : i + 1;
            break;
          } else if (y < elementTop) {
            index = i;
            break;
          } else {
            index = i + 1;
          }
        }
        
        setDragOverIndex(index);
      } else {
        setIsDragOver(false);
        setDragOverIndex(null);
      }
    };

    window.addEventListener('touchdragstart' as any, handleTouchDragStart);
    window.addEventListener('touchdragend' as any, handleTouchDragEnd);
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });

    return () => {
      window.removeEventListener('touchdragstart' as any, handleTouchDragStart);
      window.removeEventListener('touchdragend' as any, handleTouchDragEnd);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
    };
  }, [dayMeetings, dragOverIndex, getMeeting, moveMeetingToDay, showToast]);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-3 flex flex-col min-h-0 transition-colors ${
        isDragOver
          ? 'border-primary bg-blue-50 dark:bg-blue-900/20 border-dashed'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onTouchEnd={handleTouchDrop}
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center text-sm">
        {day.substring(0, 3)}
      </h3>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {dayMeetings.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">
            {isDragOver ? 'Drop here' : 'No meetings'}
          </p>
        ) : (
          dayMeetings.map((meeting, index) => (
            <div key={meeting.id} data-meeting-id={meeting.id}>
              {/* Drop indicator */}
              {isDragOver && dragOverIndex === index && draggedMeetingId !== meeting.id && (
                <div className="h-0.5 bg-primary mb-2 rounded-full" />
              )}
              <MeetingCard
                meeting={meeting}
                onClick={() => onMeetingClick(meeting)}
                onDragStart={() => handleDragStart(meeting.id)}
                onDragEnd={handleDragEnd}
              />
              {/* Drop indicator at the end */}
              {isDragOver && dragOverIndex === dayMeetings.length && draggedMeetingId !== meeting.id && index === dayMeetings.length - 1 && (
                <div className="h-0.5 bg-primary mt-2 rounded-full" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TeamCalendar({ categoryId, onMeetingClick }: TeamCalendarProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        {DAYS_OF_WEEK.map((day) => (
          <TeamDayColumn
            key={day}
            day={day}
            categoryId={categoryId}
            onMeetingClick={onMeetingClick}
          />
        ))}
      </div>
    </div>
  );
}
