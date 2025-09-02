import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateService } from '../../services/template.service';
import { WeeklyTemplate } from '../../models/template.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css'
})
export class TemplateListComponent implements OnInit {
  @Output() templateDeleted = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  templates: WeeklyTemplate[] = [];
  isVisible = false;

  constructor(private templateService: TemplateService) {}

  ngOnInit(): void {
    this.templateService.templates$.subscribe(templates => {
      this.templates = templates;
    });
  }

  show(): void {
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
    this.cancelled.emit();
  }

  deleteTemplate(templateId: string): void {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const confirmed = confirm(`Sei sicuro di voler eliminare il template "${template.name}"?\n\nQuesta azione non può essere annullata.`);
    if (confirmed) {
      this.templateService.deleteTemplate(templateId);
      this.templateDeleted.emit(templateId);
    }
  }

  formatDate(date: Date): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
