/**
 * Face Indexer: Groups photos by author/face for Wfolio-style gallery.
 * Builds a catalog of unique faces/authors from social gallery posts
 * and allows filtering + name tagging by guests.
 */

import type { SocialGalleryPost } from '@/types/social-gallery';

export interface FaceEntry {
  id: string;
  authorName: string;
  thumbnailUrl: string;
  photoCount: number;
  taggedName?: string;
  postIds: string[];
}

export interface FaceCatalog {
  faces: FaceEntry[];
  totalPhotos: number;
  taggedCount: number;
  untaggedCount: number;
}

export interface FaceTagUpdate {
  faceId: string;
  taggedName: string;
}

/**
 * Normalizes an author name for grouping (lowercased, trimmed).
 */
function normalizeAuthorKey(name: string): string {
  return (name || 'Anónimo').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Builds a face/author catalog from social gallery posts.
 * Groups posts by authorName, extracts the first image as thumbnail,
 * and counts photos per person.
 */
export function buildFaceCatalog(
  posts: SocialGalleryPost[],
  existingTags?: Record<string, string>,
): FaceCatalog {
  const authorMap = new Map<string, {
    displayName: string;
    thumbnailUrl: string;
    postIds: string[];
  }>();

  const approvedPosts = posts.filter(
    (p) => p.moderationStatus !== 'hidden' && p.imageUrl,
  );

  for (const post of approvedPosts) {
    const key = normalizeAuthorKey(post.authorName);
    const existing = authorMap.get(key);

    if (existing) {
      existing.postIds.push(post.id);
    } else {
      authorMap.set(key, {
        displayName: post.authorName || 'Anónimo',
        thumbnailUrl: post.imageUrl,
        postIds: [post.id],
      });
    }
  }

  const tags = existingTags || {};
  const faces: FaceEntry[] = [];

  for (const [key, data] of authorMap.entries()) {
    const faceId = `face_${key.replace(/\s/g, '_')}`;
    faces.push({
      id: faceId,
      authorName: data.displayName,
      thumbnailUrl: data.thumbnailUrl,
      photoCount: data.postIds.length,
      taggedName: tags[faceId] || undefined,
      postIds: data.postIds,
    });
  }

  faces.sort((a, b) => b.photoCount - a.photoCount);

  const taggedCount = faces.filter((f) => f.taggedName).length;

  return {
    faces,
    totalPhotos: approvedPosts.length,
    taggedCount,
    untaggedCount: faces.length - taggedCount,
  };
}

/**
 * Filters posts by a specific face/author entry.
 */
export function filterPostsByFace(
  posts: SocialGalleryPost[],
  face: FaceEntry,
): SocialGalleryPost[] {
  const postIdSet = new Set(face.postIds);
  return posts.filter((p) => postIdSet.has(p.id));
}

/**
 * Generates initials from a name for avatar display.
 */
export function getInitials(name: string): string {
  const parts = (name || '?').trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}
