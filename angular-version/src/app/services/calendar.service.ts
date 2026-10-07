import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Activity, CalendarData, CalendarCell, WeekDay } from '../models/activity.model';
import { HistoryService } from './history.service';
import { PersonService } from './person.service';
import { TemplateActivity } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private calendarData: CalendarData;
  private calendarSubject = new BehaviorSubject<CalendarData>(this.initializeCalendar());

  private historyService?: HistoryService;

  constructor(private personService: PersonService) {
    this.calendarData = this.initializeCalendar();
    this.loadCalendarData();
  }

  setHistoryService(historyService: HistoryService): void {
    this.historyService = historyService;

    historyService.setCallbacks(
      (action) => this.handleUndo(action),
      (action) => this.handleRedo(action)
    );
  }

  private handleUndo(action: any): void {
    if (action.type === 'move' && action.originalPosition && action.newPosition) {
      this.moveActivityDirect(action.activityId, action.newPosition.day, action.originalPosition.day);
    } else if (action.type === 'add' && action.newPosition) {
      this.removeActivityDirect(action.activityId, action.newPosition.day);
    } else if (action.type === 'edit' && action.originalData) {
      this.updateActivityDirect(action.activityId, action.originalData);
    } else if (action.type === 'remove' && action.originalData && action.originalPosition) {
      this.addActivityDirect(action.originalData, action.originalPosition.day);
    }
  }

  private handleRedo(action: any): void {
    if (action.type === 'move' && action.originalPosition && action.newPosition) {
      this.moveActivityDirect(action.activityId, action.originalPosition.day, action.newPosition.day);
    } else if (action.type === 'add' && action.newPosition && action.originalData) {
      this.addActivityDirect(action.originalData, action.newPosition.day);
    } else if (action.type === 'edit' && action.newData) {
      this.updateActivityDirect(action.activityId, action.newData);
    } else if (action.type === 'remove' && action.originalPosition) {
      this.removeActivityDirect(action.activityId, action.originalPosition.day);
    }
  }

  get calendar$(): Observable<CalendarData> {
    return this.calendarSubject.asObservable();
  }

  private initializeCalendar(): CalendarData {
    const weekDays: WeekDay[] = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];

    const cells = new Map<WeekDay, CalendarCell>();
    weekDays.forEach(day => {
      cells.set(day, { day, activities: [] });
    });

    return { cells, weekDays };
  }

  private loadInitialData(): void {
    this.placeActivity('chitarra', 'wednesday');
    this.placeActivity('danza-mer', 'wednesday');
    this.placeActivity('batteria', 'thursday');
    this.placeActivity('danza-ven', 'friday');
    this.placeActivity('danza-mart', 'tuesday');
    this.placeActivity('basket', 'tuesday');
    this.placeActivity('piano', 'wednesday');
    this.placeActivity('flauto-solo', 'wednesday');
    this.placeActivity('flauto-gruppo', 'thursday');
    this.placeActivity('scout', 'friday');
    this.placeActivity('piscina-mia', 'monday');
    this.placeActivity('piscina-leo', 'tuesday');
    this.notifyChange();
  }

  private placeActivity(activityId: string, day: WeekDay): void {
    const cell = this.calendarData.cells.get(day);

    if (cell) {
      const activity = this.findActivityById(activityId);
      if (activity) {
        cell.activities.push(activity);
      }
    }
  }

  private findActivityById(id: string): Activity | undefined {
    const activityMap: Record<string, Activity> = {
      'chitarra': { id: 'chitarra', title: 'Chitarra', person: 'leo', timeRange: '13:45-15:30' },
      'danza-mer': { id: 'danza-mer', title: 'Danza (se possibile)', person: 'mia', timeRange: '15:45-17:30' },
      'batteria': { id: 'batteria', title: 'Batteria', person: 'leo', timeRange: '15:30-17:00' },
      'danza-ven': { id: 'danza-ven', title: 'Danza', person: 'mia', timeRange: '15:45-17:30' },
      'danza-mart': { id: 'danza-mart', title: 'Danza', person: 'mia', timeRange: '15:45-17:30' },
      'basket': { id: 'basket', title: 'Basket', person: 'anna', timeRange: '17:15-18:30' },
      'piano': { id: 'piano', title: 'Piano', person: 'leo', timeRange: '17:00-18:00' },
      'flauto-solo': { id: 'flauto-solo', title: 'Flauto Solo', person: 'mia', timeRange: '17:30-18:15' },
      'flauto-gruppo': { id: 'flauto-gruppo', title: 'Flauto Gruppo', person: 'mia', timeRange: '16:35-17:35' },
      'scout': { id: 'scout', title: 'Scout', person: 'leo', timeRange: '17:15-19:15' },
      'piscina-mia': { id: 'piscina-mia', title: 'Piscina', person: 'mia', timeRange: '19:00-20:00' },
      'piscina-leo': { id: 'piscina-leo', title: 'Piscina', person: 'leo', timeRange: '20:00-21:30' }
    };

    return activityMap[id];
  }

  moveActivity(activityId: string, fromDay: WeekDay, toDay: WeekDay): boolean {
    const fromCell = this.calendarData.cells.get(fromDay);
    const toCell = this.calendarData.cells.get(toDay);

    if (!fromCell || !toCell) return false;

    const activityIndex = fromCell.activities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) return false;

    if (this.historyService) {
      this.historyService.addAction({
        type: 'move',
        activityId,
        originalPosition: { day: fromDay },
        newPosition: { day: toDay }
      });
    }

    const activity = fromCell.activities.splice(activityIndex, 1)[0];
    toCell.activities.push(activity);

    this.notifyChange();
    return true;
  }

  getCell(day: WeekDay): CalendarCell | undefined {
    return this.calendarData.cells.get(day);
  }

  addActivity(activity: Activity, day: WeekDay): boolean {
    const cell = this.calendarData.cells.get(day);
    if (!cell) return false;

    if (this.historyService) {
      this.historyService.addAction({
        type: 'add',
        activityId: activity.id,
        originalPosition: null,
        newPosition: { day },
        originalData: activity
      });
    }

    cell.activities.push(activity);
    this.notifyChange();
    return true;
  }

  addActivityDirect(activity: Activity, day: WeekDay): boolean {
    const cell = this.calendarData.cells.get(day);
    if (!cell) return false;

    cell.activities.push(activity);
    this.notifyChange();
    return true;
  }

  removeActivityDirect(activityId: string, day: WeekDay): boolean {
    const cell = this.calendarData.cells.get(day);
    if (!cell) return false;

    const activityIndex = cell.activities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) return false;

    cell.activities.splice(activityIndex, 1);
    this.notifyChange();
    return true;
  }

  moveActivityDirect(activityId: string, fromDay: WeekDay, toDay: WeekDay): boolean {
    const fromCell = this.calendarData.cells.get(fromDay);
    const toCell = this.calendarData.cells.get(toDay);

    if (!fromCell || !toCell) return false;

    const activityIndex = fromCell.activities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) return false;

    const activity = fromCell.activities.splice(activityIndex, 1)[0];
    toCell.activities.push(activity);

    this.notifyChange();
    return true;
  }

  updateActivity(activityId: string, updates: Partial<Activity>): boolean {
    let found = false;

    this.calendarData.cells.forEach(cell => {
      const activityIndex = cell.activities.findIndex(a => a.id === activityId);
      if (activityIndex !== -1) {
        const originalActivity = { ...cell.activities[activityIndex] };
        cell.activities[activityIndex] = { ...cell.activities[activityIndex], ...updates };

        if (this.historyService) {
          this.historyService.addAction({
            type: 'edit',
            activityId,
            originalData: originalActivity,
            newData: cell.activities[activityIndex]
          });
        }

        found = true;
      }
    });

    if (found) {
      this.notifyChange();
    }

    return found;
  }

  updateActivityDirect(activityId: string, activityData: Activity): boolean {
    let found = false;

    this.calendarData.cells.forEach(cell => {
      const activityIndex = cell.activities.findIndex(a => a.id === activityId);
      if (activityIndex !== -1) {
        cell.activities[activityIndex] = { ...activityData };
        found = true;
      }
    });

    if (found) {
      this.notifyChange();
    }

    return found;
  }

  deleteActivity(activityId: string): boolean {
    let found = false;
    let deletedActivity: Activity | null = null;
    let deletedDay: WeekDay | null = null;

    this.calendarData.cells.forEach((cell, day) => {
      const activityIndex = cell.activities.findIndex(a => a.id === activityId);
      if (activityIndex !== -1) {
        deletedActivity = { ...cell.activities[activityIndex] };
        deletedDay = day;

        if (this.historyService) {
          this.historyService.addAction({
            type: 'remove',
            activityId,
            originalData: deletedActivity,
            originalPosition: { day }
          });
        }

        cell.activities.splice(activityIndex, 1);
        found = true;
      }
    });

    if (found) {
      this.notifyChange();
    }

    return found;
  }

  applyTemplate(templateActivities: TemplateActivity[]): void {
    if (this.historyService) {
      const currentActivities: any[] = [];
      this.calendarData.cells.forEach((cell, day) => {
        cell.activities.forEach(activity => {
          currentActivities.push({ ...activity, day });
        });
      });

      this.historyService.addAction({
        type: 'edit',
        activityId: 'template-clear',
        originalData: { activities: currentActivities },
        newData: { activities: templateActivities }
      });
    }

    this.calendarData.cells.forEach(cell => {
      cell.activities = [];
    });

    let addedCount = 0;
    let skippedCount = 0;

    templateActivities.forEach(templateActivity => {
      const cell = this.calendarData.cells.get(templateActivity.day as WeekDay);
      if (!cell) {
        skippedCount++;
        return;
      }

      cell.activities.push({
        id: this.generateId(),
        title: templateActivity.title,
        person: templateActivity.person,
        timeRange: templateActivity.timeRange,
        notes: templateActivity.notes
      });
      addedCount++;
    });

    if (skippedCount > 0) {
      console.warn(`Template partially applied: ${addedCount} activities loaded, ${skippedCount} skipped (unknown day)`);
    }
    this.notifyChange();
  }

  private saveCalendarData(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const dataToSave = {
          version: 2,
          cells: Array.from(this.calendarData.cells.entries()),
          weekDays: this.calendarData.weekDays,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('calendarData', JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Failed to save calendar data:', e);
      }
    }
  }

  private loadCalendarData(): void {
    if (typeof localStorage === 'undefined') {
      this.loadInitialData();
      return;
    }

    const saved = localStorage.getItem('calendarData');
    if (!saved) {
      this.loadInitialData();
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const rawEntries: [string, any][] = Array.isArray(parsed.cells) ? parsed.cells : [];
      const isCurrentFormat = parsed.version === 2;

      if (isCurrentFormat) {
        rawEntries.forEach(([day, cell]) => {
          const target = this.calendarData.cells.get(day as WeekDay);
          if (target && cell && Array.isArray(cell.activities)) {
            target.activities = cell.activities;
          }
        });
      } else {
        // Legacy format from the fixed time-slot grid: keys were "timeSlot-day".
        // Recover each activity under its real day (last '-' segment) — the grid
        // is now continuous and positions activities from their own timeRange.
        rawEntries.forEach(([key, cell]) => {
          const day = key.split('-').pop() as WeekDay;
          const target = this.calendarData.cells.get(day);
          if (target && cell && Array.isArray(cell.activities)) {
            target.activities.push(...cell.activities);
          }
        });
      }

      this.notifyChange();
    } catch (e) {
      console.error('Failed to load calendar data:', e);
      this.loadInitialData();
    }
  }

  private generateId(): string {
    return 'activity_' + Date.now().toString() + '_' + Math.random().toString(36).slice(2, 11);
  }

  private notifyChange(): void {
    this.calendarSubject.next(this.calendarData);
    this.saveCalendarData();
  }
}
