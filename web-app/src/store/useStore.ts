import { create } from 'zustand';
import { Meeting, Category, ViewType, WeekTypeFilter, AppSettings, MeetingSeries, CalendarSyncConfig } from '../types';
import { storageService } from '../services/storage';

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
      await storageService.init();
      
      const meetings = await storageService.getAllMeetings();
      const categories = await storageService.getAllCategories();
      const currentView = storageService.getCurrentView();
      const currentWeekType = storageService.getCurrentWeekType();
      const settings = await storageService.getSettings();
      
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
    const meetings = await storageService.getAllMeetings();
    set({ meetings });
  },

  refreshCategories: async () => {
    const categories = await storageService.getAllCategories();
    set({ categories });
  },

  setCurrentView: async (view: ViewType) => {
    await storageService.setCurrentView(view);
    set({ currentView: view });
  },

  setCurrentWeekType: async (weekType: WeekTypeFilter) => {
    await storageService.setCurrentWeekType(weekType);
    set({ currentWeekType: weekType });
  },

  setMonthlyViewEnabled: async (enabled: boolean) => {
    await storageService.setMonthlyViewEnabled(enabled);
    set((state) => ({
      settings: { ...state.settings, monthlyViewEnabled: enabled },
    }));
  },

  setTimezone: async (timezone: string | undefined) => {
    await storageService.setTimezone(timezone);
    set((state) => ({
      settings: { ...state.settings, timezone },
    }));
  },

  setTimeFormat: async (format: '12h' | '24h') => {
    await storageService.setTimeFormat(format);
    set((state) => ({
      settings: { ...state.settings, timeFormat: format },
    }));
  },

  saveMeeting: async (meeting: Meeting) => {
    await storageService.saveMeeting(meeting);
    await get().refreshMeetings();
  },

  deleteMeeting: async (id: number) => {
    await storageService.deleteMeeting(id);
    await get().refreshMeetings();
  },

  saveCategory: async (category: Category) => {
    await storageService.saveCategory(category);
    await get().refreshCategories();
  },

  deleteCategory: async (id: string) => {
    await storageService.deleteCategory(id);
    await get().refreshCategories();
  },

  getMeetingsForDay: async (day: string) => {
    return storageService.getMeetingsForDay(day);
  },

  getConflictsForDay: async (day: string) => {
    return storageService.getConflictsForDay(day);
  },

  moveMeetingToDay: async (meetingId: number, newDay: string) => {
    await storageService.moveMeetingToDay(meetingId, newDay);
    await get().refreshMeetings();
  },

  getCategory: (id: string) => {
    return get().categories.find(c => c.id === id);
  },

  getMeeting: (id: number) => {
    return get().meetings.find(m => m.id === id);
  },

  getNextMeetingId: async () => {
    return storageService.getNextMeetingId();
  },

  getMeetingSeries: async () => {
    return storageService.getMeetingSeries();
  },

  getMeetingsInSeries: async (seriesId: string) => {
    return storageService.getMeetingsInSeries(seriesId);
  },

  updateMeetingSeries: async (seriesId: string, updates: Partial<MeetingSeries>) => {
    await storageService.updateMeetingSeries(seriesId, updates);
    await get().refreshMeetings();
  },

  deleteMeetingSeries: async (seriesId: string) => {
    await storageService.deleteMeetingSeries(seriesId);
    await get().refreshMeetings();
  },

  getSyncConfigs: async () => {
    return storageService.getSyncConfigs();
  },

  saveSyncConfig: async (config: CalendarSyncConfig & { id: string }) => {
    await storageService.saveSyncConfig(config);
  },

  deleteSyncConfig: async (id: string) => {
    await storageService.deleteSyncConfig(id);
  },
}));

