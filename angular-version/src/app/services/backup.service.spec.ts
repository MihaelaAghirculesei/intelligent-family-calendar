import { TestBed } from '@angular/core/testing';
import { BackupService, InvalidBackupError } from './backup.service';
import { CalendarService } from './calendar.service';
import { HistoryService } from './history.service';
import { PersonService } from './person.service';
import { TemplateService } from './template.service';
import { WeekDay } from '../models/activity.model';

const WEEK: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

describe('BackupService', () => {
  let backups: BackupService;
  let calendar: CalendarService;
  let history: HistoryService;

  const family = [{ id: 'sam', name: 'Sam', color: '#123456', isDefault: true }];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('calendarData', JSON.stringify({
      version: 2,
      cells: WEEK.map(day => [day, { day, activities: [] }]),
      weekDays: WEEK
    }));
    localStorage.setItem('persons', JSON.stringify(family));

    TestBed.resetTestingModule();
    backups = TestBed.inject(BackupService);
    calendar = TestBed.inject(CalendarService);
    history = TestBed.inject(HistoryService);
    calendar.setHistoryService(history);
  });

  afterEach(() => localStorage.clear());

  it('round-trips the week, family and templates through JSON', () => {
    calendar.addActivity({ id: 'a', title: 'Swimming', person: 'sam', timeRange: '16:30-17:30' }, 'monday');
    TestBed.inject(TemplateService).saveCurrentWeekAsTemplate(
      { cells: new Map([['monday', { day: 'monday', activities: [] }]]), weekDays: ['monday'] },
      { name: 'Empty week' }
    );
    const json = JSON.stringify(backups.createBackup());

    calendar.deleteActivity('a');
    backups.restore(backups.parse(json));

    expect(calendar.getWeek()).toEqual([
      { day: 'monday', activity: { id: 'a', title: 'Swimming', person: 'sam', timeRange: '16:30-17:30' } }
    ]);
    expect(TestBed.inject(PersonService).getAllPersons()).toEqual(family);
    expect(TestBed.inject(TemplateService).getAllTemplates()[0].name).toBe('Empty week');
  });

  it('starts the undo history over after an import', () => {
    calendar.addActivity({ id: 'a', title: 'Swimming', person: 'sam' }, 'monday');
    const backup = backups.parse(JSON.stringify(backups.createBackup()));

    backups.restore(backup);

    expect(history.canUndo()).toBe(false);
  });

  it('rejects files that are not a calendar backup', () => {
    expect(() => backups.parse('not json')).toThrowError(InvalidBackupError);
    expect(() => backups.parse('{"hello": "world"}')).toThrowError(InvalidBackupError);
    expect(() => backups.parse(JSON.stringify({
      format: 'intelligent-family-calendar', version: 1, week: [{ day: 'someday', activity: {} }], persons: [], templates: []
    }))).toThrowError(InvalidBackupError);
  });

  it('imports a raw copy of the browser storage made by hand', () => {
    const dump = {
      calendarData: JSON.stringify({
        version: 2,
        cells: [['friday', { day: 'friday', activities: [{ id: 'b', title: 'Guitar', person: 'sam' }] }]]
      }),
      weeklyTemplates: '[]'
    };

    const backup = backups.parse(JSON.stringify(dump));

    expect(backup.week).toEqual([{ day: 'friday', activity: { id: 'b', title: 'Guitar', person: 'sam' } }]);
    // No stored family in the dump: the current one is kept.
    expect(backup.persons).toEqual(family);
  });
});
