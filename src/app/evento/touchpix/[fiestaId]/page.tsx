'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  SwitchCamera,
  Download,
  Send,
  ArrowLeft,
  Loader2,
  PartyPopper,
  RefreshCw,
  Sparkles,
  Wand2,
  Users,
  QrCode,
  X,
  Palette,
  ArrowRight,
  Sparkle,
  Radio,
  Zap,
} from 'lucide-react';
import { applyFaceSwap, applyTouchpixTheme, uploadTouchpixPhoto } from '@/app/actions/touchpix-ai';
import { getPublicEntertainmentEvent } from '@/app/actions/fiesta/entretenimiento.actions';
import {
  getEntertainmentSession,
  completeEntertainmentSessionCycle,
  resetEntertainmentSession,
  startEntertainmentSession,
  updateEntertainmentSessionStatus,
  type EntertainmentSession,
} from '@/app/actions/fiesta/sesion-entretenimiento';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { PublicEntertainmentEventStatus } from '@/components/entertainment/public-entertainment-event-status';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { isVideoFrameReady } from '@/lib/entertainment/camera-readiness';
import { waitForInitialPublicLoad } from '@/lib/public-experience/wait-for-initial-public-load';
import { saveOfflineMedia } from '@/lib/offline/offline-db';
import { SyncStatusIndicator } from '@/components/offline/sync-status-indicator';
import { parseEventDate } from '@/lib/public-experience/event-date';
import { classifyOfflineUploadError } from '@/lib/offline/offline-upload-policy';

/* ───────────────────── Theme Definitions ───────────────────── */

const TOUCHPIX_THEMES = [
  { id: 'original', label: 'Original', emoji: '📷', gradient: 'from-zinc-700 to-zinc-800', cssFilter: 'none', description: 'Sin efectos' },
  { id: 'disco_glam', label: 'Disco Glam', emoji: '🪩', gradient: 'from-fuchsia-600 to-purple-800', cssFilter: 'brightness(1.1) contrast(1.1) saturate(1.3)', description: 'Brillo disco' },
  { id: 'neon_retro', label: 'Neón Retro', emoji: '🌆', gradient: 'from-cyan-500 to-blue-700', cssFilter: 'hue-rotate(180deg) saturate(2) brightness(1.05)', description: 'Estilo 80s' },
  { id: 'fantasy_enchanted', label: 'Fantasía', emoji: '🧚', gradient: 'from-emerald-500 to-teal-700', cssFilter: 'brightness(1.05) saturate(0.9) hue-rotate(90deg) contrast(1.05)', description: 'Mundo mágico' },
  { id: 'pop_art', label: 'Pop Art', emoji: '🎨', gradient: 'from-yellow-500 to-red-600', cssFilter: 'saturate(2.5) contrast(1.4) brightness(1.05)', description: 'Estilo Warhol' },
  { id: 'golden_luxury', label: 'Luxury', emoji: '👑', gradient: 'from-amber-500 to-yellow-700', cssFilter: 'sepia(0.5) saturate(1.5) brightness(1.1) contrast(1.1)', description: 'Dorado premium' },
];

/* ───────────────────── Face Swap Characters ───────────────────── */

const FACE_SWAP_CHARACTERS = [
  { id: 'superhero', label: 'Superhéroe', emoji: '🦸', gradient: 'from-red-600 to-blue-700', filter: 'saturate(1.6) contrast(1.3) brightness(1.05)', frameEmojis: ['💥', '⚡', '🌟', '✨'], description: 'Conviértete en héroe' },
  { id: 'astronaut', label: 'Astronauta', emoji: '🧑‍🚀', gradient: 'from-slate-600 to-indigo-800', filter: 'hue-rotate(200deg) saturate(0.7) brightness(1.15) contrast(1.1)', frameEmojis: ['🌠', '🚀', '⭐', '🪐'], description: 'Viaja al espacio' },
  { id: 'royalty', label: 'Realeza', emoji: '👑', gradient: 'from-amber-500 to-yellow-700', filter: 'sepia(0.6) saturate(1.4) brightness(1.1)', frameEmojis: ['👑', '💎', '🏰', '✨'], description: 'Corona real' },
  { id: 'rockstar', label: 'Rockstar', emoji: '🎸', gradient: 'from-purple-700 to-pink-600', filter: 'contrast(1.4) saturate(1.5) brightness(1.05)', frameEmojis: ['🎸', '🤘', '🔥', '🎤'], description: 'Estrella de rock' },
  { id: 'fairy', label: 'Hada', emoji: '🧚', gradient: 'from-pink-400 to-violet-600', filter: 'brightness(1.15) saturate(1.2) hue-rotate(330deg)', frameEmojis: ['🧚', '✨', '🌸', '🦋'], description: 'Efecto fantasía' },
];

type TabMode = 'foto' | 'faceswap' | 'ai_themes';
type ProcessingResult = 'ai' | 'fallback' | null;

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
}

import { GuiaPosicionamiento } from '@/components/entretenimiento/GuiaPosicionamiento';

