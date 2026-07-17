'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NextImage from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Martini,
  Shuffle,
  Video,
  Wine,
  X,
  Share2,
  User,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type {
  BarDrinkOrder,
  PublicBarDrink,
  PublicBarTechnologyDashboard,
} from '@/types/barra-tecnologica';
import {
  createBarDrinkOrder,
  getPublicBarraTecnologicaDashboard,
  uploadBarMagicPhoto,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

type ScreenState = 'HOME' | 'MENU' | 'PHOTO' | 'VIDEO';

interface FrameTemplate {
  id: string;
  name: string;
  emoji: string;
  color: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, eventName: string, hashtag: string) => void;
}

export default function BarraTecnologicaTouchPage() {
  const params = useParams();
  const fiestaId = params.fiestaId as string;
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState<PublicBarTechnologyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('HOME');

  // Identificación del invitado
  const [guestName, setGuestName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingScreen, setPendingScreen] = useState<ScreenState | null>(null);

  // Ordering State
  const [selectedDrink, setSelectedDrink] = useState<PublicBarDrink | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [lastOrder, setLastOrder] = useState<BarDrinkOrder | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // Camera & Recording State
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

  // Marcos de Fotocabina
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0);

  const templates: FrameTemplate[] = [
    {
      id: 'gold',
      name: 'Dorado Premium',
      emoji: '👑',
      color: 'from-amber-400 to-yellow-600',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Borde dorado
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 30;
        ctx.strokeRect(15, 15, w - 30, h - 30);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(32, 32, w - 64, h - 64);

        // Banner inferior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(34, h - 180, w - 68, 146);

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 46px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventName.toUpperCase(), w / 2, h - 110);

        ctx.fillStyle = '#ffffff';
        ctx.font = '32px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 60);
      }
    },
    {
      id: 'neon',
      name: 'Neon Party',
      emoji: '⚡',
      color: 'from-pink-500 to-purple-600',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Luces de neón
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 25;
        ctx.strokeRect(12, 12, w - 24, h - 24);

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 8;
        ctx.strokeRect(22, 22, w - 44, h - 44);

        // Banner
        ctx.fillStyle = 'rgba(10, 5, 20, 0.9)';
        ctx.fillRect(26, h - 170, w - 52, 134);

        ctx.fillStyle = '#00f0ff';
        ctx.font = 'italic bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventName, w / 2, h - 105);

        ctx.fillStyle = '#ff007f';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 60);
      }
    },
    {
      id: 'retro',
      name: 'Retro Polaroid',
      emoji: '📸',
      color: 'from-slate-200 to-slate-400',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Marco Polaroid blanco grueso
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // El viewport de la foto va a estar recortado o centrado.
        // Dibujamos un marco de foto interno negro
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 6;
        ctx.strokeRect(40, 40, w - 80, h - 260);

        // Texto manuscrito en la base blanca
        ctx.fillStyle = '#111111';
        ctx.font = 'bold italic 48px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventName, w / 2, h - 140);

        ctx.font = '32px monospace';
        ctx.fillStyle = '#555555';
        ctx.fillText(hashtag, w / 2, h - 70);
      }
    },
    {
      id: 'floral',
      name: 'Floral Vintage',
      emoji: '🌸',
      color: 'from-pink-300 to-rose-400',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Borde elegante rosa viejo
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 30;
        ctx.strokeRect(15, 15, w - 30, h - 30);

        // Detalles florales en esquinas (círculos y pétalos artísticos)
        ctx.fillStyle = '#fecdd3';
        const corners = [[35, 35], [w - 35, 35], [35, h - 35], [w - 35, h - 35]];
        for (const [cx, cy] of corners) {
          ctx.beginPath();
          ctx.arc(cx, cy, 25, 0, Math.PI * 2);
          ctx.fill();
          // Círculo central
          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fecdd3';
        }

        ctx.fillStyle = 'rgba(255, 245, 245, 0.9)';
        ctx.fillRect(30, h - 170, w - 60, 140);

        ctx.fillStyle = '#be123c';
        ctx.font = 'italic bold 42px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventName, w / 2, h - 105);

        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 60);
      }
    },
    {
      id: 'glamour',
      name: 'Red Carpet Glam',
      emoji: '✨',
      color: 'from-red-600 to-red-800',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Marco plateado/dorado con destellos
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 30;
        ctx.strokeRect(15, 15, w - 30, h - 30);

        ctx.fillStyle = 'rgba(15, 15, 15, 0.85)';
        ctx.fillRect(30, h - 180, w - 60, 150);

        // Estrellas
        ctx.fillStyle = '#f59e0b';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ ★ ★ ★ ★', w / 2, h - 135);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'black 40px sans-serif';
        ctx.fillText(eventName.toUpperCase(), w / 2, h - 90);

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 50);
      }
    },
    {
      id: 'cyber',
      name: 'Cyberpunk HUD',
      emoji: '🤖',
      color: 'from-green-400 to-emerald-600',
      draw: (ctx, w, h, eventName, hashtag) => {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.strokeRect(30, 30, w - 60, h - 60);

        // Esquinas tipo mira HUD
        ctx.fillStyle = '#10b981';
        // Top-Left
        ctx.fillRect(20, 20, 60, 15);
        ctx.fillRect(20, 20, 15, 60);
        // Top-Right
        ctx.fillRect(w - 80, 20, 60, 15);
        ctx.fillRect(w - 35, 20, 15, 60);
        // Bottom-Left
        ctx.fillRect(20, h - 35, 60, 15);
        ctx.fillRect(20, h - 80, 15, 60);
        // Bottom-Right
        ctx.fillRect(w - 80, h - 35, 60, 15);
        ctx.fillRect(w - 35, h - 80, 15, 60);

        ctx.fillStyle = 'rgba(5, 20, 10, 0.9)';
        ctx.fillRect(35, h - 160, w - 70, 120);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 36px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`SYS_LOC: ${eventName.toUpperCase()}`, w / 2, h - 100);

        ctx.fillStyle = '#34d399';
        ctx.font = '28px Courier New, monospace';
        ctx.fillText(`[${hashtag}]`, w / 2, h - 60);
      }
    },
    {
      id: 'disco',
      name: 'Retro Disco 80s',
      emoji: '🪩',
      color: 'from-indigo-500 to-pink-500',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Marco de luces psicodélicas
        ctx.strokeStyle = '#4338ca';
        ctx.lineWidth = 26;
        ctx.strokeRect(13, 13, w - 26, h - 26);

        ctx.fillStyle = 'rgba(20, 10, 40, 0.85)';
        ctx.fillRect(26, h - 170, w - 52, 134);

        ctx.fillStyle = '#ec4899';
        ctx.font = 'bold italic 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🕺 ${eventName} 💃`, w / 2, h - 105);

        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 60);
      }
    },
    {
      id: 'minimal',
      name: 'Chic Minimalist',
      emoji: '🖤',
      color: 'from-stone-700 to-black',
      draw: (ctx, w, h, eventName, hashtag) => {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, w - 80, h - 80);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(41, h - 150, w - 82, 108);

        ctx.fillStyle = '#ffffff';
        ctx.font = '300 42px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(eventName.toUpperCase(), w / 2, h - 95);

        ctx.fillStyle = '#999999';
        ctx.font = '300 24px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 55);
      }
    },
    {
      id: 'popart',
      name: 'Comic Pop-Art',
      emoji: '💥',
      color: 'from-yellow-400 to-red-500',
      draw: (ctx, w, h, eventName, hashtag) => {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 24;
        ctx.strokeRect(12, 12, w - 24, h - 24);

        ctx.fillStyle = '#facc15';
        ctx.fillRect(24, h - 160, w - 48, 124);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.strokeRect(24, h - 160, w - 48, 1);

        ctx.fillStyle = '#000000';
        ctx.font = 'black italic 42px Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`★ ${eventName.toUpperCase()} ★`, w / 2, h - 105);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'black 30px Impact, sans-serif';
        ctx.fillText(hashtag, w / 2, h - 65);
      }
    },
    {
      id: 'akmagic',
      name: 'AK Stars Magic',
      emoji: '✨',
      color: 'from-rose-400 to-violet-600',
      draw: (ctx, w, h, eventName, hashtag) => {
        // Marco de fantasía con estrellas
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 26;
        ctx.strokeRect(13, 13, w - 26, h - 26);

        ctx.fillStyle = 'rgba(15, 10, 25, 0.9)';
        ctx.fillRect(26, h - 170, w - 52, 134);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`✨ ${eventName} ✨`, w / 2, h - 105);

        ctx.fillStyle = '#a78bfa';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(hashtag, w / 2, h - 60);
      }
    }
  ];

  const loadData = useCallback(async () => {
    const dashResult = await getPublicBarraTecnologicaDashboard(fiestaId);
    if (dashResult.success && dashResult.data) {
      setDashboard(dashResult.data);
    } else {
      toast({ title: 'Error de conexión', description: dashResult.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [fiestaId, toast]);

  useEffect(() => {
    loadData();
    // Recuperar nombre guardado
    const savedName = localStorage.getItem(`bar_guest_name_${fiestaId}`);
    if (savedName) setGuestName(savedName);

    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData, fiestaId]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
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

    // Pintar el marco de fotocabina seleccionado directamente en el canvas
    const eventName = dashboard?.eventName || 'Mi Fiesta';
    const hashtag = dashboard?.settings?.hashtag || '#AKProducciones';
    templates[selectedFrameIdx].draw(ctx, canvas.width, canvas.height, eventName, hashtag);

    setCapturedDataUrl(canvas.toDataURL('image/jpeg', 0.9));
  };

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
    // Si no ingresó nombre, forzar la pantalla de identificación antes de ir a pedir tragos o fotos
    if (screen !== 'HOME' && !guestName.trim()) {
      setPendingScreen(screen);
      setShowNameModal(true);
      return;
    }

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
      toast({ title: 'Falta tu nombre', description: 'Por favor, ingresá tu nombre.', variant: 'destructive' });
      return;
    }
    setIsOrdering(true);
    const result = await createBarDrinkOrder({
      fiestaId,
      drinkId: selectedDrink.id,
      guestName,
      tableNumber: 'Totem Táctil',
    });
    if (result.success && result.order) {
      setLastOrder(result.order);
      setSelectedDrink(null);
      toast({ title: '¡Trago Pedido!', description: 'Acercate a la barra en unos minutos.' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsOrdering(false);
  };

  // Botón "Sugerir Trago Al Azar 🎲" animado
  const handleRandomDrink = () => {
    const drinksList = dashboard?.drinks || [];
    if (!drinksList.length) {
      toast({
        title: 'Sin tragos cargados',
        description: 'Primero carga la carta de tragos para poder sugerir uno al azar.',
        variant: 'destructive',
      });
      return;
    }

    setIsShuffling(true);
    let count = 0;
    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * drinksList.length);
      setSelectedDrink(drinksList[idx]);
      count++;
      if (count > 6) {
        clearInterval(interval);
        setIsShuffling(false);
      }
    }, 90);
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

      const fileExt = mime === 'video/webm' ? 'webm' : 'jpg';
      const file = new File([bytes], `totem-${Date.now()}.${fileExt}`, { type: mime });

      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('authorName', guestName || 'Invitado Totem');
      formData.append('caption', `Enviado desde el Kiosco de la barra con plantilla ${templates[selectedFrameIdx].name}`);
      formData.append('followConfirmed', 'true');
      formData.append('file', file);
      formData.append('source', 'kiosco');

      const result = await uploadBarMagicPhoto(formData);
      if (result.success) {
        toast({ title: '¡Subido con éxito!', description: 'El archivo se envió a la pantalla gigante.' });
        stopCamera();
        setCurrentScreen('HOME');
      } else {
        toast({ title: 'Error al subir', description: result.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: 'No se pudo subir el archivo.', variant: 'destructive' });
    }
    setIsUploadingMedia(false);
  };

  const saveNameAndProceed = () => {
    if (!guestName.trim()) {
      toast({ title: 'Ingresá tu nombre', description: 'Por favor, escribí cómo te llamás.', variant: 'destructive' });
      return;
    }
    localStorage.setItem(`bar_guest_name_${fiestaId}`, guestName.trim());
    setShowNameModal(false);
    if (pendingScreen) {
      handleScreenChange(pendingScreen);
      setPendingScreen(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`bar_guest_name_${fiestaId}`);
    setGuestName('');
    stopCamera();
    setCurrentScreen('HOME');
    toast({ title: 'Sesión Cerrada', description: 'Ya podés registrar otra persona.' });
  };

  // Teclado virtual táctil
  const handleKeypress = (char: string) => {
    if (char === 'BACKSPACE') {
      setGuestName(prev => prev.slice(0, -1));
    } else if (char === 'CLEAR') {
      setGuestName('');
    } else if (guestName.length < 24) {
      setGuestName(prev => prev + char);
    }
  };

  const keyboardKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ' ', 'BACKSPACE', 'CLEAR']
  ];

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
  const drinks = dashboard?.drinks?.length ? dashboard.drinks : [];

  return (
    <main className="relative flex min-h-screen w-full max-w-full flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden">

      {/* Background dinámico animado */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <NextImage
          src={backgroundPhoto}
          alt="Ambient Background"
          fill
          className="object-cover opacity-25 scale-105 blur-[3px]"
          decoding="async"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-purple-950/20 to-rose-950/20 animate-gradient" />
      </div>

      {/* HEADER DE IDENTIFICACIÓN PERMANENTE */}
      {guestName.trim() && (
        <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-black/60 border border-white/10 backdrop-blur-xl py-3 px-6 rounded-full text-slate-200 shadow-lg">
            <User className="w-5 h-5 text-rose-500" />
            <span className="text-lg font-black tracking-wide">{guestName}</span>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="rounded-full bg-white/5 border border-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 py-3 h-12 text-sm font-bold"
          >
            Salir
          </Button>
        </div>
      )}

      {/* BOTÓN VOLVER */}
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

      {/* NAVEGACIÓN DE PÁGINAS */}
      <AnimatePresence mode="wait">

        {/* --- PANTALLA INICIAL (HOME) --- */}
        {currentScreen === 'HOME' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            className="relative z-10 flex flex-1 flex-col items-center justify-center p-12 text-center"
          >
            <div className="mb-14 max-w-4xl">
              <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-rose-500 drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)] animate-pulse">
                Experiencia Interactiva
              </h2>
              <h1 className="mt-4 text-7xl font-black text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.85)] tracking-tight">
                {settings?.title || `BARRA DE TRAGOS DE ${dashboard?.eventName || 'LA FIESTA'}`}
              </h1>
              <p className="mt-6 text-2xl font-semibold text-slate-300 drop-shadow-md max-w-2xl mx-auto">
                {settings?.subtitle || 'Pedí tragos desde la pantalla, sacate fotos premium y subilas en vivo al muro.'}
              </p>
            </div>

            <div className="flex flex-col gap-6 w-full max-w-2xl">
              <Button
                onClick={() => handleScreenChange('MENU')}
                className="h-32 rounded-[2.5rem] bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 text-3xl font-black text-white shadow-[0_10px_45px_rgba(244,63,94,0.45)] hover:scale-[1.03] active:scale-[0.98] transition-transform duration-250 border-0"
              >
                <Martini className="w-14 h-14 mr-5" /> Elegí tu Trago
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
          </motion.div>
        )}

        {/* --- CARTA DE TRAGOS INTERACTIVA --- */}
        {currentScreen === 'MENU' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative z-10 flex flex-1 flex-col overflow-hidden px-6 pb-8 pt-28 md:px-10"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
              <div>
                <p className="mb-2 text-sm font-bold uppercase text-red-500">Barra interactiva</p>
                <h1 className="text-4xl font-black text-white md:text-5xl">Elegí deslizando</h1>
                <p className="mt-2 max-w-2xl text-base text-zinc-300 md:text-lg">
                  {settings?.guestPrompt || 'Tocá un trago para conocer qué lleva y sumarlo a la cola.'}
                </p>
              </div>
              <Button
                onClick={handleRandomDrink}
                disabled={isShuffling}
                className="h-14 rounded-lg border border-white/15 bg-white px-6 text-base font-black text-black shadow-lg hover:bg-zinc-200"
              >
                <Shuffle className={`mr-3 h-5 w-5 ${isShuffling ? 'animate-spin' : ''}`} /> Sorprendeme
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto pb-8 scrollbar-none">
              {drinks.length > 0 ? (
                <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-8 pr-[18vw] scrollbar-none">
                {drinks.map((drink, idx) => {
                  return (
                    <motion.button
                      key={drink.id}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDrink(drink)}
                      className="group relative flex w-[72vw] max-w-[330px] flex-none snap-start flex-col overflow-hidden rounded-lg border border-white/10 bg-zinc-950 text-left shadow-2xl transition-colors hover:border-red-500/70 md:w-[320px]"
                    >
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-900">
                        {drink.imageUrl ? (
                          <NextImage
                            src={drink.imageUrl}
                            alt={drink.nombre}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-red-500/50">
                            <Wine className="h-14 w-14" />
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex min-h-32 flex-1 items-center justify-between gap-4 p-5">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-2xl font-black text-white">{drink.nombre}</h3>
                          <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                            {drink.ingredientes?.length
                              ? drink.ingredientes.join(' · ')
                              : 'Tocá para conocer este trago'}
                          </p>
                        </div>
                        <ChevronRight className="h-7 w-7 flex-none text-red-500" />
                      </div>
                    </motion.button>
                  );
                })}
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/30 p-8 text-center">
                  <Martini className="mb-4 h-12 w-12 text-red-500" />
                  <h2 className="text-2xl font-black text-white">La carta todavía no está disponible</h2>
                  <p className="mt-2 text-zinc-400">Consultá al personal de barra.</p>
                </div>
              )}
            </div>

            {/* Detalle y confirmación del trago */}
            <AnimatePresence>
              {selectedDrink && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/95 p-4 backdrop-blur-md md:p-10"
                >
                  <motion.div
                    initial={{ scale: 0.97, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative grid w-full max-w-5xl overflow-hidden rounded-lg border border-white/10 bg-zinc-950 shadow-2xl md:grid-cols-[0.9fr_1.1fr]"
                  >
                    <button
                      type="button"
                      aria-label="Cerrar detalle del trago"
                      onClick={() => setSelectedDrink(null)}
                      className="absolute right-4 top-4 z-10 grid h-12 w-12 place-items-center rounded-md bg-black/75 text-white hover:bg-red-600"
                    >
                      <X className="h-6 w-6" />
                    </button>

                    <div className="relative min-h-72 bg-zinc-900 md:min-h-[560px]">
                      {selectedDrink.imageUrl ? (
                        <NextImage
                          src={selectedDrink.imageUrl}
                          alt={selectedDrink.nombre}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full min-h-72 items-center justify-center text-red-500/50">
                          <Wine className="h-20 w-20" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center p-7 md:p-10">
                      <p className="text-sm font-bold uppercase text-red-500">Tu elección</p>
                      <h2 className="mt-2 text-4xl font-black text-white md:text-5xl">{selectedDrink.nombre}</h2>

                      {settings?.showDrinkDescription && (selectedDrink.descripcion || selectedDrink.description) && (
                        <p className="mt-5 text-lg leading-relaxed text-zinc-300">
                          {selectedDrink.descripcion || selectedDrink.description}
                        </p>
                      )}

                      {settings?.showIngredients && selectedDrink.ingredientes && selectedDrink.ingredientes.length > 0 && (
                        <div className="mt-6 border-y border-white/10 py-5">
                          <p className="text-xs font-bold uppercase text-zinc-500">Qué lleva</p>
                          <p className="mt-2 text-lg font-semibold text-white">{selectedDrink.ingredientes.join(' · ')}</p>
                        </div>
                      )}

                      {settings?.showDrinkVideo && selectedDrink.videoUrl && (
                        <a
                          href={selectedDrink.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-zinc-300 underline decoration-red-500 underline-offset-4 hover:text-white"
                        >
                          <Video className="h-4 w-4" /> Ver preparación
                        </a>
                      )}

                      <p className="mt-8 text-base text-zinc-400">
                        Pedido a nombre de <strong className="text-white">{guestName}</strong>
                      </p>
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Button
                          onClick={() => setSelectedDrink(null)}
                          variant="outline"
                          className="h-14 flex-1 rounded-lg border-white/20 bg-transparent text-base font-bold text-white hover:bg-white/10"
                        >
                          Seguir mirando
                        </Button>
                        <Button
                          onClick={submitOrder}
                          disabled={isOrdering}
                          className="h-14 flex-1 rounded-lg bg-red-600 text-base font-black text-white shadow-lg hover:bg-red-500"
                        >
                          {isOrdering ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Enviar a la barra'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* OVERLAY DE PEDIDO EXITOSO */}
            <AnimatePresence>
              {lastOrder && !selectedDrink && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
                >
                  <div className="text-center p-8 max-w-xl">
                    <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-green-500 bg-green-500/10">
                      <CheckCircle2 className="h-14 w-14 text-green-400" />
                    </div>
                    <h2 className="mb-4 text-5xl font-black text-white">Pedido enviado</h2>
                    <p className="mb-2 text-2xl font-bold text-green-300">Ya apareció en la pantalla del barman.</p>
                    {lastOrder.queuePosition ? (
                      <p className="mb-10 text-lg font-semibold text-zinc-300">
                        Posición aproximada en la cola: <strong className="text-white">{lastOrder.queuePosition}</strong>
                      </p>
                    ) : (
                      <p className="mb-10 text-base font-semibold text-zinc-400">Acercate a retirar tu trago en unos minutos.</p>
                    )}
                    <Button
                      onClick={() => setLastOrder(null)}
                      className="h-14 rounded-lg bg-white px-12 text-lg font-black text-black shadow-xl hover:bg-zinc-200"
                    >
                      Elegir otro
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* --- VISTAS DE FOTOS Y VIDEOS (CÁMARA CON MARCOS) --- */}
        {(currentScreen === 'PHOTO' || currentScreen === 'VIDEO') && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black flex flex-col"
          >
            {/* Cámara en Vivo con Marco Superpuesto */}
            <div className="relative flex-1 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${capturedDataUrl ? 'hidden' : 'block'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* MARCO DE FOTOCABINA SUPERPUESTO POR CSS (EN VIVO) */}
              {!capturedDataUrl && (
                <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6">
                  {/* Borde superior e inferior del color de acento de la plantilla */}
                  <div className={`w-full h-8 bg-gradient-to-r ${templates[selectedFrameIdx].color} rounded-full`} />

                  {/* Banner inferior simulando la marca del marco */}
                  <div className="bg-black/85 border border-white/10 backdrop-blur-md p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className={`text-2xl font-black uppercase bg-gradient-to-r ${templates[selectedFrameIdx].color} bg-clip-text text-transparent`}>
                      {dashboard?.eventName || 'Mi Fiesta'}
                    </p>
                    <p className="text-slate-300 font-bold text-sm mt-1">{settings?.hashtag || '#AKProducciones'}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-black">
                      Plantilla: {templates[selectedFrameIdx].name} {templates[selectedFrameIdx].emoji}
                    </p>
                  </div>
                </div>
              )}

              {/* Vista Previa de la Captura (con el marco ya renderizado) */}
              {capturedDataUrl && (
                currentScreen === 'PHOTO' ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Camera output is a runtime data URL.
                  <img src={capturedDataUrl} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <div className="relative w-full h-full">
                    <video src={capturedDataUrl} autoPlay loop playsInline className="w-full h-full object-cover" />

                    {/* Marco superpuesto en el reproductor de video */}
                    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-6">
                      <div className={`w-full h-8 bg-gradient-to-r ${templates[selectedFrameIdx].color} rounded-full`} />
                      <div className="bg-black/85 border border-white/10 backdrop-blur-md p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <p className={`text-2xl font-black uppercase bg-gradient-to-r ${templates[selectedFrameIdx].color} bg-clip-text text-transparent`}>
                          {dashboard?.eventName || 'Mi Fiesta'}
                        </p>
                        <p className="text-slate-300 font-bold text-sm mt-1">{settings?.hashtag || '#AKProducciones'}</p>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Cuenta Regresiva Visual */}
              {countdown !== null && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: 1 }}
                    exit={{ scale: 1.7, opacity: 0 }}
                    transition={{ duration: 0.85 }}
                    className="text-center"
                  >
                    {countdown > 0 ? (
                      <span className="text-[16rem] font-black text-rose-500 drop-shadow-[0_0_60px_rgba(244,63,94,0.7)]">
                        {countdown}
                      </span>
                    ) : (
                      <span className="text-7xl font-black text-yellow-400 drop-shadow-[0_0_40px_rgba(250,204,21,0.7)] uppercase tracking-wider animate-bounce">
                        {currentScreen === 'PHOTO' ? '¡Sonreí! 📸' : '¡Al aire! 🎥'}
                      </span>
                    )}
                  </motion.div>
                </div>
              )}

              {/* Indicador de Grabación */}
              {isRecording && (
                <div className="absolute top-28 right-8 flex items-center gap-3 bg-rose-600/90 px-6 py-3 rounded-full animate-pulse shadow-lg z-30">
                  <div className="w-4 h-4 bg-white rounded-full" />
                  <span className="text-2xl font-black text-white">00:{recordingTime.toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            {/* CARRUSEL DE SELECCIÓN DE MARCOS DE FOTOCABINA */}
            {!capturedDataUrl && !isRecording && (
              <div className="bg-slate-950/90 border-t border-white/10 p-5 z-30">
                <p className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-rose-500" /> Seleccioná tu Marco de Fotocabina:
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {templates.map((tmpl, idx) => (
                    <Button
                      key={tmpl.id}
                      onClick={() => setSelectedFrameIdx(idx)}
                      className={`h-16 px-5 rounded-2xl flex items-center gap-2 border whitespace-nowrap text-lg transition-all active:scale-95 ${
                        selectedFrameIdx === idx
                          ? `bg-gradient-to-r ${tmpl.color} text-slate-950 border-transparent font-black shadow-lg`
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{tmpl.emoji}</span>
                      <span>{tmpl.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* CONTROLES INFERIORES */}
            <div className="p-8 bg-slate-950/95 border-t border-white/5 flex justify-center items-center pb-12 z-30">
              {!capturedDataUrl ? (
                currentScreen === 'PHOTO' ? (
                  <Button
                    onClick={triggerPhotoCountdown}
                    disabled={countdown !== null}
                    className="w-28 h-28 rounded-full border-[8px] border-white/50 bg-white hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                  />
                ) : (
                  <Button
                    onClick={isRecording ? undefined : triggerVideoCountdown}
                    disabled={isRecording || countdown !== null}
                    className={`w-28 h-28 rounded-full border-[8px] border-white/50 bg-red-600 hover:bg-red-700 active:scale-95 transition-all ${
                      isRecording
                        ? 'scale-110 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-pulse'
                        : 'shadow-[0_0_40px_rgba(220,38,38,0.4)]'
                    }`}
                  />
                )
              ) : (
                <div className="flex gap-4 max-w-md w-full">
                  <Button
                    onClick={() => { setCapturedDataUrl(null); }}
                    variant="outline"
                    className="flex-1 h-18 rounded-2xl bg-black/60 border-white/15 text-xl font-bold text-white hover:bg-white/10"
                  >
                    <X className="w-6 h-6 mr-2 text-rose-500" /> Reintentar
                  </Button>
                  <Button
                    onClick={uploadMedia}
                    disabled={isUploadingMedia}
                    className="flex-1 h-18 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 border-0 text-xl font-black text-white shadow-[0_6px_30px_rgba(16,185,129,0.4)] hover:scale-[1.02]"
                  >
                    {isUploadingMedia ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Share2 className="w-6 h-6 mr-2" /> Subir al Muro
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANTALLA / MODAL OBLIGATORIO DE REGISTRO DE NOMBRE AL INICIO */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/95 p-3 backdrop-blur-2xl md:items-center md:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="my-3 flex w-full max-w-3xl flex-col items-center rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl sm:p-6 md:my-0 md:rounded-[3rem] md:p-10"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500/10 md:mb-6 md:h-20 md:w-20">
                <User className="h-6 w-6 text-rose-500 md:h-10 md:w-10" />
              </div>

              <h2 className="text-center text-2xl font-black tracking-tight text-white md:text-4xl">¡Hola! ¿Cómo te llamás?</h2>
              <p className="mb-4 mt-2 text-center text-sm font-bold text-slate-400 md:mb-8 md:text-base">
                Ingresá tu nombre para identificarte en la barra y en las fotos del muro gigante.
              </p>

              <Input
                value={guestName}
                readOnly
                placeholder="Escribí tu nombre..."
                className="mb-4 h-14 max-w-lg rounded-2xl border-white/10 bg-black/50 text-center text-xl font-black text-white placeholder:text-slate-700 focus:border-rose-500 focus:ring-rose-500 md:mb-8 md:h-20 md:text-3xl"
              />

              {/* TECLADO TÁCTIL VIRTUAL INTEGRADO */}
              <div className="mb-4 w-full space-y-1.5 md:mb-8 md:space-y-2">
                {keyboardKeys.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex w-full justify-center gap-1 sm:gap-1.5">
                    {row.map((key) => {
                      const isSpecial = key === 'BACKSPACE' || key === 'CLEAR';
                      return (
                        <button
                          key={key}
                          onClick={() => handleKeypress(key)}
                          className={`flex h-10 min-w-0 items-center justify-center rounded-lg text-xs font-black transition-all active:scale-95 sm:h-12 sm:text-sm md:h-14 md:rounded-xl md:text-lg ${
                            isSpecial
                              ? 'flex-[1.5] bg-rose-500/20 px-1 text-[10px] text-rose-400 border border-rose-500/30 sm:px-2 sm:text-xs md:px-4 md:text-base'
                              : key === ' '
                              ? 'flex-[3] max-w-32 bg-white/10 text-white border border-white/5'
                              : 'flex-1 max-w-12 bg-white/10 text-white border border-white/5 hover:bg-white/15'
                          }`}
                        >
                          {key === 'BACKSPACE' ? 'Borrar' : key === 'CLEAR' ? 'Limpiar' : key === ' ' ? 'Espacio' : key}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex w-full max-w-md gap-2 md:gap-4">
                <Button
                  onClick={() => { setShowNameModal(false); setPendingScreen(null); }}
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-white/10 bg-transparent text-sm font-bold text-white hover:bg-white/10 md:h-16 md:rounded-2xl md:text-lg"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={saveNameAndProceed}
                  className="h-12 flex-1 rounded-xl border-0 bg-gradient-to-r from-rose-600 to-orange-500 text-sm font-black text-white shadow-lg md:h-16 md:rounded-2xl md:text-lg"
                >
                  Confirmar e Ingresar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <KioskUnlockButton />
    </main>
  );
}
