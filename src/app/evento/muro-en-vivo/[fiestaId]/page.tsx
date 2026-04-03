'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { getSocialPosts } from '@/app/actions/social-gallery';
import type { SocialGalleryPost } from '@/types/social-gallery';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';

const REFRESH_INTERVAL_MS = 8000;

export default function MuroEnVivoPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;

  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [eventName, setEventName] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const postsRef = useRef<SocialGalleryPost[]>([]);

  const fetchData = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const [fetchedPosts, fiestaData] = await Promise.all([
        getSocialPosts(fiestaId),
        getFiestaById(fiestaId),
      ]);

      const sorted = [...fetchedPosts].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Only update if there are new posts to avoid unnecessary re-renders
      if (sorted.length !== postsRef.current.length) {
        postsRef.current = sorted;
        setPosts(sorted);
      }

      if (fiestaData && !eventName) {
        setEventName(fiestaData.configuracion?.nombreEvento || '');
      }
    } catch (_) {
      // Silent fail for projection wall
    } finally {
      if (!isLoaded) setIsLoaded(true);
    }
  }, [fiestaId, eventName, isLoaded]);

  // Initial load and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden select-none">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(120,60,200,0.15),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(20,100,200,0.12),transparent_60%)]" />

      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/60 text-sm font-medium tracking-widest uppercase">En Vivo</span>
        </div>
        {eventName && (
          <span className="text-white/40 text-sm font-semibold tracking-wide">{eventName}</span>
        )}
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-white/10 border-t-white/60 animate-spin" />
            <p className="text-white/40 text-sm tracking-widest uppercase">Cargando muro…</p>
          </div>
        </div>
      )}

      {isLoaded && posts.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="text-8xl opacity-20">📸</div>
          <div className="text-center space-y-2">
            <p className="text-white/50 text-2xl font-light tracking-widest uppercase">Muro Social</p>
            <p className="text-white/30 text-base">Las fotos de los invitados aparecerán aquí</p>
          </div>
        </div>
      )}

      {isLoaded && posts.length > 0 && (
        <MasonryLayout posts={posts} />
      )}
    </div>
  );
}

function MasonryLayout({ posts }: { posts: SocialGalleryPost[] }) {
  // Distribute posts into 3 columns
  const columns = [0, 1, 2].map(colIndex =>
    posts.filter((_, i) => i % 3 === colIndex)
  );

  return (
    <div className="absolute inset-0 pt-14 pb-4 px-3 overflow-hidden">
      <div className="h-full grid grid-cols-3 gap-3">
        {columns.map((colPosts, colIndex) => (
          <div
            key={colIndex}
            className="flex flex-col gap-3 overflow-hidden"
            style={{
              animationName: colIndex % 2 === 0 ? 'scrollUp' : 'scrollDown',
              animationDuration: `${30 + colIndex * 10}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          >
            {/* Duplicate for seamless loop */}
            {[...colPosts, ...colPosts].map((post, i) => (
              <MasonryCard key={`${post.id}-${i}`} post={post} index={i} />
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scrollUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MasonryCard({ post, index }: { post: SocialGalleryPost; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05 }}
      className="relative rounded-2xl overflow-hidden bg-slate-900 shadow-2xl flex-shrink-0 group"
      style={{ aspectRatio: index % 3 === 0 ? '4/5' : index % 3 === 1 ? '1/1' : '3/4' }}
    >
      {!imgError ? (
        <NextImage
          src={post.imageUrl}
          alt={post.authorName}
          fill
          sizes="(max-width: 1920px) 33vw"
          className="object-cover transition-transform duration-[8000ms] group-hover:scale-105"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <span className="text-4xl opacity-20">📷</span>
        </div>
      )}

      {/* Gradient overlay with author name */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
        <p className="text-white text-xs font-semibold truncate">{post.authorName}</p>
      </div>

      {/* New post flash effect */}
      <AnimatePresence>
        {Date.now() - new Date(post.timestamp).getTime() < 15000 && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute inset-0 border-2 border-white/60 rounded-2xl pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
