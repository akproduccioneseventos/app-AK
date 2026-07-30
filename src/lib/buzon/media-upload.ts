export type BuzonMediaType = 'audio' | 'video';

export interface DetectedBuzonMedia {
  mediaType: BuzonMediaType;
  extension: string;
  contentType: string;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

export function detectBuzonMedia(
  bytes: Uint8Array,
  declaredMediaType: unknown,
  declaredMimeType: unknown,
): DetectedBuzonMedia | null {
  if (declaredMediaType !== 'audio' && declaredMediaType !== 'video') return null;
  const mimeType = String(declaredMimeType ?? '').toLowerCase();
  if (!mimeType.startsWith(`${declaredMediaType}/`)) return null;

  const isWebm = startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
  const isIsoMedia = asciiAt(bytes, 4, 4) === 'ftyp';
  const isOgg = asciiAt(bytes, 0, 4) === 'OggS';
  const isWave = asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WAVE';
  const isMp3 = asciiAt(bytes, 0, 3) === 'ID3'
    || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);

  if (declaredMediaType === 'video') {
    if (isWebm) return { mediaType: 'video', extension: '.webm', contentType: 'video/webm' };
    if (isIsoMedia) return { mediaType: 'video', extension: '.mp4', contentType: 'video/mp4' };
    return null;
  }

  if (isWebm) return { mediaType: 'audio', extension: '.webm', contentType: 'audio/webm' };
  if (isIsoMedia) return { mediaType: 'audio', extension: '.m4a', contentType: 'audio/mp4' };
  if (isOgg) return { mediaType: 'audio', extension: '.ogg', contentType: 'audio/ogg' };
  if (isWave) return { mediaType: 'audio', extension: '.wav', contentType: 'audio/wav' };
  if (isMp3) return { mediaType: 'audio', extension: '.mp3', contentType: 'audio/mpeg' };
  return null;
}
