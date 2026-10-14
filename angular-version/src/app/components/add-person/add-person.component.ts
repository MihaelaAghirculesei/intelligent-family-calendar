import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PersonData } from '../../services/person.service';

@Component({
  selector: 'app-add-person',
  imports: [ReactiveFormsModule],
  templateUrl: './add-person.component.html',
  styleUrl: './add-person.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class AddPersonComponent {
  private readonly fb = inject(FormBuilder);

  readonly personAdded = output<PersonData>();
  readonly cancelled = output<void>();

  personForm: FormGroup;
  isVisible = false;
  readonly previewLabel = $localize`Preview`;

  predefinedColors = [
    '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C',
    '#FF5722', '#FF3D00', '#DD2C00', '#BF360C', '#FF8A80',
    
    '#E91E63', '#AD1457', '#880E4F', '#C2185B', '#F06292',
    '#FF4081', '#F50057', '#C51162', '#FCE4EC', '#F8BBD9',
    
    '#9C27B0', '#7B1FA2', '#4A148C', '#6A1B9A', '#AB47BC',
    '#E1BEE7', '#BA68C8', '#9575CD', '#7E57C2', '#673AB7',
    
    '#3F51B5', '#303F9F', '#1A237E', '#283593', '#5C6BC0',
    '#9FA8DA', '#7986CB', '#6366F1', '#4F46E5', '#4338CA',
    
    '#2196F3', '#1976D2', '#0D47A1', '#1565C0', '#42A5F5',
    '#90CAF9', '#64B5F6', '#2563EB', '#1D4ED8', '#1E40AF',
    
    '#00BCD4', '#0097A7', '#006064', '#00838F', '#26C6DA',
    '#80DEEA', '#4DD0E1', '#06B6D4', '#0891B2', '#0E7490',
    
    '#009688', '#00796B', '#004D40', '#00695C', '#4DB6AC',
    '#80CBC4', '#26A69A', '#14B8A6', '#0F766E', '#134E4A',
    
    '#4CAF50', '#388E3C', '#1B5E20', '#2E7D32', '#66BB6A',
    '#A5D6A7', '#81C784', '#10B981', '#059669', '#047857',
    
    '#8BC34A', '#689F38', '#33691E', '#558B2F', '#9CCC65',
    '#C5E1A5', '#AED581', '#84CC16', '#65A30D', '#4D7C0F',
    
    '#CDDC39', '#AFB42B', '#827717', '#9E9D24', '#D4E157',
    '#F0F4C3', '#DCE775', '#A3E635', '#84CC16', '#65A30D',
    
    '#FFEB3B', '#FBC02D', '#F57F17', '#F9A825', '#FFEE58',
    '#FFF9C4', '#FFF176', '#EAB308', '#CA8A04', '#A16207',
    
    '#FFC107', '#FF8F00', '#FF6F00', '#FFA000', '#FFCA28',
    '#FFECB3', '#FFD54F', '#F59E0B', '#D97706', '#B45309',
    
    '#FF9800', '#F57C00', '#E65100', '#EF6C00', '#FFB74D',
    '#FFCC80', '#FF8A65', '#F97316', '#EA580C', '#C2410C',
    
    '#FF5722', '#D84315', '#BF360C', '#E64A19', '#FF7043',
    '#FFAB91', '#FF6E40', '#DC2626', '#B91C1C', '#991B1B',
    
    '#795548', '#5D4037', '#3E2723', '#4E342E', '#8D6E63',
    '#BCAAA4', '#A1887F', '#92400E', '#78350F', '#451A03',
    
    '#9E9E9E', '#616161', '#212121', '#424242', '#BDBDBD',
    '#E0E0E0', '#757575', '#6B7280', '#4B5563', '#374151',
    
    '#607D8B', '#455A64', '#263238', '#37474F', '#78909C',
    '#B0BEC5', '#90A4AE', '#64748B', '#475569', '#334155'
  ];

  constructor() {
    this.personForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      color: ['#2196F3', Validators.required]
    });
  }

  show(): void {
    this.isVisible = true;
    this.personForm.reset({ color: '#2196F3' });
  }

  hide(): void {
    this.isVisible = false;
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.personForm.valid) {
      const formValue = this.personForm.value;
      
      const newPerson: PersonData = {
        id: '', 
        name: formValue.name,
        color: formValue.color,
        isDefault: false
      };

      this.personAdded.emit(newPerson);
      this.hide();
    }
  }

  selectColor(color: string): void {
    this.personForm.patchValue({ color });
  }

  getFieldError(fieldName: string): string {
    const field = this.personForm.get(fieldName);
    if (field?.errors && field.touched) {
      const label = this.getFieldDisplayName(fieldName);
      if (field.errors['required']) return $localize`${label}:field: is required`;
      if (field.errors['minlength']) return $localize`${label}:field: must be at least 2 characters`;
      if (field.errors['maxlength']) return $localize`${label}:field: must be at most 20 characters`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      'name': $localize`Name`,
      'color': $localize`Color`
    };
    return displayNames[fieldName] || fieldName;
  }
}