import { Component, EventEmitter, Output, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Activity, WeekDay } from '../../models/activity.model';
import { PersonService, PersonData } from '../../services/person.service';
import { AddPersonComponent } from '../add-person/add-person.component';

@Component({
  selector: 'app-add-activity',
  imports: [CommonModule, ReactiveFormsModule, AddPersonComponent],
  templateUrl: './add-activity.component.html',
  styleUrl: './add-activity.component.css'
})
export class AddActivityComponent implements OnInit {
  @ViewChild('addPersonComponent') addPersonComponent!: AddPersonComponent;
  @Output() activityAdded = new EventEmitter<{activity: Activity, day: WeekDay}>();
  @Output() cancelled = new EventEmitter<void>();

  activityForm: FormGroup;
  isVisible = false;
  persons: PersonData[] = [];

  weekDays: {value: WeekDay, label: string}[] = [
    { value: 'monday', label: 'Lunedì' },
    { value: 'tuesday', label: 'Martedì' },
    { value: 'wednesday', label: 'Mercoledì' },
    { value: 'thursday', label: 'Giovedì' },
    { value: 'friday', label: 'Venerdì' },
    { value: 'saturday', label: 'Sabato' },
    { value: 'sunday', label: 'Domenica' }
  ];

  constructor(private fb: FormBuilder, private personService: PersonService) {
    this.activityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      person: ['', Validators.required],
      day: ['', Validators.required],
      startTime: ['', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['', [Validators.required, Validators.pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)]]
    });
  }

  ngOnInit(): void {
    this.personService.persons$.subscribe(persons => {
      this.persons = persons;
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
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} è obbligatorio`;
      if (field.errors['minlength']) return `${this.getFieldDisplayName(fieldName)} deve avere almeno 2 caratteri`;
      if (field.errors['pattern']) return `Formato orario non valido (es. 09:30)`;
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      'title': 'Titolo',
      'person': 'Persona',
      'day': 'Giorno',
      'startTime': 'Ora inizio',
      'endTime': 'Ora fine'
    };
    return displayNames[fieldName] || fieldName;
  }

  showAddPersonForm(): void {
    this.addPersonComponent.show();
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