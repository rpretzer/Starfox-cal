export enum WeekType {
  Both = 'both',
  A = 'a',
  B = 'b',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

export interface Meeting {
  id: number;
  name: string;
  categoryId: string;
  days: string[];
  startTime: string;
  endTime: string;
  weekType: WeekType;
  requiresAttendance: string;
  notes: string;
  assignedTo: string;
}

export interface Category {
  id: string;
  name: string;
  colorValue: number; // Hex color as number
}

export type ViewType = 'weekly' | 'conflicts' | 'categories';
export type WeekTypeFilter = 'A' | 'B';

