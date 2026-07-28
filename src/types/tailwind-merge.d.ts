declare module 'tailwind-merge' {
  export function twMerge(...classLists: Array<string | undefined | null | false>): string;
  export function extendTailwindMerge(config: Record<string, unknown>): typeof twMerge;
}
