'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ArrowLeft, Check, X, ShieldAlert, Loader2, Sparkles, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { getSocialPosts, moderateSocialPost } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { SocialGalleryPost } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';

function isVideoPost(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

const PALABRAS_DUDOSAS = [
  'spam', 'insulto', 'estafa', 'troll', 'fake', 'ofensivo', 'mierda', 'puta',
  'puto', 'verga', 'pija', 'culo', 'concha', 'teta', 'desnudo', 'droga',
  'borracho', 'pelea', 'sexo', 'violencia', 'arma',
];

function esPostDudoso(post: SocialGalleryPost): { esDudoso: boolean; motivo?: string } {
  const texto = `${post.authorName || ''} ${post.caption || ''} ${post.dedication || ''}`.toLowerCase();
  for (const palabra of PALABRAS_DUDOSAS) {
    if (texto.includes(palabra)) {
      return { esDudoso: true, motivo: `Texto sospechoso ("${palabra}")` };
    }
  }
  if ((post as any).isDark || (post as any).isBlurry || (post as any).aiFlags?.isNsfw) {
    return { esDudoso: true, motivo: 'Posible foto oscura o movida' };
  }
  return { esDudoso: false };
}

export default function SwipeModerationPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pending' | 'approved' | 'hidden'>('pending');

  const loadData = useCallback(async () => {
    try {
      const [fiestaData, fetchedPosts] = await Promise.all([
        getFiestaById(fiestaId),
        getSocialPosts(fiestaId),
      ]);
      setFiesta(fiestaData);
      setPosts(fetchedPosts);
    } catch {
      toast({ title: 'Error al cargar datos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
    // Poll for new posts every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter posts based on view mode and prioritize doubtful posts first
  const filteredPosts = posts
    .filter(p => {
      const status = p.moderationStatus ?? 'approved';
      return status === viewMode;
    })
    .sort((a, b) => {
      const dudosoA = esPostDudoso(a).esDudoso ? 1 : 0;
      const dudosoB = esPostDudoso(b).esDudoso ? 1 : 0;
      return dudosoB - dudosoA;
    });

  const handleModerate = async (postId: string, status: 'approved' | 'hidden') => {
    setActioningId(postId);
    try {
      // Optimistic state update
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, moderationStatus: status } : p))
      );

      const res = await moderateSocialPost(postId, status, 'Operador Mobile');
      if (res.success) {
        toast({
          title: status === 'approved' ? 'Foto Aprobada ✅' : 'Foto Ocultada ❌',
          description: status === 'approved' ? 'Ya se muestra en pantalla.' : 'Se quitó del mural.',
          duration: 1500,
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({ title: 'Error al moderar', description: err.message, variant: 'destructive' });
      // Revert on error
      loadData();
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
        <p className="text-sm tracking-widest uppercase text-zinc-400">Cargando moderación...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      {/* HEADER */}
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 backdrop-blur-md z-20 pt-safe">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black uppercase tracking-widest text-amber-400">
            Moderador Móvil
          </h1>
          {fiesta && (
            <p className="text-[10px] font-semibold text-zinc-400 truncate max-w-[180px]">
              {fiesta.configuracion?.nombreEvento}
            </p>
          )}
        </div>
        <div className="w-9" />
      </header>

      {/* FILTER TABS */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-zinc-900/20 border-b border-zinc-900 shrink-0">
        {(['pending', 'approved', 'hidden'] as const).map(mode => {
          const count = posts.filter(p => (p.moderationStatus ?? 'approved') === mode).length;
          const label = mode === 'pending' ? 'Pendientes' : mode === 'approved' ? 'Mural' : 'Ocultos';
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-0.5
                ${viewMode === mode ? 'bg-amber-400 text-zinc-950 scale-[1.02]' : 'text-zinc-400 hover:text-white'}`}
            >
              <span>{label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${viewMode === mode ? 'bg-zinc-950/20' : 'bg-zinc-800'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* CARDS DISPLAY AREA */}
      <div className="flex-1 relative flex items-center justify-center p-6 min-h-0">
        <AnimatePresence mode="popLayout">
          {filteredPosts.length > 0 ? (
            viewMode === 'pending' ? (
              // Tinder-style card deck for pending items
              filteredPosts.slice(0, 1).map((post) => (
                <SwipeCard
                  key={post.id}
                  post={post}
                  allPosts={posts}
                  onApprove={() => handleModerate(post.id, 'approved')}
                  onReject={() => handleModerate(post.id, 'hidden')}
                  disabled={actioningId === post.id}
                />
              ))
            ) : (
              // Simple list/scroll view for approved or hidden items (re-moderating)
              <div className="w-full h-full overflow-y-auto space-y-4 pr-1">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex gap-4 items-center">
                    <div className="relative w-20 h-20 bg-zinc-950 rounded-2xl overflow-hidden shrink-0 border border-zinc-800">
                      {isVideoPost(post) ? (
                        <video src={post.imageUrl} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <NextImage src={post.imageUrl} alt="" fill className="object-cover" unoptimized />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{post.authorName}</p>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {post.caption || post.dedication || 'Sin dedicatoria'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {viewMode === 'hidden' ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold px-3"
                          onClick={() => handleModerate(post.id, 'approved')}
                        >
                          Aprobar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full text-xs font-bold px-3"
                          onClick={() => handleModerate(post.id, 'hidden')}
                        >
                          Ocultar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Empty State
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 space-y-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-zinc-900 flex items-center justify-center text-4xl shadow-inner border border-zinc-800">
                {viewMode === 'pending' ? '🎉' : viewMode === 'approved' ? '📷' : '👁️'}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">
                  {viewMode === 'pending' ? '¡Todo al día!' : viewMode === 'approved' ? 'Mural vacío' : 'Sin fotos ocultadas'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                  {viewMode === 'pending'
                    ? 'No hay fotos pendientes de aprobación en este momento.'
                    : viewMode === 'approved'
                    ? 'No hay fotos aprobadas en este evento todavía.'
                    : 'Las fotos que decidas ocultar se guardarán en esta lista.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QUICK FOOTER TIPS */}
      <footer className="p-4 bg-zinc-950 border-t border-zinc-900 text-center shrink-0">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          {viewMode === 'pending' && filteredPosts.length > 0
            ? '👉 Desliza a la Derecha para Aprobar · 👈 Izquierda para Ocultar'
            : 'Filtros rápidos para moderación de seguridad'}
        </p>
      </footer>
    </div>
  );
}

function checkPostAssistance(post: SocialGalleryPost, allPosts: SocialGalleryPost[]): { isDuplicate: boolean; hasSensitiveWords: boolean } {
  const isDuplicate = allPosts.some(
    p => p.id !== post.id && p.authorName === post.authorName && (p.imageUrl === post.imageUrl || Math.abs(new Date(p.timestamp).getTime() - new Date(post.timestamp).getTime()) < 30_000)
  );
  const SENSITIVE_WORDS = ['spam', 'insulto', 'estafa', 'troll', 'fake', 'ofensivo'];
  const text = `${post.authorName || ''} ${post.caption || ''} ${post.dedication || ''}`.toLowerCase();
  const hasSensitiveWords = SENSITIVE_WORDS.some(word => text.includes(word));
  return { isDuplicate, hasSensitiveWords };
}

interface SwipeCardProps {
  post: SocialGalleryPost;
  allPosts: SocialGalleryPost[];
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
}

function SwipeCard({ post, allPosts, onApprove, onReject, disabled }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Card dynamics based on drag
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Color overlays indicating action
  const approveOpacity = useTransform(x, [0, 120], [0, 0.75]);
  const rejectOpacity = useTransform(x, [-120, 0], [0.75, 0]);

  const handleDragEnd = (_event: any, info: any) => {
    if (disabled) return;
    const swipeThreshold = 130;
    if (info.offset.x > swipeThreshold) {
      onApprove();
    } else if (info.offset.x < -swipeThreshold) {
      onReject();
    }
  };

  const isVideo = isVideoPost(post);
  const assistance = checkPostAssistance(post, allPosts);

  return (
    <motion.div
      style={{ x, y, rotate, opacity }}
      drag={!disabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
      className="absolute w-full max-w-[340px] aspect-[3/4] bg-zinc-900 border border-zinc-800 rounded-[2.2rem] shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing select-none touch-none"
      initial={{ scale: 0.9, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Visual action indicators overlay */}
      <motion.div 
        style={{ opacity: approveOpacity }} 
        className="absolute inset-0 bg-emerald-600/35 border-4 border-emerald-500 pointer-events-none z-10 flex items-center justify-center rounded-[2.2rem]"
      >
        <div className="bg-emerald-500 text-white rounded-full p-4 shadow-lg scale-125">
          <Check className="w-10 h-10" strokeWidth={3} />
        </div>
      </motion.div>
      
      <motion.div 
        style={{ opacity: rejectOpacity }} 
        className="absolute inset-0 bg-rose-600/35 border-4 border-rose-500 pointer-events-none z-10 flex items-center justify-center rounded-[2.2rem]"
      >
        <div className="bg-rose-500 text-white rounded-full p-4 shadow-lg scale-125">
          <X className="w-10 h-10" strokeWidth={3} />
        </div>
      </motion.div>

      {/* MEDIA CONTAINER */}
      <div className="flex-1 bg-zinc-950 relative overflow-hidden">
        {isVideo ? (
          <video src={post.imageUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <NextImage src={post.imageUrl} alt="" fill className="object-cover" unoptimized priority />
        )}
        
        {/* Media type badge */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm p-2 rounded-full border border-white/10 text-white/70">
          {isVideo ? <VideoIcon className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
        </div>

        {/* Assistance Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
          {(() => {
            const d = esPostDudoso(post);
            return d.esDudoso ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                ⚠️ {d.motivo || 'Atención prioritaria'}
              </span>
            ) : null;
          })()}
          {assistance.isDuplicate && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-wider shadow-md">
              ⚠️ Posible repetida
            </span>
          )}
          {assistance.hasSensitiveWords && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              🔍 Revisar texto
            </span>
          )}
        </div>
      </div>

      {/* TEXT & INFO OVERLAY */}
      <div className="p-5 bg-zinc-900 border-t border-zinc-800 space-y-2 relative">
        <div className="flex justify-between items-center">
          <p className="text-base font-bold truncate pr-4 text-white">{post.authorName}</p>
          <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Pendiente</span>
        </div>
        {(post.caption || post.dedication) && (
          <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
            "{post.caption || post.dedication}"
          </p>
        )}
      </div>

      {/* MANUAL CLICK/TAP ACTIONS */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-900/60 border-t border-zinc-800/50 shrink-0">
        <Button
          onClick={onReject}
          disabled={disabled}
          variant="outline"
          className="h-12 border-rose-900/40 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-400 rounded-2xl flex gap-2 font-bold"
        >
          <X className="w-4 h-4" />
          Ocultar
        </Button>
        <Button
          onClick={onApprove}
          disabled={disabled}
          className="h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex gap-2 font-bold shadow-lg shadow-emerald-950/20"
        >
          <Check className="w-4 h-4" />
          Aprobar
        </Button>
      </div>
    </motion.div>
  );
}
