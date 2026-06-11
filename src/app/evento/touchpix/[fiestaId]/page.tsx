'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, SwitchCamera, Download, Send, ArrowLeft, Loader2, PartyPopper, RefreshCw, Sparkles, Wand2, Users, QrCode, X, Palette } from 'lucide-react';
import { applyFaceSwap, applyTouchpixTheme, uploadTouchpixPhoto } from '@/app/actions/touchpix-ai';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

/* ───────────────────── Theme Definitions ───────────────────── */

const TOUCHPIX_THEMES = [
  { id: 'original', label: 'Original', emoji: '📷', gradient: 'from-zinc-700 to-zinc-800', cssFilter: 'none', description: 'Sin efectos' },
  { id: 'disco_glam', label: 'Disco Glam', emoji: '🪩', gradient: 'from-fuchsia-600 to-purple-800', cssFilter: 'brightness(1.1) contrast(1.1) saturate(1.3)', description: 'Brillo disco' },
  { id: 'neon_retro', label: 'Neón Retro', emoji: '🌆', gradient: 'from-cyan-500 to-blue-700', cssFilter: 'hue-rotate(180deg) saturate(2) brightness(1.05)', description: 'Estilo 80s' },
  { id: 'fantasy_enchanted', label: 'Fantasía', emoji: '🧚', gradient: 'from-emerald-500 to-teal-700', cssFilter: 'brightness(1.05) saturate(0.9) hue-rotate(90deg) contrast(1.05)', description: 'Mundo mágico' },
  { id: 'pop_art', label: 'Pop Art', emoji: '🎨', gradient: 'from-yellow-500 to-red-600', cssFilter: 'saturate(2.5) contrast(1.4) brightness(1.05)', description: 'Estilo Warhol' },
  { id: 'golden_luxury', label: 'Luxury', emoji: '👑', gradient: 'from-amber-500 to-yellow-700', cssFilter: 'sepia(0.5) saturate(1.5) brightness(1.1) contrast(1.1)', description: 'Dorado premium' },
  { id: 'cosmic_galaxy', label: 'Cósmico', emoji: '🌌', gradient: 'from-indigo-600 to-violet-900', cssFilter: 'hue-rotate(270deg) saturate(1.5) brightness(0.95) contrast(1.2)', description: 'Viaje espacial' },
  { id: 'carnival_fiesta', label: 'Carnaval', emoji: '🎉', gradient: 'from-orange-500 to-pink-600', cssFilter: 'saturate(1.8) brightness(1.1) contrast(1.05)', description: 'Fiesta total' },
];

/* ───────────────────── Face Swap Characters ───────────────────── */

const FACE_SWAP_CHARACTERS = [
  { id: 'superhero', label: 'Superhéroe', emoji: '🦸', gradient: 'from-red-600 to-blue-700', filter: 'saturate(1.6) contrast(1.3) brightness(1.05)', frameEmojis: ['💥', '⚡', '🌟', '✨'] },
  { id: 'astronaut', label: 'Astronauta', emoji: '🧑‍🚀', gradient: 'from-slate-600 to-indigo-800', filter: 'hue-rotate(200deg) saturate(0.7) brightness(1.15) contrast(1.1)', frameEmojis: ['🌠', '🚀', '⭐', '🪐'] },
  { id: 'royalty', label: 'Realeza', emoji: '👑', gradient: 'from-amber-500 to-yellow-700', filter: 'sepia(0.6) saturate(1.4) brightness(1.1)', frameEmojis: ['👑', '💎', '🏰', '✨'] },
  { id: 'pirate', label: 'Pirata', emoji: '🏴‍☠️', gradient: 'from-stone-700 to-red-900', filter: 'sepia(0.4) contrast(1.3) brightness(0.9)', frameEmojis: ['☠️', '🗡️', '🏴‍☠️', '💰'] },
  { id: 'rockstar', label: 'Rockstar', emoji: '🎸', gradient: 'from-purple-700 to-pink-600', filter: 'contrast(1.4) saturate(1.5) brightness(1.05)', frameEmojis: ['🎸', '🤘', '🔥', '🎤'] },
  { id: 'fairy', label: 'Hada', emoji: '🧚', gradient: 'from-pink-400 to-violet-600', filter: 'brightness(1.15) saturate(1.2) hue-rotate(330deg)', frameEmojis: ['🧚', '✨', '🌸', '🦋'] },
];

