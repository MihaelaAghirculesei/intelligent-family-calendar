import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PersonData {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PersonService {
  private defaultPersons: PersonData[] = [
    { id: 'anna', name: 'Anna', color: '#2196F3', isDefault: true },
    { id: 'mia', name: 'Mia', color: '#E91E63', isDefault: true },
    { id: 'leo', name: 'Leo', color: '#4CAF50', isDefault: true }
  ];

  private customPersons: PersonData[] = [];
  private personsSubject = new BehaviorSubject<PersonData[]>(this.defaultPersons);

  constructor() {
    this.loadCustomPersons();
  }

  get persons$(): Observable<PersonData[]> {
    return this.personsSubject.asObservable();
  }

  getAllPersons(): PersonData[] {
    return [...this.defaultPersons, ...this.customPersons];
  }

  addPerson(name: string, color: string): PersonData {
    const newPerson: PersonData = {
      id: this.generateId(name),
      name,
      color,
      isDefault: false
    };

    this.customPersons.push(newPerson);
    this.saveCustomPersons();
    this.updatePersonsSubject();
    return newPerson;
  }

  removePerson(id: string): boolean {
    const person = this.customPersons.find(p => p.id === id);
    if (!person || person.isDefault) return false;

    this.customPersons = this.customPersons.filter(p => p.id !== id);
    this.saveCustomPersons();
    this.updatePersonsSubject();
    return true;
  }

  getPersonById(id: string): PersonData | undefined {
    return this.getAllPersons().find(p => p.id === id);
  }

  getPersonColor(personId: string): string {
    const person = this.getPersonById(personId);
    return person?.color || '#333333';
  }

  private generateId(name: string): string {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let id = baseId;
    let counter = 1;

    while (this.getAllPersons().some(p => p.id === id)) {
      id = `${baseId}${counter}`;
      counter++;
    }

    return id;
  }

  private updatePersonsSubject(): void {
    this.personsSubject.next(this.getAllPersons());
  }

  private saveCustomPersons(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('customPersons', JSON.stringify(this.customPersons));
    }
  }

  private loadCustomPersons(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('customPersons');
      if (saved) {
        try {
          this.customPersons = JSON.parse(saved);
          this.updatePersonsSubject();
        } catch (e) {
          console.error('Failed to load custom persons:', e);
        }
      }
    }
  }
}