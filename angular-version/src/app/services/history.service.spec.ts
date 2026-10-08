import { HistoryService } from './history.service';
import { HistoryAction } from '../models/history.model';

describe('HistoryService', () => {
  let history: HistoryService;
  let undone: HistoryAction[];
  let redone: HistoryAction[];

  const move = (activityId: string) => ({
    type: 'move' as const,
    activityId,
    originalPosition: { day: 'monday' },
    newPosition: { day: 'tuesday' }
  });

  beforeEach(() => {
    history = new HistoryService();
    undone = [];
    redone = [];
    history.setCallbacks(a => undone.push(a), a => redone.push(a));
  });

  it('starts with nothing to undo or redo', () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(false);
  });

  it('undoes and redoes actions in order', () => {
    history.addAction(move('a'));
    history.addAction(move('b'));

    history.undo();
    history.undo();
    expect(undone.map(a => a.activityId)).toEqual(['b', 'a']);
    expect(history.canUndo()).toBe(false);

    history.redo();
    expect(redone.map(a => a.activityId)).toEqual(['a']);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(true);
  });

  it('drops the redo branch when a new action is recorded after an undo', () => {
    history.addAction(move('a'));
    history.addAction(move('b'));
    history.undo();

    history.addAction(move('c'));

    expect(history.canRedo()).toBe(false);
    expect(history.getHistorySize()).toBe(2);
  });

  it('keeps at most 50 actions', () => {
    for (let i = 0; i < 60; i++) {
      history.addAction(move(`a${i}`));
    }

    expect(history.getHistorySize()).toBe(50);
    while (history.undo()) { /* undo everything */ }
    expect(undone[undone.length - 1].activityId).toBe('a10');
  });

  it('publishes button state changes', () => {
    const states: boolean[] = [];
    history.canUndo$.subscribe(v => states.push(v));

    history.addAction(move('a'));
    history.undo();

    expect(states).toEqual([false, true, false]);
  });
});
