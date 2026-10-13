import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Activity, CalendarData, CalendarCell, WeekDay } from '../models/activity.model';
import { HistoryService } from './history.service';
import { PersonService } from './person.service';
import { TemplateActivity } from '../models/template.model';

type WeekSnapshot = { day: WeekDay; activity: Activity }[];

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
    } else if (action.type === 'replace-week' && action.originalData) {
      this.restoreWeek(action.originalData);
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
    } else if (action.type === 'replace-week' && action.newData) {
      this.restoreWeek(action.newData);
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

  // A made-up week shown on a first visit only: as soon as anything is
  // saved, the stored calendar is loaded instead.
  private loadInitialData(): void {
    const demoWeek: WeekSnapshot = [
      { day: 'monday', activity: { id: 'demo-1', title: $localize`Swimming`, person: 'leo', timeRange: '16:30-17:30' } },
      { day: 'monday', activity: { id: 'demo-2', title: $localize`Piano lesson`, person: 'mia', timeRange: '17:30-18:15' } },
      { day: 'tuesday', activity: { id: 'demo-3', title: $localize`Dance`, person: 'mia', timeRange: '16:30-18:00' } },
      { day: 'tuesday', activity: { id: 'demo-4', title: $localize`Yoga`, person: 'anna', timeRange: '19:00-20:00' } },
      { day: 'wednesday', activity: { id: 'demo-5', title: $localize`Football practice`, person: 'leo', timeRange: '17:00-18:30' } },
      { day: 'wednesday', activity: { id: 'demo-6', title: $localize`Homework club`, person: 'mia', timeRange: '17:30-18:30' } },
      { day: 'thursday', activity: { id: 'demo-7', title: $localize`Swimming`, person: 'mia', timeRange: '16:30-17:30' } },
      { day: 'thursday', activity: { id: 'demo-8', title: $localize`Guitar`, person: 'leo', timeRange: '18:00-18:45' } },
      { day: 'friday', activity: { id: 'demo-9', title: $localize`Football practice`, person: 'leo', timeRange: '17:00-18:30' } },
      { day: 'saturday', activity: { id: 'demo-10', title: $localize`Football match`, person: 'leo', timeRange: '10:00-12:00' } },
      { day: 'saturday', activity: { id: 'demo-11', title: $localize`Birthday party`, person: 'mia', timeRange: '15:00-18:00' } },
      { day: 'sunday', activity: { id: 'demo-12', title: $localize`Grocery shopping`, person: 'anna', timeRange: '10:00-11:00' } }
    ];
    const schoolDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const school: WeekSnapshot = schoolDays.flatMap(day => [
      { day, activity: { id: `demo-school-anna-${day}`, title: $localize`School`, person: 'anna', timeRange: '07:45-14:00' } },
      { day, activity: { id: `demo-school-leo-${day}`, title: $localize`School`, person: 'leo', timeRange: '08:00-13:30' } },
      { day, activity: { id: `demo-school-mia-${day}`, title: $localize`School`, person: 'mia', timeRange: '08:30-16:00' } }
    ]);
    this.restoreWeek([...school, ...demoWeek]);
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
    const before = this.snapshotWeek();

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

    // Applying a template replaces the whole week, so history stores a full
    // before/after snapshot: undo/redo then restore exactly what was on screen,
    // including the ids generated above.
    if (this.historyService) {
      this.historyService.addAction({
        type: 'replace-week',
        activityId: '',
        originalData: before,
        newData: this.snapshotWeek()
      });
    }

    this.notifyChange();
  }

  private snapshotWeek(): WeekSnapshot {
    const snapshot: WeekSnapshot = [];
    this.calendarData.cells.forEach((cell, day) => {
      cell.activities.forEach(activity => snapshot.push({ day, activity: { ...activity } }));
    });
    return snapshot;
  }

  private restoreWeek(snapshot: WeekSnapshot): void {
    this.calendarData.cells.forEach(cell => {
      cell.activities = [];
    });
    snapshot.forEach(({ day, activity }) => {
      this.calendarData.cells.get(day)?.activities.push({ ...activity });
    });
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
