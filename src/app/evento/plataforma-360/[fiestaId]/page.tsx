'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Play,
  CheckCircle,
  ArrowLeft,
  Smartphone,
  Star,
  Radio,
  Zap,
  RefreshCw,
  Volume2,
  VolumeX,
  Loader2,
  Check,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { QrRecuerdo } from '@/components/entretenimiento/QrRecuerdo';
import { getPublicSocialPosts } from '@/app/actions/social-gallery';
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
import { PublicEntertainmentEventStatus } from '@/components/entertainment/public-entertainment-event-status';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { waitForInitialPublicLoad } from '@/lib/public-experience/wait-for-initial-public-load';
import { AvisoDeFallaEnEstacion } from '@/components/entretenimiento/AvisoDeFallaEnEstacion';
import { saveOfflineMedia } from '@/lib/offline/offline-db';
import { SyncStatusIndicator } from '@/components/offline/sync-status-indicator';

const DURATION_OPTIONS = [
  { label: '10 Segundos', value: 10 },
  { label: '15 Segundos', value: 15 },
  { label: '20 Segundos', value: 20 },
];

export default function Plataforma360Page() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const role = searchParams.get('role') || 'display'; // 'display' | 'operator'
  const accessToken = searchParams.get('access') || undefined;
  const guestId = searchParams.get('guestId') || undefined;
  const guestAccessToken = searchParams.get('guestAccessToken') || searchParams.get('token') || undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const resetLocalStateRef = useRef<() => void>(() => undefined);
  const startDisplayCaptureRef = useRef<(duration: number) => void>(() => undefined);
  const localStatusRef = useRef<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment'); // environment default for 360 arms
  const [recentVideos, setRecentVideos] = useState<any[]>([]);

  // Real-time Firestore sync
  const [session, setSession] = useState<EntertainmentSession | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);

  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [pendingVideoBlob, setPendingVideoBlob] = useState<Blob | null>(null);
  const [uploadedPostUrl, setUploadedPostUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<HTMLCanvasElement[]>([]);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const customAudioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const customAudioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);

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
    } catch (e) {}
  };

  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const selectCustomAudio = (file: File) => {
    setCustomAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    };
  }, [customAudioUrl]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    try {
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: true,
        });
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
          audio: false,
        });
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('No se pudo acceder a la cámara:', err);
      const message = 'No se pudo acceder a la cámara. Revisa los permisos del navegador y vuelve a intentar.';
      setCameraError(message);
      void updateEntertainmentSessionStatus(
        fiestaId,
        'plataforma360',
        'idle',
        { lastError: message },
        accessToken,
      ).catch((statusError) => console.error('No se pudo avisar la falla de cámara al operador:', statusError));
    }
  }, [accessToken, facingMode, fiestaId, stopCamera]);

  const loadRecentVideos = useCallback(async () => {
    try {
      const posts = await getPublicSocialPosts(fiestaId);
      const videos = posts
        .filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360' || p.imageUrl.endsWith('.mp4'))
        .slice(0, 4);
      setRecentVideos(videos);
    } catch (e) {}
  }, [fiestaId]);

  // 1. Initial load
  useEffect(() => {
    let active = true;
    setFiesta(null);
    setLoadError(null);
    setIsEventLoading(true);
    const loadTask = getPublicEntertainmentEvent(fiestaId, 'plataforma360', accessToken)
      .then((result) => {
        if (!active) return;
        if (result.success && result.event) {
          setFiesta(result.event);
          setLoadError(null);
          setSelectedDuration(result.event.station.recordingDurationSeconds);
        } else {
          setLoadError(result.error || 'No se pudo abrir esta estacion.');
        }
      })
      .catch(() => {
        if (active) setLoadError('No se pudo abrir esta estacion.');
      });
    void waitForInitialPublicLoad(loadTask).then((result) => {
      if (!active) return;
      if (result === 'timeout') setLoadError('La validacion del evento demoro demasiado. Intenta nuevamente.');
      setIsEventLoading(false);
    });
    void loadRecentVideos();
    return () => {
      active = false;
    };
  }, [accessToken, fiestaId, loadRecentVideos]);

  useEffect(() => {
    localStatusRef.current = localStatus;
  }, [localStatus]);

  // Keep one remote-control channel alive during the full recording workflow.
  useEffect(() => {
    let pollInFlight = false;
    const interval = setInterval(async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      try {
        const s = await getEntertainmentSession(fiestaId, 'plataforma360', accessToken);
        setSession(s);

        const currentStatus = localStatusRef.current;
        if (role === 'display' && s && s.status !== currentStatus) {
          if (s.status === 'countdown' && currentStatus === 'idle') {
            startDisplayCaptureRef.current(s.settings?.duration || 15);
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

  // 2. Camera feed management for Display
  useEffect(() => {
    if (fiesta && role === 'display' && (localStatus === 'idle' || localStatus === 'countdown' || localStatus === 'recording')) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [fiesta, localStatus, role, startCamera, stopCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const resetLocalState = () => {
    setLocalStatus('idle');
    setCountdown(null);
    setCapturedFrames([]);
    setRecordingProgress(0);
    setRecordingTimeLeft(0);
    setFinalVideoUrl(null);
    setPendingVideoBlob(null);
    setUploadedPostUrl(null);
    setQrCodeUrl('');
    setUploadError(null);
    setIsUploading(false);
    setProgress(0);
    setProgressMsg('');
    if (customAudioRef.current) {
      customAudioRef.current.pause();
      customAudioRef.current.currentTime = 0;
    }
    if (role === 'display') {
      startCamera();
    }
  };

  const completeGuestCycle = () => {
    void completeEntertainmentSessionCycle(fiestaId, 'plataforma360', accessToken);
    resetLocalState();
  };

  // 3. Capture Flow
  const startDisplayCapture = async (duration: number) => {
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(
        fiestaId,
        'plataforma360',
        'countdown',
        {},
        accessToken
      );
    }

    let count = fiesta?.station.countdownSeconds || 5;
    setCountdown(count);
    playBeep(550, 0.2);
    speak("Iniciando plataforma. Sujétense bien.");

    const timer = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep(550, 0.2);
        if (count === 4) speak("Cuatro");
        if (count === 3) speak("Tres");
        if (count === 2) speak("Dos");
        if (count === 1) speak("Uno");
      } else {
        clearInterval(timer);
        setCountdown(null);
        recordVideoDuration(duration);
      }
    }, 1000);
  };

  useEffect(() => {
    resetLocalStateRef.current = resetLocalState;
    startDisplayCaptureRef.current = (duration) => { void startDisplayCapture(duration); };
  });

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const eventName = fiesta?.eventName || 'AK Producciones';
    const bannerHeight = h * 0.12;
    const grad = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.max(16, h * 0.03)}px sans-serif`;
    ctx.fillText(eventName, w / 2, h - bannerHeight * 0.4);
  };

  const recordVideoDuration = async (targetDurationSec: number) => {
    const currentStream = streamRef.current;
    if (!currentStream || !videoRef.current) {
      setProgressMsg('La camara aun no esta lista.');
      setLocalStatus('idle');
      return;
    }

    setLocalStatus('recording');
    await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'recording', {}, accessToken);
    speak("¡A bailar!");
    
    if (customAudioRef.current) {
      customAudioRef.current.currentTime = 0;
      customAudioRef.current.play().catch(() => {});
    }

    // Capturar frames durante targetDurationSec / 3 (ej. si piden 15s, grabamos 5s reales)
    // para luego expandirlo a cámara lenta.
    const realCaptureSeconds = Math.max(3, Math.floor(targetDurationSec / 3));
    const captureFps = 15;
    const maxFrames = realCaptureSeconds * captureFps;
    const intervalMs = 1000 / captureFps;
    
    const frames: HTMLCanvasElement[] = [];
    let count = 0;
    
    // Setup capture canvas at 480p to avoid memory crash
    const captureW = 480;
    const captureH = (videoRef.current.videoHeight / videoRef.current.videoWidth) * captureW || 854;

    const captureTimer = setInterval(() => {
      count++;
      setRecordingTimeLeft(realCaptureSeconds - Math.floor(count / captureFps));
      setRecordingProgress((count / maxFrames) * 100);

      const cvs = document.createElement('canvas');
      cvs.width = captureW;
      cvs.height = captureH;
      const ctx = cvs.getContext('2d');
      if (ctx && videoRef.current) {
        ctx.drawImage(videoRef.current, 0, 0, captureW, captureH);
        drawWatermark(ctx, captureW, captureH);
        frames.push(cvs);
      }

      if (count >= maxFrames) {
        clearInterval(captureTimer);
        setCapturedFrames(frames);
        processSlowMotionVideo(frames, targetDurationSec);
      }
    }, intervalMs);
  };

  const processSlowMotionVideo = async (frames: HTMLCanvasElement[], targetDurationSec: number) => {
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'processing', {}, accessToken);
    setProgressMsg('Procesando efecto cámara lenta...');
    
    if (frames.length === 0) {
      setProgressMsg('No se capturaron cuadros. Revisa la camara e intenta nuevamente.');
      setLocalStatus('idle');
      return;
    }

    const drawCanvas = document.createElement('canvas');
    drawCanvas.width = frames[0].width;
    drawCanvas.height = frames[0].height;
    const ctx = drawCanvas.getContext('2d');
    if (!ctx) return;

    // Queremos que el video resultante dure `targetDurationSec`.
    // Tenemos N frames. Vamos a renderizarlos a una tasa más lenta.
    const outputFps = frames.length / targetDurationSec; // ej. 75 frames / 15s = 5 fps.
    
    const canvasStream = drawCanvas.captureStream(Math.max(12, Math.floor(outputFps))); // Forzar un minimo
    
    let combinedStream = canvasStream;
    // Si hay musica, agregarla al stream
    if (customAudioRef.current) {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!customAudioDestinationRef.current) {
        customAudioDestinationRef.current = audioCtxRef.current.createMediaStreamDestination();
      }
      if (!customAudioSourceRef.current) {
        customAudioSourceRef.current = audioCtxRef.current.createMediaElementSource(customAudioRef.current);
        customAudioSourceRef.current.connect(customAudioDestinationRef.current);
        customAudioSourceRef.current.connect(audioCtxRef.current.destination);
      }
      
      const audioTracks = customAudioDestinationRef.current.stream.getAudioTracks();
      if (audioTracks.length > 0) {
         combinedStream = new MediaStream([
           ...canvasStream.getVideoTracks(),
           ...audioTracks
         ]);
      }
    }

    let mimeType = 'video/webm';
    const supportedTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    for (const t of supportedTypes) {
      if (MediaRecorder.isTypeSupported(t)) {
        mimeType = t;
        break;
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 2500000 });
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      
      mediaRecorder.onstop = async () => {
        if (customAudioRef.current) {
          customAudioRef.current.pause();
          customAudioRef.current.currentTime = 0;
        }
        const videoBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        setFinalVideoUrl(videoUrl);
        setPendingVideoBlob(videoBlob);
        await handleVideoUpload(videoBlob);
      };

      mediaRecorder.start();

      let frameIndex = 0;
      const renderInterval = targetDurationSec * 1000 / frames.length;

      const drawFrame = () => {
        if (frameIndex >= frames.length) {
          mediaRecorder.stop();
          return;
        }
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        ctx.drawImage(frames[frameIndex], 0, 0);
        frameIndex++;
        setTimeout(drawFrame, renderInterval);
      };
      
      drawFrame();
    } catch (e) {
      console.error(e);
      setLocalStatus('idle');
    }
  };

  const handleVideoUpload = async (blob: Blob) => {
    setUploadError(null);
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(
      fiestaId,
      'plataforma360',
      'processing',
      {},
      accessToken
    );
    setIsUploading(true);
    setProgressMsg('Subiendo tu video 360 al muro...');

    try {
      const ext = blob.type.includes('webm') ? '.webm' : '.mp4';
      const fileName = `360-video-${Date.now()}${ext}`;

      // Si estamos sin conexión, guardar directamente en IndexedDB
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await saveOfflineMedia({
          fiestaId,
          moduleId: 'plataforma-360',
          fileBlob: blob,
          fileName,
          mimeType: blob.type || 'video/mp4',
          authorName: 'Plataforma 360',
        });

        setProgress(100);
        setQrCodeUrl('');
        setLocalStatus('done');
        speak("¡Buenísimo! Tu video quedó guardado y se subirá apenas vuelva la señal.");

        setTimeout(() => {
          completeGuestCycle();
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
        return;
      }

      const file = new File([blob], fileName, { type: blob.type });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Plataforma 360');
      formData.append('moduleId', 'plataforma-360');
      if (accessToken) formData.append('accessToken', accessToken);
      if (guestId) formData.append('guestId', guestId);
      if (guestAccessToken) formData.append('guestAccessToken', guestAccessToken);

      const res = await uploadEntretenimientoMedia(formData);
      
      if (res.success) {
        const mediaUrl = res.media?.url || '';
        setProgress(100);
        setUploadedPostUrl(mediaUrl);
        setQrCodeUrl(mediaUrl);
        setLocalStatus('done');
        await updateEntertainmentSessionStatus(
          fiestaId,
          'plataforma-360',
          'done',
          { mediaUrl, lastError: null },
          accessToken
        );
        speak("¡Buenísimo! Tu video ya está subido.");
        loadRecentVideos();

        // Auto reset after 12 seconds
        setTimeout(() => {
          completeGuestCycle();
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
      } else {
        throw new Error(res.error || 'Error de subida');
      }
    } catch (err) {
      console.warn('[Plataforma360] Error al subir video, guardando en IndexedDB...', err);
      try {
        const ext = blob.type.includes('webm') ? '.webm' : '.mp4';
        await saveOfflineMedia({
          fiestaId,
          moduleId: 'plataforma-360',
          fileBlob: blob,
          fileName: `360-video-${Date.now()}${ext}`,
          mimeType: blob.type || 'video/mp4',
          authorName: 'Plataforma 360',
        });
        setProgress(100);
        setLocalStatus('done');
        speak("Tu video quedó guardado y se subirá cuando vuelva la señal.");
        setTimeout(() => {
          completeGuestCycle();
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
        return;
      } catch (fallbackErr) {
        console.error('[Plataforma360] Error al encolar en IndexedDB:', fallbackErr);
      }

      const message = (err as Error).message || 'No se pudo subir el video.';
      setProgressMsg('No se pudo subir el video. Conservamos la vista previa para reintentar.');
      setUploadError(message);
      setQrCodeUrl('');
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(
        fiestaId,
        'plataforma360',
        'idle',
        { lastError: 'No se pudo subir el video al muro social.' },
        accessToken,
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Operator Handlers
  const handleOperatorStart = async () => {
    setOperatorError(null);
    const result = await startEntertainmentSession(
      fiestaId,
      'plataforma360',
      {
        duration: selectedDuration,
        countdownSeconds: fiesta?.station.countdownSeconds || 5,
        operatorName: fiesta?.station.operatorName,
      },
      accessToken
    );
    if (!result.success) setOperatorError(result.error || 'No se pudo iniciar la plataforma 360.');
  };

  const handleOperatorReset = async () => {
    setOperatorError(null);
    const result = await resetEntertainmentSession(fiestaId, 'plataforma360', accessToken);
    if (!result.success) setOperatorError(result.error || 'No se pudo reiniciar la plataforma 360.');
  };

  if (isEventLoading || !fiesta) {
    return <PublicEntertainmentEventStatus isLoading={isEventLoading} error={loadError} />;
  }

  // Operator view UI
  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6">
        <div className="mx-auto max-w-md space-y-5">
          <AvisoDeFallaEnEstacion mensaje={session?.lastError} cuando={session?.lastErrorAt} />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.back()} aria-label="Volver" title="Volver" className="rounded-lg p-2 transition hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-violet-300">
              <Radio className="h-5 w-5 text-violet-300 motion-safe:animate-pulse" /> Operador 360
            </h1>
            <div className="w-9" />
          </div>

          <div className="space-y-5 rounded-lg border border-white/10 bg-zinc-900 p-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado del Brazo 360</p>
              <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-4 py-3">
                <Radio className={`w-5 h-5 ${session?.status === 'idle' ? 'text-slate-500' : 'text-purple-500 animate-pulse'}`} />
                <span className="font-bold capitalize text-sm">{session?.status || 'Desconectado'}</span>
              </div>
            </div>

            {/* Music Upload */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Música de Fondo</p>
              <label className="flex h-12 items-center justify-center gap-2 rounded-lg border border-white/5 bg-black/20 px-4 text-xs font-bold transition hover:border-white/10 cursor-pointer text-purple-300">
                <Volume2 className="w-4 h-4" />
                Cargar Archivo MP3
                <input 
                  type="file" 
                  accept="audio/*"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    // En una app real, esto debería subir a Storage y actualizar Firebase.
                    // Para el MVP y demostración rápida, alertamos que se cargó:
                    if (file) selectCustomAudio(file);
                  }}
                />
              </label>
            </div>

            {/* Duration selector */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Duración de Captura</p>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-xs font-bold transition ${
                      selectedDuration === d.value
                        ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                        : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slow Motion */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Efecto</p>
              {/*
                No es un boton: la camara lenta se aplica siempre a todos los
                videos de la plataforma. Estaba dibujado como boton y el operador
                lo tocaba esperando prenderla o apagarla, y no pasaba nada. Ahora
                es lo que siempre fue: un cartel que avisa que esta activa.
              */}
              <div
                role="status"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500 bg-purple-500/10 p-3 text-xs font-bold text-purple-300"
              >
                <Zap className="w-4 h-4" />
                Cámara Lenta (Slow Motion) Activada
              </div>
            </div>

            {/* Remote commands */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleOperatorStart}
                disabled={session?.status && session.status !== 'idle' && session.status !== 'done'}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-violet-500 text-base font-black text-white transition hover:bg-violet-400 disabled:pointer-events-none disabled:opacity-50"
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
              Esta pantalla graba con la camara web. El brazo 360 se opera fuera de esta aplicacion.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Display View UI
  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button type="button" onClick={() => router.back()} aria-label="Volver" title="Volver" className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md transition hover:bg-white/20">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center drop-shadow-md">
          <h1 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
            Plataforma 360°
          </h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.eventName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {role === 'operator' && localStatus === 'idle' && (
            <label className="flex h-11 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 text-xs font-bold transition hover:bg-white/20 cursor-pointer text-purple-300">
              Música Cargable
              <input 
                type="file" 
                accept="audio/*"
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) selectCustomAudio(file);
                }}
              />
            </label>
          )}
          {customAudioUrl && (
            <audio id="custom-music" ref={customAudioRef} src={customAudioUrl} loop crossOrigin="anonymous" />
          )}

          {localStatus === 'idle' && (
            <>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                aria-label={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition ${
                  voiceEnabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/10 text-white'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button type="button" onClick={toggleCamera} aria-label="Cambiar camara" title="Cambiar camara" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20">
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        
        {/* Idle Splash Screen */}
        {localStatus === 'idle' && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover opacity-35 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/80">
              <div className="relative z-10 space-y-6 max-w-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-violet-500 shadow-lg shadow-violet-950/30">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">Plataforma 360</h2>
                  <p className="text-sm text-zinc-300">Preparate. La plataforma empezará a girar y grabará en cámara lenta. ¡Hacé tu mejor pose!</p>
                  {cameraError && <p className="text-sm text-rose-300" role="alert">{cameraError}</p>}
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => startDisplayCapture(selectedDuration)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm font-black text-zinc-950 transition hover:bg-zinc-200"
                  >
                    <Camera className="w-5 h-5" />
                    Grabar video
                  </button>

                  <div className="flex justify-center gap-1.5 overflow-x-auto py-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setSelectedDuration(d.value)}
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-black transition ${
                          selectedDuration === d.value
                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                        }`}
                      >
                        {d.value}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Countdown */}
        {localStatus === 'countdown' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <div className="absolute inset-0 bg-black/40" />
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

        {/* Recording */}
        {localStatus === 'recording' && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            
            <div className="absolute bottom-10 left-10 right-10 z-10 flex flex-col items-center space-y-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-black/60 px-4 py-1.5 text-sm font-black uppercase tracking-wide text-violet-200">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 motion-safe:animate-pulse" /> Grabando ({recordingTimeLeft}s)
              </span>
              <div className="w-full max-w-xs h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 100 }}
                  animate={{ width: `${recordingProgress}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Processing */}
        {localStatus === 'processing' && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Procesando Video 360°...</h3>
            <p className="text-sm text-zinc-400 max-w-xs">{progressMsg}</p>
          </div>
        )}

        {/* Done / QR Screen */}
        {localStatus === 'done' && !uploadError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start gap-6 overflow-y-auto overscroll-contain bg-zinc-950 px-4 pb-8 pt-20 md:flex-row md:justify-center md:gap-8 md:p-6">
            
            {/* Video preview */}
            <div className="relative h-[52dvh] max-h-[32rem] w-auto max-w-full shrink-0 aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl md:h-[80dvh] md:max-h-[48rem]">
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
              <div className="absolute left-4 top-4 flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                <Star className="w-3 h-3 text-white" /> Previsualizacion lista
              </div>
            </div>

            {/* QR sharing code */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Guarda o comparte tu video</h3>
                <p className="text-sm text-zinc-400">Escanea el QR desde tu celular para abrir el enlace de esta captura web.</p>
              </div>

              {/* QR Container */}
              <div className="bg-white p-4 rounded-3xl shadow-2xl relative">
                <QrRecuerdo qrCodeUrl={qrCodeUrl} error={uploadError} />
              </div>

              <div className="space-y-3 w-full">
                {fiesta?.station.allowGuestRetake && fiesta.station.maxRetakes > 0 && (
                  <button
                    onClick={completeGuestCycle}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Grabar otro video
                  </button>
                )}
                {role !== 'operator' && (
                  <div className="pt-2 flex flex-col items-center gap-1.5 border-t border-white/10 w-full text-center">
                    <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Esto lo hizo AK Producciones</span>
                    </div>
                    <a
                      href={`https://wa.me/59898355530?text=${encodeURIComponent(
                        `¡Hola AK Producciones! Me grabé en la Plataforma 360 de la fiesta de ${fiesta?.eventName || 'un evento'} y me encantó. Quería consultarles para mi propio evento.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Escribinos por WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {localStatus === 'done' && uploadError && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start gap-6 overflow-y-auto overscroll-contain bg-zinc-950 px-4 pb-8 pt-20 text-center md:justify-center md:p-6">
            <div className="h-[52dvh] max-h-[32rem] w-auto max-w-full shrink-0 aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-black md:h-[72dvh] md:max-h-[44rem]">
              {finalVideoUrl && <video src={finalVideoUrl} controls loop playsInline className="h-full w-full object-cover" />}
            </div>
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-white">El video quedó guardado en esta pantalla</h3>
              <p className="mt-2 text-sm text-rose-300">{uploadError}</p>
              <p className="mt-2 text-sm text-zinc-400">Reintentá la subida. No mostramos un QR hasta tener un enlace válido.</p>
            </div>
            <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => pendingVideoBlob && handleVideoUpload(pendingVideoBlob)}
                disabled={!pendingVideoBlob || isUploading}
                className="h-14 flex-1 rounded-lg bg-purple-600 px-5 font-black text-white hover:bg-purple-500 disabled:opacity-50"
              >
                {isUploading ? 'Subiendo...' : 'Reintentar subida'}
              </button>
              <button
                type="button"
                onClick={completeGuestCycle}
                className="h-14 flex-1 rounded-lg border border-white/15 bg-white/5 px-5 font-bold text-white hover:bg-white/10"
              >
                Grabar otro
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RECENT VIDEOS PREVIEW */}
      {localStatus === 'idle' && recentVideos.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 max-w-md mx-auto px-4 space-y-2 z-10">
          <p className="text-xs font-black uppercase text-center text-zinc-400 tracking-wider">Últimos Videos Subidos</p>
          <div className="grid grid-cols-4 gap-2">
            {recentVideos.map((post) => (
              <div key={post.id} className="aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden border border-white/5 relative">
                <video src={post.imageUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              </div>
            ))}
          </div>
        </div>
      )}

      <KioskUnlockButton />
      <SyncStatusIndicator
        fiestaId={fiestaId}
        moduleId="plataforma-360"
        accessToken={accessToken}
        guestId={guestId}
        guestAccessToken={guestAccessToken}
      />
    </div>
  );
}
