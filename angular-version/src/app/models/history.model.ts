export interface HistoryAction {
  type: 'move' | 'add' | 'remove' | 'edit' | 'replace-week';
  activityId: string;
  originalPosition?: CellPosition | null;
  newPosition?: CellPosition | null;
  originalData?: any;
  newData?: any;
  timestamp: Date;
}

export interface CellPosition {
  day: string;
}

export interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
  maxHistorySize: number;
}