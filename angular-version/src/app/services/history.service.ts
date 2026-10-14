import { Injectable, signal } from '@angular/core';
import { HistoryAction, HistoryState } from '../models/history.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private historyState: HistoryState = {
    actions: [],
    currentIndex: -1,
    maxHistorySize: 50
  };

  private readonly canUndoState = signal(false);
  private readonly canRedoState = signal(false);
  private undoCallback: ((action: HistoryAction) => void) | null = null;
  private redoCallback: ((action: HistoryAction) => void) | null = null;

  readonly canUndo = this.canUndoState.asReadonly();
  readonly canRedo = this.canRedoState.asReadonly();

  addAction(action: Omit<HistoryAction, 'timestamp'>): void {
    this.historyState.actions = this.historyState.actions.slice(0, this.historyState.currentIndex + 1);
    
    const fullAction: HistoryAction = {
      ...action,
      timestamp: new Date()
    };
    
    this.historyState.actions.push(fullAction);
    this.historyState.currentIndex++;
    
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

  clear(): void {
    this.historyState = {
      actions: [],
      currentIndex: -1,
      maxHistorySize: 50
    };
    this.updateButtonStates();
  }

  private updateButtonStates(): void {
    this.canUndoState.set(this.historyState.currentIndex >= 0);
    this.canRedoState.set(this.historyState.currentIndex < this.historyState.actions.length - 1);
  }

  getHistorySize(): number {
    return this.historyState.actions.length;
  }

  getCurrentIndex(): number {
    return this.historyState.currentIndex;
  }
}