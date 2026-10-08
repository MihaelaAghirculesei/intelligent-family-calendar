import { Component, EventEmitter, Output, OnInit, ChangeDetectionStrategy, LOCALE_ID, inject } from '@angular/core';

import { TemplateService } from '../../services/template.service';
import { WeeklyTemplate } from '../../models/template.model';

@Component({
  selector: 'app-template-list',
  imports: [],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class TemplateListComponent implements OnInit {
  @Output() templateDeleted = new EventEmitter<string>();
  @Output() templateApplied = new EventEmitter<WeeklyTemplate>();
  @Output() cancelled = new EventEmitter<void>();

  templates: WeeklyTemplate[] = [];
  isVisible = false;
  private readonly locale = inject(LOCALE_ID);

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

  applyTemplate(template: WeeklyTemplate): void {
    const confirmed = confirm($localize`Apply the template "${template.name}:name:" to the calendar?\n\n⚠️ This replaces all current activities with the ${template.activities.length}:count: activities of the template.`);
    if (confirmed) {
      this.templateApplied.emit(template);
      this.hide();
    }
  }

  deleteTemplate(templateId: string): void {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) return;

    const confirmed = confirm($localize`Are you sure you want to delete the template "${template.name}:name:"?\n\nThis cannot be undone.`);
    if (confirmed) {
      this.templateService.deleteTemplate(templateId);
      this.templateDeleted.emit(templateId);
    }
  }

  formatDate(date: Date): string {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString(this.locale, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
