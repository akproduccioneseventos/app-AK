'use client';

import { useState, useEffect, useRef } from 'react';
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
import { QRCodeSVG } from 'qrcode.react';
import { uploadSocialPost } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import {
  getEntertainmentSession,
  startEntertainmentSession,
  updateEntertainmentSessionStatus,
  resetEntertainmentSession,
  EntertainmentSession,
} from '@/app/actions/fiesta/sesion-entretenimiento';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

const BOGUE_FRAMES = [
  { id: 'none', label: 'Sin Marco', border: 'transparent' },
  { id: 'neon-glow', label: 'Neón Fiesta', border: 'rgba(236, 72, 153, 0.8)' },
  { id: 'luxury-gold', label: 'Luxury Oro', border: 'rgba(234, 179, 8, 0.8)' },
  { id: 'cyberpunk', label: 'Cyberpunk', border: 'rgba(6, 182, 212, 0.8)' },
];

export default function BoguePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const role = searchParams.get('role') || 'display'; // 'display' | 'operator'

  const videoRef = useRef<HTMLVideoElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
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
  const [uploadedPostUrl, setUploadedPostUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const [selectedFrame, setSelectedFrame] = useState('none');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Audio effect context for high-quality beeps
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  // 1. Initial Load and Firestore Polling
  useEffect(() => {
    getFiestaById(fiestaId).then(setFiesta).catch(() => {});
    
    // Periodically sync with Firestore session status every 800ms
    const interval = setInterval(async () => {
      const s = await getEntertainmentSession(fiestaId, 'bogue');
      setSession(s);
      
      if (role === 'display' && s) {
        // React to remote operator commands
        if (s.status !== localStatus) {
          if (s.status === 'countdown' && localStatus === 'idle') {
            startCaptureProcess(s.settings?.duration || 3, s.settings?.frameCount || 15);
          } else if (s.status === 'idle') {
            // Force reset from operator
            resetLocalState();
          }
        }
      }
    }, 800);

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [fiestaId, role, localStatus]);

  // 2. Manage WebRTC Camera Feed for Display Role
  useEffect(() => {
    if (role === 'display' && (localStatus === 'idle' || localStatus === 'countdown' || localStatus === 'recording')) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [facingMode, localStatus, role]);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const resetLocalState = () => {
    setLocalStatus('idle');
    setCountdown(null);
    setCapturedFrames([]);
    setRecordingProgress(0);
    setFinalVideoUrl(null);
    setUploadedPostUrl(null);
    setIsUploading(false);
    setProgressMsg('');
    if (role === 'display') {
      startCamera();
    }
  };

  // 3. Capture & Process Boomerang (Display flow)
  const startCaptureProcess = async (recordDuration = 3, totalFrames = 15) => {
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'countdown');
    }

    let count = 4;
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

  const captureFramesSequence = async (durationSec: number, maxFrames: number) => {
    setLocalStatus('recording');
    await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'recording');
    speak("¡Muévanse!");

    const video = videoRef.current;
    if (!video) return;

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
    await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'processing');
    setProgressMsg('Creando el loop de ida y vuelta...');
    speak("Procesando Boomerang");

    // Construct loop frames: 0 -> N-1 -> 0
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
        await handleAutoUpload(videoBlob);
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
      setLocalStatus('idle');
    }
  };

  const drawFrameOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (selectedFrame === 'none') return;
    
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
    const eventName = fiesta?.configuracion?.nombreEvento || 'Nuestra Fiesta';
    const rawDate = fiesta?.configuracion?.fechaEvento;
    let dateStr = '';
    if (rawDate) {
      try {
        dateStr = new Date(rawDate).toLocaleDateString('es-ES', {
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

  const handleAutoUpload = async (blob: Blob) => {
    setIsUploading(true);
    setProgressMsg('Subiendo al muro social de la fiesta...');
    
    try {
      const file = new File([blob], `bogue-${Date.now()}.mp4`, { type: blob.type });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Bogue Boomerang');
      formData.append('source', 'entertainment');
      formData.append('sourceModule', 'bogue');

      const res = await uploadSocialPost(formData);
      
      if (res.success) {
        setUploadedPostUrl(res.url || '');
        setQrCodeUrl(res.url || window.location.href);
        setLocalStatus('done');
        await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'done', {
          mediaUrl: res.url
        });
        speak("¡Listo! Tu Boomerang ya está subido.");
        
        // Auto reset after 12 seconds
        setTimeout(() => {
          resetLocalState();
          resetEntertainmentSession(fiestaId, 'bogue');
        }, 12000);
      } else {
        throw new Error(res.error || 'Fallo al subir archivo');
      }
    } catch (err) {
      console.error(err);
      setProgressMsg('No se pudo subir al muro. Mostrando QR local...');
      setQrCodeUrl(window.location.href);
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(fiestaId, 'bogue', 'done');
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Operator Actions
  const handleOperatorStart = async () => {
    await startEntertainmentSession(fiestaId, 'bogue', {
      duration: 3,
      frameCount: 15,
      frameId: selectedFrame,
    });
  };

  const handleOperatorReset = async () => {
    await resetEntertainmentSession(fiestaId, 'bogue');
  };

  // Render Operator view
  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#09090b_70%)] text-white p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.push(`/evento/hub/${fiestaId}`)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black tracking-widest text-pink-400 uppercase flex items-center gap-2">
              <Flame className="w-5 h-5 animate-pulse" /> Operator Bogue
            </h1>
            <div className="w-9" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de la Cabina</p>
              <div className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
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
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
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
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-fuchsia-600 hover:from-pink-600 hover:to-fuchsia-700 text-white font-black text-lg shadow-xl shadow-pink-500/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-98 transition-all"
              >
                <Zap className="w-6 h-6 fill-white" />
                DISPARAR BOGUE
              </button>

              <button
                onClick={handleOperatorReset}
                className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm border border-white/5 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar Cabina
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400">
              Coloca la pantalla del invitado en la estación de captura. Cuando presiones "DISPARAR", la cabina iniciará el conteo y grabará el loop automáticamente.
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
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h1 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500 flex items-center gap-1.5 justify-center">
            <Flame className="w-4 h-4 fill-pink-500" /> Bogue Boomerang
          </h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.configuracion?.nombreEvento}</p>}
        </div>
        <div className="flex items-center gap-2">
          {localStatus === 'idle' && (
            <>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  voiceEnabled ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-white/10 text-white'
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button onClick={toggleCamera} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
                <RefreshCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        
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
              {/* Luxury gold glow rings */}
              <div className="absolute w-72 h-72 rounded-full border border-pink-500/20 animate-[spin_12s_linear_infinite]" />
              <div className="absolute w-56 h-56 rounded-full border border-fuchsia-500/35 animate-[spin_8s_linear_infinite_reverse]" />
              
              <div className="relative z-10 space-y-6 max-w-sm">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-pink-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-pink-500/20 animate-bounce">
                  <Flame className="w-10 h-10 text-white fill-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">¡Grabá tu Boomerang!</h2>
                  <p className="text-sm text-zinc-300">Espera que el operador active la cabina o presiona abajo para iniciar.</p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => startCaptureProcess(3, 15)}
                    className="w-full h-14 rounded-2xl bg-white text-zinc-950 font-black text-sm uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Iniciar Captura Local
                  </button>
                  
                  {/* Selected Frame Indicator */}
                  <div className="flex justify-center gap-1.5 overflow-x-auto py-2">
                    {BOGUE_FRAMES.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFrame(f.id)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
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
                  <span className="text-[12rem] font-black text-white drop-shadow-[0_0_35px_rgba(236,72,153,0.8)]">
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
            {/* Red recording frame border */}
            <div className="absolute inset-0 border-8 border-red-600 animate-pulse pointer-events-none" />

            {/* Recording indicator */}
            <div className="absolute bottom-10 left-10 right-10 z-10 flex flex-col items-center space-y-2">
              <span className="text-sm font-black tracking-widest text-red-500 uppercase flex items-center gap-1.5 bg-black/60 px-4 py-1.5 rounded-full border border-red-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" /> Grabando Loop
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

        {/* State: Done (Boomerang Preview + QR Download) */}
        {localStatus === 'done' && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col md:flex-row items-center justify-center p-6 gap-8">
            
            {/* Left/Top: Loop Video preview */}
            <div className="relative w-full max-w-sm aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
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
              <div className="absolute top-4 left-4 bg-pink-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Boomerang Loop
              </div>
            </div>

            {/* Right/Bottom: QR code and sharing options */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">¡Escaneá y Guardá!</h3>
                <p className="text-sm text-zinc-400">Escaneá este código QR con tu celular para descargar tu video Boomerang.</p>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-3xl shadow-2xl relative">
                {qrCodeUrl ? (
                  <QRCodeSVG value={qrCodeUrl} size={180} level="Q" includeMargin={false} />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
                  </div>
                )}
              </div>

              <div className="space-y-3 w-full">
                <button
                  onClick={resetLocalState}
                  className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Tomar Otro Loop
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      <KioskUnlockButton />
    </div>
  );
}
