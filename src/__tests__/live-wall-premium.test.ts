import { buildFiestaSocialPost } from '@/lib/social-fiesta/private-feed';
import {
  buildLiveWallEmptyState,
  buildLiveWallPremiumSlides,
  buildLiveWallQrPrompt,
  filterLiveWallApprovedPosts,
  injectAkBrandingSlides,
} from '@/lib/social-fiesta/live-wall-premium';

const theme = {
  eventName: 'Los 15 de Sofia',
  protagonistName: 'Sofia',
  primaryColor: '#020617',
  accentColor: '#ec4899',
  textColor: '#ffffff',
  showAkBranding: true,
  akBrandingText: 'Muro Social AK',
};

describe('premium live wall layout engine', () => {
  it('filters only approved posts for big screen', () => {
    const approved = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Ana',
      role: 'invitado',
      text: 'Que linda fiesta',
      imageUrl: 'https://example.com/foto.jpg',
      stage: 'en_vivo',
      moderationMode: 'automatico',
      now: '2026-05-01T10:00:00.000Z',
    });
    const blocked = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Invitado',
      role: 'invitado',
      text: 'contenido porno',
      stage: 'en_vivo',
      moderationMode: 'automatico',
      now: '2026-05-01T10:01:00.000Z',
    });

    const visible = filterLiveWallApprovedPosts([approved, blocked]);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe(approved.id);
  });

  it('builds premium slides with media and message content', () => {
    const posts = [
      buildFiestaSocialPost({ fiestaId: 'fiesta_1', authorName: 'Ana', role: 'invitado', text: 'Foto 1', imageUrl: 'https://example.com/1.jpg', stage: 'en_vivo', moderationMode: 'automatico', now: '2026-05-01T10:00:00.000Z' }),
      buildFiestaSocialPost({ fiestaId: 'fiesta_1', authorName: 'Juan', role: 'invitado', text: 'Foto 2', imageUrl: 'https://example.com/2.jpg', stage: 'en_vivo', moderationMode: 'automatico', now: '2026-05-01T10:01:00.000Z' }),
      buildFiestaSocialPost({ fiestaId: 'fiesta_1', authorName: 'Sofia', role: 'cliente', text: 'Gracias por venir', stage: 'en_vivo', moderationMode: 'automatico', now: '2026-05-01T10:02:00.000Z' }),
    ];

    const slides = buildLiveWallPremiumSlides({ posts, theme, config: { brandingEveryNSlides: 2 } });
    expect(slides.some(slide => slide.mode === 'foto_destacada')).toBe(true);
    expect(slides.some(slide => slide.mode === 'mensajes_en_vivo')).toBe(true);
    expect(slides.some(slide => slide.mode === 'ak_branding')).toBe(true);
  });

  it('injects AK branding without removing original slides', () => {
    const slides = injectAkBrandingSlides({
      theme,
      every: 1,
      durationMs: 8000,
      slides: [
        { id: 's1', mode: 'carrusel_elegante', title: 'Slide 1', durationMs: 8000, showQr: true, showAkBranding: true, priority: 1 },
      ],
    });

    expect(slides).toHaveLength(2);
    expect(slides[1].mode).toBe('ak_branding');
  });

  it('builds QR prompt and empty state', () => {
    expect(buildLiveWallQrPrompt(theme)).toContain('Los 15 de Sofia');
    expect(buildLiveWallEmptyState(theme).showQr).toBe(true);
  });
});
