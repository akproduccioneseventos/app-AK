const NEXT_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'img.youtube.com',
  'placehold.co',
  'picsum.photos',
  'i.imgur.com',
  'storage.googleapis.com',
]);

export function canUseNextImage(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;

  try {
    return NEXT_IMAGE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}
