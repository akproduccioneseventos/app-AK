/**
 * Converts a string to a URL-safe slug by normalizing accents and replacing spaces.
 * Example: "Decoración & Ambientación" → "decoracion---ambientacion"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, '-');           // Replace spaces with hyphens
}
