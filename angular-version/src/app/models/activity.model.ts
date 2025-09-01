export interface Activity {
  id: string;
  title: string;
  person: Person;
  timeRange?: string;
  notes?: string;
}

export type Person = string;

export interface TimeSlot {
  timeRange: string;
  day: WeekDay;
}

export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface CalendarCell {
  timeSlot: TimeSlot;
  activities: Activity[];
  isSchoolTime?: boolean;
  schoolPerson?: Person[];
}

export interface CalendarData {
  cells: Map<string, CalendarCell>;
  timeSlots: string[];
  weekDays: WeekDay[];
}