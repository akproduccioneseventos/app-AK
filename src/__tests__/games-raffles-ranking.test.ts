import { buildFiestaSocialPost, addReactionToPost } from '@/lib/social-fiesta/private-feed';
import {
  buildDefaultFiestaGameSet,
  buildGameLiveWallTitle,
  buildParticipationFromPost,
  buildPresetGameSet,
  buildRanking,
  buildTableRanking,
  drawFiestaRaffle,
  getReadyPromptsForPreset,
  READY_TO_USE_PROMPTS,
} from '@/lib/social-fiesta/games-raffles-ranking';

describe('social fiesta games raffles and rankings', () => {
  it('creates default game set and ready prompts', () => {
    const games = buildDefaultFiestaGameSet('fiesta_1');
    expect(games.length).toBeGreaterThanOrEqual(6);
    expect(games.some(game => game.type === 'sorteo_participantes')).toBe(true);
    expect(READY_TO_USE_PROMPTS.length).toBeGreaterThanOrEqual(10);
  });

  it('gets ready prompts by event preset with general prompts included', () => {
    const prompts = getReadyPromptsForPreset('xv');
    expect(prompts.some(prompt => prompt.id === 'xv_selfie')).toBe(true);
    expect(prompts.some(prompt => prompt.preset === 'general')).toBe(true);

    const games = buildPresetGameSet({ fiestaId: 'fiesta_1', preset: 'xv' });
    expect(games.length).toBeGreaterThan(0);
  });

  it('builds participation only from approved big-screen posts', () => {
    let post = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Ana',
      role: 'invitado',
      text: 'Foto de mesa',
      imageUrl: 'https://example.com/foto.jpg',
      stage: 'en_vivo',
      moderationMode: 'automatico',
      now: '2026-05-01T10:00:00.000Z',
    });
    post = addReactionToPost(addReactionToPost(post, 'me_gusta'), 'me_encanta');

    const participation = buildParticipationFromPost({
      challengeId: 'challenge_1',
      post,
      tableName: 'Mesa 3',
      now: '2026-05-01T10:01:00.000Z',
    });

    expect(participation).toBeDefined();
    expect(participation?.score).toBeGreaterThan(5);
    expect(participation?.tableName).toBe('Mesa 3');
  });

  it('builds individual and table rankings', () => {
    const participations = [
      { id: 'p1', challengeId: 'c1', guestName: 'Ana', tableName: 'Mesa 1', score: 10, votes: 5, createdAt: '2026-05-01T10:00:00.000Z' },
      { id: 'p2', challengeId: 'c1', guestName: 'Juan', tableName: 'Mesa 2', score: 15, votes: 3, createdAt: '2026-05-01T10:01:00.000Z' },
      { id: 'p3', challengeId: 'c1', guestName: 'Sofia', tableName: 'Mesa 1', score: 8, votes: 2, createdAt: '2026-05-01T10:02:00.000Z' },
    ];

    expect(buildRanking(participations)[0].label).toBe('Juan');
    const tableRanking = buildTableRanking(participations);
    expect(tableRanking[0].label).toBe('Mesa 1');
    expect(tableRanking[0].score).toBe(18);
  });

  it('draws a deterministic raffle', () => {
    const participations = [
      { id: 'p1', challengeId: 'c1', guestName: 'Ana', score: 10, votes: 1, createdAt: '2026-05-01T10:00:00.000Z' },
      { id: 'p2', challengeId: 'c1', guestName: 'Juan', score: 12, votes: 1, createdAt: '2026-05-01T10:01:00.000Z' },
    ];

    const result = drawFiestaRaffle({ participations, seed: 'fiesta_1' });
    expect(result.eligibleCount).toBe(2);
    expect(result.winner).toBeDefined();
  });

  it('builds live wall game title with prize', () => {
    const game = buildDefaultFiestaGameSet('fiesta_1')[0];
    game.prizeDescription = 'Premio sorpresa';
    expect(buildGameLiveWallTitle(game)).toContain('Premio sorpresa');
  });
});
