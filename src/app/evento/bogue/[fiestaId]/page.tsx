'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { generarGifDesdeImagenes } from '@/lib/entretenimiento/gif-generator';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Play,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  RefreshCw,
  QrCode,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  Check,
  Radio,
  Zap,
} from 'lucide-react';
import { QrRecuerdo } from '@/components/entretenimiento/QrRecuerdo';
import { AvisoDeFallaEnEstacion } from '@/components/entretenimiento/AvisoDeFallaEnEstacion';
import {
  getPublicEntertainmentEvent,
  uploadEntretenimientoMedia,
} from '@/app/actions/fiesta/entretenimiento.actions';
import {
  getEntertainmentSession,
  startEntertainmentSession,
  updateEntertainmentSessionStatus,
  resetEntertainmentSession,
  completeEntertainmentSessionCycle,
  EntertainmentSession,
} from '@/app/actions/fiesta/sesion-entretenimiento';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { isVideoFrameReady } from '@/lib/entertainment/camera-readiness';
import { withPublicRequestTimeout } from '@/lib/public-experience/wait-for-initial-public-load';
import { parseEventDate } from '@/lib/public-experience/event-date';
import { imprimirRecuerdo } from '@/lib/entretenimiento/imprimir-recuerdo';
import { componerTiraDeFotos } from '@/lib/entretenimiento/tira-fotocabina';

const BOGUE_FRAMES = [
  { id: 'none', label: 'Sin Marco', border: 'transparent' },
  { id: 'neon-glow', label: 'Neón Fiesta', border: 'rgba(236, 72, 153, 0.8)' },
  { id: 'luxury-gold', label: 'Luxury Oro', border: 'rgba(234, 179, 8, 0.8)' },
  { id: 'cyberpunk', label: 'Cyberpunk', border: 'rgba(6, 182, 212, 0.8)' },
  /**
   * El marco que se arma solo con los datos de la fiesta.
   *
   * Va como una opcion mas, no como el que viene puesto: el operador lo elige si
   * quiere. Asi nadie se encuentra con que le cambio el recuerdo que ya venia
   * saliendo bien. Lleva el nombre del agasajado, el motivo y la fecha, sin que
   * haya que cargar ninguna imagen por evento.
   */
  { id: 'fiesta', label: 'De la fiesta', border: 'rgba(212, 175, 55, 0.85)' },
];

import { GuiaPosicionamiento } from '@/components/entretenimiento/GuiaPosicionamiento';
import { dibujarMarcoDinamico } from '@/lib/entretenimiento/marcos-dinamicos';

