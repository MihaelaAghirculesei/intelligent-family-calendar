import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { CalendarService } from '../../services/calendar.service';
import { CalendarData, WeekDay } from '../../models/activity.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  calendarData$!: Observable<CalendarData>;
  
  // Helper arrays for template iteration
  weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  weekDayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  timeSlots = [
    '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00', 
    '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
  ];

  constructor(private calendarService: CalendarService) {}

  ngOnInit(): void {
    this.calendarData$ = this.calendarService.calendar$;
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
}
