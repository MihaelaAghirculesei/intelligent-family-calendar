import { Component, ElementRef, HostListener, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
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
import { ExportPdfOptionsComponent, PdfExportChoice } from '../export-pdf-options/export-pdf-options.component';
import { PersonService, PersonData } from '../../services/person.service';
import { TemplateService } from '../../services/template.service';
import { PdfExportService, PDF_PRINTABLE_ASPECT_RATIO } from '../../services/pdf-export.service';
import { SaveTemplateData, WeeklyTemplate } from '../../models/template.model';
import { HyphenatePipe } from '../../pipes/hyphenate.pipe';

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
  imports: [CommonModule, FormsModule, DragDropModule, AddActivityComponent, AddPersonComponent, SaveTemplateComponent, TemplateListComponent, ExportPdfOptionsComponent, HyphenatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class CalendarComponent implements OnInit {
  @ViewChild('addActivityComponent') addActivityComponent!: AddActivityComponent;
  @ViewChild('addPersonComponent') addPersonComponent!: AddPersonComponent;
  @ViewChild('saveTemplateComponent') saveTemplateComponent!: SaveTemplateComponent;
  @ViewChild('templateListComponent') templateListComponent!: TemplateListComponent;
  @ViewChild('exportPdfOptionsComponent') exportPdfOptionsComponent!: ExportPdfOptionsComponent;
  @ViewChild('printArea') printArea!: ElementRef<HTMLElement>;

  calendarData$!: Observable<CalendarData>;
  canUndo$!: Observable<boolean>;
  canRedo$!: Observable<boolean>;
  connectedDropLists: string[] = [];
  persons: PersonData[] = [];
  templateCount = 0;
  isExportingPdf = false;

  editingActivityId: string | null = null;
  editForm: {
    title: string;
    timeRange: string;
    person: Person;
  } = { title: '', timeRange: '', person: '' };

  weekDays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  weekDayLabels = [
    $localize`Monday`, $localize`Tuesday`, $localize`Wednesday`, $localize`Thursday`,
    $localize`Friday`, $localize`Saturday`, $localize`Sunday`
  ];

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
    private templateService: TemplateService,
    private pdfExportService: PdfExportService
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
        // When several activities sit side by side in narrow columns, give them
        // enough height to show 3-4 wrapped lines of text instead of being cut off.
        const minHeight = totalCols > 1 ? 44 : 16;
        cluster.forEach((item, i) => {
          const clampedStart = Math.max(item.start, gridStart);
          const clampedEnd = Math.min(item.end, gridEnd);
          const top = (clampedStart - gridStart) * this.pxPerMinute;
          const height = Math.max((clampedEnd - clampedStart) * this.pxPerMinute, minHeight);
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

  // Ctrl/Cmd+Z undoes, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z redoes. Ignored while
  // typing in a field, so the browser's own text undo keeps working there.
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return;

    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.onUndo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      this.onRedo();
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

  onActivityAdded(event: {activity: Activity, day: WeekDay}): void {
    this.calendarService.addActivity(event.activity, event.day);
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
    const firstPerson = this.persons.length > 0 ? this.persons[0].id : '';
    this.editForm = { title: '', timeRange: '', person: firstPerson };
  }

  showAddPersonForm(): void {
    this.addPersonComponent.show();
  }

  onPersonAdded(personData: PersonData): void {
    const newPerson = this.personService.addPerson(personData.name, personData.color);
    this.editForm.person = newPerson.id;
  }

  deleteActivity(): void {
    if (!this.editingActivityId) return;

    const confirmed = confirm($localize`Are you sure you want to delete this activity?`);
    if (confirmed) {
      this.calendarService.deleteActivity(this.editingActivityId);
      this.cancelEdit();
    }
  }

  showExportPdfDialog(): void {
    this.exportPdfOptionsComponent.show();
  }

  async onExportPdfConfirmed(choice: PdfExportChoice): Promise<void> {
    if (this.isExportingPdf) return;

    this.isExportingPdf = true;
    const el = this.printArea.nativeElement;

    // Fix each day column to a set pixel width during export (instead of the
    // on-screen flex:1 stretch) so hiding the weekend actually narrows the
    // captured grid rather than letting Mon-Fri simply stretch to fill the
    // same width — a narrower capture is what makes everything print bigger.
    el.classList.add('pdf-export');
    if (!choice.includeWeekend) {
      el.classList.add('pdf-hide-weekend');
    }

    try {
      // Let the browser apply the class changes before capturing.
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.fitDayColumnsToPage(el);
      await new Promise(resolve => requestAnimationFrame(resolve));

      const today = new Date().toISOString().slice(0, 10);
      await this.pdfExportService.exportElement(el, $localize`family-schedule` + `-${today}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert($localize`Could not generate the PDF. Please try again.`);
    } finally {
      el.classList.remove('pdf-export', 'pdf-hide-weekend');
      el.style.removeProperty('--pdf-day-width');
      this.isExportingPdf = false;
    }
  }

  // Widen or narrow the day columns so the captured area has the same
  // proportions as the printable part of an A4-landscape sheet. The grid's
  // height is fixed by its hours, so only the width needs adjusting; a second
  // pass absorbs borders and rounding.
  private fitDayColumnsToPage(el: HTMLElement): void {
    const visibleDays = Array.from(el.querySelectorAll<HTMLElement>('.day-column'))
      .filter(column => column.offsetParent !== null);
    if (visibleDays.length === 0) return;

    const targetWidth = el.offsetHeight * PDF_PRINTABLE_ASPECT_RATIO;
    let dayWidth = visibleDays[0].getBoundingClientRect().width;

    for (let pass = 0; pass < 2; pass++) {
      dayWidth += (targetWidth - el.offsetWidth) / visibleDays.length;
      el.style.setProperty('--pdf-day-width', `${Math.max(dayWidth, 80)}px`);
    }
  }

  showSaveTemplateDialog(): void {
    this.saveTemplateComponent.show();
  }

  onTemplateSaved(templateData: SaveTemplateData): void {
    this.calendarService.calendar$.subscribe(calendarData => {
      const savedTemplate = this.templateService.saveCurrentWeekAsTemplate(calendarData, templateData);
      const { name, activities } = savedTemplate;
      alert($localize`Template "${name}:name:" saved! 💾\n\nActivities saved: ${activities.length}:count:`);
    }).unsubscribe();
  }

  showTemplateListDialog(): void {
    this.templateListComponent.show();
  }

  onTemplateApplied(template: WeeklyTemplate): void {
    this.calendarService.applyTemplate(template.activities);

    setTimeout(() => {
      const totalActivities = template.activities.length;
      alert($localize`Template "${template.name}:name:" applied! ✅\n\n📋 ${totalActivities}:count: activities loaded into the calendar`);
    }, 100);
  }
}
