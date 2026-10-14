import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SaveTemplateData } from '../../models/template.model';

@Component({
  selector: 'app-save-template',
  imports: [ReactiveFormsModule],
  templateUrl: './save-template.component.html',
  styleUrl: './save-template.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class SaveTemplateComponent {
  private readonly fb = inject(FormBuilder);

  readonly templateSaved = output<SaveTemplateData>();
  readonly cancelled = output<void>();

  templateForm: FormGroup;
  isVisible = false;

  constructor() {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  show(): void {
    this.isVisible = true;
    this.templateForm.reset();
    
    const now = new Date();
    const defaultName = $localize`Template ${now.getDate()}:day:/${now.getMonth() + 1}:month:`;
    this.templateForm.patchValue({ name: defaultName });
  }

  hide(): void {
    this.isVisible = false;
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.templateForm.valid) {
      const formValue = this.templateForm.value;
      this.templateSaved.emit({
        name: formValue.name.trim(),
        description: formValue.description?.trim() || undefined
      });
      this.hide();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.templateForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return $localize`Name is required`;
      if (field.errors['minlength']) return $localize`Name must be at least 2 characters`;
      if (field.errors['maxlength']) {
        if (fieldName === 'name') return $localize`Name cannot exceed 50 characters`;
        if (fieldName === 'description') return $localize`Description cannot exceed 200 characters`;
      }
    }
    return '';
  }
}
