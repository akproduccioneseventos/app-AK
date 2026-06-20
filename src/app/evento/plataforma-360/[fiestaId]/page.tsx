'use client';

import { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { uploadSocialPost, getSocialPosts } from '@/app/actions/social-gallery';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
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
  const [uploadedPostUrl, setUploadedPostUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

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

  // 1. Initial Load & Firestore polling
  useEffect(() => {
    getFiestaById(fiestaId).then(setFiesta).catch(() => {});
    loadRecentVideos();

    const interval = setInterval(async () => {
      const s = await getEntertainmentSession(fiestaId, 'plataforma360');
      setSession(s);

      if (role === 'display' && s) {
        if (s.status !== localStatus) {
          if (s.status === 'countdown' && localStatus === 'idle') {
            startDisplayCapture(s.settings?.duration || 15);
          } else if (s.status === 'idle') {
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

  // 2. Camera feed management for Display
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
        audio: true, // we want sound for 360 videos
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('No se pudo acceder a la cámara:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const loadRecentVideos = async () => {
    try {
      const posts = await getSocialPosts(fiestaId);
      const videos = posts
        .filter(p => p.sourceModule === 'plataforma360' || p.source === 'plataforma360' || p.imageUrl.endsWith('.mp4'))
        .slice(0, 4);
      setRecentVideos(videos);
    } catch (e) {}
  };

  const resetLocalState = () => {
    setLocalStatus('idle');
    setCountdown(null);
    setFinalVideoUrl(null);
    setUploadedPostUrl(null);
    setRecordingProgress(0);
    setIsUploading(false);
    setProgress(0);
    setProgressMsg('');
    if (role === 'display') {
      startCamera();
    }
  };

  // 3. Capture Flow
  const startDisplayCapture = async (duration: number) => {
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'countdown');
    }

    let count = 5;
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

  const recordVideoDuration = async (durationSec: number) => {
    if (!stream) return;

    setLocalStatus('recording');
    await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'recording');
    speak("¡A bailar!");

    // Set up MediaRecorder
    let mimeType = 'video/webm';
    const formats = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    for (const f of formats) {
      if (MediaRecorder.isTypeSupported(f)) {
        mimeType = f;
        break;
      }
    }

    const chunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const videoBlob = new Blob(chunks, { type: mimeType });
      const videoUrl = URL.createObjectURL(videoBlob);
      setFinalVideoUrl(videoUrl);

      // Auto upload video
      await handleVideoUpload(videoBlob);
    };

    // Start recording
    mediaRecorder.start();

    // Progress timer
    setRecordingTimeLeft(durationSec);
    setRecordingProgress(100);

    let secondsPassed = 0;
    const interval = setInterval(() => {
      secondsPassed += 1;
      const pct = Math.max(0, 100 - (secondsPassed / durationSec) * 100);
      setRecordingProgress(pct);
      setRecordingTimeLeft(durationSec - secondsPassed);

      if (secondsPassed >= durationSec) {
        clearInterval(interval);
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }
    }, 1000);
  };

  const handleVideoUpload = async (blob: Blob) => {
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'processing');
    setIsUploading(true);
    setProgressMsg('Subiendo tu video 360 al muro...');

    try {
      const file = new File([blob], `360-video-${Date.now()}.mp4`, { type: blob.type });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Plataforma 360');
      formData.append('source', 'entertainment');
      formData.append('sourceModule', 'plataforma360');

      const res = await uploadSocialPost(formData);
      
      if (res.success) {
        const mediaUrl = res.post?.imageUrl || '';
        setProgress(100);
        setUploadedPostUrl(mediaUrl);
        setQrCodeUrl(mediaUrl || window.location.href);
        setLocalStatus('done');
        await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'done', {
          mediaUrl,
        });
        speak("¡Buenísimo! Tu video ya está subido.");
        loadRecentVideos();

        // Auto reset after 12 seconds
        setTimeout(() => {
          resetLocalState();
          resetEntertainmentSession(fiestaId, 'plataforma360');
        }, 12000);
      } else {
        throw new Error(res.error || 'Error de subida');
      }
    } catch (err) {
      console.error(err);
      setProgressMsg('Error al subir. Mostrando QR local...');
      setQrCodeUrl(window.location.href);
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(fiestaId, 'plataforma360', 'done');
    } finally {
      setIsUploading(false);
    }
  };

  // 4. Operator Handlers
  const handleOperatorStart = async () => {
    await startEntertainmentSession(fiestaId, 'plataforma360', {
      duration: selectedDuration,
    });
  };

  const handleOperatorReset = async () => {
    await resetEntertainmentSession(fiestaId, 'plataforma360');
  };

  // Operator view UI
  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#3b0764_0%,_#09090b_70%)] text-white p-6">
        <div className="max-w-md mx-auto space-y-6">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.push(`/evento/hub/${fiestaId}`)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black tracking-widest text-purple-400 uppercase flex items-center gap-2">
              <Radio className="w-5 h-5 animate-pulse text-purple-400" /> Operador 360°
            </h1>
            <div className="w-9" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado del Brazo 360</p>
              <div className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
                <Radio className={`w-5 h-5 ${session?.status === 'idle' ? 'text-slate-500' : 'text-purple-500 animate-pulse'}`} />
                <span className="font-bold capitalize text-sm">{session?.status || 'Desconectado'}</span>
              </div>
            </div>

            {/* Duration selector */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Duración de Captura</p>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
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

            {/* Remote commands */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleOperatorStart}
                disabled={session?.status && session.status !== 'idle' && session.status !== 'done'}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white font-black text-lg shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-98 transition-all"
              >
                <Zap className="w-6 h-6 fill-white" />
                DISPARAR 360°
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
              Coloque el dispositivo en el soporte giratorio 360° y asegure los soportes. Al disparar comenzará la cuenta regresiva en pantalla de 5 segundos.
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
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center drop-shadow-md">
          <h1 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
            Plataforma 360°
          </h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.configuracion?.nombreEvento}</p>}
        </div>
        <div className="flex items-center gap-2">
          {localStatus === 'idle' && (
            <>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-full backdrop-blur-md transition ${
                  voiceEnabled ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/10 text-white'
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
              {/* Spinning rings */}
              <div className="absolute w-80 h-80 rounded-full border border-purple-500/20 animate-[spin_10s_linear_infinite]" />
              <div className="absolute w-64 h-64 rounded-full border border-fuchsia-500/30 animate-[spin_7s_linear_infinite_reverse]" />

              <div className="relative z-10 space-y-6 max-w-sm">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-pulse">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">¡Subite al 360°!</h2>
                  <p className="text-sm text-zinc-300">Esperando la señal de disparo del operador o presiona abajo para iniciar.</p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    onClick={() => startDisplayCapture(selectedDuration)}
                    className="w-full h-14 rounded-2xl bg-white text-zinc-950 font-black text-sm uppercase tracking-wider hover:bg-zinc-200 transition shadow-xl flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Iniciar Captura Local
                  </button>

                  <div className="flex justify-center gap-1.5 overflow-x-auto py-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setSelectedDuration(d.value)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition ${
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
                  <span className="text-[12rem] font-black text-white drop-shadow-[0_0_35px_rgba(168,85,247,0.8)]">
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
            
            {/* Spinning neon rings for excitement on camera view */}
            <div className="absolute inset-0 border-[12px] border-purple-500/50 animate-pulse pointer-events-none" />

            <div className="absolute bottom-10 left-10 right-10 z-10 flex flex-col items-center space-y-2">
              <span className="text-sm font-black tracking-widest text-purple-400 uppercase flex items-center gap-1.5 bg-black/60 px-4 py-1.5 rounded-full border border-purple-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" /> GRABANDO ({recordingTimeLeft}s)
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
        {localStatus === 'done' && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col md:flex-row items-center justify-center p-6 gap-8">
            
            {/* Video preview */}
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
              <div className="absolute top-4 left-4 bg-purple-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-300" /> Video 360° Listo
              </div>
            </div>

            {/* QR sharing code */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">¡Escaneá tu Video!</h3>
                <p className="text-sm text-zinc-400">Escaneá este código QR con tu celular para descargar tu video de la plataforma 360°.</p>
              </div>

              {/* QR Container */}
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
                  <RefreshCw className="w-4 h-4" /> Hacer Otro Video
                </button>
              </div>
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
    </div>
  );
}
