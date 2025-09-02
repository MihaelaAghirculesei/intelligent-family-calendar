import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CalendarService } from '../../services/calendar.service';
import { HistoryService } from '../../services/history.service';
import { CalendarData, WeekDay, Activity, Person } from '../../models/activity.model';
import { AddActivityComponent } from '../add-activity/add-activity.component';
import { AddPersonComponent } from '../add-person/add-person.component';
import { SaveTemplateComponent } from '../save-template/save-template.component';
import { TemplateListComponent } from '../template-list/template-list.component';
import { PersonService, PersonData } from '../../services/person.service';
import { TemplateService } from '../../services/template.service';
import { SaveTemplateData } from '../../models/template.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, AddActivityComponent, AddPersonComponent, SaveTemplateComponent, TemplateListComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  @ViewChild('addActivityComponent') addActivityComponent!: AddActivityComponent;
  @ViewChild('addPersonComponent') addPersonComponent!: AddPersonComponent;
  @ViewChild('saveTemplateComponent') saveTemplateComponent!: SaveTemplateComponent;
  @ViewChild('templateListComponent') templateListComponent!: TemplateListComponent;
  
  calendarData$!: Observable<CalendarData>;
  canUndo$!: Observable<boolean>;
  canRedo$!: Observable<boolean>;
  connectedDropLists: string[] = [];
  persons: any[] = [];
  templateCount = 0;
  
  editingActivityId: string | null = null;
  editForm: {
    title: string;
    timeRange: string;
    person: Person;
  } = { title: '', timeRange: '', person: 'anna' };
  
  weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  weekDayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  timeSlots = [
    '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00', 
    '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
  ];

  constructor(
    private calendarService: CalendarService,
    private historyService: HistoryService,
    private personService: PersonService,
    private templateService: TemplateService
  ) {}

  ngOnInit(): void {
    this.calendarData$ = this.calendarService.calendar$;
    this.canUndo$ = this.historyService.canUndo$;
    this.canRedo$ = this.historyService.canRedo$;
    
    this.calendarService.setHistoryService(this.historyService);
    
    this.personService.persons$.subscribe(persons => {
      this.persons = persons;
    });

    this.templateService.templates$.subscribe(templates => {
      this.templateCount = templates.length;
    });

    this.connectedDropLists = [];
    for (const timeSlot of this.timeSlots) {
      for (const day of this.weekDays) {
        this.connectedDropLists.push(this.getCellKey(timeSlot, day));
      }
    }
  }

  getCellKey(timeSlot: string, day: WeekDay): string {
    return this.calendarService.getCellKey(timeSlot, day);
  }

  getCell(calendarData: CalendarData, timeSlot: string, day: WeekDay) {
    return calendarData.cells.get(this.getCellKey(timeSlot, day));
  }

  getPersonColor(person: string): string {
    return this.personService.getPersonColor(person);
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
  }

  startEdit(activity: Activity): void {
    this.editingActivityId = activity.id;
    this.editForm = {
      title: activity.title,
      timeRange: activity.timeRange || '',
      person: activity.person
    };
  }

  saveEdit(): void {
    if (!this.editingActivityId) return;
    
    const updates: Partial<Activity> = {
      title: this.editForm.title,
      timeRange: this.editForm.timeRange,
      person: this.editForm.person
    };
    
    this.calendarService.updateActivity(this.editingActivityId, updates);
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingActivityId = null;
    const firstPerson = this.persons.length > 0 ? this.persons[0].id : 'anna';
    this.editForm = { title: '', timeRange: '', person: firstPerson };
  }

  showAddPersonForm(): void {
    this.addPersonComponent.show();
  }

  onPersonAdded(personData: PersonData): void {
    const newPerson = this.personService.addPerson(personData.name, personData.color);
    this.editForm.person = newPerson.id;
  }

  onAddPersonCancelled(): void {
  }

  deleteActivity(): void {
    if (!this.editingActivityId) return;
    
    const confirmed = confirm('Sei sicuro di voler eliminare questa attività?');
    if (confirmed) {
      this.calendarService.deleteActivity(this.editingActivityId);
      this.cancelEdit();
    }
  }

  showSaveTemplateDialog(): void {
    this.saveTemplateComponent.show();
  }

  onTemplateSaved(templateData: SaveTemplateData): void {
    this.calendarService.calendar$.subscribe(calendarData => {
      const savedTemplate = this.templateService.saveCurrentWeekAsTemplate(calendarData, templateData);
      alert(`Template "${savedTemplate.name}" salvato con successo! 💾\n\nAttività salvate: ${savedTemplate.activities.length}`);
    }).unsubscribe();
  }

  onSaveTemplateCancelled(): void {
  }

  showTemplateListDialog(): void {
    this.templateListComponent.show();
  }

  onTemplateApplied(template: any): void {
    this.calendarService.applyTemplate(template.activities);
    
    // Give feedback after applying
    setTimeout(() => {
      const totalActivities = template.activities.length;
      alert(`Template "${template.name}" applicato con successo! ✅\n\n📋 ${totalActivities} attività caricate nel calendario\n\n🎯 Le attività sono state distribuite automaticamente sui giorni della settimana.`);
    }, 100);
  }

  onTemplateListCancelled(): void {
  }
}
