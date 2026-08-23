import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  async exportElement(element: HTMLElement, filename: string = 'orario-famiglia.pdf'): Promise<void> {
    // html2pdf.js pulls in jspdf + html2canvas, which are heavy and only ever
    // needed when the user actually exports. Load it on demand instead of at
    // app startup, so it doesn't bloat the initial bundle.
    const { default: html2pdf } = await import('html2pdf.js');

    // Landscape A4 fits all 7 day columns comfortably; the default pagebreak
    // mode (['css', 'legacy']) already paginates a grid taller than one page.
    await html2pdf().set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape'
      }
    }).from(element).save();
  }
}
