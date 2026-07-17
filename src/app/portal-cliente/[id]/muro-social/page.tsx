'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaForPortalSession, initializePortalSession } from '@/app/actions/fiesta/portal.actions';
import { saveSocialSettingsByClient, getSocialPostsByClient, moderateSocialPostByClient } from '@/app/actions/social-gallery';
import type { FiestaEnPlanificacion, SocialGallerySettings } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  Save,
  ExternalLink,
  Sparkles,
  Settings2,
  Palette,
  Camera,
  Music,
  Heart,
  MessageSquare,
  Users,
  Eye,
  Info,
  Play,
  Pause,
  Tv,
  LayoutGrid,
  Check,
  X,
  Volume2,
  VolumeX,
  Megaphone,
  Gift,
  RefreshCw,
  Trash2,
  UserCheck,
  Layout,
  Layers,
  Activity
} from 'lucide-react';
import NextImage from 'next/image';

const SESSION_KEY_PREFIX = 'portal_auth_';

const BRAND_PRESET_COLORS = [
  { name: 'Rojo AK', value: '#e11d48' },
  { name: 'Dorado Premium', value: '#d4af37' },
  { name: 'Azul Real', value: '#1d4ed8' },
  { name: 'Verde Esmeralda', value: '#047857' },
  { name: 'Violeta Festivo', value: '#7c3aed' },
  { name: 'Rosa Romántico', value: '#db2777' },
];

