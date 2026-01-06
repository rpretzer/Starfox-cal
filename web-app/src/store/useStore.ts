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
      
      // Add timeout to prevent infinite hanging - reduced to 5 seconds
      const initPromise = storageAdapter.init();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout - using defaults')), 5000)
      );
      
      try {
        await Promise.race([initPromise, timeoutPromise]);
      } catch (initError) {
        console.warn('Storage init failed or timed out, using defaults:', initError);
        // Continue with defaults instead of failing completely
      }
      
      // Load data with individual timeouts - increased timeout for data loading
      const loadData = async () => {
        const [meetingsResult, categoriesResult, currentViewResult, currentWeekTypeResult, settingsResult] = await Promise.allSettled([
          Promise.race([
            storageAdapter.getAllMeetings(),
            new Promise<Meeting[]>((resolve) => setTimeout(() => {
              console.warn('getAllMeetings timeout, using empty array');
              resolve([]);
            }, 5000)) // Increased to 5 seconds
          ]),
          Promise.race([
            storageAdapter.getAllCategories(),
            new Promise<Category[]>((resolve) => setTimeout(() => {
              console.warn('getAllCategories timeout, using empty array');
              resolve([]);
            }, 5000)) // Increased to 5 seconds
          ]),
          Promise.resolve(storageAdapter.getCurrentView()),
          Promise.resolve(storageAdapter.getCurrentWeekType()),
          Promise.race([
            storageAdapter.getSettings(),
            new Promise<AppSettings>((resolve) => setTimeout(() => {
              console.warn('getSettings timeout, using defaults');
              resolve({ monthlyViewEnabled: false, timeFormat: '12h' as const });
            }, 5000)) // Increased to 5 seconds
          ]),
        ]);

        const defaultSettings: AppSettings = { monthlyViewEnabled: false, timeFormat: '12h' };
        
        const meetings = meetingsResult.status === 'fulfilled' ? meetingsResult.value : [];
        const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
        
        console.log(`Loaded ${meetings.length} meetings and ${categories.length} categories`);
        
        return {
          meetings,
          categories,
          currentView: currentViewResult.status === 'fulfilled' ? currentViewResult.value : ('weekly' as ViewType),
          currentWeekType: currentWeekTypeResult.status === 'fulfilled' ? currentWeekTypeResult.value : ('A' as WeekTypeFilter),
          settings: settingsResult.status === 'fulfilled' ? settingsResult.value : defaultSettings,
        };
      };

      const data = await loadData();
      
      set({
        ...data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Initialization error:', error);
      // Even on error, show the UI with defaults
      set({
        meetings: [],
        categories: [],
        currentView: 'weekly',
        currentWeekType: 'A',
        settings: { monthlyViewEnabled: false, timeFormat: '12h' as const },
        error: null, // Don't show error, just use defaults
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
    // Update state immediately for responsive UI
    set({ currentView: view });
    // Persist to storage in background (don't block on errors)
    try {
      await storageAdapter.setCurrentView(view);
    } catch (error) {
      console.warn('Failed to persist view change:', error);
    }
  },

  setCurrentWeekType: async (weekType: WeekTypeFilter) => {
    // Update state immediately for responsive UI
    set({ currentWeekType: weekType });
    // Persist to storage in background (don't block on errors)
    try {
      await storageAdapter.setCurrentWeekType(weekType);
    } catch (error) {
      console.warn('Failed to persist week type change:', error);
    }
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

