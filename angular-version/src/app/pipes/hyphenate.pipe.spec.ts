import { HyphenatePipe } from './hyphenate.pipe';

const SOFT_HYPHEN = String.fromCharCode(0xad);

describe('HyphenatePipe', () => {
  const pipe = new HyphenatePipe();
  const visible = (text: string) => pipe.transform(text).split(SOFT_HYPHEN).join('-');

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
