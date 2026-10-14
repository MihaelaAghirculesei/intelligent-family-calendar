import { Component, ChangeDetectionStrategy, inject, output, viewChild } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Activity, WeekDay } from '../../models/activity.model';
import { PersonService, PersonData } from '../../services/person.service';
import { AddPersonComponent } from '../add-person/add-person.component';

@Component({
  selector: 'app-add-activity',
  imports: [ReactiveFormsModule, AddPersonComponent],
  templateUrl: './add-activity.component.html',
  styleUrl: './add-activity.component.css',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class AddActivityComponent {
  private readonly fb = inject(FormBuilder);
  private readonly personService = inject(PersonService);

  readonly addPersonComponent = viewChild.required<AddPersonComponent>('addPersonComponent');
  readonly activityAdded = output<{activity: Activity, day: WeekDay}>();
  readonly cancelled = output<void>();

  activityForm: FormGroup;
  isVisible = false;
  readonly persons = this.personService.allPersons;

  weekDays: {value: WeekDay, label: string}[] = [
    { value: 'monday', label: $localize`Monday` },
    { value: 'tuesday', label: $localize`Tuesday` },
    { value: 'wednesday', label: $localize`Wednesday` },
    { value: 'thursday', label: $localize`Thursday` },
    { value: 'friday', label: $localize`Friday` },
    { value: 'saturday', label: $localize`Saturday` },
    { value: 'sunday', label: $localize`Sunday` }
  ];

  constructor() {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      person: ['', Validators.required],
      day: ['', Validators.required],
      startTime: ['', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]]
    });
  }

  show(): void {
    this.isVisible = true;
    this.activityForm.reset();
  }

  hide(): void {
    this.isVisible = false;
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (this.activityForm.valid) {
      const formValue = this.activityForm.value;

      const activity: Activity = {
        id: Date.now().toString(),
        title: formValue.title,
        person: formValue.person,
        timeRange: `${formValue.startTime}-${formValue.endTime}`
      };

      this.activityAdded.emit({
        activity,
        day: formValue.day
      });

      this.hide();
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.activityForm.get(fieldName);
    if (field?.errors && field.touched) {
      const label = this.getFieldDisplayName(fieldName);
      if (field.errors['required']) return $localize`${label}:field: is required`;
      if (field.errors['minlength']) return $localize`${label}:field: must be at least 2 characters`;
      if (field.errors['pattern']) return $localize`Invalid time format (e.g. 09:30)`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      'title': $localize`Title`,
      'person': $localize`Person`,
      'day': $localize`Day`,
      'startTime': $localize`Start time`,
      'endTime': $localize`End time`
    };
    return displayNames[fieldName] || fieldName;
  }

  showAddPersonForm(): void {
    this.addPersonComponent().show();
  }

  onPersonAdded(personData: PersonData): void {
    const newPerson = this.personService.addPerson(personData.name, personData.color);
    this.activityForm.patchValue({ person: newPerson.id });
  }

  isAddNewPersonOption(value: string): boolean {
    return value === 'add_new_person';
  }

  onPersonChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value === 'add_new_person') {
      this.showAddPersonForm();
      this.activityForm.patchValue({ person: '' });
    }
  }
}