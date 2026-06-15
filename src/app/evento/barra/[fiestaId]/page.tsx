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
  Phone
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

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('#AKProducciones', 50, canvas.height - 80);
    
    setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.9));
  };

  const uploadMedia = async () => {
    if (!capturedDataUrl) return;
    setIsUploadingMedia(true);
    
    try {
      // Helper to convert data URL to File
      const [meta, data] = capturedDataUrl.split(',');
      const mime = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], `kiosco-${Date.now()}.${mime === 'video/webm' ? 'webm' : 'jpg'}`, { type: mime });

      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('authorName', 'Invitado Kiosco');
      formData.append('caption', 'Capturado en el Kiosco Tecnológico');
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

  // Recording Video Logic
  const startRecording = () => {
    if (!streamRef.current) return;
    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCapturedDataUrl(url);
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
      tableNumber: 'Kiosco',
    });
    if (result.success && result.order) {
      setLastOrder(result.order);
      setSelectedDrink(null);
      setGuestName('');
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-16 w-16 animate-spin text-rose-500" />
      </div>
    );
  }

  const settings = dashboard?.settings;
  const quinceaneraPhoto = 'https://images.unsplash.com/photo-1541250848049-b4f7146174fb?q=80&w=1080&auto=format&fit=crop';
  const drinks = dashboard?.drinks || [];

  return (
    <main className="relative flex min-h-screen w-full max-w-full flex-col bg-black text-slate-100 font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <NextImage src={quinceaneraPhoto} alt="Background" fill className="object-cover opacity-40 blur-[2px]" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
      </div>

      {/* HEADER GLOBALS */}
      {currentScreen !== 'HOME' && (
        <div className="absolute top-6 left-6 z-50">
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full bg-black/50 border-white/20 text-white backdrop-blur-md h-16 px-6 text-xl"
            onClick={() => handleScreenChange('HOME')}
          >
            <ChevronLeft className="w-8 h-8 mr-2" /> Volver al Inicio
          </Button>
        </div>
      )}

      {/* RENDER SCREENS */}
      <AnimatePresence mode="wait">
        
        {/* --- HOME SCREEN --- */}
        {currentScreen === 'HOME' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10 flex flex-1 flex-col items-center justify-center p-10 text-center"
          >
            <div className="mb-16">
              <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-rose-500 animate-pulse">Experiencia Interactiva</h2>
              <h1 className="mt-4 text-7xl font-black text-white drop-shadow-2xl">BARRA DE TRAGOS AK</h1>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-2xl">
              <Button 
                onClick={() => handleScreenChange('MENU')}
                className="h-32 rounded-3xl bg-gradient-to-r from-rose-600 to-orange-500 text-3xl font-black text-white shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:scale-105 transition-transform"
              >
                <Martini className="w-12 h-12 mr-4" /> Elige tu Trago
              </Button>
              
              <Button 
                onClick={() => handleScreenChange('PHOTO')}
                className="h-32 rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-3xl font-black text-white hover:bg-white/20 hover:scale-105 transition-transform"
              >
                <Camera className="w-12 h-12 mr-4 text-cyan-400" /> Captura tu Momento
              </Button>
              
              <Button 
                onClick={() => handleScreenChange('VIDEO')}
                className="h-32 rounded-3xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-3xl font-black text-white hover:bg-white/20 hover:scale-105 transition-transform"
              >
                <Video className="w-12 h-12 mr-4 text-purple-400" /> Graba un Saludo VIP
              </Button>
            </div>

            {/* Redes Footer */}
            <div className="absolute bottom-10 flex items-center justify-center gap-10 opacity-70">
              <div className="flex items-center gap-3"><Instagram className="w-8 h-8" /> <span className="text-2xl font-bold">{settings?.instagramHandle || '@akproducciones'}</span></div>
              <div className="flex items-center gap-3"><Phone className="w-8 h-8" /> <span className="text-2xl font-bold">AK Producciones</span></div>
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
              <h1 className="text-5xl font-black text-white">Menú de Tragos</h1>
              <Button onClick={openRandomDrink} className="h-16 px-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-2xl font-black shadow-[0_0_30px_rgba(147,51,234,0.5)] animate-pulse border-0">
                <Shuffle className="w-8 h-8 mr-3" /> ¡Sorpréndeme!
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 scrollbar-none">
              <div className="grid grid-cols-2 gap-6">
                {drinks.map((drink, idx) => {
                  const isSignature = idx === 0;
                  return (
                    <motion.button
                      key={drink.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDrink(drink)}
                      className={`relative flex flex-col items-start overflow-hidden rounded-[2.5rem] p-6 text-left transition-all ${isSignature ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'bg-black/50 border border-white/10 backdrop-blur-md hover:bg-black/70'}`}
                    >
                      {isSignature && (
                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
                      )}
                      <div className="relative w-full aspect-[4/3] rounded-3xl bg-slate-900 mb-6 overflow-hidden">
                        {drink.imageUrl ? (
                          <NextImage src={drink.imageUrl} alt={drink.nombre} fill className="object-cover" unoptimized />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-rose-500/50">
                            <Wine className="w-20 h-20" />
                          </div>
                        )}
                        {isSignature && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg">
                            <Crown className="w-4 h-4" /> Trago de la Cumpleañera
                          </div>
                        )}
                      </div>
                      <h3 className={`text-3xl font-black line-clamp-1 w-full ${isSignature ? 'text-amber-400' : 'text-white'}`}>{drink.nombre}</h3>
                      <p className="text-lg text-slate-400 font-semibold mt-2 line-clamp-2">{drink.ingredientes?.join(', ')}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ORDER MODAL */}
            <AnimatePresence>
              {selectedDrink && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-10"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-white/10 p-10 shadow-2xl flex flex-col items-center text-center"
                  >
                    <div className="w-40 h-40 rounded-full bg-rose-500/20 flex items-center justify-center mb-8 border-4 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
                      <Martini className="w-20 h-20 text-rose-500" />
                    </div>
                    <h2 className="text-5xl font-black text-white mb-4">{selectedDrink.nombre}</h2>
                    <p className="text-xl text-slate-400 font-semibold mb-10">¡Excelente elección! ¿Para quién es este trago?</p>
                    
                    <Input 
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      placeholder="Toca para ingresar tu nombre"
                      className="h-24 rounded-full bg-black/50 border-white/20 text-center text-4xl font-bold text-white mb-10 placeholder:text-slate-600 focus:border-rose-500 focus:ring-rose-500"
                    />

                    <div className="flex gap-4 w-full">
                      <Button onClick={() => setSelectedDrink(null)} variant="outline" className="flex-1 h-20 rounded-full border-white/20 bg-transparent text-2xl font-bold text-white hover:bg-white/10">
                        Cancelar
                      </Button>
                      <Button onClick={submitOrder} disabled={isOrdering} className="flex-1 h-20 rounded-full bg-gradient-to-r from-rose-600 to-orange-500 text-2xl font-black text-white shadow-xl border-0">
                        {isOrdering ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Pedir Ahora'}
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
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-xl"
                >
                  <div className="text-center">
                    <CheckCircle2 className="w-40 h-40 text-emerald-400 mx-auto mb-8 animate-bounce" />
                    <h2 className="text-6xl font-black text-white mb-4">¡Pedido Enviado!</h2>
                    <p className="text-3xl text-emerald-300 font-bold">Acércate a la barra en unos minutos</p>
                    <Button onClick={() => setLastOrder(null)} className="mt-12 h-20 px-12 rounded-full bg-white text-emerald-900 text-3xl font-black hover:bg-slate-200">
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
            {/* Live Camera View */}
            <div className="relative flex-1 overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transform -scale-x-100 ${capturedDataUrl ? 'hidden' : 'block'}`} 
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Captured Image / Video Preview */}
              {capturedDataUrl && (
                currentScreen === 'PHOTO' ? (
                  <img src={capturedDataUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <video src={capturedDataUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
                )
              )}

              {/* Recording Overlay */}
              {isRecording && (
                <div className="absolute top-10 right-10 flex items-center gap-3 bg-red-600/90 px-6 py-3 rounded-full animate-pulse">
                  <div className="w-4 h-4 bg-white rounded-full" />
                  <span className="text-2xl font-black text-white">00:{recordingTime.toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center items-center pb-20">
              {!capturedDataUrl ? (
                currentScreen === 'PHOTO' ? (
                  <Button onClick={capturePhoto} className="w-32 h-32 rounded-full border-8 border-white/50 bg-white hover:bg-slate-200 transition-transform hover:scale-105 shadow-[0_0_50px_rgba(255,255,255,0.3)]" />
                ) : (
                  <Button onClick={isRecording ? undefined : startRecording} disabled={isRecording} className={`w-32 h-32 rounded-full border-8 border-white/50 bg-red-500 hover:bg-red-600 transition-transform ${isRecording ? 'scale-110 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-pulse' : 'hover:scale-105 shadow-[0_0_50px_rgba(220,38,38,0.3)]'}`} />
                )
              ) : (
                <div className="flex gap-6">
                  <Button onClick={() => setCapturedDataUrl(null)} variant="outline" className="h-24 px-10 rounded-full bg-black/50 border-white/20 text-3xl font-bold text-white backdrop-blur-md">
                    <X className="w-10 h-10 mr-3" /> Reintentar
                  </Button>
                  <Button onClick={uploadMedia} disabled={isUploadingMedia} className="h-24 px-10 rounded-full bg-emerald-500 border-0 text-3xl font-black text-white shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                    {isUploadingMedia ? <Loader2 className="w-10 h-10 animate-spin mr-3" /> : <CheckCircle2 className="w-10 h-10 mr-3" />}
                    Enviar al Muro
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
