'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  X,
  ShieldAlert,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  Ban,
  Link2,
  Copy,
  UserCheck,
} from 'lucide-react';
import {
  moderateSocialPost,
  deleteSocialPost,
  getModerationWorkspaceData,
  blockGuestFromSocialEvent,
  unblockGuestFromSocialEvent,
  generarEnlaceModeradorFamiliar,
} from '@/app/actions/social-gallery';
import type { SocialGalleryPost } from '@/types/social-gallery';
import type { BlockedSocialGuest } from '@/lib/social-fiesta/moderacion-bloqueos';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';

function isVideoPost(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

const PALABRAS_DUDOSAS = [
  'spam', 'insulto', 'estafa', 'troll', 'fake', 'ofensivo', 'mierda', 'puta',
  'puto', 'verga', 'pija', 'culo', 'concha', 'teta', 'desnudo', 'droga',
  'borracho', 'pelea', 'sexo', 'violencia', 'arma',
];

function esPostDudoso(post: SocialGalleryPost): { esDudoso: boolean; motivo?: string; prioridad?: number } {
  if (post.iaRevision?.apropiado === false) {
    return {
      esDudoso: true,
      motivo: post.iaRevision.motivo || 'La IA la marcó como posible contenido inapropiado',
      prioridad: 3,
    };
  }
  if (post.iaRevision?.esDeLaFiesta === false) {
    return {
      esDudoso: true,
      motivo: post.iaRevision.motivo || 'La IA duda si es de la fiesta',
      prioridad: 2,
    };
  }
  const texto = `${post.authorName || ''} ${post.caption || ''} ${post.dedication || ''}`.toLowerCase();
  for (const palabra of PALABRAS_DUDOSAS) {
    if (texto.includes(palabra)) {
      return { esDudoso: true, motivo: `Texto sospechoso ("${palabra}")`, prioridad: 1 };
    }
  }
  if ((post as any).isDark || (post as any).isBlurry || (post as any).aiFlags?.isNsfw) {
    return { esDudoso: true, motivo: 'Posible foto oscura o movida', prioridad: 1 };
  }
  return { esDudoso: false, prioridad: 0 };
}

function SwipeModerationInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const modToken = searchParams.get('modToken') || '';
  const { toast } = useToast();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [role, setRole] = useState<'staff' | 'family'>('staff');
  const [eventName, setEventName] = useState<string>('');
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [blockedGuests, setBlockedGuests] = useState<BlockedSocialGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pending' | 'approved' | 'hidden' | 'blocked'>('pending');
  const [familyLinkInfo, setFamilyLinkInfo] = useState<{ url: string; expiresAt?: string } | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await getModerationWorkspaceData(fiestaId, modToken || undefined);
      if (!res.authorized) {
        setAuthorized(false);
        setAuthError(res.error || 'Acceso no autorizado.');
        setPosts([]);
        setBlockedGuests([]);
        return;
      }
      setAuthorized(true);
      setAuthError(null);
      setRole(res.role ?? 'staff');
      setEventName(res.eventName || 'Evento');
      setPosts(res.posts || []);
      setBlockedGuests(res.blockedGuests || []);
    } catch {
      toast({ title: 'Error al cargar datos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [fiestaId, modToken, toast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredPosts = posts
    .filter(p => {
      if (viewMode === 'blocked') return false;
      const status = p.moderationStatus ?? 'approved';
      return status === viewMode;
    })
    .sort((a, b) => {
      const dudosoA = esPostDudoso(a).prioridad ?? 0;
      const dudosoB = esPostDudoso(b).prioridad ?? 0;
      return dudosoB - dudosoA;
    });

  const handleModerate = async (postId: string, status: 'approved' | 'hidden') => {
    setActioningId(postId);
    try {
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, moderationStatus: status } : p))
      );

      const res = await moderateSocialPost(
        postId,
        status,
        role === 'family' ? 'Familiar Moderador' : 'Operador Mobile',
        modToken || undefined,
      );
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
      loadData();
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (postId: string) => {
    setActioningId(postId);
    try {
      setPosts(prev => prev.filter(p => p.id !== postId));
      const res = await deleteSocialPost(postId, modToken || undefined);
      if (!res.success) throw new Error(res.error || 'No se pudo borrar.');
      toast({
        title: 'Publicación borrada',
        description: 'Se eliminó del muro y de la galería.',
        duration: 1800,
      });
    } catch (err: any) {
      toast({ title: 'Error al borrar', description: err.message, variant: 'destructive' });
      loadData();
    } finally {
      setActioningId(null);
    }
  };

  const handleBlockGuest = async (post: SocialGalleryPost) => {
    setActioningId(post.id);
    try {
      const res = await blockGuestFromSocialEvent(
        fiestaId,
        {
          authorName: post.authorName,
          guestId: post.guestId,
          postId: post.id,
          reason: 'Contenido reportado desde moderación',
        },
        modToken || undefined,
      );
      if (!res.success) throw new Error(res.error || 'No se pudo bloquear.');
      toast({
        title: `Invitado bloqueado: ${post.authorName}`,
        description: 'Ya no podrá subir más fotos ni videos en esta fiesta.',
      });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error al bloquear', description: err.message, variant: 'destructive' });
    } finally {
      setActioningId(null);
    }
  };

  const handleUnblockGuest = async (blockId: string) => {
    setActioningId(blockId);
    try {
      const res = await unblockGuestFromSocialEvent(fiestaId, blockId, modToken || undefined);
      if (!res.success) throw new Error(res.error);
      setBlockedGuests(prev => prev.filter(b => b.id !== blockId));
      toast({ title: 'Invitado desbloqueado' });
    } catch (err: any) {
      toast({ title: 'Error al desbloquear', description: err.message, variant: 'destructive' });
    } finally {
      setActioningId(null);
    }
  };

  const handleCreateFamilyLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await generarEnlaceModeradorFamiliar(fiestaId);
      if (!res.success || !res.url) {
        throw new Error(res.error || 'No se pudo generar el enlace.');
      }
      const fullUrl =
        typeof window !== 'undefined' ? `${window.location.origin}${res.url}` : res.url;
      setFamilyLinkInfo({ url: fullUrl, expiresAt: res.expiresAt });
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl).catch(() => undefined);
      }
      toast({
        title: 'Enlace temporal para familiar listo',
        description: 'Solo permite aprobar, ocultar, borrar y bloquear en esta fiesta.',
      });
    } catch (err: any) {
      toast({ title: 'No se pudo generar el enlace', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingLink(false);
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

  if (authorized === false) {
    return (
      <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm w-full bg-zinc-900 border border-rose-500/40 rounded-3xl p-8 space-y-4 shadow-2xl">
          <ShieldAlert className="w-14 h-14 text-rose-400 mx-auto" />
          <h1 className="text-xl font-black">Acceso no autorizado</h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {authError || 'Este enlace no es válido o ya venció al terminar la fiesta.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      {/* HEADER */}
      <header className="p-4 flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 backdrop-blur-md z-20 pt-safe gap-2">
        {role === 'staff' ? (
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition shrink-0"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-bold text-amber-300 shrink-0">
            Familiar
          </div>
        )}
        <div className="text-center min-w-0 flex-1">
          <h1 className="text-sm font-black uppercase tracking-widest text-amber-400">
            Moderador Móvil
          </h1>
          {eventName && (
            <p className="text-[10px] font-semibold text-zinc-400 truncate max-w-[200px] mx-auto">
              {eventName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BotonComoFunciona clave="moderacion" variant="dark" />
          {role === 'staff' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateFamilyLink}
              disabled={generatingLink}
              className="rounded-full border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 text-[11px] font-bold px-3 h-8 shrink-0"
            >
              {generatingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5 mr-1" />}
              Familiar
            </Button>
          ) : null}
        </div>
      </header>

      {/* GENERATED FAMILY MODERATOR LINK BANNER (STAFF ONLY) */}
      {role === 'staff' && familyLinkInfo && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/25 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            <p className="font-bold text-amber-300">Enlace temporal para familiar (vence al terminar la fiesta)</p>
            <p className="text-[11px] text-zinc-300 truncate">{familyLinkInfo.url}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              navigator.clipboard?.writeText(familyLinkInfo.url);
              toast({ title: 'Enlace copiado' });
            }}
            className="text-amber-300 hover:text-white shrink-0 h-8 px-2.5"
          >
            <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
          </Button>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-zinc-900/20 border-b border-zinc-900 shrink-0">
        {(['pending', 'approved', 'hidden', 'blocked'] as const).map(mode => {
          const count =
            mode === 'blocked'
              ? blockedGuests.length
              : posts.filter(p => (p.moderationStatus ?? 'approved') === mode).length;
          const label =
            mode === 'pending'
              ? 'Pendientes'
              : mode === 'approved'
              ? 'Mural'
              : mode === 'hidden'
              ? 'Ocultos'
              : 'Bloqueados';
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
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 min-h-0">
        <AnimatePresence mode="popLayout">
          {viewMode === 'blocked' ? (
            blockedGuests.length > 0 ? (
              <div className="w-full h-full overflow-y-auto space-y-3 pr-1 max-w-xl">
                {blockedGuests.map(b => (
                  <div key={b.id} className="bg-zinc-900/60 border border-rose-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{b.authorName || 'Invitado'}</p>
                      <p className="text-xs text-zinc-400">{b.reason || 'Bloqueado por moderación'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actioningId === b.id}
                      onClick={() => handleUnblockGuest(b.id)}
                      className="rounded-full text-xs font-bold border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 space-y-2 text-zinc-400">
                <Ban className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="font-bold text-white">Sin invitados bloqueados</p>
                <p className="text-xs">Si bloqueás a alguien, no podrá subir más fotos ni videos.</p>
              </div>
            )
          ) : filteredPosts.length > 0 ? (
            viewMode === 'pending' ? (
              filteredPosts.slice(0, 1).map((post) => (
                <SwipeCard
                  key={post.id}
                  post={post}
                  allPosts={posts}
                  onApprove={() => handleModerate(post.id, 'approved')}
                  onReject={() => handleModerate(post.id, 'hidden')}
                  onDelete={() => handleDelete(post.id)}
                  onBlockGuest={() => handleBlockGuest(post)}
                  disabled={actioningId === post.id}
                />
              ))
            ) : (
              <div className="w-full h-full overflow-y-auto space-y-4 pr-1 max-w-2xl">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
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
                        {esPostDudoso(post).esDudoso && (
                          <p className="text-[11px] font-semibold text-amber-400 mt-1 truncate">
                            ⚠️ {esPostDudoso(post).motivo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {viewMode === 'hidden' ? (
                        <Button
                          size="sm"
                          disabled={actioningId === post.id}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold px-3"
                          onClick={() => handleModerate(post.id, 'approved')}
                        >
                          Aprobar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={actioningId === post.id}
                          variant="outline"
                          className="rounded-full text-xs font-bold px-3 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                          onClick={() => handleModerate(post.id, 'hidden')}
                        >
                          Ocultar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={actioningId === post.id}
                        variant="destructive"
                        className="rounded-full text-xs font-bold px-3"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Borrar
                      </Button>
                      <Button
                        size="sm"
                        disabled={actioningId === post.id}
                        variant="outline"
                        className="rounded-full text-xs font-bold px-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/15"
                        onClick={() => handleBlockGuest(post)}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" /> Bloquear a este invitado
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
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
            : 'Moderación segura: aprobar, ocultar, borrar o bloquear invitado'}
        </p>
      </footer>
    </div>
  );
}

export default function SwipeModerationPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white">
          <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
          <p className="text-sm tracking-widest uppercase text-zinc-400">Cargando moderación...</p>
        </div>
      }
    >
      <SwipeModerationInner />
    </Suspense>
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
  onDelete: () => void;
  onBlockGuest: () => void;
  disabled: boolean;
}

function SwipeCard({ post, allPosts, onApprove, onReject, onDelete, onBlockGuest, disabled }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);

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
      className="absolute w-full max-w-[350px] max-h-[82vh] bg-zinc-900 border border-zinc-800 rounded-[2.2rem] shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing select-none touch-none"
      initial={{ scale: 0.9, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
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
      <div className="flex-1 min-h-[220px] bg-zinc-950 relative overflow-hidden">
        {isVideo ? (
          <video src={post.imageUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        ) : (
          <NextImage src={post.imageUrl} alt="" fill className="object-cover" unoptimized priority />
        )}

        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm p-2 rounded-full border border-white/10 text-white/70">
          {isVideo ? <VideoIcon className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
        </div>

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

      {/* TEXT & INFO */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 space-y-1.5 relative">
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

      {/* PRIMARY ACTIONS */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pt-3 pb-2 bg-zinc-900/60 border-t border-zinc-800/50 shrink-0">
        <Button
          onClick={onReject}
          disabled={disabled}
          variant="outline"
          className="h-11 border-rose-900/40 text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 hover:text-rose-400 rounded-2xl flex gap-2 font-bold"
        >
          <X className="w-4 h-4" />
          Ocultar
        </Button>
        <Button
          onClick={onApprove}
          disabled={disabled}
          className="h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex gap-2 font-bold shadow-lg shadow-emerald-950/20"
        >
          <Check className="w-4 h-4" />
          Aprobar
        </Button>
      </div>

      {/* SECONDARY ACTIONS: BORRAR + BLOQUEAR */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-1 bg-zinc-900/60 shrink-0">
        <Button
          onClick={onDelete}
          disabled={disabled}
          variant="destructive"
          className="h-9 rounded-xl text-xs font-bold flex gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Borrar
        </Button>
        <Button
          onClick={onBlockGuest}
          disabled={disabled}
          variant="outline"
          className="h-9 rounded-xl text-xs font-bold border-amber-500/40 text-amber-300 bg-amber-500/5 hover:bg-amber-500/15 flex gap-1.5"
        >
          <Ban className="w-3.5 h-3.5" />
          Bloquear a este invitado
        </Button>
      </div>
    </motion.div>
  );
}