export default function BoguePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const role = searchParams.get('role') || 'display'; // 'display' | 'operator'
  const accessToken = searchParams.get('access') || undefined;
  const guestId = searchParams.get('guestId') || undefined;
  const guestAccessToken = searchParams.get('guestAccessToken') || searchParams.get('token') || undefined;
  const nombreInvitado = searchParams.get('nombre') || searchParams.get('name') || undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Real-time Firestore sync
  const [session, setSession] = useState<EntertainmentSession | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  
  // Capturas
  const [capturedFrames, setCapturedFrames] = useState<HTMLCanvasElement[]>([]);
  const [recordingProgress, setRecordingProgress] = useState(0); // 0 to 100
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [finalStripUrl, setFinalStripUrl] = useState<string | null>(null);
  /**
   * El GIF, que es lo que la gente manda por WhatsApp.
   *
   * Bogue ya guarda los cuadros de la tanda para armar el boomerang, asi que el
   * GIF sale de los mismos cuadros: no se le pide al invitado que pose de nuevo.
   * Se arma cuando lo toca, no antes, para no hacerlo esperar por algo que capaz
   * no quiere.
   */
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [armandoGif, setArmandoGif] = useState(false);
  const [cuadrosDeLaTanda, setCuadrosDeLaTanda] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [uploadedPostUrl, setUploadedPostUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const [selectedFrame, setSelectedFrame] = useState('none');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Se separa del mensaje de progreso para que la pantalla final sepa si el
  // video llego al muro o no. Antes no habia forma de distinguirlo y el cuadro
  // del QR quedaba girando como si todavia estuviera subiendo.
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Audio effect context for high-quality beeps
  const audioCtxRef = useRef<AudioContext | null>(null);
  const resetLocalStateRef = useRef<() => void>(() => undefined);
  const startCaptureProcessRef = useRef<(recordDuration?: number, totalFrames?: number) => void>(() => undefined);
  const localStatusRef = useRef<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const selectedFrameRef = useRef('none');

  const speak = (text: string) => {
    if (!voiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find(v => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('SpeechSynthesis error:', e);
    }
  };

  const playBeep = (freq = 880, duration = 0.1) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      const cameraError = 'No pudimos abrir la cámara. Revisa el permiso del navegador y vuelve a intentar.';
      setCameraError(cameraError);
      void updateEntertainmentSessionStatus(
        fiestaId,
        'bogue',
        'idle',
        { lastError: cameraError },
        accessToken,
      ).catch((statusError) => console.error('No se pudo avisar la falla de cámara al operador:', statusError));
    }
  }, [accessToken, facingMode, fiestaId, stopCamera]);

  // 1. Initial load
  useEffect(() => {
    let active = true;
    setIsEventLoading(true);
    setLoadError(null);
    withPublicRequestTimeout(getPublicEntertainmentEvent(fiestaId, 'bogue', accessToken))
      .then((result) => {
        if (!active) return;
        if (result.success && result.event) setFiesta(result.event);
        else setLoadError(result.error || 'No se pudo abrir esta estación.');
      })
      .catch(() => {
        if (active) setLoadError('No se pudo abrir esta estación. Revisa la conexión e intenta nuevamente.');
      })
      .finally(() => {
        if (active) setIsEventLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, fiestaId, loadAttempt]);

  useEffect(() => {
    localStatusRef.current = localStatus;
    selectedFrameRef.current = selectedFrame;
  }, [localStatus, selectedFrame]);

  // Keep one remote-control channel alive during the full capture workflow.
  useEffect(() => {
    let pollInFlight = false;
    const interval = setInterval(async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      try {
        const s = await getEntertainmentSession(fiestaId, 'bogue', accessToken);
        setSession(s);

        const currentStatus = localStatusRef.current;
        if (role === 'display' && s && s.status !== currentStatus) {
          if (s.status === 'countdown' && currentStatus === 'idle') {
            const requestedFrame = s.settings?.frameId;
            if (
              typeof requestedFrame === 'string' &&
              BOGUE_FRAMES.some((frame) => frame.id === requestedFrame) &&
              requestedFrame !== selectedFrameRef.current
            ) {
              setSelectedFrame(requestedFrame);
              return;
            }
            startCaptureProcessRef.current(s.settings?.duration || 3, s.settings?.frameCount || 15);
          } else if (s.status === 'idle') {
            resetLocalStateRef.current();
          }
        }
      } finally {
        pollInFlight = false;
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [accessToken, fiestaId, role, stopCamera]);

  // 2. Manage WebRTC Camera Feed for Display Role
  useEffect(() => {
    if (fiesta && role === 'display' && (localStatus === 'idle' || localStatus === 'countdown' || localStatus === 'recording')) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [fiesta, localStatus, role, startCamera, stopCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const resetLocalState = () => {
    setLocalStatus('idle');
    setCountdown(null);
    setCapturedFrames([]);
    setRecordingProgress(0);
    setFinalVideoUrl(null);
    setFinalStripUrl(null);
    setUploadedPostUrl(null);
    setIsUploading(false);
    setProgressMsg('');
    if (role === 'display') {
      startCamera();
    }
  };

  const completeGuestCycle = useCallback(() => {
    void completeEntertainmentSessionCycle(fiestaId, 'bogue', accessToken);
    resetLocalState();
  }, [accessToken, fiestaId]);

  // Auto-retorno tras reviewSeconds si está configurado
  useEffect(() => {
    if (localStatus !== 'done') return;
    const timeoutSec = fiesta?.station?.reviewSeconds;
    if (!timeoutSec || timeoutSec <= 0) return;

    const timer = setTimeout(() => {
      completeGuestCycle();
    }, timeoutSec * 1000);

    return () => clearTimeout(timer);
  }, [localStatus, fiesta?.station?.reviewSeconds, completeGuestCycle]);

  // 3. Capture & Process Boomerang (Display flow)
  const startCaptureProcess = async (recordDuration = 3, totalFrames = 15) => {
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'countdown', {}, accessToken);
    }

    let count = fiesta?.station.countdownSeconds || 4;
    setCountdown(count);
    playBeep(600, 0.15);
    speak("Prepárense");

    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep(600, 0.15);
        if (count === 3) speak("Tres");
        if (count === 2) speak("Dos");
        if (count === 1) speak("Uno");
      } else {
        clearInterval(timer);
        setCountdown(null);
        // Start recording
        captureFramesSequence(recordDuration, totalFrames);
      }
    }, 1000);
  };

  useEffect(() => {
    resetLocalStateRef.current = resetLocalState;
    startCaptureProcessRef.current = (recordDuration, totalFrames) => {
      void startCaptureProcess(recordDuration, totalFrames);
    };
  });

  const captureFramesSequence = async (durationSec: number, maxFrames: number) => {
    setLocalStatus('recording');
    await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'recording', {}, accessToken);
    speak("¡Muévanse!");

    const video = videoRef.current;
    if (!isVideoFrameReady(video)) {
      setProgressMsg('La camara todavia se esta preparando. Intenta nuevamente.');
      setLocalStatus('idle');
      return;
    }

    const frames: HTMLCanvasElement[] = [];
    const intervalMs = (durationSec * 1000) / maxFrames;
    let count = 0;

    const captureTimer = setInterval(() => {
      if (!video) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          // Mirror for front camera
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      frames.push(canvas);
      count++;
      setRecordingProgress(Math.round((count / maxFrames) * 100));

      // Play shutter sound on each burst frame
      playBeep(1000, 0.03);

      if (count >= maxFrames) {
        clearInterval(captureTimer);
        setFlash(true);
        setTimeout(() => setFlash(false), 200);
        setCapturedFrames(frames);
        processBoomerangVideo(frames);
      }
    }, intervalMs);
  };

  const processBoomerangVideo = async (frames: HTMLCanvasElement[]) => {
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'processing', {}, accessToken);
    setProgressMsg('Procesando la tanda de fotos...');
    speak("Procesando fotos");

    if (frames.length === 0) {
      setProgressMsg('No se capturaron fotos. Intenta nuevamente.');
      setLocalStatus('idle');
      return;
    }

    // 1. Armar y guardar la tira de fotos (para imprimir)
    let stripUrl: string | null = null;
    try {
      const fotosBase64 = frames.map(f => f.toDataURL('image/jpeg', 0.9));
      setCuadrosDeLaTanda(fotosBase64);
      setGifUrl(null);
      const eventName = fiesta?.eventName || 'Bogue';
      const eventDate = fiesta?.eventDate || '';
      const colorDeAcento = fiesta?.station.accentColor || '#ec4899';
      
      stripUrl = await componerTiraDeFotos({
        fotos: fotosBase64,
        nombreDelEvento: eventName,
        fechaDelEvento: eventDate,
        colorDeAcento,
        colorFondo: fiesta?.colorFondo,
        imagenFondoUrl: fiesta?.imagenFondoUrl,
        textoDeMarca: 'BOGUE LIVE'
      });
      setFinalStripUrl(stripUrl);
    } catch (e) {
      console.error('Error composing photos strip:', e);
    }

    setProgressMsg('Creando el loop de ida y vuelta...');

    // 2. Construct loop frames: 0 -> N-1 -> 0
    const loop: HTMLCanvasElement[] = [...frames];
    for (let i = frames.length - 2; i > 0; i--) {
      loop.push(frames[i]);
    }

    // Prepare rendering and recording canvas
    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = frames[0].width;
    drawCanvas.height = frames[0].height;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    // Stream & record canvas at 12fps
    const canvasStream = drawCanvas.captureStream(12);
    
    // Choose appropriate mime type
    let mimeType = 'video/webm';
    const supportedTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    for (const t of supportedTypes) {
      if (MediaRecorder.isTypeSupported(t)) {
        mimeType = t;
        break;
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 2500000 });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        setFinalVideoUrl(videoUrl);
        
        // Auto Upload
        await handleAutoUpload(videoBlob, stripUrl || undefined);
      };

      mediaRecorder.start();

      // Render the loop 3 times to make a 6s video
      let cycles = 3;
      let frameIndex = 0;

      const drawFrame = () => {
        if (cycles <= 0) {
          mediaRecorder.stop();
          return;
        }

        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        
        // Draw camera frame
        ctx.drawImage(loop[frameIndex], 0, 0);

        // Draw Premium Frame overlay
        drawFrameOverlay(ctx, drawCanvas.width, drawCanvas.height);

        // Draw Watermark
        drawWatermark(ctx, drawCanvas.width, drawCanvas.height);

        // Next frame index
        frameIndex++;
        if (frameIndex >= loop.length) {
          frameIndex = 0;
          cycles--;
        }

        setTimeout(drawFrame, 1000 / 12); // 12 FPS
      };

      drawFrame();

    } catch (e) {
      console.error('Error recording boomerang:', e);
      // Sin aviso, el invitado veia la pantalla volver sola al principio y no
      // entendia si habia grabado o no. En una fiesta nadie se queda a averiguarlo.
      setProgressMsg('No pudimos grabar el video. Proba de nuevo.');
      setLocalStatus('idle');
    }
  };

  const drawFrameOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (selectedFrame === 'none') return;

    if (selectedFrame === 'fiesta') {
      dibujarMarcoDinamico(ctx, w, h, {
        estilo: 'elegante',
        nombreAgasajado: fiesta?.nombreAgasajado,
        nombreEvento: fiesta?.eventName,
        fechaEvento: fiesta?.eventDate,
        colorPrimario: fiesta?.primaryColor || fiesta?.station.accentColor,
      });
      return;
    }
    
    ctx.lineWidth = 0;
    ctx.shadowBlur = 0;

    if (selectedFrame === 'neon-glow') {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.9)'; // pink-500
      ctx.lineWidth = 32;
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 35;
      ctx.strokeRect(16, 16, w - 32, h - 32);
    } else if (selectedFrame === 'luxury-gold') {
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.95)'; // gold
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      
      // Luxury corner decorations
      ctx.fillStyle = 'rgba(234, 179, 8, 1)';
      ctx.font = `${h * 0.03}px serif`;
      ctx.fillText('✨', 50, 90);
      ctx.fillText('✨', w - 100, 90);
      ctx.fillText('✨', 50, h - 70);
      ctx.fillText('✨', w - 100, h - 70);
    } else if (selectedFrame === 'cyberpunk') {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)'; // cyan
      ctx.lineWidth = 24;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      
      // Cyberpunk tag
      ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
      ctx.fillRect(w - 200, h - 80, 180, 50);
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${h * 0.016}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('BOGUE LIVE', w - 110, h - 48);
    }
    
    // Reset shadow values
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const eventName = fiesta?.eventName || 'Nuestra Fiesta';
    const rawDate = fiesta?.eventDate;
    let dateStr = '';
    if (rawDate) {
      try {
        // `parseEventDate`: sin esto la marca de agua salia con el dia anterior.
        dateStr = (parseEventDate(rawDate) ?? new Date(rawDate)).toLocaleDateString('es-UY', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      } catch (e) {}
    }

    // Semi-transparent gradient bar at the bottom
    const bannerHeight = h * 0.09;
    const grad = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `bold ${Math.max(16, h * 0.024)}px sans-serif`;
    ctx.fillText(eventName, w / 2, h - bannerHeight * 0.58);

    if (dateStr) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = `${Math.max(12, h * 0.016)}px sans-serif`;
      ctx.fillText(dateStr, w / 2, h - bannerHeight * 0.28);
    }
  };

  const handleAutoUpload = async (blob: Blob, stripBase64?: string) => {
    setIsUploading(true);
    setUploadError(null);
    setProgressMsg('Subiendo al muro social de la fiesta...');

    try {
      if (stripBase64) {
        try {
          const resStrip = await fetch(stripBase64);
          const blobStrip = await resStrip.blob();
          const fileStrip = new File([blobStrip], `bogue-tira-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const formDataStrip = new FormData();
          formDataStrip.append('fiestaId', fiestaId);
          formDataStrip.append('file', fileStrip);
          formDataStrip.append('authorName', 'Bogue Fotos');
          formDataStrip.append('moduleId', 'bogue');
          if (accessToken) formDataStrip.append('accessToken', accessToken);
          await uploadEntretenimientoMedia(formDataStrip);
        } catch (e) {
          console.error('Error subiendo tira de fotos:', e);
        }
      }

      const file = new File([blob], `bogue-${Date.now()}.mp4`, { type: blob.type });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Bogue Boomerang');
      formData.append('moduleId', 'bogue');
      if (accessToken) formData.append('accessToken', accessToken);

      const res = await uploadEntretenimientoMedia(formData);
      
      if (res.success) {
        const mediaUrl = res.media?.url || '';
        setUploadedPostUrl(mediaUrl);
        setQrCodeUrl(mediaUrl);
        setLocalStatus('done');
        await updateEntertainmentSessionStatus(
          fiestaId,
          'bogue',
          'done',
          { mediaUrl, lastError: null },
          accessToken
        );
        speak("¡Listo! Tu Boomerang ya está subido.");
        
        // Auto reset after 12 seconds
        setTimeout(() => {
          completeGuestCycle();
        }, 12000);
      } else {
        throw new Error(res.error || 'Fallo al subir archivo');
      }
    } catch (err) {
      console.error(err);
      setProgressMsg('No se pudo subir al muro. Conservamos el video para reintentar.');
      setUploadError((err as Error).message || 'No se pudo subir el video al muro.');
      setQrCodeUrl('');
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(
        fiestaId,
        'bogue',
        'done',
        { lastError: 'No se pudo subir el video del invitado al muro.' },
        accessToken,
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Operator Actions
  const handleOperatorStart = async () => {
    setOperatorError(null);
    const result = await startEntertainmentSession(
      fiestaId,
      'bogue',
      {
        duration: fiesta?.station.recordingDurationSeconds || 4,
        frameCount: 15,
        frameId: selectedFrame,
        operatorName: fiesta?.station.operatorName,
      },
      accessToken
    );
    if (!result.success) setOperatorError(result.error || 'No se pudo iniciar Bogue.');
  };

  const handleOperatorReset = async () => {
    setOperatorError(null);
    const result = await resetEntertainmentSession(fiestaId, 'bogue', accessToken);
    if (!result.success) setOperatorError(result.error || 'No se pudo reiniciar Bogue.');
  };

  if (isEventLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-rose-400 motion-reduce:animate-none" aria-label="Cargando estación Bogue" />
      </div>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6">
          <Flame className="mx-auto h-10 w-10 text-rose-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black">No pudimos abrir Bogue</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-black transition hover:bg-rose-400 motion-reduce:transition-none"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Render Operator view
  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6">
        <div className="mx-auto max-w-md space-y-5">
          <AvisoDeFallaEnEstacion mensaje={session?.lastError} cuando={session?.lastErrorAt} />
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.back()} aria-label="Volver" title="Volver" className="rounded-lg p-2 transition hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-rose-300">
              <Flame className="h-5 w-5 motion-safe:animate-pulse" /> Operador Bogue
            </h1>
            <div className="w-9" />
          </div>

          <div className="space-y-5 rounded-lg border border-white/10 bg-zinc-900 p-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de la Cabina</p>
              <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-4 py-3">
                <Radio className={`w-5 h-5 ${session?.status === 'idle' ? 'text-slate-500' : 'text-pink-500 animate-pulse'}`} />
                <span className="font-bold capitalize text-sm">{session?.status || 'Desconectado'}</span>
              </div>
            </div>

            {/* Frame Selector for Operator */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Seleccionar Marco</p>
              <div className="grid grid-cols-2 gap-2">
                {BOGUE_FRAMES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFrame(f.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs font-bold transition ${
                      selectedFrame === f.id
                        ? 'border-pink-500 bg-pink-500/10 text-pink-300'
                        : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <span>{f.label}</span>
                    {selectedFrame === f.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Remote Trigger Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleOperatorStart}
                disabled={session?.status && session.status !== 'idle' && session.status !== 'done'}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-rose-500 text-base font-black text-white transition hover:bg-rose-400 disabled:pointer-events-none disabled:opacity-50"
              >
                <Zap className="w-6 h-6 fill-white" />
                Iniciar cuenta regresiva
              </button>
              {operatorError && <p className="text-center text-xs font-bold text-rose-400">{operatorError}</p>}

              <button
                onClick={handleOperatorReset}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar sesion
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-zinc-900 p-4 text-center">
            <p className="text-xs text-slate-400">
              Esta pantalla crea un loop desde la camara web. No controla hardware externo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Display / Guest view
  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      <canvas ref={displayCanvasRef} className="hidden" />

      {/* FLASH OVERLAY */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => router.back()} aria-label="Volver" title="Volver" className="rounded-lg bg-white/10 p-2 backdrop-blur-md transition hover:bg-white/20">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500 flex items-center gap-1.5 justify-center">
            <Flame className="w-4 h-4 fill-pink-500" /> Bogue Boomerang
          </h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.eventName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {localStatus === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                aria-label={voiceEnabled ? 'Desactivar indicaciones por voz' : 'Activar indicaciones por voz'}
                title={voiceEnabled ? 'Desactivar indicaciones por voz' : 'Activar indicaciones por voz'}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  voiceEnabled ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-white/10 text-white'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={toggleCamera}
                aria-label="Cambiar cámara"
                title="Cambiar cámara"
                className="rounded-full bg-white/10 p-2 backdrop-blur-md transition hover:bg-white/20 motion-reduce:transition-none"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <GuiaPosicionamiento
          nombreInvitado={nombreInvitado}
          estado={localStatus}
          countdown={countdown}
          mensajeGuia={
            localStatus === 'idle'
              ? 'Hacé un movimiento corto y repetitivo frente a la cámara'
              : localStatus === 'recording'
              ? '¡Grabando loop de ida y vuelta!'
              : undefined
          }
        />
        
        {/* State: Idle / Welcome Screen */}
        {localStatus === 'idle' && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover opacity-40 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/80">
              <div className="relative z-10 space-y-6 max-w-sm">
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg shadow-lg"
                  style={{ backgroundColor: fiesta?.station?.accentColor || '#f43f5e' }}
                >
                  <Flame className="w-10 h-10 text-white fill-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                    {fiesta?.station?.brandText || fiesta?.eventName || 'Boomerang'}
                  </h2>
                  <p className="text-sm text-zinc-300">Prepara tu pose. Esta estacion crea un loop con la camara web.</p>
                  {fiesta?.station?.footerText && (
                    <p className="text-xs font-semibold text-zinc-400">{fiesta.station.footerText}</p>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  {cameraError && (
                    <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-left">
                      <p className="text-xs font-semibold leading-5 text-rose-100">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => void startCamera()}
                        className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-black text-white transition hover:bg-white/15 motion-reduce:transition-none"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Reintentar cámara
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => startCaptureProcess(3, 15)}
                    disabled={Boolean(cameraError)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-zinc-950 transition hover:bg-zinc-200 disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none"
                  >
                    <Camera className="w-5 h-5" />
                    Grabar loop
                  </button>
                  
                  {/* Selected Frame Indicator filtrado por marcosHabilitados */}
                  <div className="flex justify-center gap-1.5 overflow-x-auto py-2">
                    {BOGUE_FRAMES.filter(
                      (f) => !fiesta?.station?.marcosHabilitados || fiesta.station.marcosHabilitados.includes(f.id) || f.id === 'none'
                    ).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFrame(f.id)}
                        className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-[10px] font-black transition ${
                          selectedFrame === f.id
                            ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State: Countdown */}
        {localStatus === 'countdown' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <div className="absolute inset-0 bg-black/30" />
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1 }}
                  exit={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <span className="text-8xl font-black text-white sm:text-9xl">
                    {countdown}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* State: Recording */}
        {localStatus === 'recording' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* Recording indicator */}
            <div className="absolute bottom-10 left-10 right-10 z-10 flex flex-col items-center space-y-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-black/60 px-4 py-1.5 text-sm font-black uppercase tracking-wide text-rose-200">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" /> Grabando loop
              </span>
              <div className="w-full max-w-xs h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-red-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${recordingProgress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* State: Processing */}
        {localStatus === 'processing' && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Creando Magia...</h3>
            <p className="text-sm text-zinc-400 max-w-xs">{progressMsg}</p>
          </div>
        )}

        {/* State: Done (Boomerang Preview + Photo Strip + QR Download) */}
        {localStatus === 'done' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start gap-6 overflow-y-auto bg-zinc-950 px-4 pb-8 pt-20 md:flex-row md:justify-center md:gap-8 md:p-6">
            
            {/* Strip Display */}
            {finalStripUrl && (
              <div className="flex flex-col items-center gap-4 bg-zinc-900/60 p-6 rounded-2xl border border-white/5 shadow-2xl">
                {/* La tira es un blob/data URL generado en el navegador y se imprime tal cual. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={finalStripUrl} 
                  alt="Tira de recuerdo" 
                  className="h-80 md:h-[450px] object-contain rounded-md shadow-xl"
                />
                <button
                  onClick={() => {
                    if (isPrinting) return;
                    setIsPrinting(true);
                    const res = imprimirRecuerdo(finalStripUrl);
                    if (!res.ok) {
                      setUploadError(res.aviso || 'Error al imprimir');
                    }
                    setTimeout(() => setIsPrinting(false), 2000);
                  }}
                  disabled={isPrinting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-pink-600 hover:bg-pink-500 font-bold text-white transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] disabled:opacity-50"
                >
                  {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                  {isPrinting ? 'Imprimiendo...' : 'Imprimir Recuerdo'}
                </button>

                {cuadrosDeLaTanda.length > 1 && !gifUrl && (
                  <button
                    onClick={async () => {
                      if (armandoGif) return;
                      setArmandoGif(true);
                      try {
                        const gif = await generarGifDesdeImagenes(cuadrosDeLaTanda, { delayMs: 220 });
                        setGifUrl(gif);
                      } catch {
                        setUploadError('No se pudo armar el GIF. La foto y el video siguen estando.');
                      } finally {
                        setArmandoGif(false);
                      }
                    }}
                    disabled={armandoGif}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 font-bold text-white transition-all disabled:opacity-50"
                  >
                    {armandoGif ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {armandoGif ? 'Armando el GIF...' : 'Quiero el GIF animado'}
                  </button>
                )}

                {gifUrl && (
                  <div className="flex w-full flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={gifUrl} alt="GIF animado del recuerdo" className="h-48 object-contain rounded-md" />
                    <a
                      href={gifUrl}
                      download="recuerdo-ak.gif"
                      className="w-full text-center py-3 px-6 rounded-xl bg-white/90 hover:bg-white font-bold text-zinc-900 transition-all"
                    >
                      Guardar el GIF en el telefono
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Loop Video preview */}
            <div className="relative h-[40dvh] max-h-[24rem] w-auto max-w-full shrink-0 aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl md:h-[60dvh] md:max-h-[36rem]">
              {finalVideoUrl && (
                <video
                  src={finalVideoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              )}
              <div className="absolute left-4 top-4 flex items-center gap-1 rounded-lg bg-rose-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                <Sparkles className="w-3 h-3" /> Loop listo
              </div>
            </div>

            {/* QR code and sharing options */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Llevate el recuerdo</h3>
                <p className="text-sm text-zinc-400">
                  {fiesta?.station?.qrCallout || 'Escaneá el QR desde tu celular para descargar el loop animado.'}
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-3xl shadow-2xl relative">
                {qrCodeUrl ? (
                  <QrRecuerdo qrCodeUrl={qrCodeUrl} />
                ) : uploadError ? (
                  <div className="w-40 h-40 flex flex-col items-center justify-center gap-2 text-rose-500 bg-rose-50/10 rounded-lg">
                    <Zap className="w-8 h-8 opacity-50" />
                    <span className="text-xs font-semibold px-4 text-center">Fallo conexión</span>
                  </div>
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                  </div>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-rose-400 text-center font-medium bg-rose-500/10 p-2 rounded-md">
                  {uploadError}
                </p>
              )}

              <div className="space-y-3 w-full mt-4">
                {fiesta?.station?.allowGuestRetake && (fiesta?.station?.maxRetakes ?? 2) > 0 && (
                  <button
                    onClick={completeGuestCycle}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Grabar otra vez
                  </button>
                )}
                {role !== 'operator' && (
                  <div className="pt-2 flex flex-col items-center gap-1.5 border-t border-white/10 w-full text-center">
                    <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{fiesta?.station?.brandText || 'Esto lo hizo AK Producciones'}</span>
                    </div>
                    <a
                      href={`https://wa.me/59898355530?text=${encodeURIComponent(
                        fiesta?.station?.shareMessage ||
                        `¡Hola AK Producciones! Me grabé en el Bogue Boomerang de la fiesta de ${fiesta?.eventName || 'un evento'} y me encantó. Quería consultarles para mi propio evento.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>Escribinos por WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      <KioskUnlockButton />
    </div>
  );
}
