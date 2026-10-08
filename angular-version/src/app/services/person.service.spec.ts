import { PersonService } from './person.service';

describe('PersonService', () => {
  const stored = () => JSON.parse(localStorage.getItem('persons')!);

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('stores the default family on a first visit', () => {
    const service = new PersonService();

    expect(service.getAllPersons().length).toBeGreaterThan(0);
    expect(stored()).toEqual(service.getAllPersons());
  });

  it('keeps people added by hand under the old storage key', () => {
    localStorage.setItem('customPersons', JSON.stringify([
      { id: 'nonna', name: 'Nonna', color: '#000000', isDefault: false }
    ]));

    const service = new PersonService();

    expect(service.getPersonById('nonna')?.name).toBe('Nonna');
    expect(stored().map((p: { id: string }) => p.id)).toContain('nonna');
  });

  it('loads the stored family instead of the defaults', () => {
    const family = [{ id: 'p1', name: 'Sam', color: '#123456', isDefault: true }];
    localStorage.setItem('persons', JSON.stringify(family));

    expect(new PersonService().getAllPersons()).toEqual(family);
  });

  it('persists a new person with a unique id', () => {
    localStorage.setItem('persons', JSON.stringify([
      { id: 'sam', name: 'Sam', color: '#123456', isDefault: true }
    ]));
    const service = new PersonService();

    const added = service.addPerson('Sam', '#654321');

    expect(added.id).toBe('sam1');
    expect(new PersonService().getPersonColor('sam1')).toBe('#654321');
  });
});
