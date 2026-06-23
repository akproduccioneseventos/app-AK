'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Video, Play, Pause, Trash2, Send, ArrowLeft, Loader2, CheckCircle2,
  Volume2, Sparkles, AlertCircle, RefreshCw, Upload, Phone, PhoneOff, Camera, VideoOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadBuzonMessage } from '@/app/actions/buzon';
import { getPublicEntertainmentEvent } from '@/app/actions/fiesta/entretenimiento.actions';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';

export default function GuestBuzonPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const fiestaId = params.fiestaId as string;

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
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

  const audioCtxRef = useRef<AudioContext | null>(null);

  const [audioOption, setAudioOption] = useState<'direct' | 'retro' | 'upload'>('direct');
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'Archivo Inválido',
        description: 'Por favor selecciona un archivo de audio.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'Audio demasiado grande',
        description: 'El audio no debe superar los 15MB.',
        variant: 'destructive',
      });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const audioElement = new Audio(tempUrl);

    audioElement.onloadedmetadata = () => {
      const duration = audioElement.duration;
      setRecordingSeconds(Math.round(duration));
      URL.revokeObjectURL(tempUrl);

      if (duration > 61) {
        toast({
          title: 'Duración excedida',
          description: 'El audio no debe durar más de 60 segundos.',
          variant: 'destructive',
        });
        setAudioBlob(null);
        setAudioUrl(null);
      } else {
        setAudioBlob(file);
        setAudioUrl(URL.createObjectURL(file));
        setPhoneState('review');
      }
    };
  };

  const startDirectAudioRecording = async () => {
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
        setPhoneState('review');

        audioStream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopDirectAudioRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPhoneState('hung_up');
      toast({
        title: 'Acceso Denegado',
        description: 'Por favor, permite el acceso al micrófono para grabar tu saludo.',
        variant: 'destructive',
      });
    }
  };

  const stopDirectAudioRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setPhoneState('review');
  };

  const playPhoneTone = (freq1: number, freq2: number, duration: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  // Load Fiesta Data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await getPublicEntertainmentEvent(fiestaId, 'capsulaTiempo');
        if (res.success && res.event) {
          setFiesta(res.event);
        }
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
    if (!fiesta?.welcomeAudioUrl) return;
    if (isWelcomePlaying) {
      welcomeAudioRef.current?.pause();
      setIsWelcomePlaying(false);
    } else {
      if (isPlayingRecording && previewAudioRef.current) {
        previewAudioRef.current.pause();
        setIsPlayingRecording(false);
      }
      if (!welcomeAudioRef.current) {
        welcomeAudioRef.current = new Audio(fiesta.welcomeAudioUrl);
        welcomeAudioRef.current.onended = () => setIsWelcomePlaying(false);
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
        title: 'Acceso Denegado',
        description: 'Por favor, permite el acceso al micrófono para grabar tu saludo.',
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
        title: 'Archivo Inválido',
        description: 'Por favor selecciona un archivo de video.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Video demasiado grande',
        description: 'El video no debe superar los 50MB.',
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
          title: 'Duración excedida',
          description: 'El video no debe durar más de 30 segundos.',
          variant: 'destructive',
        });
        setVideoFile(null);
        setVideoUrl(null);
      } else {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setVideoState('review');
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
  };

  // Submit Handler
  const handleSubmit = async () => {
    const trimmedName = authorName.trim();
    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor ingresa tu nombre.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('authorName', trimmedName);

    if (activeTab === 'audio' && audioBlob) {
      const audioFileName = audioBlob instanceof File ? audioBlob.name : 'saludo_voz.webm';
      formData.append('file', audioBlob, audioFileName);
      formData.append('mediaType', 'audio');
      formData.append('durationSeconds', recordingSeconds.toString());
    } else if (activeTab === 'video' && videoFile) {
      formData.append('file', videoFile, videoFile.name);
      formData.append('mediaType', 'video');
      formData.append('durationSeconds', Math.round(videoDuration).toString());
    } else {
      toast({
        title: 'Error de envío',
        description: 'Graba o selecciona un saludo antes de enviar.',
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
          title: '¡Mensaje guardado!',
          description: 'Tu saludo se ha guardado en el Buzón de Recuerdos.',
        });
        setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
      } else {
        toast({
          title: 'Error al subir',
          description: result.error || 'Ocurrió un error al subir.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error de Red',
        description: 'No se pudo conectar con el servidor.',
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
        <p className="text-sm text-zinc-400">Cargando Buzón de Recuerdos...</p>
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

  const hasWelcomeAudio = !!fiesta.welcomeAudioUrl;
  const customAccent = fiesta.station.accentColor || '#6366f1';

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
            Buzón de Recuerdos
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
            {fiesta.eventName || 'Fiesta'}
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
            <h2 className="text-3xl font-black">¡Mensaje al Buzón!</h2>
            <p className="text-zinc-400 text-sm max-w-xs mt-2">Tu recuerdo ha sido guardado exitosamente para el futuro.</p>
            <button onClick={() => setShowCelebration(false)} className="mt-6 px-6 py-3 rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/20 hover:bg-white/10 transition">
              Grabar otro recuerdo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-start gap-6">

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
            onClick={() => { resetVideoUpload(); resetAudioRecording(); setActiveTab('audio'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'audio' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-4 h-4" /> Audio
          </button>
          <button
            onClick={() => { resetAudioRecording(); resetVideoUpload(); setActiveTab('video'); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'video' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Video className="w-4 h-4" /> Video
          </button>
        </div>

        {/* TAB BODY */}
        <div className="flex-1 flex flex-col justify-between min-h-[340px]">

          {/* Voz Retro Tab */}
          {activeTab === 'audio' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
              {/* Option Selector for Audio */}
              {phoneState === 'hung_up' && (
                <div className="flex gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 w-full max-w-sm mb-4">
                  <button
                    onClick={() => setAudioOption('direct')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                      audioOption === 'direct' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    🎤 Grabar Directo
                  </button>
                  <button
                    onClick={() => setAudioOption('retro')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                      audioOption === 'retro' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    ☎️ Cabina Retro
                  </button>
                  <button
                    onClick={() => setAudioOption('upload')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                      audioOption === 'upload' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    📤 Subir Archivo
                  </button>
                </div>
              )}

              {/* RENDER CHOSEN AUDIO OPTION */}
              {phoneState === 'hung_up' && audioOption === 'direct' && (
                <div className="flex flex-col items-center text-center space-y-6 w-full">
                  <div className="w-48 h-48 border-2 border-indigo-500/20 rounded-full flex items-center justify-center bg-indigo-500/5 relative shadow-lg">
                    <Mic className="w-20 h-20 text-indigo-400" />
                    <div className="absolute inset-0 border border-indigo-400/30 rounded-full animate-ping opacity-25" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black">Grabar Saludo de Voz</h3>
                    <p className="text-xs text-zinc-400 max-w-xs">Presioná el botón de abajo para empezar a grabar tu mensaje directamente desde tu micrófono.</p>
                  </div>
                  <button
                    onClick={startDirectAudioRecording}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_4px_15px_rgba(99,102,241,0.4)]"
                  >
                    <Mic className="w-4 h-4" /> Iniciar Grabador
                  </button>
                </div>
              )}

              {phoneState === 'hung_up' && audioOption === 'retro' && (
                <div className="flex flex-col items-center text-center space-y-6 w-full">
                  {/* Antique Phone UI illustration */}
                  <div className="w-48 h-48 border-2 border-indigo-500/20 rounded-full flex items-center justify-center bg-indigo-500/5 relative">
                    <Phone className="w-20 h-20 text-indigo-400" />
                    {/* Rotary dial details */}
                    <div className="absolute inset-0 border-[6px] border-dashed border-indigo-400/30 rounded-full animate-[spin_40s_linear_infinite]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black">Cabina Telefónica Retro</h3>
                    <p className="text-xs text-zinc-400 max-w-xs">Descolgá el auricular del teléfono para escuchar el pitido e iniciar la grabación de voz.</p>
                  </div>
                  <button
                    onClick={handlePickUpHandset}
                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Descolgar Auricular
                  </button>
                </div>
              )}

              {phoneState === 'hung_up' && audioOption === 'upload' && (
                <div className="flex flex-col items-center text-center space-y-6 w-full">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileChange}
                    ref={audioInputRef}
                    className="hidden"
                  />
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="w-full p-8 rounded-3xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <Upload className="w-10 h-10 text-indigo-400" />
                    <div>
                      <p className="text-sm font-black text-white">Subir Archivo de Audio</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Soporta MP3, WAV, M4A o WEBM</p>
                    </div>
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
                  {/* Waveform animation */}
                  <div className="flex items-center justify-center gap-1.5 h-16 my-2">
                    <span className="w-1.5 h-6 bg-red-500 rounded-full animate-[pulse_1s_infinite_100ms]" style={{ height: '24px' }} />
                    <span className="w-1.5 h-12 bg-red-500 rounded-full animate-[pulse_1s_infinite_300ms]" style={{ height: '48px' }} />
                    <span className="w-1.5 h-16 bg-red-500 rounded-full animate-[pulse_1s_infinite_500ms]" style={{ height: '64px' }} />
                    <span className="w-1.5 h-10 bg-red-500 rounded-full animate-[pulse_1s_infinite_700ms]" style={{ height: '40px' }} />
                    <span className="w-1.5 h-4 bg-red-500 rounded-full animate-[pulse_1s_infinite_900ms]" style={{ height: '16px' }} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-black tracking-wider text-red-500 tabular-nums">
                      0:{recordingSeconds.toString().padStart(2, '0')}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Grabando tu saludo...</p>
                  </div>
                  <button
                    onClick={audioOption === 'direct' ? stopDirectAudioRecording : handleHangUpHandset}
                    className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    {audioOption === 'direct' ? <Mic className="w-4 h-4" /> : <PhoneOff className="w-4 h-4" />}
                    {audioOption === 'direct' ? 'Finalizar Grabación' : 'Colgar Auricular'}
                  </button>
                </div>
              )}

              {phoneState === 'review' && audioUrl && (
                <div className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-zinc-300">Escuchá tu saludo grabado</p>
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
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              {videoState === 'idle' && (
                <div className="flex flex-col items-center text-center space-y-6 w-full">
                  <button
                    onClick={startCamera}
                    className="w-full p-8 rounded-3xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <Camera className="w-10 h-10 text-indigo-400" />
                    <div>
                      <p className="text-sm font-black text-white">Grabar con Cámara VHS</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Efecto analógico retro</p>
                    </div>
                  </button>

                  <div className="w-full flex items-center justify-center gap-3">
                    <span className="h-px bg-white/10 flex-1" />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">O</span>
                    <span className="h-px bg-white/10 flex-1" />
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

              {videoState === 'recording' && (
                <div className="relative w-full flex flex-col items-center space-y-4">
                  {/* Invisible video tag to feed the canvas */}
                  <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                  {/* Canvas that records and shows VHS styles */}
                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-indigo-500/30 bg-black relative shadow-2xl">
                    <canvas ref={vhsCanvasRef} className="w-full h-full object-cover" />
                    {/* Scanning glich line styling */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[size:100%_4px,3px_100%]" />
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
                      <p className="text-xs font-bold text-white">Video Analógico</p>
                      <p className="text-[10px] text-zinc-500">Duración: {Math.round(videoDuration)} segundos</p>
                    </div>
                    <button onClick={resetVideoUpload} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold transition">
                      <RefreshCw className="w-3.5 h-3.5" /> Grabar de nuevo
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
