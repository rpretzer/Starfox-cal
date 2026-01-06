import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Meeting, Category, WeekType, ViewType, WeekTypeFilter, MeetingSeries, CalendarSyncConfig, AppSettings } from '../types';
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
  syncConfigs: {
    key: string; // provider + name as key
    value: CalendarSyncConfig;
  };
}

class StorageService {
  private db: IDBPDatabase<CalendarDB> | null = null;
  private currentWeekType: WeekTypeFilter = 'A';
  private currentView: ViewType = 'weekly';

  async init(): Promise<void> {
    try {
      this.db = await openDB<CalendarDB>('starfox-calendar', 2, {
        upgrade(db, oldVersion) {
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('meetings')) {
              db.createObjectStore('meetings', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('categories')) {
              db.createObjectStore('categories', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings');
            }
          }
          if (oldVersion < 2) {
            // Add syncConfigs store for calendar sync
            if (!db.objectStoreNames.contains('syncConfigs')) {
              db.createObjectStore('syncConfigs', { keyPath: 'id' });
            }
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
  async getSettings(): Promise<AppSettings> {
    if (!this.db) return { monthlyViewEnabled: false, timeFormat: '12h' };
    const monthlyEnabled = await this.db.get('settings', 'monthlyViewEnabled');
    const timezone = await this.db.get('settings', 'timezone');
    const timeFormat = await this.db.get('settings', 'timeFormat');
    const oauthClientIds = await this.db.get('settings', 'oauthClientIds');
    const defaultPublicVisibility = await this.db.get('settings', 'defaultPublicVisibility');
    const permalinkBaseUrl = await this.db.get('settings', 'permalinkBaseUrl');

    const settings: AppSettings = {
      monthlyViewEnabled: false,
      timeFormat: '12h',
    };

    // Handle monthlyViewEnabled
    if (monthlyEnabled !== undefined && monthlyEnabled !== null) {
      if (typeof monthlyEnabled === 'boolean') {
        settings.monthlyViewEnabled = monthlyEnabled;
      } else if (typeof monthlyEnabled === 'string') {
        settings.monthlyViewEnabled = monthlyEnabled === 'true';
      }
    }

    // Handle timezone
    if (timezone !== undefined && timezone !== null && typeof timezone === 'string') {
      settings.timezone = timezone;
    }

    // Handle timeFormat
    if (timeFormat !== undefined && timeFormat !== null) {
      if (timeFormat === '12h' || timeFormat === '24h') {
        settings.timeFormat = timeFormat;
      }
    }

    // Handle OAuth client IDs
    if (oauthClientIds !== undefined && oauthClientIds !== null && typeof oauthClientIds === 'string') {
      try {
        settings.oauthClientIds = JSON.parse(oauthClientIds);
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Handle default public visibility
    if (defaultPublicVisibility !== undefined && defaultPublicVisibility !== null && typeof defaultPublicVisibility === 'string') {
      if (['private', 'busy', 'titles', 'full'].includes(defaultPublicVisibility)) {
        settings.defaultPublicVisibility = defaultPublicVisibility as 'private' | 'busy' | 'titles' | 'full';
      }
    }

    // Handle permalink base URL
    if (permalinkBaseUrl !== undefined && permalinkBaseUrl !== null && typeof permalinkBaseUrl === 'string') {
      settings.permalinkBaseUrl = permalinkBaseUrl;
    }

    return settings;
  }

  async setMonthlyViewEnabled(enabled: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', enabled.toString(), 'monthlyViewEnabled');
  }

  async setTimezone(timezone: string | undefined): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (timezone) {
      await this.db.put('settings', timezone, 'timezone');
    } else {
      await this.db.delete('settings', 'timezone');
    }
  }

  async setTimeFormat(format: '12h' | '24h'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', format, 'timeFormat');
  }

  async setOAuthClientIds(clientIds: { google?: string; microsoft?: string; apple?: string }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', JSON.stringify(clientIds), 'oauthClientIds');
  }

  async setDefaultPublicVisibility(visibility: 'private' | 'busy' | 'titles' | 'full'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('settings', visibility, 'defaultPublicVisibility');
  }

  async setPermalinkBaseUrl(url?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    if (url === undefined) {
      await this.db.delete('settings', 'permalinkBaseUrl');
    } else {
      await this.db.put('settings', url, 'permalinkBaseUrl');
    }
  }

  // Meeting Series Management
  async getMeetingSeries(): Promise<MeetingSeries[]> {
    if (!this.db) return [];
    const allMeetings = await this.getAllMeetings();
    
    // Group meetings by seriesId, or create series from meetings with same name/time/category
    const seriesMap = new Map<string, Meeting[]>();
    
    for (const meeting of allMeetings) {
      if (meeting.seriesId) {
        // Has explicit seriesId
        if (!seriesMap.has(meeting.seriesId)) {
          seriesMap.set(meeting.seriesId, []);
        }
        seriesMap.get(meeting.seriesId)!.push(meeting);
      } else {
        // Auto-detect series: same name, time, category, and weekType
        const seriesKey = `${meeting.name}|${meeting.startTime}|${meeting.endTime}|${meeting.categoryId}|${meeting.weekType}`;
        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, []);
        }
        seriesMap.get(seriesKey)!.push(meeting);
      }
    }

    // Convert to MeetingSeries objects
    const series: MeetingSeries[] = [];
    for (const [seriesId, meetings] of seriesMap.entries()) {
      if (meetings.length > 1) { // Only show series with multiple meetings
        const firstMeeting = meetings[0];
        const allDays = new Set<string>();
        meetings.forEach(m => m.days.forEach(d => allDays.add(d)));
        
        series.push({
          seriesId,
          name: firstMeeting.name,
          categoryId: firstMeeting.categoryId,
          startTime: firstMeeting.startTime,
          endTime: firstMeeting.endTime,
          weekType: firstMeeting.weekType,
          requiresAttendance: firstMeeting.requiresAttendance,
          notes: firstMeeting.notes,
          assignedTo: firstMeeting.assignedTo,
          meetingIds: meetings.map(m => m.id),
          days: Array.from(allDays).sort(),
        });
      }
    }

    return series.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getMeetingsInSeries(seriesId: string): Promise<Meeting[]> {
    if (!this.db) return [];
    const allMeetings = await this.getAllMeetings();
    
    // Check for explicit seriesId first
    let seriesMeetings = allMeetings.filter(m => m.seriesId === seriesId);
    
    if (seriesMeetings.length === 0) {
      // Fall back to auto-detection
      const firstMeeting = allMeetings.find(m => {
        const key = `${m.name}|${m.startTime}|${m.endTime}|${m.categoryId}|${m.weekType}`;
        return key === seriesId;
      });
      
      if (firstMeeting) {
        seriesMeetings = allMeetings.filter(m => 
          m.name === firstMeeting.name &&
          m.startTime === firstMeeting.startTime &&
          m.endTime === firstMeeting.endTime &&
          m.categoryId === firstMeeting.categoryId &&
          m.weekType === firstMeeting.weekType
        );
      }
    }
    
    return seriesMeetings;
  }

  async updateMeetingSeries(seriesId: string, updates: Partial<MeetingSeries>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const meetings = await this.getMeetingsInSeries(seriesId);
    
    // Update all meetings in the series
    for (const meeting of meetings) {
      const updatedMeeting: Meeting = {
        ...meeting,
        name: updates.name ?? meeting.name,
        categoryId: updates.categoryId ?? meeting.categoryId,
        startTime: updates.startTime ?? meeting.startTime,
        endTime: updates.endTime ?? meeting.endTime,
        weekType: updates.weekType ?? meeting.weekType,
        requiresAttendance: updates.requiresAttendance ?? meeting.requiresAttendance,
        notes: updates.notes ?? meeting.notes,
        assignedTo: updates.assignedTo ?? meeting.assignedTo,
        seriesId: meeting.seriesId || seriesId, // Ensure seriesId is set
      };
      await this.saveMeeting(updatedMeeting);
    }
  }

  async deleteMeetingSeries(seriesId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const meetings = await this.getMeetingsInSeries(seriesId);
    
    // Delete all meetings in the series
    for (const meeting of meetings) {
      await this.deleteMeeting(meeting.id);
    }
  }

  // Calendar Sync Configuration
  async getSyncConfigs(): Promise<CalendarSyncConfig[]> {
    if (!this.db) return [];
    const configs = await this.db.getAll('syncConfigs');
    return configs.map(config => ({
      ...config,
      lastSync: config.lastSync ? new Date(config.lastSync) : undefined,
      expiresAt: config.expiresAt ? new Date(config.expiresAt) : undefined,
    }));
  }

  async saveSyncConfig(config: CalendarSyncConfig & { id: string }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('syncConfigs', config);
  }

  async deleteSyncConfig(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('syncConfigs', id);
  }
}

export const storageService = new StorageService();

