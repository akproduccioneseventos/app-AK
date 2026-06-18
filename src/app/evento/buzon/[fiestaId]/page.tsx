'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
Resolving Imports Conflict...
import {
  Mic, Video, Play, Pause, Square, Trash2, Send, ArrowLeft, Loader2, CheckCircle2,
  Volume2, Sparkles, AlertCircle, RefreshCw, Upload, Phone, PhoneOff, Camera, VideoOff, X
} from 'lucide-react';
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { uploadBuzonMessage } from '@/app/actions/buzon';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

export default function GuestBuzonPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  // Welcome Audio State
  const [isWelcomePlaying, setIsWelcomePlaying] = useState(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Phone Cabin State
  const [phoneState, setPhoneState] = useState<'hung_up' | 'off_hook' | 'beeping' | 'recording' | 'review'>('hung_up');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Video VHS State
  const [videoState, setVideoState] = useState<'idle' | 'recording' | 'processing' | 'review'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const vhsCanvasRef = useRef<HTMLCanvasElement>(null);
  const vhsRecorderRef = useRef<MediaRecorder | null>(null);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

Resolving Imports Conflict...
import {
  Mic, Video, Play, Pause, Square, Trash2, Send, ArrowLeft, Loader2, CheckCircle2,
  Volume2, Sparkles, AlertCircle, RefreshCw, Upload, Phone, PhoneOff, Camera, VideoOff, X
} from 'lucide-react';
  };

  // Load Fiesta Data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFiestaById(fiestaId);
        setFiesta(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [fiestaId]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      stopCamera();
    };
  }, [audioUrl, videoUrl]);

  // Welcome Audio Control
  const toggleWelcomeAudio = () => {
    if (!fiesta?.buzonConfig?.welcomeAudioUrl) return;

    if (!welcomeAudioRef.current) {
      welcomeAudioRef.current = new Audio(fiesta.buzonConfig.welcomeAudioUrl);
      welcomeAudioRef.current.onended = () => setIsWelcomePlaying(false);
    }

    if (isWelcomePlaying) {
      welcomeAudioRef.current.pause();
      setIsWelcomePlaying(false);
    } else {
      if (isPlayingRecording && previewAudioRef.current) {
        previewAudioRef.current.pause();
        setIsPlayingRecording(false);
      }
      welcomeAudioRef.current.play();
      setIsWelcomePlaying(true);
    }
  };

  // Rotary Phone Handset Off-Hook & Dial Trigger
  const handlePickUpHandset = async () => {
    setPhoneState('off_hook');
    
    // Play dial tones (DTMF sounds)
    playPhoneTone(350, 440, 0.5); // Dial tone
    setTimeout(() => playPhoneTone(697, 1209, 0.15), 600); // Digit 1
    setTimeout(() => playPhoneTone(770, 1336, 0.15), 800); // Digit 5
    setTimeout(() => playPhoneTone(852, 1477, 0.15), 1000); // Digit 9
    
    setTimeout(() => {
      setPhoneState('beeping');
      playPhoneTone(1000, 1000, 0.45); // Classic voicemail BEEP
    }, 1300);

    setTimeout(() => {
      startAudioRecording();
    }, 1800);
  };

  const handleHangUpHandset = () => {
    stopAudioRecording();
    setPhoneState('review');
  };

  // Start Audio Recording
  const startAudioRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setPhoneState('recording');

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(audioStream, options);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        audioStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            handleHangUpHandset();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPhoneState('hung_up');
      toast({
        title: '¡Micrófono apagado! 🎙️',
        description: 'Che, por favor permití el acceso al micrófono para poder grabarte el audio.',
        variant: 'destructive',
      });
    }
  };

  const stopAudioRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const togglePlayRecording = () => {
    if (!audioUrl) return;

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(audioUrl);
      previewAudioRef.current.onended = () => setIsPlayingRecording(false);
    }

    if (isPlayingRecording) {
      previewAudioRef.current.pause();
      setIsPlayingRecording(false);
    } else {
      if (isWelcomePlaying && welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        setIsWelcomePlaying(false);
      }
      previewAudioRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  const resetAudioRecording = () => {
    if (isPlayingRecording && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingRecording(false);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setPhoneState('hung_up');
    previewAudioRef.current = null;
  };

  // UPLOAD FROM GALLERY (VIDEO FALLBACK)
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: '¡Formato incorrecto! ❌',
        description: 'Che, seleccioná un archivo de video válido.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
Resolving File Size Check...
        title: 'Â¡Pesa demasiado! âš–ï¸',
        description: 'El video no puede superar los 50MB. Â¡Buscate uno mÃ¡s liviano, bo!',
        variant: 'destructive',
      });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.src = tempUrl;
    videoElement.preload = 'metadata';

    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration;
      setVideoDuration(duration);
      URL.revokeObjectURL(tempUrl);

      if (duration > 31) {
        toast({
Resolving Duration Limit...
          title: 'Â¡Video muy largo! â³',
          description: 'El video tiene que ser de 15 segundos como mÃ¡ximo, bo. Recortalo o grabÃ¡ uno nuevo.',
          variant: 'destructive',
        });
        setVideoFile(null);
        setVideoUrl(null);
      } else {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
Resolving setVideoMode...
        setVideoMode('preview');
      }
    };
  };

  // LIVE VHS VIDEO CAPTURE
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setVideoState('recording');
      
      // Start VHS filter canvas loop
      setTimeout(() => startVHSRenderLoop(mediaStream), 300);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Cámara no disponible',
        description: 'No se pudo acceder a la cámara frontal.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startVHSRenderLoop = (activeStream: MediaStream) => {
    const video = videoRef.current;
    const canvas = vhsCanvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    let animationFrameId: number;

    const render = () => {
      if (video.paused || video.ended || activeStream.getTracks()[0].readyState === 'ended') return;

      // Draw video mirrored
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // VHS sepia/contrast tint
      ctx.fillStyle = 'rgba(120, 90, 40, 0.08)'; // vintage tint
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // CRT Scanlines effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      // flasing record dot
      const now = Date.now();
      if (Math.floor(now / 500) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(40, 40, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('REC', 60, 46);
      }

      // Video Timer or timestamp
      const date = new Date();
      const timeStr = date.toTimeString().split(' ')[0];
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText(timeStr, 40, canvas.height - 60);
      ctx.fillText(dateStr, 40, canvas.height - 35);
      ctx.fillText('PLAY ▶', canvas.width - 110, 46);
      ctx.fillText('VHS SP', canvas.width - 110, canvas.height - 35);

      // Random tracking error line (VHSDistortion)
      if (Math.random() < 0.1) {
        const errorY = Math.floor(Math.random() * canvas.height);
        const errorH = Math.floor(Math.random() * 10) + 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, errorY, canvas.width, errorH);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
  };

  const startLiveVideoRecording = async () => {
    const canvas = vhsCanvasRef.current;
    if (!canvas || !stream) return;

    setVideoState('recording');
    setVideoDuration(0);

    const canvasStream = canvas.captureStream(20); // 20 FPS
    
    // Add audio track to canvas stream
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(canvasStream, { mimeType });
    vhsRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const file = new File([blob], `capsulavideo-${Date.now()}.mp4`, { type: mimeType });
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(blob));
      setVideoState('review');
      stopCamera();
    };

    recorder.start();

    // Timer limit 15s
    let elapsed = 0;
    recordingIntervalRef.current = setInterval(() => {
      elapsed += 1;
      setVideoDuration(elapsed);
      if (elapsed >= 15) {
        stopLiveVideoRecording();
      }
    }, 1000);
  };

  const stopLiveVideoRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (vhsRecorderRef.current && vhsRecorderRef.current.state !== 'inactive') {
      vhsRecorderRef.current.stop();
    }
  };

  const resetVideoUpload = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(0);
    setVideoState('idle');
    stopCamera();
    if (videoInputRef.current) videoInputRef.current.value = '';
    setVideoMode('choice');
  };

  // Submit Handler
  const handleSubmit = async () => {
    const trimmedName = authorName.trim();
    if (!trimmedName) {
      toast({
Resolving Toast Name Validation...
        title: 'Â¿QuiÃ©n sos? ðŸ¤”',
        description: 'Che, ponÃ© tu nombre y apellido para que sepan de quiÃ©n es el saludo. âœï¸',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('authorName', trimmedName);

    if (activeTab === 'audio' && audioBlob) {
      formData.append('file', audioBlob, 'saludo_voz.webm');
      formData.append('mediaType', 'audio');
      formData.append('durationSeconds', recordingSeconds.toString());
    } else if (activeTab === 'video' && videoFile) {
      formData.append('file', videoFile, videoFile.name);
      formData.append('mediaType', 'video');
      formData.append('durationSeconds', Math.round(videoDuration).toString());
    } else {
      toast({
        title: 'Falta tu saludo 📢',
        description: 'Che, acordate de grabar o subir tu saludo antes de presionar enviar.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await uploadBuzonMessage(formData);
      if (result.success) {
        setShowCelebration(true);
        resetAudioRecording();
        resetVideoUpload();
        toast({
Resolving Toast Success Message...
          title: 'Â¡Mensaje guardado! ðŸŽ‰',
          description: 'Â¡BuenÃ­simo! Tu saludo ya estÃ¡ a salvo en el buzÃ³n de los anfitriones. ðŸ’Œ',
        });
        setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
      } else {
        toast({
Resolving Toast Error Message...
          title: 'FallÃ³ la subida ðŸ˜¢',
          description: result.error || 'Hubo un problema al subir tu saludo. ProbÃ¡ de nuevo, che.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Problema de red 🔌',
        description: 'Che, no nos pudimos conectar. Revisá tu conexión e intentalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm text-zinc-400">Cargando Cápsula del Tiempo...</p>
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Evento no encontrado</h1>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold">Volver</button>
      </div>
    );
  }

  const hasWelcomeAudio = !!fiesta.buzonConfig?.welcomeAudioUrl;
  const customAccent = fiesta.guestPortalSettings?.customAccentColor || '#6366f1';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#09090b_60%)] text-white flex flex-col justify-between select-none">
      
      {/* HEADER */}
      <header className="px-4 py-5 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 pr-6">
          <h1 className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Cápsula del Tiempo
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            {fiesta.configuracion?.nombreEvento || 'Fiesta'}
          </p>
        </div>
      </header>

      {/* CELEBRATION */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="inline-flex p-4 rounded-full bg-indigo-500/10 text-indigo-400 mb-2 border border-indigo-500/20">
              <CheckCircle2 className="w-16 h-16 animate-bounce" />
            </div>
            <h2 className="text-3xl font-black">¡Mensaje a la Cápsula!</h2>
            <p className="text-zinc-400 text-sm max-w-xs mt-2">Tu recuerdo ha sido guardado exitosamente para el futuro.</p>
            <button onClick={() => setShowCelebration(false)} className="mt-6 px-6 py-3 rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/20 hover:bg-white/10 transition">
              Grabar otro recuerdo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-start gap-6">
        
Resolving Premium Banner...
        {/* PREMIUM BANNER WITH FADE */}
        <div className="relative w-full h-44 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          <img 
            src="/media/mailbox_banner.png" 
            alt="BuzÃ³n de Recuerdos" 
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white bg-purple-600/90 border border-purple-400/30 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
              ðŸ“¸ Â¡DejÃ¡ tu video o audio de regalo! ðŸŽ
            </span>
          </div>
        </div>

        {/* Welcome Card */}
        {hasWelcomeAudio && (
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <button
              onClick={toggleWelcomeAudio}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105"
              style={{ backgroundColor: customAccent }}
            >
              {isWelcomePlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Mensaje Inicial
              </p>
              <h3 className="text-xs font-black text-white mt-0.5">Escucha el mensaje de los anfitriones</h3>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
Resolving Tab Click...
            onClick={() => { resetVideoUpload(); resetAudioRecording(); setActiveTab('audio'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'audio' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-4 h-4" /> Voz Retro
          </button>
          <button
            onClick={() => { resetAudioRecording(); resetVideoUpload(); setActiveTab('video'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'video' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Video className="w-4 h-4" /> Video VHS
          </button>
        </div>

        {/* TAB BODY */}
        <div className="flex-1 flex flex-col justify-between min-h-[340px]">
          
          {/* Voz Retro Tab */}
          {activeTab === 'audio' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {phoneState === 'hung_up' && (
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Antique Phone UI illustration */}
                  <div className="w-48 h-48 border-2 border-indigo-500/20 rounded-full flex items-center justify-center bg-indigo-500/5 relative">
                    <Phone className="w-20 h-20 text-indigo-400" />
                    {/* Rotary dial details */}
                    <div className="absolute inset-0 border-[6px] border-dashed border-indigo-400/30 rounded-full animate-[spin_40s_linear_infinite]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black">Cabina Telefónica Retro</h3>
                    <p className="text-xs text-zinc-400">Descolgá el auricular del teléfono para escuchar el pitido e iniciar la grabación de voz.</p>
                  </div>
                  <button
                    onClick={handlePickUpHandset}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Descolgar Auricular
                  </button>
                </div>
              )}

              {phoneState === 'off_hook' && (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">Descolgando auricular...</p>
                </div>
              )}

              {phoneState === 'beeping' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-600 rounded-full animate-ping mx-auto" />
                  <p className="text-sm font-black uppercase tracking-widest text-red-500 animate-pulse">Escucha el beep...</p>
                </div>
              )}

              {phoneState === 'recording' && (
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="w-28 h-28 bg-red-600/10 border-2 border-red-500/30 rounded-full flex items-center justify-center animate-pulse">
                    <Mic className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black tracking-wider text-red-500 tabular-nums">
                      0:{recordingSeconds.toString().padStart(2, '0')}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Grabando tu saludo...</p>
                  </div>
                  <button
                    onClick={handleHangUpHandset}
                    className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <PhoneOff className="w-4 h-4" /> Colgar Auricular
                  </button>
                </div>
              )}

              {phoneState === 'review' && audioUrl && (
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Escuchá tu saludo grabado</p>
                  <div className="flex items-center gap-4 w-full">
                    <button
                      onClick={togglePlayRecording}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white"
                    >
                      {isPlayingRecording ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                    </button>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-white">Mensaje para la cápsula</p>
                      <p className="text-[10px] text-zinc-500">Duración: {recordingSeconds}s</p>
                    </div>
                    <button onClick={resetAudioRecording} className="p-3 text-zinc-500 hover:text-red-400 transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video VHS Tab */}
          {activeTab === 'video' && (
Resolving Recorded Video Details...
                      <p className="text-xs font-bold text-white">Tu video-saludo ðŸŽ¥</p>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        DuraciÃ³n: {Math.round(videoDuration)} segundos
                      </p>
                    </div>

                    <button
                      onClick={resetVideoUpload}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Volver a grabar
                  </div>

                  <input type="file" accept="video/*" onChange={handleVideoChange} ref={videoInputRef} className="hidden" />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="px-4 py-2 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 hover:text-white"
                  >
                    Cargar desde galería
                  </button>
                </div>
              )}
Resolving Layout Choice / Recording...
              {videoMode === 'recording' && (
                // RECORDING CAMERA INTERFACE WITH VHS EFFECT
                <div className="flex flex-col items-center gap-5 text-center w-full">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    {videoCountdown !== null ? (
                      <>â³ Preparate...</>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse inline-block" />
                        Grabando saludo VHS en vivo
                      </>
                    )}
                  </p>

                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                    {/* Hidden video element to feed the canvas */}
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="hidden"
                    />

                    {/* Canvas displaying mirrored webcam image with VHS filters */}
                    <canvas 
                      ref={vhsCanvasRef} 
                      className="w-full h-full object-cover" 
                    />

                    {/* Glitch overlay scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[size:100%_4px,3px_100%]" />

                    {/* COUNTDOWN OVERLAY */}
                    {videoCountdown !== null && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 bg-purple-950/80 shadow-2xl">
                        <motion.div
                          key={videoCountdown}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1.2, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.8 }}
                          className="w-28 h-28 rounded-full border-4 border-purple-500 flex items-center justify-center z-10 bg-purple-950/80 shadow-2xl"
                        >
                          <span className="text-5xl font-black text-white">{videoCountdown}</span>
                        </motion.div>
                      </div>
                    )}

                    {/* RECORDING STATUS OVERLAYS */}
                    {videoCountdown === null && (
                      <>
                        {/* Flashing RED REC tag */}
                        <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg z-10">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          REC
                        </div>

                        {/* Remaining seconds indicator */}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black tracking-wider px-3 py-1 rounded-full shadow-lg tabular-nums z-10">
                          0:{videoSeconds.toString().padStart(2, '0')} / 0:15
                        </div>

                        {/* Bottom progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-purple-600 transition-all duration-1000 ease-linear"
                            style={{ width: \% }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 justify-center w-full">
                    {videoCountdown === null && (
                      <button
                        onClick={stopLiveVideoRecording}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition transform active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-white" /> Terminar
                      </button>
                    )}
                    <button
                      onClick={resetVideoUpload}
                      className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition transform active:scale-95"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              )}

              {videoMode === 'preview' && (
                // PREVIEW VIDEO INTERFACE
                <div className="w-full flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    PrevisualizaciÃ³n del video
                  </p>

                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                    <video 
                      src={videoUrl || undefined} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full px-2">
                    <div className="text-left font-bold">
                  </div>

                  {vhsRecorderRef.current?.state === 'recording' ? (
                    <button
                      onClick={stopLiveVideoRecording}
                      className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2"
                    >
                      <VideoOff className="w-4 h-4" /> Detener VHS ({videoDuration}s)
                    </button>
                  ) : (
                    <button
                      onClick={startLiveVideoRecording}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" /> Iniciar Grabación VHS
                    </button>
                  )}
                </div>
              )}

              {videoState === 'review' && videoUrl && (
                <div className="w-full flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Previsualización de tu Recuerdo VHS</p>
                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                    <video src={videoUrl} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between w-full px-2">
                    <div className="text-left">
Resolving Recorded Video Details...
                      <p className="text-xs font-bold text-white">Tu video-saludo ðŸŽ¥</p>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        DuraciÃ³n: {Math.round(videoDuration)} segundos
                      </p>
                    </div>

                    <button
                      onClick={resetVideoUpload}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Volver a grabar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUBMISSION FORM */}
          {((activeTab === 'audio' && audioUrl) || (activeTab === 'video' && videoUrl)) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pl-1">Tu Nombre y Apellido</label>
                <input
                  type="text"
                  placeholder="Ej: Laura Pérez"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none text-white transition"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-2 transform transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                style={{ 
                  background: `linear-gradient(135deg, ${customAccent}, #4f46e5)`,
                  boxShadow: `0 4px 20px ${customAccent}33` 
                }}
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando en cápsula...</> : <><Send className="w-4 h-4" /> Enviar Recuerdo</>}
              </button>
            </motion.div>
          )}

        </div>
      </main>

      <footer className="py-6 border-t border-white/5 bg-zinc-950/40 text-center">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Experiencia por AK Producciones</p>
      </footer>
      
      <KioskUnlockButton />
    </div>
  );
}
