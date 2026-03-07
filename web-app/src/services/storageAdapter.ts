/**
 * Storage Adapter
 *
 * Provides a unified interface that switches between IndexedDB (local) and Supabase (cloud)
 * based on authentication state.
 */

import { storageService } from './storage';
import { supabaseStorageService } from './supabaseStorage';
import { authService } from './auth';
import type { Meeting, Category, AppSettings, MeetingSeries, CalendarSyncConfig, ViewType, WeekTypeFilter } from '../types';

class StorageAdapter {
  private useCloud = false;

  async init(): Promise<void> {
    try {
      const { isSupabaseConfigured } = await import('./supabase');
      if (!isSupabaseConfigured) {
        this.useCloud = false;
        await storageService.init();
        return;
      }
      try {
        const session = await Promise.race([
          authService.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
        this.useCloud = !!session;
        if (this.useCloud) {
          try {
            await Promise.race([
              supabaseStorageService.init(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
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
    return this.getStorage().setDefaultPublicVisibility(visibility);
  }

  async setPermalinkBaseUrl(url: string | undefined): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().setPermalinkBaseUrl(url);
  }

  async setOAuthClientIds(clientIds: { google?: string; microsoft?: string; apple?: string }): Promise<void> {
    await this.checkAuthAndSwitch();
    return this.getStorage().setOAuthClientIds(clientIds);
  }

  async getMeetingSeries(): Promise<MeetingSeries[]> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.getAllMeetingSeries();
    return storageService.getMeetingSeries();
  }

  async getMeetingsInSeries(seriesId: string): Promise<Meeting[]> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.getMeetingsInSeries(seriesId);
    return storageService.getMeetingsInSeries(seriesId);
  }

  async saveMeetingSeries(series: MeetingSeries): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.saveMeetingSeries(series);
    // IndexedDB: series are derived from meetings — nothing to persist separately
  }

  async updateMeetingSeries(seriesId: string, updates: Partial<MeetingSeries>): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.updateMeetingSeries(seriesId, updates);
    return storageService.updateMeetingSeries(seriesId, updates);
  }

  async deleteMeetingSeries(seriesId: string): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.deleteMeetingSeries(seriesId);
    return storageService.deleteMeetingSeries(seriesId);
  }

  async getSyncConfigs(): Promise<CalendarSyncConfig[]> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.getAllSyncConfigs();
    return storageService.getSyncConfigs();
  }

  async saveSyncConfig(config: CalendarSyncConfig & { id: string }): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.saveSyncConfig(config);
    return storageService.saveSyncConfig(config);
  }

  async deleteSyncConfig(id: string): Promise<void> {
    await this.checkAuthAndSwitch();
    if (this.useCloud) return supabaseStorageService.deleteSyncConfig(id);
    return storageService.deleteSyncConfig(id);
  }

  async getCurrentView(): Promise<ViewType> {
    if (this.useCloud) {
      try {
        const view = await supabaseStorageService.getCurrentView();
        if (view) return view as ViewType;
      } catch (error) {
        console.warn('Failed to get view from cloud:', error);
      }
    }
    return storageService.getCurrentView() || 'weekly';
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
    return storageService.getCurrentWeekType() || 'A';
  }

  async setCurrentView(view: ViewType): Promise<void> {
    try {
      await storageService.init();
      storageService.setCurrentView(view);
    } catch (error) {
      console.warn('Failed to save view to local storage:', error);
    }
    if (this.useCloud) {
      try {
        await supabaseStorageService.setCurrentView(view);
      } catch (error) {
        console.warn('Failed to save view to cloud:', error);
      }
    }
  }

  async setCurrentWeekType(weekType: WeekTypeFilter): Promise<void> {
    try {
      await storageService.init();
      storageService.setCurrentWeekType(weekType);
    } catch (error) {
      console.warn('Failed to save week type to local storage:', error);
    }
    if (this.useCloud) {
      try {
        await supabaseStorageService.setCurrentWeekType(weekType);
      } catch (error) {
        console.warn('Failed to save week type to cloud:', error);
      }
    }
  }

  async getMeetingsForDay(day: string): Promise<Meeting[]> {
    await this.checkAuthAndSwitch();
    if (!this.useCloud) return storageService.getMeetingsForDay(day);
    const meetings = await this.getAllMeetings();
    return meetings.filter(m => m.days.includes(day));
  }

  async getConflictsForDay(day: string): Promise<Array<{ day: string; time: string; meetings: number[] }>> {
    await this.checkAuthAndSwitch();
    if (!this.useCloud) return storageService.getConflictsForDay(day);
    const meetings = await this.getMeetingsForDay(day);
    const conflicts: Array<{ day: string; time: string; meetings: number[] }> = [];
    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        const m1 = meetings[i];
        const m2 = meetings[j];
        if (m1.startTime < m2.endTime && m2.startTime < m1.endTime) {
          conflicts.push({ day, time: `${m1.startTime} - ${m1.endTime}`, meetings: [m1.id, m2.id] });
        }
      }
    }
    return conflicts;
  }

  async moveMeetingToDay(meetingId: number, newDay: string): Promise<void> {
    await this.checkAuthAndSwitch();
    if (!this.useCloud) return storageService.moveMeetingToDay(meetingId, newDay);
    const meeting = await this.getMeeting(meetingId);
    if (meeting) {
      const updatedDays = meeting.days.includes(newDay) ? meeting.days : [...meeting.days, newDay];
      await this.saveMeeting({ ...meeting, days: updatedDays });
    }
  }

  subscribeToMeetings(callback: (meeting: Meeting, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    if (this.useCloud) return supabaseStorageService.subscribeToMeetings(callback);
    return { unsubscribe: () => {} };
  }

  subscribeToCategories(callback: (category: Category, event: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    if (this.useCloud) return supabaseStorageService.subscribeToCategories(callback);
    return { unsubscribe: () => {} };
  }
}

export const storageAdapter = new StorageAdapter();
