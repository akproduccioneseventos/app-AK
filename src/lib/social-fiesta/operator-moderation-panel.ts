import type { FiestaSocialPost } from './private-feed';
import type { SocialContentReviewStatus } from './content-review';

export type ModerationActionType =
  | 'approve'
  | 'hide'
  | 'feature'
  | 'unfeature'
  | 'block_author'
  | 'delete'
  | 'send_to_review'
  | 'allow_big_screen'
  | 'remove_from_big_screen';

export type ModerationQueueFilter = 'all' | 'pending' | 'approved' | 'blocked' | 'featured' | 'big_screen';

export type ModerationAuditEntry = {
  id: string;
  postId: string;
  action: ModerationActionType;
  operatorName: string;
  createdAt: string;
  reason?: string;
};

export type ModeratedSocialPost = FiestaSocialPost & {
  hidden?: boolean;
  deleted?: boolean;
  featured?: boolean;
  blockedAuthor?: boolean;
  moderationReason?: string;
};

export type ModerationPanelSummary = {
  total: number;
  pending: number;
  approved: number;
  blocked: number;
  featured: number;
  bigScreen: number;
  hidden: number;
  deleted: number;
};

function createAuditId(postId: string, action: ModerationActionType, now: string): string {
  return `audit_${postId}_${action}_${now.replace(/[^0-9]/g, '').slice(0, 14)}`.slice(0, 120);
}

function nextStatus(action: ModerationActionType, current: SocialContentReviewStatus): SocialContentReviewStatus {
  if (action === 'approve' || action === 'allow_big_screen' || action === 'feature') return 'approved';
  if (action === 'hide' || action === 'delete' || action === 'block_author') return 'blocked';
  if (action === 'send_to_review') return 'pending_review';
  return current;
}

export function applyModerationAction(input: {
  post: ModeratedSocialPost;
  action: ModerationActionType;
  operatorName: string;
  reason?: string;
  now?: string;
}): { post: ModeratedSocialPost; audit: ModerationAuditEntry } {
  const now = input.now ?? new Date().toISOString();
  const status = nextStatus(input.action, input.post.reviewStatus);
  const post: ModeratedSocialPost = {
    ...input.post,
    reviewStatus: status,
    moderationReason: input.reason ?? input.post.moderationReason,
  };

  if (input.action === 'approve') {
    post.hidden = false;
    post.deleted = false;
  }
  if (input.action === 'allow_big_screen') post.showOnBigScreen = true;
  if (input.action === 'remove_from_big_screen') post.showOnBigScreen = false;
  if (input.action === 'hide') {
    post.hidden = true;
    post.showOnBigScreen = false;
  }
  if (input.action === 'feature') {
    post.featured = true;
    post.showOnBigScreen = true;
  }
  if (input.action === 'unfeature') post.featured = false;
  if (input.action === 'delete') {
    post.deleted = true;
    post.hidden = true;
    post.showOnBigScreen = false;
  }
  if (input.action === 'block_author') {
    post.blockedAuthor = true;
    post.hidden = true;
    post.showOnBigScreen = false;
  }
  if (input.action === 'send_to_review') post.showOnBigScreen = false;

  return {
    post,
    audit: {
      id: createAuditId(input.post.id, input.action, now),
      postId: input.post.id,
      action: input.action,
      operatorName: input.operatorName,
      createdAt: now,
      reason: input.reason,
    },
  };
}

export function buildModerationSummary(posts: ModeratedSocialPost[]): ModerationPanelSummary {
  return posts.reduce(
    (summary, post) => {
      summary.total += 1;
      if (post.reviewStatus === 'pending_review') summary.pending += 1;
      if (post.reviewStatus === 'approved') summary.approved += 1;
      if (post.reviewStatus === 'blocked') summary.blocked += 1;
      if (post.featured) summary.featured += 1;
      if (post.showOnBigScreen && post.reviewStatus === 'approved' && !post.hidden && !post.deleted) summary.bigScreen += 1;
      if (post.hidden) summary.hidden += 1;
      if (post.deleted) summary.deleted += 1;
      return summary;
    },
    { total: 0, pending: 0, approved: 0, blocked: 0, featured: 0, bigScreen: 0, hidden: 0, deleted: 0 } as ModerationPanelSummary
  );
}

export function filterModerationQueue(posts: ModeratedSocialPost[], filter: ModerationQueueFilter): ModeratedSocialPost[] {
  if (filter === 'all') return posts;
  if (filter === 'pending') return posts.filter(post => post.reviewStatus === 'pending_review');
  if (filter === 'approved') return posts.filter(post => post.reviewStatus === 'approved');
  if (filter === 'blocked') return posts.filter(post => post.reviewStatus === 'blocked');
  if (filter === 'featured') return posts.filter(post => post.featured);
  if (filter === 'big_screen') return posts.filter(post => post.showOnBigScreen && post.reviewStatus === 'approved' && !post.hidden && !post.deleted);
  return posts;
}

export function sortModerationQueue(posts: ModeratedSocialPost[]): ModeratedSocialPost[] {
  return [...posts].sort((a, b) => {
    if (a.reviewStatus !== b.reviewStatus) {
      if (a.reviewStatus === 'pending_review') return -1;
      if (b.reviewStatus === 'pending_review') return 1;
    }
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function canPostAppearOnBigScreen(post: ModeratedSocialPost): boolean {
  return post.reviewStatus === 'approved' && post.showOnBigScreen && !post.hidden && !post.deleted && !post.blockedAuthor;
}

export function buildOperatorWarning(summary: ModerationPanelSummary): string | undefined {
  if (summary.pending > 0) return `Hay ${summary.pending} contenido(s) pendiente(s) de revisión antes de pantalla gigante.`;
  if (summary.blocked > 0) return `Hay ${summary.blocked} contenido(s) bloqueado(s). Revisá si corresponde eliminar o mantener oculto.`;
  return undefined;
}

export function buildModerationQuickActions(post: ModeratedSocialPost): ModerationActionType[] {
  if (post.deleted) return [];
  if (post.reviewStatus === 'pending_review') return ['approve', 'hide', 'delete'];
  if (post.reviewStatus === 'approved') return post.showOnBigScreen
    ? ['feature', 'remove_from_big_screen', 'hide', 'delete']
    : ['allow_big_screen', 'feature', 'hide', 'delete'];
  return ['send_to_review', 'delete', 'block_author'];
}
