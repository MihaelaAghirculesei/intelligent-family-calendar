import { Component, EventEmitter, Output } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SaveTemplateData } from '../../models/template.model';

@Component({
  selector: 'app-save-template',
  imports: [ReactiveFormsModule],
  templateUrl: './save-template.component.html',
  styleUrl: './save-template.component.css'
})
export class SaveTemplateComponent {
  @Output() templateSaved = new EventEmitter<SaveTemplateData>();
  @Output() cancelled = new EventEmitter<void>();

  templateForm: FormGroup;
  isVisible = false;

  constructor(private fb: FormBuilder) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  show(): void {
    this.isVisible = true;
    this.templateForm.reset();
    
    const now = new Date();
    const defaultName = `Template ${now.getDate()}/${now.getMonth() + 1}`;
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
      if (field.errors['required']) return 'Nome è obbligatorio';
      if (field.errors['minlength']) return 'Nome deve avere almeno 2 caratteri';
      if (field.errors['maxlength']) {
        if (fieldName === 'name') return 'Nome non può superare 50 caratteri';
        if (fieldName === 'description') return 'Descrizione non può superare 200 caratteri';
      }
    }
    return '';
  }
}
