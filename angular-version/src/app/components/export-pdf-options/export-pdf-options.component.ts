import { Component, ChangeDetectionStrategy, output } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface PdfExportChoice {
  includeWeekend: boolean;
}

@Component({
  selector: 'app-export-pdf-options',
  imports: [FormsModule],
  templateUrl: './export-pdf-options.component.html',
  styleUrl: './export-pdf-options.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ExportPdfOptionsComponent {
  readonly exportConfirmed = output<PdfExportChoice>();
  readonly cancelled = output<void>();

  isVisible = false;
  includeWeekend = true;

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
    this.cancelled.emit();
  }

  onConfirm(): void {
    this.isVisible = false;
    this.exportConfirmed.emit({
      includeWeekend: this.includeWeekend
    });
  }
}
