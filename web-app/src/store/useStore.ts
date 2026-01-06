import { create } from 'zustand';
import { Meeting, Category, ViewType, WeekTypeFilter, AppSettings, MeetingSeries, CalendarSyncConfig } from '../types';
import { storageAdapter } from '../services/storageAdapter';

interface AppState {
  meetings: Meeting[];
  categories: Category[];
  currentView: ViewType;
  currentWeekType: WeekTypeFilter;
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  init: () => Promise<void>;
  refreshMeetings: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  setCurrentView: (view: ViewType) => Promise<void>;
  setCurrentWeekType: (weekType: WeekTypeFilter) => Promise<void>;
  setMonthlyViewEnabled: (enabled: boolean) => Promise<void>;
  setTimezone: (timezone: string | undefined) => Promise<void>;
  setTimeFormat: (format: '12h' | '24h') => Promise<void>;
  setOAuthClientIds: (clientIds: { google?: string; microsoft?: string; apple?: string }) => Promise<void>;
  setDefaultPublicVisibility: (visibility: 'private' | 'busy' | 'titles' | 'full') => Promise<void>;
  setPermalinkBaseUrl: (url?: string) => Promise<void>;
  saveMeeting: (meeting: Meeting) => Promise<void>;
  deleteMeeting: (id: number) => Promise<void>;
  saveCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getMeetingsForDay: (day: string) => Promise<Meeting[]>;
  getConflictsForDay: (day: string) => Promise<Array<{ day: string; time: string; meetings: number[] }>>;
  moveMeetingToDay: (meetingId: number, newDay: string) => Promise<void>;
  getCategory: (id: string) => Category | undefined;
  getMeeting: (id: number) => Meeting | undefined;
  getNextMeetingId: () => Promise<number>;
  getMeetingSeries: () => Promise<MeetingSeries[]>;
  getMeetingsInSeries: (seriesId: string) => Promise<Meeting[]>;
  updateMeetingSeries: (seriesId: string, updates: Partial<MeetingSeries>) => Promise<void>;
  deleteMeetingSeries: (seriesId: string) => Promise<void>;
  getSyncConfigs: () => Promise<CalendarSyncConfig[]>;
  saveSyncConfig: (config: CalendarSyncConfig & { id: string }) => Promise<void>;
  deleteSyncConfig: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  meetings: [],
  categories: [],
  currentView: 'weekly',
  currentWeekType: 'A',
  settings: { monthlyViewEnabled: false, timeFormat: '12h' },
  isLoading: true,
  error: null,

