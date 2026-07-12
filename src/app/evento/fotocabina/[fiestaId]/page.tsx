'use client';

import { useState, useEffect, useRef } from 'react';
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
  Volume2,
  VolumeX,
  FileImage,
  Radio,
  Zap,
  Check,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { uploadSocialPost } from '@/app/actions/social-gallery';
import { getPublicEntertainmentEvent } from '@/app/actions/fiesta/entretenimiento.actions';
import {
  getEntertainmentSession,
  startEntertainmentSession,
  updateEntertainmentSessionStatus,
  resetEntertainmentSession,
  EntertainmentSession,
} from '@/app/actions/fiesta/sesion-entretenimiento';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

const FRAMES = [
  { id: 'none', label: 'Sin Marco', bg: 'transparent' },
  { id: 'golden', label: 'Dorado', bg: 'border-[16px] border-amber-400/80 rounded-3xl' },
  { id: 'neon', label: 'Neón', bg: 'border-[12px] border-purple-500/80 shadow-[inset_0_0_20px_#a855f7] rounded-3xl' },
  { id: 'flowers', label: 'Flores', bg: 'border-[16px] border-pink-400/80 rounded-3xl' },
  { id: 'ak_brand', label: 'AK Brand', bg: 'border-b-[40px] border-zinc-900 rounded-b-3xl' },
];

