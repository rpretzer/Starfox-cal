import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { WeekType } from '../types';
import type { Meeting, Category } from '../types';

// Mock storageAdapter before importing store
vi.mock('../services/storageAdapter', () => ({
  storageAdapter: {
    init: vi.fn().mockResolvedValue(undefined),
    getAllMeetings: vi.fn().mockResolvedValue([]),
    getAllCategories: vi.fn().mockResolvedValue([]),
    getCurrentView: vi.fn().mockResolvedValue('weekly'),
    getCurrentWeekType: vi.fn().mockResolvedValue('A'),
    getSettings: vi.fn().mockResolvedValue({ monthlyViewEnabled: true, timeFormat: '12h' }),
    setCurrentView: vi.fn().mockResolvedValue(undefined),
    setCurrentWeekType: vi.fn().mockResolvedValue(undefined),
    setMonthlyViewEnabled: vi.fn().mockResolvedValue(undefined),
    setTimezone: vi.fn().mockResolvedValue(undefined),
    setTimeFormat: vi.fn().mockResolvedValue(undefined),
    setOAuthClientIds: vi.fn().mockResolvedValue(undefined),
    setDefaultPublicVisibility: vi.fn().mockResolvedValue(undefined),
    setPermalinkBaseUrl: vi.fn().mockResolvedValue(undefined),
    saveMeeting: vi.fn().mockResolvedValue(undefined),
    deleteMeeting: vi.fn().mockResolvedValue(undefined),
    saveCategory: vi.fn().mockResolvedValue(undefined),
    deleteCategory: vi.fn().mockResolvedValue(undefined),
    getMeetingsForDay: vi.fn().mockResolvedValue([]),
    getConflictsForDay: vi.fn().mockResolvedValue([]),
    getNextMeetingId: vi.fn().mockResolvedValue(1),
    getSyncConfigs: vi.fn().mockResolvedValue([]),
    saveSyncConfig: vi.fn().mockResolvedValue(undefined),
    deleteSyncConfig: vi.fn().mockResolvedValue(undefined),
    getMeetingSeries: vi.fn().mockResolvedValue([]),
    getMeetingsInSeries: vi.fn().mockResolvedValue([]),
    updateMeetingSeries: vi.fn().mockResolvedValue(undefined),
    deleteMeetingSeries: vi.fn().mockResolvedValue(undefined),
    subscribeToRealtimeUpdates: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  },
}));

// Import after mocks are set up
const { useStore } = await import('./useStore');
const { storageAdapter } = await import('../services/storageAdapter');

const testMeeting: Meeting = {
  id: 1,
  name: 'Test Meeting',
  categoryId: 'cat1',
  days: ['Monday'],
  startTime: '10:00 AM',
  endTime: '11:00 AM',
  weekType: WeekType.Both,
  requiresAttendance: '',
  notes: '',
  assignedTo: '',
};

const testCategory: Category = {
  id: 'cat1',
  name: 'Engineering',
  colorValue: 0xff0000,
};

describe('useStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useStore.setState({
      meetings: [],
      categories: [],
      currentView: 'weekly',
      currentWeekType: 'A',
      settings: { monthlyViewEnabled: true, timeFormat: '12h' },
      isLoading: false,
      error: null,
    });
  });

  describe('setCurrentView', () => {
    it('should update currentView in state', async () => {
      await act(async () => {
        await useStore.getState().setCurrentView('categories');
      });
      expect(useStore.getState().currentView).toBe('categories');
    });

    it('should call storageAdapter.setCurrentView', async () => {
      await act(async () => {
        await useStore.getState().setCurrentView('monthly');
      });
      expect(storageAdapter.setCurrentView).toHaveBeenCalledWith('monthly');
    });
  });

  describe('setCurrentWeekType', () => {
    it('should update currentWeekType in state', async () => {
      await act(async () => {
        await useStore.getState().setCurrentWeekType('B');
      });
      expect(useStore.getState().currentWeekType).toBe('B');
    });
  });

  describe('saveMeeting', () => {
    it('should call storageAdapter.saveMeeting and refresh meetings', async () => {
      vi.mocked(storageAdapter.getAllMeetings).mockResolvedValueOnce([testMeeting]);
      await act(async () => {
        await useStore.getState().saveMeeting(testMeeting);
      });
      expect(storageAdapter.saveMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Test Meeting', categoryId: 'cat1' })
      );
    });
  });

  describe('deleteMeeting', () => {
    it('should call storageAdapter.deleteMeeting', async () => {
      useStore.setState({ meetings: [testMeeting] });
      await act(async () => {
        await useStore.getState().deleteMeeting(1);
      });
      expect(storageAdapter.deleteMeeting).toHaveBeenCalledWith(1);
    });
  });

  describe('saveCategory', () => {
    it('should call storageAdapter.saveCategory and refresh categories', async () => {
      vi.mocked(storageAdapter.getAllCategories).mockResolvedValueOnce([testCategory]);
      await act(async () => {
        await useStore.getState().saveCategory(testCategory);
      });
      expect(storageAdapter.saveCategory).toHaveBeenCalledWith(testCategory);
    });
  });

  describe('getCategory', () => {
    it('should return matching category by id', () => {
      useStore.setState({ categories: [testCategory] });
      const result = useStore.getState().getCategory('cat1');
      expect(result).toEqual(testCategory);
    });

    it('should return undefined when category not found', () => {
      useStore.setState({ categories: [] });
      const result = useStore.getState().getCategory('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getMeeting', () => {
    it('should return matching meeting by id', () => {
      useStore.setState({ meetings: [testMeeting] });
      const result = useStore.getState().getMeeting(1);
      expect(result).toEqual(testMeeting);
    });

    it('should return undefined when meeting not found', () => {
      useStore.setState({ meetings: [] });
      const result = useStore.getState().getMeeting(999);
      expect(result).toBeUndefined();
    });
  });

  describe('setMonthlyViewEnabled', () => {
    it('should update settings.monthlyViewEnabled', async () => {
      await act(async () => {
        await useStore.getState().setMonthlyViewEnabled(false);
      });
      expect(useStore.getState().settings.monthlyViewEnabled).toBe(false);
      expect(storageAdapter.setMonthlyViewEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('setTimezone', () => {
    it('should update settings.timezone', async () => {
      await act(async () => {
        await useStore.getState().setTimezone('America/New_York');
      });
      expect(useStore.getState().settings.timezone).toBe('America/New_York');
    });
  });
});