  init: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Add timeout to prevent infinite hanging
      const initPromise = storageAdapter.init();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 10000) // 10 second timeout
      );
      
      await Promise.race([initPromise, timeoutPromise]);
      
      const meetings = await storageAdapter.getAllMeetings();
      const categories = await storageAdapter.getAllCategories();
      const currentView = storageAdapter.getCurrentView();
      const currentWeekType = storageAdapter.getCurrentWeekType();
      const settings = await storageAdapter.getSettings();
      
      set({
        meetings,
        categories,
        currentView,
        currentWeekType,
        settings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Initialization error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize',
        isLoading: false,
      });
    }
  },

  refreshMeetings: async () => {
    const meetings = await storageAdapter.getAllMeetings();
    set({ meetings });
  },

  refreshCategories: async () => {
    const categories = await storageAdapter.getAllCategories();
    set({ categories });
  },

  setCurrentView: async (view: ViewType) => {
    await storageAdapter.setCurrentView(view);
    set({ currentView: view });
  },

  setCurrentWeekType: async (weekType: WeekTypeFilter) => {
    await storageAdapter.setCurrentWeekType(weekType);
    set({ currentWeekType: weekType });
  },

  setMonthlyViewEnabled: async (enabled: boolean) => {
    await storageAdapter.setMonthlyViewEnabled(enabled);
    set((state) => ({
      settings: { ...state.settings, monthlyViewEnabled: enabled },
    }));
  },

  setTimezone: async (timezone: string | undefined) => {
    await storageAdapter.setTimezone(timezone);
    set((state) => ({
      settings: { ...state.settings, timezone },
    }));
  },

  setTimeFormat: async (format: '12h' | '24h') => {
    const currentFormat = get().settings.timeFormat;
    await storageAdapter.setTimeFormat(format);
    
    // Convert all existing meeting times to new format
    if (currentFormat !== format) {
      const { convertTimeFormat } = await import('../utils/timeConversion');
      const meetings = get().meetings;
      for (const meeting of meetings) {
        const updatedMeeting = {
          ...meeting,
          startTime: convertTimeFormat(meeting.startTime, currentFormat, format),
          endTime: convertTimeFormat(meeting.endTime, currentFormat, format),
        };
        await storageAdapter.saveMeeting(updatedMeeting);
      }
      // Refresh meetings
      const updatedMeetings = await storageAdapter.getAllMeetings();
      set({ meetings: updatedMeetings });
    }
    
    set((state) => ({
      settings: { ...state.settings, timeFormat: format },
    }));
  },

  setOAuthClientIds: async (clientIds: { google?: string; microsoft?: string; apple?: string }) => {
    await storageAdapter.setOAuthClientIds(clientIds);
    set((state) => ({
      settings: { ...state.settings, oauthClientIds: clientIds },
    }));
  },

  setDefaultPublicVisibility: async (visibility: 'private' | 'busy' | 'titles' | 'full') => {
    await storageAdapter.setDefaultPublicVisibility(visibility);
    set((state) => ({
      settings: { ...state.settings, defaultPublicVisibility: visibility },
    }));
  },

  setPermalinkBaseUrl: async (url?: string) => {
    await storageAdapter.setPermalinkBaseUrl(url);
    set((state) => ({
      settings: { ...state.settings, permalinkBaseUrl: url },
    }));
  },

  saveMeeting: async (meeting: Meeting) => {
    // Generate permalink if meeting is saved and doesn't have one
    let meetingToSave = meeting;
    if (meeting.id > 0 && !meeting.permalink) {
      const { generateMeetingPermalink } = await import('../utils/shareUtils');
      meetingToSave = {
        ...meeting,
        permalink: generateMeetingPermalink(meeting.id, get().settings.permalinkBaseUrl),
      };
    }
    await storageAdapter.saveMeeting(meetingToSave);
    await get().refreshMeetings();
  },

  deleteMeeting: async (id: number) => {
    await storageAdapter.deleteMeeting(id);
    await get().refreshMeetings();
  },

  saveCategory: async (category: Category) => {
    await storageAdapter.saveCategory(category);
    await get().refreshCategories();
  },

  deleteCategory: async (id: string) => {
    await storageAdapter.deleteCategory(id);
    await get().refreshCategories();
  },

  getMeetingsForDay: async (day: string) => {
    return storageAdapter.getMeetingsForDay(day);
  },

  getConflictsForDay: async (day: string) => {
    return storageAdapter.getConflictsForDay(day);
  },

  moveMeetingToDay: async (meetingId: number, newDay: string) => {
    await storageAdapter.moveMeetingToDay(meetingId, newDay);
    await get().refreshMeetings();
  },

  getCategory: (id: string) => {
    return get().categories.find(c => c.id === id);
  },

  getMeeting: (id: number) => {
    return get().meetings.find(m => m.id === id);
  },

  getNextMeetingId: async () => {
    return storageAdapter.getNextMeetingId();
  },

  getMeetingSeries: async () => {
    return storageAdapter.getMeetingSeries();
  },

  getMeetingsInSeries: async (seriesId: string) => {
    return storageAdapter.getMeetingsInSeries(seriesId);
  },

  updateMeetingSeries: async (seriesId: string, updates: Partial<MeetingSeries>) => {
    await storageAdapter.updateMeetingSeries(seriesId, updates);
    await get().refreshMeetings();
  },

  deleteMeetingSeries: async (seriesId: string) => {
    await storageAdapter.deleteMeetingSeries(seriesId);
    await get().refreshMeetings();
  },

  getSyncConfigs: async () => {
    return storageAdapter.getSyncConfigs();
  },

  saveSyncConfig: async (config: CalendarSyncConfig & { id: string }) => {
    await storageAdapter.saveSyncConfig(config);
  },

  deleteSyncConfig: async (id: string) => {
    await storageAdapter.deleteSyncConfig(id);
  },
}));

