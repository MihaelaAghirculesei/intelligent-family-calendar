import { Injectable } from '@angular/core';

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

  async exportElement(element: HTMLElement, filename: string): Promise<void> {
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

    // Always emit a real A4-landscape sheet, so a printer never rescales the
    // page, and fit the capture inside its margins. The capture is already
    // shaped like the printable area, so it fills the sheet edge to edge;
    // any small leftover from rounding is split evenly left and right.
    const maxContentWidth = PAGE_WIDTH_MM - MARGIN_MM * 2;
    const maxContentHeight = PAGE_HEIGHT_MM - MARGIN_MM * 2;
    const scale = Math.min(maxContentWidth / canvas.width, maxContentHeight / canvas.height);
    const imgWidth = canvas.width * scale;
    const imgHeight = canvas.height * scale;

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95), 'JPEG',
      (PAGE_WIDTH_MM - imgWidth) / 2, MARGIN_MM, imgWidth, imgHeight
    );
    pdf.save(filename);
  }
}
