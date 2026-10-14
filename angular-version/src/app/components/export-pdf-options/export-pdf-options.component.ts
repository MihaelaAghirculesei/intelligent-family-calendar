import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface PdfExportChoice {
  includeWeekend: boolean;
}

@Component({
  selector: 'app-export-pdf-options',
  imports: [FormsModule],
  templateUrl: './export-pdf-options.component.html',
  styleUrl: './export-pdf-options.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportPdfOptionsComponent {
  readonly exportConfirmed = output<PdfExportChoice>();
  readonly cancelled = output<void>();

  readonly isVisible = signal(false);
  includeWeekend = true;

  show(): void {
    this.isVisible.set(true);
  }

  hide(): void {
    this.isVisible.set(false);
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.isVisible.set(false);
    this.exportConfirmed.emit({
      includeWeekend: this.includeWeekend
    });
  }
}
