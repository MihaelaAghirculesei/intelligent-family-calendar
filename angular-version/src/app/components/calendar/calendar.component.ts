import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
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

interface ActivityBlock {
  activity: Activity;
  style: {
    top: string;
    height: string;
    left: string;
    width: string;
  };
}

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

  // Continuous time grid, like Google Calendar: activities are positioned
  // by their real start/end time instead of a fixed row per time slot.
  // The 7:00-22:00 default window expands automatically to fit any activity
  // that falls outside it, so nothing ever gets clipped off-screen.
  private readonly defaultStartHour = 7;
  private readonly defaultEndHour = 22;
  readonly pxPerMinute = 1; // 60px per hour
  gridStartHour = this.defaultStartHour;
  gridEndHour = this.defaultEndHour;
  gridHeightPx = (this.gridEndHour - this.gridStartHour) * 60 * this.pxPerMinute;
  hourMarks: number[] = [];

  dayBlocks: Record<WeekDay, ActivityBlock[]> = {
    monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
  };

  constructor(
    private calendarService: CalendarService,
    private historyService: HistoryService,
    private personService: PersonService,
    private templateService: TemplateService
  ) {
    this.rebuildHourMarks();
  }

  private rebuildHourMarks(): void {
    this.hourMarks = [];
    for (let h = this.gridStartHour; h <= this.gridEndHour; h++) {
      this.hourMarks.push(h);
    }
  }

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

    this.connectedDropLists = [...this.weekDays];

    this.calendarData$.subscribe(calendarData => {
      this.recomputeLayout(calendarData);
    });
  }

  getCell(calendarData: CalendarData, day: WeekDay) {
    return calendarData.cells.get(day);
  }

  getPersonColor(person: string): string {
    return this.personService.getPersonColor(person);
  }

  hourLabel(hour: number): string {
    return `${hour}:00`;
  }

  getBlockStyle(block: ActivityBlock): { top: string; height: string; left: string; width: string } {
    if (this.editingActivityId === block.activity.id) {
      return { top: block.style.top, height: '150px', left: '2px', width: 'calc(100% - 4px)' };
    }
    return block.style;
  }

  private parseTimeRange(timeRange: string | undefined): { start: number; end: number } | null {
    if (!timeRange) return null;
    const match = timeRange.match(/^\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})\s*$/);
    if (!match) return null;

    const start = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    let end = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
    if (end <= start) end = start + 30;

    return { start, end };
  }

  private recomputeLayout(calendarData: CalendarData): void {
    // Widen the grid to fit any activity outside the default 7:00-22:00
    // window (e.g. an early-morning or late-evening appointment), so it
    // never ends up clipped by the grid's rounded-corner overflow:hidden.
    let minStart = this.defaultStartHour * 60;
    let maxEnd = this.defaultEndHour * 60;

    this.weekDays.forEach(day => {
      (calendarData.cells.get(day)?.activities || []).forEach(activity => {
        const parsed = this.parseTimeRange(activity.timeRange);
        if (!parsed) return;
        minStart = Math.min(minStart, parsed.start);
        maxEnd = Math.max(maxEnd, parsed.end);
      });
    });

    this.gridStartHour = Math.floor(minStart / 60);
    this.gridEndHour = Math.ceil(maxEnd / 60);
    this.gridHeightPx = (this.gridEndHour - this.gridStartHour) * 60 * this.pxPerMinute;
    this.rebuildHourMarks();

    const gridStart = this.gridStartHour * 60;
    const gridEnd = this.gridEndHour * 60;

    this.weekDays.forEach(day => {
      const activities = calendarData.cells.get(day)?.activities || [];

      type Item = { activity: Activity; start: number; end: number };
      const items: Item[] = activities
        .map(activity => {
          const parsed = this.parseTimeRange(activity.timeRange);
          return {
            activity,
            start: parsed ? parsed.start : gridStart,
            end: parsed ? parsed.end : gridStart + 30
          };
        })
        .sort((a, b) => a.start - b.start || a.end - b.end);

      const blocks: ActivityBlock[] = [];
      let cluster: Item[] = [];
      let clusterEnd = -Infinity;

      const flushCluster = () => {
        if (cluster.length === 0) return;

        // Greedy column assignment for overlapping activities within this cluster.
        const columnEnds: number[] = [];
        const colOf: number[] = [];
        cluster.forEach(item => {
          let placedCol = -1;
          for (let c = 0; c < columnEnds.length; c++) {
            if (item.start >= columnEnds[c]) {
              columnEnds[c] = item.end;
              placedCol = c;
              break;
            }
          }
          if (placedCol === -1) {
            columnEnds.push(item.end);
            placedCol = columnEnds.length - 1;
          }
          colOf.push(placedCol);
        });

        const totalCols = columnEnds.length;
        cluster.forEach((item, i) => {
          const clampedStart = Math.max(item.start, gridStart);
          const clampedEnd = Math.min(item.end, gridEnd);
          const top = (clampedStart - gridStart) * this.pxPerMinute;
          const height = Math.max((clampedEnd - clampedStart) * this.pxPerMinute, 16);
          const widthPct = 100 / totalCols;
          const leftPct = widthPct * colOf[i];

          blocks.push({
            activity: item.activity,
            style: {
              top: `${top}px`,
              height: `${height}px`,
              left: `calc(${leftPct}% + 1px)`,
              width: `calc(${widthPct}% - 2px)`
            }
          });
        });

        cluster = [];
      };

      items.forEach(item => {
        if (cluster.length > 0 && item.start >= clusterEnd) {
          flushCluster();
        }
        cluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.end);
      });
      flushCluster();

      this.dayBlocks[day] = blocks;
    });
  }

  onDrop(event: CdkDragDrop<Activity[]>, day: WeekDay): void {
    if (event.previousContainer === event.container) return;

    const activity: Activity = event.item.data;
    const fromDay = event.previousContainer.id as WeekDay;
    this.calendarService.moveActivity(activity.id, fromDay, day);
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

  onActivityAdded(event: {activity: Activity, day: WeekDay}): void {
    this.calendarService.addActivity(event.activity, event.day);
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

    setTimeout(() => {
      const totalActivities = template.activities.length;
      alert(`Template "${template.name}" applicato con successo! ✅\n\n📋 ${totalActivities} attività caricate nel calendario`);
    }, 100);
  }

  onTemplateListCancelled(): void {
  }
}
