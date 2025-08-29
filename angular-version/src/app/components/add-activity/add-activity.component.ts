import { Component, EventEmitter, Output, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Activity, WeekDay } from '../../models/activity.model';
import { PersonService, PersonData } from '../../services/person.service';
import { AddPersonComponent } from '../add-person/add-person.component';

@Component({
  selector: 'app-add-activity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AddPersonComponent],
  templateUrl: './add-activity.component.html',
  styleUrl: './add-activity.component.css'
})
export class AddActivityComponent implements OnInit {
  @ViewChild('addPersonComponent') addPersonComponent!: AddPersonComponent;
  @Output() activityAdded = new EventEmitter<{activity: Activity, timeSlot: string, day: WeekDay}>();
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

  timeSlots = [
    '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00',
    '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
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
      
      const customTimeSlot = `${formValue.startTime}-${formValue.endTime}`;
      
      const activity: Activity = {
        id: Date.now().toString(),
        title: formValue.title,
        person: formValue.person,
        timeRange: customTimeSlot
      };

      this.activityAdded.emit({
        activity,
        timeSlot: this.findBestTimeSlot(formValue.startTime),
        day: formValue.day
      });

      this.hide();
    }
  }

  private findBestTimeSlot(startTime: string): string {

    const timeSlots = [
      '7:45-13:10', '8:15-14:00', '14:00-15:00', '15:00-16:00',
      '15:30-17:30', '16:35-18:30', '17:15-19:15', '19:00-21:30'
    ];
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    
    let bestMatch = timeSlots[0];
    let smallestDiff = Math.abs(this.timeToMinutes('7:45') - startMinutes);
    
    for (const slot of timeSlots) {
      const slotStart = slot.split('-')[0];
      const slotMinutes = this.timeToMinutes(slotStart);
      const diff = Math.abs(slotMinutes - startMinutes);
      
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestMatch = slot;
      }
    }
    
    return bestMatch;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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

  onAddPersonCancelled(): void {
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