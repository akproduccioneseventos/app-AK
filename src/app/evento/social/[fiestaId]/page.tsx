'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef, type ChangeEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSocialPosts, uploadSocialPost, addLikeToPost, addCommentToPost, deleteSocialPost, clearGallery, getChatMessages, addChatMessage, highlightComment } from '@/app/actions/social-gallery';
import { addDedication, addSongRequest, getDedications, getSongRequests, getActivePoll, createPoll, votePoll, closePoll, highlightDedication } from '@/app/actions/social-interactive';
import { voteActiveGameOption, trackSocialFollowClick } from '@/app/actions/fiesta/screen-mode.actions';
import type { SocialGalleryPost, SocialComment, ChatMessage, SocialPoll } from '@/types/social-gallery';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { motion, AnimatePresence } from 'framer-motion';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import NextImage from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Heart, MessageCircle, Send, Upload, RefreshCw, PartyPopper, MonitorPlay, X, Trash2, Download, Share2, User as UserIcon, MessageSquare, Settings2, CheckCircle2, Save, Camera as CameraIcon, Music, MicVocal, Star, PlusCircle, MinusCircle, PlayCircle, ArrowLeft, Gamepad2, LayoutGrid, BarChart2, Ghost } from 'lucide-react';
import { WatermarkedImage } from '@/components/watermarked-image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShareLinkDialog } from '@/components/dashboard/ShareLinkDialog';
import QRCodeStylized from 'qrcode.react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { getSocialConnections } from '@/app/actions/social-connections';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Dedication, SongRequest } from '@/types/social-gallery';

const MAX_DISPLAYED_SONG_REQUESTS = 12;

/** Large touchable feature card shown on the guest home screen. */
const GuestFeatureButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  onClick: () => void;
  primary?: boolean;
  wide?: boolean;
  pulse?: boolean;
}> = ({ icon, label, sublabel, color, onClick, primary, wide, pulse }) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={cn(
      'relative flex flex-col items-center justify-center gap-2 p-5 rounded-3xl shadow-md transition-all text-center focus:outline-none select-none',
      wide ? 'col-span-2' : '',
      primary
        ? 'text-white shadow-xl'
        : 'bg-white text-slate-700 border border-slate-100 hover:bg-slate-50',
    )}
    style={primary ? { backgroundColor: color, boxShadow: `0 8px 24px ${color}40` } : {}}
  >
    {pulse && (
      <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ backgroundColor: primary ? 'rgba(255,255,255,0.8)' : color }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: primary ? 'white' : color }}
        />
      </span>
    )}
    <div style={!primary ? { color } : {}}>{icon}</div>
    <div>
      <p className="font-black text-sm leading-tight">{label}</p>
      {sublabel && (
        <p className={cn('text-[11px] mt-0.5 leading-tight', primary ? 'text-white/70' : 'text-slate-400')}>
          {sublabel}
        </p>
      )}
    </div>
  </motion.button>
);

