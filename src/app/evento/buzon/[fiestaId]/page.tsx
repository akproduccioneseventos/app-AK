'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Video, Play, Pause, Square, Trash2, Send, ArrowLeft, Loader2, CheckCircle2, 
  Volume2, Sparkles, AlertCircle, RefreshCw, Upload
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
        title: 'Acceso Denegado',
        description: 'Por favor, permite el acceso al micrófono para grabar tu saludo.',
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
        title: 'Archivo Inválido',
        description: 'Por favor selecciona un archivo de video.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 40 * 1024 * 1024) {
      toast({
        title: 'Video demasiado grande',
        description: 'El video no debe superar los 40MB.',
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
          title: 'Duración excedida',
          description: 'El video no debe durar más de 15 segundos para no saturar el servidor.',
          variant: 'destructive',
        });
        setVideoFile(null);
        setVideoUrl(null);
      } else {
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
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
  };

  // Submit Handler
  const handleSubmit = async () => {
    const trimmedName = authorName.trim();
    if (!trimmedName) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor ingresa tu nombre para que los anfitriones sepan quién grabó el saludo.',
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
          description: 'Tu saludo se ha guardado en el buzón de los anfitriones.',
        });
        setTimeout(() => {
          setShowCelebration(false);
        }, 5000);
      } else {
        toast({
          title: 'Error al subir',
          description: result.error || 'Ocurrió un error al procesar la subida.',
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
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              
              {!videoUrl ? (
                // UPLOAD VIDEO INTERFACE
                <div className="flex flex-col items-center gap-6 text-center w-full">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">
                    Seleccioná o grabá un video corto
                  </p>

                  <input 
                    type="file" 
                    accept="video/*" 
                    capture="user" 
                    onChange={handleVideoChange}
                    ref={videoInputRef}
                    className="hidden"
                  />

                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full p-8 rounded-3xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-purple-400 border border-white/10 transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Grabar/Subir Video</p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                        Cámara frontal o galería
                      </p>
                    </div>
                  </button>

                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-left flex items-start gap-3 w-full">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Restricciones</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                        Para asegurar una subida rápida, el video tiene un límite de **15 segundos** y máximo **40MB**.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // PREVIEW VIDEO INTERFACE
                <div className="w-full flex flex-col items-center gap-4 text-center">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                    Previsualización del video
                  </p>

                  <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between w-full px-2">
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">Archivo de Video</p>
                      <p className="text-[10px] text-zinc-500 font-bold">
                        Duración: {Math.round(videoDuration)} segundos
                      </p>
                    </div>

                    <button
                      onClick={resetVideoUpload}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Cambiar video
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
