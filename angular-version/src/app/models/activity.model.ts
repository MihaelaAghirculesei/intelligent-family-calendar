export interface Activity {
  id: string;
  title: string;
  person: Person;
  timeRange?: string;
  notes?: string;
}

export type Person = string;

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface CalendarCell {
  day: WeekDay;
  activities: Activity[];
}

export interface CalendarData {
  cells: Map<WeekDay, CalendarCell>;
  weekDays: WeekDay[];
}