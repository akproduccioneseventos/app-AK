'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
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
} from 'lucide-react';
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
} from '@/app/actions/social-interactive';
import { voteActiveGameOption } from '@/app/actions/fiesta/screen-mode.actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { isEventInActiveWindow } from '@/lib/experience-ak/post-event-utils';
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

type SocialSection = 'feed' | 'songs' | 'dedications' | 'chat' | 'poll' | 'game';

const DEFAULT_SETTINGS: SocialGallerySettings = {
  enabled: true,
  allowLikes: true,
  allowComments: true,
  uploadsActive: true,
  chatEnabled: true,
  showSongRequests: true,
  showDedications: true,
  showPolls: true,
  requireApproval: false,
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

  return (
    <article className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-md sm:border">
      <header className="flex items-center gap-3 px-4 py-3">
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
        <div className="grid grid-cols-2 border-b border-slate-100 py-1">
          <button
            type="button"
            onClick={onLike}
            disabled={!allowLikes || liked}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-bold transition hover:bg-slate-100 disabled:cursor-default"
            style={liked ? { color: accentColor } : { color: '#475569' }}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Te gusta' : 'Me gusta'}
          </button>
          <button
            type="button"
            onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}
            disabled={!allowComments}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <MessageCircle className="h-5 w-5" /> Comentar
          </button>
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
                className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
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
  const fiestaId = params.fiestaId;
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
  const [authorName, setAuthorName] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
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

  const settings = useMemo(() => mergeSettings(event?.socialGallerySettings), [event?.socialGallerySettings]);
  const accentColor = settings.accentColor || '#c81e2a';
  const eventName = settings.title || event?.configuracion.nombreEvento || 'Red social del evento';
  const activeGame = settings.activeGame;

  const loadCore = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    const [eventResult, postsResult, pollResult] = await Promise.allSettled([
      getPublicSocialEvent(fiestaId),
      getPublicSocialPosts(fiestaId),
      getActivePoll(fiestaId),
    ]);
    if (eventResult.status === 'fulfilled') setEvent(eventResult.value);
    if (postsResult.status === 'fulfilled') setPosts(postsResult.value);
    if (pollResult.status === 'fulfilled') setPoll(pollResult.value);
    if (showLoader) setRefreshing(false);
  }, [fiestaId]);

  const loadSection = useCallback(async (target: SocialSection) => {
    if (target === 'songs') setSongs(await getSongRequests(fiestaId));
    if (target === 'dedications') setDedications(await getPublicDedications(fiestaId));
    if (target === 'chat') setMessages(await getChatMessages(fiestaId));
    if (target === 'poll') setPoll(await getActivePoll(fiestaId));
  }, [fiestaId]);

  useEffect(() => {
    const savedName = sessionStorage.getItem(`socialWallAuthor_${fiestaId}`) || '';
    setAuthorName(savedName);
    setNameDraft(savedName);
    setNameDialogOpen(!savedName);
    try {
      setLikedPosts(new Set(JSON.parse(sessionStorage.getItem(`likedPosts_${fiestaId}`) || '[]')));
    } catch {
      setLikedPosts(new Set());
    }
    setVotedPollId(localStorage.getItem(`votedPoll_${fiestaId}`));
    setVotedGameId(localStorage.getItem(`votedGame_${fiestaId}`));
    const requestedSection = new URLSearchParams(window.location.search).get('section');
    if (requestedSection && ['feed', 'songs', 'dedications', 'chat', 'poll', 'game'].includes(requestedSection)) {
      setSection(requestedSection as SocialSection);
    }
  }, [fiestaId]);

  useEffect(() => {
    let active = true;
    const refreshPublicData = async (isInitialLoad = false) => {
      if ((!isInitialLoad && document.visibilityState !== 'visible') || pollingRef.current) return;
      pollingRef.current = true;

      const loadTask = withPublicRequestTimeout((async () => {
        await Promise.all([loadCore(), loadSection(section)]);
        if (isInitialLoad) {
          const items = await getPublicDedications(fiestaId);
          if (active) setDedications(items);
        }
      })())
        .catch((error) => {
          console.warn('[SocialEvent] public data refresh failed:', error);
        })
        .finally(() => {
          pollingRef.current = false;
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

  const availableSections = useMemo(() => [
    { id: 'feed' as const, label: 'Inicio', icon: MessageCircle },
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

  const selectUpload = (change: ChangeEvent<HTMLInputElement>) => {
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
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const clearUpload = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadCaption('');
  };

  const submitUpload = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    if (!uploadFile || uploading) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('file', uploadFile);
    formData.append('authorName', authorName || 'Invitado');
    formData.append('dedication', uploadCaption.trim());
    if (uploadFile.type.startsWith('image/') && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', await uploadFile.arrayBuffer());
      formData.append('imageHash', Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join(''));
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
    setUploading(false);
  };

  const likePost = async (postId: string) => {
    if (likedPosts.has(postId) || settings.allowLikes === false) return;
    const next = new Set(likedPosts).add(postId);
    setLikedPosts(next);
    sessionStorage.setItem(`likedPosts_${fiestaId}`, JSON.stringify([...next]));
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post));
    const result = await addLikeToPost(postId);
    if (!result.success) {
      next.delete(postId);
      setLikedPosts(new Set(next));
      sessionStorage.setItem(`likedPosts_${fiestaId}`, JSON.stringify([...next]));
      await loadCore();
    }
  };

  const commentPost = async (postId: string, text: string) => {
    const result = await addCommentToPost(postId, text, authorName || 'Invitado');
    if (!result.success) toast({ title: 'No se pudo comentar', description: result.error, variant: 'destructive' });
    await loadCore();
  };

  const submitSong = async (eventForm: FormEvent) => {
    eventForm.preventDefault();
    if (!songDraft.trim() || submitting) return;
    setSubmitting(true);
    const result = await addSongRequest(fiestaId, songDraft.trim(), authorName || 'Invitado');
    if (result.success) {
      setSongDraft('');
      toast({ title: 'Canción enviada al DJ' });
      await loadSection('songs');
    } else toast({ title: 'No se pudo enviar', description: result.error, variant: 'destructive' });
    setSubmitting(false);
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
    const result = await addChatMessage(fiestaId, text, authorName || 'Invitado');
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
    return <main className="grid min-h-screen place-items-center bg-slate-100"><Loader2 className="h-9 w-9 animate-spin text-red-700" /></main>;
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
              <section className="border-y border-slate-200 bg-white p-4 sm:rounded-md sm:border">
                <div className="flex items-center gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-black text-white" style={{ backgroundColor: accentColor }}>{initials(authorName)}</div><button type="button" onClick={() => setUploadOpen(true)} disabled={!settings.uploadsActive} className="min-h-11 flex-1 rounded-md bg-slate-100 px-4 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50">{settings.uploadsActive ? '¿Qué querés compartir?' : 'Las publicaciones están pausadas'}</button></div>
                <div className="mt-3 grid grid-cols-2 border-t border-slate-100 pt-2"><button type="button" onClick={() => setUploadOpen(true)} disabled={!settings.uploadsActive} className="flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100"><Camera className="h-5 w-5 text-emerald-600" />Foto</button><button type="button" onClick={() => setUploadOpen(true)} disabled={!settings.uploadsActive} className="flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-bold text-slate-600 hover:bg-slate-100"><Video className="h-5 w-5 text-red-600" />Video</button></div>
              </section>
              {posts.length ? posts.map((post) => <FeedPost key={post.id} post={post} authorName={authorName} accentColor={accentColor} allowLikes={settings.allowLikes !== false} allowComments={settings.allowComments !== false} liked={likedPosts.has(post.id)} onLike={() => void likePost(post.id)} onComment={(text) => commentPost(post.id, text)} />) : <EmptyState icon={Camera} title="Todavía no hay publicaciones" text="Sé la primera persona en compartir un momento." />}
            </div>
          )}

          {section === 'songs' && <SectionShell key="songs" title="Pedí una canción" text="Tu pedido entra en la lista que revisa el DJ."><form onSubmit={submitSong} className="flex gap-2"><Input value={songDraft} onChange={(change) => setSongDraft(change.target.value)} maxLength={120} placeholder="Canción y artista" className="h-12 bg-white text-slate-950" /><Button type="submit" disabled={!songDraft.trim() || submitting} className="h-12 px-4" style={{ backgroundColor: accentColor }}><Send className="h-5 w-5" /></Button></form><div className="divide-y divide-slate-100">{songs.map((song, index) => <div key={song.id} className="flex items-center gap-3 py-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black">{index + 1}</span><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{song.song}</p><p className="text-xs text-slate-500">Pedido por {song.requestedBy}</p></div>{song.played && <span className="flex items-center gap-1 text-xs font-bold text-emerald-700"><Play className="h-3 w-3 fill-current" /> Sonó</span>}</div>)}{songs.length === 0 && <EmptyState icon={Music2} title="Sin pedidos todavía" text="Pedí la primera canción de la fiesta." />}</div></SectionShell>}

          {section === 'dedications' && <SectionShell key="dedications" title={settings.privateDedicationsMode ? 'Mensaje privado' : 'Mensajes para la fiesta'} text={settings.privateDedicationsMode ? 'Solo el equipo organizador podrá leerlo.' : 'Dejá un texto o una nota de voz.'}><form onSubmit={submitDedication} className="space-y-3"><Textarea value={dedicationDraft} onChange={(change) => setDedicationDraft(change.target.value)} maxLength={1000} placeholder="Escribí tu mensaje" className="min-h-28 bg-white text-slate-950" /><div className="flex flex-wrap items-center gap-2">{recording ? <Button type="button" variant="destructive" onClick={stopRecording}><Square className="mr-2 h-4 w-4 fill-current" />Detener {recordingSeconds}s</Button> : <Button type="button" variant="outline" onClick={startRecording}><Mic className="mr-2 h-4 w-4" />Grabar voz</Button>}{audioPreview && <><audio src={audioPreview} controls className="h-10 max-w-full" /><button type="button" onClick={clearAudio} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100" aria-label="Quitar audio"><X className="h-4 w-4" /></button></>}<Button type="submit" disabled={(!dedicationDraft.trim() && !audioBlob) || submitting} className="ml-auto" style={{ backgroundColor: accentColor }}><Send className="mr-2 h-4 w-4" />Enviar</Button></div></form>{!settings.privateDedicationsMode && <div className="mt-6 space-y-3">{dedications.slice().reverse().map((dedication) => <article key={dedication.id} className="border-t border-slate-100 pt-4"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-xs font-black">{initials(dedication.authorName)}</div><div><p className="text-sm font-bold">{dedication.authorName}</p><p className="text-xs text-slate-500">{formatDistanceToNow(new Date(dedication.timestamp), { addSuffix: true, locale: es })}</p></div></div><p className="mt-3 text-sm leading-relaxed text-slate-700">{dedication.message}</p>{dedication.audioUrl && <audio src={dedication.audioUrl} controls className="mt-3 h-10 w-full" />}</article>)}{dedications.length === 0 && <EmptyState icon={Heart} title="Todavía no hay mensajes" text="Dejá el primero para los protagonistas." />}</div>}</SectionShell>}

          {section === 'chat' && <SectionShell key="chat" title="Chat en vivo" text="Mensajes cortos para compartir durante la fiesta."><div className="max-h-[55vh] min-h-72 space-y-3 overflow-y-auto rounded-md bg-slate-50 p-3">{messages.map((message) => { const own = message.authorName === authorName; return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${own ? 'text-white' : 'bg-white text-slate-800 shadow-sm'}`} style={own ? { backgroundColor: accentColor } : undefined}><p className={`text-[10px] font-bold ${own ? 'text-white/75' : 'text-slate-500'}`}>{message.authorName}</p><p className="break-words">{message.text}</p></div></div>; })}{messages.length === 0 && <EmptyState icon={MessageCircle} title="El chat está vacío" text="Mandá el primer saludo." />}</div><form onSubmit={submitChat} className="mt-3 flex gap-2"><Input value={chatDraft} onChange={(change) => setChatDraft(change.target.value)} maxLength={500} placeholder="Escribí un mensaje" className="h-12 bg-white text-slate-950" /><Button type="submit" disabled={!chatDraft.trim() || submitting} className="h-12" style={{ backgroundColor: accentColor }}><Send className="h-5 w-5" /></Button></form></SectionShell>}

          {section === 'poll' && <SectionShell key="poll" title={poll?.question || 'Encuesta'} text="Elegí una opción. Cada invitado puede votar una vez.">{poll ? <VoteOptions options={poll.options} voted={votedPollId === poll.id} accentColor={accentColor} onVote={submitPollVote} /> : <EmptyState icon={BarChart3} title="No hay encuesta activa" text="Cuando el equipo publique una, aparecerá acá." />}</SectionShell>}

          {section === 'game' && <SectionShell key="game" title={activeGame?.title || 'Juego'} text={activeGame?.subtitle || 'Participá desde tu celular.'}>{activeGame?.options?.length ? <VoteOptions options={activeGame.options.map((option) => ({ ...option, votes: option.votes || 0 }))} voted={votedGameId === activeGame.launchedAt} accentColor={accentColor} onVote={submitGameVote} /> : <EmptyState icon={Gamepad2} title="Esperando el próximo desafío" text="Mirá la pantalla principal y seguí las indicaciones." />}</SectionShell>}
        </div>
      </main>
    </div>
  );
}

function SectionShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <section className="border-y border-slate-200 bg-white p-5 sm:rounded-md sm:border sm:p-6"><h2 className="text-2xl font-black text-slate-950">{title}</h2><p className="mt-1 mb-5 text-sm text-slate-500">{text}</p>{children}</section>;
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Camera; title: string; text: string }) {
  return <div className="px-5 py-14 text-center"><Icon className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>;
}

function VoteOptions({ options, voted, accentColor, onVote }: { options: Array<{ id: string; text: string; votes: number }>; voted: boolean; accentColor: string; onVote: (id: string) => Promise<void> }) {
  const total = options.reduce((sum, option) => sum + (option.votes || 0), 0);
  return <div className="space-y-3">{options.map((option) => { const percentage = total ? Math.round(((option.votes || 0) / total) * 100) : 0; return voted ? <div key={option.id}><div className="mb-1 flex justify-between text-sm"><span className="font-semibold text-slate-700">{option.text}</span><span className="font-black" style={{ color: accentColor }}>{percentage}%</span></div><div className="h-3 overflow-hidden rounded-md bg-slate-100"><div className="h-full rounded-md" style={{ width: `${percentage}%`, backgroundColor: accentColor }} /></div></div> : <button key={option.id} type="button" onClick={() => void onVote(option.id)} className="min-h-14 w-full rounded-md border border-slate-200 bg-white px-4 text-left font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">{option.text}</button>; })}{voted && <p className="pt-2 text-center text-sm font-semibold text-slate-500">Tu voto quedó registrado.</p>}</div>;
}
