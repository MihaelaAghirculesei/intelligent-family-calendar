import { Injectable } from '@angular/core';

export interface PdfExportOptions {
  singlePage: boolean;
}

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

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (options.singlePage) {
      // Shrink (or grow) the whole capture to fit within one page in both
      // dimensions, so it always prints on a single sheet.
      const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      const x = margin + (maxWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'JPEG', x, margin, imgWidth, imgHeight);
    } else {
      // Fit the page width, then slice the capture into as many pages as its
      // height needs.
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
    }

    pdf.save(filename);
  }
}
