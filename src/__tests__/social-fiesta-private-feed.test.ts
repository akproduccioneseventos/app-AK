import {
  addCommentToPost,
  addReactionToPost,
  buildAkSoftSellingPosts,
  buildFiestaSocialPost,
  sortFiestaFeed,
} from '@/lib/social-fiesta/private-feed';

describe('private party social feed', () => {
  it('creates a safe pending post by default', () => {
    const post = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Maria',
      role: 'cliente',
      text: 'Faltan pocos dias para la fiesta',
      stage: 'previa',
      now: '2026-05-01T10:00:00.000Z',
    });

    expect(post.fiestaId).toBe('fiesta_1');
    expect(post.reviewStatus).toBe('pending_review');
    expect(post.showOnBigScreen).toBe(false);
    expect(post.reactions.me_gusta).toBe(0);
  });

  it('blocks posts with unsafe text', () => {
    const post = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Invitado',
      role: 'invitado',
      text: 'contenido porno',
      stage: 'en_vivo',
      moderationMode: 'automatico',
      now: '2026-05-01T10:00:00.000Z',
    });

    expect(post.reviewStatus).toBe('blocked');
    expect(post.showOnBigScreen).toBe(false);
  });

  it('adds reactions and comments safely', () => {
    const post = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'AK Producciones',
      role: 'organizador',
      text: 'Bienvenidos a la previa',
      stage: 'previa',
      moderationMode: 'automatico',
      now: '2026-05-01T10:00:00.000Z',
    });

    const reacted = addReactionToPost(post, 'me_encanta');
    expect(reacted.reactions.me_encanta).toBe(1);

    const commented = addCommentToPost({
      post: reacted,
      authorName: 'Ana',
      role: 'invitado',
      text: 'Que lindo todo',
      moderationMode: 'automatico',
      now: '2026-05-01T10:01:00.000Z',
    });

    expect(commented.comments).toHaveLength(1);
    expect(commented.comments[0].reviewStatus).toBe('approved');
  });

  it('sorts pinned posts first and then newest first', () => {
    const older = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Maria',
      role: 'cliente',
      text: 'Post viejo',
      stage: 'previa',
      moderationMode: 'automatico',
      now: '2026-05-01T09:00:00.000Z',
    });
    const pinned = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      kind: 'aviso_ak',
      authorName: 'AK Producciones',
      role: 'organizador',
      text: 'Aviso importante',
      stage: 'previa',
      moderationMode: 'automatico',
      now: '2026-05-01T08:00:00.000Z',
    });
    const newer = buildFiestaSocialPost({
      fiestaId: 'fiesta_1',
      authorName: 'Pedro',
      role: 'invitado',
      text: 'Post nuevo',
      stage: 'previa',
      moderationMode: 'automatico',
      now: '2026-05-01T10:00:00.000Z',
    });

    const sorted = sortFiestaFeed([older, pinned, newer]);
    expect(sorted[0].id).toBe(pinned.id);
    expect(sorted[1].id).toBe(newer.id);
    expect(sorted[2].id).toBe(older.id);
  });

  it('builds soft-selling AK posts without direct selling pressure', () => {
    const posts = buildAkSoftSellingPosts({
      fiestaId: 'fiesta_1',
      stage: 'previa',
      eventName: 'los 15 de Sofia',
      daysToEvent: 30,
      now: '2026-05-01T10:00:00.000Z',
    });

    expect(posts).toHaveLength(3);
    expect(posts.some(post => post.kind === 'venta_invisible')).toBe(true);
    expect(posts.every(post => post.authorName === 'AK Producciones')).toBe(true);
  });
});
