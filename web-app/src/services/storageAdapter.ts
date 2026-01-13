/**
 * Storage Adapter
 * 
 * Provides a unified interface that switches between IndexedDB (local) and Supabase (cloud)
 * based on authentication state.
 */

import { storageService } from './storage';
import { supabaseStorageService } from './supabaseStorage';
import { authService } from './auth';
import { Meeting, Category, AppSettings, MeetingSeries, CalendarSyncConfig, ViewType, WeekTypeFilter } from '../types';

class StorageAdapter {
  private useCloud = false;

  async init(): Promise<void> {
    try {
      // Check if Supabase is configured first (fast check)
      const { isSupabaseConfigured } = await import('./supabase');
      
      if (!isSupabaseConfigured) {
        // No Supabase config, use local storage immediately
        this.useCloud = false;
        await storageService.init();
        return;
      }

      // Supabase is configured, check auth with timeout
      try {
        const session = await Promise.race([
          authService.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)), // 2 second timeout
        ]);
        
        this.useCloud = !!session;

        if (this.useCloud) {
          try {
            await Promise.race([
              supabaseStorageService.init(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)), // 5 second timeout
            ]);
          } catch (error) {
            console.warn('Failed to initialize Supabase, falling back to local storage:', error);
            this.useCloud = false;
            await storageService.init();
          }
        } else {
          await storageService.init();
        }
      } catch (error) {
        console.warn('Auth check failed or timed out, using local storage:', error);
        this.useCloud = false;
        await storageService.init();
      }
    } catch (error) {
      console.error('Storage initialization error, using local storage:', error);
      this.useCloud = false;
      await storageService.init();
    }
  }

  async checkAuthAndSwitch(): Promise<void> {
    try {
      const { isSupabaseConfigured } = await import('./supabase');
      if (!isSupabaseConfigured) {
        if (this.useCloud) {
          this.useCloud = false;
          await storageService.init();
        }
        return;
      }
      
      const session = await authService.getSession();
      const wasUsingCloud = this.useCloud;
      this.useCloud = !!session;

      // If auth state changed, reinitialize
      if (wasUsingCloud !== this.useCloud) {
        if (this.useCloud) {
          try {
            await supabaseStorageService.init();
          } catch (error) {
            console.warn('Failed to switch to Supabase, staying on local storage:', error);
            this.useCloud = false;
          }
        } else {
          await storageService.init();
        }
      }
    } catch (error) {
      // If auth check fails, stay on local storage
      console.warn('Auth check failed:', error);
      if (this.useCloud) {
        this.useCloud = false;
        await storageService.init();
      }
    }
  }

  private getStorage() {
    return this.useCloud ? supabaseStorageService : storageService;
  }

  // Meetings
  async getAllMeetings(): Promise<Meeting[]> {
    await this.checkAuthAndSwitch();
    return this.getStorage().getAllMeetings();
  }

  async getMeeting(id: number): Promise<Meeting | undefined | null> {
    await this.checkAuthAndSwitch();
    return this.getStorage().getMeeting(id);
  }

  async saveMeeting(meeting: Meeting): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().saveMeeting(meeting);
  }

  async deleteMeeting(id: number): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().deleteMeeting(id);
  }

  async getNextMeetingId(): Promise<number> {
    await this.checkAuthAndSwitch();
    return this.getStorage().getNextMeetingId();
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    await this.checkAuthAndSwitch();
    return this.getStorage().getAllCategories();
  }

  async saveCategory(category: Category): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().saveCategory(category);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().deleteCategory(id);
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    await this.checkAuthAndSwitch();
    return this.getStorage().getSettings();
  }

  async setMonthlyViewEnabled(enabled: boolean): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().setMonthlyViewEnabled(enabled);
  }

  async setTimezone(timezone: string | undefined): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().setTimezone(timezone);
  }

  async setTimeFormat(format: '12h' | '24h'): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().setTimeFormat(format);
  }

  async setDefaultPublicVisibility(visibility: 'private' | 'busy' | 'titles' | 'full'): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.setDefaultPublicVisibility(visibility);
    }
    // IndexedDB doesn't have this method, skip
  }

  async setPermalinkBaseUrl(url: string | undefined): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.setPermalinkBaseUrl(url);
    }
    // IndexedDB doesn't have this method, skip
  }

  async setOAuthClientIds(clientIds: { google?: string; microsoft?: string; apple?: string }): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.setOAuthClientIds(clientIds);
    }
    // IndexedDB doesn't have this method, skip
  }

  // Meeting Series
  async getMeetingSeries(): Promise<MeetingSeries[]> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.getAllMeetingSeries();
    }
    return (storageService as any).getMeetingSeries();
  }

  async getMeetingsInSeries(seriesId: string): Promise<Meeting[]> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.getMeetingsInSeries(seriesId);
    }
    return (storageService as any).getMeetingsInSeries(seriesId);
  }

  async saveMeetingSeries(series: MeetingSeries): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.saveMeetingSeries(series);
    }
    return (storageService as any).saveMeetingSeries(series);
  }

  async updateMeetingSeries(seriesId: string, updates: Partial<MeetingSeries>): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.updateMeetingSeries(seriesId, updates);
    }
    return (storageService as any).updateMeetingSeries(seriesId, updates);
  }

  async deleteMeetingSeries(seriesId: string): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.deleteMeetingSeries(seriesId);
    }
    return (storageService as any).deleteMeetingSeries(seriesId);
  }

  // Calendar Sync
  async getSyncConfigs(): Promise<CalendarSyncConfig[]> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.getAllSyncConfigs();
    }
    return (storageService as any).getAllSyncConfigs();
  }

  async saveSyncConfig(config: CalendarSyncConfig & { id: string }): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.saveSyncConfig(config);
    }
    return (storageService as any).saveSyncConfig(config);
  }

  async deleteSyncConfig(id: string): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) {
      return supabaseStorageService.deleteSyncConfig(id);
    }
    return (storageService as any).deleteSyncConfig(id);
  }

  // View/WeekType - synced to both local and cloud storage
  async getCurrentView(): Promise<ViewType> {
    if (this.useCloud) {
      try {
        const view = await supabaseStorageService.getCurrentView();
        if (view) return view as ViewType;
      } catch (error) {
        console.warn('Failed to get view from cloud:', error);
      }
    }
    // Fall back to local storage
    return (storageService as any).getCurrentView() || 'weekly';
  }

  async getCurrentWeekType(): Promise<WeekTypeFilter> {
    if (this.useCloud) {
      try {
        const weekType = await supabaseStorageService.getCurrentWeekType();
        if (weekType) return weekType as WeekTypeFilter;
      } catch (error) {
        console.warn('Failed to get week type from cloud:', error);
      }
    }
    // Fall back to local storage
    return (storageService as any).getCurrentWeekType() || 'A';
  }

  async setCurrentView(view: ViewType): Promise<void> {
    // Save to local storage first (for fast access)
    try {
      await storageService.init();
      (storageService as any).setCurrentView(view);
    } catch (error) {
      console.warn('Failed to save view to local storage:', error);
    }

    // Also save to cloud if authenticated
    if (this.useCloud) {
      try {
        await supabaseStorageService.setCurrentView(view);
      } catch (error) {
        console.warn('Failed to save view to cloud:', error);
      }
    }
  }

  async setCurrentWeekType(weekType: WeekTypeFilter): Promise<void> {
    // Save to local storage first (for fast access)
    try {
      await storageService.init();
      (storageService as any).setCurrentWeekType(weekType);
    } catch (error) {
      console.warn('Failed to save week type to local storage:', error);
    }

    // Also save to cloud if authenticated
    if (this.useCloud) {
      try {
        await supabaseStorageService.setCurrentWeekType(weekType);
      } catch (error) {
        console.warn('Failed to save week type to cloud:', error);
      }
    }
  }

  // Helper methods (IndexedDB only)
  async getMeetingsForDay(day: string): Promise<Meeting[]> {
    await this.checkAuthAndSwitch();
    if (!this.useCloud) {
      return (storageService as any).getMeetingsForDay(day);
    }
    // For Supabase, filter in memory
    const meetings = await this.getAllMeetings();
    return meetings.filter(m => m.days.includes(day));
  }

  async getConflictsForDay(day: string): Promise<Array<{ day: string; time: string; meetings: number[] }>> {
    await this.checkAuthAndSwitch();
    if (!this.useCloud) {
      return (storageService as any).getConflictsForDay(day);
    }
    // For Supabase, calculate conflicts in memory
    const meetings = await this.getMeetingsForDay(day);
    const conflicts: Array<{ day: string; time: string; meetings: number[] }> = [];
    // Simple conflict detection - meetings with overlapping times
    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        const m1 = meetings[i];
        const m2 = meetings[j];
        if (m1.startTime < m2.endTime && m2.startTime < m1.endTime) {
          conflicts.push({
            day,
            time: `${m1.startTime} - ${m1.endTime}`,
            meetings: [m1.id, m2.id],
          });
        }
      }
    }
    return conflicts;
  }

  async moveMeetingToDay(meetingId: number, newDay: string): Promise<void> {
    await this.checkAuthAndSwitch();
    if (!this.useCloud) {
      return (storageService as any).moveMeetingToDay(meetingId, newDay);
    }
    // For Supabase, update the meeting's days array
    const meeting = await this.getMeeting(meetingId);
    if (meeting) {
      const updatedDays = meeting.days.includes(newDay)
        ? meeting.days
        : [...meeting.days, newDay];
      await this.saveMeeting({ ...meeting, days: updatedDays });
    }
  }

  // Real-time subscriptions (Supabase only)
  subscribeToMeetings(callback: (meeting: Meeting, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    if (this.useCloud) {
      return supabaseStorageService.subscribeToMeetings(callback);
    }
    return { unsubscribe: () => {} };
  }

  subscribeToCategories(callback: (category: Category, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    if (this.useCloud) {
      return supabaseStorageService.subscribeToCategories(callback);
    }
    return { unsubscribe: () => {} };
  }
}

export const storageAdapter = new StorageAdapter();

