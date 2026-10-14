import { Injectable, signal } from '@angular/core';

export interface PersonData {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'persons';
// Before the full list was stored, only people added by hand were saved here.
const LEGACY_CUSTOM_KEY = 'customPersons';

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private readonly defaultPersons: PersonData[] = [
    { id: 'anna', name: 'Anna', color: '#2196F3', isDefault: true },
    { id: 'mia', name: 'Mia', color: '#E91E63', isDefault: true },
    { id: 'leo', name: 'Leo', color: '#4CAF50', isDefault: true }
  ];

  private persons: PersonData[] = this.loadPersons();
  private readonly personsState = signal<PersonData[]>(this.getAllPersons());

  readonly allPersons = this.personsState.asReadonly();

  getAllPersons(): PersonData[] {
    return [...this.persons];
  }

  addPerson(name: string, color: string): PersonData {
    const newPerson: PersonData = {
      id: this.generateId(name),
      name,
      color,
      isDefault: false
    };

    this.persons.push(newPerson);
    this.savePersons();
    this.updatePersonsSubject();
    return newPerson;
  }

  replaceAll(persons: PersonData[]): void {
    this.persons = persons.map(p => ({ ...p }));
    this.savePersons();
    this.updatePersonsSubject();
  }

  removePerson(id: string): boolean {
    const person = this.persons.find(p => p.id === id);
    if (!person || person.isDefault) return false;

    this.persons = this.persons.filter(p => p.id !== id);
    this.savePersons();
    this.updatePersonsSubject();
    return true;
  }

  getPersonById(id: string): PersonData | undefined {
    return this.persons.find(p => p.id === id);
  }

  getPersonColor(personId: string): string {
    const person = this.getPersonById(personId);
    return person?.color || '#333333';
  }

  private generateId(name: string): string {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let id = baseId;
    let counter = 1;

    while (this.persons.some(p => p.id === id)) {
      id = `${baseId}${counter}`;
      counter++;
    }

    return id;
  }

  private updatePersonsSubject(): void {
    this.personsState.set(this.getAllPersons());
  }

  private savePersons(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persons));
    }
  }

  // The family is stored like the calendar, so the built-in defaults only
  // seed a fresh calendar and can change without touching existing ones.
  // On the first run after this change, the defaults plus anyone added by
  // hand are written out once; the legacy key is left in place.
  private loadPersons(): PersonData[] {
    if (typeof localStorage === 'undefined') {
      return [...this.defaultPersons];
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }

      const legacyCustom = localStorage.getItem(LEGACY_CUSTOM_KEY);
      const persons = [...this.defaultPersons, ...(legacyCustom ? JSON.parse(legacyCustom) : [])];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
      return persons;
    } catch (e) {
      console.error('Failed to load persons:', e);
      return [...this.defaultPersons];
    }
  }
}
