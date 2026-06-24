export function sanitizeAppRedirect(value: string | null | undefined): string {
  if (!value) return '/admin';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}
