'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  Crown,
  Loader2,
  Martini,
  Shuffle,
  Video,
  Wine,
  X,
  Instagram,
  Phone,
  Sparkles,
  Share2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { BarDrinkOrder, BarTechnologyDashboard } from '@/types/barra-tecnologica';
import type { Trago } from '@/types/fiesta';
import {
  createBarDrinkOrder,
  getBarraTecnologicaDashboard,
  uploadBarMagicPhoto,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

type ScreenState = 'HOME' | 'MENU' | 'PHOTO' | 'VIDEO';

export default function BarraTecnologicaTouchPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('HOME');

  // Ordering State
  const [selectedDrink, setSelectedDrink] = useState<Trago | null>(null);
  const [guestName, setGuestName] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [lastOrder, setLastOrder] = useState<BarDrinkOrder | null>(null);

  // Camera & Recording State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Interactive Countdown State
  const [countdown, setCountdown] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    const dashResult = await getBarraTecnologicaDashboard(fiestaId);
    if (dashResult.success && dashResult.data) {
      setDashboard(dashResult.data);
    } else {
      toast({ title: 'Error de conexión', description: dashResult.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async (isVideo: boolean = false) => {
    setCapturedDataUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: isVideo,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOpen(true);
    } catch {
      toast({ title: 'Error de Cámara', description: 'No se pudo acceder a la cámara del dispositivo.', variant: 'destructive' });
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Espejo
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Banner AK
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height - 180, canvas.width, 180);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(settings?.hashtag || '#AKProducciones', 50, canvas.height - 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    ctx.fillText(settings?.instagramHandle || '@akproducciones', 50, canvas.height - 40);

    setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.9));
  };

  // Interactive photo capture with visual countdown (3, 2, 1...)
  const triggerPhotoCountdown = () => {
    if (countdown !== null) return;
    setCountdown(3);
    let current = 3;
    const timer = setInterval(() => {
      current -= 1;
      if (current === 0) {
        setCountdown(0);
      } else if (current < 0) {
        clearInterval(timer);
        setCountdown(null);
        capturePhoto();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  // Interactive video recording with visual countdown (3, 2, 1...)
  const triggerVideoCountdown = () => {
    if (countdown !== null || isRecording) return;
    setCountdown(3);
    let current = 3;
    const timer = setInterval(() => {
      current -= 1;
      if (current === 0) {
        setCountdown(0);
      } else if (current < 0) {
        clearInterval(timer);
        setCountdown(null);
        startRecording();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  const uploadMedia = async () => {
    if (!capturedDataUrl) return;
    setIsUploadingMedia(true);

    try {
      const [meta, data] = capturedDataUrl.split(',');
      const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], `kiosco-${Date.now()}.${mime === 'video/webm' ? 'webm' : 'jpg'}`, { type: mime });

      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('authorName', guestName || 'Invitado Barra');
      formData.append('caption', `Disfrutando en la barra interactiva de ${dashboard?.eventName}`);
      formData.append('followConfirmed', 'true');
      formData.append('file', file);
      formData.append('source', 'kiosco');

      const result = await uploadBarMagicPhoto(formData);
      if (result.success) {
        toast({ title: '¡Éxito!', description: 'El archivo se envió al Muro Social.' });
        stopCamera();
        setCurrentScreen('HOME');
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Ocurrió un error al subir el archivo.', variant: 'destructive' });
    }
    setIsUploadingMedia(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    let mediaRecorder: MediaRecorder;
    try {
      const preferredMimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '';
      mediaRecorder = preferredMimeType
        ? new MediaRecorder(streamRef.current, { mimeType: preferredMimeType })
        : new MediaRecorder(streamRef.current);
    } catch {
      toast({ title: 'Error', description: 'Este dispositivo no permite grabar video desde el navegador.', variant: 'destructive' });
      return;
    }

    mediaRecorderRef.current = mediaRecorder;

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCapturedDataUrl(reader.result);
        }
      };
      reader.onerror = () => {
        toast({ title: 'Error', description: 'No se pudo preparar el video para subirlo.', variant: 'destructive' });
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(15);

    const timer = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          mediaRecorder.stop();
          setIsRecording(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleScreenChange = (screen: ScreenState) => {
    if (screen === 'PHOTO') {
      startCamera(false);
    } else if (screen === 'VIDEO') {
      startCamera(true);
    } else {
      stopCamera();
    }
    setCurrentScreen(screen);
    setLastOrder(null);
  };

  const submitOrder = async () => {
    if (!selectedDrink || !guestName.trim()) {
      toast({ title: 'Falta tu nombre', description: 'Por favor, ingresa tu nombre.', variant: 'destructive' });
      return;
    }
    setIsOrdering(true);
    const result = await createBarDrinkOrder({
      fiestaId,
      drinkId: selectedDrink.id,
      guestName,
      tableNumber: 'Pantalla Táctil',
    });
    if (result.success && result.order) {
      setLastOrder(result.order);
      setSelectedDrink(null);
      toast({ title: '¡Trago Pedido!', description: 'Acércate a la barra en unos minutos.' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsOrdering(false);
  };

  const openRandomDrink = () => {
    const drinks = dashboard?.drinks || [];
    if (!drinks.length) return;
    const randomIndex = Math.floor(Math.random() * drinks.length);
    setSelectedDrink(drinks[randomIndex]);
  };

  const copyHashtag = () => {
    if (settings?.hashtag) {
      navigator.clipboard.writeText(settings.hashtag);
      toast({ title: '¡Copiado!', description: `El hashtag ${settings.hashtag} fue copiado.` });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-16 w-16 animate-spin text-rose-600" />
      </div>
    );
  }

  const settings = dashboard?.settings;
  const quinceaneraPhoto = 'https://images.unsplash.com/photo-1541250848049-b4f7146174fb?q=80&w=1080&auto=format&fit=crop';
  const backgroundPhoto = dashboard?.backgroundImageUrl || quinceaneraPhoto;
  const drinks = dashboard?.drinks || [];

  return (
    <main className="relative flex min-h-screen w-full max-w-full flex-col bg-black text-slate-100 font-sans overflow-hidden">

      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 z-0">
        <NextImage
          src={backgroundPhoto}
          alt="Background"
          fill
          className="object-cover opacity-35 blur-[3px]"
          decoding="async"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/30" />
      </div>

      {/* HEADER NAVIGATION */}
      {currentScreen !== 'HOME' && (
        <div className="absolute top-8 left-8 z-50">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full bg-black/60 border-white/10 text-white backdrop-blur-xl h-16 px-8 text-xl font-bold shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-black/80 transition-all active:scale-95"
            onClick={() => handleScreenChange('HOME')}
          >
            <ChevronLeft className="w-6 h-6 mr-2 text-rose-500" /> Volver al Inicio
          </Button>
        </div>
      )}

      {/* SCREEN ROUTER */}
      <AnimatePresence mode="wait">

        {/* --- HOME SCREEN --- */}
        {currentScreen === 'HOME' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            className="relative z-10 flex flex-1 flex-col items-center justify-center p-12 text-center"
          >
            <div className="mb-14 max-w-4xl">
              <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-rose-500 drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)]">
                Experiencia Interactiva
              </h2>
              <h1 className="mt-4 text-7xl font-black text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)] tracking-tight">
                {settings?.title || `BARRA DE TRAGOS DE ${dashboard?.eventName || 'LA FIESTA'}`}
              </h1>
              <p className="mt-6 text-2xl font-bold text-slate-300 drop-shadow-md max-w-2xl mx-auto">
                {settings?.subtitle || 'Elegí tu trago favorito desde la pantalla y el barman lo recibe al instante.'}
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-2xl">
              <Button
                onClick={() => handleScreenChange('MENU')}
                className="h-32 rounded-[2.5rem] bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-3xl font-black text-white shadow-[0_10px_40px_rgba(244,63,94,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-transform duration-250 border-0"
              >
                <Martini className="w-14 h-14 mr-5 animate-pulse" /> Elegí tu Trago
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleScreenChange('PHOTO')}
                  className="h-32 rounded-[2.5rem] bg-slate-900/85 backdrop-blur-xl border border-white/10 text-2xl font-black text-white hover:bg-slate-900 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-xl"
                >
                  <Camera className="w-10 h-10 mr-3 text-cyan-400" /> Sacate una Foto
                </Button>

                <Button
                  onClick={() => handleScreenChange('VIDEO')}
                  className="h-32 rounded-[2.5rem] bg-slate-900/85 backdrop-blur-xl border border-white/10 text-2xl font-black text-white hover:bg-slate-900 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-xl"
                >
                  <Video className="w-10 h-10 mr-3 text-purple-400" /> Graba un Video
                </Button>
              </div>
            </div>

            {/* Premium Branding Footer */}
            <div className="absolute bottom-8 flex items-center justify-center gap-12 opacity-80 bg-black/50 py-3 px-8 rounded-full border border-white/5 backdrop-blur-md">
              {settings?.instagramHandle && (
                <div className="flex items-center gap-3">
                  <Instagram className="w-6 h-6 text-pink-500" />
                  <span className="text-xl font-bold text-slate-200">{settings.instagramHandle}</span>
                </div>
              )}
              <div className="flex items-center gap-3 border-l border-white/10 pl-12">
                <Phone className="w-6 h-6 text-rose-500" />
                <span className="text-xl font-bold text-slate-200">AK Producciones</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* --- MENU SCREEN --- */}
        {currentScreen === 'MENU' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative z-10 flex flex-1 flex-col pt-32 p-10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-md">Carta de Tragos</h1>
                <p className="text-slate-400 font-semibold text-lg mt-1">{settings?.guestPrompt || 'Toca un trago para realizar tu pedido al barman.'}</p>
              </div>
              <Button
                onClick={openRandomDrink}
                className="h-16 px-8 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 text-2xl font-black shadow-[0_6px_25px_rgba(147,51,234,0.4)] hover:scale-[1.03] active:scale-[0.98] transition-transform border-0"
              >
                <Shuffle className="w-6 h-6 mr-3 text-yellow-300" /> ¡Sorpréndeme!
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 scrollbar-none">
              <div className="grid grid-cols-2 gap-6">
                {drinks.map((drink) => {
                  const isSignature = drink.id.startsWith('custom_');
                  return (
                    <motion.button
                      key={drink.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedDrink(drink)}
                      className={`relative flex flex-col items-start overflow-hidden rounded-[2.5rem] p-6 text-left transition-all duration-300 ${
                        isSignature
                          ? 'bg-gradient-to-br from-amber-950/50 via-slate-900/90 to-amber-950/30 border-2 border-amber-500/80 shadow-[0_8px_30px_rgba(245,158,11,0.25)] hover:border-amber-400'
                          : 'bg-black/60 border border-white/10 backdrop-blur-md hover:bg-black/75 hover:border-white/20'
                      }`}
                    >
                      {isSignature && (
                        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                      )}

                      <div className="relative w-full aspect-[4/3] rounded-3xl bg-slate-950 mb-5 overflow-hidden">
                        {drink.imageUrl ? (
                          <NextImage
                            src={drink.imageUrl}
                            alt={drink.nombre}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-rose-500/30">
                            <Wine className="w-16 h-16" />
                          </div>
                        )}

                        {isSignature && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-4 py-2 rounded-full text-sm font-black flex items-center gap-1.5 shadow-lg border border-amber-300/30">
                            <Crown className="w-4 h-4" /> Trago Especial 👑
                          </div>
                        )}
                      </div>

                      <h3 className={`text-3xl font-black line-clamp-1 w-full tracking-tight ${isSignature ? 'text-amber-400' : 'text-white'}`}>
                        {drink.nombre}
                      </h3>

                      {drink.ingredientes && drink.ingredientes.length > 0 && (
                        <p className="text-lg text-slate-400 font-semibold mt-2 line-clamp-2 leading-relaxed">
                          {drink.ingredientes.join(', ')}
                        </p>
                      )}

                      {settings?.showDrinkDescription && drink.descripcion && (
                        <p className="text-sm text-slate-500 font-medium mt-3 line-clamp-2 leading-relaxed">
                          {drink.descripcion}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ORDER MODAL */}
            <AnimatePresence>
              {selectedDrink && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-10"
                >
                  <motion.div
                    initial={{ scale: 0.94, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl flex flex-col items-center text-center"
                  >
                    <div className="w-36 h-36 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 border-4 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.35)]">
                      <Martini className="w-16 h-16 text-rose-500" />
                    </div>
                    <h2 className="text-5xl font-black text-white tracking-tight mb-2">{selectedDrink.nombre}</h2>
                    <p className="text-xl text-slate-400 font-bold mb-8">¿Para quién preparamos este trago?</p>

                    <Input
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Escribí tu nombre acá"
                      className="h-22 rounded-3xl bg-black/60 border-white/15 text-center text-3xl font-bold text-white mb-8 placeholder:text-slate-600 focus:border-rose-500 focus:ring-rose-500"
                    />

                    <div className="flex gap-4 w-full">
                      <Button
                        onClick={() => { setSelectedDrink(null); setGuestName(''); }}
                        variant="outline"
                        className="flex-1 h-18 rounded-3xl border-white/15 bg-transparent text-xl font-bold text-white hover:bg-white/10"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={submitOrder}
                        disabled={isOrdering}
                        className="flex-1 h-18 rounded-3xl bg-gradient-to-r from-rose-600 to-orange-500 text-xl font-black text-white shadow-xl border-0"
                      >
                        {isOrdering ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirmar Pedido'}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ORDER SUCCESS OVERLAY */}
            <AnimatePresence>
              {lastOrder && !selectedDrink && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/95 backdrop-blur-xl"
                >
                  <div className="text-center p-8 max-w-xl">
                    <div className="w-36 h-36 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 border-4 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                      <CheckCircle2 className="w-20 h-20 text-emerald-400" />
                    </div>
                    <h2 className="text-6xl font-black text-white tracking-tight mb-4">¡Pedido Enviado!</h2>
                    <p className="text-2xl text-emerald-300 font-bold mb-4">Ya lo recibimos en la barra.</p>
                    <p className="text-lg text-emerald-400/80 font-semibold mb-10">Acércate a retirar tu trago en unos minutos.</p>
                    <Button
                      onClick={() => setLastOrder(null)}
                      className="h-18 px-12 rounded-3xl bg-white text-emerald-950 text-2xl font-black hover:bg-slate-200 shadow-xl border-0"
                    >
                      Entendido
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* --- CAMERA SCREENS (PHOTO/VIDEO) --- */}
        {(currentScreen === 'PHOTO' || currentScreen === 'VIDEO') && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black flex flex-col"
          >
            {/* Live Viewport */}
            <div className="relative flex-1 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${capturedDataUrl ? 'hidden' : 'block'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1.25, opacity: 1 }}
                    exit={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    className="text-center"
                  >
                    {countdown > 0 ? (
                      <span className="text-[14rem] font-black text-rose-500 drop-shadow-[0_0_55px_rgba(244,63,94,0.65)] tracking-tighter">
                        {countdown}
                      </span>
                    ) : (
                      <span className="text-6xl md:text-8xl font-black text-yellow-400 drop-shadow-[0_0_45px_rgba(250,204,21,0.65)] uppercase tracking-wider animate-bounce">
                        {currentScreen === 'PHOTO' ? '¡Sonreí! 📸' : '¡Acción! 🎥'}
                      </span>
                    )}
                  </motion.div>
                </div>
              )}

              {/* Preview Viewport */}
              {capturedDataUrl && (
                currentScreen === 'PHOTO' ? (
                  <img src={capturedDataUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <video src={capturedDataUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
                )
              )}

              {/* Recording Overlay Indicator */}
              {isRecording && (
                <div className="absolute top-10 right-10 flex items-center gap-3 bg-rose-600/90 px-6 py-3 rounded-full animate-pulse shadow-lg">
                  <div className="w-4 h-4 bg-white rounded-full" />
                  <span className="text-2xl font-black text-white">00:{recordingTime.toString().padStart(2, '0')}</span>
                </div>
              )}

              {/* Social Sharing & Hashtag CTA (Visible only during preview) */}
              {capturedDataUrl && (
                <div className="absolute top-28 left-8 right-8 z-30 p-6 rounded-[2.2rem] bg-black/75 backdrop-blur-xl border border-white/10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                  <h3 className="text-3xl font-black uppercase text-rose-500 tracking-wider flex items-center justify-center gap-2">
                    <Sparkles className="w-7 h-7 text-yellow-300" /> ¡Estás espectacular!
                  </h3>
                  <p className="mt-2 text-slate-200 font-bold text-xl">
                    {settings?.brandText || 'Subí tu foto al muro social de la fiesta.'}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4 justify-center items-center">
                    {settings?.hashtag && (
                      <Button
                        onClick={copyHashtag}
                        variant="secondary"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 h-12 rounded-full border border-white/5 font-black text-white text-lg transition-all"
                      >
                        <span className="text-cyan-400">#</span> {settings.hashtag}
                        <Copy className="w-4 h-4 ml-1 text-slate-400" />
                      </Button>
                    )}
                    {settings?.instagramHandle && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/60 to-pink-600/60 px-6 py-2.5 rounded-full border border-white/10 text-lg font-black text-white shadow-md">
                        <Instagram className="w-5 h-5 text-pink-400" />
                        <span>{settings.instagramHandle}</span>
                      </div>
                    )}
                  </div>

                  {settings?.requireSocialFollowForPhotos && (
                    <p className="mt-5 text-sm font-semibold text-amber-400 bg-amber-500/10 py-2.5 px-6 rounded-2xl inline-block border border-amber-500/20">
                      ⚠️ {settings.socialFollowPrompt || 'Seguinos en Instagram para subir tu foto a la pantalla gigante.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Controls panel */}
            <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/85 to-transparent flex justify-center items-center pb-20 z-30">
              {!capturedDataUrl ? (
                currentScreen === 'PHOTO' ? (
                  <Button
                    onClick={triggerPhotoCountdown}
                    disabled={countdown !== null}
                    className="w-32 h-32 rounded-full border-[10px] border-white/40 bg-white hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.4)]"
                  />
                ) : (
                  <Button
                    onClick={isRecording ? undefined : triggerVideoCountdown}
                    disabled={isRecording || countdown !== null}
                    className={`w-32 h-32 rounded-full border-[10px] border-white/40 bg-red-600 hover:bg-red-700 active:scale-95 transition-all ${
                      isRecording
                        ? 'scale-110 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-pulse'
                        : 'shadow-[0_0_40px_rgba(220,38,38,0.4)]'
                    }`}
                  />
                )
              ) : (
                <div className="flex gap-6 max-w-lg w-full">
                  <Button
                    onClick={() => { setCapturedDataUrl(null); }}
                    variant="outline"
                    className="flex-1 h-20 rounded-3xl bg-black/60 border-white/15 text-2xl font-bold text-white backdrop-blur-md hover:bg-white/10"
                  >
                    <X className="w-8 h-8 mr-2 text-rose-500" /> Reintentar
                  </Button>
                  <Button
                    onClick={uploadMedia}
                    disabled={isUploadingMedia}
                    className="flex-1 h-20 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-500 border-0 text-2xl font-black text-white shadow-[0_6px_30px_rgba(16,185,129,0.4)] hover:scale-[1.02]"
                  >
                    {isUploadingMedia ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <>
                        <Share2 className="w-8 h-8 mr-2" /> Subir al Muro
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <KioskUnlockButton />
    </main>
  );
}

