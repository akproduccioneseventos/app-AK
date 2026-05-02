import { addReactionToPost, buildFiestaSocialPost } from '@/lib/social-fiesta/private-feed';
import {
  buildFiestaExperienceHighlights,
  buildFiestaExperienceMetrics,
  buildFiestaExperienceReport,
  buildOperatorReportChecklist,
  buildSuggestedPostEventMessage,
} from '@/lib/social-fiesta/experience-report';

const basePost = buildFiestaSocialPost({
  fiestaId: 'fiesta_1',
  authorName: 'Ana',
  role: 'invitado',
  text: 'Hermosa fiesta',
  imageUrl: 'https://example.com/foto.jpg',
  stage: 'en_vivo',
  moderationMode: 'automatico',
  now: '2026-05-01T10:00:00.000Z',
});

describe('social fiesta experience report', () => {
  it('builds metrics from approved posts and participations', () => {
    const reacted = addReactionToPost(basePost, 'me_encanta');
    const metrics = buildFiestaExperienceMetrics({
      posts: [reacted],
      participations: [
        { id: 'p1', challengeId: 'c1', guestName: 'Ana', score: 10, votes: 1, createdAt: '2026-05-01T10:00:00.000Z' },
      ],
    });

    expect(metrics.find(metric => metric.label === 'Publicaciones aprobadas')?.value).toBe(1);
    expect(metrics.find(metric => metric.label === 'Fotos y videos')?.value).toBe(1);
    expect(metrics.find(metric => metric.label === 'Reacciones')?.value).toBe(1);
    expect(metrics.find(metric => metric.label === 'Participaciones en juegos')?.value).toBe(1);
  });

  it('builds highlights and final report', () => {
    const report = buildFiestaExperienceReport({
      fiestaId: 'fiesta_1',
      eventName: 'Los 15 de Sofia',
      posts: [basePost],
      participations: [
        { id: 'p1', challengeId: 'c1', guestName: 'Ana', tableName: 'Mesa 1', score: 10, votes: 1, createdAt: '2026-05-01T10:00:00.000Z' },
      ],
      generatedAt: '2026-05-02T10:00:00.000Z',
    });

    expect(report.headline).toContain('Los 15 de Sofia');
    expect(report.highlights.length).toBeGreaterThan(0);
    expect(report.ranking[0].label).toBe('Ana');
    expect(report.tableRanking[0].label).toBe('Mesa 1');
    expect(report.marketingSummary).toContain('AK Producciones');
  });

  it('builds fallback highlights and operator checklist', () => {
    const highlights = buildFiestaExperienceHighlights({ posts: [], participations: [] });
    expect(highlights[0]).toContain('preparada');

    const report = buildFiestaExperienceReport({
      fiestaId: 'fiesta_1',
      eventName: 'Evento',
      posts: [],
      participations: [],
      generatedAt: '2026-05-02T10:00:00.000Z',
    });

    const checklist = buildOperatorReportChecklist(report);
    expect(checklist.some(item => item.includes('AK Producciones'))).toBe(true);
  });

  it('builds suggested post event message', () => {
    expect(buildSuggestedPostEventMessage({ eventName: 'Evento', photos: 20, reactions: 35 })).toContain('20 fotos/videos');
  });
});
