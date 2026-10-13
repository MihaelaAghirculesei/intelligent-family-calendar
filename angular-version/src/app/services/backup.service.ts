import { Injectable } from '@angular/core';
import { Activity, WeekDay } from '../models/activity.model';
import { WeeklyTemplate } from '../models/template.model';
import { CalendarService, WeekSnapshot } from './calendar.service';
import { HistoryService } from './history.service';
import { PersonData, PersonService } from './person.service';
import { TemplateService } from './template.service';

const FORMAT = 'intelligent-family-calendar';
const VERSION = 1;
const WEEK_DAYS: readonly string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export interface CalendarBackup {
  format: typeof FORMAT;
  version: typeof VERSION;
  exportedAt: string;
  week: WeekSnapshot;
  persons: PersonData[];
  templates: WeeklyTemplate[];
}

export class InvalidBackupError extends Error {}

// Everything the app keeps in the browser, as one versioned JSON document,
// so a calendar can be backed up or moved to another browser or device.
@Injectable({
  providedIn: 'root'
})
export class BackupService {
  constructor(
    private calendarService: CalendarService,
    private personService: PersonService,
    private templateService: TemplateService,
    private historyService: HistoryService
  ) {}

  createBackup(): CalendarBackup {
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      week: this.calendarService.getWeek(),
      persons: this.personService.getAllPersons(),
      templates: this.templateService.getAllTemplates()
    };
  }

  // Parses and checks the whole file before anything is replaced, so a wrong
  // or damaged file leaves the current data untouched.
  parse(json: string): CalendarBackup {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new InvalidBackupError('Not valid JSON');
    }

    const backup = isRecord(data) && data['format'] === FORMAT ? data : fromStorageDump(data);
    if (backup['version'] !== VERSION) {
      throw new InvalidBackupError('Unsupported backup version');
    }

    const week = backup['week'];
    // A storage dump from before family members were stored has none.
    const persons = backup['persons'] ?? this.personService.getAllPersons();
    const templates = backup['templates'];
    if (!Array.isArray(week) || !week.every(isWeekEntry)) {
      throw new InvalidBackupError('Invalid week');
    }
    if (!Array.isArray(persons) || !persons.every(isPerson)) {
      throw new InvalidBackupError('Invalid persons');
    }
    if (!Array.isArray(templates) || !templates.every(isTemplate)) {
      throw new InvalidBackupError('Invalid templates');
    }

    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: typeof backup['exportedAt'] === 'string' ? backup['exportedAt'] : '',
      week,
      persons,
      templates
    };
  }

  // The previous undo steps refer to data that no longer exists, so the
  // history starts over after an import.
  restore(backup: CalendarBackup): void {
    this.personService.replaceAll(backup.persons);
    this.templateService.replaceAll(backup.templates);
    this.calendarService.replaceWeek(backup.week);
    this.historyService.clear();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isActivity(value: unknown): value is Activity {
  return isRecord(value)
    && typeof value['id'] === 'string'
    && typeof value['title'] === 'string'
    && typeof value['person'] === 'string'
    && (value['timeRange'] === undefined || typeof value['timeRange'] === 'string');
}

function isWeekEntry(value: unknown): value is { day: WeekDay; activity: Activity } {
  return isRecord(value) && WEEK_DAYS.includes(value['day'] as string) && isActivity(value['activity']);
}

function isPerson(value: unknown): value is PersonData {
  return isRecord(value)
    && typeof value['id'] === 'string'
    && typeof value['name'] === 'string'
    && typeof value['color'] === 'string';
}

function isTemplate(value: unknown): value is WeeklyTemplate {
  return isRecord(value)
    && typeof value['id'] === 'string'
    && typeof value['name'] === 'string'
    && Array.isArray(value['activities'])
    && value['activities'].every(a => isActivity(a) && isRecord(a) && typeof a['day'] === 'string');
}

// A raw copy of this app's localStorage (each key holding a JSON string) is
// accepted too, so backups made by hand before this feature still import.
function fromStorageDump(data: unknown): Record<string, unknown> {
  if (!isRecord(data) || typeof data['calendarData'] !== 'string') {
    throw new InvalidBackupError('Not a calendar backup');
  }

  try {
    const calendar = JSON.parse(data['calendarData']);
    const cells: [string, { activities?: unknown[] }][] = calendar.version === 2 && Array.isArray(calendar.cells) ? calendar.cells : [];
    if (cells.length === 0) {
      throw new InvalidBackupError('Unsupported calendar data');
    }

    return {
      version: VERSION,
      week: cells.flatMap(([day, cell]) => (cell.activities ?? []).map(activity => ({ day, activity }))),
      persons: typeof data['persons'] === 'string' ? JSON.parse(data['persons']) : undefined,
      templates: typeof data['weeklyTemplates'] === 'string' ? JSON.parse(data['weeklyTemplates']) : []
    };
  } catch (e) {
    throw e instanceof InvalidBackupError ? e : new InvalidBackupError('Damaged calendar data');
  }
}
