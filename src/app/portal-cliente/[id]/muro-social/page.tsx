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
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <span className="ml-3 text-sm font-semibold tracking-wider text-muted-foreground">Cargando Centro de Control...</span>
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="max-w-md text-center rounded-xl border-destructive/30 bg-destructive/10 text-foreground p-6">
        <CardContent className="pt-6 space-y-4">
          <Info className="w-12 h-12 mx-auto text-destructive" />
          <p className="text-destructive font-bold text-lg">{error ?? 'Error de autenticación.'}</p>
          <Button variant="outline" className="mt-4 rounded-lg border-border" onClick={() => router.back()}>
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
    <div className="min-h-screen bg-background text-foreground font-sans pb-12">
      {/* HEADER INTEGRADO */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-lg border-border bg-muted/20 text-foreground hover:bg-muted/40 h-10 w-10">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black uppercase tracking-widest text-primary">En Vivo</span>
                <span className="text-xs font-semibold text-muted-foreground">{fiesta.configuracion?.nombreEvento}</span>
              </div>
              <h1 className="text-lg font-black text-foreground leading-tight">Centro de Control Muro</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <a href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank" rel="noopener noreferrer" title="Ver Pantalla de Proyección">
              <Button size="sm" className="rounded-lg gap-1.5 text-xs font-bold">
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
          <TabsList className="grid h-auto min-h-14 w-full shrink-0 grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 sm:grid-cols-4">
            <TabsTrigger value="control" aria-label="Control Vivo" className="flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4" />
              <span>Control Vivo</span>
            </TabsTrigger>
            <TabsTrigger value="moderacion" aria-label="Moderar" className="flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <div className="relative">
                <Camera className="w-4 h-4" />
                {pendingPosts.length > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-destructive px-1 text-xs font-black text-destructive-foreground">
                    {pendingPosts.length}
                  </span>
                )}
              </div>
              <span>Moderar</span>
            </TabsTrigger>
            <TabsTrigger value="diseno" aria-label="Diseño" className="flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="w-4 h-4" />
              <span>Diseño</span>
            </TabsTrigger>
            <TabsTrigger value="modulos" aria-label="Módulos" className="flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Settings2 className="w-4 h-4" />
              <span>Módulos</span>
            </TabsTrigger>
          </TabsList>

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 1: CONTROL REMOTO EN VIVO */}
          {/* ──────────────────────────────────────────────────────── */}
          <TabsContent value="control" className="space-y-6 outline-none">
            
            {/* ESTADO DE PANTALLA GIGANTE EN TIEMPO REAL */}
            <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${playlistPlaying && !forcedScreenItem ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : forcedScreenItem ? 'bg-primary shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 'bg-destructive'}`} />
                  <div>
                    <h3 className="font-black text-foreground text-base">
                      {playlistPlaying && !forcedScreenItem ? 'Modo: Rotación Automática' : forcedScreenItem ? `Modo: Proyección Fija (${forcedScreenItem.toUpperCase()})` : 'Muro Pausado'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold leading-normal">
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
                  variant={playlistPlaying ? 'outline' : 'default'}
                  className={`w-full sm:w-auto px-6 h-11 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    playlistPlaying ? 'text-destructive border-destructive/30 hover:bg-destructive/10' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {playlistPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" /> Pausar Pantalla
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Reanudar Pantalla
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 1. SELECCIONAR QUÉ PROYECTAR EN VIVO (FORZAR DIAPOSITIVA) */}
              <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                    <Tv className="w-5 h-5 text-primary" /> Proyectar Diapositiva
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-muted-foreground">
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
                      className={`rounded-lg h-12 font-bold text-xs flex flex-col gap-1 border-border ${
                        forcedScreenItem === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Auto Playlist
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('mural');
                        sendRemoteCommand({ forcedScreenItem: 'mural' });
                      }}
                      className={`rounded-lg h-12 font-bold text-xs flex flex-col gap-1 border-border ${
                        forcedScreenItem === 'mural' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" /> Muro de Fotos
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('chat');
                        sendRemoteCommand({ forcedScreenItem: 'chat' });
                      }}
                      className={`rounded-lg h-12 font-bold text-xs flex flex-col gap-1 border-border ${
                        forcedScreenItem === 'chat' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat en Vivo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('canciones');
                        sendRemoteCommand({ forcedScreenItem: 'canciones' });
                      }}
                      className={`rounded-lg h-12 font-bold text-xs flex flex-col gap-1 border-border ${
                        forcedScreenItem === 'canciones' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" /> Pedidos DJ
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('dedicaciones');
                        sendRemoteCommand({ forcedScreenItem: 'dedicaciones' });
                      }}
                      className={`rounded-lg h-12 font-bold text-xs flex flex-col gap-1 border-border ${
                        forcedScreenItem === 'dedicaciones' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5" /> Dedicatorias
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setForcedScreenItem('juego');
                        sendRemoteCommand({ forcedScreenItem: 'juego' });
                      }}
                      className={`rounded-lg h-12 font-bold text-xs flex flex-col gap-1 border-border ${
                        forcedScreenItem === 'juego' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/20 text-foreground hover:bg-muted/40'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" /> Encuesta / Juego
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 2. ALTERNAR EL DISEÑO DE FOTOS EN VIVO (SLIDESHOW VS MASONRY) */}
              <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                    <Layout className="w-5 h-5 text-primary" /> Diseño del Muro
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-muted-foreground">
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
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                        currentLayout === 'slideshow'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Layers className="w-7 h-7" />
                      <span className="text-xs font-bold">Slideshow Polaroid</span>
                      <span className="text-[11px] font-medium leading-tight text-muted-foreground">De a una foto gigante en 3D</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentLayout('masonry');
                        sendRemoteCommand({ currentLayout: 'masonry' });
                      }}
                      className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                        currentLayout === 'masonry'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <LayoutGrid className="w-7 h-7" />
                      <span className="text-xs font-bold">Mosaico Fluido</span>
                      <span className="text-[11px] font-medium leading-tight text-muted-foreground">Muro continuo con muchas fotos</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. MARQUESINA LED DE TEXTO EN VIVO */}
            <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" /> Ticker LED / Marquesina Remota
                  </CardTitle>
                  <CardDescription className="text-xs font-semibold text-muted-foreground">
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
                    className="rounded-lg border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary h-11"
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
                    className="rounded-lg font-bold px-6 h-11 shrink-0"
                  >
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 4. CONTROL DE SORTEOS CON RULETA REMOTA */}
            <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" /> Sorteo Sorpresa Remoto
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground">
                  Lanzá la ruleta en vivo y elegí un ganador de forma aleatoria o directa.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Premio / Regalo</Label>
                    <Input
                      placeholder="Ej: Botella de Champagne · Remera AK"
                      value={sorteoPremio}
                      onChange={(e) => setSorteoPremio(e.target.value)}
                      className="rounded-lg border-border bg-muted/20 text-foreground placeholder:text-muted-foreground h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">Ganador Forzado (Dejar vacío para azar)</Label>
                    <Input
                      placeholder="Ej: Juan Pérez (Forzar nombre)"
                      value={customWinnerName}
                      onChange={(e) => setCustomWinnerName(e.target.value)}
                      className="rounded-lg border-border bg-muted/20 text-foreground placeholder:text-muted-foreground h-11"
                    />
                  </div>
                </div>

                {/* STATUS DEL GANADOR DEL SORTEO */}
                {sorteoWinner && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                    <p className="mb-1 text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">🎉 Ganador del Sorteo 🎉</p>
                    <p className="text-2xl font-black text-foreground">{sorteoWinner}</p>
                  </div>
                )}

                {/* BOTONERA ACCIÓN DE SORTEO */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={triggerSorteo}
                    disabled={isSpinning}
                    className="flex-1 rounded-lg font-extrabold h-11 text-sm flex items-center justify-center gap-2"
                  >
                    {isSpinning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Girando Ruleta...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" /> ¡Girar Ruleta en Pantalla!
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearSorteo}
                    className="rounded-lg border-border h-11 px-6"
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
            <div className="flex gap-2 p-1.5 bg-muted/30 border border-border rounded-xl w-full max-w-md">
              {(['pending', 'approved', 'hidden'] as const).map((mode) => {
                const count = posts.filter(p => (p.moderationStatus ?? 'approved') === mode).length;
                const label = mode === 'pending' ? 'Pendientes' : mode === 'approved' ? 'En Muro' : 'Ocultas';
                return (
                  <button
                    key={mode}
                    onClick={() => setModerationMode(mode)}
                    className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      moderationMode === mode ? 'bg-primary text-primary-foreground font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-black ${
                      moderationMode === mode ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
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
                <div className="col-span-full py-16 text-center space-y-3 bg-muted/20 border border-dashed border-border rounded-xl">
                  <div className="text-5xl opacity-40">🎉</div>
                  <h4 className="text-foreground font-bold text-base">¡Todo moderado por ahora!</h4>
                  <p className="text-xs text-muted-foreground">Las fotos nuevas de los invitados aparecerán acá automáticamente.</p>
                </div>
              )}

              {moderationMode === 'approved' && approvedPosts.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-3 bg-muted/20 border border-dashed border-border rounded-xl">
                  <div className="text-5xl opacity-40">📸</div>
                  <h4 className="text-foreground font-bold text-base">Muro de fotos vacío</h4>
                  <p className="text-xs text-muted-foreground">Aprobá fotos desde la pestaña "Pendientes" para que salgan en pantalla.</p>
                </div>
              )}

              {moderationMode === 'hidden' && hiddenPosts.length === 0 && (
                <div className="col-span-full py-16 text-center space-y-3 bg-muted/20 border border-dashed border-border rounded-xl">
                  <div className="text-5xl opacity-40">🛡️</div>
                  <h4 className="text-foreground font-bold text-base">Sin fotos ocultadas</h4>
                  <p className="text-xs text-muted-foreground">Las fotos que rechaces se guardarán en esta sección.</p>
                </div>
              )}

              {/* ITERAR FOTOS */}
              {(moderationMode === 'pending' ? pendingPosts : moderationMode === 'approved' ? approvedPosts : hiddenPosts).map((post) => {
                const isVideo = post.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(post.imageUrl);
                return (
                  <Card key={post.id} className="border border-border bg-card rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                    
                    <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
                      {isVideo ? (
                        <video src={post.imageUrl} className="h-full w-full object-cover" muted controls playsInline />
                      ) : (
                        <NextImage src={post.imageUrl} alt={post.authorName} fill className="object-cover" unoptimized />
                      )}
                      
                      {/* Author Tag Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                        <span className="text-xs font-bold text-primary-foreground">@ {post.authorName}</span>
                        {post.dedication && (
                          <p className="mt-0.5 line-clamp-2 text-xs font-medium text-white/90">"{post.dedication}"</p>
                        )}
                        {post.drinkName && (
                          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-0.5 text-xs font-black uppercase text-destructive-foreground">
                            🍹 {post.drinkName}
                          </div>
                        )}
                      </div>
                    </div>

                    <CardFooter className="p-3 bg-muted/20 border-t border-border flex gap-2 justify-end">
                      {moderationMode === 'pending' ? (
                        <>
                          <Button
                            onClick={() => handleModerate(post.id, 'hidden')}
                            disabled={moderatingId === post.id}
                            variant="destructive"
                            className="flex-1 rounded-lg font-bold text-xs gap-1 h-9"
                          >
                            <X className="w-4 h-4" /> Rechazar
                          </Button>
                          <Button
                            onClick={() => handleModerate(post.id, 'approved')}
                            disabled={moderatingId === post.id}
                            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1 h-9"
                          >
                            <Check className="w-4 h-4" /> Aprobar
                          </Button>
                        </>
                      ) : moderationMode === 'approved' ? (
                        <Button
                          onClick={() => handleModerate(post.id, 'hidden')}
                          disabled={moderatingId === post.id}
                          variant="outline"
                          className="w-full rounded-lg text-destructive border-destructive/20 hover:bg-destructive/10 font-bold text-xs gap-1.5 h-9"
                        >
                          <X className="w-4 h-4" /> Ocultar de la Pantalla
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleModerate(post.id, 'approved')}
                          disabled={moderatingId === post.id}
                          className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-9"
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
            
            <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" /> Personalización Visual del Muro
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground">
                  Establecé el nombre del evento y ajustá los colores a tu temática.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">

                {/* Título y Subtítulo */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-bold text-foreground">Título Principal</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={fiesta.configuracion?.nombreEvento || 'Nuestra Fiesta'}
                      className="rounded-lg border-border bg-muted/20 text-foreground placeholder:text-muted-foreground h-11"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-bold text-foreground">Subtítulo / Bajada</Label>
                    <Input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="¡Compartí tus fotos en vivo!"
                      className="rounded-lg border-border bg-muted/20 text-foreground placeholder:text-muted-foreground h-11"
                    />
                  </div>
                </div>

                {/* Foto de portada url */}
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-foreground">URL de Imagen de Portada del Portal</Label>
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://ejemplo.com/portada.jpg"
                    className="rounded-lg border-border bg-muted/20 text-foreground placeholder:text-muted-foreground h-11"
                  />
                  <p className="text-xs font-semibold text-muted-foreground">Portada que verán los invitados arriba de su feed móvil al ingresar.</p>
                </div>

                {/* Modo Oscuro de Pantalla Gigante */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5 text-left flex-1">
                    <Label className="text-sm font-bold text-foreground">Fondo Oscuro de Proyección</Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Cuando esté activo, la pantalla gigante tendrá un diseño nocturno adaptado. Si se desactiva pasará a un modo claro elegante.
                    </p>
                  </div>
                  <Switch checked={screenDarkMode} onCheckedChange={setScreenDarkMode} />
                </div>

                {/* Color de Acento */}
                <div className="space-y-3 pt-4 border-t border-border text-left">
                  <Label className="text-xs font-bold text-foreground">Color de Acento del Portal</Label>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_PRESET_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setAccentColor(c.value)}
                        className="h-8 rounded-lg border px-3 text-xs font-black uppercase tracking-wider transition-all"
                        style={{
                          backgroundColor: accentColor === c.value ? c.value : 'transparent',
                          color: accentColor === c.value ? '#ffffff' : 'inherit',
                          borderColor: accentColor === c.value ? c.value : 'var(--border)'
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
                      className="h-10 w-20 p-1 rounded-lg cursor-pointer border-border bg-muted/20"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">Color elegido: <strong style={{ color: accentColor }}>{accentColor}</strong></span>
                  </div>
                </div>

              </CardContent>
              <CardFooter className="p-6 bg-muted/20 border-t border-border flex justify-end">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 h-11 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>

          </TabsContent>

          {/* ──────────────────────────────────────────────────────── */}
          {/* TAB 4: MÓDULOS DE INVITADOS Y PERMISOS */}
          {/* ──────────────────────────────────────────────────────── */}
          <TabsContent value="modulos" className="space-y-6 outline-none">
            
            <Card className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" /> Permisos y Toggles Operativos
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-muted-foreground">
                  Prendé o apagá los distintos módulos interactivos de los invitados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-border space-y-4">

                {/* Red Social General Switch */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-primary" /> Red Social Habilitada
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Si se apaga, los invitados no podrán ingresar al portal ni interactuar con la pantalla gigante.
                    </p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                {/* Permitir Subidas */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-muted-foreground" /> Permitir Subir Fotos y Videos
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Habilita la cámara en el portal de los invitados para que envíen sus fotos en vivo.
                    </p>
                  </div>
                  <Switch checked={uploadsActive} onCheckedChange={setUploadsActive} />
                </div>

                {/* Chat en vivo */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" /> Chat en Vivo / Mensajería
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Habilita la solapa de conversación general para los invitados.
                    </p>
                  </div>
                  <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} />
                </div>

                {/* Pedido de Música */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-muted-foreground" /> Sugerencias de Música al DJ
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Permite que la gente pida canciones directamente al panel del DJ de la fiesta.
                    </p>
                  </div>
                  <Switch checked={showSongRequests} onCheckedChange={setShowSongRequests} />
                </div>

                {/* Dedicatorias */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-muted-foreground" /> Dedicatorias y Audios de Voz
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Muestra el formulario para enviar dedicatorias escritas y audios de felicitación.
                    </p>
                  </div>
                  <Switch checked={showDedications} onCheckedChange={setShowDedications} />
                </div>

                {/* Buzón Privado */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      🔐 Modo Buzón 100% Privado
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Las dedicatorias y mensajes de voz NO se proyectarán en la pantalla gigante; irán de forma confidencial y directa al celular de los novios.
                    </p>
                  </div>
                  <Switch checked={privateDedicationsMode} onCheckedChange={setPrivateDedicationsMode} />
                </div>

                {/* Moderación activa */}
                <div className="flex items-center justify-between gap-4 pt-4">
                  <div className="space-y-0.5 flex-1 text-left">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      🛡️ Moderación Previa Exigida
                    </Label>
                    <p className="text-xs font-semibold leading-normal text-muted-foreground">
                      Las fotos quedan retenidas en la cola "Pendientes" hasta que las apruebes de forma manual para salir a la pantalla.
                    </p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>

              </CardContent>
              <CardFooter className="p-6 bg-muted/20 border-t border-border flex justify-end">
                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full sm:w-auto px-8 h-11 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
