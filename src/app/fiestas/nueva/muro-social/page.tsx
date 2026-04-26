'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, Camera, Gamepad2, GripVertical, Loader2, MinusCircle, Pause, Play, Plus, PlusCircle, QrCode, RotateCcw, Save, Send, SkipBack, SkipForward, Sparkles, Square, Trophy, Upload, X, Zap, Maximize2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateSocialGallerySettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { getSocialPosts } from '@/app/actions/social-gallery';
import type { ActiveGameData, ActiveGameType, FiestaEnPlanificacion, ScreenMediaAsset, ScreenPlaylistItem, SocialGalleryBrand, SocialGallerySettings } from '@/types/fiesta';
import { QRCodeSVG } from 'qrcode.react';
import { DEFAULT_MARKETING_TICKER_TEXT } from '@/lib/social-wall-defaults';
import {
  getGlobalScreenMediaLibrary,
  uploadScreenMediaAsset,
  playScreenPlaylist,
  pauseScreenPlaylist,
  nextScreenItem,
  prevScreenItem,
  setScreenLoop,
  updateLedMessage,
  updateLedConfig,
  triggerLiveMoment,
  updateScreenBrand,
  launchGame,
  clearActiveGame,
  triggerSorteoWinner,
  startSorteoSpinOnScreen,
  getMuroParticipantesForSorteo,
} from '@/app/actions/fiesta/screen-mode.actions';
import { createPoll, closePoll, getActivePoll } from '@/app/actions/social-interactive';
import { getInvitados } from '@/app/actions/fiesta/invitados.actions';
import type { SocialPoll } from '@/types/social-gallery';

const ADMIN_REFRESH_INTERVAL_MS = 3000;

const QUICK_MOMENTS = [
  { id: 'llegada-agasajados', nombre: 'Llegada de los agasajados', emoji: '🎉' },
  { id: 'corte-torta', nombre: 'Corte de Torta', emoji: '🎂' },
  { id: 'inicio-baile', nombre: 'Inicio del Baile', emoji: '🕺' },
];

/** Predefined game templates operators can launch with one click */
const GAME_TEMPLATES: Array<{
  type: ActiveGameType;
  label: string;
  emoji: string;
  title: string;
  subtitle?: string;
  options?: Array<{ id: string; text: string; emoji?: string }>;
  description: string;
}> = [
  {
    type: 'baileLibre',
    label: '¡Baile libre!',
    emoji: '🕺',
    title: '¡BAILE LIBRE!',
    subtitle: '¡Que empiece la fiesta!',
    description: 'Pantalla completa con animación de baile',
  },
  {
    type: 'siONo',
    label: 'Sí o No',
    emoji: '🤔',
    title: '¿Sí o No?',
    subtitle: '¡Los invitados deciden!',
    options: [{ id: 'si', text: 'Sí ✅' }, { id: 'no', text: 'No ❌' }],
    description: 'Pregunta con opciones Sí / No',
  },
  {
    type: 'verdadODesafio',
    label: 'Verdad o Desafío',
    emoji: '🎯',
    title: 'VERDAD O DESAFÍO',
    subtitle: '¿Qué elegís?',
    options: [{ id: 'verdad', text: 'Verdad 💬', emoji: '💬' }, { id: 'desafio', text: 'Desafío 🔥', emoji: '🔥' }],
    description: 'Clásico juego de fiesta',
  },
  {
    type: 'trivia',
    label: 'Trivia',
    emoji: '🧠',
    title: 'TRIVIA DEL EVENTO',
    subtitle: '¿Quién conoce más a los festejados?',
    description: 'Pregunta de trivia con opciones',
  },
  {
    type: 'encuesta',
    label: 'Encuesta rápida',
    emoji: '📊',
    title: 'ENCUESTA',
    description: 'Encuesta personalizada',
  },
  {
    type: 'preguntaAbierta',
    label: 'Pregunta',
    emoji: '💬',
    title: '¿Y VOS QUÉ DECÍS?',
    description: 'Muestra una pregunta en pantalla',
  },
];


const DEFAULT_SCREEN_PLAYLIST: ScreenPlaylistItem[] = [
  { id: 'item_video', type: 'video', title: 'Video publicitario', durationSeconds: 20, enabled: true, layout: 'auto' },
  { id: 'item_mural', type: 'mural', title: 'Mural de fotos', durationSeconds: 30, enabled: true, layout: 'auto' },
  {
    id: 'item_redes',
    type: 'redes',
    title: 'Pantalla de redes',
    durationSeconds: 15,
    enabled: true,
    layout: 'auto',
    socialTemplate: {
      templateId: 'vip',
      showInstagram: true,
      showTikTok: true,
      showWhatsApp: true,
      showFacebook: false,
      ctaText: 'Seguinos y escaneá el QR',
    },
  },
];

function withScreenDefaults(settings: SocialGallerySettings): SocialGallerySettings {
  return {
    ...settings,
    screenMode: {
      enabled: settings.screenMode?.enabled ?? true,
      loop: settings.screenMode?.loop ?? true,
      isPlaying: settings.screenMode?.isPlaying ?? true,
      currentItemIndex: settings.screenMode?.currentItemIndex ?? 0,
      startedAt: settings.screenMode?.startedAt,
      playlist: settings.screenMode?.playlist?.length ? settings.screenMode.playlist : DEFAULT_SCREEN_PLAYLIST,
    },
    screenMediaLibrary: settings.screenMediaLibrary ?? [],
  };
}

function generatePlaylistItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `playlist_${crypto.randomUUID()}`;
  }
  return `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function MuroSocialContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const router = useRouter();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [settings, setSettings] = useState<SocialGallerySettings>({
    enabled: true,
    allowLikes: true,
    allowComments: true,
    uploadsActive: true,
    chatEnabled: true,
    showPolls: true,
    showSongRequests: true,
    showDedications: true,
    marketingTickerText: DEFAULT_MARKETING_TICKER_TEXT,
    ledMarqueeText: '',
    screenMode: {
      enabled: true,
      loop: true,
      isPlaying: true,
      currentItemIndex: 0,
      playlist: DEFAULT_SCREEN_PLAYLIST,
    },
    screenMediaLibrary: [],
  });
  // Ref always reflects the latest settings value; used in async callbacks to avoid
  // stale closure issues without relying on synchronous setState execution.
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLed, setIsSavingLed] = useState(false);
  const [isPlayAction, setIsPlayAction] = useState(false);
  const [globalLibrary, setGlobalLibrary] = useState<ScreenMediaAsset[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [akBrandSettings, setAkBrandSettings] = useState<SocialGalleryBrand>({});
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [postCount, setPostCount] = useState<number | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);
  const [isLaunchingGame, setIsLaunchingGame] = useState(false);
  const [gameCustomTitle, setGameCustomTitle] = useState('');
  const [gameCustomSubtitle, setGameCustomSubtitle] = useState('');
  const [gameCustomOptions, setGameCustomOptions] = useState('');
  const [selectedGameTemplate, setSelectedGameTemplate] = useState<typeof GAME_TEMPLATES[number] | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lightweight auto-refresh: refreshes only status data (activeGame, postCount)
  // WITHOUT overwriting user-editable settings state, which would revert unsaved changes.
  const refreshStatus = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) return;
      const sg = fiestaData.socialGallerySettings;
      if (sg) {
        // Only update active game — do NOT overwrite settings to prevent toggled/edited
        // values from being reverted by the background refresh before the user saves.
        setActiveGame(sg.activeGame ?? null);
        // Keep the screenMode playing/index badge in sync without touching user-edited fields
        setSettings((prev) => ({
          ...prev,
          screenMode: {
            ...(prev.screenMode ?? {}),
            isPlaying: sg.screenMode?.isPlaying ?? prev.screenMode?.isPlaying ?? true,
            currentItemIndex: sg.screenMode?.currentItemIndex ?? prev.screenMode?.currentItemIndex ?? 0,
          } as SocialGallerySettings['screenMode'],
          // Keep sorteo followers count current (read-only, not user-editable)
          sorteoParticipantesRedes: sg.sorteoParticipantesRedes ?? prev.sorteoParticipantesRedes,
        }));
      }
      const posts = await getSocialPosts(fiestaId);
      setPostCount(posts.length);
    } catch (error) {
      // Silent fail during background refresh — log for debugging
      console.error('[MuroSocial] Background refresh failed:', error);
    }
  }, [fiestaId]);

  // Games state
  const [activePoll, setActivePoll] = useState<SocialPoll | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [isClosingPoll, setIsClosingPoll] = useState(false);
  const [isTriggeringSorteo, setIsTriggeringSorteo] = useState(false);
  const [sorteoParticipants, setSorteoParticipants] = useState<string>('');
  const [lastSorteoWinner, setLastSorteoWinner] = useState<string | null>(null);
  // Spinning wheel state
  const [sorteoIsSpinning, setSorteoIsSpinning] = useState(false);
  const [sorteoWheelAngle, setSorteoWheelAngle] = useState(0);
  const [sorteoPreviewWinner, setSorteoPreviewWinner] = useState<string | null>(null);
  const [sorteoPremio, setSorteoPremio] = useState('');
  const [uploadingCoverPhoto, setUploadingCoverPhoto] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      router.push('/eventos');
      return;
    }
    setIsLoading(true);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error('Fiesta no encontrada.');
      setFiesta(fiestaData);
      setSettings(withScreenDefaults({
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        chatEnabled: true,
        showPolls: true,
        showSongRequests: true,
        showDedications: true,
        marketingTickerText: DEFAULT_MARKETING_TICKER_TEXT,
        ledMarqueeText: '',
        ...(fiestaData.socialGallerySettings || {}),
      }));
      if (fiestaData.socialGallerySettings?.brand) {
        setAkBrandSettings(fiestaData.socialGallerySettings.brand);
      }
      setActiveGame(fiestaData.socialGallerySettings?.activeGame ?? null);
      const globalAssets = await getGlobalScreenMediaLibrary();
      setGlobalLibrary(globalAssets);
      // Load active poll independently to avoid blocking the main data load
      try {
        const pollData = await getActivePoll(fiestaId);
        setActivePoll(pollData);
      } catch {
        setActivePoll(null);
      }
      // Load photo count for admin status panel
      try {
        const posts = await getSocialPosts(fiestaId);
        setPostCount(posts.length);
      } catch {
        setPostCount(null);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, router, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh admin status panel
  useEffect(() => {
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    refreshIntervalRef.current = setInterval(refreshStatus, ADMIN_REFRESH_INTERVAL_MS);
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [refreshStatus]);

  const socialWallLink = useMemo(() => {
    if (!fiestaId || typeof window === 'undefined') return '';
    return `${window.location.origin}/evento/social/${fiestaId}`;
  }, [fiestaId]);
  const projectionLink = useMemo(() => {
    if (!fiestaId || typeof window === 'undefined') return '';
    return `${window.location.origin}/evento/muro-en-vivo/${fiestaId}`;
  }, [fiestaId]);

  const saveSettings = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, settings);
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Configuración guardada' });
    } else {
      toast({ title: 'Error al guardar', description: result.error, variant: 'destructive' });
    }
  };

  const saveLedText = async () => {
    if (!fiestaId) return;
    setIsSavingLed(true);
    const result = await updateLedConfig(fiestaId, {
      text: settings.ledMarqueeText ?? '',
      enabled: settings.ledMarqueeEnabled !== false,
      color: settings.ledMarqueeColor,
      bgColor: settings.ledMarqueeBgColor,
    });
    setIsSavingLed(false);
    if (result.success) {
      toast({ title: 'Cartel LED enviado ✓', description: 'El texto se actualizó en la pantalla en vivo.' });
      await loadData();
    } else {
      toast({ title: 'Error al enviar cartel LED', description: result.error, variant: 'destructive' });
    }
  };

  const handleUploadCoverPhoto = async (file: File | null) => {
    if (!fiestaId || !file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Solo se aceptan imágenes', variant: 'destructive' });
      return;
    }
    setUploadingCoverPhoto(true);
    try {
      // Re-use uploadScreenMediaAsset but then set mobileControlCoverUrl to the uploaded URL
      const res = await uploadScreenMediaAsset(fiestaId, file);
      if (!res.success || !res.asset) throw new Error(res.error || 'No se pudo subir la imagen.');
      const updated = { ...settingsRef.current, mobileControlCoverUrl: res.asset.url };
      setSettings(updated);
      const result = await updateSocialGallerySettingsFiestaActual(fiestaId, updated);
      if (result.success) {
        toast({ title: 'Portada actualizada ✓' });
      } else {
        toast({ title: 'Error al guardar portada', description: result.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error al subir portada', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingCoverPhoto(false);
    }
  };

  const saveMarketingText = async () => {
    if (!fiestaId) return;
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, settings);
    if (result.success) {
      toast({ title: 'Texto de marketing actualizado ✓', description: 'El zócalo se actualizó en la pantalla en vivo.' });
    } else {
      toast({ title: 'Error al guardar', description: result.error, variant: 'destructive' });
    }
  };

  /** Auto-saves a single boolean toggle to Firestore immediately so it cannot be
   *  reverted by the background refreshStatus polling cycle. */
  const handleToggleSetting = useCallback(async (key: keyof SocialGallerySettings, checked: boolean) => {
    if (!fiestaId) return;
    // Apply optimistic update to local state
    setSettings((prev) => ({ ...prev, [key]: checked }));
    // Use the ref to get the current settings snapshot for Firestore (avoids stale closure)
    const updatedSettings = { ...settingsRef.current, [key]: checked };
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, updatedSettings);
    if (!result.success) {
      toast({ title: 'Error al guardar', description: result.error, variant: 'destructive' });
      // Revert on failure
      setSettings((prev) => ({ ...prev, [key]: !checked }));
    }
  }, [fiestaId, toast]);

  const triggerMoment = async (momentToTrigger: (typeof QUICK_MOMENTS)[number]) => {
    if (!fiestaId) return;
    const result = await triggerLiveMoment(fiestaId, { id: momentToTrigger.id, nombre: momentToTrigger.nombre, emoji: momentToTrigger.emoji });
    if (result.success) {
      toast({ title: `Momento lanzado: ${momentToTrigger.nombre}` });
      await loadData();
    } else {
      toast({ title: 'Error al disparar momento', description: result.error, variant: 'destructive' });
    }
  };

  const handleLaunchGame = async (template: typeof GAME_TEMPLATES[number]) => {
    if (!fiestaId) return;
    setIsLaunchingGame(true);
    // If user filled in a custom title, use it; otherwise use template defaults
    const title = (selectedGameTemplate?.type === template.type && gameCustomTitle.trim())
      ? gameCustomTitle.trim()
      : template.title;
    const subtitle = (selectedGameTemplate?.type === template.type && gameCustomSubtitle.trim())
      ? gameCustomSubtitle.trim()
      : template.subtitle;
    let options = template.options;
    if (selectedGameTemplate?.type === template.type && gameCustomOptions.trim()) {
      options = gameCustomOptions
        .split('\n')
        .map((o, i) => ({ id: `opt_${i}`, text: o.trim() }))
        .filter(o => o.text);
    }
    const game: Omit<ActiveGameData, 'launchedAt'> = {
      type: template.type,
      title,
      ...(subtitle ? { subtitle } : {}),
      ...(options && options.length > 0 ? { options } : {}),
    };
    const result = await launchGame(fiestaId, game);
    setIsLaunchingGame(false);
    if (result.success) {
      toast({ title: `Juego lanzado: ${template.label} 🎮`, description: 'Aparece en la pantalla gigante ahora.' });
      setSelectedGameTemplate(null);
      setGameCustomTitle('');
      setGameCustomSubtitle('');
      setGameCustomOptions('');
      await refreshStatus();
    } else {
      toast({ title: 'Error al lanzar juego', description: result.error, variant: 'destructive' });
    }
  };

  const handleClearGame = async () => {
    if (!fiestaId) return;
    setIsLaunchingGame(true);
    const result = await clearActiveGame(fiestaId);
    setIsLaunchingGame(false);
    if (result.success) {
      toast({ title: 'Juego detenido ⏹', description: 'La pantalla volvió al modo normal.' });
      await refreshStatus();
    } else {
      toast({ title: 'Error al detener juego', description: result.error, variant: 'destructive' });
    }
  };

  const handlePlay = async () => {
    if (!fiestaId) return;
    setIsPlayAction(true);
    const result = await playScreenPlaylist(fiestaId);
    setIsPlayAction(false);
    if (result.success) {
      toast({ title: 'Reproducción iniciada ▶' });
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handlePause = async () => {
    if (!fiestaId) return;
    setIsPlayAction(true);
    const result = await pauseScreenPlaylist(fiestaId);
    setIsPlayAction(false);
    if (result.success) {
      toast({ title: 'Pausa ⏸' });
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleNext = async () => {
    if (!fiestaId) return;
    const result = await nextScreenItem(fiestaId);
    if (result.success) {
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handlePrev = async () => {
    if (!fiestaId) return;
    const result = await prevScreenItem(fiestaId);
    if (result.success) {
      await loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleLoopChange = async (checked: boolean) => {
    if (!fiestaId) return;
    setSettings((prev) => withScreenDefaults({ ...prev, screenMode: { ...(prev.screenMode ?? {}), loop: checked } as SocialGallerySettings['screenMode'] }));
    const result = await setScreenLoop(fiestaId, checked);
    if (!result.success) {
      toast({ title: 'Error al cambiar loop', description: result.error, variant: 'destructive' });
      await loadData();
    }
  };

  const handleSaveBrand = async () => {
    if (!fiestaId) return;
    setIsSavingBrand(true);
    const result = await updateScreenBrand(fiestaId, akBrandSettings);
    setIsSavingBrand(false);
    if (result.success) {
      toast({ title: 'Marca AK guardada ✓', description: 'El branding se actualizó en la pantalla en vivo.' });
      await loadData();
    } else {
      toast({ title: 'Error al guardar marca', description: result.error, variant: 'destructive' });
    }
  };

  const handlePlaylistItemChange = useCallback((itemId: string, update: Partial<ScreenPlaylistItem>) => {
    setSettings((prev) => withScreenDefaults({
      ...prev,
      screenMode: {
        ...(prev.screenMode ?? { enabled: true, loop: true, isPlaying: true, currentItemIndex: 0, playlist: DEFAULT_SCREEN_PLAYLIST }),
        playlist: (prev.screenMode?.playlist ?? DEFAULT_SCREEN_PLAYLIST).map((item) =>
          item.id === itemId ? { ...item, ...update } : item
        ),
      },
    }));
  }, []);

  /** Auto-saves the enabled flag of a playlist item immediately to Firestore. */
  const handlePlaylistItemToggle = useCallback(async (itemId: string, enabled: boolean) => {
    if (!fiestaId) return;
    // Apply optimistic update to local state
    const updatedPlaylist = (settingsRef.current.screenMode?.playlist ?? DEFAULT_SCREEN_PLAYLIST).map(
      (item) => item.id === itemId ? { ...item, enabled } : item
    );
    const updatedSettings = withScreenDefaults({
      ...settingsRef.current,
      screenMode: {
        ...(settingsRef.current.screenMode ?? {}),
        playlist: updatedPlaylist,
      } as SocialGallerySettings['screenMode'],
    });
    setSettings(updatedSettings);
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, updatedSettings);
    if (!result.success) {
      toast({ title: 'Error al guardar ítem', description: result.error, variant: 'destructive' });
      handlePlaylistItemChange(itemId, { enabled: !enabled }); // Revert
    }
  }, [fiestaId, handlePlaylistItemChange, toast]);

  const reorderPlaylist = (startId: string, endId: string) => {
    setSettings((prev) => {
      const playlist = [...(prev.screenMode?.playlist ?? DEFAULT_SCREEN_PLAYLIST)];
      const from = playlist.findIndex((item) => item.id === startId);
      const to = playlist.findIndex((item) => item.id === endId);
      if (from === -1 || to === -1) return prev;
      const [moved] = playlist.splice(from, 1);
      playlist.splice(to, 0, moved);
      return withScreenDefaults({
        ...prev,
        screenMode: { ...(prev.screenMode ?? {}), playlist } as SocialGallerySettings['screenMode'],
      });
    });
  };

  const handleUploadMedia = async (file?: File | null) => {
    if (!fiestaId || !file) return;
    setUploadingMedia(true);
    try {
      const res = await uploadScreenMediaAsset(fiestaId, file);
      if (res.success && res.asset) {
        setSettings((prev) => withScreenDefaults({
          ...prev,
          screenMediaLibrary: [...(prev.screenMediaLibrary ?? []), res.asset!],
        }));
        setGlobalLibrary((prev) => [res.asset!, ...prev]);
        toast({ title: 'Medio subido', description: 'Disponible para la playlist de esta fiesta.' });
      } else {
        throw new Error(res.error || 'No se pudo subir el medio.');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateAndLaunchPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fiestaId) return;
    const opts = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || opts.length < 2) return;
    setIsCreatingPoll(true);
    const result = await createPoll(fiestaId, pollQuestion.trim(), opts);
    setIsCreatingPoll(false);
    if (result.success) {
      setActivePoll(result.poll ?? null);
      setPollQuestion('');
      setPollOptions(['', '']);
      toast({ title: '¡Trivia lanzada en pantalla! 🎯', description: 'Los invitados ya pueden votar desde su celular.' });
    } else {
      toast({ title: 'Error al lanzar trivia', description: result.error, variant: 'destructive' });
    }
  };

  const handleClosePoll = async () => {
    if (!fiestaId || !activePoll) return;
    setIsClosingPoll(true);
    const result = await closePoll(fiestaId, activePoll.id);
    setIsClosingPoll(false);
    if (result.success) {
      setActivePoll(null);
      toast({ title: 'Trivia cerrada' });
    } else {
      toast({ title: 'Error al cerrar trivia', description: result.error, variant: 'destructive' });
    }
  };

  const handleTriggerSorteo = async () => {
    if (!fiestaId) return;
    const participants = sorteoParticipants
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);
    if (participants.length === 0) {
      toast({ title: 'Sin participantes', description: 'Ingresá los nombres de los participantes (uno por línea).', variant: 'destructive' });
      return;
    }
    const winner = participants[Math.floor(Math.random() * participants.length)];
    // Animate the wheel before saving to Firestore
    setSorteoPreviewWinner(null);
    setSorteoIsSpinning(true);
    // Spin: random full rotations (5-8) plus the landing angle
    const spinRotations = 5 + Math.floor(Math.random() * 4);
    setSorteoWheelAngle(prev => prev + spinRotations * 360 + Math.floor(Math.random() * 360));
    // Also trigger spin animation on the big screen immediately
    await startSorteoSpinOnScreen(fiestaId);
    // After animation (2.8s), persist to Firestore and reveal winner
    setTimeout(async () => {
      setSorteoIsSpinning(false);
      setSorteoPreviewWinner(winner);
      setIsTriggeringSorteo(true);
      const result = await triggerSorteoWinner(fiestaId, winner, sorteoPremio.trim() || undefined);
      setIsTriggeringSorteo(false);
      if (result.success) {
        setLastSorteoWinner(winner);
        toast({ title: `🎉 ¡Ganador: ${winner}!`, description: 'El resultado se muestra ahora en la pantalla gigante (20 segundos).' });
      } else {
        toast({ title: 'Error al lanzar sorteo', description: result.error, variant: 'destructive' });
      }
    }, 2800);
  };

  const handleLoadInvitadosToSorteo = async () => {
    if (!fiestaId) return;
    try {
      const invitados = await getInvitados(fiestaId);
      // Use checked-in guests first; fall back to confirmed ones
      const eligible = invitados.filter(inv => inv.checkedIn || inv.rsvp === 'Confirmado');
      if (eligible.length === 0) {
        toast({ title: 'Sin invitados confirmados', description: 'No hay invitados con check-in o confirmados aún.', variant: 'destructive' });
        return;
      }
      setSorteoParticipants(eligible.map(inv => inv.nombre).join('\n'));
      toast({ title: `${eligible.length} invitados cargados`, description: 'Lista lista para el sorteo.' });
    } catch {
      toast({ title: 'Error al cargar invitados', variant: 'destructive' });
    }
  };

  const handleLoadMuroParticipantes = async () => {
    if (!fiestaId) return;
    const result = await getMuroParticipantesForSorteo(fiestaId);
    if (result.success && result.participantes && result.participantes.length > 0) {
      setSorteoParticipants(result.participantes.join('\n'));
      setSorteoPreviewWinner(null);
      toast({ title: `${result.participantes.length} participantes del muro cargados`, description: 'Solo se incluyen los que pusieron su nombre (no anónimos).' });
    } else if (result.success) {
      toast({ title: 'Sin participantes del muro', description: 'Nadie participó con nombre aún.', variant: 'destructive' });
    } else {
      toast({ title: 'Error al cargar participantes', description: result.error, variant: 'destructive' });
    }
  };

  const handleLoadRedesSeguidores = () => {
    const seguidores = (settings.sorteoParticipantesRedes ?? []);
    // Deduplicate by name (case-insensitive)
    const unique = Array.from(new Map(seguidores.map(s => [s.nombre.toLowerCase(), s.nombre])).values());
    if (unique.length === 0) {
      toast({ title: 'Sin seguidores registrados', description: 'Ningún invitado hizo clic en "Seguir" todavía.', variant: 'destructive' });
      return;
    }
    setSorteoParticipants(unique.join('\n'));
    setSorteoPreviewWinner(null);
    toast({ title: `${unique.length} seguidores de redes cargados`, description: 'Solo los que hicieron clic en Seguir desde su celular.' });
  };

  const addPlaylistItem = (type: ScreenPlaylistItem['type']) => {
    const id = generatePlaylistItemId();
    const defaults: Record<ScreenPlaylistItem['type'], Omit<ScreenPlaylistItem, 'id'>> = {
      video: { type: 'video', title: 'Video publicitario', durationSeconds: 20, enabled: true, layout: 'auto' },
      mural: { type: 'mural', title: 'Mural de fotos', durationSeconds: 30, enabled: true, layout: 'auto' },
      redes: {
        type: 'redes',
        title: 'Pantalla de redes',
        durationSeconds: 15,
        enabled: true,
        layout: 'auto',
        socialTemplate: {
          templateId: 'vip',
          showInstagram: true,
          showTikTok: true,
          showWhatsApp: true,
          showFacebook: false,
          ctaText: 'Seguinos',
        },
      },
      juego: { type: 'juego', title: 'Base de juego', durationSeconds: 15, enabled: true, layout: 'auto' },
    };
    setSettings((prev) => withScreenDefaults({
      ...prev,
      screenMode: {
        ...(prev.screenMode ?? { enabled: true, loop: true, isPlaying: true, currentItemIndex: 0, playlist: [] }),
        playlist: [...(prev.screenMode?.playlist ?? []), { id, ...defaults[type] }],
      },
    }));
  };

  if (isLoading || !fiesta) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Camera className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-black">Panel de Muro Social & Juegos</h1>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{fiesta.configuracion.nombreEvento}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
          <Button onClick={saveSettings} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Guardar</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Admin status panel */}
        <Card className="lg:col-span-2 bg-muted/40">
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Estado del muro</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1 font-mono text-xs">
                ID: {fiestaId}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs ${settings.enabled ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                <span className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                Muro {settings.enabled ? 'activo' : 'inactivo'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background border px-3 py-1 font-medium text-xs">
                📸 {postCount === null ? '…' : postCount} foto{postCount !== 1 ? 's' : ''}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs ${settings.screenMode?.isPlaying ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                {settings.screenMode?.isPlaying ? '▶ Pantalla reproduciendo' : '⏸ Pantalla pausada'}
                {settings.screenMode?.playlist?.length
                  ? ` · ítem ${(settings.screenMode.currentItemIndex ?? 0) + 1}/${settings.screenMode.playlist.filter(i => i.enabled).length}`
                  : ''}
              </span>
              {activeGame && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-xs bg-violet-100 text-violet-800 border border-violet-200">
                  🎮 Juego: {activeGame.title}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Link y QR del Muro</CardTitle>
            <CardDescription>Compartí estos enlaces con el cliente e invitados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Link participación</Label>
              <Input readOnly value={socialWallLink} />
            </div>
            <div className="space-y-1">
              <Label>Link pantalla en vivo</Label>
              <Input readOnly value={projectionLink} />
            </div>
            <div className="flex gap-8 pt-2">
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold uppercase">QR Único (Subir + Participar)</p>
                <QRCodeSVG value={socialWallLink || 'https://akproducciones.uy'} size={96} />
              </div>
              <div className="space-y-2 text-left max-w-xs">
                <p className="text-xs font-bold uppercase">Pantalla gigante</p>
                <p className="text-xs text-muted-foreground">
                  La pantalla se abre desde el panel del organizador. El QR para invitados siempre debe apuntar al muro de participación.
                </p>
              </div>
            </div>
            {/* Cover photo for mobile control */}
            <div className="space-y-1 pt-2 border-t">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Portada del control móvil (quinceañera / evento)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">Foto de portada que aparece en la pantalla de bienvenida del muro social para invitados.</p>
              {settings.mobileControlCoverUrl && (
                <div className="relative h-24 w-full rounded-lg overflow-hidden mb-2 border bg-slate-50">
                  <img src={settings.mobileControlCoverUrl} alt="Portada" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex gap-2 items-center">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCoverPhoto}
                  onChange={(e) => handleUploadCoverPhoto(e.target.files?.[0] ?? null)}
                  className="flex-1 text-xs"
                />
                {uploadingCoverPhoto && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              </div>
              {settings.mobileControlCoverUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={async () => {
                    const updated = { ...settingsRef.current, mobileControlCoverUrl: undefined };
                    setSettings(updated);
                    await updateSocialGallerySettingsFiestaActual(fiestaId!, updated);
                    toast({ title: 'Portada eliminada' });
                  }}
                >
                  Quitar portada
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funcionalidades</CardTitle>
            <CardDescription>Gestión centralizada del muro social y dinámicas de juego.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'enabled', label: 'Muro activo' },
              { key: 'uploadsActive', label: 'Subida de fotos' },
              { key: 'allowLikes', label: 'Me gusta' },
              { key: 'allowComments', label: 'Comentarios' },
              { key: 'chatEnabled', label: 'Chat en vivo' },
              { key: 'showPolls', label: 'Encuestas (juegos)' },
              { key: 'showSongRequests', label: 'Pedidos de canciones' },
              { key: 'showDedications', label: 'Dedicatorias' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm font-medium">{item.label}</span>
                <Switch
                  checked={Boolean(settings[item.key as keyof SocialGallerySettings])}
                  onCheckedChange={(checked) => handleToggleSetting(item.key as keyof SocialGallerySettings, checked)}
                />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2 bg-slate-950 text-white">
              <div>
                <span className="text-sm font-medium">🌙 Modo Oscuro (pantalla)</span>
                <p className="text-xs text-slate-400 mt-0.5">Fondo negro o blanco para la pantalla gigante</p>
              </div>
              <Switch
                checked={settings.screenDarkMode !== false}
                onCheckedChange={(checked) => handleToggleSetting('screenDarkMode', checked)}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-1 flex-wrap">
              <Link href={`/evento/social/${fiestaId}`} target="_blank"><Button variant="outline"><QrCode className="w-4 h-4 mr-2" />Abrir Muro/Control móvil</Button></Link>
              <Link href={`/evento/muro-en-vivo/${fiestaId}`} target="_blank"><Button variant="outline">Abrir Pantalla</Button></Link>
              <Button
                variant="outline"
                onClick={() => {
                  const url = `/evento/muro-en-vivo/${fiestaId}`;
                  const win = window.open(url, '_blank', 'noopener,noreferrer');
                  if (win) {
                    const requestFs = () => {
                      win.document.documentElement.requestFullscreen?.().catch(() => {});
                    };
                    if (win.document.readyState === 'complete') {
                      requestFs();
                    } else {
                      win.addEventListener('load', requestFs, { once: true });
                    }
                  }
                }}
              >
                <Maximize2 className="w-4 h-4 mr-2" />Pantalla Completa
              </Button>
              <Link href={`/evento/dj/${fiestaId}`} target="_blank"><Button variant="outline">🎧 Panel DJ</Button></Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketing y Cartel LED</CardTitle>
            <CardDescription>Texto para zócalo inferior y mensaje pasante tipo marquesina.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Zócalo de marketing (redes)</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.marketingTickerText ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, marketingTickerText: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveMarketingText(); } }}
                  placeholder={DEFAULT_MARKETING_TICKER_TEXT}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={saveMarketingText}
                  title="Enviar texto de marketing a pantalla ahora"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border p-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Cartel LED / Mensaje pasante</Label>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Activo</span>
                  <Switch
                    checked={settings.ledMarqueeEnabled !== false}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, ledMarqueeEnabled: checked }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  value={settings.ledMarqueeText ?? ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, ledMarqueeText: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveLedText(); } }}
                  placeholder="¡En 10 minutos cortamos la torta!"
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={saveLedText}
                  disabled={isSavingLed}
                  title="Enviar cartel LED a pantalla ahora"
                >
                  {isSavingLed ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs">Color del texto</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={settings.ledMarqueeColor || '#f0abfc'}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ledMarqueeColor: e.target.value }))}
                      className="w-10 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.ledMarqueeColor || '#f0abfc'}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ledMarqueeColor: e.target.value }))}
                      placeholder="#f0abfc"
                      className="flex-1 h-9 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color de fondo</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={settings.ledMarqueeBgColor || '#a855f7'}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ledMarqueeBgColor: e.target.value }))}
                      className="w-10 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.ledMarqueeBgColor || '#a855f7'}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ledMarqueeBgColor: e.target.value }))}
                      placeholder="#a855f7"
                      className="flex-1 h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Presioná Enter o el botón de envío para actualizar el cartel en la pantalla en vivo inmediatamente.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Modo Pantalla · Playlist por fiesta</CardTitle>
            <CardDescription>Secuencia configurable con video, mural, redes y bases de juegos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-4 gap-2">
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('video')}><Plus className="w-4 h-4 mr-2" />Video</Button>
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('mural')}><Plus className="w-4 h-4 mr-2" />Mural</Button>
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('redes')}><Plus className="w-4 h-4 mr-2" />Redes</Button>
              <Button type="button" variant="outline" onClick={() => addPlaylistItem('juego')}><Plus className="w-4 h-4 mr-2" />Juego</Button>
            </div>

            <div className="grid sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant={settings.screenMode?.isPlaying ? 'default' : 'outline'}
                onClick={handlePlay}
                disabled={isPlayAction}
              >
                {isPlayAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}Play
              </Button>
              <Button
                type="button"
                variant={!settings.screenMode?.isPlaying ? 'default' : 'outline'}
                onClick={handlePause}
                disabled={isPlayAction}
              >
                {isPlayAction ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pause className="w-4 h-4 mr-2" />}Pause
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
              >
                <SkipBack className="w-4 h-4 mr-2" />Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleNext}
              >
                <SkipForward className="w-4 h-4 mr-2" />Next
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm font-medium flex items-center gap-2"><RotateCcw className="w-4 h-4" />Loop</span>
              <Switch
                checked={settings.screenMode?.loop ?? true}
                onCheckedChange={handleLoopChange}
              />
            </div>

            <div className="space-y-2">
              {(settings.screenMode?.playlist ?? []).map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggingId && draggingId !== item.id) reorderPlaylist(draggingId, item.id);
                    setDraggingId(null);
                  }}
                  className="grid md:grid-cols-[24px_1fr_80px_120px_1fr] gap-2 items-center rounded-lg border p-2 bg-white"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={item.title}
                    onChange={(e) => handlePlaylistItemChange(item.id, { title: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={5}
                    max={300}
                    value={item.durationSeconds}
                    onChange={(e) => handlePlaylistItemChange(item.id, { durationSeconds: Number(e.target.value) || 15 })}
                  />
                  <select
                    className="h-10 rounded-md border px-2 text-sm"
                    value={item.layout ?? 'auto'}
                    onChange={(e) => handlePlaylistItemChange(item.id, { layout: e.target.value as ScreenPlaylistItem['layout'] })}
                  >
                    <option value="auto">Auto</option>
                    <option value="landscape">16:9</option>
                    <option value="portrait">9:16</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Switch checked={item.enabled} onCheckedChange={(checked) => handlePlaylistItemToggle(item.id, checked)} />
                    <select
                      className="h-10 rounded-md border px-2 text-sm w-full"
                      value={item.mediaAssetId ?? ''}
                      onChange={(e) => {
                        const asset = (settings.screenMediaLibrary ?? []).find((a) => a.id === e.target.value) ?? globalLibrary.find((a) => a.id === e.target.value);
                        handlePlaylistItemChange(item.id, {
                          mediaAssetId: asset?.id,
                          mediaUrl: asset?.url,
                        });
                      }}
                    >
                      <option value="">Sin medio</option>
                      {[...(settings.screenMediaLibrary ?? []), ...globalLibrary.filter((g) => !(settings.screenMediaLibrary ?? []).some((l) => l.id === g.id))].map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.title || asset.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <Label>Subir publicidad/media (PC) para esta fiesta</Label>
              <Input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*,image/*"
                disabled={uploadingMedia}
                onChange={(e) => handleUploadMedia(e.target.files?.[0] ?? null)}
              />
              {uploadingMedia && <p className="text-xs text-blue-600 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Subiendo archivo, aguardá…</p>}
              <p className="text-xs text-muted-foreground">Soporta MP4, WebM, MOV, imágenes JPG/PNG/GIF. La biblioteca global incluye medios de otras fiestas para reutilizar.</p>
              <p className="text-xs text-muted-foreground">Templates redes incluidos: Neón, VIP elegante y Minimal (editable por handles/QR en playlist tipo redes).</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4" />Marca AK en Pantalla</CardTitle>
            <CardDescription>Configurá el branding de AK Producciones que se muestra en la pantalla gigante y el muro en vivo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Logo URL</Label>
                <Input value={akBrandSettings.logoUrl ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, logoUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nombre de la empresa</Label>
                <Input value={akBrandSettings.companyName ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, companyName: e.target.value }))} placeholder="AK Producciones" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Instagram</Label>
                <Input value={akBrandSettings.instagramHandle ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, instagramHandle: e.target.value }))} placeholder="@akproducciones" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Facebook</Label>
                <Input value={akBrandSettings.facebookHandle ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, facebookHandle: e.target.value }))} placeholder="akproducciones" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">TikTok</Label>
                <Input value={akBrandSettings.tiktokHandle ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, tiktokHandle: e.target.value }))} placeholder="@akproducciones" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">WhatsApp</Label>
                <Input value={akBrandSettings.whatsappNumber ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))} placeholder="59899000000" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Landing URL</Label>
                <Input value={akBrandSettings.landingUrl ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, landingUrl: e.target.value }))} placeholder="https://akproducciones.uy" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Texto CTA</Label>
                <Input value={akBrandSettings.ctaText ?? ''} onChange={(e) => setAkBrandSettings((prev) => ({ ...prev, ctaText: e.target.value }))} placeholder="Pedí tu presupuesto" />
              </div>
            </div>
            <Button onClick={handleSaveBrand} disabled={isSavingBrand} className="w-full sm:w-auto">
              {isSavingBrand ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Marca AK
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-violet-500" />
              Panel de Juegos
              {activeGame && (
                <Badge className="ml-2 bg-green-500 text-white text-xs">● En pantalla</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Lanzá juegos interactivos a la pantalla gigante con un clic. Los invitados participan en tiempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active game banner */}
            {activeGame && (
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">🎮</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-green-800 truncate">Juego activo en pantalla</p>
                    <p className="text-xs text-green-600 truncate">{activeGame.title}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs hidden sm:flex">
                    {activeGame.type}
                  </Badge>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearGame}
                  disabled={isLaunchingGame}
                  className="shrink-0"
                >
                  {isLaunchingGame ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 mr-1" />}
                  Detener
                </Button>
              </div>
            )}

            {/* Game templates grid */}
            <div className="grid sm:grid-cols-3 gap-2">
              {GAME_TEMPLATES.map((template) => (
                <div key={template.type} className="space-y-0">
                  <button
                    type="button"
                    onClick={() => setSelectedGameTemplate(
                      selectedGameTemplate?.type === template.type ? null : template
                    )}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${
                      selectedGameTemplate?.type === template.type
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-border bg-white hover:border-violet-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{template.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{template.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Selected game customization + launch */}
            {selectedGameTemplate && (
              <div className="rounded-xl border-2 border-violet-200 bg-violet-50 p-4 space-y-3">
                <p className="text-sm font-bold text-violet-800 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Personalizar: {selectedGameTemplate.label}
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">Título en pantalla</Label>
                  <Input
                    value={gameCustomTitle}
                    onChange={(e) => setGameCustomTitle(e.target.value)}
                    placeholder={selectedGameTemplate.title}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Subtítulo (opcional)</Label>
                  <Input
                    value={gameCustomSubtitle}
                    onChange={(e) => setGameCustomSubtitle(e.target.value)}
                    placeholder={selectedGameTemplate.subtitle ?? 'Texto adicional…'}
                  />
                </div>
                {selectedGameTemplate.options !== undefined && (
                  <div className="space-y-1">
                    <Label className="text-xs">Opciones (una por línea, dejar vacío para usar las predeterminadas)</Label>
                    <Textarea
                      value={gameCustomOptions}
                      onChange={(e) => setGameCustomOptions(e.target.value)}
                      placeholder={selectedGameTemplate.options.map(o => o.text).join('\n')}
                      rows={3}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleLaunchGame(selectedGameTemplate)}
                    disabled={isLaunchingGame}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                  >
                    {isLaunchingGame ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    Lanzar a pantalla gigante
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setSelectedGameTemplate(null); setGameCustomTitle(''); setGameCustomSubtitle(''); setGameCustomOptions(''); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              💡 Los juegos aparecen en pantalla en tiempo real (~2 s). Si tenés un ítem de tipo "Juego" en la playlist, el juego activo se muestra a pantalla completa en ese slot.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Disparador rápido de momentos</CardTitle>
            <CardDescription>Interrumpe temporalmente la proyección con anuncio a pantalla completa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {QUICK_MOMENTS.map((moment) => (
              <Button key={moment.id} variant="secondary" onClick={() => triggerMoment(moment)}>
                <Sparkles className="w-4 h-4 mr-2" />
                {moment.emoji} {moment.nombre}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* ── JUEGOS EN VIVO ── */}
        <Card className="lg:col-span-2 border-2 border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              Juegos en Vivo · Pantalla Gigante
            </CardTitle>
            <CardDescription>
              Lanzá trivias, encuestas y sorteos que aparecen <strong>inmediatamente</strong> en la pantalla gigante.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trivia / Encuesta */}
            <div className="rounded-xl border border-purple-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <p className="font-bold text-sm text-purple-900">Trivia / Encuesta</p>
                {activePoll && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                    ● EN VIVO
                  </span>
                )}
              </div>
              {!activePoll ? (
                <form onSubmit={handleCreateAndLaunchPoll} className="space-y-3">
                  <Input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Pregunta de la trivia… ej: ¿Cuál es la canción favorita de los agasajados?"
                  />
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const next = [...pollOptions];
                            next[idx] = e.target.value;
                            setPollOptions(next);
                          }}
                          placeholder={`Opción ${idx + 1}`}
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-destructive"
                          >
                            <MinusCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 4 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(prev => [...prev, ''])}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
                      >
                        <PlusCircle className="w-4 h-4" /> Agregar opción
                      </button>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isCreatingPoll || !pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isCreatingPoll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                    🎯 Lanzar Trivia en Pantalla
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                    <p className="font-semibold text-purple-900 text-sm mb-2">{activePoll.question}</p>
                    <div className="space-y-1.5">
                      {activePoll.options.map(opt => {
                        const total = activePoll.options.reduce((a, o) => a + o.votes, 0);
                        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                        return (
                          <div key={opt.id} className="space-y-0.5">
                            <div className="flex justify-between text-xs text-slate-600">
                              <span>{opt.text}</span>
                              <span className="font-bold">{pct}% ({opt.votes} votos)</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200">
                              <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClosePoll}
                    disabled={isClosingPoll}
                  >
                    {isClosingPoll ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
                    Cerrar Trivia
                  </Button>
                </div>
              )}
            </div>

            {/* Sorteo */}
            <div className="rounded-xl border border-yellow-200 bg-white p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <p className="font-bold text-sm text-yellow-900">Sorteo Sorpresa</p>
              </div>

              {/* Spinning wheel */}
              {(() => {
                const participants = sorteoParticipants
                  .split('\n')
                  .map(p => p.trim())
                  .filter(Boolean);
                const count = Math.min(participants.length, 16); // cap segments for readability
                const wheelItems = participants.slice(0, count);
                // Color palette for segments
                const SEGMENT_COLORS = [
                  '#f43f5e','#f97316','#eab308','#22c55e','#06b6d4','#6366f1','#ec4899','#14b8a6',
                  '#fb923c','#a3e635','#38bdf8','#818cf8','#f472b6','#4ade80','#facc15','#fb7185',
                ];
                return (
                  <div className="flex justify-center py-2">
                    <div className="relative w-52 h-52">
                      {/* Pointer arrow */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 w-0 h-0"
                        style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '22px solid #eab308' }} />
                      {/* Wheel */}
                      <div
                        className="w-52 h-52 rounded-full border-4 border-yellow-400 shadow-2xl overflow-hidden relative"
                        style={{
                          transform: `rotate(${sorteoWheelAngle}deg)`,
                          transition: sorteoIsSpinning
                            ? 'transform 2.8s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                            : 'none',
                        }}
                      >
                        {wheelItems.length === 0 ? (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: 'conic-gradient(#fef9c3, #fde68a, #fbbf24, #f59e0b, #fef9c3, #fde68a, #fbbf24, #f59e0b)' }}
                          >
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-inner border-2 border-yellow-300 z-10">
                              <span className="text-lg font-black text-yellow-600 leading-none">AK</span>
                            </div>
                          </div>
                        ) : (
                          <svg width="100%" height="100%" viewBox="0 0 200 200">
                            {wheelItems.map((name, i) => {
                              const sliceAngle = (2 * Math.PI) / wheelItems.length;
                              const startAngle = i * sliceAngle - Math.PI / 2;
                              const endAngle = startAngle + sliceAngle;
                              const x1 = 100 + 96 * Math.cos(startAngle);
                              const y1 = 100 + 96 * Math.sin(startAngle);
                              const x2 = 100 + 96 * Math.cos(endAngle);
                              const y2 = 100 + 96 * Math.sin(endAngle);
                              const midAngle = startAngle + sliceAngle / 2;
                              const textR = 66;
                              const tx = 100 + textR * Math.cos(midAngle);
                              const ty = 100 + textR * Math.sin(midAngle);
                              const largeArc = sliceAngle > Math.PI ? 1 : 0;
                              const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                              const shortName = name.length > 10 ? name.slice(0, 9) + '…' : name;
                              return (
                                <g key={i}>
                                  <path
                                    d={`M 100 100 L ${x1} ${y1} A 96 96 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                    fill={color}
                                    stroke="white"
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x={tx}
                                    y={ty}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    transform={`rotate(${(midAngle * 180) / Math.PI + 90}, ${tx}, ${ty})`}
                                    fill="white"
                                    fontSize={wheelItems.length > 8 ? 7 : 9}
                                    fontWeight="bold"
                                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                                  >
                                    {shortName}
                                  </text>
                                </g>
                              );
                            })}
                            {/* Center circle */}
                            <circle cx="100" cy="100" r="22" fill="white" stroke="#fbbf24" strokeWidth="3" />
                            <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="900" fill="#d97706">AK</text>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Winner reveal */}
              {sorteoPreviewWinner && !sorteoIsSpinning && (
                <div className="rounded-lg bg-yellow-50 border-2 border-yellow-300 px-4 py-3 text-center animate-bounce-once">
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-1">🎉 ¡Ganador!</p>
                  <p className="text-2xl font-black text-yellow-900">🏆 {sorteoPreviewWinner}</p>
                </div>
              )}

              <div className="space-y-2">
                {/* Prize configuration */}
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Premio del sorteo (se muestra en pantalla)</Label>
                  <Input
                    value={sorteoPremio}
                    onChange={(e) => setSorteoPremio(e.target.value)}
                    placeholder="Ej: Una cena para dos, Pack de vinos…"
                    className="h-9 text-sm"
                  />
                </div>
                {/* Three sorteo participant type buttons */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 font-semibold">Cargar participantes desde:</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadInvitadosToSorteo}
                    className="w-full border-yellow-300 text-yellow-800 hover:bg-yellow-50 justify-start text-left"
                  >
                    👥 <span className="font-bold ml-1">Todos los invitados</span>
                    <span className="ml-1 text-yellow-600 font-normal">(confirmados / con check-in)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMuroParticipantes}
                    className="w-full border-blue-300 text-blue-800 hover:bg-blue-50 justify-start text-left"
                  >
                    🎉 <span className="font-bold ml-1">Participantes del muro</span>
                    <span className="ml-1 text-blue-600 font-normal">(pusieron su nombre, no anónimos)</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadRedesSeguidores}
                    className="w-full border-pink-300 text-pink-800 hover:bg-pink-50 justify-start text-left"
                  >
                    📱 <span className="font-bold ml-1">Seguidores de redes</span>
                    <span className="ml-1 text-pink-600 font-normal">({(settings.sorteoParticipantesRedes ?? []).length} hicieron clic en Seguir)</span>
                  </Button>
                </div>
                <Label className="text-xs text-slate-500">
                  Participantes — uno por línea (podés editar manualmente):
                </Label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder={"Juan García\nMaría López\nPedro Martínez\n..."}
                  value={sorteoParticipants}
                  onChange={(e) => { setSorteoParticipants(e.target.value); setSorteoPreviewWinner(null); }}
                />
                {sorteoParticipants.trim() && (
                  <p className="text-xs text-slate-400">
                    {sorteoParticipants.split('\n').map(p => p.trim()).filter(Boolean).length} participantes
                  </p>
                )}
                <Button
                  type="button"
                  onClick={handleTriggerSorteo}
                  disabled={isTriggeringSorteo || sorteoIsSpinning || !sorteoParticipants.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white w-full"
                >
                  {(isTriggeringSorteo || sorteoIsSpinning) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                  {sorteoIsSpinning ? '¡Girando la ruleta! 🎡' : '🎲 ¡Lanzar Sorteo en Pantalla!'}
                </Button>
                {lastSorteoWinner && !sorteoIsSpinning && !sorteoPreviewWinner && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-center">
                    <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-1">Último ganador</p>
                    <p className="text-xl font-black text-yellow-900">🏆 {lastSorteoWinner}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MuroSocialPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <MuroSocialContent />
    </Suspense>
  );
}