export default function ClientMuroSocialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [accessKey, setAccessKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('control');

  // Control Remoto States
  const [playlistPlaying, setPlaylistPlaying] = useState(true);
  const [currentLayout, setCurrentLayout] = useState<'slideshow' | 'masonry'>('slideshow');
  const [forcedScreenItem, setForcedScreenItem] = useState<'mural' | 'juego' | 'chat' | 'canciones' | 'dedicaciones' | 'pauta' | 'video' | 'sorteo' | null>(null);
  const [ledMarqueeText, setLedMarqueeText] = useState('');
  const [ledMarqueeEnabled, setLedMarqueeEnabled] = useState(false);

  // Sorteo Remoto States
  const [sorteoPremio, setSorteoPremio] = useState('');
  const [sorteoOnScreen, setSorteoOnScreen] = useState(false);
  const [customWinnerName, setCustomWinnerName] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [sorteoWinner, setSorteoWinner] = useState<string | null>(null);

  // Moderación Express & Posts States
  const [posts, setPosts] = useState<SocialGalleryPost[]>([]);
  const [moderationMode, setModerationMode] = useState<'pending' | 'approved' | 'hidden'>('pending');
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const sorteoRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Configuración General Form States
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [uploadsActive, setUploadsActive] = useState(true);
  const [privateDedicationsMode, setPrivateDedicationsMode] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showSongRequests, setShowSongRequests] = useState(true);
  const [showDedications, setShowDedications] = useState(true);
  const [screenDarkMode, setScreenDarkMode] = useState(true);

  const [accentColor, setAccentColor] = useState('#e11d48');
  const [coverUrl, setCoverUrl] = useState('');

  // Fetch posts for Moderation Express
  const loadPosts = useCallback(async (key = accessKey) => {
    if (!key) return;
    try {
      const result = await getSocialPostsByClient(fiestaId, key);
      if (result.success) {
        setPosts(result.posts || []);
      } else {
        setError(result.error || 'No se pudieron cargar las publicaciones.');
      }
    } catch (e) {
      console.error('Error al cargar posts para moderación', e);
    }
  }, [accessKey, fiestaId]);

  // Load initial settings
  const loadData = useCallback(async (key: string) => {
    try {
      const session = await initializePortalSession(fiestaId, key);
      const data = session.success ? await getFiestaForPortalSession(fiestaId) : null;
      if (!data || data.id !== fiestaId) {
        sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId);
        setError('El acceso no corresponde a este evento.');
        setIsLoading(false);
        return;
      }
      setFiesta(data);

      // Initialize states from settings
      const settings: Partial<SocialGallerySettings> = data.socialGallerySettings || {};
      setEnabled(settings.enabled ?? true);
      setTitle(settings.title || data.configuracion?.nombreEvento || '');
      setSubtitle(settings.subtitle || '¡Compartí tus fotos y saludos en vivo!');
      setAllowLikes(settings.allowLikes ?? true);
      setAllowComments(settings.allowComments ?? true);
      setUploadsActive(settings.uploadsActive ?? true);
      setPrivateDedicationsMode(settings.privateDedicationsMode ?? false);
      setRequireApproval(settings.requireApproval ?? false);
      setChatEnabled(settings.chatEnabled ?? true);
      setShowSongRequests(settings.showSongRequests ?? true);
      setShowDedications(settings.showDedications ?? true);
      setScreenDarkMode(settings.screenDarkMode ?? true);
      setAccentColor(settings.accentColor || '#e11d48');
      setCoverUrl(settings.mobileControlCoverUrl || '');

      // Control remoto states
      setPlaylistPlaying(settings.playlistPlaying ?? true);
      setCurrentLayout(settings.currentLayout || 'slideshow');
      setForcedScreenItem(settings.forcedScreenItem ?? null);
      setLedMarqueeText(settings.ledMarqueeText || '');
      setLedMarqueeEnabled(settings.ledMarqueeEnabled ?? false);

      // Sorteo states
      setSorteoPremio(settings.sorteoPremio || '');
      setSorteoOnScreen(settings.sorteoOnScreen ?? false);
      setSorteoWinner(settings.activeSorteoWinner || null);

      await loadPosts(key);
    } catch {
      setError('Error al cargar la información del evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, loadPosts]);

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!key) {
      sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId);
      router.replace(`/portal-cliente/${fiestaId}`);
      return;
    }
    setAccessKey(key);
    loadData(key);
  }, [fiestaId, router, loadData]);

  // Polling for posts & settings every 4 seconds in live tab or moderation tab
  useEffect(() => {
    if (isLoading || !accessKey) return;
    const interval = setInterval(() => {
      loadPosts();
    }, 4000);
    return () => clearInterval(interval);
  }, [isLoading, accessKey, loadPosts]);

  useEffect(() => {
    return () => {
      if (sorteoRevealTimeoutRef.current) {
        clearTimeout(sorteoRevealTimeoutRef.current);
      }
    };
  }, []);

  // Quick save helper for remote commands
  const sendRemoteCommand = async (newSettings: Partial<SocialGallerySettings>) => {
    if (!fiesta) return;
    try {
      const res = await saveSocialSettingsByClient(fiestaId, accessKey, newSettings, coverUrl);
      if (res.success) {
        // Optimistic state updates
        setFiesta(prev => prev ? { ...prev, socialGallerySettings: { ...prev.socialGallerySettings, ...newSettings } as SocialGallerySettings } : null);
      } else {
        toast({ title: 'Error al enviar comando', description: res.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error de red', description: err.message, variant: 'destructive' });
    }
  };

  // Full settings save (for the configs tabs)
  const handleSaveConfig = async () => {
    if (!fiesta) return;
    setIsSaving(true);

    const settings: Partial<SocialGallerySettings> = {
      enabled,
      title,
      subtitle,
      allowLikes,
      allowComments,
      uploadsActive,
      privateDedicationsMode,
      requireApproval,
      chatEnabled,
      showSongRequests,
      showDedications,
      screenDarkMode,
      accentColor
    };

    try {
      const result = await saveSocialSettingsByClient(fiestaId, accessKey, settings, coverUrl);
      if (result.success) {
        toast({
          title: 'Configuración guardada 🎉',
          description: 'Los cambios ya están activos en la pantalla gigante.',
          duration: 2000,
        });
      } else {
        throw new Error(result.error || 'No se pudo guardar.');
      }
    } catch (err: any) {
      toast({
        title: 'Error al guardar',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Moderate Post Express
  const handleModerate = async (postId: string, status: 'approved' | 'hidden') => {
    setModeratingId(postId);
    try {
      // Vibrate mobile if supported for physical response
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(status === 'approved' ? 50 : [40, 40]);
      }

      // Optimistic update
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, moderationStatus: status } : p));

      const res = await moderateSocialPostByClient(fiestaId, accessKey, postId, status);
      if (res.success) {
        toast({
          title: status === 'approved' ? 'Foto aprobada ✅' : 'Foto ocultada ❌',
          description: status === 'approved' ? 'Ya se muestra en pantalla.' : 'Ocultada de la proyección.',
          duration: 1500,
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast({ title: 'Error de moderación', description: err.message, variant: 'destructive' });
      loadPosts(); // Revert
    } finally {
      setModeratingId(null);
    }
  };

  // Sorteo actions
  const triggerSorteo = async () => {
    if (sorteoRevealTimeoutRef.current) {
      clearTimeout(sorteoRevealTimeoutRef.current);
      sorteoRevealTimeoutRef.current = null;
    }

    let winner = customWinnerName.trim();
    
    if (!winner) {
      // Pick random from posts author names (distinct and valid)
      const participants = Array.from(new Set(posts.map(p => p.authorName).filter(Boolean)));
      if (participants.length === 0) {
        toast({
          title: 'No hay participantes',
          description: 'Nadie ha subido fotos al muro social todavía para sortear.',
          variant: 'destructive',
        });
        return;
      }
      winner = participants[Math.floor(Math.random() * participants.length)];
    }

    setIsSpinning(true);
    setSorteoWinner(null);

    // 1. Send Spin Start Command to Screen
    const spinStartedAt = new Date().toISOString();
    await sendRemoteCommand({
      sorteoOnScreen: true,
      sorteoSpinStartedAt: spinStartedAt,
      sorteoPremio: sorteoPremio || '¡Premio Sorpresa!',
      activeSorteoWinner: '', // Clear previous winner
      activeSorteoTimestamp: ''
    });

    toast({
      title: '🎡 ¡Ruleta Girando!',
      description: `Sorteando "${sorteoPremio || 'Premio Sorpresa'}" en la pantalla gigante.`,
    });

    // 2. Wait 7 seconds (raffle wheel animation length) to reveal winner
    sorteoRevealTimeoutRef.current = setTimeout(async () => {
      sorteoRevealTimeoutRef.current = null;
      const winnerTimestamp = new Date().toISOString();
      setSorteoWinner(winner);
      setIsSpinning(false);
      
      await sendRemoteCommand({
        activeSorteoWinner: winner,
        activeSorteoTimestamp: winnerTimestamp,
        sorteoOnScreen: true
      });

      toast({
        title: '🏆 ¡Tenemos un Ganador!',
        description: `${winner} ha ganado en la pantalla gigante.`,
        duration: 4000
      });
    }, 7000);
  };

  const clearSorteo = async () => {
    if (sorteoRevealTimeoutRef.current) {
      clearTimeout(sorteoRevealTimeoutRef.current);
      sorteoRevealTimeoutRef.current = null;
    }
    setSorteoWinner(null);
    setIsSpinning(false);
    setCustomWinnerName('');
    await sendRemoteCommand({
      sorteoOnScreen: false,
      activeSorteoWinner: '',
      activeSorteoTimestamp: '',
      sorteoSpinStartedAt: ''
    });
    toast({ title: 'Sorteo reiniciado 🧹' });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
      <span className="ml-3 text-sm font-semibold tracking-wider">Cargando Centro de Control...</span>
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-900">
      <Card className="max-w-md text-center border-red-500/20 bg-slate-950 text-white rounded-3xl p-6">
        <CardContent className="pt-6 space-y-4">
          <Info className="w-12 h-12 mx-auto text-red-500" />
          <p className="text-red-400 font-bold text-lg">{error ?? 'Error de autenticación.'}</p>
          <Button variant="outline" className="mt-4 rounded-xl border-white/10 text-white bg-white/5 hover:bg-white/10" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al Portal
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const pendingPosts = posts.filter(p => (p.moderationStatus ?? 'approved') === 'pending');
  const approvedPosts = posts.filter(p => (p.moderationStatus ?? 'approved') === 'approved');
  const hiddenPosts = posts.filter(p => p.moderationStatus === 'hidden');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* GLOW DE FONDO */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER INTEGRADO */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 h-10 w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full">En Vivo</span>
                <span className="text-[10px] font-semibold text-slate-400">{fiesta.configuracion?.nombreEvento}</span>
              </div>
              <h1 className="text-lg font-black text-white leading-tight">Centro de Control Muro</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <a href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank" rel="noopener noreferrer" title="Ver Pantalla de Proyección">
              <Button size="sm" className="rounded-xl gap-1.5 text-xs font-bold bg-white text-slate-950 hover:bg-slate-200">
                <Tv className="w-4 h-4" /> Pantalla <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        <Tabs defaultValue="control" className="space-y-6" onValueChange={setActiveTab}>
          
          {/* TABS SELECTOR - MÓVIL OPTIMIZADO */}
          <TabsList className="grid grid-cols-4 w-full bg-slate-900 border border-white/5 p-1 rounded-2xl h-14 shrink-0">
            <TabsTrigger value="control" className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Control Vivo</span>
            </TabsTrigger>
            <TabsTrigger value="moderacion" className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <div className="relative">
                <Camera className="w-4 h-4" />
                {pendingPosts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                    {pendingPosts.length}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Moderar</span>
            </TabsTrigger>
            <TabsTrigger value="diseno" className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Diseño</span>
            </TabsTrigger>
            <TabsTrigger value="modulos" className="rounded-xl py-2.5 text-xs font-bold data-[state=active]:bg-amber-400 data-[state=active]:text-slate-950 transition-all flex flex-col sm:flex-row items-center justify-center gap-1">
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
          </TabsList>

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 1: CONTROL REMOTO EN VIVO */}
          {/* ──────────────────────────────────────────────────────── */}
          <TabsContent value="control" className="space-y-6 outline-none">
            
            {/* ESTADO DE PANTALLA GIGANTE EN TIEMPO REAL */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${playlistPlaying && !forcedScreenItem ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]' : forcedScreenItem ? 'bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.5)]' : 'bg-rose-500'}`} />
                  <div>
                    <h3 className="font-black text-white text-base">
                      {playlistPlaying && !forcedScreenItem ? 'Modo: Rotación Automática' : forcedScreenItem ? `Modo: Proyección Fija (${forcedScreenItem.toUpperCase()})` : 'Muro Pausado'}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold leading-normal">
                      Controlá de forma remota e instantánea lo que se ve en la pantalla de la fiesta.
                    </p>
                  </div>
                </div>
                
                {/* BOTÓN PLAY/PAUSE REMOTO */}
                <Button
                  onClick={() => {
                    const next = !playlistPlaying;
                    setPlaylistPlaying(next);
                    sendRemoteCommand({ playlistPlaying: next });
                  }}
                  className={`w-full sm:w-auto px-6 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    playlistPlaying ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  }`}
                >
                  {playlistPlaying ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" /> Pausar Pantalla
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" /> Reanudar Pantalla
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 1. SELECCIONAR QUÉ PROYECTAR EN VIVO (FORZAR DIAPOSITIVA) */}
              <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-base font-black text-white flex items-center gap-2">
                    <Tv className="w-5 h-5 text-amber-400" /> Proyectar Diapositiva
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Hacé click para congelar la pantalla gigante en un contenido específico.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem(null);
                        sendRemoteCommand({ forcedScreenItem: null });
                      }}
                      className={`rounded-xl h-14 border-white/5 font-bold text-xs flex flex-col gap-1 ${
                        forcedScreenItem === null ? 'bg-amber-400 text-slate-950 hover:bg-amber-400/90 border-transparent' : 'bg-slate-950 text-white hover:bg-slate-900'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" /> Auto Playlist
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('mural');
                        sendRemoteCommand({ forcedScreenItem: 'mural' });
                      }}
                      className={`rounded-xl h-14 border-white/5 font-bold text-xs flex flex-col gap-1 ${
                        forcedScreenItem === 'mural' ? 'bg-amber-400 text-slate-950 hover:bg-amber-400/90 border-transparent' : 'bg-slate-950 text-white hover:bg-slate-900'
                      }`}
                    >
                      <Camera className="w-4 h-4" /> Muro de Fotos
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('chat');
                        sendRemoteCommand({ forcedScreenItem: 'chat' });
                      }}
                      className={`rounded-xl h-14 border-white/5 font-bold text-xs flex flex-col gap-1 ${
                        forcedScreenItem === 'chat' ? 'bg-amber-400 text-slate-950 hover:bg-amber-400/90 border-transparent' : 'bg-slate-950 text-white hover:bg-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" /> Chat en Vivo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('canciones');
                        sendRemoteCommand({ forcedScreenItem: 'canciones' });
                      }}
                      className={`rounded-xl h-14 border-white/5 font-bold text-xs flex flex-col gap-1 ${
                        forcedScreenItem === 'canciones' ? 'bg-amber-400 text-slate-950 hover:bg-amber-400/90 border-transparent' : 'bg-slate-950 text-white hover:bg-slate-900'
                      }`}
                    >
                      <Music className="w-4 h-4" /> Pedidos DJ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('dedicaciones');
                        sendRemoteCommand({ forcedScreenItem: 'dedicaciones' });
                      }}
                      className={`rounded-xl h-14 border-white/5 font-bold text-xs flex flex-col gap-1 ${
                        forcedScreenItem === 'dedicaciones' ? 'bg-amber-400 text-slate-950 hover:bg-amber-400/90 border-transparent' : 'bg-slate-950 text-white hover:bg-slate-900'
                      }`}
                    >
                      <Heart className="w-4 h-4" /> Dedicatorias
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('juego');
                        sendRemoteCommand({ forcedScreenItem: 'juego' });
                      }}
                      className={`rounded-xl h-14 border-white/5 font-bold text-xs flex flex-col gap-1 ${
                        forcedScreenItem === 'juego' ? 'bg-amber-400 text-slate-950 hover:bg-amber-400/90 border-transparent' : 'bg-slate-950 text-white hover:bg-slate-900'
                      }`}
                    >
                      <Tv className="w-4 h-4" /> Encuesta / Juego
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. ALTERNAR EL DISEÑO DE FOTOS EN VIVO (SLIDESHOW VS MASONRY) */}
              <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-base font-black text-white flex items-center gap-2">
                    <Layout className="w-5 h-5 text-amber-400" /> Diseño del Muro
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Elegí cómo se proyectan las fotos de tus invitados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 flex flex-col gap-3 justify-center h-[calc(100%-80px)]">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentLayout('slideshow');
                        sendRemoteCommand({ currentLayout: 'slideshow' });
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                        currentLayout === 'slideshow'
                          ? 'border-amber-400 bg-amber-400/5 text-amber-300'
                          : 'border-white/5 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-8 h-8" />
                      <span className="text-xs font-bold">Slideshow Polaroid</span>
                      <span className="text-[9px] text-slate-500 font-medium leading-tight">De a una foto gigante en 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentLayout('masonry');
                        sendRemoteCommand({ currentLayout: 'masonry' });
                      }}
                      className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                        currentLayout === 'masonry'
                          ? 'border-amber-400 bg-amber-400/5 text-amber-300'
                          : 'border-white/5 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-8 h-8" />
                      <span className="text-xs font-bold">Mosaico Fluido</span>
                      <span className="text-[9px] text-slate-500 font-medium leading-tight">Muro continuo con muchas fotos</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. MARQUESINA LED DE TEXTO EN VIVO */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-amber-400" /> Ticker LED / Marquesina Remota
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-slate-400">
                    Escribí mensajes especiales que fluyan por la pantalla de la fiesta.
                  </CardDescription>
                </div>
                <Switch
                  checked={ledMarqueeEnabled}
                  onCheckedChange={(checked) => {
                    setLedMarqueeEnabled(checked);
                    sendRemoteCommand({ ledMarqueeEnabled: checked });
                  }}
                />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: ¡Los novios agradecen su compañía! · ¡Feliz cumpleaños Claudia! · Barra abierta libre..."
                    value={ledMarqueeText}
                    onChange={(e) => setLedMarqueeText(e.target.value)}
                    className="rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 focus-visible:ring-amber-400 h-12"
                  />
                  <Button
                    onClick={() => {
                      setLedMarqueeEnabled(true);
                      sendRemoteCommand({
                        ledMarqueeText,
                        ledMarqueeEnabled: true
                      });
                      toast({ title: 'Marquesina enviada a pantalla 📡' });
                    }}
                    className="rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-500 font-bold px-6 h-12 shrink-0"
                  >
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 4. CONTROL DE SORTEOS CON RULETA REMOTA */}
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-white flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" /> Sorteo Sorpresa Remoto
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400">
                  Lanzá la ruleta en vivo y elegí un ganador de forma aleatoria o directa.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-300">Premio / Regalo</Label>
                    <Input
                      placeholder="Ej: Botella de Champagne · Remera AK"
                      value={sorteoPremio}
                      onChange={(e) => setSorteoPremio(e.target.value)}
                      className="rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-300">Ganador Forzado (Dejar vacío para azar)</Label>
                    <Input
                      placeholder="Ej: Juan Pérez (Forzar nombre)"
                      value={customWinnerName}
                      onChange={(e) => setCustomWinnerName(e.target.value)}
                      className="rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 h-11"
                    />
                  </div>
                </div>

                {/* STATUS DEL GANADOR DEL SORTEO */}
                {sorteoWinner && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">🎉 Ganador del Sorteo 🎉</p>
                    <p className="text-2xl font-black text-white">{sorteoWinner}</p>
                  </div>
                )}

                {/* BOTONERA ACCIÓN DE SORTEO */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={triggerSorteo}
                    disabled={isSpinning}
                    className="flex-1 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-500 font-extrabold h-12 text-sm flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
                  >
                    {isSpinning ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Girando Ruleta...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" /> ¡Girar Ruleta en Pantalla!
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearSorteo}
                    className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 h-12 px-6"
                  >
                    Limpiar Sorteo
                  </Button>
                </div>

              </CardContent>
            </Card>

          </TabsContent>

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 2: MODERACIÓN EXPRESS EN TIEMPO REAL */}
          {/* ──────────────────────────────────────────────────────── */}
          <TabsContent value="moderacion" className="space-y-6 outline-none">
            
            {/* SUB-TABS INTERNAS DE ESTADO */}
            <div className="flex gap-2 p-1.5 bg-slate-900 border border-white/5 rounded-2xl w-full max-w-md">
              {(['pending', 'approved', 'hidden'] as const).map((mode) => {
                const count = posts.filter(p => (p.moderationStatus ?? 'approved') === mode).length;
                const label = mode === 'pending' ? 'Pendientes' : mode === 'approved' ? 'En Muro' : 'Ocultas';
                return (
                  <button
                    key={mode}
                    onClick={() => setModerationMode(mode)}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      moderationMode === mode ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      moderationMode === mode ? 'bg-slate-950/20' : 'bg-slate-950/40 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* LISTADO DE FOTOS A MODERAR */}
            <div className="grid gap-4 sm:grid-cols-2">
              
              {/* COLA VACÍA */}
              {moderationMode === 'pending' && pendingPosts.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-3 bg-slate-900/40 border border-dashed border-white/5 rounded-3xl">
                  <div className="text-5xl opacity-40">🎉</div>
                  <h4 className="text-white font-bold text-base">¡Todo moderado por ahora!</h4>
                  <p className="text-xs text-slate-500">Las fotos nuevas de los invitados aparecerán acá automáticamente.</p>
                </div>
              )}

              {moderationMode === 'approved' && approvedPosts.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-3 bg-slate-900/40 border border-dashed border-white/5 rounded-3xl">
                  <div className="text-5xl opacity-40">📸</div>
                  <h4 className="text-white font-bold text-base">Muro de fotos vacío</h4>
                  <p className="text-xs text-slate-500">Aprobá fotos desde la pestaña "Pendientes" para que salgan en pantalla.</p>
                </div>
              )}

              {moderationMode === 'hidden' && hiddenPosts.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-3 bg-slate-900/40 border border-dashed border-white/5 rounded-3xl">
                  <div className="text-5xl opacity-40">🛡️</div>
                  <h4 className="text-white font-bold text-base">Sin fotos ocultadas</h4>
                  <p className="text-xs text-slate-500">Las fotos que rechaces se guardarán en esta sección.</p>
                </div>
              )}

              {/* ITERAR FOTOS */}
              {(moderationMode === 'pending' ? pendingPosts : moderationMode === 'approved' ? approvedPosts : hiddenPosts).map((post) => {
                const isVideo = post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
                return (
                  <Card key={post.id} className="border-white/5 bg-slate-900/60 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
                    
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-950">
                      {isVideo ? (
                        <video src={post.imageUrl} className="h-full w-full object-cover" muted controls playsInline />
                      ) : (
                        <NextImage src={post.imageUrl} alt={post.authorName} fill className="object-cover" unoptimized />
                      )}
                      
                      {/* Author Tag Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                        <span className="text-xs font-bold text-amber-300">@ {post.authorName}</span>
                        {post.dedication && (
                          <p className="text-[11px] text-white/80 line-clamp-2 mt-0.5 font-medium">"{post.dedication}"</p>
                        )}
                        {post.drinkName && (
                          <div className="inline-flex items-center gap-1 bg-rose-600/90 text-[9px] font-black uppercase text-white px-2 py-0.5 rounded-full mt-1.5">
                            🍹 {post.drinkName}
                          </div>
                        )}
                      </div>
                    </div>

                    <CardFooter className="p-3 bg-slate-950 flex gap-2 justify-end">
                      {moderationMode === 'pending' ? (
                        <>
                          <Button
                            onClick={() => handleModerate(post.id, 'hidden')}
                            disabled={moderatingId === post.id}
                            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1 h-10"
                          >
                            <X className="w-4 h-4" /> Rechazar
                          </Button>
                          <Button
                            onClick={() => handleModerate(post.id, 'approved')}
                            disabled={moderatingId === post.id}
                            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs gap-1 h-10"
                          >
                            <Check className="w-4 h-4" /> Aprobar
                          </Button>
                        </>
                      ) : moderationMode === 'approved' ? (
                        <Button
                          onClick={() => handleModerate(post.id, 'hidden')}
                          disabled={moderatingId === post.id}
                          className="w-full rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 font-bold text-xs gap-1.5 h-10"
                        >
                          <X className="w-4 h-4" /> Ocultar de la Pantalla
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleModerate(post.id, 'approved')}
                          disabled={moderatingId === post.id}
                          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs gap-1.5 h-10"
                        >
                          <Check className="w-4 h-4" /> Aprobar / Mostrar
                        </Button>
                      )}
                    </CardFooter>

                  </Card>
                );
              })}

            </div>

          </TabsContent>

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 3: DISEÑO Y APARIENCIA */}
          {/* ──────────────────────────────────────────────────────── */}
          <TabsContent value="diseno" className="space-y-6 outline-none">
            
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-white flex items-center gap-2">
                  <Palette className="w-5 h-5" style={{ color: accentColor }} /> Personalización Visual del Muro
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400">
                  Establecé el nombre del evento y ajustá los colores a tu temática.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">

                {/* Título y Subtítulo */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-bold text-slate-300">Título Principal</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={fiesta.configuracion?.nombreEvento || 'Nuestra Fiesta'}
                      className="rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 h-11"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-bold text-slate-300">Subtítulo / Bajada</Label>
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="¡Compartí tus fotos en vivo!"
                      className="rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 h-11"
                    />
                  </div>
                </div>

                {/* Foto de portada url */}
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-slate-300">URL de Imagen de Portada del Portal</Label>
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://ejemplo.com/portada.jpg"
                    className="rounded-xl border-white/10 bg-slate-950 text-white placeholder-slate-500 h-11"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold">Portada que verán los invitados arriba de su feed móvil al ingresar.</p>
                </div>

                {/* Modo Oscuro de Pantalla Gigante */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="space-y-0.5 text-left flex-1">
                    <Label className="text-sm font-bold text-white">Fondo Oscuro de Proyección</Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Cuando esté activo, la pantalla gigante tendrá un diseño nocturno premium de HSL tailored. Si se desactiva pasará a un modo claro elegante.
                    </p>
                  </div>
                  <Switch checked={screenDarkMode} onCheckedChange={setScreenDarkMode} />
                </div>

                {/* Color de Acento */}
                <div className="space-y-3 pt-4 border-t border-white/5 text-left">
                  <Label className="text-xs font-bold text-slate-300">Color de Acento del Portal</Label>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_PRESET_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setAccentColor(c.value)}
                        className="h-8 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: accentColor === c.value ? c.value : 'transparent',
                          color: accentColor === c.value ? '#020617' : '#94a3b8',
                          borderColor: accentColor === c.value ? c.value : 'rgba(255,255,255,0.08)'
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-20 p-1 rounded-xl cursor-pointer border-white/10 bg-slate-950"
                    />
                    <span className="text-xs font-semibold text-slate-400">Color elegido: <strong style={{ color: accentColor }}>{accentColor}</strong></span>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="p-6 bg-slate-900/20 border-t border-white/5 flex justify-end">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor, color: '#020617' }}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>

          </TabsContent>

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 4: MÓDULOS DE INVITADOS Y PERMISOS */}
          {/* ──────────────────────────────────────────────────────── */}
          <TabsContent value="modulos" className="space-y-6 outline-none">
            
            <Card className="border-white/5 bg-slate-900/60 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-white flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-amber-400" /> Permisos y Toggles Operativos
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-slate-400">
                  Prendé o apagá los distintos módulos interactivos de los invitados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-white/5 space-y-4">

                {/* Red Social General Switch */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-amber-400" /> Red Social Habilitada
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Si se apaga, los invitados no podrán ingresar al portal ni interactuar con la pantalla gigante.
                    </p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                {/* Permitir Subidas */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-slate-400" /> Permitir Subir Fotos y Videos
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Habilita la cámara en el portal de los invitados para que envíen sus fotos en vivo.
                    </p>
                  </div>
                  <Switch checked={uploadsActive} onCheckedChange={setUploadsActive} />
                </div>

                {/* Chat en vivo */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-slate-400" /> Chat en Vivo / Mensajería
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Habilita la solapa de conversación general para los invitados.
                    </p>
                  </div>
                  <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
                </div>

                {/* Pedido de Música */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-slate-400" /> Sugerencias de Música al DJ
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Permite que la gente pida canciones directamente al panel del DJ de la fiesta.
                    </p>
                  </div>
                  <Switch checked={showSongRequests} onCheckedChange={setShowSongRequests} />
                </div>

                {/* Dedicatorias */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-slate-400" /> Dedicatorias y Audios de Voz
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Muestra el formulario para enviar dedicatorias escritas y audios de felicitación.
                    </p>
                  </div>
                  <Switch checked={showDedications} onCheckedChange={setShowDedications} />
                </div>

                {/* Buzón Privado */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      🔐 Modo Buzón 100% Privado
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Las dedicatorias y mensajes de voz NO se proyectarán en la pantalla gigante; irán de forma confidencial y directa al celular de los novios.
                    </p>
                  </div>
                  <Switch checked={privateDedicationsMode} onCheckedChange={setPrivateDedicationsMode} />
                </div>

                {/* Moderación activa */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-white flex items-center gap-1.5">
                      🛡️ Moderación Previa Exigida
                    </Label>
                    <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                      Las fotos quedan retenidas en la cola "Pendientes" hasta que las apruebes de forma manual para salir a la pantalla.
                    </p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>

              </CardContent>
              <CardFooter className="p-6 bg-slate-900/20 border-t border-white/5 flex justify-end">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: accentColor, color: '#020617' }}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Guardar Permisos
                </Button>
              </CardFooter>
            </Card>

          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
