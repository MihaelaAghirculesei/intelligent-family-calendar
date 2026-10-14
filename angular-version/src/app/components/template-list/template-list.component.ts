import { Component, ChangeDetectionStrategy, LOCALE_ID, inject, output, signal } from '@angular/core';

import { TemplateService } from '../../services/template.service';
import { WeeklyTemplate } from '../../models/template.model';

@Component({
  selector: 'app-template-list',
  imports: [],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateListComponent {
  private readonly templateService = inject(TemplateService);

  readonly templateDeleted = output<string>();
  readonly templateApplied = output<WeeklyTemplate>();
  readonly cancelled = output<void>();

  readonly templates = this.templateService.allTemplates;
  readonly isVisible = signal(false);
  private readonly locale = inject(LOCALE_ID);

  show(): void {
    this.isVisible.set(true);
  }

  hide(): void {
    this.isVisible.set(false);
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
    const template = this.templates().find(t => t.id === templateId);
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
