'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Loader2,
  Search,
  Tag,
  UserCircle2,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  buildFaceCatalog,
  filterPostsByFace,
  getInitials,
  type FaceCatalog,
  type FaceEntry,
} from '@/lib/social-gallery/face-indexer';
import { getPublicSocialPosts, tagFaceNameAction } from '@/app/actions/social-gallery';
import type { SocialGalleryPost } from '@/types/social-gallery';

interface FaceGalleryStripProps {
  fiestaId: string;
  posts: SocialGalleryPost[];
  onFilterChange?: (filteredPosts: SocialGalleryPost[] | null) => void;
}

const AVATAR_COLORS = [
  'from-rose-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-fuchsia-500 to-pink-500',
  'from-indigo-500 to-blue-500',
  'from-lime-500 to-green-500',
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function FaceGalleryStrip({
  fiestaId,
  posts,
  onFilterChange,
}: FaceGalleryStripProps) {
  const [faceTags, setFaceTags] = useState<Record<string, string>>({});
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [taggingFaceId, setTaggingFaceId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [isSavingTag, setIsSavingTag] = useState(false);

  const catalog: FaceCatalog = useMemo(
    () => buildFaceCatalog(posts, faceTags),
    [posts, faceTags],
  );

  const handleFaceClick = useCallback(
    (face: FaceEntry) => {
      if (selectedFaceId === face.id) {
        setSelectedFaceId(null);
        onFilterChange?.(null);
      } else {
        setSelectedFaceId(face.id);
        const filtered = filterPostsByFace(posts, face);
        onFilterChange?.(filtered);
      }
    },
    [selectedFaceId, posts, onFilterChange],
  );

  const handleClearFilter = useCallback(() => {
    setSelectedFaceId(null);
    onFilterChange?.(null);
  }, [onFilterChange]);

  const handleStartTagging = useCallback((face: FaceEntry) => {
    setTaggingFaceId(face.id);
    setTagInput(face.taggedName || face.authorName);
  }, []);

  const handleSaveTag = useCallback(
    async (faceId: string) => {
      if (!tagInput.trim()) return;
      setIsSavingTag(true);
      try {
        await tagFaceNameAction(fiestaId, faceId, tagInput.trim());
        setFaceTags((prev) => ({ ...prev, [faceId]: tagInput.trim() }));
        setTaggingFaceId(null);
        setTagInput('');
      } catch {
        // silently fail
      } finally {
        setIsSavingTag(false);
      }
    },
    [fiestaId, tagInput],
  );

  if (catalog.faces.length === 0) return null;

  const selectedFace = catalog.faces.find((f) => f.id === selectedFaceId);

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-white/90">
            Personas en la Fiesta
          </span>
          <Badge
            variant="secondary"
            className="text-[10px] bg-violet-500/20 text-violet-300 border-violet-500/30"
          >
            {catalog.faces.length} personas · {catalog.totalPhotos} fotos
          </Badge>
        </div>
        {selectedFace && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearFilter}
            className="text-xs text-white/60 hover:text-white h-7 gap-1"
          >
            <X className="w-3 h-3" />
            Mostrar Todas
          </Button>
        )}
      </div>

      {/* Face Strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
        {catalog.faces.map((face, index) => {
          const isSelected = selectedFaceId === face.id;
          const displayName = face.taggedName || face.authorName;

          return (
            <div
              key={face.id}
              className="flex flex-col items-center gap-1 shrink-0 group"
            >
              {/* Avatar */}
              <button
                onClick={() => handleFaceClick(face)}
                className={`
                  relative w-14 h-14 rounded-full overflow-hidden
                  transition-all duration-200 ease-out
                  ${isSelected
                    ? 'ring-[3px] ring-violet-400 ring-offset-2 ring-offset-slate-900 scale-110'
                    : 'ring-2 ring-white/20 hover:ring-white/50 hover:scale-105'
                  }
                `}
              >
                {face.thumbnailUrl ? (
                  <img
                    src={face.thumbnailUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`
                      w-full h-full flex items-center justify-center
                      bg-gradient-to-br ${getAvatarColor(index)}
                      text-white font-bold text-lg
                    `}
                  >
                    {getInitials(displayName)}
                  </div>
                )}
                {/* Photo count badge */}
                <div className="absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white border border-white/20">
                  {face.photoCount}
                </div>
              </button>

              {/* Name */}
              <span className={`
                text-[10px] font-semibold max-w-[60px] truncate text-center
                ${isSelected ? 'text-violet-300' : 'text-white/60'}
              `}>
                {displayName}
              </span>

              {/* Tag button (only on hover if not yet tagged) */}
              {!face.taggedName && taggingFaceId !== face.id && (
                <button
                  onClick={() => handleStartTagging(face)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
                >
                  <Tag className="w-2.5 h-2.5" />
                  ¿Sos vos?
                </button>
              )}

              {/* Tag input */}
              {taggingFaceId === face.id && (
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tu nombre"
                    className="h-6 text-[10px] w-24 bg-slate-800 border-violet-500/50 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTag(face.id);
                      if (e.key === 'Escape') setTaggingFaceId(null);
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveTag(face.id)}
                    disabled={isSavingTag || !tagInput.trim()}
                    className="h-6 px-2 text-[9px] bg-violet-600 hover:bg-violet-500"
                  >
                    {isSavingTag ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'OK'
                    )}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active filter indicator */}
      {selectedFace && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Camera className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-300">
            Mostrando <strong>{selectedFace.photoCount} fotos</strong> de{' '}
            <strong>{selectedFace.taggedName || selectedFace.authorName}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
