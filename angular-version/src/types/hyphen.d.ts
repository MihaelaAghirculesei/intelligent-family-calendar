// The hyphen package ships no type definitions; this covers the part we use.
type HyphenateSync = (
  text: string,
  options?: { hyphenChar?: string; minWordLength?: number; debug?: boolean }
) => string;

declare module 'hyphen/it' {
  export const hyphenateSync: HyphenateSync;
}

declare module 'hyphen/en-us' {
  export const hyphenateSync: HyphenateSync;
}
