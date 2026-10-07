// The hyphen package ships no type definitions; this covers the part we use.
declare module 'hyphen/it' {
  export function hyphenateSync(
    text: string,
    options?: { hyphenChar?: string; minWordLength?: number; debug?: boolean }
  ): string;
}