const PostCard: React.FC<{ 
  post: SocialGalleryPost; 
  onLike: (postId: string) => void; 
  onComment: (postId: string, text: string) => Promise<void>; 
  onDelete?: (postId: string) => void;
  onHighlightComment?: (postId: string, commentId: string, highlighted: boolean) => Promise<void>;
  isAdminView: boolean;
  authorName: string;
  accentColor: string;
  allowLikes: boolean;
  allowComments: boolean;
}> = ({ post, onLike, onComment, onDelete, onHighlightComment, isAdminView, authorName, accentColor, allowLikes, allowComments }) => {
  const [commentText, setCommentText] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const heartIdRef = useRef(0);
  
  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onComment(post.id, commentText);
    setCommentText('');
  };

  const handleLikeClick = () => {
    if (!allowLikes) return;
    // Spawn 3-5 floating hearts
    const count = 3 + Math.floor(Math.random() * 3);
    const newHearts = Array.from({ length: count }, () => ({
      id: ++heartIdRef.current,
      x: -20 + Math.random() * 40,
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 1200);
    onLike(post.id);
  };

  const formattedTimestamp = formatDistanceToNow(new Date(post.timestamp), {
    addSuffix: true,
    locale: es,
  });

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <Card className="shadow-xl border-none overflow-hidden flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl group transition-all hover:translate-y-[-4px]">
        <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner" style={{ backgroundColor: accentColor }}>
                {post.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="font-bold text-sm text-slate-800">{post.authorName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{formattedTimestamp}</p>
            </div>
            </div>
            {isAdminView && onDelete && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive"><Trash2 className="w-4 h-4"/></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle><AlertDialogDescription>Se eliminará esta foto. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            )}
        </CardHeader>
        <CardContent className="p-0 flex-grow">
            <WatermarkedImage containerClassName="aspect-square relative bg-slate-100" src={post.imageUrl} alt={`Foto de ${post.authorName}`} layout="fill" objectFit="cover" data-ai-hint="event photo" />
        </CardContent>
        <CardFooter className="p-4 flex flex-col items-start gap-3">
            <div className="w-full flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                      <button onClick={handleLikeClick} disabled={!allowLikes} className="flex items-center gap-1.5 group/like outline-none disabled:opacity-50 disabled:cursor-not-allowed">
                          <Heart className={`w-6 h-6 transition-all ${post.likes > 0 ? 'text-red-500 fill-current scale-110' : 'text-slate-400 group-hover/like:text-red-400'}`} />
                          <span className="text-sm font-bold text-slate-600">{post.likes}</span>
                      </button>
                      {/* Floating hearts */}
                      <AnimatePresence>
                        {floatingHearts.map(heart => (
                          <motion.div
                            key={heart.id}
                            className="absolute pointer-events-none text-red-500 text-lg select-none"
                            style={{ bottom: '100%', left: `calc(50% + ${heart.x}px)`, translateX: '-50%' }}
                            initial={{ opacity: 1, y: 0, scale: 0.8 }}
                            animate={{ opacity: 0, y: -50, scale: 1.4 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.0, ease: 'easeOut' }}
                          >
                            ❤️
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm font-bold text-slate-600">{post.comments.length}</span>
                    </div>
                </div>
            </div>
            {allowComments && (
            <div className="w-full pt-3 border-t border-slate-100 space-y-3">
                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 text-sm scrollbar-hide">
                    {post.comments.length > 0 ? post.comments.map(c => (
                        <div key={c.id} className={cn("flex items-start gap-1.5 rounded-xl border p-2.5", c.highlighted ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-100/50")}>
                            <div className="flex-1 min-w-0">
                                <span className="font-black text-slate-700 text-xs mr-1">{c.authorName}:</span> 
                                <span className="text-slate-600 leading-relaxed">{c.text}</span>
                            </div>
                            {isAdminView && onHighlightComment && (
                                <button
                                    onClick={() => onHighlightComment(post.id, c.id, !c.highlighted)}
                                    className={cn("flex-shrink-0 p-1 rounded-lg transition-colors", c.highlighted ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-amber-400")}
                                    title={c.highlighted ? 'Quitar destacado' : 'Destacar comentario'}
                                >
                                    <Star className="w-3.5 h-3.5" fill={c.highlighted ? 'currentColor' : 'none'} />
                                </button>
                            )}
                        </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-2 italic">Sin comentarios aún...</p>}
                </div>
                <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                    <Input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escribe un comentario... 💬❤️😊" className="h-10 text-xs rounded-xl bg-slate-50 border-none focus-visible:ring-1" style={{ '--tw-ring-color': accentColor } as any}/>
                    <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0 rounded-xl shadow-md transition-transform active:scale-95" disabled={!commentText.trim()} style={{ backgroundColor: accentColor }}>
                        <Send className="w-4 h-4"/>
                    </Button>
                </form>
            </div>
            )}
        </CardFooter>
        </Card>
    </motion.div>
  );
};


export default function SocialGalleryPage({ params }: { params: { fiestaId: string } }) {
  const { toast } = useToast();
  
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequest[]>([]);
  const [dedications, setDedications] = useState<Dedication[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [newSongRequest, setNewSongRequest] = useState('');
  const [newDedication, setNewDedication] = useState('');

  // Poll state
  const [activePoll, setActivePoll] = useState<SocialPoll | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedPollId, setVotedPollId] = useState<string | null>(null);

  // Restore hasVoted/votedPollId from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(`votedPoll_${params.fiestaId}`);
    if (stored) {
      setHasVoted(true);
      setVotedPollId(stored);
    }
  }, [params.fiestaId]);
  
  const [authorName, setAuthorName] = useState('');
  const [tempAuthorName, setTempAuthorName] = useState('');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [isAdminView, setIsAdminView] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDownloadingAndClearing, setIsDownloadingAndClearing] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [instagramUrl, setInstagramUrl] = useState<string | null>(null);
  const [facebookUrl, setFacebookUrl] = useState<string | null>(null);
  /** Platform keys the guest has already clicked "follow" on (stored in sessionStorage) */
  const [followedPlatforms, setFollowedPlatforms] = useState<Set<string>>(new Set());

  // Custom Settings State (for Admin)
  const [localSettings, setLocalSettings] = useState<SocialGallerySettings>({
      enabled: true,
      allowLikes: true,
      allowComments: true,
      uploadsActive: true,
      backgroundColor: '#f1f5f9',
      accentColor: '#3b82f6',
      chatEnabled: true,
      showSongRequests: true,
      showDedications: true,
      title: '',
      subtitle: '',
      maxPhotos: 200
  });


  // Dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  
  // Projection mode state
  const [projectionMode, setProjectionMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Controls which section the guest is viewing (null = home button grid)
  const [guestSection, setGuestSection] = useState<'photos' | 'song' | 'dedication' | 'chat' | 'poll' | 'game' | null>(null);


  const fetchData = useCallback(async (showLoadingIndicator = true) => {
    if(showLoadingIndicator) setIsLoading(true);
    try {
      const [fetchedPosts, fiestaData, fetchedChat, settingsData, socialConnections, fetchedSongRequests, fetchedDedications, poll] = await Promise.all([
          getSocialPosts(params.fiestaId),
          getFiestaById(params.fiestaId),
          getChatMessages(params.fiestaId),
          getInvoiceTemplateSettings(),
          getSocialConnections(),
          getSongRequests(params.fiestaId),
          getDedications(params.fiestaId),
          getActivePoll(params.fiestaId),
      ]);
      setPosts(fetchedPosts);
      setFiesta(fiestaData);
      if (fiestaData?.socialGallerySettings) {
          setLocalSettings(prev => ({ ...prev, ...fiestaData.socialGallerySettings }));
      }
      setChatMessages(fetchedChat);
      setSongRequests(fetchedSongRequests);
      setDedications(fetchedDedications);
      setActivePoll(poll);
      setCompanyLogoUrl(settingsData.logoUrl ?? null);
      setWhatsappNumber(socialConnections.find(c => c.platform === 'WhatsApp')?.phoneNumber || null);
      const igConn = socialConnections.find(c => c.platform === 'Instagram');
      const fbConn = socialConnections.find(c => c.platform === 'Facebook');
      // Use brand handle if set, otherwise fall back to company social connections
      const brandIg = fiestaData?.socialGallerySettings?.brand?.instagramHandle;
      const brandFb = fiestaData?.socialGallerySettings?.brand?.facebookHandle;
      setInstagramUrl(
        brandIg
          ? `https://instagram.com/${brandIg.replace(/^@/, '')}`
          : igConn?.profileUrl || null
      );
      setFacebookUrl(
        brandFb
          ? `https://facebook.com/${brandFb.replace(/^@/, '')}`
          : fbConn?.profileUrl || null
      );

    } catch (e) {
      toast({ title: "Error al cargar galería", variant: "destructive" });
    } finally {
      if(showLoadingIndicator) setIsLoading(false);
    }
  }, [params.fiestaId, toast]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const sessionAuth = sessionStorage.getItem('ak_producciones_auth_session') === 'true';
        setIsAdminView(sessionAuth);
        
        if (sessionAuth) {
            setAuthorName("Organización");
        } else {
            const savedName = sessionStorage.getItem(`socialWallAuthor_${params.fiestaId}`);
            if (savedName) {
                setAuthorName(savedName);
            } else {
                setIsNameModalOpen(true);
            }
        }
        // Restore platforms the guest already followed
        const followedRaw = sessionStorage.getItem(`socialFollowed_${params.fiestaId}`);
        if (followedRaw) {
          try { setFollowedPlatforms(new Set(JSON.parse(followedRaw))); } catch {}
        }
    }
  }, [params.fiestaId]);


  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
        fetchData(false);
    }, 2000); 
    return () => clearInterval(interval);
  }, [fetchData]);
  
  useEffect(() => {
    if (projectionMode && posts.length > 0) {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % posts.length);
        }, 7000);
        return () => clearInterval(timer);
    }
  }, [projectionMode, posts.length]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);


  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
         toast({ title: "Archivo demasiado grande", description: "El tamaño máximo es 10MB.", variant: "destructive" });
         return;
      }
      setFileToUpload(file);
      setUploadPreview(URL.createObjectURL(file));
    }
  };

  /** Compute a SHA-256 hex digest of the file contents for duplicate detection. */
  const computeImageHash = async (file: File): Promise<string | null> => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return null;
    }
  };
  
  const handleSetAuthorName = (e: FormEvent) => {
    e.preventDefault();
    if(tempAuthorName.trim()) {
        setAuthorName(tempAuthorName);
        sessionStorage.setItem(`socialWallAuthor_${params.fiestaId}`, tempAuthorName);
        setIsNameModalOpen(false);
    }
  };

  const handleFollowClick = (platform: 'instagram' | 'facebook', url: string) => {
    // Open link in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
    // Track click server-side (fire-and-forget)
    if (authorName && authorName.toLowerCase() !== 'anónimo') {
      trackSocialFollowClick(params.fiestaId, authorName, platform).catch(() => {});
    }
    // Mark as followed in sessionStorage and local state
    setFollowedPlatforms(prev => {
      const next = new Set(prev);
      next.add(platform);
      sessionStorage.setItem(`socialFollowed_${params.fiestaId}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleUploadSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fileToUpload || !localSettings.uploadsActive) return;
    setIsUploading(true);

    try {
      // Compute image hash for duplicate detection
      const imageHash = await computeImageHash(fileToUpload);

      const formData = new FormData();
      formData.append('fiestaId', params.fiestaId);
      formData.append('file', fileToUpload);
      formData.append('authorName', authorName || 'Anónimo');
      if (imageHash) formData.append('imageHash', imageHash);

      const result = await uploadSocialPost(formData);
      if (result.success) {
        toast({ title: "¡Foto publicada!", description: "Tu momento ya está en el mural." });
        await fetchData(false);
        setIsUploadDialogOpen(false);
        setFileToUpload(null);
        setUploadPreview(null);
      } else {
        toast({ title: "Error al subir", description: result.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error al subir la foto", description: e.message || 'Ocurrió un error inesperado. Intentá de nuevo.', variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleLike = async (postId: string) => {
    if (!localSettings.allowLikes) return;
    const originalPosts = [...posts];
    setPosts(prev => prev.map(p => p.id === postId ? {...p, likes: (p.likes || 0) + 1} : p));
    try {
      const result = await addLikeToPost(postId);
      if (!result.success) {
        toast({title: "Error", description: "No se pudo registrar el 'Me Gusta'."});
        setPosts(originalPosts); // Revert on error
      }
    } catch {
      setPosts(originalPosts); // Revert on exception
    }
  };
  
  const handleComment = async (postId: string, text: string) => {
    if (!localSettings.allowComments) return;
    const result = await addCommentToPost(postId, text, authorName || 'Anónimo');
    if (!result.success) {
        toast({title: "Error", description: "No se pudo añadir el comentario."});
    }
    await fetchData(false);
  };

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    setIsSendingChat(true);
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      authorName: authorName || 'Anónimo',
      text: newChatMessage,
      timestamp: new Date().toISOString(),
      fiestaId: params.fiestaId
    };
    setChatMessages(prev => [...prev, optimisticMessage]);
    setNewChatMessage('');
    
    try {
      const result = await addChatMessage(params.fiestaId, newChatMessage, authorName || 'Anónimo');
      if (!result.success) {
        toast({ title: "Error", description: "No se pudo enviar tu mensaje.", variant: "destructive" });
        setChatMessages(prev => prev.filter(m => m.id !== optimisticMessage.id)); // Revert
      } else {
          await fetchData(false); // Sync with server state
      }
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleSongRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newSongRequest.trim()) return;
    try {
      const result = await addSongRequest(params.fiestaId, newSongRequest.trim(), authorName || 'Anónimo');
      if (result.success) {
        setNewSongRequest('');
        await fetchData(false);
        toast({ title: 'Pedido recibido 🎵' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar el pedido.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error al enviar pedido', variant: 'destructive' });
    }
  };

  const handleDedicationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDedication.trim()) return;
    try {
      const result = await addDedication(params.fiestaId, newDedication.trim(), authorName || 'Anónimo');
      if (result.success) {
        setNewDedication('');
        await fetchData(false);
        toast({ title: 'Dedicatoria enviada 💖' });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo guardar la dedicatoria.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error al enviar dedicatoria', variant: 'destructive' });
    }
  };


  const handleCreatePoll = async (e: FormEvent) => {
    e.preventDefault();
    const opts = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || opts.length < 2) return;
    setIsCreatingPoll(true);
    const filteredOptions = opts;
    const result = await createPoll(params.fiestaId, pollQuestion.trim(), filteredOptions);
    if (result.success) {
      setPollQuestion('');
      setPollOptions(['', '']);
      await fetchData(false);
      toast({ title: '¡Encuesta lanzada! 🎯' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsCreatingPoll(false);
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (hasVoted && votedPollId === pollId) return;
    const result = await votePoll(params.fiestaId, pollId, optionId);
    if (result.success) {
      setHasVoted(true);
      setVotedPollId(pollId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`votedPoll_${params.fiestaId}`, pollId);
      }
      await fetchData(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleClosePoll = async (pollId: string) => {
    const result = await closePoll(params.fiestaId, pollId);
    if (result.success) {
      await fetchData(false);
      toast({ title: 'Encuesta cerrada' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleHighlightDedication = async (dedId: string, currentHighlighted: boolean) => {
    const result = await highlightDedication(params.fiestaId, dedId, !currentHighlighted);
    if (result.success) {
      await fetchData(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleHighlightComment = async (postId: string, commentId: string, highlighted: boolean) => {
    const result = await highlightComment(postId, commentId, highlighted);
    if (result.success) {
      await fetchData(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (postId: string) => {
    await deleteSocialPost(postId);
    toast({ title: "Foto eliminada" });
    await fetchData(false);
  };

  const handleClearGallery = async () => {
    setIsClearing(true);
    await clearGallery(params.fiestaId);
    toast({ title: "Galería Limpiada", variant: "destructive" });
    await fetchData();
    setIsClearing(false);
  };

  const handleDownloadAndClear = async () => {
    setIsDownloadingAndClearing(true);
    try {
      const response = await fetch(`/api/social-gallery/${params.fiestaId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mural-social-${params.fiestaId}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
      await clearGallery(params.fiestaId);
      toast({ title: "ZIP descargado y galería limpiada", variant: "destructive" });
      await fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDownloadingAndClearing(false);
    }
  };

  const handleSaveSettings = async () => {
      if (!fiesta) return;
      setIsSavingSettings(true);
      try {
          const updatedFiesta = { ...fiesta, socialGallerySettings: localSettings };
          const result = await saveFiesta(updatedFiesta);
          if (result.success) {
              toast({ title: "Ajustes guardados" });
              setIsSettingsDialogOpen(false);
              await fetchData(false);
          } else throw new Error(result.error);
      } catch (e: any) {
          toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
          setIsSavingSettings(false);
      }
  };
  
  const handleDownloadChat = async () => {
    let content = `Historial del Chat - ${fiesta?.configuracion.nombreEvento || 'Evento'}\n`;
    content += `Generado el: ${new Date().toLocaleString('es-ES')}\n\n`;
    chatMessages.forEach(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString('es-ES');
      content += `[${timestamp}] ${msg.authorName}: ${msg.text}\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${params.fiestaId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const accentColor = localSettings.accentColor || '#3b82f6';
  const bgColor = localSettings.backgroundColor || '#f1f5f9';

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ backgroundColor: bgColor }}>
      {/* ── Name modal (shared) ──────────────────────────────────────── */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} hideCloseButton className="rounded-3xl border-none shadow-2xl">
            <DialogHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {localSettings.mobileControlCoverUrl ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden">
                        <NextImage src={localSettings.mobileControlCoverUrl} alt="Evento" fill className="object-cover" />
                      </div>
                    ) : (
                      <UserIcon className="w-8 h-8 text-primary"/>
                    )}
                </div>
                <DialogTitle className="text-2xl font-headline">¡Bienvenido/a!</DialogTitle>
                <DialogDescription className="text-base">
                  {localSettings.title || fiesta?.configuracion.nombreEvento
                    ? `Ingresá tu nombre para participar en ${localSettings.title || fiesta?.configuracion.nombreEvento}.`
                    : 'Dinos tu nombre para participar en el mural del evento.'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSetAuthorName} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="author-name-input" className="text-xs uppercase tracking-widest font-bold text-slate-400">Tu Nombre</Label>
                    <Input id="author-name-input" value={tempAuthorName} onChange={e => setTempAuthorName(e.target.value)} placeholder="Ej: Juan Pérez" className="h-12 rounded-xl text-lg bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary"/>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg" disabled={!tempAuthorName.trim()} style={{ backgroundColor: accentColor }}>Ingresar al Mural</Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 rounded-xl text-base font-semibold text-slate-500"
                      onClick={() => {
                        setAuthorName('Anónimo');
                        sessionStorage.setItem(`socialWallAuthor_${params.fiestaId}`, 'Anónimo');
                        setIsNameModalOpen(false);
                      }}
                    >
                      <Ghost className="w-4 h-4 mr-2" />
                      Participar como Anónimo
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          GUEST VIEW — clean button-grid interface
          Syncs automatically via the 5-second polling in fetchData().
          Buttons appear/disappear based on the organizer's settings.
      ════════════════════════════════════════════════════════════════ */}
      {!isAdminView && (
        <>
          {/* Upload dialog for guests (standalone, no trigger button needed here) */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogContent className="rounded-3xl border-none">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Publicar Momento</DialogTitle>
                <DialogDescription>Sube una foto para que todos la vean.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUploadSubmit} className="space-y-6 py-2">
                {uploadPreview ? (
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner border bg-slate-50">
                    <NextImage src={uploadPreview} alt="Vista previa" layout="fill" objectFit="contain" />
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => { setFileToUpload(null); setUploadPreview(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 transition-colors hover:bg-slate-100 hover:border-primary/30">
                    <Label htmlFor="file-upload-guest" className="cursor-pointer text-center text-slate-400 p-8 flex flex-col items-center gap-3">
                      <div className="p-4 bg-white rounded-2xl shadow-sm">
                        <Upload className="w-8 h-8 text-primary" style={{ color: accentColor }} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-600">Toca para seleccionar</p>
                        <p className="text-xs">JPG, PNG o GIF (Máx 10MB)</p>
                      </div>
                    </Label>
                    <Input id="file-upload-guest" type="file" onChange={handleFileSelect} className="hidden" accept="image/*" disabled={!localSettings.uploadsActive} />
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isUploading || !fileToUpload || !localSettings.uploadsActive} style={{ backgroundColor: accentColor }}>
                    {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    {isUploading ? 'Publicando...' : 'Publicar ahora'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="min-h-screen flex flex-col">
            {/* Cover photo splash (only on home screen when configured) */}
            {guestSection === null && localSettings.mobileControlCoverUrl && (
              <div className="relative w-full h-48 overflow-hidden">
                <NextImage
                  src={localSettings.mobileControlCoverUrl}
                  alt="Portada del evento"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-white font-black text-xl leading-tight drop-shadow-lg">
                    {localSettings.title || fiesta?.configuracion.nombreEvento}
                  </p>
                  {authorName && (
                    <p className="text-white/80 text-sm mt-0.5">Hola, {authorName} 👋</p>
                  )}
                </div>
              </div>
            )}
            {/* Guest header */}
            <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
              <div className="max-w-lg mx-auto h-16 px-4 flex items-center gap-3">
                {guestSection !== null ? (
                  <>
                    <button
                      onClick={() => setGuestSection(null)}
                      className="h-10 w-10 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
                      aria-label="Volver al inicio"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-base font-bold text-slate-800 flex-1 text-center pr-10">
                      {guestSection === 'photos' ? '📸 Fotos del evento' :
                       guestSection === 'song' ? '🎵 Pedir Canción' :
                       guestSection === 'dedication' ? '💖 Dedicatoria' :
                       guestSection === 'chat' ? '💬 Chat en Vivo' :
                       guestSection === 'poll' ? '📊 Encuesta' :
                       guestSection === 'game' ? `🎮 ${localSettings.activeGame?.title || 'Juego'}` : ''}
                    </h1>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {companyLogoUrl && (
                        <div className="relative h-9 w-20 overflow-hidden rounded-xl shrink-0">
                          <NextImage src={companyLogoUrl} alt="Logo" fill className="object-contain" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h1 className="text-base font-black text-slate-800 truncate leading-tight">
                          {localSettings.title || fiesta?.configuracion.nombreEvento || 'Evento'}
                        </h1>
                        <p className="text-[11px] text-slate-400 leading-tight">Hola, {authorName || '...'} 👋</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={isLoading} className="h-10 w-10 rounded-2xl shrink-0" aria-label="Actualizar">
                      <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </>
                )}
              </div>
            </header>

            {/* Guest main content */}
            <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-10">
              <AnimatePresence mode="wait">

                {/* ── Home: feature button grid ── */}
                {guestSection === null && (
                  <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center mb-5">¿Qué querés hacer?</p>
                    <div className="grid grid-cols-2 gap-3">

                      {localSettings.uploadsActive && (
                        <GuestFeatureButton
                          icon={<CameraIcon className="w-8 h-8" />}
                          label="Subir Foto"
                          sublabel={posts.length > 0 ? `${posts.length} en el mural` : 'Sé el primero'}
                          color={accentColor}
                          onClick={() => setIsUploadDialogOpen(true)}
                          primary
                        />
                      )}

                      {posts.length > 0 && (
                        <GuestFeatureButton
                          icon={<LayoutGrid className="w-8 h-8" />}
                          label="Ver Fotos"
                          sublabel={`${posts.length} foto${posts.length !== 1 ? 's' : ''}`}
                          color={accentColor}
                          onClick={() => setGuestSection('photos')}
                        />
                      )}

                      {localSettings.allowComments !== false && posts.length > 0 && (
                        <GuestFeatureButton
                          icon={<MessageCircle className="w-8 h-8" />}
                          label="Comentar"
                          sublabel="Fotos del evento"
                          color={accentColor}
                          onClick={() => setGuestSection('photos')}
                        />
                      )}

                      {localSettings.chatEnabled !== false && (
                        <GuestFeatureButton
                          icon={<MessageSquare className="w-8 h-8" />}
                          label="Chat en Vivo"
                          sublabel={chatMessages.length > 0 ? `${chatMessages.length} mensajes` : 'Chateá con todos'}
                          color={accentColor}
                          onClick={() => setGuestSection('chat')}
                        />
                      )}

                      {localSettings.showSongRequests !== false && (
                        <GuestFeatureButton
                          icon={<Music className="w-8 h-8" />}
                          label="Pedir Canción"
                          sublabel={songRequests.length > 0 ? `${songRequests.length} pedido${songRequests.length !== 1 ? 's' : ''}` : 'Pedile al DJ'}
                          color={accentColor}
                          onClick={() => setGuestSection('song')}
                        />
                      )}

                      {localSettings.showDedications !== false && (
                        <GuestFeatureButton
                          icon={<Heart className="w-8 h-8" />}
                          label="Dedicatoria"
                          sublabel={dedications.length > 0 ? `${dedications.length} enviada${dedications.length !== 1 ? 's' : ''}` : 'Dejá tu mensaje'}
                          color={accentColor}
                          onClick={() => setGuestSection('dedication')}
                        />
                      )}

                      {activePoll && localSettings.showPolls !== false && (
                        <GuestFeatureButton
                          icon={<BarChart2 className="w-8 h-8" />}
                          label="Votar"
                          sublabel="Encuesta activa"
                          color={accentColor}
                          onClick={() => setGuestSection('poll')}
                          pulse
                        />
                      )}

                      {localSettings.activeGame && (
                        <GuestFeatureButton
                          icon={<Gamepad2 className="w-8 h-8" />}
                          label={localSettings.activeGame.title || 'Juego en Vivo'}
                          sublabel={localSettings.activeGame.subtitle || '¡Participá ahora!'}
                          color={accentColor}
                          onClick={() => setGuestSection('game')}
                          primary
                          wide
                          pulse
                        />
                      )}
                    </div>

                    {/* Empty state */}
                    {!localSettings.uploadsActive &&
                     localSettings.chatEnabled === false &&
                     localSettings.showSongRequests === false &&
                     localSettings.showDedications === false &&
                     !activePoll &&
                     !localSettings.activeGame &&
                     posts.length === 0 && (
                      <div className="text-center pt-20 space-y-3">
                        <div className="text-5xl">🎉</div>
                        <p className="font-bold text-slate-500">El evento está comenzando...</p>
                        <p className="text-sm text-slate-400">Las funcionalidades se activarán pronto.</p>
                      </div>
                    )}

                    {/* ── Social follow banner (shown when Instagram or Facebook is configured) ── */}
                    {(instagramUrl || facebookUrl) && (
                      <div className="mt-6 rounded-3xl border border-slate-100 bg-white shadow-md p-5 space-y-3">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">Seguinos en redes 📲</p>
                        <div className={`grid gap-3 ${instagramUrl && facebookUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {instagramUrl && (
                            <button
                              onClick={() => handleFollowClick('instagram', instagramUrl)}
                              className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-sm text-white shadow-lg transition-transform active:scale-95"
                              style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)' }}
                            >
                              {followedPlatforms.has('instagram') ? (
                                <><CheckCircle2 className="w-4 h-4 shrink-0" /> ¡Ya seguís!</>
                              ) : (
                                <><svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> Seguir en Instagram</>
                              )}
                            </button>
                          )}
                          {facebookUrl && (
                            <button
                              onClick={() => handleFollowClick('facebook', facebookUrl)}
                              className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-bold text-sm text-white shadow-lg transition-transform active:scale-95 bg-blue-600 hover:bg-blue-700"
                            >
                              {followedPlatforms.has('facebook') ? (
                                <><CheckCircle2 className="w-4 h-4 shrink-0" /> ¡Ya seguís!</>
                              ) : (
                                <><svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Seguir en Facebook</>
                              )}
                            </button>
                          )}
                        </div>
                        {!isAdminView && authorName && authorName.toLowerCase() !== 'anónimo' &&
                         (followedPlatforms.has('instagram') || followedPlatforms.has('facebook')) && (
                          <p className="text-[10px] text-center text-slate-400">
                            ✅ ¡Gracias por seguirnos! Tu nombre queda registrado para participar en los sorteos de redes. 🎉
                          </p>
                        )}
                        {!isAdminView && authorName && authorName.toLowerCase() === 'anónimo' && (
                          <p className="text-[10px] text-center text-amber-500">
                            ⚠️ Para participar en los sorteos de redes, ingresá tu nombre (no como Anónimo).
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Photos & Comments section ── */}
                {guestSection === 'photos' && (
                  <motion.div key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-4">
                    {isLoading ? (
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="aspect-square bg-slate-100 animate-pulse rounded-3xl" />
                        ))}
                      </div>
                    ) : posts.length === 0 ? (
                      <div className="text-center py-16 text-slate-400">No hay fotos aún.</div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {posts.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onLike={handleLike}
                            onComment={handleComment}
                            isAdminView={false}
                            authorName={authorName}
                            accentColor={accentColor}
                            allowLikes={localSettings.allowLikes !== false}
                            allowComments={localSettings.allowComments !== false}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Song Requests section ── */}
                {guestSection === 'song' && (
                  <motion.div key="song" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-4 space-y-4">
                    <Card className="shadow-lg border-none rounded-3xl">
                      <CardContent className="p-5 space-y-4">
                        <form onSubmit={handleSongRequestSubmit} className="flex gap-2">
                          <Input value={newSongRequest} onChange={e => setNewSongRequest(e.target.value)} placeholder="Ej: TQG - Karol G & Shakira" className="flex-1 h-12 rounded-2xl border-slate-200" />
                          <Button type="submit" disabled={!newSongRequest.trim()} className="h-12 w-12 rounded-2xl shrink-0 shadow-lg transition-transform active:scale-95" style={{ backgroundColor: accentColor }}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </form>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                          {songRequests.slice(0, MAX_DISPLAYED_SONG_REQUESTS).map(req => (
                            <div key={req.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                              <p className="font-semibold text-slate-700">{req.song}</p>
                              <p className="text-xs text-slate-500 mt-0.5">Pedido por {req.requestedBy}</p>
                            </div>
                          ))}
                          {songRequests.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-6">No hay pedidos aún. ¡Sé el primero!</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* ── Dedications section ── */}
                {guestSection === 'dedication' && (
                  <motion.div key="dedication" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-4 space-y-4">
                    <Card className="shadow-lg border-none rounded-3xl">
                      <CardContent className="p-5 space-y-4">
                        <form onSubmit={handleDedicationSubmit} className="space-y-3">
                          <Textarea value={newDedication} onChange={e => setNewDedication(e.target.value)} placeholder="Escribe tu dedicatoria aquí..." rows={4} className="rounded-2xl border-slate-200 resize-none" />
                          <Button type="submit" disabled={!newDedication.trim()} className="w-full h-12 rounded-2xl font-bold shadow-lg transition-transform active:scale-95" style={{ backgroundColor: accentColor }}>
                            <Send className="w-4 h-4 mr-2" /> Enviar dedicatoria
                          </Button>
                        </form>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                          {dedications.slice(-10).reverse().map(d => (
                            <div key={d.id} className={cn('rounded-2xl border px-4 py-3 text-sm', d.highlighted ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100')}>
                              <p className="text-slate-700 leading-relaxed">{d.message}</p>
                              <p className="text-xs text-slate-500 mt-1">— {d.authorName}</p>
                            </div>
                          ))}
                          {dedications.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-6">No hay dedicatorias aún.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* ── Live Chat section ── */}
                {guestSection === 'chat' && (
                  <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-4">
                    <div className="flex flex-col" style={{ height: 'calc(100dvh - 9rem)' }}>
                      <ScrollArea className="flex-1 pr-1">
                        <div className="space-y-3 pb-2">
                          {chatMessages.map(msg => {
                            const isMe = msg.authorName === authorName;
                            return (
                              <div key={msg.id} className={cn('flex flex-col max-w-[85%]', isMe ? 'ml-auto items-end' : 'items-start')}>
                                {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">{msg.authorName}</span>}
                                <div
                                  className={cn('px-3.5 py-2 rounded-2xl text-sm shadow-sm leading-relaxed', isMe ? 'text-white' : 'bg-white text-slate-700 border border-slate-100')}
                                  style={isMe ? { backgroundColor: accentColor } : {}}
                                >
                                  {msg.text}
                                </div>
                                <span className="text-[8px] text-slate-300 mt-0.5 mx-1">
                                  {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                          {chatMessages.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-8">No hay mensajes aún. ¡Sé el primero!</p>
                          )}
                          <div ref={chatEndRef} />
                        </div>
                      </ScrollArea>
                      <form onSubmit={handleChatSubmit} className="flex gap-2 items-center pt-3 border-t border-slate-100 mt-2 shrink-0">
                        <Input
                          value={newChatMessage}
                          onChange={e => setNewChatMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          disabled={isSendingChat || !authorName}
                          className="flex-1 h-12 rounded-2xl bg-slate-50 border-none px-4 text-sm"
                        />
                        <Button
                          type="submit"
                          disabled={!newChatMessage.trim() || isSendingChat || !authorName}
                          className="h-12 w-12 rounded-2xl shrink-0 shadow-lg transition-transform active:scale-95"
                          style={{ backgroundColor: accentColor }}
                        >
                          {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {/* ── Poll / Voting section ── */}
                {guestSection === 'poll' && (
                  <motion.div key="poll" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-4">
                    {activePoll ? (
                      <Card className="shadow-lg border-none rounded-3xl">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-slate-800">
                            <BarChart2 className="w-5 h-5" style={{ color: accentColor }} /> Encuesta en Vivo
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-lg font-bold text-slate-700">{activePoll.question}</p>
                          {hasVoted && votedPollId === activePoll.id ? (
                            <div className="space-y-3">
                              {activePoll.options.map(opt => {
                                const total = activePoll.options.reduce((a, o) => a + o.votes, 0);
                                const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                                return (
                                  <div key={opt.id} className="space-y-1">
                                    <div className="flex justify-between text-sm text-slate-600">
                                      <span className="font-medium">{opt.text}</span>
                                      <span className="font-bold" style={{ color: accentColor }}>{pct}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-slate-100">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
                                    </div>
                                  </div>
                                );
                              })}
                              <p className="text-xs text-slate-400 text-center pt-2">¡Gracias por votar!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2">
                              {activePoll.options.map(opt => (
                                <Button
                                  key={opt.id}
                                  variant="outline"
                                  className="h-14 rounded-2xl text-left justify-start font-semibold text-base px-5"
                                  onClick={() => handleVotePoll(activePoll.id, opt.id)}
                                >
                                  {opt.text}
                                </Button>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-16 space-y-3">
                        <div className="text-4xl">📊</div>
                        <p className="font-medium text-slate-500">No hay encuesta activa en este momento.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Game section ── */}
                {guestSection === 'game' && (
                  <motion.div key="game" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="pt-4 space-y-4">
                    {localSettings.activeGame ? (
                      <>
                        <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
                          <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />
                          <CardContent className="p-8 text-center space-y-4">
                            <div className="text-6xl mb-2">🎮</div>
                            <h2 className="text-2xl font-black text-slate-800">{localSettings.activeGame.title}</h2>
                            {localSettings.activeGame.subtitle && (
                              <p className="text-slate-500 text-base">{localSettings.activeGame.subtitle}</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Game options with interactive voting (for siONo, verdadODesafio, trivia, encuesta) */}
                        {localSettings.activeGame.options && localSettings.activeGame.options.length > 0 && !localSettings.activeGame.pollId && (
                          <GameOptionsVoting
                            game={localSettings.activeGame}
                            fiestaId={params.fiestaId}
                            accentColor={accentColor}
                            onVoted={() => fetchData(false)}
                          />
                        )}

                        {/* If the game has a linked poll, allow voting directly */}
                        {localSettings.activeGame.pollId && activePoll && (
                          <Card className="shadow-lg border-none rounded-3xl">
                            <CardHeader>
                              <CardTitle className="text-slate-800 text-base">{activePoll.question}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {hasVoted && votedPollId === activePoll.id ? (
                                <div className="space-y-2">
                                  {activePoll.options.map(opt => {
                                    const total = activePoll.options.reduce((a, o) => a + o.votes, 0);
                                    const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                                    return (
                                      <div key={opt.id} className="space-y-0.5">
                                        <div className="flex justify-between text-sm text-slate-600">
                                          <span>{opt.text}</span>
                                          <span className="font-bold" style={{ color: accentColor }}>{pct}%</span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-100">
                                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <p className="text-xs text-center text-slate-400 pt-2">¡Gracias por votar!</p>
                                </div>
                              ) : (
                                <div className="grid gap-2">
                                  {activePoll.options.map(opt => (
                                    <Button
                                      key={opt.id}
                                      variant="outline"
                                      className="h-12 rounded-2xl justify-start font-semibold"
                                      onClick={() => handleVotePoll(activePoll.id, opt.id)}
                                    >
                                      {opt.text}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-16 space-y-3">
                        <div className="text-4xl">🎮</div>
                        <p className="font-medium text-slate-500">No hay juego activo en este momento.</p>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </main>

            {/* ── Sticky social follow footer (shown in all sections when social links are configured) ── */}
            {(instagramUrl || facebookUrl) && guestSection !== null && (
              <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-2.5 flex items-center gap-2 max-w-lg mx-auto w-full">
                <span className="text-xs font-bold text-slate-400 shrink-0">Seguinos 📲</span>
                <div className="flex gap-2 flex-1 justify-end">
                  {instagramUrl && (
                    <button
                      onClick={() => handleFollowClick('instagram', instagramUrl)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-transform active:scale-95"
                      style={{ background: followedPlatforms.has('instagram') ? '#22c55e' : 'linear-gradient(135deg, #f43f5e, #a855f7)' }}
                    >
                      {followedPlatforms.has('instagram') ? <CheckCircle2 className="w-3.5 h-3.5" /> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                      {followedPlatforms.has('instagram') ? '¡Seguido!' : 'Instagram'}
                    </button>
                  )}
                  {facebookUrl && (
                    <button
                      onClick={() => handleFollowClick('facebook', facebookUrl)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-transform active:scale-95"
                      style={{ backgroundColor: followedPlatforms.has('facebook') ? '#22c55e' : '#1d4ed8' }}
                    >
                      {followedPlatforms.has('facebook') ? <CheckCircle2 className="w-3.5 h-3.5" /> : <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
                      {followedPlatforms.has('facebook') ? '¡Seguido!' : 'Facebook'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ADMIN VIEW — existing complex layout, unchanged
      ════════════════════════════════════════════════════════════════ */}
      {isAdminView && (
        <>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm px-4">
        <div className="max-w-6xl mx-auto h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2.5 rounded-2xl hidden sm:flex" style={{ backgroundColor: `${accentColor}15` }}>
                <PartyPopper className="w-6 h-6" style={{ color: accentColor }}/>
            </div>
            <div className="min-w-0">
                <h1 className="text-xl font-black font-headline text-slate-800 truncate">
                    {localSettings.title || fiesta?.configuracion.nombreEvento || 'Muro Social'}
                </h1>
                <p className="text-xs font-medium text-slate-400 truncate uppercase tracking-tighter">
                    {localSettings.subtitle || 'Subí tus fotos y participá en vivo'}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
             <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="h-11 rounded-2xl px-6 font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95" disabled={!authorName || !localSettings.uploadsActive} style={{ backgroundColor: accentColor }}>
                        <Upload className="w-5 h-5 mr-2"/>
                        <span className="hidden sm:inline">Subir Foto</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-none">
                    <DialogHeader><DialogTitle className="text-xl font-bold">Publicar Momento</DialogTitle><DialogDescription>Sube una foto para que todos la vean.</DialogDescription></DialogHeader>
                    <form onSubmit={handleUploadSubmit} className="space-y-6 py-2">
                        {uploadPreview ? (
                            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner border bg-slate-50">
                                <NextImage src={uploadPreview} alt="Vista previa" layout="fill" objectFit="contain" />
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => {setFileToUpload(null); setUploadPreview(null);}}><X className="w-4 h-4"/></Button>
                            </div>
                        ) : (
                            <div className="h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50 transition-colors hover:bg-slate-100 hover:border-primary/30">
                                <Label htmlFor="file-upload-dialog" className="cursor-pointer text-center text-slate-400 p-8 flex flex-col items-center gap-3">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                                        <Upload className="w-8 h-8 text-primary" style={{ color: accentColor }}/>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-bold text-slate-600">Toca para seleccionar</p>
                                        <p className="text-xs">JPG, PNG o GIF (Máx 10MB)</p>
                                    </div>
                                </Label>
                                 <Input id="file-upload-dialog" type="file" onChange={handleFileSelect} className="hidden" accept="image/*" disabled={!localSettings.uploadsActive} />
                             </div>
                         )}
                        <DialogFooter>
                            <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold" disabled={isUploading || !fileToUpload || !localSettings.uploadsActive} style={{ backgroundColor: accentColor }}>
                                {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-5 h-5 mr-2"/>}
                                {isUploading ? "Publicando..." : "Publicar ahora"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {isAdminView && (
              <>
                 <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-11 w-11 rounded-2xl p-0 border-slate-200"><Settings2 className="w-5 h-5 text-slate-600"/></Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-3xl border-none">
                        <DialogHeader><DialogTitle className="text-xl font-bold">Ajustes del Mural</DialogTitle><DialogDescription>Personaliza la apariencia y funciones para los invitados.</DialogDescription></DialogHeader>
                        <div className="space-y-5 py-4">
                            <div className="space-y-2"><Label className="text-xs font-bold text-slate-400 uppercase">Personalización Visual</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label>Color Fondo</Label><div className="flex gap-2"><Input type="color" value={localSettings.backgroundColor} onChange={e => setLocalSettings(p => ({...p, backgroundColor: e.target.value}))} className="w-10 h-10 p-1"/><Input value={localSettings.backgroundColor} onChange={e => setLocalSettings(p => ({...p, backgroundColor: e.target.value}))}/></div></div>
                                    <div className="space-y-1.5"><Label>Color Acento</Label><div className="flex gap-2"><Input type="color" value={localSettings.accentColor} onChange={e => setLocalSettings(p => ({...p, accentColor: e.target.value}))} className="w-10 h-10 p-1"/><Input value={localSettings.accentColor} onChange={e => setLocalSettings(p => ({...p, accentColor: e.target.value}))}/></div></div>
                                </div>
                            </div>
                            <Separator/>
                            <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-base font-bold">Chat en Vivo</Label><p className="text-xs text-muted-foreground">Activa el panel de conversación inferior.</p></div><Switch checked={localSettings.chatEnabled} onCheckedChange={v => setLocalSettings(p => ({...p, chatEnabled: v}))}/></div>
                            <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-base font-bold">Permitir Subidas</Label><p className="text-xs text-muted-foreground">Habilitar el botón de "Subir Foto".</p></div><Switch checked={localSettings.uploadsActive} onCheckedChange={v => setLocalSettings(p => ({...p, uploadsActive: v}))}/></div>
                            <Separator/>
                            <div className="space-y-1.5">
                                <Label className="text-base font-bold">Límite de Fotos</Label>
                                <p className="text-xs text-muted-foreground">Máximo de fotos permitidas para este evento (10–500).</p>
                                <Input type="number" min={10} max={500} value={localSettings.maxPhotos ?? 200} onChange={e => { const val = Math.min(500, Math.max(10, Number(e.target.value))); setLocalSettings(p => ({...p, maxPhotos: val})); }} />
                            </div>
                        </div>
                        <DialogFooter><Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full h-12 rounded-xl text-lg font-bold">{isSavingSettings ? <Loader2 className="animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}Guardar Ajustes</Button></DialogFooter>
                    </DialogContent>
                 </Dialog>
                 <ShareLinkDialog relativePath={`/evento/social/${params.fiestaId}`} title="Muro Social · Link para invitados" description="Compartí este link para que los invitados suban fotos y participen.">
                    <Button variant="outline" className="h-11 w-11 rounded-2xl p-0 border-slate-200"><Share2 className="w-5 h-5 text-slate-600"/></Button>
                </ShareLinkDialog>
                 <Button variant="outline" onClick={() => window.open(`/evento/muro-en-vivo/${params.fiestaId}`, '_blank')} title="Abrir pantalla gigante" aria-label="Abrir pantalla gigante" className="h-11 w-11 rounded-2xl p-0 border-slate-200"><MonitorPlay className="w-5 h-5 text-slate-600"/></Button>
              </>
            )}
             <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={isLoading} className="h-11 w-11 rounded-2xl"><RefreshCw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`}/></Button>
          </div>
        </div>
        {isAdminView && (
          <div className="bg-amber-50 border-y border-amber-100 p-2.5 flex justify-center items-center gap-6 overflow-x-auto">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest whitespace-nowrap">MODO ADMINISTRADOR · MURO SOCIAL</span>
            <div className="flex gap-2 flex-wrap">
                <a href={`/evento/social/${params.fiestaId}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir vista de invitados del Muro Social"><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-amber-800 hover:bg-amber-100">📱 INVITADOS</Button></a>
                <a href={`/evento/muro-en-vivo/${params.fiestaId}`} target="_blank" rel="noopener noreferrer" aria-label="Abrir pantalla gigante del Muro Social"><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-amber-800 hover:bg-amber-100">🖥 PANTALLA GIGANTE</Button></a>
                <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-amber-800 hover:bg-amber-100" onClick={handleDownloadChat}><Download className="w-3 h-3 mr-1.5"/>CHAT</Button>
                <a href={`/api/social-gallery/${params.fiestaId}/download`} download><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-amber-800 hover:bg-amber-100"><Download className="w-3 h-3 mr-1.5"/>FOTOS</Button></a>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-destructive hover:bg-red-50" disabled={isDownloadingAndClearing} aria-label="Descargar ZIP y limpiar galería"><Download className="w-3 h-3 mr-1.5"/><Trash2 className="w-3 h-3 mr-1.5"/>ZIP + LIMPIAR</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Descargar ZIP y limpiar?</AlertDialogTitle><AlertDialogDescription>Se descargará el ZIP con todas las fotos y luego se eliminarán permanentemente del servidor.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDownloadAndClear} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold text-destructive hover:bg-red-50" disabled={isClearing}><Trash2 className="w-3 h-3 mr-1.5"/>VACIAR</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>¿Vaciar el mural?</AlertDialogTitle><AlertDialogDescription>Se eliminarán permanentemente todas las fotos y mensajes.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleClearGallery} className="bg-destructive hover:bg-destructive/90">Confirmar</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <AnimatePresence>
                {posts.length === 0 && isLoading ? (
                    Array.from({length:4}).map((_, i) => (
                        <div key={i} className="aspect-square bg-white/50 animate-pulse rounded-3xl border border-white"></div>
                    ))
                ) : posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onComment={handleComment}
                      isAdminView={isAdminView}
                      onDelete={handleDelete}
                      onHighlightComment={isAdminView ? handleHighlightComment : undefined}
                      authorName={authorName}
                      accentColor={accentColor}
                      allowLikes={localSettings.allowLikes !== false}
                      allowComments={localSettings.allowComments !== false}
                    />
                ))}
            </AnimatePresence>
        </div>
        
        {posts.length === 0 && !isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-slate-200">
                    <CameraIcon className="w-10 h-10 text-slate-300"/>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800">¡Mural vacío!</h2>
                    <p className="text-slate-400">Sé el primero en compartir una foto de este momento.</p>
                </div>
                <Button onClick={() => setIsUploadDialogOpen(true)} className="h-12 rounded-xl px-8 font-bold" style={{ backgroundColor: accentColor }}>Subir primera foto</Button>
            </motion.div>
        )}

        {(localSettings.showSongRequests !== false || localSettings.showDedications !== false) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {localSettings.showSongRequests !== false && (
              <Card className="shadow-xl border-none rounded-3xl bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Music className="w-5 h-5" style={{ color: accentColor }} /> Pedidos de canciones
                  </CardTitle>
                  <CardDescription>Tu pedido aparece en el panel del organizador en tiempo real.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSongRequestSubmit} className="flex gap-2">
                    <Input value={newSongRequest} onChange={e => setNewSongRequest(e.target.value)} placeholder="Ej: TQG - Karol G & Shakira" />
                    <Button type="submit" disabled={!newSongRequest.trim()} style={{ backgroundColor: accentColor }}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {songRequests.slice(0, MAX_DISPLAYED_SONG_REQUESTS).map((request) => (
                      <div key={request.id} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
                        <p className="font-semibold text-slate-700">{request.song}</p>
                        <p className="text-xs text-slate-500">Pedido por {request.requestedBy}</p>
                      </div>
                    ))}
                    {songRequests.length === 0 && <p className="text-xs text-slate-400">Todavía no hay pedidos.</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {localSettings.showDedications !== false && (
              <Card className="shadow-xl border-none rounded-3xl bg-white/90 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <MicVocal className="w-5 h-5" style={{ color: accentColor }} /> Dedicatorias
                  </CardTitle>
                  <CardDescription>Envía un mensaje para que se vea en el control del evento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleDedicationSubmit} className="space-y-2">
                    <Textarea value={newDedication} onChange={e => setNewDedication(e.target.value)} placeholder="Escribe tu dedicatoria..." rows={3} />
                    <Button type="submit" disabled={!newDedication.trim()} style={{ backgroundColor: accentColor }}>
                      <Send className="w-4 h-4 mr-2" /> Enviar dedicatoria
                    </Button>
                  </form>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {dedications.slice(-10).reverse().map((dedication) => (
                      <div key={dedication.id} className={cn("rounded-xl border px-3 py-2 text-sm", dedication.highlighted ? "bg-amber-50 border-amber-300" : "bg-slate-50")}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-slate-700">{dedication.message}</p>
                            <p className="text-xs text-slate-500 mt-1">— {dedication.authorName}</p>
                          </div>
                          {isAdminView && (
                            <button
                              onClick={() => handleHighlightDedication(dedication.id, !!dedication.highlighted)}
                              className={cn("flex-shrink-0 p-1 rounded-lg transition-colors", dedication.highlighted ? "text-amber-500 hover:text-amber-600" : "text-slate-300 hover:text-amber-400")}
                              title={dedication.highlighted ? 'Quitar destacado' : 'Destacar'}
                            >
                              <Star className="w-4 h-4" fill={dedication.highlighted ? 'currentColor' : 'none'} />
                            </button>
                          )}
                          {dedication.highlighted && !isAdminView && (
                            <Star className="w-4 h-4 flex-shrink-0 text-amber-400 fill-current" />
                          )}
                        </div>
                      </div>
                    ))}
                    {dedications.length === 0 && <p className="text-xs text-slate-400">Todavía no hay dedicatorias.</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Admin: Polls/Trivia management */}
        {isAdminView && (
          <Card className="shadow-xl border-none rounded-3xl bg-white/90 backdrop-blur-md border-l-4" style={{ borderLeftColor: accentColor }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <PlayCircle className="w-5 h-5" style={{ color: accentColor }} /> Encuestas / Trivia
              </CardTitle>
              <CardDescription>Lanza una encuesta en vivo para que los invitados voten.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleCreatePoll} className="space-y-3">
                <Input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Pregunta de la encuesta..." />
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input value={opt} onChange={e => { const next = [...pollOptions]; next[idx] = e.target.value; setPollOptions(next); }} placeholder={`Opción ${idx + 1}`} />
                      {pollOptions.length > 2 && (
                        <button type="button" onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-destructive">
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button type="button" onClick={() => setPollOptions(prev => [...prev, ''])} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600">
                      <PlusCircle className="w-4 h-4" /> Agregar opción
                    </button>
                  )}
                </div>
                <Button type="submit" disabled={isCreatingPoll || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2} style={{ backgroundColor: accentColor }}>
                  {isCreatingPoll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                  Lanzar Encuesta
                </Button>
              </form>
              {activePoll && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-700 text-sm">{activePoll.question}</p>
                    <Button size="sm" variant="destructive" onClick={() => handleClosePoll(activePoll.id)}>Cerrar</Button>
                  </div>
                  <div className="space-y-1.5">
                    {activePoll.options.map(opt => {
                      const total = activePoll.options.reduce((a, o) => a + o.votes, 0);
                      const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                      return (
                        <div key={opt.id} className="space-y-0.5">
                          <div className="flex justify-between text-xs text-slate-600">
                            <span>{opt.text}</span><span className="font-bold">{pct}% ({opt.votes})</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accentColor }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}


        
        {localSettings.chatEnabled !== false && (
            <Card className="shadow-2xl border-none rounded-[1.5rem] overflow-hidden bg-white/90 backdrop-blur-md max-w-lg mx-auto">
                <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}15` }}>
                        <MessageSquare className="w-4 h-4" style={{ color: accentColor }}/>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-800">Chat del Evento</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <ScrollArea className="h-48 pr-4">
                        <div className="space-y-3">
                            {chatMessages.map(msg => {
                                const isMe = msg.authorName === authorName;
                                return (
                                    <div key={msg.id} className={cn("flex flex-col max-w-[90%]", isMe ? "ml-auto items-end" : "items-start")}>
                                        {!isMe && <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 ml-1">{msg.authorName}</span>}
                                        <div className={cn("px-3 py-1.5 rounded-xl text-xs shadow-sm", isMe ? "text-white" : "bg-slate-100 text-slate-700")} style={isMe ? { backgroundColor: accentColor } : {}}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[8px] text-slate-300 mt-0.5 mx-1">{new Date(msg.timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef}/>
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleChatSubmit} className="flex gap-2 items-center mt-4 pt-3 border-t border-slate-100">
                        <Input value={newChatMessage} onChange={e => setNewChatMessage(e.target.value)} placeholder="Escribe un mensaje..." disabled={isSendingChat || !authorName} className="h-10 rounded-xl bg-slate-50 border-none px-4 text-xs focus-visible:ring-2" style={{ '--tw-ring-color': accentColor } as any} />
                        <Button type="submit" disabled={!newChatMessage.trim() || isSendingChat || !authorName} className="h-10 w-10 rounded-xl flex-shrink-0 shadow-lg shadow-primary/10 transition-transform active:scale-95" style={{ backgroundColor: accentColor }}>
                            {isSendingChat ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        )}
      </main>
      
      {projectionMode && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row p-4 gap-4">
            <Button onClick={() => setProjectionMode(false)} variant="ghost" size="icon" className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/80 text-white hover:text-white h-10 w-10"><X className="w-6 h-6"/></Button>
            <div className="relative flex-grow h-full w-full md:w-3/4">
                {posts.map((post, index) => (
                    <div key={post.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                        <WatermarkedImage src={post.imageUrl} layout="fill" objectFit="contain" alt={`Foto de ${post.authorName}`} />
                    </div>
                ))}
            </div>
             <div className="flex-shrink-0 w-full md:w-1/4 h-1/3 md:h-full bg-slate-900/90 backdrop-blur rounded-[2rem] p-6 flex flex-col text-white shadow-2xl border border-white/5">
                {companyLogoUrl && (
                    <div className="relative h-24 w-full mb-6">
                        <NextImage src={companyLogoUrl} alt="Logo" layout="fill" objectFit="contain" data-ai-hint="company logo"/>
                    </div>
                )}
                <div className="flex items-center gap-2 mb-6">
                    <MessageSquare className="w-5 h-5" style={{ color: accentColor }}/>
                    <h2 className="text-xl font-black font-headline tracking-tight">Conversación</h2>
                </div>
                 <ScrollArea className="flex-grow mb-6">
                     <div className="space-y-4">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                <span className="font-black text-[10px] uppercase tracking-widest block mb-1" style={{ color: accentColor }}>{msg.authorName}</span>
                                <span className="text-sm leading-relaxed text-slate-200">{msg.text}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef}/>
                    </div>
                 </ScrollArea>
                 <div className="flex-shrink-0 text-center space-y-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                     <div className="space-y-3">
                        <p className="font-bold text-slate-300 text-sm">¡Escanea y participa!</p>
                        <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl">
                            <QRCodeStylized value={`${window.location.origin}/evento/social/${params.fiestaId}`} size={120} />
                        </div>
                     </div>
                     {whatsappNumber && (
                        <div className="border-t border-white/10 pt-4">
                           <p className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-2">Contacto</p>
                           <p className="flex items-center justify-center gap-2 text-lg font-black" style={{ color: accentColor }}>
                             <MessageSquare className="w-5 h-5"/>
                             {whatsappNumber}
                           </p>
                        </div>
                     )}
                 </div>
            </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

/** Interactive voting component for game options (siONo, verdadODesafio, trivia, encuesta) */
function GameOptionsVoting({
  game,
  fiestaId,
  accentColor,
  onVoted,
}: {
  game: NonNullable<SocialGallerySettings['activeGame']>;
  fiestaId: string;
  accentColor: string;
  onVoted: () => void;
}) {
  const storageKey = `votedGame_${fiestaId}_${game.launchedAt}`;
  const [voted, setVoted] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(storageKey);
    }
    return null;
  });
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const handleVote = async (optionId: string) => {
    if (voted || isVoting) return;
    setIsVoting(true);
    try {
      const result = await voteActiveGameOption(fiestaId, optionId);
      if (result.success) {
        setVoted(optionId);
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, optionId);
        }
        onVoted();
        toast({ title: '¡Voto registrado! 🎉' });
      } else {
        toast({ title: 'Error al votar', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error al enviar voto', variant: 'destructive' });
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = (game.options ?? []).reduce((s, o) => s + (o.votes ?? 0), 0);

  return (
    <Card className="shadow-lg border-none rounded-3xl">
      <CardContent className="p-5 space-y-3">
        {voted ? (
          <>
            <p className="text-sm font-bold text-center text-slate-500 pb-1">Resultados actuales</p>
            {(game.options ?? []).map(opt => {
              const pct = totalVotes > 0 ? Math.round(((opt.votes ?? 0) / totalVotes) * 100) : 0;
              const isMyVote = voted === opt.id;
              return (
                <div key={opt.id} className="space-y-1">
                  <div className="flex justify-between text-sm text-slate-700">
                    <span className="font-semibold flex items-center gap-1.5">
                      {opt.emoji && <span>{opt.emoji}</span>}
                      {opt.text}
                      {isMyVote && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />}
                    </span>
                    <span className="font-black" style={{ color: accentColor }}>{pct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isMyVote ? accentColor : `${accentColor}80`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-center text-slate-400 pt-1">¡Gracias por participar!</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-center text-slate-600 pb-1">¡Elegí tu respuesta!</p>
            <div className="grid gap-2">
              {(game.options ?? []).map(opt => (
                <Button
                  key={opt.id}
                  variant="outline"
                  className="h-14 rounded-2xl text-left justify-start font-semibold text-base px-5 transition-transform active:scale-95"
                  disabled={isVoting}
                  onClick={() => handleVote(opt.id)}
                  style={{ borderColor: `${accentColor}40` }}
                >
                  {isVoting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {opt.emoji && <span className="mr-2 text-lg">{opt.emoji}</span>}
                  {opt.text}
                </Button>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
