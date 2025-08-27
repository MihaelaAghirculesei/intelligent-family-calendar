export interface HistoryAction {
  type: 'move' | 'add' | 'remove' | 'edit';
  activityId: string;
  originalPosition?: CellPosition;
  newPosition?: CellPosition;
  originalData?: any;
  newData?: any;
  timestamp: Date;
}

export interface CellPosition {
  row: number;
  col: number;
  timeSlot: string;
  day: string;
}

export interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
  maxHistorySize: number;
}