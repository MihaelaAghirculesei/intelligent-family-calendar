import { Pipe, PipeTransform } from '@angular/core';
import { hyphenateSync } from 'hyphen/it';

// Inserts invisible soft hyphens (U+00AD) at Italian syllable boundaries, so a
// word that doesn't fit its block wraps as "scuo-/la" instead of being cut at
// an arbitrary letter. Done in code rather than with CSS `hyphens: auto`
// because browsers only hyphenate when they have a dictionary for the page
// language, which isn't guaranteed. Display only: stored titles stay untouched.
@Pipe({ name: 'hyphenate' })
export class HyphenatePipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    return text ? hyphenateSync(text) : '';
  }
}
