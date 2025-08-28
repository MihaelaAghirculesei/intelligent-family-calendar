import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HistoryAction, HistoryState, CellPosition } from '../models/history.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private historyState: HistoryState = {
    actions: [],
    currentIndex: -1,
    maxHistorySize: 50
  };

  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);
  private undoCallback: ((action: HistoryAction) => void) | null = null;
  private redoCallback: ((action: HistoryAction) => void) | null = null;

  constructor() {}

  get canUndo$(): Observable<boolean> {
    return this.canUndoSubject.asObservable();
  }

  get canRedo$(): Observable<boolean> {
    return this.canRedoSubject.asObservable();
  }

  addAction(action: Omit<HistoryAction, 'timestamp'>): void {
    // Remove any actions after current index (when user does new action after undo)
    this.historyState.actions = this.historyState.actions.slice(0, this.historyState.currentIndex + 1);
    
    // Add new action with timestamp
    const fullAction: HistoryAction = {
      ...action,
      timestamp: new Date()
    };
    
    this.historyState.actions.push(fullAction);
    this.historyState.currentIndex++;
    
    // Limit history size
    if (this.historyState.actions.length > this.historyState.maxHistorySize) {
      this.historyState.actions.shift();
      this.historyState.currentIndex--;
    }
    
    this.updateButtonStates();
  }

  setCallbacks(undoCallback: (action: HistoryAction) => void, redoCallback: (action: HistoryAction) => void): void {
    this.undoCallback = undoCallback;
    this.redoCallback = redoCallback;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    
    const action = this.historyState.actions[this.historyState.currentIndex];
    
    if (this.undoCallback) {
      this.undoCallback(action);
    }
    
    this.historyState.currentIndex--;
    this.updateButtonStates();
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    
    this.historyState.currentIndex++;
    const action = this.historyState.actions[this.historyState.currentIndex];
    
    if (this.redoCallback) {
      this.redoCallback(action);
    }
    
    this.updateButtonStates();
    return true;
  }

  canUndo(): boolean {
    return this.historyState.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.historyState.currentIndex < this.historyState.actions.length - 1;
  }

  clear(): void {
    this.historyState = {
      actions: [],
      currentIndex: -1,
      maxHistorySize: 50
    };
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    this.canUndoSubject.next(this.canUndo());
    this.canRedoSubject.next(this.canRedo());
  }

  private positionToKey(position: CellPosition): string {
    return `${position.timeSlot}-${position.day}`;
  }

  getHistorySize(): number {
    return this.historyState.actions.length;
  }

  getCurrentIndex(): number {
    return this.historyState.currentIndex;
  }
}