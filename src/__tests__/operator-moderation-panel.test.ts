import { buildFiestaSocialPost } from '@/lib/social-fiesta/private-feed';
import {
  applyModerationAction,
  buildModerationQuickActions,
  buildModerationSummary,
  buildOperatorWarning,
  canPostAppearOnBigScreen,
  filterModerationQueue,
  sortModerationQueue,
} from '@/lib/social-fiesta/operator-moderation-panel';

describe('operator moderation panel workflow', () => {
  const basePost = buildFiestaSocialPost({
    fiestaId: 'fiesta_1',
    authorName: 'Ana',
    role: 'invitado',
    text: 'Que linda fiesta',
    imageUrl: 'https://example.com/foto.jpg',
    stage: 'en_vivo',
    now: '2026-05-01T10:00:00.000Z',
  });

  it('approves and allows content for big screen', () => {
    const approved = applyModerationAction({
      post: basePost,
      action: 'approve',
      operatorName: 'AK',
      now: '2026-05-01T10:05:00.000Z',
    }).post;

    const allowed = applyModerationAction({
      post: approved,
      action: 'allow_big_screen',
      operatorName: 'AK',
      now: '2026-05-01T10:06:00.000Z',
    });

    expect(allowed.post.reviewStatus).toBe('approved');
    expect(allowed.post.showOnBigScreen).toBe(true);
    expect(canPostAppearOnBigScreen(allowed.post)).toBe(true);
    expect(allowed.audit.operatorName).toBe('AK');
  });

  it('hides deletes and blocks safely', () => {
    const hidden = applyModerationAction({ post: basePost, action: 'hide', operatorName: 'AK' }).post;
    expect(hidden.hidden).toBe(true);
    expect(hidden.showOnBigScreen).toBe(false);

    const deleted = applyModerationAction({ post: hidden, action: 'delete', operatorName: 'AK' }).post;
    expect(deleted.deleted).toBe(true);
    expect(canPostAppearOnBigScreen(deleted)).toBe(false);
  });

  it('summarizes and filters moderation queue', () => {
    const approved = applyModerationAction({ post: basePost, action: 'approve', operatorName: 'AK' }).post;
    const featured = applyModerationAction({ post: approved, action: 'feature', operatorName: 'AK' }).post;
    const blocked = applyModerationAction({ post: basePost, action: 'block_author', operatorName: 'AK' }).post;
    const posts = [basePost, featured, blocked];

    const summary = buildModerationSummary(posts);
    expect(summary.pending).toBe(1);
    expect(summary.featured).toBe(1);
    expect(summary.blocked).toBe(1);
    expect(filterModerationQueue(posts, 'featured')).toHaveLength(1);
    expect(buildOperatorWarning(summary)).toContain('pendiente');
  });

  it('sorts pending first and returns quick actions', () => {
    const approved = applyModerationAction({ post: basePost, action: 'approve', operatorName: 'AK' }).post;
    const sorted = sortModerationQueue([approved, basePost]);
    expect(sorted[0].reviewStatus).toBe('pending_review');
    expect(buildModerationQuickActions(basePost)).toEqual(['approve', 'hide', 'delete']);
  });
});
