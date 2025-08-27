import { Injectable } from '@angular/core';
import html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  async exportToPdf(elementId: string, filename: string = 'orario-famiglia.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error(`Element with id '${elementId}' not found`);
    }

    const opt = {
      margin: [15, 15, 15, 15],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  async exportElement(element: HTMLElement, filename: string = 'orario-famiglia.pdf'): Promise<void> {
    const opt = {
      margin: [15, 15, 15, 15],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}