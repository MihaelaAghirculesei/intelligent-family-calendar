import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HyphenatePipe } from './hyphenate.pipe';

const SOFT_HYPHEN = String.fromCharCode(0xad);

const createPipe = (locale: string) => {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  return TestBed.runInInjectionContext(() => new HyphenatePipe());
};

describe('HyphenatePipe', () => {
  describe('in Italian', () => {
    let pipe: HyphenatePipe;
    const visible = (text: string) => pipe.transform(text).split(SOFT_HYPHEN).join('-');

    beforeEach(() => pipe = createPipe('it'));

    it('marks Italian syllable boundaries with soft hyphens', () => {
      expect(visible('Scuola di musica')).toBe('Scuo-la di mu-si-ca');
      expect(visible('Psicomotricità')).toBe('Psi-co-mo-tri-ci-tà');
    });

    it('only adds invisible characters, so the text reads the same', () => {
      expect(pipe.transform('Allenamento').split(SOFT_HYPHEN).join('')).toBe('Allenamento');
    });

    it('leaves short words alone', () => {
      expect(pipe.transform('Arpa')).toBe('Arpa');
    });

    it('returns an empty string for missing titles', () => {
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform(null)).toBe('');
    });
  });

  it('uses English rules for the English UI', () => {
    const pipe = createPipe('en-US');

    expect(pipe.transform('Birthday practice').split(SOFT_HYPHEN).join('-')).toBe('Birth-day prac-tice');
  });
});
