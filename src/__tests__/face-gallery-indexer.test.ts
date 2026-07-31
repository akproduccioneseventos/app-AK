import { describe, expect, it } from '@jest/globals';
import {
  buildFaceCatalog,
  filterPostsByFace,
  getInitials,
} from '@/lib/social-gallery/face-indexer';
import type { SocialGalleryPost } from '@/types/social-gallery';

function makeMockPost(overrides: Partial<SocialGalleryPost> = {}): SocialGalleryPost {
  return {
    id: `post-${Math.random().toString(36).slice(2, 8)}`,
    fiestaId: 'test-fiesta',
    imageUrl: 'https://example.com/photo.jpg',
    mediaType: 'image',
    moderationStatus: 'approved',
    timestamp: new Date().toISOString(),
    authorName: 'Invitado',
    likes: 0,
    comments: [],
    source: 'guest',
    ...overrides,
  };
}

describe('Face Indexer', () => {
  it('groups posts by author name', () => {
    const posts = [
      makeMockPost({ authorName: 'Valentina', id: 'p1' }),
      makeMockPost({ authorName: 'Martín', id: 'p2' }),
      makeMockPost({ authorName: 'Valentina', id: 'p3' }),
      makeMockPost({ authorName: 'Lucía', id: 'p4' }),
    ];

    const catalog = buildFaceCatalog(posts);

    expect(catalog.faces).toHaveLength(3);
    expect(catalog.totalPhotos).toBe(4);

    const valentina = catalog.faces.find((f) => f.authorName === 'Valentina');
    expect(valentina?.photoCount).toBe(2);
    expect(valentina?.postIds).toEqual(['p1', 'p3']);
  });

  it('sorts faces by photo count descending', () => {
    const posts = [
      makeMockPost({ authorName: 'A', id: 'p1' }),
      makeMockPost({ authorName: 'B', id: 'p2' }),
      makeMockPost({ authorName: 'B', id: 'p3' }),
      makeMockPost({ authorName: 'B', id: 'p4' }),
      makeMockPost({ authorName: 'A', id: 'p5' }),
    ];

    const catalog = buildFaceCatalog(posts);
    expect(catalog.faces[0].authorName).toBe('B');
    expect(catalog.faces[0].photoCount).toBe(3);
  });

  it('excludes hidden posts', () => {
    const posts = [
      makeMockPost({ authorName: 'Visible', moderationStatus: 'approved' }),
      makeMockPost({ authorName: 'Hidden', moderationStatus: 'hidden' }),
    ];

    const catalog = buildFaceCatalog(posts);
    expect(catalog.faces).toHaveLength(1);
    expect(catalog.faces[0].authorName).toBe('Visible');
  });

  it('applies existing tags', () => {
    const posts = [makeMockPost({ authorName: 'Anon', id: 'p1' })];
    const tags = { face_anon: 'Sofía López' };

    const catalog = buildFaceCatalog(posts, tags);
    expect(catalog.faces[0].taggedName).toBe('Sofía López');
    expect(catalog.taggedCount).toBe(1);
    expect(catalog.untaggedCount).toBe(0);
  });

  it('counts tagged vs untagged correctly', () => {
    const posts = [
      makeMockPost({ authorName: 'Tagged', id: 'p1' }),
      makeMockPost({ authorName: 'Untagged', id: 'p2' }),
    ];
    const tags = { face_tagged: 'Real Name' };

    const catalog = buildFaceCatalog(posts, tags);
    expect(catalog.taggedCount).toBe(1);
    expect(catalog.untaggedCount).toBe(1);
  });
});

describe('filterPostsByFace', () => {
  it('returns only posts belonging to the selected face', () => {
    const posts = [
      makeMockPost({ id: 'p1', authorName: 'A' }),
      makeMockPost({ id: 'p2', authorName: 'B' }),
      makeMockPost({ id: 'p3', authorName: 'A' }),
    ];

    const catalog = buildFaceCatalog(posts);
    const faceA = catalog.faces.find((f) => f.authorName === 'A')!;
    const filtered = filterPostsByFace(posts, faceA);

    expect(filtered).toHaveLength(2);
    expect(filtered.map((p) => p.id)).toEqual(['p1', 'p3']);
  });
});

describe('getInitials', () => {
  it('returns two initials for full names', () => {
    expect(getInitials('Valentina García')).toBe('VG');
  });

  it('returns one initial for single names', () => {
    expect(getInitials('Martín')).toBe('M');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('?');
  });
});
