import { Injectable } from '@angular/core';

export interface PdfExportOptions {
  singlePage: boolean;
}

// A4 landscape with a uniform margin. The calendar sizes its columns to this
// printable area's aspect ratio before capturing, so the image fills the sheet.
const PAGE_WIDTH_MM = 297;
const PAGE_HEIGHT_MM = 210;
const MARGIN_MM = 8;
export const PDF_PRINTABLE_ASPECT_RATIO =
  (PAGE_WIDTH_MM - MARGIN_MM * 2) / (PAGE_HEIGHT_MM - MARGIN_MM * 2);

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  async exportElement(element: HTMLElement, filename: string, options: PdfExportOptions): Promise<void> {
    // html2canvas and jsPDF are only ever needed when a user actually exports,
    // so load them on demand instead of bloating the initial bundle.
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const margin = MARGIN_MM;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // A capture that overshoots one page by a hair (rounding in the column
    // fitting) is shrunk onto that page instead of spilling a sliver onto a
    // nearly blank second one.
    const widthFitHeightMm = canvas.height * (PAGE_WIDTH_MM - margin * 2) / canvas.width;
    const fitsOnOnePage = widthFitHeightMm <= (PAGE_HEIGHT_MM - margin * 2) * 1.01;

    if (options.singlePage || fitsOnOnePage) {
      // Always emit a real A4-landscape sheet, so a printer never rescales the
      // page, and fit the capture inside its margins. The capture is already
      // shaped like the printable area, so it fills the sheet edge to edge;
      // any small leftover from rounding is split evenly left and right.
      const maxContentWidth = PAGE_WIDTH_MM - margin * 2;
      const maxContentHeight = PAGE_HEIGHT_MM - margin * 2;
      const scale = Math.min(maxContentWidth / canvas.width, maxContentHeight / canvas.height);
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
      pdf.addImage(imgData, 'JPEG', (PAGE_WIDTH_MM - imgWidth) / 2, margin, imgWidth, imgHeight);
      pdf.save(filename);
      return;
    }

    // Fit the page width, then slice the capture into as many pages as its
    // height needs.
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const pxToMm = maxWidth / canvas.width;
    const pageContentHeightPx = maxHeight / pxToMm;
    let renderedPx = 0;
    let firstPage = true;

    while (renderedPx < canvas.height) {
      if (!firstPage) pdf.addPage();
      firstPage = false;

      const sliceHeightPx = Math.min(pageContentHeightPx, canvas.height - renderedPx);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      sliceCanvas.getContext('2d')!.drawImage(
        canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx
      );

      pdf.addImage(
        sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG',
        margin, margin, maxWidth, sliceHeightPx * pxToMm
      );

      renderedPx += sliceHeightPx;
    }

    pdf.save(filename);
  }
}
