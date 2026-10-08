import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { hyphenateSync as hyphenateItalian } from 'hyphen/it';
import { hyphenateSync as hyphenateEnglish } from 'hyphen/en-us';

// Inserts invisible soft hyphens (U+00AD) at syllable boundaries of the UI
// language, so a word that doesn't fit its block wraps as "scuo-/la" instead
// of being cut at an arbitrary letter. Done in code rather than with CSS
// `hyphens: auto` because browsers only hyphenate when they have a dictionary
// for the page language, which isn't guaranteed. Display only: stored titles
// stay untouched.
@Pipe({ name: 'hyphenate' })
export class HyphenatePipe implements PipeTransform {
  private readonly hyphenate = inject(LOCALE_ID).startsWith('it') ? hyphenateItalian : hyphenateEnglish;

  transform(text: string | null | undefined): string {
    return text ? this.hyphenate(text) : '';
  }
}
