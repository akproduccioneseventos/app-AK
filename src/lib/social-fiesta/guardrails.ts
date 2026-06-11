import type { ContentSafetyResult } from '@/lib/social-fiesta/content-safety-ai';

export const MAX_DEDICATION_AUDIO_SIZE = 8 * 1024 * 1024;
export const MAX_DEDICATION_RECORDING_SECONDS = 60;

const ALLOWED_DEDICATION_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
]);

const SHARED_KIOSK_MODULES = new Set([
  'touchpix',
  'fotocabina',
  'espejo-magico',
  'plataforma-360',
  'totem',
]);

export function canReadDedications(privateMode: boolean, hasAdminSession: boolean): boolean {
  return !privateMode || hasAdminSession;
}

export function isSharedKioskUpload(source?: string, sourceModule?: string): boolean {
  return source === 'entertainment' && !!sourceModule && SHARED_KIOSK_MODULES.has(sourceModule);
}

export function validateDedicationAudioFile(file: Pick<File, 'size' | 'type'>): string | null {
  if (file.size <= 0) return 'El audio esta vacio.';
  if (file.size > MAX_DEDICATION_AUDIO_SIZE) return 'El audio no puede superar los 8 MB.';
  if (!ALLOWED_DEDICATION_AUDIO_TYPES.has(file.type.toLowerCase())) {
    return 'El formato de audio no esta permitido.';
  }
  return null;
}

export function shouldQueueForManualReview(
  requireApproval: boolean,
  safetyResult: ContentSafetyResult
): boolean {
  return requireApproval || safetyResult.reason === 'error';
}

export function isDedicationAudioOwnedByEvent(audioUrl: string, fiestaId: string): boolean {
  const expectedPath = `dedications-audio/${fiestaId}/`;
  if (audioUrl.startsWith(expectedPath)) return true;

  try {
    return decodeURIComponent(new URL(audioUrl).pathname).includes(`/${expectedPath}`);
  } catch {
    return false;
  }
}
