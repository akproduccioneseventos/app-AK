'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  Gamepad2,
  Heart,
  ImagePlus,
  Loader2,
  MessageCircle,
  Mic,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Send,
  Square,
  Upload,
  UserRound,
  Video,
  X,
  Sparkles,
  Share2,
  MapPin,
  Clock,
  Trophy,
  Download,
} from 'lucide-react';
import TriviaGameScreen from '@/components/games/TriviaGameScreen';
import PhotoMissionScreen from '@/components/games/PhotoMissionScreen';
import {
  addChatMessage,
  addCommentToPost,
  addLikeToPost,
  getChatMessages,
  getPublicSocialEvent,
  getPublicSocialPosts,
  uploadSocialPost,
} from '@/app/actions/social-gallery';
import {
  addDedication,
  addSongRequest,
  getActivePoll,
  getPublicDedications,
  getSongRequests,
  uploadDedicationAudio,
  votePoll,
  voteSongRequest,
} from '@/app/actions/social-interactive';
import { voteActiveGameOption } from '@/app/actions/fiesta/screen-mode.actions';
import { getPublicGuestPortalData } from '@/app/actions/public-guest-portal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { isEventInActiveWindow } from '@/lib/experience-ak/post-event-utils';
import { enqueueOfflineAction, getPendingOfflineActions } from '@/lib/offline/offline-action-queue';
import { QuinceaneraLeadPrompt } from '@/components/public/QuinceaneraLeadPrompt';
import {
  waitForInitialPublicLoad,
  withPublicRequestTimeout,
} from '@/lib/public-experience/wait-for-initial-public-load';
import { MAX_DEDICATION_RECORDING_SECONDS } from '@/lib/social-fiesta/guardrails';
import type { PublicSocialEvent } from '@/lib/social-fiesta/public-event';
import type { ChatMessage, Dedication, SocialGalleryPost, SocialPoll, SongRequest } from '@/types/social-gallery';
import type { SocialGallerySettings } from '@/types/fiesta';
import PostEventMemoryHub from '@/components/social-wall/PostEventMemoryHub';
import { FaceGalleryStrip } from '@/components/entertainment/FaceGalleryStrip';
import { PaparazziOverlay } from '@/components/social-wall/PaparazziOverlay';
import { SpotifySongSearch } from '@/components/invitacion/SpotifySongSearch';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { optimizeImageForUpload } from '@/lib/media/image-optimizer';

type SocialSection = 'feed' | 'songs' | 'dedications' | 'chat' | 'poll' | 'game' | 'missions' | 'schedule' | 'ranking';

/**
 * Tope de duracion para los videos que sube un invitado.
 *
 * El tope va aca, en lo que entra, y no en lo que sale: asi la fiesta puede
 * juntar todos los recuerdos que quiera sin que ninguno se pierda, y ningun
 * invitado solo acapara la pantalla grande ni el archivo del cliente.
 */
const MAX_VIDEO_SEGUNDOS = 15;

const DEFAULT_SETTINGS: SocialGallerySettings = {
  enabled: true,
  allowLikes: true,
  allowComments: true,
  uploadsActive: true,
  chatEnabled: true,
  showSongRequests: true,
  showDedications: true,
  showPolls: true,
  // Si la fiesta todavia no tiene configuracion propia, se asume moderado. Es el
  // lado seguro: lo que sale a la pantalla grande no se puede deshacer.
  requireApproval: true,
  accentColor: '#c81e2a',
  backgroundColor: '#f0f2f5',
};

function mergeSettings(settings?: SocialGallerySettings): SocialGallerySettings {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    allowLikes: settings?.allowLikes ?? true,
    allowComments: settings?.allowComments ?? true,
    uploadsActive: settings?.uploadsActive ?? true,
    chatEnabled: settings?.chatEnabled ?? true,
    showSongRequests: settings?.showSongRequests ?? true,
    showDedications: settings?.showDedications ?? true,
    showPolls: settings?.showPolls ?? true,
  };
}

function isVideo(post: SocialGalleryPost) {
  return post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'I';
}

