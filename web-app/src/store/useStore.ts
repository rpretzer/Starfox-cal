import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      meetings: [],
      categories: [],
      currentView: 'weekly',
      currentWeekType: 'A',
      settings: { monthlyViewEnabled: true, timeFormat: '12h' },
      isLoading: true,
      error: null,

  init: async () => {
    try {
      // Get current state (may have cached data from persistence)
      const currentState = get();
      const hasCachedData = currentState.meetings.length > 0 || currentState.categories.length > 0;
      
      // If we have cached data, show it immediately and refresh in background
      // Otherwise, show loading state
      if (!hasCachedData) {
        set({ isLoading: true, error: null });
      } else {
        set({ error: null });
        console.log('Using cached data, refreshing in background...');
      }
      
      // Initialize storage adapter
      const initPromise = storageAdapter.init();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout - using defaults')), 5000)
      );
      
      try {
        await Promise.race([initPromise, timeoutPromise]);
      } catch (initError) {
        console.warn('Storage init failed or timed out, using cached/defaults:', initError);
        // Continue with cached data or defaults instead of failing completely
      }
      
      // Load fresh data from storage (this will update cached data if different)
      const loadData = async () => {
        const [meetingsResult, categoriesResult, currentViewResult, currentWeekTypeResult, settingsResult] = await Promise.allSettled([
          Promise.race([
            storageAdapter.getAllMeetings(),
            new Promise<Meeting[]>((resolve) => setTimeout(() => {
              console.warn('getAllMeetings timeout, keeping cached data');
              resolve([]);
            }, 5000))
          ]),
          Promise.race([
            storageAdapter.getAllCategories(),
            new Promise<Category[]>((resolve) => setTimeout(() => {
              console.warn('getAllCategories timeout, keeping cached data');
              resolve([]);
            }, 5000))
          ]),
          Promise.resolve(storageAdapter.getCurrentView()),
          Promise.resolve(storageAdapter.getCurrentWeekType()),
          Promise.race([
            storageAdapter.getSettings(),
            new Promise<AppSettings>((resolve) => setTimeout(() => {
              console.warn('getSettings timeout, keeping cached settings');
              resolve({ monthlyViewEnabled: true, timeFormat: '12h' as const });
            }, 5000))
          ]),
        ]);

        const defaultSettings: AppSettings = { monthlyViewEnabled: true, timeFormat: '12h' };
        
        // Merge fresh data with cached data (prefer fresh data if available)
        const freshMeetings = meetingsResult.status === 'fulfilled' ? meetingsResult.value : null;
        const freshCategories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : null;
        const freshView = currentViewResult.status === 'fulfilled' ? currentViewResult.value : null;
        const freshWeekType = currentWeekTypeResult.status === 'fulfilled' ? currentWeekTypeResult.value : null;
        const freshSettings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;
        
        // Use fresh data if available, otherwise keep cached data
        const meetings = freshMeetings !== null && freshMeetings.length > 0 ? freshMeetings : currentState.meetings;
        const categories = freshCategories !== null && freshCategories.length > 0 ? freshCategories : currentState.categories;
        const currentView = freshView || currentState.currentView;
        const currentWeekType = freshWeekType || currentState.currentWeekType;
        const settings = freshSettings || currentState.settings || defaultSettings;
        
        console.log(`Refreshed data: ${meetings.length} meetings, ${categories.length} categories`);
        
        // If no meetings but we have categories, default meetings might still be initializing
        if (meetings.length === 0 && categories.length > 0) {
          console.log('No meetings found but categories exist, waiting for default initialization...');
          await new Promise(resolve => setTimeout(resolve, 500));
          try {
            const refreshedMeetings = await Promise.race([
              storageAdapter.getAllMeetings(),
              new Promise<Meeting[]>((resolve) => setTimeout(() => resolve([]), 2000))
            ]);
            if (refreshedMeetings.length > 0) {
              console.log(`Found ${refreshedMeetings.length} meetings on refresh`);
              return {
                meetings: refreshedMeetings,
                categories,
                currentView,
                currentWeekType,
                settings,
              };
            }
          } catch (refreshError) {
            console.warn('Failed to refresh meetings:', refreshError);
          }
        }
        
        return {
          meetings,
          categories,
          currentView,
          currentWeekType,
          settings,
        };
      };

      const data = await loadData();
      
      // Update state with merged data
      set({
        ...data,
        isLoading: false,
      });
      
      // Final check: if still no meetings after load, try one more refresh
      if (data.meetings.length === 0 && data.categories.length > 0) {
        setTimeout(async () => {
          try {
            const refreshedMeetings = await storageAdapter.getAllMeetings();
            if (refreshedMeetings.length > 0) {
              console.log(`Found ${refreshedMeetings.length} meetings on delayed refresh, updating store`);
              set({ meetings: refreshedMeetings });
            }
          } catch (error) {
            console.warn('Failed to refresh meetings on delayed check:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      // On error, keep cached data if available, otherwise use defaults
      const currentState = get();
      const hasCachedData = currentState.meetings.length > 0 || currentState.categories.length > 0;
      
      if (!hasCachedData) {
        set({
          meetings: [],
          categories: [],
          currentView: 'weekly',
          currentWeekType: 'A',
          settings: { monthlyViewEnabled: true, timeFormat: '12h' as const },
          error: null,
          isLoading: false,
        });
      } else {
        // Keep cached data, just mark as not loading
        set({ error: null, isLoading: false });
      }
    }
  },

  refreshMeetings: async () => {
    const meetings = await storageAdapter.getAllMeetings();
    set({ meetings });
    // Persist middleware will automatically save to localStorage
  },

  refreshCategories: async () => {
    const categories = await storageAdapter.getAllCategories();
    set({ categories });
    // Persist middleware will automatically save to localStorage
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
    // Refresh meetings from storage and update state (persist middleware will save to localStorage)
    await get().refreshMeetings();
  },

  deleteMeeting: async (id: number) => {
    await storageAdapter.deleteMeeting(id);
    // Refresh meetings from storage and update state (persist middleware will save to localStorage)
    await get().refreshMeetings();
  },

  saveCategory: async (category: Category) => {
    await storageAdapter.saveCategory(category);
    // Refresh categories from storage and update state (persist middleware will save to localStorage)
    await get().refreshCategories();
  },

  deleteCategory: async (id: string) => {
    await storageAdapter.deleteCategory(id);
    // Refresh categories from storage and update state (persist middleware will save to localStorage)
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
    }),
    {
      name: 'starfox-calendar-store', // localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1, // Version for future migrations
      // Only persist data, not loading/error states
      partialize: (state) => ({
        meetings: state.meetings,
        categories: state.categories,
        currentView: state.currentView,
        currentWeekType: state.currentWeekType,
        settings: {
          // Ensure all settings fields are persisted
          monthlyViewEnabled: state.settings.monthlyViewEnabled ?? true,
          timezone: state.settings.timezone,
          timeFormat: state.settings.timeFormat ?? '12h',
          oauthClientIds: state.settings.oauthClientIds,
          defaultPublicVisibility: state.settings.defaultPublicVisibility,
          permalinkBaseUrl: state.settings.permalinkBaseUrl,
        },
      }),
      // On rehydration, cached data is immediately available
      // Set isLoading to false initially so cached data shows immediately
      // init() will refresh from storage in the background
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error rehydrating from cache:', error);
          return;
        }
        if (state) {
          // Ensure settings have all required fields with defaults
          if (!state.settings) {
            state.settings = { monthlyViewEnabled: true, timeFormat: '12h' };
          } else {
            // Ensure required fields exist
            if (state.settings.monthlyViewEnabled === undefined) {
              state.settings.monthlyViewEnabled = true;
            }
            if (!state.settings.timeFormat) {
              state.settings.timeFormat = '12h';
            }
          }
          
          // Cached data is now available, show it immediately
          // init() will refresh from storage in the background
          state.isLoading = false;
          console.log('Rehydrated from cache:', {
            meetings: state.meetings.length,
            categories: state.categories.length,
            currentView: state.currentView,
            currentWeekType: state.currentWeekType,
            settings: state.settings,
          });
        }
      },
      // Migrate function for future schema changes
      migrate: (persistedState: any, version: number) => {
        // Handle migrations between versions
        if (version === 0) {
          // Example: migrate from version 0 to 1
          // Add any necessary transformations here
        }
        return persistedState;
      },
    }
  )
);

