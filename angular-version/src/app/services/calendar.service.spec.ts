import { TestBed } from '@angular/core/testing';
import { CalendarService } from './calendar.service';
import { HistoryService } from './history.service';
import { Activity, WeekDay } from '../models/activity.model';

const WEEK: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function emptyWeekInStorage(): void {
  localStorage.setItem('calendarData', JSON.stringify({
    version: 2,
    cells: WEEK.map(day => [day, { day, activities: [] }]),
    weekDays: WEEK
  }));
}

describe('CalendarService', () => {
  let calendar: CalendarService;
  let history: HistoryService;

  const activity = (id: string, timeRange = '10:00-11:00'): Activity =>
    ({ id, title: `Activity ${id}`, person: 'p1', timeRange });

  const idsOn = (day: WeekDay) =>
    calendar.getCell(day)!.activities.map(a => a.id);

  const createService = () => {
    TestBed.resetTestingModule();
    calendar = TestBed.inject(CalendarService);
    history = TestBed.inject(HistoryService);
    calendar.setHistoryService(history);
  };

  beforeEach(() => {
    localStorage.clear();
    emptyWeekInStorage();
    createService();
  });

  afterEach(() => localStorage.clear());

  it('moves an activity between days and undoes/redoes the move', () => {
    calendar.addActivity(activity('a'), 'monday');

    calendar.moveActivity('a', 'monday', 'friday');
    expect(idsOn('monday')).toEqual([]);
    expect(idsOn('friday')).toEqual(['a']);

    history.undo();
    expect(idsOn('monday')).toEqual(['a']);
    expect(idsOn('friday')).toEqual([]);

    history.redo();
    expect(idsOn('friday')).toEqual(['a']);
  });

  it('moves an activity to another time and undoes day and time together', () => {
    calendar.addActivity(activity('a', '10:00-11:00'), 'monday');

    calendar.moveActivity('a', 'monday', 'tuesday', '14:30-15:30');
    expect(calendar.getCell('tuesday')!.activities[0].timeRange).toBe('14:30-15:30');

    history.undo();
    expect(idsOn('monday')).toEqual(['a']);
    expect(calendar.getCell('monday')!.activities[0].timeRange).toBe('10:00-11:00');

    history.redo();
    expect(calendar.getCell('tuesday')!.activities[0].timeRange).toBe('14:30-15:30');
  });

  it('undoes an add and a delete', () => {
    calendar.addActivity(activity('a'), 'tuesday');
    history.undo();
    expect(idsOn('tuesday')).toEqual([]);

    history.redo();
    calendar.deleteActivity('a');
    expect(idsOn('tuesday')).toEqual([]);

    history.undo();
    expect(idsOn('tuesday')).toEqual(['a']);
  });

  it('undoes an edit back to the original values', () => {
    calendar.addActivity(activity('a'), 'monday');

    calendar.updateActivity('a', { title: 'Renamed', timeRange: '12:00-13:00' });
    expect(calendar.getCell('monday')!.activities[0].title).toBe('Renamed');

    history.undo();
    expect(calendar.getCell('monday')!.activities[0]).toEqual(activity('a'));
  });

  it('replaces the whole week with a template and can undo/redo it', () => {
    calendar.addActivity(activity('existing'), 'monday');

    calendar.applyTemplate([
      { id: 't1', title: 'Swim', person: 'p1', timeRange: '17:00-18:00', day: 'wednesday' },
      { id: 't2', title: 'Music', person: 'p2', timeRange: '18:00-19:00', day: 'thursday' }
    ]);
    const appliedIds = [...idsOn('wednesday'), ...idsOn('thursday')];
    expect(idsOn('monday')).toEqual([]);
    expect(appliedIds.length).toBe(2);

    history.undo();
    expect(idsOn('monday')).toEqual(['existing']);
    expect(idsOn('wednesday')).toEqual([]);

    history.redo();
    expect(idsOn('monday')).toEqual([]);
    expect([...idsOn('wednesday'), ...idsOn('thursday')]).toEqual(appliedIds);
  });

  it('skips template activities with an unknown day', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    calendar.applyTemplate([
      { id: 't1', title: 'Swim', person: 'p1', day: 'wednesday' },
      { id: 't2', title: 'Ghost', person: 'p1', day: 'someday' }
    ]);

    expect(idsOn('wednesday').length).toBe(1);
    expect(console.warn).toHaveBeenCalled();
  });

  it('persists the week to localStorage and restores it on startup', () => {
    calendar.addActivity(activity('a'), 'saturday');

    createService();

    expect(idsOn('saturday')).toEqual(['a']);
  });

  it('migrates data saved by the old fixed time-slot grid', () => {
    localStorage.setItem('calendarData', JSON.stringify({
      cells: [
        ['15:00-16:00-monday', { activities: [activity('old1')] }],
        ['17:00-18:00-monday', { activities: [activity('old2')] }],
        ['09:00-10:00-sunday', { activities: [activity('old3')] }]
      ]
    }));

    createService();

    expect(idsOn('monday')).toEqual(['old1', 'old2']);
    expect(idsOn('sunday')).toEqual(['old3']);
  });
});
