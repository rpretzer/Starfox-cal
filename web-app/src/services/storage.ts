import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Meeting, Category, WeekType, ViewType, WeekTypeFilter } from '../types';
import { getDefaultMeetings } from '../models/meeting';
import { getDefaultCategories } from '../models/category';

interface CalendarDB extends DBSchema {
  meetings: {
    key: number;
    value: Meeting;
  };
  categories: {
    key: string;
    value: Category;
  };
  settings: {
    key: string;
    value: string | boolean;
  };
}

class StorageService {
  private db: IDBPDatabase<CalendarDB> | null = null;
  private currentWeekType: WeekTypeFilter = 'A';
  private currentView: ViewType = 'weekly';

  async init(): Promise<void> {
    try {
      this.db = await openDB<CalendarDB>('starfox-calendar', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('meetings')) {
            db.createObjectStore('meetings', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        },
      });

      // Load settings
      const weekType = await this.db.get('settings', 'currentWeekType');
      const view = await this.db.get('settings', 'currentView');
      
      if (weekType) this.currentWeekType = weekType as WeekTypeFilter;
      if (view) this.currentView = view as ViewType;

      // Initialize default data if empty
      const categories = await this.getAllCategories();
      if (categories.length === 0) {
        await this.initDefaultCategories();
      }

      const meetings = await this.getAllMeetings();
      if (meetings.length === 0) {
        await this.initDefaultMeetings();
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
      throw error;
    }
  }

  private async initDefaultCategories(): Promise<void> {
    const categories = getDefaultCategories();
    for (const category of categories) {
      await this.saveCategory(category);
    }
  }

  private async initDefaultMeetings(): Promise<void> {
    const meetings = getDefaultMeetings();
    for (const meeting of meetings) {
      await this.saveMeeting(meeting);
    }
  }

  // Meetings
  async getAllMeetings(): Promise<Meeting[]> {
    if (!this.db) return [];
    return this.db.getAll('meetings');
  }

  async getMeeting(id: number): Promise<Meeting | undefined> {
    if (!this.db) return undefined;
    return this.db.get('meetings', id);
  }

  async saveMeeting(meeting: Meeting): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('meetings', meeting);
  }

  async deleteMeeting(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('meetings', id);
  }

  getNextMeetingId(): Promise<number> {
    return this.getAllMeetings().then(meetings => {
      if (meetings.length === 0) return 1;
      const maxId = Math.max(...meetings.map(m => m.id));
      return maxId + 1;
    });
  }

  getMeetingsForDay(day: string): Promise<Meeting[]> {
    return this.getAllMeetings().then(meetings => {
      const weekTypeEnum = this.currentWeekType === 'A' ? WeekType.A : WeekType.B;
      return meetings.filter(meeting => {
        return meeting.days.includes(day) &&
          (meeting.weekType === WeekType.Both ||
           meeting.weekType === weekTypeEnum ||
           meeting.weekType === WeekType.Monthly ||
           meeting.weekType === WeekType.Quarterly);
      });
    });
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    if (!this.db) return [];
    return this.db.getAll('categories');
  }

  async getCategory(id: string): Promise<Category | undefined> {
    if (!this.db) return undefined;
    return this.db.get('categories', id);
  }

  async saveCategory(category: Category): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('categories', category);
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('categories', id);
  }

  // Settings
  async setCurrentWeekType(weekType: WeekTypeFilter): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.currentWeekType = weekType;
    await this.db.put('settings', weekType, 'currentWeekType');
  }

  async setCurrentView(view: ViewType): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    this.currentView = view;
    await this.db.put('settings', view, 'currentView');
  }

  getCurrentWeekType(): WeekTypeFilter {
    return this.currentWeekType;
  }

  getCurrentView(): ViewType {
    return this.currentView;
  }

  // Conflicts
  getConflictsForDay(day: string): Promise<Array<{ day: string; time: string; meetings: number[] }>> {
    return this.getMeetingsForDay(day).then(meetings => {
      const conflicts: Array<{ day: string; time: string; meetings: number[] }> = [];
      
      for (let i = 0; i < meetings.length; i++) {
        for (let j = i + 1; j < meetings.length; j++) {
          const meetingA = meetings[i];
          const meetingB = meetings[j];
          
          if (meetingA.startTime === meetingB.startTime) {
            conflicts.push({
              day,
              time: meetingA.startTime,
              meetings: [meetingA.id, meetingB.id],
            });
          }
        }
      }
      
      return conflicts;
    });
  }

  async moveMeetingToDay(meetingId: number, newDay: string): Promise<void> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) return;
    
    if (meeting.days.length > 1) {
      const newId = await this.getNextMeetingId();
      const newMeeting: Meeting = {
        ...meeting,
        id: newId,
        days: [newDay],
      };
      await this.saveMeeting(newMeeting);
    } else {
      const updatedMeeting: Meeting = {
        ...meeting,
        days: [newDay],
      };
      await this.saveMeeting(updatedMeeting);
    }
  }

  // Settings
  async getSettings(): Promise<{ monthlyViewEnabled: boolean }> {
    if (!this.db) return { monthlyViewEnabled: false };
    const enabled = await this.db.get('settings', 'monthlyViewEnabled');
    if (enabled === undefined || enabled === null) {
      return { monthlyViewEnabled: false };
    }
    // Handle both string and boolean values from storage
    if (typeof enabled === 'boolean') {
      return { monthlyViewEnabled: enabled };
    }
    if (typeof enabled === 'string') {
      return { monthlyViewEnabled: enabled === 'true' };
    }
    return { monthlyViewEnabled: false };
  }

  async setMonthlyViewEnabled(enabled: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    // Store as string to match settings schema, but we'll handle both types when reading
    await this.db.put('settings', enabled.toString(), 'monthlyViewEnabled');
  }
}

export const storageService = new StorageService();

