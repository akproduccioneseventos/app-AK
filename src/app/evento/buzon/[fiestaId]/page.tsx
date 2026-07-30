'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Video, Play, Pause, Trash2, Send, ArrowLeft, Loader2, CheckCircle2,
  Volume2, Sparkles, AlertCircle, RefreshCw, Upload, Phone, PhoneOff, Camera, VideoOff,
  ChevronRight, Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadBuzonMessage } from '@/app/actions/buzon';
import { getPublicEntertainmentEvent } from '@/app/actions/fiesta/entretenimiento.actions';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { VideoFrameOverlay } from '@/components/buzon/VideoFrameOverlay';
import { cn } from '@/lib/utils';

export default function GuestBuzonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fiestaId = params.fiestaId as string;
  const accessToken = searchParams.get('access') || undefined;

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'vhs_record' | 'vhs_upload' | 'audio_record' | 'audio_retro' | 'audio_upload' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSelectMode = (mode: typeof selectedMode) => {
    setSelectedMode(mode);
    if (mode && mode.startsWith('vhs')) {
      setActiveTab('video');
    } else if (mode && mode.startsWith('audio')) {
      setActiveTab('audio');
    }
  };

  const handleGoBack = () => {
    stopCamera();
    resetAudioRecording();
    resetVideoUpload();
    setSelectedMode(null);
  };

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
        const res = await getPublicEntertainmentEvent(fiestaId, 'capsulaTiempo', accessToken);
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
  }, [accessToken, fiestaId]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      stopCamera();
    };
  }, [audioUrl, videoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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

      if (duration > 16.5 || duration === Infinity) {
        toast({
          title: 'Duración excedida o desconocida',
          description: 'El video no debe durar más de 15 segundos.',
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
      const dateStr = date.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText(timeStr, 40, canvas.height - 60);
      ctx.fillText(dateStr, 40, canvas.height - 35);
      ctx.fillText('PLAY ▶', canvas.width - 110, 46);
      ctx.fillText('VHS SP', canvas.width - 110, canvas.height - 35);

      // Frame Border Overlay directly on Canvas
      const activeTemplate = fiesta?.buzonConfig?.videoFrameTemplate || 'default';
      const frameText = (fiesta?.buzonConfig?.customText || fiesta?.eventName || 'AK PRODUCCIONES').toUpperCase();

      if (activeTemplate !== 'default') {
        const borderWidth = 14;
        ctx.lineWidth = borderWidth;

        if (activeTemplate === 'neon') {
          ctx.strokeStyle = '#d946ef';
          ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.fillStyle = '#22d3ee';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`✨ ${frameText} ✨`, canvas.width / 2, canvas.height - 24);
          ctx.textAlign = 'left';
        } else if (activeTemplate === 'elegante') {
          ctx.strokeStyle = '#fde047';
          ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 14px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(`✦ ${frameText} ✦`, canvas.width / 2, canvas.height - 24);
          ctx.textAlign = 'left';
        } else if (activeTemplate === 'quince') {
          ctx.strokeStyle = '#f472b6';
          ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.fillStyle = '#fbcfe8';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`👑 ${frameText} 👑`, canvas.width / 2, canvas.height - 24);
          ctx.textAlign = 'left';
        } else if (activeTemplate === 'cumple-infantil') {
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`🎈 ${frameText} 🎂`, canvas.width / 2, canvas.height - 24);
          ctx.textAlign = 'left';
        } else if (activeTemplate === 'glamour') {
          ctx.strokeStyle = '#eab308';
          ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⭐ ${frameText} ⭐`, canvas.width / 2, canvas.height - 24);
          ctx.textAlign = 'left';
        } else if (activeTemplate === 'minimalista') {
          ctx.strokeStyle = '#ffffff';
          ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(frameText, canvas.width / 2, canvas.height - 24);
          ctx.textAlign = 'left';
        }
      }

      // Random tracking error line (VHSDistortion)
      if (Math.random() < 0.1) {
        const errorY = Math.floor(Math.random() * canvas.height);
        const errorH = Math.floor(Math.random() * 10) + 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(0, errorY, canvas.width, errorH);
      }

      requestAnimationFrame(render);
    };

    render();
  };

  const handleStartVideoWithCountdown = () => {
    setCountdown(3);
    const countInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(countInterval);
        setCountdown(null);
        startLiveVideoRecording();
        return null;
      });
    }, 1000);
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

  const handleReRecordVideo = () => {
    resetVideoUpload();
    startCamera();
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
    } catch (err) {
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#1e1b4b_0%,_#09090b_60%)] text-white flex flex-col justify-between">

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
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-start gap-6 z-10">

        {/* Welcome Card — only shown on landing */}
        {selectedMode === null && hasWelcomeAudio && (
          <div className="p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-4">
            <button
              onClick={toggleWelcomeAudio}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition transform hover:scale-105 shrink-0"
              style={{ backgroundColor: customAccent }}
            >
              {isWelcomePlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Mensaje Inicial
              </p>
              <h3 className="text-xs font-black text-white mt-0.5">Escuchá el saludo de los anfitriones</h3>
            </div>
          </div>
        )}

        {selectedMode === null ? (
          /* ── LANDING SELECTION MENU ── */
          <div className="flex flex-col gap-5">
            <div className="text-center space-y-2.5">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-none bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Cápsula de los Recuerdos
              </h2>
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">
                ¡Dejale tu saludo especial!
              </p>
              <p className="text-xs text-zinc-300/85 leading-relaxed max-w-[280px] mx-auto">
                Elegí el formato que prefieras para grabar o subir tu recuerdo y guardarlo para siempre.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {/* Opción 1: Grabar Video */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { handleSelectMode('vhs_record'); startCamera(); }}
                className="group relative w-full overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 to-rose-900/10 p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/10 to-rose-500/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                <div className="relative flex items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 shadow-inner ring-1 ring-rose-500/50 transition-transform group-hover:scale-110">
                    <Video className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-white uppercase tracking-widest">Grabar Video</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest bg-rose-500 text-white animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        REC
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-rose-200/70 font-medium">Dejá un recuerdo inolvidable en video (15s).</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-rose-500/50 transition-transform group-hover:translate-x-1 group-hover:text-rose-400" />
                </div>
              </motion.button>

              {/* Opción 2: Grabar Audio Directo */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectMode('audio_record')}
                className="group relative w-full overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-indigo-900/10 p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                <div className="relative flex items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 shadow-inner ring-1 ring-indigo-500/50 transition-transform group-hover:scale-110">
                    <Mic className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black text-white uppercase tracking-widest">Mensaje de Audio</p>
                    <p className="mt-1 text-xs text-indigo-200/70 font-medium">Dejá una nota de voz con tus mejores deseos (60s).</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-indigo-500/50 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
                </div>
              </motion.button>
            </div>
          </div>
        ) : (
          /* ── INTERACTIVE SCREEN ── */
          <div className="flex-1 flex flex-col justify-between min-h-[380px] w-full">
            <div className="flex-1 flex flex-col items-center justify-start gap-6 w-full">

              {/* Volver button */}
              <button
                onClick={handleGoBack}
                className="self-start flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-300 hover:text-white transition py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al menú
              </button>

              {/* Title Header for Active Mode */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  {selectedMode === 'vhs_record' && 'Grabar Video VHS'}
                  {selectedMode === 'vhs_upload' && 'Subir Video'}
                  {selectedMode === 'audio_record' && 'Grabar Audio Directo'}
                  {selectedMode === 'audio_retro' && 'Cabina Telefónica'}
                  {selectedMode === 'audio_upload' && 'Subir Archivo de Audio'}
                </h3>
                <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                  {selectedMode === 'vhs_record' && 'Graba con tu cámara frontal'}
                  {selectedMode === 'vhs_upload' && 'Selecciona un video de tu galería'}
                  {selectedMode === 'audio_record' && 'Graba un saludo de voz directo'}
                  {selectedMode === 'audio_retro' && 'Auricular descolgado'}
                  {selectedMode === 'audio_upload' && 'Selecciona un archivo de audio'}
                </p>
              </div>

              {/* 🔴 MODE: VHS RECORD 🔴 */}
              {selectedMode === 'vhs_record' && (
                <div className="w-full">
                  {videoState === 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-6 w-full">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-4 bg-rose-500/20 rounded-full animate-pulse" />
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.5)] border border-rose-400/50">
                          <Camera className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-rose-100 uppercase tracking-widest">Preparado para video</p>
                        <p className="text-xs text-rose-200/70 max-w-[240px] leading-relaxed mx-auto">Acomodate y prepará tu mejor sonrisa.</p>
                      </div>
                      <button
                        onClick={startCamera}
                        className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(244,63,94,0.5)] active:scale-95"
                      >
                        <Camera className="w-5 h-5" /> Activar Cámara
                      </button>
                    </motion.div>
                  )}

                  {videoState === 'recording' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full flex flex-col items-center space-y-4">
                      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                      {/* Video y Overlays */}
                      <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-rose-500/30 bg-black relative shadow-2xl">
                        <canvas ref={vhsCanvasRef} className="w-full h-full object-cover" />

                        {/* Overlay VHS Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[size:100%_4px,3px_100%]" />

                        {/* Marco de Video Personalizado */}
                        <VideoFrameOverlay
                          template={fiesta?.buzonConfig?.videoFrameTemplate}
                          customText={fiesta?.buzonConfig?.customText}
                          eventName={fiesta?.eventName}
                        />

                        {/* Cuenta regresiva Overlay */}
                        {countdown !== null && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <motion.span
                              key={countdown}
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1.5, opacity: 1 }}
                              exit={{ scale: 2, opacity: 0 }}
                              className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                            >
                              {countdown}
                            </motion.span>
                          </div>
                        )}

                        {/* Tiempo de Grabación */}
                        {vhsRecorderRef.current?.state === 'recording' && (
                          <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/20">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-white text-xs font-bold font-mono">{videoDuration}s / 15s</span>
                          </div>
                        )}
                      </div>

                      {/* Botones de control */}
                      {vhsRecorderRef.current?.state === 'recording' ? (
                        <button
                          onClick={stopLiveVideoRecording}
                          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-transform active:scale-95"
                        >
                          <VideoOff className="w-5 h-5" /> Detener Grabación
                        </button>
                      ) : (
                        <button
                          onClick={handleStartVideoWithCountdown}
                          disabled={countdown !== null}
                          className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-transform active:scale-95 disabled:opacity-50"
                        >
                          <Video className="w-5 h-5" /> {countdown !== null ? 'Preparando...' : 'Comenzar a Grabar'}
                        </button>
                      )}
                    </motion.div>
                  )}

                  {videoState === 'review' && videoUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-4 text-center">
                      <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                        <VideoFrameOverlay
                          template={fiesta?.buzonConfig?.videoFrameTemplate}
                          customText={fiesta?.buzonConfig?.customText}
                          eventName={fiesta?.eventName}
                        />
                      </div>
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="text-left">
                          <p className="text-xs font-black text-white uppercase tracking-wider">Video Analógico</p>
                          <p className="text-[10px] text-zinc-300 font-bold mt-0.5">Duración: {Math.round(videoDuration)} segundos</p>
                        </div>
                        <button onClick={handleReRecordVideo} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-wider transition">
                          <RefreshCw className="w-3.5 h-3.5" /> Grabar de nuevo
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

                {/* 🎤 MODE: AUDIO RECORD */}
              {selectedMode === 'audio_record' && (
                <div className="w-full flex flex-col items-center justify-center">
                  {phoneState === 'hung_up' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-6 w-full">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-4 bg-indigo-500/20 rounded-full animate-pulse" />
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-indigo-400/50">
                          <Mic className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Preparado para grabar</p>
                        <p className="text-xs text-indigo-200/70 max-w-[240px] leading-relaxed mx-auto">Presioná el botón de abajo cuando estés listo para dejar tu mensaje de voz (Max 60s).</p>
                      </div>
                      <button
                        onClick={startDirectAudioRecording}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-95"
                      >
                        <Mic className="w-5 h-5" /> Comenzar a Grabar
                      </button>
                    </motion.div>
                  )}

                  {phoneState === 'recording' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center space-y-8 w-full py-4">
                      {/* Animación de ondas de audio */}
                      <div className="flex items-end justify-center gap-1.5 h-20">
                        {[40, 70, 45, 90, 50, 100, 65, 80, 55, 30].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [`${h/3}%`, `${h}%`, `${h/3}%`] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                            className="w-2 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                          />
                        ))}
                      </div>

                      <div className="space-y-2">
                        <p className="text-5xl font-black tracking-wider text-white tabular-nums drop-shadow-lg">
                          0:{recordingSeconds.toString().padStart(2, '0')}
                        </p>
                        <p className="text-[11px] text-indigo-300 font-bold uppercase tracking-widest animate-pulse">Grabando tu saludo...</p>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full h-1.5 bg-indigo-950/50 rounded-full overflow-hidden border border-indigo-500/20">
                        <motion.div
                          className="h-full bg-gradient-to-r from-indigo-500 to-rose-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(recordingSeconds / 60) * 100}%` }}
                        />
                      </div>

                      <button
                        onClick={stopDirectAudioRecording}
                        className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-3xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(244,63,94,0.4)] active:scale-95"
                      >
                        <Square className="w-5 h-5 fill-white" /> Finalizar Grabación
                      </button>
                    </motion.div>
                  )}

                  {phoneState === 'review' && audioUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full p-6 bg-gradient-to-br from-indigo-900/40 to-indigo-950/40 border border-indigo-500/30 rounded-3xl flex flex-col items-center gap-5 text-center shadow-2xl backdrop-blur-md">
                      <p className="text-[10px] text-indigo-200 font-black uppercase tracking-widest bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20">Revisá tu saludo</p>

                      <div className="flex items-center gap-4 w-full">
                        <button
                          onClick={togglePlayRecording}
                          className="w-14 h-14 rounded-full flex items-center justify-center bg-indigo-500 text-white shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-transform hover:scale-105 active:scale-95"
                        >
                          {isPlayingRecording ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                        </button>

                        <div className="flex-1 text-left">
                          <p className="text-sm font-black text-white uppercase tracking-wide">Mensaje de voz</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-full h-1 bg-indigo-950 rounded-full overflow-hidden">
                              <motion.div className="h-full bg-indigo-400" initial={{ width: "100%" }} />
                            </div>
                            <p className="text-[10px] text-indigo-300 font-bold tabular-nums shrink-0">{recordingSeconds}s</p>
                          </div>
                        </div>

                        <button onClick={resetAudioRecording} className="p-3 text-rose-400 hover:text-rose-300 transition hover:bg-rose-950/30 rounded-full border border-transparent hover:border-rose-500/30">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── MODE: VHS UPLOAD ── */}
              {selectedMode === 'vhs_upload' && (
                <div className="w-full">
                  <input type="file" accept="video/*" onChange={handleVideoChange} ref={videoInputRef} className="hidden" />
                  {videoState !== 'review' ? (
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full p-8 rounded-3xl border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex flex-col items-center justify-center gap-3.5"
                    >
                      <Upload className="w-8 h-8 text-indigo-400" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-wider">Seleccionar Video</p>
                        <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest">Máximo 15 segundos de duración</p>
                      </div>
                    </button>
                  ) : (
                    videoUrl && (
                      <div className="w-full flex flex-col items-center gap-4 text-center">
                        <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 relative shadow-2xl">
                          <video src={videoUrl} controls className="w-full h-full object-contain" />
                        </div>
                        <div className="flex items-center justify-between w-full px-2">
                          <div className="text-left">
                            <p className="text-xs font-black text-white uppercase tracking-wider">Video Cargado</p>
                            <p className="text-[10px] text-zinc-300 font-bold mt-0.5">Duración: {Math.round(videoDuration)} segundos</p>
                          </div>
                          <button onClick={resetVideoUpload} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-wider transition">
                            <RefreshCw className="w-3.5 h-3.5" /> Seleccionar otro
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ── MODE: AUDIO UPLOAD ── */}
              {selectedMode === 'audio_upload' && (
                <div className="w-full">
                  <input type="file" accept="audio/*" onChange={handleAudioFileChange} ref={audioInputRef} className="hidden" />
                  {phoneState === 'hung_up' ? (
                    <button
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full p-8 rounded-3xl border-2 border-dashed border-zinc-700 bg-zinc-900/10 hover:bg-zinc-900/20 hover:border-zinc-700 transition-all flex flex-col items-center justify-center gap-3.5"
                    >
                      <Upload className="w-8 h-8 text-zinc-400" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-wider">Subir Archivo de Audio</p>
                        <p className="text-[9px] text-zinc-300 font-bold uppercase tracking-widest">Formatos soportados: MP3, WAV, M4A o WEBM</p>
                      </div>
                    </button>
                  ) : (
                    audioUrl && (
                      <div className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-4 text-center">
                        <p className="text-[10px] text-zinc-200 font-bold uppercase tracking-widest">Escuchá el audio cargado</p>
                        <div className="flex items-center gap-4 w-full">
                          <button
                            onClick={togglePlayRecording}
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition text-white shrink-0"
                          >
                            {isPlayingRecording ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                          </button>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-white uppercase tracking-wide">Audio cargado</p>
                            <p className="text-[10px] text-zinc-300 font-bold mt-0.5">Duración: {recordingSeconds}s</p>
                          </div>
                          <button onClick={resetAudioRecording} className="p-3 text-zinc-500 hover:text-red-400 transition">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            </div>

            {/* SUBMISSION FORM (Only shown when recording exists) */}
            {((activeTab === 'audio' && audioUrl && phoneState === 'review') || (activeTab === 'video' && videoUrl && videoState === 'review')) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-200 font-black uppercase tracking-wider pl-1">Tu Nombre y Apellido</label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Pérez"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={30}
                    className="w-full bg-zinc-900/80 border border-white/20 focus:border-indigo-500 focus:bg-zinc-800/80 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none text-white transition"
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
        )}
      </main>

      <footer className="py-6 border-t border-white/5 bg-zinc-950/40 text-center">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Experiencia por AK Producciones</p>
      </footer>

      <KioskUnlockButton />
    </div>
  );
}