export default function TouchpixPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const role = searchParams.get('role') || 'display';
  const accessToken = searchParams.get('access') || undefined;
  const guestId = searchParams.get('guestId') || undefined;
  const guestAccessToken = searchParams.get('guestAccessToken') || searchParams.get('token') || undefined;
  const nombreInvitado = searchParams.get('nombre') || searchParams.get('name') || undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [activeTab, setActiveTab] = useState<TabMode>('foto');
  const [selectedTheme, setSelectedTheme] = useState('original');
  const [selectedCharacter, setSelectedCharacter] = useState('superhero');
  const [selectedAiTheme, setSelectedAiTheme] = useState('disco_glam');

  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rawCapturedImage, setRawCapturedImage] = useState<string | null>(null);

  // Progressive Wizard State
  const [wizardStep, setWizardStep] = useState<number>(0); // 0 = Camera, 1 = Category, 2 = Style

  // Interactive Queue Trivia State
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [session, setSession] = useState<EntertainmentSession | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [photoSessionId, setPhotoSessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const eventName = fiesta?.eventName || 'este gran evento';
  
  const triviaList = [
    `¿Sabías que ${eventName} fue planeado detalladamente para sorprenderte?`,
    "¡Los anfitriones ensayaron su entrada triunfal más de una docena de veces!",
    "El DJ tiene estrictas instrucciones de no dejar que nadie se quede sentado.",
    "¡Dato curioso: Se estima que se sacarán más de 1000 fotos en esta cabina hoy!",
    "El menú de esta noche fue seleccionado en una cata secreta por los anfitriones.",
    "¡El brindis de hoy está cargado con los mejores deseos de felicidad!",
  ];

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setTriviaIndex(prev => (prev + 1) % triviaList.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isProcessing, triviaList.length]);

  const stopCamera = useCallback(() => {
    setStream(prev => {
      if (prev) prev.getTracks().forEach(t => t.stop());
      return null;
    });
  }, []);

  /* ── Load fiesta data ── */
  useEffect(() => {
    let active = true;
    setFiesta(null);
    setErrorMsg(null);
    setIsEventLoading(true);
    const loadTask = getPublicEntertainmentEvent(fiestaId, 'espejoMagicoIA', accessToken)
      .then((result) => {
        if (!active) return;
        if (result.success && result.event) {
          setFiesta(result.event);
          setErrorMsg(null);
        } else {
          setErrorMsg(result.error || 'No se pudo abrir esta estacion.');
        }
      })
      .catch(() => {
        if (active) setErrorMsg('No se pudo abrir esta estacion.');
      });
    void waitForInitialPublicLoad(loadTask).then((result) => {
      if (!active) return;
      if (result === 'timeout') setErrorMsg('La validacion del evento demoro demasiado. Intenta nuevamente.');
      setIsEventLoading(false);
    });
    return () => {
      active = false;
      stopCamera();
    };
  }, [accessToken, fiestaId, stopCamera]);

  /* ── Camera ── */
  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setErrorMsg('No se pudo acceder a la cámara. Revisá los permisos del navegador.');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (fiesta && !capturedImage && wizardStep === 0) startCamera();
  }, [capturedImage, fiesta, startCamera, wizardStep]);

  const toggleCamera = () => setFacingMode(prev => prev === 'user' ? 'environment' : 'user');

  /* ── Audio Beep ── */
  const playBeep = useCallback((freq = 880, duration = 0.1) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
  }, []);

  /* ── Watermark ── */
  const drawWatermark = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const rawDate = fiesta?.eventDate;
    let eventDateStr = '';
    if (rawDate) {
      try {
        // `parseEventDate`: sin esto la marca de agua de la foto salia con la
        // fecha del dia anterior a la fiesta.
        const date = parseEventDate(rawDate);
        eventDateStr = date ? date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : rawDate;
      } catch {
        eventDateStr = rawDate;
      }
    }

    const bannerHeight = h * 0.08;
    const grad = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (eventDateStr) {
      ctx.font = `bold ${Math.max(16, h * 0.022)}px sans-serif`;
      ctx.fillText(eventName, w / 2, h - bannerHeight * 0.58);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = `${Math.max(12, h * 0.016)}px sans-serif`;
      ctx.fillText(eventDateStr, w / 2, h - bannerHeight * 0.28);
    } else {
      ctx.font = `bold ${Math.max(18, h * 0.026)}px sans-serif`;
      ctx.fillText(eventName, w / 2, h - bannerHeight * 0.5);
    }

    // Touchpix branding
    ctx.fillStyle = 'rgba(217, 70, 239, 0.6)';
    ctx.font = `bold ${Math.max(10, h * 0.012)}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('TOUCHPIX · AK', w - 16, h - bannerHeight - 10);
  }, [fiesta, eventName]);

  /* ── Apply CSS filter to canvas ── */
  const applyFilterToCanvas = useCallback((
    sourceDataUrl: string,
    filterStr: string,
    onComplete: (resultDataUrl: string) => void,
    overlayEmojis?: string[],
    overlayMainEmoji?: string
  ) => {
    const offscreen = processingCanvasRef.current;
    if (!offscreen) return;

    const img = new Image();
    img.onload = () => {
      offscreen.width = img.width;
      offscreen.height = img.height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      ctx.filter = filterStr;
      ctx.drawImage(img, 0, 0);
      ctx.filter = 'none';

      // Draw overlay emojis
      if (overlayEmojis && overlayEmojis.length > 0) {
        const emojiSize = Math.max(40, img.width * 0.06);
        ctx.font = `${emojiSize}px sans-serif`;
        ctx.textBaseline = 'top';

        ctx.fillText(overlayEmojis[0] || '✨', 20, 20);
        ctx.fillText(overlayEmojis[1] || '✨', img.width - emojiSize - 20, 20);
        ctx.fillText(overlayEmojis[2] || '✨', 20, img.height - emojiSize - 80);
        ctx.fillText(overlayEmojis[3] || '✨', img.width - emojiSize - 20, img.height - emojiSize - 80);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 8;
        const r = 20;
        ctx.beginPath();
        ctx.roundRect(12, 12, img.width - 24, img.height - 24, r);
        ctx.stroke();
      }

      if (overlayMainEmoji) {
        const mainSize = Math.max(80, img.width * 0.15);
        ctx.font = `${mainSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.globalAlpha = 0.85;
        ctx.fillText(overlayMainEmoji, img.width / 2, 30);
        ctx.globalAlpha = 1;
      }

      drawWatermark(ctx, offscreen.width, offscreen.height);
      onComplete(offscreen.toDataURL('image/jpeg', 0.92));
    };
    img.src = sourceDataUrl;
  }, [drawWatermark]);

  /* ── Capture ── */
  const captureRawPhoto = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    if (!isVideoFrameReady(videoRef.current)) {
      setErrorMsg('La camara todavia se esta preparando. Intenta nuevamente en un instante.');
      return null;
    }

    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.95);
  }, [facingMode]);

  const handleCapture = useCallback(async () => {
    const raw = captureRawPhoto();
    if (!raw) return;
    await updateEntertainmentSessionStatus(
      fiestaId,
      'espejoMagicoIA',
      'recording',
      {},
      accessToken
    );
    setRawCapturedImage(raw);
    setProcessingResult(null);
    stopCamera();

    if (activeTab === 'foto') {
      const theme = TOUCHPIX_THEMES.find(t => t.id === selectedTheme);
      if (theme && theme.cssFilter !== 'none') {
        applyFilterToCanvas(raw, theme.cssFilter, (result) => {
          setCapturedImage(result);
        });
      } else {
        applyFilterToCanvas(raw, 'none', (result) => {
          setCapturedImage(result);
        });
      }
    } else if (activeTab === 'faceswap') {
      const character = FACE_SWAP_CHARACTERS.find(c => c.id === selectedCharacter);
      if (!character) return;
      setIsProcessing(true);
      setProcessingText('Generando transformación con IA...');
      await updateEntertainmentSessionStatus(
        fiestaId,
        'espejoMagicoIA',
        'processing',
        {},
        accessToken
      );

      try {
        const formData = new FormData();
        formData.set('fiestaId', fiestaId);
        if (accessToken) formData.set('accessToken', accessToken);
        formData.set('consentAccepted', String(consentAccepted));
        formData.set('characterId', character.id);
        formData.set('sourceFile', await dataUrlToFile(raw, `touchpix-source-${Date.now()}.jpg`));
        const result = await applyFaceSwap(formData);

        if (result.success && result.faceSwapApplied && result.imageBase64) {
          applyFilterToCanvas(`data:image/png;base64,${result.imageBase64}`, 'none', (watermarked) => {
            setCapturedImage(watermarked);
            setProcessingResult('ai');
            setIsProcessing(false);
          });
          return;
        }
      } catch {
        // Fallback
      }

      setProcessingText('IA no disponible. Aplicando efecto local...');
      applyFilterToCanvas(
        raw,
        character.filter,
        (result) => {
          setCapturedImage(result);
          setProcessingResult('fallback');
          setIsProcessing(false);
        },
        character.frameEmojis,
        character.emoji
      );
    } else if (activeTab === 'ai_themes') {
      setCapturedImage(raw);
    }
  }, [captureRawPhoto, stopCamera, activeTab, selectedTheme, selectedCharacter, applyFilterToCanvas, fiestaId, accessToken, consentAccepted]);

  const takePhoto = useCallback(() => {
    if (countdown !== null) return;
    if (
      activeTab !== 'foto' &&
      !consentAccepted
    ) {
      setErrorMsg('Debes aceptar el uso de IA antes de iniciar la captura.');
      return;
    }
    setErrorMsg(null);
    updateEntertainmentSessionStatus(
      fiestaId,
      'espejoMagicoIA',
      'countdown',
      {},
      accessToken
    );
    let currentCount = fiesta?.station.countdownSeconds || 4;
    setCountdown(currentCount);
    playBeep();

    const interval = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playBeep();
      } else {
        clearInterval(interval);
        setCountdown(null);
        playBeep(1200, 0.3);
        handleCapture();
      }
    }, 1000);
  }, [
    accessToken,
    activeTab,
    consentAccepted,
    countdown,
    fiesta,
    fiestaId,
    handleCapture,
    playBeep,
  ]);

  useEffect(() => {
    let pollInFlight = false;
    const interval = setInterval(async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      try {
        const nextSession = await getEntertainmentSession(
          fiestaId,
          'espejoMagicoIA',
          accessToken
        );
        setSession(nextSession);

        if (
          role === 'display' &&
          nextSession?.status === 'countdown' &&
          countdown === null &&
          !capturedImage &&
          !isProcessing
        ) {
          const requestedMode = nextSession.settings?.mode as TabMode | undefined;
          if (requestedMode && requestedMode !== activeTab) {
            setActiveTab(requestedMode);
            return;
          }
          if (nextSession.settings?.characterId) {
            if (nextSession.settings.characterId !== selectedCharacter) {
              setSelectedCharacter(nextSession.settings.characterId);
              return;
            }
          }
          if (nextSession.settings?.themeId) {
            if (nextSession.settings.themeId !== selectedAiTheme) {
              setSelectedAiTheme(nextSession.settings.themeId);
              return;
            }
          }
          setWizardStep(0);
          takePhoto();
        }

        if (role === 'display' && nextSession?.status === 'idle' && capturedImage) {
          setCapturedImage(null);
          setRawCapturedImage(null);
          setProcessingResult(null);
          setWizardStep(0);
        }
      } finally {
        pollInFlight = false;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [
    accessToken,
    activeTab,
    capturedImage,
    countdown,
    fiestaId,
    isProcessing,
    role,
    selectedAiTheme,
    selectedCharacter,
    takePhoto,
  ]);

  useEffect(() => {
    if (!capturedImage || isProcessing) return;
    updateEntertainmentSessionStatus(
      fiestaId,
      'espejoMagicoIA',
      'done',
      { reviewPending: true },
      accessToken
    );
  }, [accessToken, capturedImage, fiestaId, isProcessing]);

  /* ── AI Themes: apply after capture ── */
  const applyAiTheme = useCallback(async (themeId: string) => {
    if (!rawCapturedImage) return;
    setSelectedAiTheme(themeId);
    setIsProcessing(true);

    const theme = TOUCHPIX_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    setProcessingText(`Generando ${theme.label} con IA...`);

    try {
      const formData = new FormData();
      formData.set('fiestaId', fiestaId);
      if (accessToken) formData.set('accessToken', accessToken);
      formData.set('consentAccepted', String(consentAccepted));
      formData.set('themeId', themeId);
      formData.set('photoSessionId', photoSessionId);
      formData.set('file', await dataUrlToFile(rawCapturedImage, `touchpix-theme-${Date.now()}.jpg`));
      const result = await applyTouchpixTheme(formData);

      if (result.success && result.themeApplied && result.imageBase64) {
        applyFilterToCanvas(`data:image/png;base64,${result.imageBase64}`, 'none', (watermarked) => {
          setCapturedImage(watermarked);
          setProcessingResult('ai');
          setIsProcessing(false);
        });
        return;
      }
    } catch {
      // Fallback
    }

    setProcessingText('IA no disponible. Aplicando efecto local...');
    const filterStr = theme.cssFilter === 'none' ? 'none' : theme.cssFilter;
    applyFilterToCanvas(rawCapturedImage, filterStr, (result) => {
      setCapturedImage(result);
      setProcessingResult('fallback');
      setIsProcessing(false);
    });
  }, [rawCapturedImage, applyFilterToCanvas, fiestaId, accessToken, consentAccepted, photoSessionId]);

  /* ── Download ── */
  const handleDownload = useCallback(() => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `Touchpix-AK-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [capturedImage]);

  /* ── Retake ── */
  const retake = useCallback(() => {
    setCapturedImage(null);
    setRawCapturedImage(null);
    setIsProcessing(false);
    setProcessingResult(null);
    setQueuedOffline(false);
    setWizardStep(0);
    setConsentAccepted(false);
    setPhotoSessionId(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    void completeEntertainmentSessionCycle(fiestaId, 'espejoMagicoIA', accessToken);
    startCamera();
  }, [accessToken, fiestaId, startCamera]);

  /* ── Upload ── */
  const handleUpload = useCallback(async () => {
    if (!capturedImage) return;
    setIsUploading(true);

    let pendingFile: File | null = null;
    let uploadConfirmed = false;
    try {
      pendingFile = await dataUrlToFile(capturedImage, `touchpix-${Date.now()}.jpg`);
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Sin conexión');
      }

      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      if (accessToken) formData.append('accessToken', accessToken);
      if (guestId) formData.append('guestId', guestId);
      if (guestAccessToken) formData.append('guestAccessToken', guestAccessToken);
      formData.append('file', pendingFile);
      formData.append('authorName', 'Cabina Touchpix');
      if (activeTab === 'ai_themes') {
        formData.append('themeLabel', TOUCHPIX_THEMES.find(theme => theme.id === selectedAiTheme)?.label || '');
      }
      if (activeTab === 'faceswap') {
        formData.append('characterLabel', FACE_SWAP_CHARACTERS.find(character => character.id === selectedCharacter)?.label || '');
      }

      const res = await uploadTouchpixPhoto(formData);
      if (!res.success) {
        // Si el servidor rechazó la foto por regla de negocio/moderación/permiso mientras hay internet,
        // no encolamos en offline para evitar reintentar errores permanentes.
        throw new Error(res.error || 'Error al subir');
      }
      uploadConfirmed = true;

      await updateEntertainmentSessionStatus(
        fiestaId,
        'espejoMagicoIA',
        'done',
        { mediaUrl: res.post?.imageUrl, reviewPending: false },
        accessToken
      );
      setQueuedOffline(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        retake();
      }, 3000);
    } catch (err: any) {
      const errMsg = String(err?.message || '');
      const uploadDecision = classifyOfflineUploadError(errMsg);

      // La foto ya llegó aunque haya fallado la actualización secundaria del estado,
      // o el servidor la reconoció por su huella. En ambos casos no se vuelve a subir.
      if (uploadConfirmed || uploadDecision === 'duplicate') {
        setQueuedOffline(false);
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          retake();
        }, 3000);
        return;
      }

      // Una sesión vencida y cualquier falla sin rechazo definitivo se conservan.
      // La cola usará el token renovado cuando el operador vuelva a abrir la estación.
      if (pendingFile && uploadDecision === 'retryable') {
        try {
          await saveOfflineMedia({
            fiestaId,
            moduleId: 'touchpix',
            fileBlob: pendingFile,
            fileName: pendingFile.name,
            mimeType: pendingFile.type || 'image/jpeg',
            authorName: 'Cabina Touchpix',
            guestId,
            guestAccessToken,
            accessToken,
            metadata: {
              selectedTheme: activeTab === 'ai_themes'
                ? TOUCHPIX_THEMES.find(theme => theme.id === selectedAiTheme)?.label
                : undefined,
              character: activeTab === 'faceswap'
                ? FACE_SWAP_CHARACTERS.find(character => character.id === selectedCharacter)?.label
                : undefined,
            },
          });
          setQueuedOffline(true);
          setShowSuccess(true);
          void updateEntertainmentSessionStatus(
            fiestaId,
            'espejoMagicoIA',
            'done',
            { mediaUrl: null, reviewPending: true },
            accessToken,
          ).catch(() => undefined);
          setTimeout(() => {
            setShowSuccess(false);
            retake();
          }, 4000);
          return;
        } catch (offlineError) {
          console.error('[Touchpix] No se pudo guardar la foto sin conexión:', offlineError);
        }
      }
      alert('No se pudo subir la foto: ' + errMsg);
    } finally {
      setIsUploading(false);
    }
  }, [accessToken, activeTab, capturedImage, fiestaId, guestAccessToken, guestId, retake, selectedAiTheme, selectedCharacter]);

  /* ── Get current CSS filter for live preview ── */
  const getLiveFilter = (): string => {
    if (activeTab === 'foto') {
      const theme = TOUCHPIX_THEMES.find(t => t.id === selectedTheme);
      return theme?.cssFilter || 'none';
    }
    return 'none';
  };

  /* ── QR Modal ── */
  const QrModal = () => {
    const [QRComponent, setQRComponent] = useState<any>(null);

    useEffect(() => {
      import('qrcode.react').then(mod => {
        setQRComponent(() => mod.QRCodeSVG);
      }).catch(() => {});
    }, []);

    if (!showQrModal) return null;

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
        onClick={() => setShowQrModal(false)}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center"
        >
          <button
            onClick={() => setShowQrModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-4xl mb-3">📲</div>
          <h3 className="text-xl font-black text-white mb-2">Compartí la experiencia</h3>
          <p className="text-sm text-zinc-400 mb-6">Escaneá este QR para abrir Touchpix en otro dispositivo</p>

          <div className="bg-white rounded-2xl p-4 inline-block mb-6">
            {QRComponent ? (
              <QRComponent value={shareUrl} size={200} level="H" />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500 break-all">{shareUrl}</p>
        </motion.div>
      </motion.div>
    );
  };

  const tabs: { id: TabMode; label: string; emoji: string; icon: React.ReactNode }[] = [
    { id: 'foto', label: 'Foto', emoji: '📷', icon: <Camera className="w-5 h-5" /> },
    { id: 'faceswap', label: 'Face Swap', emoji: '🎭', icon: <Users className="w-5 h-5" /> },
    { id: 'ai_themes', label: 'Temas IA', emoji: '🎬', icon: <Wand2 className="w-5 h-5" /> },
  ];

  const isReviewMode = capturedImage !== null && !(activeTab === 'ai_themes' && !isProcessing && rawCapturedImage && capturedImage === rawCapturedImage);
  const isAiThemeSelection = activeTab === 'ai_themes' && capturedImage === rawCapturedImage && !isProcessing && rawCapturedImage !== null;

  if (isEventLoading || !fiesta) {
    return <PublicEntertainmentEventStatus isLoading={isEventLoading} error={errorMsg} />;
  }

  if (role === 'operator') {
    const displayHref = `/evento/touchpix/${fiestaId}${accessToken ? `?access=${encodeURIComponent(accessToken)}` : ''}`;
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white">
        <div className="mx-auto max-w-2xl space-y-6">
          <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <button
              onClick={() => router.push(`/fiestas/nueva/entretenimiento?fiestaId=${fiestaId}`)}
              className="p-2 text-zinc-400 hover:text-white"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-400">Operador IA</p>
              <h1 className="text-lg font-black">{fiesta?.eventName || 'Espejo Magico IA'}</h1>
            </div>
            <a
              href={displayHref}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-zinc-400 hover:text-white"
              title="Abrir pantalla de invitado"
            >
              <QrCode className="h-5 w-5" />
            </a>
          </header>

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Estado</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-black capitalize">
                <Radio className={`h-4 w-4 ${session?.status && session.status !== 'idle' ? 'text-emerald-400' : 'text-zinc-600'}`} />
                {session?.status || 'sin conectar'}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Responsable</p>
              <p className="mt-2 text-sm font-black">{fiesta?.station.operatorName || 'Sin asignar'}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ubicacion</p>
              <p className="mt-2 text-sm font-black">{fiesta?.station.location || 'Salon'}</p>
            </div>
          </section>

          <section className="space-y-4 border-t border-zinc-800 pt-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Experiencia</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['faceswap', 'Face Swap'],
                  ['ai_themes', 'Tema artistico'],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setActiveTab(mode)}
                    className={`h-11 rounded-lg border text-xs font-black ${
                      activeTab === mode
                        ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'faceswap' ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FACE_SWAP_CHARACTERS.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => setSelectedCharacter(character.id)}
                    className={`rounded-lg border p-3 text-left ${
                      selectedCharacter === character.id
                        ? 'border-fuchsia-500 bg-fuchsia-500/10'
                        : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <span className="text-xl">{character.emoji}</span>
                    <p className="mt-1 text-xs font-black">{character.label}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TOUCHPIX_THEMES.filter((theme) => theme.id !== 'original').map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedAiTheme(theme.id)}
                    className={`rounded-lg border p-3 text-left ${
                      selectedAiTheme === theme.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <span className="text-xl">{theme.emoji}</span>
                    <p className="mt-1 text-xs font-black">{theme.label}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              onClick={async () => {
                setErrorMsg(null);
                const result = await startEntertainmentSession(
                  fiestaId,
                  'espejoMagicoIA',
                  {
                    mode: activeTab,
                    characterId: selectedCharacter,
                    themeId: selectedAiTheme,
                    operatorName: fiesta?.station.operatorName,
                  },
                  accessToken
                );
                if (!result.success) setErrorMsg(result.error || 'No se pudo iniciar Touchpix.');
              }}
              disabled={Boolean(session?.status && !['idle', 'done'].includes(session.status))}
              className="flex h-16 items-center justify-center gap-2 rounded-lg bg-fuchsia-600 text-base font-black hover:bg-fuchsia-500 disabled:opacity-50"
            >
              <Zap className="h-5 w-5" />
              Iniciar captura
            </button>
            <button
              onClick={async () => {
                setErrorMsg(null);
                const result = await resetEntertainmentSession(
                  fiestaId,
                  'espejoMagicoIA',
                  accessToken
                );
                if (!result.success) setErrorMsg(result.error || 'No se pudo reiniciar Touchpix.');
              }}
              className="flex h-16 items-center justify-center gap-2 rounded-lg border border-zinc-700 px-6 font-bold text-zinc-300 hover:bg-zinc-900"
            >
              <RefreshCw className="h-4 w-4" />
              Reiniciar
            </button>
          </div>
          {errorMsg && <p className="text-center text-xs font-bold text-rose-400">{errorMsg}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={processingCanvasRef} className="hidden" />

      {errorMsg && (
        <div className="absolute left-1/2 top-20 z-50 w-[min(90vw,34rem)] -translate-x-1/2 rounded-xl border border-rose-500/30 bg-zinc-950/95 p-4 text-center text-sm font-bold text-rose-300 shadow-2xl">
          {errorMsg}
        </div>
      )}

      {/* ═══════════ HEADER ═══════════ */}
      <div className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button type="button" onClick={() => router.back()} aria-label="Volver" title="Volver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 mx-4">
          <div className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" />
            <h1 className="text-lg font-black tracking-[0.2em] bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              TOUCHPIX IA
            </h1>
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          </div>
          {fiesta && (
            <p className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase mt-0.5 truncate">{fiesta.eventName}</p>
          )}
        </div>

        {!capturedImage && wizardStep === 0 && !errorMsg && fiesta ? (
          <button type="button" onClick={toggleCamera} aria-label="Cambiar camara" title="Cambiar camara" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20">
            <SwitchCamera className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* ═══════════ FLASH OVERLAY ═══════════ */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-white z-50" />
        )}
      </AnimatePresence>

      {/* ═══════════ MAIN VIEWPORT ═══════════ */}
      <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center">
        {errorMsg ? (
          <div className="p-6 text-center text-red-400 font-medium">
            <p className="text-5xl mb-4">📷🚫</p>
            {errorMsg}
          </div>
        ) : !capturedImage ? (
          
          /* Progressive Wizard Steps or Camera Preview */
          wizardStep > 0 ? (
            <div className="absolute inset-0 z-30 bg-zinc-950/95 overflow-y-auto px-6 py-10 flex flex-col justify-start">
              <div className="w-full max-w-sm mx-auto space-y-6">
                
                {/* Step 1: Select Category */}
                {wizardStep === 1 && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 mx-auto bg-fuchsia-500/10 rounded-full flex items-center justify-center text-3xl shadow-xl shadow-fuchsia-500/5 border border-fuchsia-500/30">
                        🪄
                      </div>
                      <h2 className="text-2xl font-black">Asistente de Retrato IA</h2>
                      <p className="text-xs text-zinc-400">Seleccioná qué tipo de transformación querés realizar hoy.</p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setActiveTab('faceswap');
                          setWizardStep(2);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-5 text-left transition hover:border-fuchsia-500/40"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">🎭</div>
                          <div>
                            <p className="text-sm font-black text-white">Face Swap (IA)</p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">Reemplaza tu cara con astronautas, rockstars y más.</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('ai_themes');
                          setWizardStep(2);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-5 text-left transition hover:border-purple-500/40"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">🎬</div>
                          <div>
                            <p className="text-sm font-black text-white">Temas Artísticos IA</p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">Transforma toda la foto en estilos artísticos increíbles.</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Select Character or Style */}
                {wizardStep === 2 && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="text-center space-y-1">
                      <h2 className="text-xl font-black">Elegí tu Estilo Favorito</h2>
                      <p className="text-xs text-zinc-400">
                        {activeTab === 'faceswap' ? 'Seleccioná el personaje en el que te querés convertir.' : 'Seleccioná el estilo artístico del fondo y filtros.'}
                      </p>
                    </div>

                    {activeTab === 'faceswap' ? (
                      <div className="grid grid-cols-2 gap-3">
                        {FACE_SWAP_CHARACTERS.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCharacter(c.id)}
                            className={`relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all ${
                              selectedCharacter === c.id
                                ? 'border-fuchsia-500 bg-fuchsia-500/10'
                                : 'border-white/5 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-3xl">{c.emoji}</span>
                            <div>
                              <p className="text-xs font-black text-white">{c.label}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">{c.description}</p>
                            </div>
                            {selectedCharacter === c.id && <Sparkle className="w-3.5 h-3.5 absolute top-3 right-3 text-fuchsia-400 fill-fuchsia-400" />}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {TOUCHPIX_THEMES.filter(t => t.id !== 'original').map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedAiTheme(t.id)}
                            className={`relative flex flex-col gap-2 rounded-lg border p-4 text-left transition-all ${
                              selectedAiTheme === t.id
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-white/5 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-3xl">{t.emoji}</span>
                            <div>
                              <p className="text-xs font-black text-white">{t.label}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">{t.description}</p>
                            </div>
                            {selectedAiTheme === t.id && <Sparkle className="w-3.5 h-3.5 absolute top-3 right-3 text-purple-400 fill-purple-400" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeTab !== 'foto' && (
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-fuchsia-400/30 bg-fuchsia-950/20 p-4 text-left">
                        <input
                          type="checkbox"
                          checked={consentAccepted}
                          onChange={(event) => setConsentAccepted(event.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-fuchsia-500"
                        />
                        <span className="text-xs leading-relaxed text-zinc-300">
                          Acepto que mi foto se procese temporalmente con IA para crear este recuerdo.
                        </span>
                      </label>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setWizardStep(1)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs"
                      >
                        ← Volver
                      </button>
                      <button
                        onClick={() => setWizardStep(0)}
                        disabled={activeTab !== 'foto' && !consentAccepted}
                        className="flex-1 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" /> Abrir Cámara
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>
            </div>
          ) : (
            /* Standard Live Camera Feed */
            <div className="relative w-full h-full">
              <GuiaPosicionamiento
                nombreInvitado={nombreInvitado}
                estado={countdown !== null ? 'countdown' : isProcessing ? 'processing' : capturedImage ? 'done' : 'idle'}
                countdown={countdown}
                mensajeGuia={
                  isProcessing
                    ? 'Transformando tu rostro con inteligencia artificial...'
                    : 'Mirá a la cámara para capturar tu avatar mágico'
                }
              />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                style={{ filter: getLiveFilter() }}
              />
              {activeTab === 'foto' && selectedTheme !== 'original' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2"
                >
                  <span className="text-lg">{TOUCHPIX_THEMES.find(t => t.id === selectedTheme)?.emoji}</span>
                  <span className="text-xs font-bold text-white">{TOUCHPIX_THEMES.find(t => t.id === selectedTheme)?.label}</span>
                </motion.div>
              )}
              {activeTab === 'faceswap' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2"
                >
                  <span className="text-lg">{FACE_SWAP_CHARACTERS.find(c => c.id === selectedCharacter)?.emoji}</span>
                  <span className="text-xs font-bold text-white">{FACE_SWAP_CHARACTERS.find(c => c.id === selectedCharacter)?.label}</span>
                </motion.div>
              )}
            </div>
          )

        ) : (
          /* Captured photo review */
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} className="w-full h-full object-contain bg-black" alt="Captura Touchpix" />
            {processingResult && (
              <div className={`absolute left-3 top-3 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide backdrop-blur-md ${
                processingResult === 'ai'
                  ? 'border-emerald-300/50 bg-emerald-950/80 text-emerald-200'
                  : 'border-amber-300/50 bg-amber-950/80 text-amber-200'
              }`}>
                {processingResult === 'ai' ? 'Generada con IA' : 'Efecto local'}
              </div>
            )}
          </div>
        )}

        {/* ── Countdown Overlay ── */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute z-30 flex items-center justify-center"
            >
              <span className="text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(217,70,239,0.6)]">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Processing Queue Overlay with Host Trivia ── */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md"
            >
              <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="mb-6"
                >
                  <Sparkles className="w-16 h-16 text-fuchsia-300" />
                </motion.div>
                
                <p className="text-xl font-black text-white mb-2">{processingText}</p>
                <div className="flex gap-1.5 justify-center mb-6">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2.5 h-2.5 rounded-full bg-fuchsia-400"
                    />
                  ))}
                </div>

                {/* Queue interactive Trivia card */}
                <div className="w-full space-y-2 rounded-lg border border-white/10 bg-white/5 p-5 text-center shadow-xl">
                  <p className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest flex items-center gap-1.5 justify-center">
                    <Wand2 className="w-3.5 h-3.5 animate-pulse" /> Trivia de la fiesta
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={triviaIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-zinc-300 font-semibold leading-relaxed"
                    >
                      {triviaList[triviaIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Success Celebration ── */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
            >
              <PartyPopper className="w-24 h-24 text-fuchsia-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-white mb-2">
                {queuedOffline ? '¡Foto guardada!' : '¡Foto enviada!'}
              </h2>
              <p className="text-lg text-zinc-300">
                {queuedOffline
                  ? 'Se publicará automáticamente cuando vuelva Internet.' /* audit-promesa-verificada: offline-sync-manager */
                  : fiesta?.socialWallEnabled ? 'Ya está en el muro de la fiesta 🎉' : 'Ya está guardada 🎉'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ BOTTOM CONTROLS ═══════════ */}
      <div className="relative z-20 shrink-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5">
        
        {/* Review Actions */}
        {isReviewMode && !isProcessing && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-around">
              {fiesta?.station.allowGuestRetake && fiesta.station.maxRetakes > 0 && (
                <button onClick={retake} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition">
                  <div className="h-[52px] w-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold">Repetir</span>
                </button>
              )}

              <button onClick={() => setShowQrModal(true)} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition">
                <div className="h-[52px] w-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">Compartir</span>
              </button>

              <button onClick={handleUpload} disabled={isUploading} className="flex flex-col items-center gap-1.5 text-white">
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_0_30px_rgba(217,70,239,0.4)] flex items-center justify-center">
                  {isUploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7 ml-0.5" />}
                </div>
                <span className="text-xs font-black uppercase tracking-wide">{fiesta?.socialWallEnabled ? 'Publicar al muro' : 'Guardar foto'}</span>
              </button>

              <button onClick={handleDownload} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition">
                <div className="h-[52px] w-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">Guardar</span>
              </button>

              {activeTab === 'ai_themes' && (
                <button
                  onClick={() => {
                    setCapturedImage(rawCapturedImage);
                    setProcessingResult(null);
                  }}
                  className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-fuchsia-400 transition"
                >
                  <div className="h-[52px] w-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold">Otro Tema</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* AI Themes selection overlay */}
        {isAiThemeSelection && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-fuchsia-400" />
              <p className="text-sm font-bold text-white">Elegí un tema para tu foto</p>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {TOUCHPIX_THEMES.filter(t => t.id !== 'original').map(theme => (
                <button
                  key={theme.id}
                  onClick={() => applyAiTheme(theme.id)}
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border transition-all
                    ${selectedAiTheme === theme.id ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/10 bg-white/5'}`}
                >
                  <span className="text-xl">{theme.emoji}</span>
                  <span className="text-[9px] font-bold text-zinc-300 leading-tight text-center truncate w-full">{theme.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {fiesta?.station.allowGuestRetake && fiesta.station.maxRetakes > 0 && (
                <button onClick={retake} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white">← Repetir</button>
              )}
              <button
                onClick={() => {
                  applyFilterToCanvas(rawCapturedImage!, 'none', (result) => {
                    setCapturedImage(result);
                    setProcessingResult(null);
                  });
                }}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
              >📷 Original</button>
            </div>
          </motion.div>
        )}

        {/* Camera mode selector & triggers */}
        {!capturedImage && !errorMsg && wizardStep === 0 && (
          <>
            <div className="px-3 pt-3">
              {activeTab === 'foto' && (
                <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                  {TOUCHPIX_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border
                        ${selectedTheme === theme.id ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300' : 'border-white/10 bg-white/5 text-zinc-400'}`}
                    >
                      <span className="text-base">{theme.emoji}</span> {theme.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center pb-3 pt-1">
              <button
                onClick={takePhoto}
                disabled={countdown !== null}
                className="w-[72px] h-[72px] rounded-full p-1.5 transition active:scale-90"
                style={{ background: 'linear-gradient(135deg, rgb(217, 70, 239), rgb(147, 51, 234))' }}
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-xl">
                  <Camera className="w-7 h-7 text-purple-700" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* TAB BAR (always visible at bottom) */}
        <div className="flex border-t border-white/5 bg-zinc-950/80">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (capturedImage) retake();
                setActiveTab(tab.id);
                if (tab.id === 'faceswap' || tab.id === 'ai_themes') {
                  setWizardStep(1);
                } else {
                  setWizardStep(0);
                }
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all
                ${activeTab === tab.id ? 'text-fuchsia-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <div className="relative">
                {tab.icon}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-fuchsia-400" />
                )}
              </div>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <QrModal />
      <KioskUnlockButton />
      <SyncStatusIndicator
        fiestaId={fiestaId}
        moduleId="touchpix"
        accessToken={accessToken}
        guestId={guestId}
        guestAccessToken={guestAccessToken}
      />
    </div>
  );
}
