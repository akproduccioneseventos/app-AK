import {
  hasBlockedText,
  reviewSocialContent,
  sanitizeSocialText,
} from '@/lib/social-fiesta/content-review';

describe('social fiesta content review', () => {
  it('blocks unsafe words before big screen', () => {
    const result = reviewSocialContent({ type: 'text', text: 'mensaje con porno', moderationMode: 'automatico' });
    expect(result.status).toBe('blocked');
    expect(result.shouldShowOnBigScreen).toBe(false);
  });

  it('keeps safe mode pending for manual review', () => {
    const result = reviewSocialContent({ type: 'image', text: 'mesa 5', moderationMode: 'seguro', imageAiSafe: true });
    expect(result.status).toBe('pending_review');
    expect(result.shouldShowOnBigScreen).toBe(false);
  });

  it('approves clean content in automatic mode', () => {
    const result = reviewSocialContent({ type: 'text', text: 'Que linda fiesta', moderationMode: 'automatico' });
    expect(result.status).toBe('approved');
    expect(result.shouldShowOnBigScreen).toBe(true);
  });

  it('sanitizes blocked text', () => {
    expect(hasBlockedText('contenido porno')).toBe(true);
    expect(sanitizeSocialText('contenido porno')).toContain('***');
  });
});
