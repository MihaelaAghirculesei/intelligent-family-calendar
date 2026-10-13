import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WeeklyTemplate, TemplateActivity, SaveTemplateData } from '../models/template.model';
import { CalendarData, Activity, WeekDay } from '../models/activity.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private templates: WeeklyTemplate[] = [];
  private templatesSubject = new BehaviorSubject<WeeklyTemplate[]>([]);

  constructor() {
    this.loadTemplates();
  }

  get templates$(): Observable<WeeklyTemplate[]> {
    return this.templatesSubject.asObservable();
  }

  saveCurrentWeekAsTemplate(calendarData: CalendarData, templateData: SaveTemplateData): WeeklyTemplate {
    const templateActivities: TemplateActivity[] = [];
    
    calendarData.cells.forEach((cell, day) => {
      cell.activities.forEach(activity => {
        templateActivities.push({
          id: activity.id,
          title: activity.title,
          person: activity.person,
          timeRange: activity.timeRange,
          day,
          notes: activity.notes
        });
      });
    });

    const newTemplate: WeeklyTemplate = {
      id: this.generateId(),
      name: templateData.name,
      description: templateData.description,
      activities: templateActivities,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.push(newTemplate);
    this.saveTemplates();
    this.templatesSubject.next([...this.templates]);

    return newTemplate;
  }

  getAllTemplates(): WeeklyTemplate[] {
    return [...this.templates];
  }

  replaceAll(templates: WeeklyTemplate[]): void {
    this.templates = templates.map(t => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    }));
    this.saveTemplates();
    this.templatesSubject.next([...this.templates]);
  }

  getTemplateById(id: string): WeeklyTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    this.saveTemplates();
    this.templatesSubject.next([...this.templates]);
    return true;
  }

  updateTemplate(id: string, updates: Partial<WeeklyTemplate>): boolean {
    const template = this.templates.find(t => t.id === id);
    if (!template) return false;

    Object.assign(template, updates, { updatedAt: new Date() });
    this.saveTemplates();
    this.templatesSubject.next([...this.templates]);
    return true;
  }

  private generateId(): string {
    return 'template_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private saveTemplates(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('weeklyTemplates', JSON.stringify(this.templates));
    }
  }

  private loadTemplates(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('weeklyTemplates');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.templates = parsed.map((t: any) => ({
            ...t,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
          }));
          this.templatesSubject.next([...this.templates]);
        } catch (e) {
          console.error('Failed to load templates:', e);
        }
      }
    }
  }
}