import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Activity, CalendarData, CalendarCell, Person, WeekDay } from '../models/activity.model';
import { HistoryService } from './history.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private calendarData: CalendarData;
  private calendarSubject = new BehaviorSubject<CalendarData>(this.initializeCalendar());

  private historyService?: HistoryService;

  constructor() {
    this.calendarData = this.initializeCalendar();
    this.loadInitialData();
  }

  setHistoryService(historyService: HistoryService): void {
    this.historyService = historyService;
  }

  get calendar$(): Observable<CalendarData> {
    return this.calendarSubject.asObservable();
  }

  private initializeCalendar(): CalendarData {
    const timeSlots = [
      '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00', 
      '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
    ];
    
    const weekDays: WeekDay[] = [
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
    ];

    const cells = new Map<string, CalendarCell>();
    
    timeSlots.forEach(timeSlot => {
      weekDays.forEach(day => {
        const key = `${timeSlot}-${day}`;
        cells.set(key, {
          timeSlot: { timeRange: timeSlot, day },
          activities: [],
          isSchoolTime: this.isSchoolTime(timeSlot, day),
          schoolPerson: this.getSchoolPersons(timeSlot, day)
        });
      });
    });

    return { cells, timeSlots, weekDays };
  }

  private isSchoolTime(timeSlot: string, day: WeekDay): boolean {
    if (day === 'saturday' || day === 'sunday') return false;
    
    const schoolTimes = [
      '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00'
    ];
    
    return schoolTimes.includes(timeSlot);
  }

  private getSchoolPersons(timeSlot: string, day: WeekDay): Person[] {
    if (!this.isSchoolTime(timeSlot, day)) return [];
    
    if (timeSlot === '7:45-13:10') return ['leo'];
    if (timeSlot === '8:15-14:00' && day === 'friday') return ['anna'];
    if (timeSlot === '14:00-15:00' && (day === 'tuesday' || day === 'thursday')) return ['anna', 'mia'];
    if (timeSlot === '14:00-15:00' && day === 'friday') return ['mia'];
    if (timeSlot === '15:00-16:00' && (day === 'monday' || day === 'wednesday')) return ['anna', 'mia'];
    
    return [];
  }

  private loadInitialData(): void {
    this.placeActivity('chitarra', '7:45-13:10', 'wednesday');
    this.placeActivity('danza-mer', '15:30-17:30', 'wednesday');
    this.placeActivity('batteria', '15:30-17:30', 'thursday');
    this.placeActivity('danza-ven', '15:30-17:30', 'friday');
    this.placeActivity('danza-mart', '16:35-18:30', 'tuesday');
    this.placeActivity('basket', '16:35-18:30', 'tuesday');
    this.placeActivity('piano', '16:35-18:30', 'wednesday');
    this.placeActivity('flauto-solo', '16:35-18:30', 'wednesday');
    this.placeActivity('flauto-gruppo', '16:35-18:30', 'thursday');
    this.placeActivity('scout', '17:15-19:15', 'friday');
    this.placeActivity('piscina-mia', '19:00-21:30', 'monday');
    this.placeActivity('piscina-leo', '19:00-21:30', 'tuesday');
    this.calendarSubject.next(this.calendarData);
  }

  private placeActivity(activityId: string, timeSlot: string, day: WeekDay): void {
    const key = `${timeSlot}-${day}`;
    const cell = this.calendarData.cells.get(key);
    
    if (cell) {
      const activity = this.findActivityById(activityId);
      if (activity) {
        cell.activities.push(activity);
      }
    }
  }

  private findActivityById(id: string): Activity | undefined {
    const activityMap: Record<string, Activity> = {
      'chitarra': { id: 'chitarra', name: 'Chitarra', person: 'leo', timeRange: '13:45-15:30' },
      'danza-mer': { id: 'danza-mer', name: 'Danza (se possibile)', person: 'mia', timeRange: '15:45-17:30' },
      'batteria': { id: 'batteria', name: 'Batteria', person: 'leo', timeRange: '15:30-17:00' },
      'danza-ven': { id: 'danza-ven', name: 'Danza', person: 'mia', timeRange: '15:45-17:30' },
      'danza-mart': { id: 'danza-mart', name: 'Danza', person: 'mia', timeRange: '15:45-17:30' },
      'basket': { id: 'basket', name: 'Basket', person: 'anna', timeRange: '17:15-18:30' },
      'piano': { id: 'piano', name: 'Piano', person: 'leo', timeRange: '17:00-18:00' },
      'flauto-solo': { id: 'flauto-solo', name: 'Flauto Solo', person: 'mia', timeRange: '17:30-18:15' },
      'flauto-gruppo': { id: 'flauto-gruppo', name: 'Flauto Gruppo', person: 'mia', timeRange: '16:35-17:35' },
      'scout': { id: 'scout', name: 'Scout', person: 'leo', timeRange: '17:15-19:15' },
      'piscina-mia': { id: 'piscina-mia', name: 'Piscina', person: 'mia', timeRange: '19:00-20:00' },
      'piscina-leo': { id: 'piscina-leo', name: 'Piscina', person: 'leo', timeRange: '20:00-21:30' }
    };
    
    return activityMap[id];
  }

  moveActivity(activityId: string, fromKey: string, toKey: string): boolean {
    const fromCell = this.calendarData.cells.get(fromKey);
    const toCell = this.calendarData.cells.get(toKey);
    
    if (!fromCell || !toCell) return false;
    
    const activityIndex = fromCell.activities.findIndex(a => a.id === activityId);
    if (activityIndex === -1) return false;

    if (this.historyService) {
      const fromPosition = this.parseKey(fromKey);
      const toPosition = this.parseKey(toKey);
      
      this.historyService.addAction({
        type: 'move',
        activityId,
        originalPosition: fromPosition,
        newPosition: toPosition
      });
    }
    
    const activity = fromCell.activities.splice(activityIndex, 1)[0];
    toCell.activities.push(activity);
    
    this.calendarSubject.next(this.calendarData);
    return true;
  }

  private parseKey(key: string): { timeSlot: string; day: WeekDay; row: number; col: number } {
    const parts = key.split('-');
    const timeSlot = parts.slice(0, -1).join('-');
    const day = parts[parts.length - 1] as WeekDay;
    
    const row = this.timeSlots.indexOf(timeSlot);
    const col = this.weekDays.indexOf(day);
    
    return { timeSlot, day, row, col };
  }

  private get timeSlots(): string[] {
    return [
      '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00', 
      '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
    ];
  }

  private get weekDays(): WeekDay[] {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  }

  getCellKey(timeSlot: string, day: WeekDay): string {
    return `${timeSlot}-${day}`;
  }

  getCell(timeSlot: string, day: WeekDay): CalendarCell | undefined {
    return this.calendarData.cells.get(this.getCellKey(timeSlot, day));
  }
}