function FeedPost({
  post,
  authorName,
  accentColor,
  allowLikes,
  allowComments,
  liked,
  onLike,
  onComment,
}: {
  post: SocialGalleryPost;
  authorName: string;
  accentColor: string;
  allowLikes: boolean;
  allowComments: boolean;
  liked: boolean;
  onLike: () => void;
  onComment: (text: string) => Promise<void>;
}) {
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const caption = post.caption || post.dedication || post.momentTag;

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    const value = comment.trim();
    if (!value || sending) return;
    setSending(true);
    await onComment(value);
    setComment('');
    setSending(false);
  };

  const isMission = post.momentTag?.toLowerCase().includes('misión') || post.momentTag?.toLowerCase().includes('mision') || caption?.toLowerCase().includes('misión') || caption?.toLowerCase().includes('mision');

  return (
    <article className={`overflow-hidden border-y sm:rounded-md sm:border relative ${isMission ? 'bg-amber-50 border-amber-300 ring-4 ring-amber-400/50 shadow-xl shadow-amber-500/10' : 'border-slate-200 bg-white'}`}>
      {isMission && (
        <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 font-black text-center py-1.5 uppercase tracking-widest text-[10px] shadow-sm z-10">
          ⭐ Misión Secreta Cumplida ⭐
        </div>
      )}
      <header className={`flex items-center gap-3 px-4 py-3 ${isMission ? 'pt-8' : ''}`}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-white" style={{ backgroundColor: accentColor }}>
          {initials(post.authorName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{post.authorName}</p>
          <p className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: es })}
          </p>
        </div>
      </header>

      {caption && <p className="px-4 pb-3 text-sm leading-relaxed text-slate-800">{caption}</p>}

      <div className="relative bg-black">
        {isVideo(post) ? (
          <video src={post.imageUrl} controls playsInline preload="metadata" className="max-h-[680px] w-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Guest media can come from Firebase signed URLs.
          <img src={post.imageUrl} alt={`Momento compartido por ${post.authorName}`} loading="lazy" className="max-h-[680px] w-full object-contain" />
        )}
      </div>

      <div className="px-4 py-3">
        <div className="flex min-h-7 items-center justify-between border-b border-slate-100 pb-2 text-xs text-slate-500">
          <span>{post.likes || 0} Me gusta</span>
          <span>{post.comments?.length || 0} comentarios</span>
        </div>
        <div className="grid grid-cols-3 border-b border-slate-100 py-1">
          <button
            type="button"
            onClick={onLike}
            disabled={!allowLikes || liked}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-md text-xs font-bold transition hover:bg-slate-100 disabled:cursor-default"
            style={liked ? { color: accentColor } : { color: '#475569' }}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Te gusta' : 'Me gusta'}
          </button>
          <button
            type="button"
            onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}
            disabled={!allowComments}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-md text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4" /> Comentar
          </button>
          <a
            href={post.imageUrl}
            download={`foto-${post.authorName || 'fiesta'}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-md text-xs font-bold text-slate-600 transition hover:bg-slate-100"
            title="Descargar foto"
          >
            <Download className="h-4 w-4" /> Bajar
          </a>
        </div>

        {(post.comments || []).slice(-4).map((item) => (
          <div key={item.id} className="mt-3 flex items-start gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
              {initials(item.authorName)}
            </div>
            <div className="min-w-0 rounded-md bg-slate-100 px-3 py-2 text-sm">
              <p className="font-bold text-slate-900">{item.authorName}</p>
              <p className="break-words text-slate-700">{item.text}</p>
            </div>
          </div>
        ))}

        {allowComments && (
          <form onSubmit={submitComment} className="mt-3 flex items-center gap-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-black text-white" style={{ backgroundColor: accentColor }}>
              {initials(authorName)}
            </div>
            <div className="flex min-w-0 flex-1 items-center rounded-md bg-slate-100 px-3">
              <input
                id={`comment-${post.id}`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Escribí un comentario"
                maxLength={500}
                className="min-h-10 min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500"
              />
              <button type="submit" disabled={!comment.trim() || sending} className="grid h-9 w-9 place-items-center text-slate-500 disabled:opacity-40" aria-label="Enviar comentario">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

export default function SocialEventPage() {
  const params = useParams<{ fiestaId: string }>();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId;
  const guestId = searchParams.get('guestId') || '';
  const guestAccessToken = searchParams.get('token') || '';
  const stationModuleId = searchParams.get('estacion') || '';
  const stationAccessToken = searchParams.get('access') || '';
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicSocialEvent | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [songs, setSongs] = useState<SongRequest[]>([]);
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [poll, setPoll] = useState<SocialPoll | null>(null);
  const [section, setSection] = useState<SocialSection>('feed');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadThumbnail, setUploadThumbnail] = useState<File | null>(null);
  // Lo que quedo sin subir por falta de señal. Vive en memoria, no en el disco
  // del celular: la foto es demasiado grande para guardarla ahi.
  const [envioPendiente, setEnvioPendiente] = useState<{ archivo: File; texto: string } | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [votedSongs, setVotedSongs] = useState<Set<string>>(new Set());
  const [songDraft, setSongDraft] = useState('');
  const [dedicationDraft, setDedicationDraft] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votedPollId, setVotedPollId] = useState<string | null>(null);
  const [votedGameId, setVotedGameId] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<SocialGalleryPost[] | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPaparazziOpen, setIsPaparazziOpen] = useState(false);

  const settings = useMemo(() => mergeSettings(event?.socialGallerySettings), [event?.socialGallerySettings]);
  const accentColor = settings.accentColor || '#c81e2a';
  const eventName = settings.title || event?.configuracion.nombreEvento || 'Red social del evento';
  const activeGame = settings.activeGame;
  const canParticipate = Boolean(
    (guestId && guestAccessToken) || (stationModuleId && stationAccessToken),
  );
  const canUpload = canParticipate;
  const interactionCredentials = {
    guestId,
    guestAccessToken,
    stationModuleId,
    stationAccessToken,
  };
  const visiblePosts = filteredPosts ?? posts;

  const loadCore = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    setHasError(false);
    let anyError = false;
    const [eventResult, postsResult, pollResult] = await Promise.allSettled([
      getPublicSocialEvent(fiestaId),
      getPublicSocialPosts(fiestaId),
      getActivePoll(fiestaId),
    ]);
    if (eventResult.status === 'fulfilled') setEvent(eventResult.value);
    else anyError = true;

    if (postsResult.status === 'fulfilled') setPosts(postsResult.value);
    else anyError = true;

    if (pollResult.status === 'fulfilled') setPoll(pollResult.value);
    else anyError = true;

    if (anyError) setHasError(true);
    if (showLoader) setRefreshing(false);
  }, [fiestaId]);

  const loadSection = useCallback(async (target: SocialSection) => {
    if (target === 'songs') setSongs(await getSongRequests(fiestaId));
    if (target === 'dedications') setDedications(await getPublicDedications(fiestaId));
    if (target === 'chat') setMessages(await getChatMessages(fiestaId));
    if (target === 'poll') setPoll(await getActivePoll(fiestaId));
  }, [fiestaId]);

  useEffect(() => {
    const initName = async () => {
      let savedName = sessionStorage.getItem(`socialWallAuthor_${fiestaId}`) || '';

      if (guestId && guestAccessToken && !savedName) {
        try {
          const portal = await getPublicGuestPortalData(fiestaId, guestId, guestAccessToken);
          if (portal?.guest?.nombre) {
            savedName = portal.guest.nombre;
            sessionStorage.setItem(`socialWallAuthor_${fiestaId}`, savedName);
          }
        } catch (error) {
          console.warn('[SocialEvent] Failed to load guest name:', error);
        }
      }

      setAuthorName(savedName);
      setNameDraft(savedName);
      setNameDialogOpen(!savedName && !guestId); // Solo abrir si no hay nombre Y no vino por enlace personal
    };

    void initName();

    try {
      setLikedPosts(new Set(JSON.parse(sessionStorage.getItem(`likedPosts_${fiestaId}`) || '[]')));
    } catch {
      setLikedPosts(new Set());
    }
    try {
      setVotedSongs(new Set(JSON.parse(sessionStorage.getItem(`votedSongs_${fiestaId}`) || '[]')));
    } catch {
      setVotedSongs(new Set());
    }
    setVotedPollId(localStorage.getItem(`votedPoll_${fiestaId}`));
    setVotedGameId(localStorage.getItem(`votedGame_${fiestaId}`));
    const requestedSection = new URLSearchParams(window.location.search).get('section');
    if (requestedSection && ['feed', 'songs', 'dedications', 'chat', 'poll', 'game', 'missions'].includes(requestedSection)) {
      setSection(requestedSection as SocialSection);
    }
  }, [fiestaId, guestId, guestAccessToken]);

  useEffect(() => {
    let active = true;
    const refreshPublicData = async (isInitialLoad = false) => {
      if ((!isInitialLoad && document.visibilityState !== 'visible') || pollingRef.current) return;
      pollingRef.current = true;

      const requestTask = (async () => {
        await Promise.all([loadCore(), loadSection(section)]);
        if (isInitialLoad) {
          const items = await getPublicDedications(fiestaId);
          if (active) setDedications(items);
        }
      })();

      // El timeout deja de esperar en pantalla, pero no cancela una Server Action.
      // Mantener la traba hasta que la solicitud real termine evita acumular cientos
      // de consultas cuando la conexión del salón está lenta.
      void requestTask.finally(() => {
        pollingRef.current = false;
      }).catch(() => undefined);

      const loadTask = withPublicRequestTimeout(requestTask)
        .catch((error) => {
          console.warn('[SocialEvent] public data refresh failed:', error);
          if (active) setHasError(true);
        });

      if (isInitialLoad) {
        await waitForInitialPublicLoad(loadTask);
        if (active) setLoading(false);
        return;
      }

      await loadTask;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshPublicData(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    void refreshPublicData(true);
    const timer = setInterval(() => {
      void refreshPublicData();
    }, 7000);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fiestaId, loadCore, loadSection, section]);

  useEffect(() => () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
  }, [audioPreview, uploadPreview]);

  useEffect(() => {
    // Check for Paparazzi moment in real-time or simulate
    if (event?.momentoPaparazziActivo) {
      setIsPaparazziOpen(true);
    } else {
      setIsPaparazziOpen(false);
    }
  }, [event?.momentoPaparazziActivo]);

  const availableSections = useMemo(() => [
    { id: 'feed' as const, label: 'Inicio', icon: MessageCircle },
    { id: 'schedule' as const, label: 'Cronograma', icon: Clock },
    { id: 'ranking' as const, label: 'Ranking', icon: Trophy },
    { id: 'missions' as const, label: 'Misiones', icon: Sparkles },
    ...(settings.showSongRequests !== false ? [{ id: 'songs' as const, label: 'Canciones', icon: Music2 }] : []),
    ...(settings.showDedications !== false ? [{ id: 'dedications' as const, label: 'Mensajes', icon: Heart }] : []),
    ...(settings.chatEnabled !== false ? [{ id: 'chat' as const, label: 'Chat', icon: Send }] : []),
    ...(settings.showPolls !== false && poll ? [{ id: 'poll' as const, label: 'Encuesta', icon: BarChart3 }] : []),
    ...(activeGame ? [{ id: 'game' as const, label: 'Juego', icon: Gamepad2 }] : []),
  ], [activeGame, poll, settings.chatEnabled, settings.showDedications, settings.showPolls, settings.showSongRequests]);

  const chooseSection = (next: SocialSection) => {
    setSection(next);
    void loadSection(next);
  };

  const saveName = (eventForm: FormEvent) => {
    eventForm.preventDefault();
    const safeName = nameDraft.trim();
    if (!safeName) return;
    setAuthorName(safeName);
    sessionStorage.setItem(`socialWallAuthor_${fiestaId}`, safeName);
    setNameDialogOpen(false);
  };

  /**
   * Duracion de un video elegido por el invitado, en segundos.
   *
   * Se lee del propio archivo antes de subir nada: si el navegador no puede
   * averiguarla, se deja pasar en vez de trabar al invitado. El peso maximo ya
   * actua de red de contencion.
   */
  const duracionDelVideo = (file: File): Promise<number | null> =>
    new Promise(resolve => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      const limpiar = () => URL.revokeObjectURL(url);
      video.onloadedmetadata = () => {
        limpiar();
        resolve(Number.isFinite(video.duration) ? video.duration : null);
      };
      video.onerror = () => {
        limpiar();
        resolve(null);
      };
      video.src = url;
    });

  const selectUpload = async (change: ChangeEvent<HTMLInputElement>) => {
    const file = change.target.files?.[0];
    if (!file) return;
    const video = file.type.startsWith('video/');
    const image = file.type.startsWith('image/');
    if (!video && !image) {
      toast({ title: 'Formato no compatible', description: 'Elegí una foto o un video.', variant: 'destructive' });
      return;
    }
    const limit = video ? 60 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > limit) {
      toast({ title: 'Archivo demasiado grande', description: video ? 'El video puede pesar hasta 60 MB.' : 'La foto puede pesar hasta 10 MB.', variant: 'destructive' });
      return;
    }

    // Los videos van cortos a proposito: en la pantalla grande de la fiesta uno
    // largo se come el turno de todos los demas, y en el archivo del cliente
    // ocupa lo que ocuparian decenas de recuerdos. Quince segundos alcanzan
    // para un saludo.
    if (video) {
      const segundos = await duracionDelVideo(file);
      if (segundos !== null && segundos > MAX_VIDEO_SEGUNDOS + 0.5) {
        toast({
          title: 'El video es muy largo',
          description: `Puede durar hasta ${MAX_VIDEO_SEGUNDOS} segundos. El tuyo dura ${Math.round(segundos)}. Recortalo y volvé a intentar.`,
          variant: 'destructive',
        });
        change.target.value = '';
        return;
      }
    }

    let finalFile = file;
    let finalThumbnail: File | null = null;
    if (image) {
      finalFile = await optimizeImageForUpload(file);
      try {
        finalThumbnail = await optimizeImageForUpload(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
          format: 'image/webp',
        });
      } catch {}
    }

    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(finalFile);
    setUploadThumbnail(finalThumbnail);
    setUploadPreview(URL.createObjectURL(finalFile));
  };

  const clearUpload = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadThumbnail(null);
    setUploadPreview(null);
    setUploadCaption('');
  };

  /**
   * Cuando vuelve la señal, esta pantalla se ocupa **solo de su foto pendiente**.
   *
   * Antes tambien vaciaba la cola del celular con un enviador que no enviaba nada
   * y devolvia exito: como el exito borra el elemento, **el muro borraba los
   * pedidos de barra y los check-in de recepcion sin mandarlos**. El invitado leia
   * "se sincroniza solo", el trago desaparecia y nunca llegaba a la barra.
   *
   * El muro no encola nada, asi que no tiene nada que vaciar. Cada pantalla vacia
   * lo suyo, con el filtro `types`.
   */
  useEffect(() => {
    const alVolverLaSenal = () => {
      setEnvioPendiente((pendiente) => {
        if (!pendiente) return null;
        setUploadFile(pendiente.archivo);
        setUploadCaption(pendiente.texto);
        setUploadOpen(true);
        toast({ title: 'Volvió la señal', description: 'Tocá publicar para subir tu foto.' });
        return null;
      });
    };
    window.addEventListener('online', alVolverLaSenal);
    return () => window.removeEventListener('online', alVolverLaSenal);
  }, [fiestaId, toast]);

  const submitUpload = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    if (!uploadFile || uploading) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('file', uploadFile);
    if (uploadThumbnail) {
      formData.append('thumbnail', uploadThumbnail);
    }
    formData.append('authorName', authorName || 'Invitado');
    formData.append('dedication', uploadCaption.trim());
    if (guestId) {
      formData.append('guestId', guestId);
    }
    if (guestAccessToken) {
      formData.append('guestAccessToken', guestAccessToken);
    }
    if (stationModuleId && stationAccessToken) {
      formData.append('moduleId', stationModuleId);
      formData.append('sourceModule', stationModuleId);
      formData.append('accessToken', stationAccessToken);
    }
    if (uploadFile.type.startsWith('image/') && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', await uploadFile.arrayBuffer());
      formData.append('imageHash', Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join(''));
    }
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Sin conexión');
      }
      const result = await uploadSocialPost(formData);
      if (result.success) {
        toast({
          title: settings.requireApproval ? 'Momento enviado' : 'Momento publicado',
          description: settings.requireApproval ? 'El equipo lo revisará antes de mostrarlo.' : 'Ya aparece en la red social.',
        });
        clearUpload();
        setUploadOpen(false);
        await loadCore();
      } else {
        toast({ title: 'No se pudo publicar', description: result.error, variant: 'destructive' });
      }
    } catch {
      // La cola del celular no puede guardar la foto: una foto de celular pesa
      // varios megas y ahi no entra. Antes se encolaba solo el nombre y el
      // texto, y se le prometia al invitado que su foto se iba a publicar sola:
      // la foto ya no estaba. Ahora se le dice la verdad y se reintenta solo
      // mientras tenga la pantalla abierta.
      setEnvioPendiente({ archivo: uploadFile, texto: uploadCaption.trim() });
      toast({
        title: 'Sin señal por ahora',
        description: 'No cierres esta pantalla: lo subimos solos apenas vuelva la señal.',
      });
      setUploadOpen(false);
    }
    setUploading(false);
  };

  const likePost = async (postId: string) => {
    if (likedPosts.has(postId) || settings.allowLikes === false) return;
    const next = new Set(likedPosts).add(postId);
    setLikedPosts(next);
    sessionStorage.setItem(`likedPosts_${fiestaId}`, JSON.stringify([...next]));
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post));
    const result = await addLikeToPost(postId, interactionCredentials);
    if (!result.success) {
      next.delete(postId);
      setLikedPosts(new Set(next));
      sessionStorage.setItem(`likedPosts_${fiestaId}`, JSON.stringify([...next]));
      await loadCore();
    }
  };

  const commentPost = async (postId: string, text: string) => {
    const result = await addCommentToPost(postId, text, authorName || 'Invitado', interactionCredentials);
    if (!result.success) toast({ title: 'No se pudo comentar', description: result.error, variant: 'destructive' });
    await loadCore();
  };

  const submitSong = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    if (!songDraft.trim() || submitting) return;

    const requestedCountKey = `requestedSongsCount_${fiestaId}`;
    const currentRequestedCount = typeof window !== 'undefined'
      ? Number(sessionStorage.getItem(requestedCountKey) || 0)
      : 0;

    if (currentRequestedCount >= 3) {
      toast({
        title: 'Límite alcanzado',
        description: 'Podés pedir hasta 3 canciones por fiesta. ¡Votá los temas de otros invitados!',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const result = await addSongRequest(fiestaId, songDraft.trim(), authorName || 'Invitado');
    if (result.success) {
      setSongDraft('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(requestedCountKey, String(currentRequestedCount + 1));
      }
      toast({ title: 'Canción enviada al DJ' });
      await loadSection('songs');
    } else {
      toast({ title: 'No se pudo enviar', description: result.error, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const voteSong = async (songId: string, like: boolean) => {
    const next = new Set(votedSongs).add(songId);
    setVotedSongs(next);
    sessionStorage.setItem(`votedSongs_${fiestaId}`, JSON.stringify([...next]));

    if (like) {
      setSongs((current) => current.map((s) => s.id === songId ? { ...s, votes: (s.votes || 0) + 1 } : s));
      const result = await voteSongRequest(fiestaId, songId);
      if (!result.success) {
        toast({ title: 'No se pudo votar', description: result.error, variant: 'destructive' });
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (eventData) => eventData.data.size > 0 && audioChunksRef.current.push(eventData.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioPreview) URL.revokeObjectURL(audioPreview);
        setAudioBlob(blob);
        setAudioPreview(URL.createObjectURL(blob));
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((current) => {
          const next = current + 1;
          if (next >= MAX_DEDICATION_RECORDING_SECONDS && recorder.state === 'recording') recorder.stop();
          return next;
        });
      }, 1000);
    } catch {
      toast({ title: 'No se pudo usar el micrófono', description: 'Revisá el permiso del navegador.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const clearAudio = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioBlob(null);
    setAudioPreview(null);
    setRecordingSeconds(0);
  };

  const submitDedication = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    if ((!dedicationDraft.trim() && !audioBlob) || submitting) return;
    setSubmitting(true);
    let audioUrl: string | undefined;
    if (audioBlob) {
      const formData = new FormData();
      formData.append('file', new File([audioBlob], 'mensaje.webm', { type: 'audio/webm' }));
      const upload = await uploadDedicationAudio(fiestaId, formData);
      if (!upload.success) {
        toast({ title: 'No se pudo subir el audio', description: upload.error, variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      audioUrl = upload.audioUrl;
    }
    const result = await addDedication(fiestaId, dedicationDraft.trim() || 'Mensaje de voz', authorName || 'Invitado', audioUrl);
    if (result.success) {
      setDedicationDraft('');
      clearAudio();
      toast({ title: settings.privateDedicationsMode ? 'Mensaje privado enviado' : 'Mensaje compartido' });
      await loadSection('dedications');
    } else toast({ title: 'No se pudo enviar', description: result.error, variant: 'destructive' });
    setSubmitting(false);
  };

  const submitChat = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    const text = chatDraft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    const result = await addChatMessage(fiestaId, text, authorName || 'Invitado', interactionCredentials);
    if (result.success) {
      setChatDraft('');
      await loadSection('chat');
    } else toast({ title: 'No se pudo enviar', description: result.error, variant: 'destructive' });
    setSubmitting(false);
  };

  const submitPollVote = async (optionId: string) => {
    if (!poll || votedPollId === poll.id) return;
    const result = await votePoll(fiestaId, poll.id, optionId);
    if (result.success) {
      setVotedPollId(poll.id);
      localStorage.setItem(`votedPoll_${fiestaId}`, poll.id);
      setPoll(result.poll || poll);
    } else toast({ title: 'No se pudo votar', description: result.error, variant: 'destructive' });
  };

  const submitGameVote = async (optionId: string) => {
    if (!activeGame || votedGameId === activeGame.launchedAt) return;
    const result = await voteActiveGameOption(fiestaId, optionId);
    if (result.success) {
      setVotedGameId(activeGame.launchedAt);
      localStorage.setItem(`votedGame_${fiestaId}`, activeGame.launchedAt);
      await loadCore();
    } else toast({ title: 'No se pudo votar', description: result.error, variant: 'destructive' });
  };

  if (loading) {
    // El invitado escanea el QR parado en la fiesta y esta espera puede llegar
    // a veinte segundos, porque el muro pide varias cosas al servidor. Antes
    // veia una rueda sola en una pantalla en blanco. Mostrando la marca desde
    // el primer instante, una frase que diga que esta pasando y el armazon de
    // la galeria en gris, los mismos segundos se sienten la mitad.
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="border-b border-slate-200 bg-white px-4 py-4">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-700">AK Producciones</p>
          <h1 className="mt-1 text-xl font-black text-slate-900">Muro de la fiesta</h1>
        </header>

        <div className="px-4 py-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-red-700" />
            Buscando las fotos de la fiesta…
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(hueco => (
              <div
                key={hueco}
                className="aspect-square animate-pulse rounded-xl bg-slate-200"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-white">
        <div><h1 className="text-3xl font-black">Evento no disponible</h1><p className="mt-3 text-slate-400">Revisá el enlace o pedí un nuevo QR al equipo.</p></div>
      </main>
    );
  }

  const activeWindow = isEventInActiveWindow(event.configuracion.fechaEvento);
  if (!activeWindow.isActive && activeWindow.phase === 'after') {
    return <PostEventMemoryHub fiesta={event} posts={posts} dedications={dedications} />;
  }

  if (settings.enabled === false && !event.clientAccessGranted) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6 text-center">
        <div><Pause className="mx-auto h-10 w-10 text-slate-400" /><h1 className="mt-4 text-2xl font-black text-slate-900">La red social está pausada</h1><p className="mt-2 text-slate-500">El equipo la activará en el momento indicado.</p></div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-950">
      <PaparazziOverlay
        fiestaId={fiestaId}
        isOpen={isPaparazziOpen}
        onUpload={() => { setIsPaparazziOpen(false); setUploadOpen(true); }}
        onClose={() => setIsPaparazziOpen(false)}
      />



      <Dialog open={nameDialogOpen} onOpenChange={(open) => authorName && setNameDialogOpen(open)}>
        <DialogContent hideCloseButton className="max-w-sm rounded-md border-0 bg-white p-6">
          <DialogHeader className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100"><UserRound className="h-7 w-7 text-slate-700" /></div>
            <DialogTitle className="pt-2 text-2xl">Entrá a la fiesta</DialogTitle>
            <DialogDescription>Tu nombre aparecerá en fotos, mensajes y pedidos.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveName} className="mt-3 space-y-4">
            <Label htmlFor="guest-name">Nombre</Label>
            <Input id="guest-name" autoFocus value={nameDraft} onChange={(change) => setNameDraft(change.target.value)} maxLength={60} placeholder="Ej: Sofía Pérez" className="h-12 bg-white text-slate-950" />
            <Button type="submit" disabled={!nameDraft.trim()} className="h-12 w-full text-base" style={{ backgroundColor: accentColor }}>Continuar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) clearUpload(); }}>
        <DialogContent className="max-w-lg rounded-md border-0 bg-white p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Crear publicación</DialogTitle>
            <DialogDescription>Compartí una foto o un video del evento.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitUpload} className="space-y-4 p-5">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: accentColor }}>{initials(authorName)}</div><p className="font-bold">{authorName}</p></div>
            <Textarea value={uploadCaption} onChange={(change) => setUploadCaption(change.target.value)} maxLength={500} placeholder="¿Qué querés contar sobre este momento?" className="min-h-24 resize-none border-0 bg-slate-50 text-base text-slate-950" />
            {uploadPreview ? (
              <div className="relative overflow-hidden rounded-md bg-black">
                {uploadFile?.type.startsWith('video/') ? <video src={uploadPreview} controls className="max-h-[420px] w-full object-contain" /> : (
                  // eslint-disable-next-line @next/next/no-img-element -- Blob preview URLs are not supported by next/image.
                  <img src={uploadPreview} alt="Vista previa" className="max-h-[420px] w-full object-contain" />
                )}
                <button type="button" onClick={clearUpload} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white" aria-label="Quitar archivo"><X className="h-5 w-5" /></button>
              </div>
            ) : (
              <Label htmlFor="social-upload" className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                <ImagePlus className="h-9 w-9 text-slate-500" /><span className="font-bold text-slate-800">Elegir foto o video</span><span className="text-xs text-slate-500">Foto hasta 10 MB · video hasta 60 MB</span>
                <input id="social-upload" type="file" accept="image/*,video/*" onChange={selectUpload} className="sr-only" />
              </Label>
            )}
            <Button type="submit" disabled={!uploadFile || uploading} className="h-12 w-full text-base" style={{ backgroundColor: accentColor }}>{uploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Upload className="mr-2 h-5 w-5" />}Publicar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          {section !== 'feed' && <button type="button" onClick={() => chooseSection('feed')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" aria-label="Volver"><ArrowLeft className="h-5 w-5" /></button>}
          <div className="min-w-0 flex-1"><h1 className="truncate text-base font-black sm:text-lg">{eventName}</h1><p className="text-xs text-slate-500">Hola, {authorName || 'invitado'}</p></div>
          <a
            href={`/evento/mi-mesa/${fiestaId}${guestId ? `?guestId=${encodeURIComponent(guestId)}&token=${encodeURIComponent(guestAccessToken)}` : ''}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-800 transition text-xs font-bold shrink-0"
            title="Buscar mi mesa"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Mi Mesa</span>
          </a>
          <button type="button" onClick={() => void loadCore(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100" aria-label="Actualizar"><RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      {settings.mobileControlCoverUrl && section === 'feed' && (
        <div className="relative mx-auto h-48 max-w-6xl overflow-hidden sm:mt-4 sm:h-64 sm:rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element -- Event covers may use Firebase signed URLs. */}
          <img src={settings.mobileControlCoverUrl} alt={eventName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute bottom-0 px-5 py-4 text-white"><p className="text-2xl font-black sm:text-4xl">{eventName}</p>{settings.subtitle && <p className="mt-1 text-sm text-white/85">{settings.subtitle}</p>}</div>
        </div>
      )}

      <nav className="sticky top-16 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 py-2">
          {availableSections.map((item) => {
            const Icon = item.icon;
            const selected = section === item.id;
            return <button key={item.id} type="button" onClick={() => chooseSection(item.id)} className="relative flex min-h-11 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-bold transition hover:bg-slate-100" style={selected ? { color: accentColor, backgroundColor: `${accentColor}0d` } : { color: '#475569' }}><Icon className="h-5 w-5" />{item.label}{selected && <span className="absolute inset-x-2 bottom-0 h-0.5" style={{ backgroundColor: accentColor }} />}</button>;
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl py-4 sm:px-4 sm:py-6">
        <div>
          {section === 'feed' && (
            <div className="space-y-4">
              <FaceGalleryStrip posts={posts} onFilterChange={setFilteredPosts} />
              <QuinceaneraLeadPrompt
                fiestaId={fiestaId}
                nombreFiesta={event?.configuracion.nombreEvento}
                invitadoNombre={authorName}
                origen="muro_social"
              />
              {guestId && (
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block sm:inline">¿Querés guardar el enlace de tus fotos?</span>{' '}
                    Para volver a ver tu recuerdo y video mañana.
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `¡Hola! Guardá este enlace para ver tus fotos y el video recuerdo de la fiesta mañana: ${
                        typeof window !== 'undefined' ? window.location.origin : ''
                      }/invitacion/${fiestaId}/recap?guestId=${encodeURIComponent(guestId)}${
                        guestAccessToken ? `&token=${encodeURIComponent(guestAccessToken)}` : ''
                      }`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Mandármelo por WhatsApp
                  </a>
                </div>
              )}
              <section className="border-y border-slate-200 bg-white p-4 sm:rounded-md sm:border">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: accentColor }}>{initials(authorName)}</div><button type="button" onClick={() => setUploadOpen(true)} disabled={!settings.uploadsActive || !canUpload} className="min-h-11 flex-1 rounded-md bg-slate-100 px-4 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">{!canUpload ? 'Abrí tu enlace personal para publicar' : settings.uploadsActive ? '¿Qué querés compartir?' : 'Las publicaciones están pausadas'}</button></div>
                <div className="mt-3 grid grid-cols-2 border-t border-slate-100 pt-2"><button type="button" onClick={() => setUploadOpen(true)} disabled={!settings.uploadsActive || !canUpload} className="flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"><Camera className="h-5 w-5 text-emerald-600" />Foto</button><button type="button" onClick={() => setUploadOpen(true)} disabled={!settings.uploadsActive || !canUpload} className="flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"><Video className="h-5 w-5 text-red-600" />Video</button></div>
              </section>
              {hasError && visiblePosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                  <p className="text-lg font-medium text-red-500 mb-2">No se pudieron cargar las publicaciones.</p>
                  <p className="text-sm mb-6">Hubo un problema de conexión.</p>
                  <Button onClick={() => void loadCore(true)} className="px-6" style={{ backgroundColor: accentColor }}>Reintentar</Button>
                </div>
              ) : visiblePosts.length ? visiblePosts.map((post) => <FeedPost key={post.id} post={post} authorName={authorName} accentColor={accentColor} allowLikes={settings.allowLikes !== false && canParticipate} allowComments={settings.allowComments !== false && canParticipate} liked={likedPosts.has(post.id)} onLike={() => void likePost(post.id)} onComment={(text) => commentPost(post.id, text)} />) : <EmptyState icon={Camera} title="Todavía no hay publicaciones" text={posts.length ? 'No hay publicaciones de este autor.' : 'Sé la primera persona en compartir un momento de la fiesta.'} actionLabel={!posts.length && settings.uploadsActive && canUpload ? 'Subí tu primera foto' : undefined} onAction={!posts.length && settings.uploadsActive && canUpload ? () => setUploadOpen(true) : undefined} hint={!posts.length ? 'Todo lo que subas aparece también en la pantalla grande del salón.' : undefined} />}
            </div>
          )}

          {section === 'songs' && (
            <SectionShell key="songs" title="Votá la música" text="Elegí qué canciones querés que suenen.">
              <form onSubmit={submitSong} className="mb-6 flex gap-2">
                <SpotifySongSearch value={songDraft} onChange={setSongDraft} />
                <Button type="submit" disabled={!songDraft.trim() || submitting} className="h-12 px-4" style={{ backgroundColor: accentColor }}><Send className="h-5 w-5" /></Button>
              </form>

              <div className="relative flex h-[350px] w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 border border-slate-200">
                <AnimatePresence mode="popLayout">
                  {(() => {
                    const activeSong = songs.find(s => !votedSongs.has(s.id) && !s.played);
                    if (!activeSong) {
                      return (
                        <motion.div key="empty" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 grid place-items-center">
                          <EmptyState icon={Music2} title="¡Ya votaste todo!" text="Pedí una nueva canción arriba." />
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div
                        key={activeSong.id}
                        initial={{ opacity: 0, scale: 0.8, y: 50, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.1, y: -50, rotate: 5 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-white p-6 text-center shadow-sm"
                      >
                        <div className="mb-8 w-full flex-1 flex flex-col items-center justify-center">
                          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-slate-100">
                            <Music2 className="h-10 w-10 text-slate-400" />
                          </div>
                          <h3 className="mb-3 text-3xl font-black leading-tight text-slate-900 line-clamp-3">{activeSong.song}</h3>
                          <p className="text-sm font-semibold text-slate-500">Pedido por {activeSong.requestedBy}</p>
                        </div>
                        <div className="flex w-full justify-center gap-6 pb-4">
                          <button
                            type="button"
                            onClick={() => voteSong(activeSong.id, false)}
                            className="grid h-16 w-16 place-items-center rounded-full bg-white text-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition hover:scale-110 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
                            aria-label="No me gusta"
                          >
                            <X className="h-7 w-7" strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            onClick={() => voteSong(activeSong.id, true)}
                            className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition hover:scale-110 hover:bg-slate-50 active:scale-95"
                            style={{ color: accentColor }}
                            aria-label="Me gusta"
                          >
                            <Heart className="h-7 w-7 fill-current" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>

              <div className="mt-8">
                <h4 className="mb-4 text-sm font-bold text-slate-500">Ranking actual</h4>
                <div className="divide-y divide-slate-100">
                  {songs.filter(s => s.votes > 0 || s.played).sort((a, b) => {
                    if (a.played !== b.played) return a.played ? 1 : -1;
                    return (b.votes || 0) - (a.votes || 0);
                  }).slice(0, 5).map((song, index) => (
                    <div key={song.id} className="flex items-center gap-3 py-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black" style={index < 3 && !song.played ? { backgroundColor: accentColor, color: 'white' } : {}}>{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-bold ${song.played ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{song.song}</p>
                      </div>
                      {song.played ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><Play className="h-3 w-3 fill-current" /> Sonó</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">{song.votes} votos</span>
                      )}
                    </div>
                  ))}
                  {songs.length === 0 && <p className="py-2 text-sm text-slate-500">Aún no hay canciones en el ranking.</p>}
                </div>
              </div>
            </SectionShell>
          )}

          {section === 'dedications' && <SectionShell key="dedications" title={settings.privateDedicationsMode ? 'Mensaje privado' : 'Mensajes para la fiesta'} text={settings.privateDedicationsMode ? 'Solo el equipo organizador podrá leerlo.' : 'Dejá un texto o una nota de voz.'}><form onSubmit={submitDedication} className="space-y-3"><Textarea value={dedicationDraft} onChange={(change) => setDedicationDraft(change.target.value)} maxLength={1000} placeholder="Escribí tu mensaje" className="min-h-28 bg-white text-slate-950" /><div className="flex flex-wrap items-center gap-2">{recording ? <Button type="button" variant="destructive" onClick={stopRecording}><Square className="mr-2 h-4 w-4 fill-current" />Detener {recordingSeconds}s</Button> : <Button type="button" variant="outline" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Grabar voz</Button>}{audioPreview && <><audio src={audioPreview} controls className="h-10 max-w-full" /><button type="button" onClick={clearAudio} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100" aria-label="Quitar audio"><X className="h-4 w-4" /></button></>}<Button type="submit" disabled={(!dedicationDraft.trim() && !audioBlob) || submitting} className="ml-auto" style={{ backgroundColor: accentColor }}><Send className="mr-2 h-4 w-4" />Enviar</Button></div></form>{!settings.privateDedicationsMode && <div className="mt-6 space-y-3">{dedications.slice().reverse().map((dedication) => <article key={dedication.id} className="border-t border-slate-100 pt-4"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-black">{initials(dedication.authorName)}</div><div><p className="text-sm font-bold">{dedication.authorName}</p><p className="text-xs text-slate-500">{formatDistanceToNow(new Date(dedication.timestamp), { addSuffix: true, locale: es })}</p></div></div><p className="mt-3 text-sm leading-relaxed text-slate-700">{dedication.message}</p>{dedication.audioUrl && <audio src={dedication.audioUrl} controls className="mt-3 h-10 w-full" />}</article>)}{dedications.length === 0 && <EmptyState icon={Heart} title="Todavía no hay mensajes" text="Dejá el primero para los protagonistas." hint="Podés escribirlo o grabarlo con tu voz." />}</div>}</SectionShell>}

          {section === 'chat' && <SectionShell key="chat" title="Chat en vivo" text="Mensajes cortos para compartir durante la fiesta."><div className="max-h-[55vh] min-h-72 space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3">{messages.map((message) => { const own = message.authorName === authorName; return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${own ? 'text-white' : 'bg-white text-slate-800 shadow-sm'}`} style={own ? { backgroundColor: accentColor } : undefined}><p className={`text-[10px] font-bold ${own ? 'text-white/75' : 'text-slate-500'}`}>{message.authorName}</p><p className="break-words">{message.text}</p></div></div>; })}{messages.length === 0 && <EmptyState icon={MessageCircle} title="El chat está vacío" text="Mandá el primer saludo y arrancá la conversación de la fiesta." />}</div><form onSubmit={submitChat} className="mt-3 flex gap-2"><Input value={chatDraft} onChange={(change) => setChatDraft(change.target.value)} maxLength={500} disabled={!canParticipate} placeholder={canParticipate ? 'Escribí un mensaje' : 'Abrí tu enlace personal para participar'} className="h-12 bg-white text-slate-950" /><Button type="submit" disabled={!canParticipate || !chatDraft.trim() || submitting} className="h-12" style={{ backgroundColor: accentColor }}><Send className="h-5 w-5" /></Button></form></SectionShell>}

          {section === 'poll' && <SectionShell key="poll" title={poll?.question || 'Encuesta'} text="Elegí una opción. Cada invitado puede votar una vez.">{poll ? <VoteOptions options={poll.options} voted={votedPollId === poll.id} accentColor={accentColor} onVote={submitPollVote} /> : <EmptyState icon={BarChart3} title="No hay encuesta activa" text="Cuando el equipo publique una, aparecerá acá." />}</SectionShell>}

          {section === 'game' && activeGame?.type === 'trivia' && (
             <TriviaGameScreen
               fiestaId={fiestaId}
               guestName={authorName || 'Invitado'}
               guestId={guestId}
               guestAccessToken={guestAccessToken}
             />
          )}

          {section === 'game' && activeGame?.type !== 'trivia' && (
             <SectionShell key="game" title={activeGame?.title || 'Juego'} text={activeGame?.subtitle || 'Participá desde tu celular.'}>
               {activeGame?.options?.length ? <VoteOptions options={activeGame.options.map((option) => ({ ...option, votes: option.votes || 0 }))} voted={votedGameId === activeGame.launchedAt} accentColor={accentColor} onVote={submitGameVote} /> : <EmptyState icon={Gamepad2} title="Esperando el próximo desafío" text="Mirá la pantalla principal y seguí las indicaciones." />}
             </SectionShell>
          )}

          {section === 'missions' && (
             <PhotoMissionScreen
               fiestaId={fiestaId}
               guestName={authorName || 'Invitado'}
             />
          )}

          {section === 'schedule' && (
            <SectionShell key="schedule" title="Cronograma de la Fiesta" text="Enterate de los momentos principales y qué viene ahora.">
              {event?.programa && event.programa.length > 0 ? (
                <div className="space-y-3">
                  {event.programa.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 font-mono text-xs font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.hora || `${21 + idx}:00`}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{item.titulo || item.descripcion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="Cronograma libre"
                  text="La fiesta fluye sin horarios rígidos. ¡A disfrutar la pista!"
                />
              )}
            </SectionShell>
          )}

          {section === 'ranking' && (
            <SectionShell key="ranking" title="Ranking de la Fiesta" text="Los momentos más destacados y los invitados más activos.">
              <div className="space-y-6">
                {/* 1. Foto más querida */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-current" />
                    <h3 className="text-sm font-black uppercase text-slate-800">Foto más querida de la noche</h3>
                  </div>
                  {(() => {
                    const topPost = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
                    if (!topPost || !topPost.likes) {
                      return <p className="text-xs text-slate-500">Todavía no hay votos. ¡Dales me gusta a tus fotos favoritas!</p>;
                    }
                    return (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={topPost.imageUrl} alt="Top foto" className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{topPost.authorName || 'Invitado'}</p>
                          <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                            <Heart className="w-3.5 h-3.5 fill-current" /> {topPost.likes} Me gusta
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Más fotos compartidas */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-black uppercase text-slate-800">Paparazzi de la fiesta (más fotos)</h3>
                  </div>
                  {(() => {
                    const authorCounts = posts.reduce((acc, p) => {
                      const name = p.authorName || 'Anónimo';
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const topAuthors = Object.entries(authorCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
                    if (topAuthors.length === 0) {
                      return <p className="text-xs text-slate-500">Todavía no hay fotos en el muro.</p>;
                    }
                    return (
                      <div className="space-y-2">
                        {topAuthors.map(([name, count], index) => (
                          <div key={name} className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-bold text-slate-900">{name}</span>
                            </div>
                            <span className="font-semibold text-slate-600">{count} fotos</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </SectionShell>
          )}

          <div className="py-8 text-center">
            <a
              href={appendCommercialAttribution('/simulador-de-presupuesto', {
                source: 'guest_portal',
                campaign: 'muro_social',
                refFiestaId: fiestaId,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              <span>¿Te toca festejar el año que viene? Mirá cuánto sale tu fiesta</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        {/* ── BARRA DE REACCIONES EN VIVO A LA PANTALLA GIGANTE (Bloque 3) ── */}
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 bg-slate-950/90 border border-white/20 p-1.5 rounded-full shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={async () => {
              try {
                const { sendPublicReaction } = await import('@/app/actions/social-interactive');
                await sendPublicReaction(fiestaId, 'aplausos');
                toast({ title: '👏 ¡Aplausos enviados a la pantalla gigante!', duration: 1200 });
              } catch {}
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-125 flex items-center justify-center text-lg transition"
            title="Enviar aplausos"
          >
            👏
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const { sendPublicReaction } = await import('@/app/actions/social-interactive');
                await sendPublicReaction(fiestaId, 'corazon');
                toast({ title: '❤️ ¡Corazón enviado a la pantalla gigante!', duration: 1200 });
              } catch {}
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-125 flex items-center justify-center text-lg transition"
            title="Enviar corazón"
          >
            ❤️
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                const { sendPublicReaction } = await import('@/app/actions/social-interactive');
                await sendPublicReaction(fiestaId, 'fuego');
                toast({ title: '🔥 ¡Fuego enviado a la pantalla gigante!', duration: 1200 });
              } catch {}
            }}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 active:scale-125 flex items-center justify-center text-lg transition"
            title="Enviar fuego"
          >
            🔥
          </button>
        </div>
      </main>
    </div>
  );
}

function SectionShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <section className="border-y border-slate-200 bg-white p-5 sm:rounded-md sm:border sm:p-6"><h2 className="text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 mb-5 text-sm text-slate-500">{text}</p>{children}</section>;
}

// El modelo es la pantalla vacia de la galeria, que quedo bien: dibujo grande,
// frase clara, boton que lleva a la accion y una linea de ayuda abajo. Una
// pantalla vacia que solo avisa que no hay nada es media ayuda.
function EmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  onAction,
  hint,
}: {
  icon: typeof Camera;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  hint?: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-slate-50">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <p className="mt-4 text-lg font-black text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">{text}</p>
      {actionLabel && onAction && (
        <Button type="button" onClick={onAction} className="mt-6 h-12 px-7 font-bold">
          {actionLabel}
        </Button>
      )}
      {hint && <p className="mt-3 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function VoteOptions({ options, voted, accentColor, onVote }: { options: Array<{ id: string; text: string; votes: number }>; voted: boolean; accentColor: string; onVote: (id: string) => Promise<void> }) {
  const total = options.reduce((sum, option) => sum + (option.votes || 0), 0);
  return <div className="space-y-3">{options.map((option) => { const percentage = total ? Math.round(((option.votes || 0) / total) * 100) : 0; return voted ? <div key={option.id}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-slate-700">{option.text}</span><span className="font-black" style={{ color: accentColor }}>{percentage}%</span></div><div className="h-3 overflow-hidden rounded-md bg-slate-100"><div className="h-full rounded-md" style={{ width: `${percentage}%`, backgroundColor: accentColor }} /></div></div> : <button key={option.id} type="button" onClick={() => void onVote(option.id)} className="min-h-14 w-full rounded-md border border-slate-200 bg-white px-4 text-left font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">{option.text}</button>; })}{voted && <p className="pt-2 text-center text-sm font-semibold text-slate-500">Tu voto quedó registrado.</p>}</div>;
}
