const AK_DECORATION_ASSET_PATH = /^\/media\/decoracion-ak\/[A-Za-z0-9_-]+\.png$/;

export function safeDecorationImageSource(source: string): string {
  if (typeof source !== 'string') return '';
  if (source.startsWith('data:image/')) return source;

  try {
    const decoded = decodeURIComponent(source);
    if (decoded !== source) return '';
  } catch {
    return '';
  }

  return AK_DECORATION_ASSET_PATH.test(source) ? source : '';
}