type TabMode = 'foto' | 'faceswap' | 'ai_themes';
type ProcessingResult = 'ai' | 'fallback' | null;

async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
}

/* ───────────────────── Component ───────────────────── */

export default function TouchpixPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement>(null);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  /* ── Load fiesta data ── */
  useEffect(() => {
    getFiestaById(fiestaId).then(f => setFiesta(f)).catch(() => {});
    return () => { stopCamera(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiestaId]);

  useEffect(() => {
    if (!capturedImage) startCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    setStream(prev => {
      if (prev) prev.getTracks().forEach(t => t.stop());
      return null;
    });
  }, []);

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
    const eventName = fiesta?.configuracion?.nombreEvento || 'Nuestra Fiesta';
    const rawDate = fiesta?.configuracion?.fechaEvento;
    let eventDateStr = '';
    if (rawDate) {
      try {
        const date = new Date(rawDate);
        eventDateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
  }, [fiesta]);

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

      // Draw overlay emojis for face swap characters
      if (overlayEmojis && overlayEmojis.length > 0) {
        const emojiSize = Math.max(40, img.width * 0.06);
        ctx.font = `${emojiSize}px sans-serif`;
        ctx.textBaseline = 'top';

        // Corner emojis
        ctx.fillText(overlayEmojis[0] || '✨', 20, 20);
        ctx.fillText(overlayEmojis[1] || '✨', img.width - emojiSize - 20, 20);
        ctx.fillText(overlayEmojis[2] || '✨', 20, img.height - emojiSize - 80);
        ctx.fillText(overlayEmojis[3] || '✨', img.width - emojiSize - 20, img.height - emojiSize - 80);

        // Decorative border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 8;
        const r = 20;
        ctx.beginPath();
        ctx.roundRect(12, 12, img.width - 24, img.height - 24, r);
        ctx.stroke();
      }

      // Main character emoji overlay (large, centered top)
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

  const takePhoto = useCallback(() => {
    if (countdown !== null) return;
    let currentCount = 3;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, playBeep, activeTab, selectedTheme, selectedCharacter]);

  const handleCapture = useCallback(async () => {
    const raw = captureRawPhoto();
    if (!raw) return;
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
        // Original — just add watermark
        applyFilterToCanvas(raw, 'none', (result) => {
          setCapturedImage(result);
        });
      }
    } else if (activeTab === 'faceswap') {
      const character = FACE_SWAP_CHARACTERS.find(c => c.id === selectedCharacter);
      if (!character) return;
      setIsProcessing(true);
      setProcessingText('Generando transformación con IA...');

      try {
        const formData = new FormData();
        formData.set('fiestaId', fiestaId);
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
        // The local effect below keeps the booth usable when the provider is unavailable.
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
      // Keep raw for theme selection step
      setCapturedImage(raw);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureRawPhoto, stopCamera, activeTab, selectedTheme, selectedCharacter, applyFilterToCanvas, fiestaId]);

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
      formData.set('themeId', themeId);
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
      // Fall through to the explicit local effect.
    }

    setProcessingText('IA no disponible. Aplicando efecto local...');
    const filterStr = theme.cssFilter === 'none' ? 'none' : theme.cssFilter;
    applyFilterToCanvas(rawCapturedImage, filterStr, (result) => {
      setCapturedImage(result);
      setProcessingResult('fallback');
      setIsProcessing(false);
    });
  }, [rawCapturedImage, applyFilterToCanvas, fiestaId]);

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

  /* ── Upload ── */
  const handleUpload = useCallback(async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    try {
      const file = await dataUrlToFile(capturedImage, `touchpix-${Date.now()}.jpg`);
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Cabina Touchpix');
      if (activeTab === 'ai_themes') {
        formData.append('themeLabel', TOUCHPIX_THEMES.find(theme => theme.id === selectedAiTheme)?.label || '');
      }
      if (activeTab === 'faceswap') {
        formData.append('characterLabel', FACE_SWAP_CHARACTERS.find(character => character.id === selectedCharacter)?.label || '');
      }

      const res = await uploadTouchpixPhoto(formData);
      if (res.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          retake();
        }, 3000);
      } else {
        throw new Error(res.error || 'Error al subir');
      }
    } catch (err) {
      alert('No se pudo subir la foto. ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage, fiestaId, activeTab, selectedAiTheme, selectedCharacter]);

  /* ── Retake ── */
  const retake = useCallback(() => {
    setCapturedImage(null);
    setRawCapturedImage(null);
    setIsProcessing(false);
    setProcessingResult(null);
    startCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCamera]);

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

  /* ── Tab definitions ── */
  const tabs: { id: TabMode; label: string; emoji: string; icon: React.ReactNode }[] = [
    { id: 'foto', label: 'Foto', emoji: '📷', icon: <Camera className="w-5 h-5" /> },
    { id: 'faceswap', label: 'Face Swap', emoji: '🎭', icon: <Users className="w-5 h-5" /> },
    { id: 'ai_themes', label: 'Temas IA', emoji: '🎬', icon: <Wand2 className="w-5 h-5" /> },
  ];

  /* ── Is in review state (showing captured photo, not yet in AI theme selection) ── */
  const isReviewMode = capturedImage !== null && !(activeTab === 'ai_themes' && !isProcessing && rawCapturedImage && capturedImage === rawCapturedImage);
  const isAiThemeSelection = activeTab === 'ai_themes' && capturedImage === rawCapturedImage && !isProcessing && rawCapturedImage !== null;

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      {/* Hidden canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={processingCanvasRef} className="hidden" />

      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-fuchsia-900/20 via-purple-900/10 to-transparent rounded-full blur-3xl" />
      </div>

      {/* ═══════════ HEADER ═══════════ */}
      <div className="relative z-20 px-4 pt-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button onClick={() => router.back()} className="p-2.5 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 mx-4">
          <div className="flex items-center justify-center gap-1.5">
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
            </motion.div>
            <h1 className="text-lg font-black tracking-[0.2em] bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">
              TOUCHPIX
            </h1>
            <motion.div animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </motion.div>
          </div>
          <p className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">Experiencia de Foto Premium</p>
          {fiesta && (
            <p className="text-xs text-zinc-400 font-medium mt-0.5 truncate">{fiesta.configuracion?.nombreEvento}</p>
          )}
        </div>

        {!capturedImage ? (
          <button onClick={toggleCamera} className="p-2.5 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
            <SwitchCamera className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* ═══════════ FLASH OVERLAY ═══════════ */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white z-50"
          />
        )}
      </AnimatePresence>

      {/* ═══════════ MAIN VIEWPORT ═══════════ */}
      <div className="flex-1 relative w-full overflow-hidden flex items-center justify-center">
        {errorMsg ? (
          <div className="p-6 text-center text-red-400 font-medium">
            <p className="text-5xl mb-4">📷🚫</p>
            {errorMsg}
            <button onClick={() => startCamera()} className="mt-4 px-6 py-2 bg-fuchsia-600 rounded-full text-white font-bold text-sm">
              Reintentar
            </button>
          </div>
        ) : !capturedImage ? (
          /* Camera preview */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              style={{ filter: getLiveFilter() }}
            />
            {/* Theme label overlay */}
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
            {/* Face swap character overlay */}
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
        ) : (
          /* Captured photo review */
          <div className="relative w-full h-full">
            {/* Data URLs from the camera and AI result cannot use Next image optimization. */}
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

        {/* ── Processing Overlay ── */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/80 via-purple-900/80 to-indigo-900/80 backdrop-blur-md" />
              <div className="relative z-10 flex flex-col items-center text-center px-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="mb-6"
                >
                  <Sparkles className="w-16 h-16 text-fuchsia-300" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Wand2 className="w-10 h-10 text-purple-300 mb-4" />
                </motion.div>
                <p className="text-xl font-black text-white mb-2">{processingText}</p>
                <div className="flex gap-1.5 mt-3">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-3 h-3 rounded-full bg-fuchsia-400"
                    />
                  ))}
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
              <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                <PartyPopper className="w-24 h-24 text-fuchsia-400 mb-4" />
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">¡Foto enviada!</h2>
              <p className="text-lg text-zinc-300">Ya está en el muro de la fiesta 🎉</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════ BOTTOM CONTROLS ═══════════ */}
      <div className="relative z-20 shrink-0 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5">

        {/* ── CAPTURED: Review Actions ── */}
        {isReviewMode && !isProcessing && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-around">
              <button onClick={retake} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition">
                <div className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">Repetir</span>
              </button>

              <button onClick={() => setShowQrModal(true)} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition">
                <div className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold">Compartir</span>
              </button>

              <button
                onClick={handleUpload}
                disabled={isUploading || showSuccess}
                className="flex flex-col items-center gap-1.5 text-white"
              >
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_0_30px_rgba(217,70,239,0.4)] flex items-center justify-center active:scale-95 transition">
                  {isUploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7 ml-0.5" />}
                </div>
                <span className="text-xs font-black uppercase tracking-wide">Subir al Muro</span>
              </button>

              <button onClick={handleDownload} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-white transition">
                <div className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
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
                  <div className="w-13 h-13 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Palette className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold">Otro Tema</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── AI Theme Selection (after raw capture) ── */}
        {isAiThemeSelection && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-fuchsia-400" />
              <p className="text-sm font-bold text-white">Elegí un tema para tu foto</p>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {TOUCHPIX_THEMES.filter(t => t.id !== 'original').map(theme => (
                <button
                  key={theme.id}
                  onClick={() => applyAiTheme(theme.id)}
                  className={`relative flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all
                    ${selectedAiTheme === theme.id
                      ? 'border-fuchsia-500 bg-fuchsia-500/10 ring-2 ring-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl`}>
                    {theme.emoji}
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300 leading-tight text-center">{theme.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={retake}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition"
              >
                ← Repetir
              </button>
              <button
                onClick={() => {
                  applyFilterToCanvas(rawCapturedImage!, 'none', (result) => {
                    setCapturedImage(result);
                    setProcessingResult(null);
                  });
                }}
                className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-zinc-400 hover:text-white transition"
              >
                📷 Original
              </button>
            </div>
          </motion.div>
        )}

        {/* ── NOT CAPTURED: Camera Controls ── */}
        {!capturedImage && !errorMsg && (
          <>
            {/* Mode-specific selector */}
            <div className="px-3 pt-3">
              {activeTab === 'foto' && (
                <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                  {TOUCHPIX_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                        ${selectedTheme === theme.id
                          ? 'border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-300 ring-2 ring-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.2)]'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                    >
                      <span className="text-base">{theme.emoji}</span>
                      {theme.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'faceswap' && (
                <div className="grid grid-cols-3 gap-2 pb-2">
                  {FACE_SWAP_CHARACTERS.map(char => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedCharacter(char.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all
                        ${selectedCharacter === char.id
                          ? 'border-fuchsia-500 bg-fuchsia-500/10 ring-2 ring-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${char.gradient} flex items-center justify-center text-xl`}>
                        {char.emoji}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-300">{char.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'ai_themes' && (
                <div className="flex items-center gap-2 pb-2 px-1">
                  <Wand2 className="w-4 h-4 text-fuchsia-400 shrink-0" />
                  <p className="text-xs text-zinc-400">Sacá una foto y después elegí un tema IA</p>
                </div>
              )}
            </div>

            {/* Capture Button */}
            <div className="flex justify-center pb-3 pt-1">
              <button
                onClick={takePhoto}
                disabled={countdown !== null}
                className="w-[72px] h-[72px] rounded-full p-1.5 transition-transform active:scale-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, rgb(217, 70, 239), rgb(147, 51, 234))' }}
              >
                <div className="w-full h-full rounded-full bg-white/95 flex items-center justify-center shadow-xl">
                  <Camera className="w-7 h-7 text-purple-700" />
                </div>
              </button>
            </div>
          </>
        )}

        {/* ═══════════ TAB BAR ═══════════ */}
        <div className="flex border-t border-white/5 bg-zinc-950/80">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (capturedImage) retake();
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all
                ${activeTab === tab.id
                  ? 'text-fuchsia-400'
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <div className={`relative ${activeTab === tab.id ? 'scale-110' : ''} transition-transform`}>
                {tab.icon}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-fuchsia-400"
                  />
                )}
              </div>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════ QR MODAL ═══════════ */}
      <AnimatePresence>
        <QrModal />
      </AnimatePresence>
    </div>
  );
}
