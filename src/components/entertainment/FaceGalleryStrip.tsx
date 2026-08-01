'use client';

import { useCallback, useMemo, useState } from 'react';
import { Camera, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  buildFaceCatalog,
  filterPostsByFace,
  getInitials,
  type FaceEntry,
} from '@/lib/social-gallery/face-indexer';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface FaceGalleryStripProps {
  posts: SocialGalleryPost[];
  onFilterChange?: (filteredPosts: SocialGalleryPost[] | null) => void;
}

const AVATAR_COLORS = [
  'bg-rose-600',
  'bg-violet-600',
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-fuchsia-600',
  'bg-indigo-600',
  'bg-lime-700',
];

export function FaceGalleryStrip({ posts, onFilterChange }: FaceGalleryStripProps) {
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const catalog = useMemo(() => buildFaceCatalog(posts, {}), [posts]);

  const handleAuthorClick = useCallback((author: FaceEntry) => {
    if (selectedAuthorId === author.id) {
      setSelectedAuthorId(null);
      onFilterChange?.(null);
      return;
    }
    setSelectedAuthorId(author.id);
    onFilterChange?.(filterPostsByFace(posts, author));
  }, [onFilterChange, posts, selectedAuthorId]);

  const clearFilter = useCallback(() => {
    setSelectedAuthorId(null);
    onFilterChange?.(null);
  }, [onFilterChange]);

  if (catalog.faces.length === 0) return null;
  const selectedAuthor = catalog.faces.find((author) => author.id === selectedAuthorId);

  return (
    <section className="border-y border-slate-200 bg-white px-4 py-4 sm:rounded-md sm:border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-slate-600" />
          <span className="text-sm font-bold text-slate-900">Fotos por autor</span>
          <Badge variant="secondary" className="whitespace-nowrap text-[10px]">
            {catalog.faces.length} autores · {catalog.totalPhotos} fotos
          </Badge>
        </div>
        {selectedAuthor && (
          <Button size="sm" variant="ghost" onClick={clearFilter} className="h-8 shrink-0 gap-1 text-xs">
            <X className="h-3 w-3" />
            Ver todas
          </Button>
        )}
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {catalog.faces.map((author, index) => {
          const isSelected = selectedAuthorId === author.id;
          return (
            <button
              key={author.id}
              type="button"
              onClick={() => handleAuthorClick(author)}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
              aria-pressed={isSelected}
              aria-label={`Filtrar fotos compartidas por ${author.authorName}`}
            >
              <span className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-full text-lg font-bold text-white ${AVATAR_COLORS[index % AVATAR_COLORS.length]} ${isSelected ? 'ring-4 ring-red-200' : 'ring-2 ring-slate-200'}`}>
                {author.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Firebase media URLs are dynamic.
                  <img src={author.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : getInitials(author.authorName)}
                <span className="absolute bottom-0 right-0 rounded-full border border-white bg-slate-950 px-1.5 py-0.5 text-[9px] text-white">
                  {author.photoCount}
                </span>
              </span>
              <span className={`max-w-full truncate text-[11px] font-semibold ${isSelected ? 'text-red-700' : 'text-slate-600'}`}>
                {author.authorName}
              </span>
            </button>
          );
        })}
      </div>

      {selectedAuthor && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Camera className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-700">
            Mostrando {selectedAuthor.photoCount} fotos compartidas por <strong>{selectedAuthor.authorName}</strong>
          </span>
        </div>
      )}
    </section>
  );
}