export default function FotocabinaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const role = searchParams.get('role') || 'display'; // 'display' | 'operator'
  const accessToken = searchParams.get('access') || undefined;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFrame, setSelectedFrame] = useState('none');
  
  // Sync
  const [session, setSession] = useState<EntertainmentSession | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch(e) {}
  };

  // 1. Load details and set Firestore Polling
  useEffect(() => {
    getPublicEntertainmentEvent(fiestaId, 'fotocabina')
      .then((result) => setFiesta(result.success ? result.event || null : null))
      .catch(() => {});
    
    let pollInFlight = false;
    const interval = setInterval(async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      try {
        const s = await getEntertainmentSession(fiestaId, 'fotocabina');
        setSession(s);

        if (role === 'display' && s && s.status !== localStatus) {
          if (s.status === 'countdown' && localStatus === 'idle') {
            const frameToUse = s.settings?.frameId || 'none';
            setSelectedFrame(frameToUse);
            takePhoto();
          } else if (s.status === 'idle') {
            retake();
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
  }, [fiestaId, role, localStatus]);

  // 2. Camera controller for display
  useEffect(() => {
    if (role === 'display' && (localStatus === 'idle' || localStatus === 'countdown' || localStatus === 'recording')) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [facingMode, localStatus, role]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setErrorMsg('No se pudo acceder a la cámara. Por favor, revisa los permisos del navegador.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // 3. Capture workflow
  const takePhoto = async () => {
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(fiestaId, 'fotocabina', 'countdown', {}, accessToken);
    }
    
    let currentCount = fiesta?.station.countdownSeconds || 4;
    setCountdown(currentCount);
    playBeep();
    speak(String(currentCount));
    
    const interval = setInterval(async () => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playBeep();
        speak(String(currentCount));
      } else {
        clearInterval(interval);
        setCountdown(null);
        playBeep(1200, 0.3); // High beep for capture
        speak("¡Sonríe!");
        captureToCanvas();
      }
    }, 1000);
  };

  const captureToCanvas = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setLocalStatus('recording');
    await updateEntertainmentSessionStatus(fiestaId, 'fotocabina', 'recording', {}, accessToken);

    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Overlay frame and watermark
    drawFrameOverlay(ctx, canvas.width, canvas.height);
    drawWatermark(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();

    setLocalStatus('done');
    await updateEntertainmentSessionStatus(
      fiestaId,
      'fotocabina',
      'done',
      { reviewPending: true },
      accessToken
    );
  };

  const drawFrameOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (selectedFrame === 'none') return;
    
    ctx.lineWidth = 0;
    
    if (selectedFrame === 'golden') {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, w - 40, h - 40);
    } else if (selectedFrame === 'neon') {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.9)';
      ctx.lineWidth = 30;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 40;
      ctx.strokeRect(15, 15, w - 30, h - 30);
      ctx.shadowBlur = 0;
    } else if (selectedFrame === 'flowers') {
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
      ctx.lineWidth = 40;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.fillStyle = 'rgba(244, 114, 182, 1)';
      ctx.font = '80px sans-serif';
      ctx.fillText('🌸', 40, 100);
      ctx.fillText('🌸', w - 120, 100);
    } else if (selectedFrame === 'ak_brand') {
      ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
      ctx.fillRect(0, h - 120, w, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AK PRODUCCIONES', w / 2, h - 45);
    }
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!watermarkEnabled) return;
    
    const eventName = fiesta?.eventName || 'Nuestra Fiesta';
    const rawDate = fiesta?.eventDate;
    let eventDateStr = '';
    if (rawDate) {
      try {
        const date = new Date(rawDate);
        eventDateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
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
  };

  const handleAcceptAndPublish = async () => {
    if (!canvasRef.current) return;
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(
      fiestaId,
      'fotocabina',
      'processing',
      {},
      accessToken
    );
    setIsUploading(true);
    speak("Subiendo tu foto al muro");

    try {
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Error al generar la imagen');
      
      const file = new File([blob], `fotocabina-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Fotocabina AK');
      formData.append('source', 'entertainment');
      formData.append('sourceModule', 'fotocabina');
      
      const res = await uploadSocialPost(formData);
      if (res.success) {
        const mediaUrl = res.post?.imageUrl || '';
        setQrCodeUrl(mediaUrl || window.location.href);
        setLocalStatus('done');
        await updateEntertainmentSessionStatus(
          fiestaId,
          'fotocabina',
          'done',
          { mediaUrl, reviewPending: false },
          accessToken
        );
        speak("¡Excelente! Tu foto ya está lista.");
        setShowSuccess(true);
        
        // Auto reset after 12 seconds
        setTimeout(() => {
          setShowSuccess(false);
          retake();
          resetEntertainmentSession(fiestaId, 'fotocabina', accessToken);
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
      } else {
        throw new Error(res.error || 'Error al subir');
      }
    } catch (err) {
      console.error(err);
      setQrCodeUrl(window.location.href);
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(
        fiestaId,
        'fotocabina',
        'done',
        {},
        accessToken
      );
      speak("No se pudo subir al muro, pero puedes guardarla");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `AK-Fotocabina-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const retake = () => {
    setCapturedImage(null);
    setQrCodeUrl('');
    setLocalStatus('idle');
    setShowSuccess(false);
    resetEntertainmentSession(fiestaId, 'fotocabina', accessToken);
    if (role === 'display') {
      startCamera();
    }
  };

  // 4. Operator view
  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#18181b_0%,_#09090b_70%)] text-white p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.push(`/evento/hub/${fiestaId}`)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-black tracking-widest text-amber-500 uppercase flex items-center gap-2">
              <Radio className="w-5 h-5 animate-pulse text-amber-500" /> Operador Fotocabina
            </h1>
            <div className="w-9" />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de la Fotocabina</p>
              <div className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
                <Radio className={`w-5 h-5 ${session?.status === 'idle' ? 'text-slate-500' : 'text-amber-500 animate-pulse'}`} />
                <span className="font-bold capitalize text-sm">{session?.status || 'Desconectado'}</span>
              </div>
            </div>

            {/* Frame Selector */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Marco para la Foto</p>
              <div className="grid grid-cols-2 gap-2">
                {FRAMES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFrame(f.id)}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      selectedFrame === f.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <span>{f.label}</span>
                    {selectedFrame === f.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Shutter / reset */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() =>
                  startEntertainmentSession(
                    fiestaId,
                    'fotocabina',
                    {
                      frameId: selectedFrame,
                      countdownSeconds: fiesta?.station.countdownSeconds || 4,
                      operatorName: fiesta?.station.operatorName,
                    },
                    accessToken
                  )
                }
                disabled={session?.status && session.status !== 'idle' && session.status !== 'done'}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-zinc-950 font-black text-lg shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-98 transition-all"
              >
                <Zap className="w-6 h-6 fill-zinc-950" />
                DISPARAR REMOTO
              </button>

              <button
                onClick={() => resetEntertainmentSession(fiestaId, 'fotocabina', accessToken)}
                className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm border border-white/5 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar Cabina
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display View UI
  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* FLASH SCREEN */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center drop-shadow-md">
          <h1 className="text-sm font-black uppercase tracking-widest text-amber-400">Fotocabina AK</h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.eventName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {localStatus === 'idle' && !capturedImage && (
            <>
              <button 
                onClick={() => setVoiceEnabled(v => !v)} 
                className={`p-2 rounded-full backdrop-blur-md transition ${voiceEnabled ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/10 text-white'}`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => setWatermarkEnabled(w => !w)} 
                className={`p-2 rounded-full backdrop-blur-md transition ${watermarkEnabled ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/10 text-white'}`}
              >
                <FileImage className="w-5 h-5" />
              </button>
              <button onClick={toggleCamera} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        
        {errorMsg && (
          <div className="p-6 text-center text-red-400 font-medium z-10">
            <p className="text-5xl mb-4">📷🚫</p>
            {errorMsg}
          </div>
        )}

        {/* State: Idle / Welcome */}
        {localStatus === 'idle' && !capturedImage && !errorMsg && (
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
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                >
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                    {fiesta?.station.brandText || 'Fotocabina'}
                  </h2>
                  <p className="text-sm text-zinc-300">
                    Toca comenzar, mira a la camara y sigue la cuenta regresiva.
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={takePhoto}
                    className="w-full h-16 rounded-xl text-white font-black text-base uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2"
                    style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                  >
                    <Camera className="w-5 h-5" />
                    Comenzar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State: Countdown */}
        {localStatus === 'countdown' && !capturedImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            />
            <div className="absolute inset-0 bg-black/45" />
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1 }}
                  exit={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <span className="text-[12rem] font-black text-white drop-shadow-[0_0_25px_rgba(251,191,36,0.8)]">{countdown}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* State: Processing */}
        {localStatus === 'processing' && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-16 h-16 text-amber-400 animate-spin mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Procesando Foto...</h3>
            <p className="text-sm text-zinc-400">Subiendo a las pantallas del salón...</p>
          </div>
        )}

        {/* State: Done (Photo Preview + QR Download) */}
        {localStatus === 'done' && capturedImage && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col md:flex-row items-center justify-center p-6 gap-8">
            
            {/* Captured Image Preview */}
            <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={capturedImage} className="w-full h-full object-contain" alt="Captura Final" />
              <div className="absolute top-4 left-4 bg-amber-400 text-zinc-950 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                Foto Capturada
              </div>
            </div>

            {/* QR sharing code */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  {qrCodeUrl ? 'Tu foto esta lista' : 'Revisa tu foto'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {qrCodeUrl
                    ? fiesta?.station.qrCallout
                    : 'Puedes repetirla o aceptarla para publicarla y descargarla.'}
                </p>
              </div>

              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-xl shadow-2xl relative">
                  <QRCodeSVG value={qrCodeUrl} size={180} level="Q" includeMargin={false} />
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                {qrCodeUrl ? (
                  <button
                    onClick={handleDownload}
                    className="w-full h-12 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                  >
                    <Download className="w-4 h-4" /> Guardar Foto
                  </button>
                ) : (
                  <button
                    onClick={handleAcceptAndPublish}
                    disabled={isUploading}
                    className="w-full h-12 rounded-xl text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Aceptar y compartir
                  </button>
                )}
                {(fiesta?.station.allowGuestRetake !== false || qrCodeUrl) && (
                  <button
                    onClick={retake}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Hacer otra
                  </button>
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
