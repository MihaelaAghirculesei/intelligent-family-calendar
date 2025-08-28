import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CalendarService } from '../../services/calendar.service';
import { HistoryService } from '../../services/history.service';
import { CalendarData, WeekDay, Activity } from '../../models/activity.model';
import { AddActivityComponent } from '../add-activity/add-activity.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, DragDropModule, AddActivityComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  @ViewChild('addActivityComponent') addActivityComponent!: AddActivityComponent;
  
  calendarData$!: Observable<CalendarData>;
  canUndo$!: Observable<boolean>;
  canRedo$!: Observable<boolean>;
  connectedDropLists: string[] = [];
  
  // Helper arrays for template iteration
  weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  weekDayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  timeSlots = [
    '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00', 
    '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
  ];

  constructor(
    private calendarService: CalendarService,
    private historyService: HistoryService
  ) {}

  ngOnInit(): void {
    this.calendarData$ = this.calendarService.calendar$;
    this.canUndo$ = this.historyService.canUndo$;
    this.canRedo$ = this.historyService.canRedo$;
    
    this.calendarService.setHistoryService(this.historyService);
  }

  getCellKey(timeSlot: string, day: WeekDay): string {
    return this.calendarService.getCellKey(timeSlot, day);
  }

  getCell(calendarData: CalendarData, timeSlot: string, day: WeekDay) {
    return calendarData.cells.get(this.getCellKey(timeSlot, day));
  }

  getPersonColor(person: string): string {
    switch (person) {
      case 'anna': return '#2196F3';
      case 'mia': return '#E91E63';
      case 'leo': return '#4CAF50';
      default: return '#333';
    }
  }

  getSchoolTime(timeSlot: string, day: WeekDay): string {
    if (timeSlot === '7:45-13:10') return '7:45-13:10';
    if (timeSlot === '8:15-14:00' && day === 'friday') return '8:15-14:00';
    if (timeSlot === '14:00-15:00') return '8:15-15:00';
    if (timeSlot === '15:00-16:00') return '8:15-16:00';
    return timeSlot;
  }


  onDrop(event: CdkDragDrop<Activity[]>, timeSlot: string, day: WeekDay): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const activity: Activity = event.item.data;
      const fromKey = event.previousContainer.id;
      const toKey = this.getCellKey(timeSlot, day);
      
      this.calendarService.moveActivity(activity.id, fromKey, toKey);
    }
  }

  onUndo(): void {
    this.historyService.undo();
  }

  onRedo(): void {
    this.historyService.redo();
  }

  showAddActivityForm(): void {
    this.addActivityComponent.show();
  }

  onActivityAdded(event: {activity: Activity, timeSlot: string, day: WeekDay}): void {
    this.calendarService.addActivity(event.activity, event.timeSlot, event.day);
  }

  onAddActivityCancelled(): void {
    // Form was cancelled, no action needed
  }
}
