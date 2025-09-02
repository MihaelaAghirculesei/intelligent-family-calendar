import { Activity } from './activity.model';

export interface WeeklyTemplate {
  id: string;
  name: string;
  description?: string;
  activities: TemplateActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateActivity {
  id: string;
  title: string;
  person: string;
  timeRange?: string;
  timeSlot: string;
  day: string;
  notes?: string;
}

export interface SaveTemplateData {
  name: string;
  description?: string;
}