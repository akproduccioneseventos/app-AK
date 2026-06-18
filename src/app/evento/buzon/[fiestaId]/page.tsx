'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Video, Play, Pause, Square, Trash2, Send, ArrowLeft, Loader2, CheckCircle2, 
  Volume2, Sparkles, AlertCircle, RefreshCw, Upload, Camera, X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { uploadBuzonMessage } from '@/app/actions/buzon';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

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

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Video Recording State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Video Recording & Camera States
  const [videoMode, setVideoMode] = useState<'choice' | 'recording' | 'preview'>('choice');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(null);
  const [videoCountdown, setVideoCountdown] = useState<number | null>(null);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoSecondsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Open camera and start countdown
  const startCamera = async () => {
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(0);
    setVideoSeconds(0);
    setVideoCountdown(3);
    setVideoMode('recording');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
      setVideoStream(stream);

      // Bind stream to video element
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(console.error);
        }
      }, 150);

      // Start 3, 2, 1 Countdown
      let count = 3;
      const cInterval = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(cInterval);
          setVideoCountdown(null);
          startRecordingVideo(stream);
        } else {
          setVideoCountdown(count);
        }
      }, 1000);

    } catch (err) {
      console.error('Error starting video camera:', err);
      setVideoMode('choice');
      toast({
        title: '¡Permiso denegado! 📸',
        description: 'Che, por favor permití el acceso a la cámara y micrófono en tu navegador para poder grabarte.',
        variant: 'destructive',
      });
    }
  };

  // Start actual MediaRecorder
  const startRecordingVideo = (stream: MediaStream) => {
    const chunks: Blob[] = [];
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = '';
    }

    const options = mimeType ? { mimeType } : undefined;
    const recorder = new MediaRecorder(stream, options);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setVideoFile(new File([blob], 'saludo_video.mp4', { type: mimeType || 'video/mp4' }));
      setVideoUrl(url);
      setVideoMode('preview');
    };

    setVideoRecorder(recorder);
    recorder.start();

    // 15 seconds timer limit
    let sec = 0;
    videoSecondsIntervalRef.current = setInterval(() => {
      sec += 1;
      setVideoSeconds(sec);
      setVideoDuration(sec);
      if (sec >= 15) {
        stopRecordingVideo(recorder);
      }
    }, 1000);
  };

  const stopRecordingVideo = (recorderInstance?: MediaRecorder | null) => {
    if (videoSecondsIntervalRef.current) {
      clearInterval(videoSecondsIntervalRef.current);
      videoSecondsIntervalRef.current = null;
    }

    const rec = recorderInstance || videoRecorder;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }

    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setVideoRecorder(null);
  };

  const cancelVideoRecording = () => {
    if (videoSecondsIntervalRef.current) {
      clearInterval(videoSecondsIntervalRef.current);
      videoSecondsIntervalRef.current = null;
    }
    if (videoRecorder && videoRecorder.state !== 'inactive') {
      videoRecorder.stop();
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setVideoRecorder(null);
    setVideoMode('choice');
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

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
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
      // Pause preview recording playing if any
      if (isPlayingRecording && previewAudioRef.current) {
        previewAudioRef.current.pause();
        setIsPlayingRecording(false);
      }
      welcomeAudioRef.current.play();
      setIsWelcomePlaying(true);
    }
  };

  // Start Audio Recording
  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Let browser choose default
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      // Start countdown (max 60s)
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        title: '¡Micrófono apagado! 🎙️',
        description: 'Che, por favor permití el acceso al micrófono para poder grabarte el audio.',
        variant: 'destructive',
      });
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };

  // Play Recorded Audio Preview
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
      // Pause welcome audio if playing
      if (isWelcomePlaying && welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        setIsWelcomePlaying(false);
      }
      previewAudioRef.current.play();
      setIsPlayingRecording(true);
    }
  };

  // Reset Audio State
  const resetAudioRecording = () => {
    if (isPlayingRecording && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingRecording(false);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    previewAudioRef.current = null;
  };

  // File Input Change (Video)
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

    if (file.size > 40 * 1024 * 1024) {
      toast({
        title: '¡Pesa demasiado! ⚖️',
        description: 'El video no puede superar los 40MB. ¡Buscate uno más liviano!',
        variant: 'destructive',
      });
      return;
    }

    // Load video to read metadata (duration)
    const tempUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.src = tempUrl;
    videoElement.preload = 'metadata';

    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration;
      setVideoDuration(duration);
      URL.revokeObjectURL(tempUrl);

      if (duration > 16) {
        toast({
          title: '¡Video muy largo! ⏳',
          description: 'El video tiene que ser de 15 segundos como máximo, bo. Recortalo o grabá uno nuevo.',
          variant: 'destructive',
        });
        setVideoFile(null);
        setVideoUrl(null);
      } else {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setVideoMode('preview');
      }
    };
  };

  // Reset Video State
  const resetVideoUpload = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(0);
    if (videoInputRef.current) videoInputRef.current.value = '';
    setVideoMode('choice');
  };

  // Submit Handler
  const handleSubmit = async () => {
    const trimmedName = authorName.trim();
    if (!trimmedName) {
      toast({
        title: '¿Quién sos? 🤔',
        description: 'Che, poné tu nombre y apellido para que sepan de quién es el saludo. ✍️',
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
          title: '¡Mensaje guardado! 🎉',
          description: '¡Buenísimo! Tu saludo ya está a salvo en el buzón de los anfitriones. 💌',
        });
        setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
      } else {
        toast({
          title: 'Falló la subida 😢',
          description: result.error || 'Hubo un problema al subir tu saludo. Probá de nuevo.',
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
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        <p className="text-sm text-zinc-400">Cargando buzón de recuerdos...</p>
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Evento no encontrado</h1>
        <p className="text-zinc-500 text-sm mt-2">No pudimos cargar la configuración del buzón.</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-zinc-800 rounded-xl text-xs font-bold">
          Volver
        </button>
      </div>
    );
  }

  const hasWelcomeAudio = !!fiesta.buzonConfig?.welcomeAudioUrl;
  const customAccent = fiesta.guestPortalSettings?.customAccentColor || '#9333ea';

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-purple-500/30">
      
      {/* HEADER */}
      <header className="px-4 py-5 flex items-center justify-between border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 pr-6">
          <h1 className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            Buzón de Recuerdos
          </h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
            {fiesta.configuracion?.nombreEvento || 'Fiesta'}
          </p>
        </div>
      </header>

      {/* CELEBRATION OVERLAY */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="space-y-4 max-w-sm"
            >
              <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-2 border border-emerald-500/20">
                <CheckCircle2 className="w-16 h-16 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black">¡Muchas Gracias!</h2>
              <p className="text-zinc-400 text-sm">
                Tu saludo de recuerdos ha sido guardado con éxito. Quedará grabado para siempre en la memoria de los anfitriones.
              </p>
              <button 
                onClick={() => setShowCelebration(false)} 
                className="mt-6 px-6 py-3 rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/20 hover:bg-white/10 transition"
              >
                Grabar otro saludo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-start gap-6">
        
        {/* PREMIUM BANNER WITH FADE */}
        <div className="relative w-full h-44 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          <img 
            src="/media/mailbox_banner.png" 
            alt="Buzón de Recuerdos" 
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white bg-purple-600/90 border border-purple-400/30 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm animate-pulse">
              📸 ¡Dejá tu video o audio de regalo! 🎁
            </span>
          </div>
        </div>

        {/* WELCOME AUDIO CARD */}
        {hasWelcomeAudio && (
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <button
                onClick={toggleWelcomeAudio}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105"
                style={{ backgroundColor: customAccent }}
              >
                {isWelcomePlaying ? (
                  <Pause className="w-6 h-6 text-white fill-white" />
                ) : (
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                )}
              </button>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  Mensaje de Bienvenida
                </p>
                <h3 className="text-sm font-black text-white mt-0.5">
                  Escuchá el saludo de los novios/quinceañera
                </h3>
              </div>
            </div>
            
            {/* Visualizer effect when playing */}
            {isWelcomePlaying && (
              <div className="flex items-center justify-center gap-1 mt-4 h-6 px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                  <span 
                    key={i} 
                    className="w-1 bg-purple-500 rounded-full animate-pulse"
                    style={{ 
                      height: `${Math.floor(Math.random() * 80) + 20}%`, 
                      animationDelay: `${i * 0.1}s`,
                      backgroundColor: customAccent 
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              cancelVideoRecording();
              setActiveTab('audio');
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'audio' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            Audio de Voz
          </button>
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              setActiveTab('video');
            }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              activeTab === 'video' ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Video className="w-4 h-4" />
            Video Mensaje
          </button>
        </div>

        {/* CONTENIDO TABS */}
        <div className="flex-1 flex flex-col justify-between min-h-[300px]">
          
          {/* TAB AUDIO */}
          {activeTab === 'audio' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              
              {!audioUrl ? (
                // RECORDING INTERFACE
                <div className="flex flex-col items-center gap-6 text-center">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    {isRecording ? 'Grabando tu mensaje...' : 'Pulsá el micrófono para comenzar'}
                  </p>

                  <div className="relative">
                    {isRecording && (
                      <span 
                        className="absolute inset-0 rounded-full animate-ping opacity-25"
                        style={{ backgroundColor: customAccent }}
                      />
                    )}
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl relative z-10 transition transform active:scale-95"
                      style={{ 
                        background: isRecording 
                          ? 'linear-gradient(135deg, #ef4444, #b91c1c)' 
                          : `linear-gradient(135deg, ${customAccent}, #4f46e5)` 
                      }}
                    >
                      {isRecording ? (
                        <Square className="w-8 h-8 text-white fill-white" />
                      ) : (
                        <Mic className="w-8 h-8 text-white" />
                      )}
                    </button>
                  </div>

                  {isRecording ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-black tracking-widest tabular-nums">
                        0:{recordingSeconds.toString().padStart(2, '0')}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        Límite máximo de 1 minuto
                      </p>
                      {/* Animated wave */}
                      <div className="flex items-center justify-center gap-1.5 mt-4 h-8">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                          <span 
                            key={i} 
                            className="w-1.5 h-6 rounded-full"
                            style={{ 
                              backgroundColor: customAccent,
                              animation: 'voiceWave 1.2s ease-in-out infinite',
                              animationDelay: `${i * 0.15}s`
                            }}
                          />
                        ))}
                      </div>
                      <style jsx global>{`
                        @keyframes voiceWave {
                          0%, 100% { height: 10px; }
                          50% { height: 32px; }
                        }
                      `}</style>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 font-medium">
                      El audio se guardará directamente y de forma privada en el servidor.
                    </p>
                  )}
                </div>
              ) : (
                // PREVIEW INTERFACE
                <div className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Escuchá tu mensaje antes de enviar
                  </p>

                  <div className="flex items-center justify-center gap-4 w-full">
                    <button
                      onClick={togglePlayRecording}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-white"
                    >
                      {isPlayingRecording ? (
                        <Pause className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex flex-col items-start text-left">
                      <p className="text-xs font-bold text-white">Grabación de Voz</p>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        Duración: {recordingSeconds}s
                      </p>
                    </div>

                    <button
                      onClick={resetAudioRecording}
                      className="p-3 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB VIDEO */}
          {activeTab === 'video' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full">
              
              {videoMode === 'choice' && (
                // CHOICE INTERFACE
                <div className="flex flex-col items-center gap-6 text-center w-full">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    Seleccioná cómo querés dejar tu saludo
                  </p>

                  <div className="grid grid-cols-1 gap-4 w-full">
                    {/* Opción 1: Grabar en vivo */}
                    <button
                      onClick={startCamera}
                      className="w-full p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all flex items-center gap-4 text-left group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white">Grabar con mi cámara 📸</h4>
                        <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                          Grabá directamente desde la app en el momento.
                        </p>
                      </div>
                    </button>

                    {/* Opción 2: Subir archivo */}
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={handleVideoChange}
                      ref={videoInputRef}
                      className="hidden"
                    />
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full p-6 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all flex items-center gap-4 text-left group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white">Subir un video de mi galería 📂</h4>
                        <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                          Elegí un video que ya tengas guardado en tu celu.
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Restricciones */}
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-left flex items-start gap-3 w-full">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">⚠️ Límite de Tiempo</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        El saludo en video debe durar **15 segundos como máximo** para que todos puedan subir el suyo y no sature el servidor. ¡Hacelo cortito y con amor! ❤️
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {videoMode === 'recording' && (
                // RECORDING CAMERA INTERFACE
                <div className="flex flex-col items-center gap-5 text-center w-full">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    {videoCountdown !== null ? (
                      <>⏳ Preparate...</>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse inline-block" />
                        Grabando saludo en vivo
                      </>
                    )}
                  </p>

                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                    <video 
                      ref={liveVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* COUNTDOWN OVERLAY */}
                    {videoCountdown !== null && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                        <motion.div
                          key={videoCountdown}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1.2, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.8 }}
                          className="w-28 h-28 rounded-full border-4 border-purple-500 flex items-center justify-center bg-purple-950/80 shadow-2xl"
                        >
                          <span className="text-5xl font-black text-white">{videoCountdown}</span>
                        </motion.div>
                      </div>
                    )}

                    {/* RECORDING STATUS OVERLAYS */}
                    {videoCountdown === null && (
                      <>
                        {/* Flashing RED REC tag */}
                        <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          REC
                        </div>

                        {/* Remaining seconds indicator */}
                        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black tracking-wider px-3 py-1 rounded-full shadow-lg tabular-nums">
                          0:{videoSeconds.toString().padStart(2, '0')} / 0:15
                        </div>

                        {/* Bottom progress bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-purple-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(videoSeconds / 15) * 100}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 justify-center w-full">
                    {videoCountdown === null && (
                      <button
                        onClick={() => stopRecordingVideo(videoRecorder)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition transform active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-white" /> Terminar
                      </button>
                    )}
                    <button
                      onClick={cancelVideoRecording}
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
                    Previsualización del video
                  </p>

                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                    <video 
                      src={videoUrl || undefined} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between w-full px-2">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Tu video-saludo 🎥</p>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        Duración: {Math.round(videoDuration)} segundos
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

          {/* FORMULARIO DE ENVÍO */}
          {((activeTab === 'audio' && audioUrl) || (activeTab === 'video' && videoUrl)) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest pl-1">
                  Tu Nombre y Apellido
                </label>
                <input
                  type="text"
                  placeholder="Ej: Laura Pérez"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={30}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none text-white placeholder:text-zinc-600 transition"
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Subiendo al buzón...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Enviar Saludo
                  </>
                )}
              </button>
            </motion.div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-white/5 bg-zinc-950 text-center">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          Experiencia por AK Producciones
        </p>
      </footer>
    </div>
  );
}
