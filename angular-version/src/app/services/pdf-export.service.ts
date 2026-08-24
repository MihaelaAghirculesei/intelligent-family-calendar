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

    const margin = 8;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (options.singlePage) {
      // Size the page to the content's aspect ratio (so there's no leftover
      // margin in the file itself), but never let either dimension exceed a
      // real A4-landscape sheet (297x210mm). Filling the width unconditionally
      // (as this used to do) can make a tall/narrow capture (e.g. weekend
      // excluded) produce a page taller than 210mm — a real printer then
      // shrinks the *whole page* to fit its paper, silently undoing the fix
      // and printing everything smaller again. Bounding both dimensions up
      // front means the page already fits a real sheet, so no printer-side
      // rescale ever kicks in.
      const maxContentWidth = 297 - margin * 2;
      const maxContentHeight = 210 - margin * 2;
      const scale = Math.min(maxContentWidth / canvas.width, maxContentHeight / canvas.height);
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      const pageWidth = imgWidth + margin * 2;
      const pageHeight = imgHeight + margin * 2;

      const pdf = new jsPDF({ unit: 'mm', format: [pageWidth, pageHeight], orientation: pageWidth >= pageHeight ? 'landscape' : 'portrait' });
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
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
