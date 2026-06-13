import {
  canReadDedications,
  isDedicationAudioOwnedByEvent,
  isSharedKioskUpload,
  shouldQueueForManualReview,
  validateDedicationAudioFile,
} from '@/lib/social-fiesta/guardrails';

describe('social feature guardrails', () => {
  it('keeps private dedications hidden from guests', () => {
    expect(canReadDedications(true, false)).toBe(false);
    expect(canReadDedications(true, true)).toBe(true);
    expect(canReadDedications(false, false)).toBe(true);
  });

  it('does not collapse shared booth uploads into one guest quota', () => {
    expect(isSharedKioskUpload('entertainment', 'touchpix')).toBe(true);
    expect(isSharedKioskUpload('entertainment', 'fotocabina')).toBe(true);
    expect(isSharedKioskUpload('guest', 'touchpix')).toBe(false);
  });

  it('validates dedication audio type and size', () => {
    expect(validateDedicationAudioFile({ type: 'audio/webm', size: 1024 })).toBeNull();
    expect(validateDedicationAudioFile({ type: 'application/pdf', size: 1024 })).toContain('formato');
    expect(validateDedicationAudioFile({ type: 'audio/webm', size: 9 * 1024 * 1024 })).toContain('8 MB');
  });

  it('queues uploads when automatic moderation is unavailable', () => {
    expect(shouldQueueForManualReview(false, { safe: true, reason: 'error' })).toBe(true);
    expect(shouldQueueForManualReview(false, { safe: true, reason: 'clean' })).toBe(false);
    expect(shouldQueueForManualReview(true, { safe: true, reason: 'clean' })).toBe(true);
  });

  it('accepts only dedication audio owned by the event', () => {
    expect(isDedicationAudioOwnedByEvent('dedications-audio/fiesta_1/audio.webm', 'fiesta_1')).toBe(true);
    expect(
      isDedicationAudioOwnedByEvent(
        'https://storage.googleapis.com/bucket/dedications-audio/fiesta_1/audio.webm',
        'fiesta_1'
      )
    ).toBe(true);
    expect(isDedicationAudioOwnedByEvent('dedications-audio/fiesta_2/audio.webm', 'fiesta_1')).toBe(false);
  });
});
