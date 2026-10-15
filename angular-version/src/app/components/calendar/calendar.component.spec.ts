import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar.component';
import { CalendarService } from '../../services/calendar.service';
import { HistoryService } from '../../services/history.service';
import { WeekDay } from '../../models/activity.model';

const WEEK: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let component: CalendarComponent;
  let calendar: CalendarService;
  let history: HistoryService;

  const add = (id: string, timeRange: string, day: WeekDay = 'monday') =>
    calendar.addActivity({ id, title: id, person: 'p1', timeRange }, day);

  const block = (id: string) =>
    component.dayBlocks.monday.find(b => b.activity.id === id)!;

  const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true, ...init }));

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('calendarData', JSON.stringify({
      version: 2,
      cells: WEEK.map(day => [day, { day, activities: [] }]),
      weekDays: WEEK
    }));

    TestBed.configureTestingModule({ imports: [CalendarComponent] });
    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    calendar = TestBed.inject(CalendarService);
    history = TestBed.inject(HistoryService);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    localStorage.clear();
  });

  describe('grid layout', () => {
    it('positions an activity by its start time and sizes it by duration', () => {
      add('a', '09:30-11:00');

      // Default window starts at 7:00, one pixel per minute.
      expect(block('a').style.top).toBe('150px');
      expect(block('a').style.height).toBe('90px');
    });

    it('places overlapping activities side by side', () => {
      add('a', '15:00-16:00');
      add('b', '15:30-16:30');

      expect(block('a').style.width).toBe('calc(50% - 2px)');
      expect(block('a').style.left).toBe('calc(0% + 1px)');
      expect(block('b').style.left).toBe('calc(50% + 1px)');
    });

    it('keeps full width for activities that only touch', () => {
      add('a', '15:00-16:00');
      add('b', '16:00-17:00');

      expect(block('a').style.width).toBe('calc(100% - 2px)');
      expect(block('b').style.width).toBe('calc(100% - 2px)');
    });

    it('widens the grid to fit activities outside 7:00-22:00', () => {
      add('early', '06:15-07:00');
      add('late', '22:00-23:30');

      expect(component.gridStartHour).toBe(6);
      expect(component.gridEndHour).toBe(24);
      expect(block('early').style.top).toBe('15px');
    });
  });

  describe('hover details', () => {
    const blockElement = () =>
      fixture.nativeElement.querySelector('.grid-activity') as HTMLElement;
    const card = () =>
      fixture.nativeElement.querySelector('.activity-details') as HTMLElement | null;

    beforeEach(() => {
      add('Swimming lesson', '16:00-17:00');
      fixture.detectChanges();
    });

    const pointer = (type: string, pointerType: string, target: EventTarget = blockElement()) =>
      target.dispatchEvent(new PointerEvent(type, { pointerType, bubbles: true }));

    it('shows the full title, person and time while hovering a block', () => {
      pointer('pointerenter', 'mouse');
      fixture.detectChanges();

      expect(card()?.textContent).toContain('Swimming lesson');
      expect(card()?.textContent).toContain('16:00-17:00');

      pointer('pointerleave', 'mouse');
      fixture.detectChanges();

      expect(card()).toBeNull();
    });

    it('toggles the details with a tap on touch screens', () => {
      pointer('pointerup', 'touch');
      fixture.detectChanges();
      expect(card()?.textContent).toContain('Swimming lesson');

      pointer('pointerup', 'touch');
      fixture.detectChanges();
      expect(card()).toBeNull();
    });

    it('closes the details on a tap outside the blocks', () => {
      pointer('pointerup', 'touch');
      fixture.detectChanges();

      pointer('pointerdown', 'touch', document.body);
      fixture.detectChanges();

      expect(card()).toBeNull();
    });

    it('does not open the details at the end of a drag', () => {
      component.onDragStarted();
      pointer('pointerup', 'touch');
      fixture.detectChanges();

      expect(card()).toBeNull();
    });
  });

  describe('keyboard access to the blocks', () => {
    const blockElement = () =>
      fixture.nativeElement.querySelector('.grid-activity') as HTMLElement;
    const key = (k: string, target: EventTarget = blockElement()) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

    beforeEach(() => {
      add('Swimming lesson', '16:00-17:00');
      fixture.detectChanges();
    });

    it('makes every block a focusable button named by its title, person and time', () => {
      expect(blockElement().getAttribute('tabindex')).toBe('0');
      expect(blockElement().getAttribute('role')).toBe('button');
      expect(blockElement().getAttribute('aria-label')).toBe('Swimming lesson, p1, 16:00-17:00');
    });

    it('opens the edit form with Enter or Space', () => {
      key('Enter');
      expect(component.editingActivityId()).toBe('Swimming lesson');

      component.cancelEdit();
      key(' ');
      expect(component.editingActivityId()).toBe('Swimming lesson');
    });

    it('turns the block into a group while it holds the form', () => {
      key('Enter');
      fixture.detectChanges();

      expect(blockElement().getAttribute('role')).toBe('group');
      expect(blockElement().getAttribute('tabindex')).toBe('-1');
    });

    it('ignores keys typed into the edit form', () => {
      key('Enter');
      fixture.detectChanges();
      component.editForm.title = 'Swimming lesson and diving';

      key(' ', fixture.nativeElement.querySelector('.title-input'));

      expect(component.editForm.title).toBe('Swimming lesson and diving');
    });
  });

  describe('keyboard shortcuts', () => {
    beforeEach(() => {
      add('a', '10:00-11:00');
      vi.spyOn(history, 'undo');
      vi.spyOn(history, 'redo');
    });

    it('undoes with Ctrl+Z and redoes with Ctrl+Y or Ctrl+Shift+Z', () => {
      press('z');
      expect(history.undo).toHaveBeenCalledTimes(1);

      press('y');
      press('Z', { shiftKey: true });
      expect(history.redo).toHaveBeenCalledTimes(2);
    });

    it('supports Cmd on macOS', () => {
      press('z', { ctrlKey: false, metaKey: true });
      expect(history.undo).toHaveBeenCalled();
    });

    it('leaves Ctrl+Z to the browser while typing in a field', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      press('z', {}, input);

      expect(history.undo).not.toHaveBeenCalled();
      input.remove();
    });

    it('ignores Z without a modifier', () => {
      press('z', { ctrlKey: false });
      expect(history.undo).not.toHaveBeenCalled();
    });
  });
});
