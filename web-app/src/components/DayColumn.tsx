import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import MeetingCard from './MeetingCard';
import { Meeting } from '../types';
import { useGlobalToast } from '../hooks/useGlobalToast';

interface DayColumnProps {
  day: string;
  onMeetingClick: (meeting: Meeting) => void;
}

export default function DayColumn({ day, onMeetingClick }: DayColumnProps) {
  const { getMeetingsForDay, currentWeekType, moveMeetingToDay, meetings, getMeeting } = useStore();
  const { showToast } = useGlobalToast();
  const [dayMeetings, setDayMeetings] = useState<Meeting[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedMeetingId, setDraggedMeetingId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const loadMeetings = async () => {
      const result = await getMeetingsForDay(day);
      if (!cancelled) {
        // Sort by start time as default order
        const sorted = [...result].sort((a, b) => {
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
  }, [day, currentWeekType, meetings]); // Refresh when day, week type, or meetings change

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

  return (
    <div
      ref={containerRef}
      className={`w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-2 sm:p-3 lg:p-4 flex flex-col min-h-0 transition-colors ${
        isDragOver
          ? 'border-primary bg-blue-50 dark:bg-blue-900/20 border-dashed'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 lg:mb-4 text-center text-sm sm:text-base">
        {day}
      </h3>
      <div className="space-y-1.5 sm:space-y-2 flex-1 overflow-y-auto">
        {dayMeetings.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm text-center py-4 sm:py-8">
            {isDragOver ? 'Drop meeting here' : 'No meetings'}
          </p>
        ) : (
          dayMeetings.map((meeting, index) => (
            <div key={meeting.id} data-meeting-id={meeting.id}>
              {/* Drop indicator */}
              {isDragOver && dragOverIndex === index && draggedMeetingId !== meeting.id && (
                <div className="h-0.5 bg-primary mb-1.5 sm:mb-2 rounded-full" />
              )}
              <MeetingCard
                meeting={meeting}
                onClick={() => onMeetingClick(meeting)}
                onDragStart={() => handleDragStart(meeting.id)}
                onDragEnd={handleDragEnd}
              />
              {/* Drop indicator at the end */}
              {isDragOver && dragOverIndex === dayMeetings.length && draggedMeetingId !== meeting.id && index === dayMeetings.length - 1 && (
                <div className="h-0.5 bg-primary mt-1.5 sm:mt-2 rounded-full" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

