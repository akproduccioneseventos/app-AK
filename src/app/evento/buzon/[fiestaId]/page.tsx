'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Video, Play, Pause, Trash2, Send, ArrowLeft, Loader2, CheckCircle2,
  Volume2, VolumeX, Sparkles, AlertCircle, RefreshCw, Upload, Phone, PhoneOff, Camera, VideoOff,
  ChevronRight, Square, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadBuzonMessage } from '@/app/actions/buzon';
import { getPublicEntertainmentEvent } from '@/app/actions/fiesta/entretenimiento.actions';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { VideoFrameOverlay } from '@/components/buzon/VideoFrameOverlay';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { drawBuzonVideoFrame } from '@/lib/buzon/video-frame-canvas';
import { renderUploadedVideoWithFrame } from '@/lib/buzon/video-frame-processor';
import { normalizeFrameTemplateId } from '@/lib/buzon/video-frame-templates';

export default function GuestBuzonPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fiestaId = params.fiestaId as string;
  const accessToken = searchParams.get('access') || undefined;

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      const voices = window.speechSynthesis.getVoices();
      const esVoice = voices.find((v) => v.lang.startsWith('es'));
      if (esVoice) utterance.voice = esVoice;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignorar fallos de síntesis
    }
  };
  /**
   * Por que se guarda el motivo: cuando la estacion no esta habilitada, o el
   * enlace no trae el permiso del equipo, la pantalla mostraba "Evento no
   * encontrado". Al invitado le hacia pensar que la fiesta no existe y al
   * equipo, que la app esta rota. Ahora dice lo que realmente pasa.
   */
  const [motivoSinBuzon, setMotivoSinBuzon] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'photo'>('audio');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [isTimeCapsule, setIsTimeCapsule] = useState(false);
  const [unlockYears, setUnlockYears] = useState<number>(10);
  const [recipientNote, setRecipientNote] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedMode, setSelectedMode] = useState<
    'photo_record' | 'photo_upload' | 'vhs_record' | 'vhs_upload' | 'audio_record' | 'audio_retro' | 'audio_upload' | null
  >(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleSelectMode = (mode: typeof selectedMode) => {
    setSelectedMode(mode);
    if (mode && mode.startsWith('photo')) {
      setActiveTab('photo');
    } else if (mode && mode.startsWith('vhs')) {
      setActiveTab('video');
    } else if (mode && mode.startsWith('audio')) {
      setActiveTab('audio');
    }
  };

  const releaseActiveMedia = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (videoRenderFrameRef.current !== null) {
      cancelAnimationFrame(videoRenderFrameRef.current);
      videoRenderFrameRef.current = null;
    }

    const audioRecorder = mediaRecorderRef.current;
    if (audioRecorder) {
      audioRecorder.ondataavailable = null;
      audioRecorder.onstop = null;
      if (audioRecorder.state !== 'inactive') audioRecorder.stop();
      audioRecorder.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    const videoRecorder = vhsRecorderRef.current;
    if (videoRecorder) {
      videoRecorder.ondataavailable = null;
      videoRecorder.onstop = null;
      if (videoRecorder.state !== 'inactive') videoRecorder.stop();
      videoRecorder.stream.getTracks().forEach((track) => track.stop());
      vhsRecorderRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const handleGoBack = () => {
    releaseActiveMedia();
    setIsRecording(false);
    setStream(null);
    resetAudioRecording();
    resetVideoUpload();
    resetPhotoUpload();
    setSelectedMode(null);
  };

  // Welcome Audio State
  const [isWelcomePlaying, setIsWelcomePlaying] = useState(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Photo State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<'idle' | 'capturing' | 'review'>('idle');
  const photoInputRef = useRef<HTMLInputElement | null>(null);

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
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const vhsCanvasRef = useRef<HTMLCanvasElement>(null);
  const vhsRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRenderFrameRef = useRef<number | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoProcessingProgress, setVideoProcessingProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

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
        if (
          res.success
          && res.event
          && res.event.showBuzon
          && res.event.buzonConfig?.enabled !== false
        ) {
          setFiesta(res.event);
        } else if (!res.success) {
          setMotivoSinBuzon(res.error || 'No se pudo abrir el buzón.');
        } else {
          setMotivoSinBuzon('El buzón de recuerdos no está activado para esta fiesta.');
        }
      } catch (err) {
        console.error(err);
        setMotivoSinBuzon('No se pudo abrir el buzón. Probá de nuevo en un momento.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [accessToken, fiestaId]);

  useEffect(() => () => {
    releaseActiveMedia();
    welcomeAudioRef.current?.pause();
    previewAudioRef.current?.pause();
    void audioCtxRef.current?.close().catch(() => undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

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

    if (file.size > 40 * 1024 * 1024) {
      toast({
        title: 'Video demasiado grande',
        description: 'El video no debe superar los 40MB.',
        variant: 'destructive',
      });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.src = tempUrl;
    videoElement.preload = 'metadata';

    videoElement.onloadedmetadata = async () => {
      const duration = videoElement.duration;
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
        setVideoState('processing');
        setVideoProcessingProgress(0);
        try {
          const processed = await renderUploadedVideoWithFrame({
            file,
            template: fiesta?.buzonConfig?.videoFrameTemplate,
            displayText: fiesta?.buzonConfig?.customText || fiesta?.eventName || 'AK PRODUCCIONES',
            onProgress: setVideoProcessingProgress,
          });
          if (videoUrl) URL.revokeObjectURL(videoUrl);
          setVideoFile(processed.file);
          setVideoUrl(processed.url);
          setVideoDuration(processed.durationSeconds);
          setVideoState('review');
        } catch (error) {
          setVideoFile(null);
          setVideoUrl(null);
          setVideoState('idle');
          if (videoInputRef.current) videoInputRef.current.value = '';
          toast({
            title: 'No se pudo preparar el video',
            description: error instanceof Error
              ? error.message
              : 'Intenta grabarlo directamente con la cámara.',
            variant: 'destructive',
          });
        }
      }
    };
    videoElement.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      toast({
        title: 'Video inválido',
        description: 'No se pudo leer el archivo seleccionado.',
        variant: 'destructive',
      });
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
      streamRef.current = mediaStream;
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
    if (videoRenderFrameRef.current !== null) {
      cancelAnimationFrame(videoRenderFrameRef.current);
      videoRenderFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setStream(null);
  };

  const startVHSRenderLoop = (activeStream: MediaStream) => {
    const video = videoRef.current;
    const canvas = vhsCanvasRef.current;
    if (!video || !canvas) return;

    if (video.srcObject !== activeStream) {
      video.srcObject = activeStream;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    const scanlineCanvas = document.createElement('canvas');
    scanlineCanvas.width = 1;
    scanlineCanvas.height = 4;
    const scanlineContext = scanlineCanvas.getContext('2d');
    if (scanlineContext) {
      scanlineContext.fillStyle = 'rgba(0, 0, 0, 0.15)';
      scanlineContext.fillRect(0, 0, 1, 2);
    }
    const scanlinePattern = ctx.createPattern(scanlineCanvas, 'repeat');
    const dateStr = new Date().toLocaleDateString('es-UY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
    const frameInterval = 1000 / 20;
    let lastFrameAt = -frameInterval;

    const render = (timestamp: number) => {
      if (video.ended || activeStream.getVideoTracks()[0]?.readyState === 'ended') return;
      if (video.paused) {
        void video.play().catch(() => undefined);
        videoRenderFrameRef.current = requestAnimationFrame(render);
        return;
      }
      if (timestamp - lastFrameAt < frameInterval) {
        videoRenderFrameRef.current = requestAnimationFrame(render);
        return;
      }
      lastFrameAt = timestamp;

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
      if (scanlinePattern) {
        ctx.fillStyle = scanlinePattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // flasing record dot
      const now = Date.now();
      const activeTemplate = normalizeFrameTemplateId(fiesta?.buzonConfig?.videoFrameTemplate);
      const hasCustomFrame = activeTemplate !== 'default';
      const topMetadataY = hasCustomFrame ? 90 : 40;
      if (Math.floor(now / 500) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(40, topMetadataY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('REC', 60, topMetadataY + 6);
      }

      // Video Timer or timestamp
      const date = new Date();
      const timeStr = date.toTimeString().split(' ')[0];
      const dateStr = date.toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText(timeStr, 40, canvas.height - (hasCustomFrame ? 105 : 60));
      ctx.fillText(dateStr, 40, canvas.height - (hasCustomFrame ? 80 : 35));
      ctx.fillText('PLAY ▶', canvas.width - 110, topMetadataY + 6);
      ctx.fillText('VHS SP', canvas.width - 110, canvas.height - (hasCustomFrame ? 80 : 35));

      drawBuzonVideoFrame(
        ctx,
        activeTemplate,
        fiesta?.buzonConfig?.customText || fiesta?.eventName || 'AK PRODUCCIONES',
        canvas.width,
        canvas.height,
      );

      // Frame Border Overlay directly on Canvas
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

      videoRenderFrameRef.current = requestAnimationFrame(render);
    };

    videoRenderFrameRef.current = requestAnimationFrame(render);
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

    const mimeType = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ].find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';

    const chunks: Blob[] = [];
    const recorder = mimeType
      ? new MediaRecorder(canvasStream, { mimeType })
      : new MediaRecorder(canvasStream);
    vhsRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const outputType = recorder.mimeType || mimeType || 'video/webm';
      const extension = outputType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: outputType });
      const file = new File(
        [blob],
        `capsulavideo-${Date.now()}.${extension}`,
        { type: outputType },
      );
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(blob));
      setVideoState('review');
      stopCamera();
    };

    recorder.start(1_000);

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
    setVideoProcessingProgress(0);
    setVideoState('idle');
    stopCamera();
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleReRecordVideo = () => {
    resetVideoUpload();
    startCamera();
  };

  // PHOTO HANDLING (CAPTURE & UPLOAD)
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Archivo Inválido',
        description: 'Por favor selecciona una foto o imagen.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'Foto demasiado grande',
        description: 'La foto no debe superar los 15MB.',
        variant: 'destructive',
      });
      return;
    }

    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoState('review');
  };

  const startPhotoCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPhotoState('capturing');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Cámara no disponible',
        description: 'No se pudo acceder a la cámara para sacar la foto.',
        variant: 'destructive',
      });
    }
  };

  const capturePhotoWithCountdown = () => {
    if (countdown !== null) return;
    let count = fiesta?.station?.countdownSeconds || 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        takePhotoSnapshot();
      }
    }, 1000);
  };

  const takePhotoSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Invertir horizontalmente para efecto espejo natural en selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `buzon-foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(blob));
      setPhotoState('review');
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const resetPhotoUpload = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(null);
    setPhotoUrl(null);
    setPhotoState('idle');
    stopCamera();
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleReTakePhoto = () => {
    resetPhotoUpload();
    startPhotoCamera();
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
    if (accessToken) formData.append('accessToken', accessToken);

    if (isTimeCapsule) {
      formData.append('isTimeCapsule', 'true');
      formData.append('unlockYears', unlockYears.toString());
      if (recipientNote.trim()) formData.append('recipientNote', recipientNote.trim());
    }

    if (activeTab === 'photo' && photoFile) {
      formData.append('file', photoFile, photoFile.name);
      formData.append('mediaType', 'photo');
      formData.append('durationSeconds', '0');
    } else if (activeTab === 'audio' && audioBlob) {
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
        resetPhotoUpload();
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Cargando Buzón de Recuerdos...</p>
      </div>
    );
  }

  if (!fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold">Buzón no disponible</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {motivoSinBuzon ?? 'No encontramos esta fiesta.'}
        </p>
        <p className="mt-3 max-w-xs text-xs text-muted-foreground">
          Si llegaste por un enlace viejo, pedile el QR del buzón al equipo de AK.
        </p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-muted rounded-lg text-xs font-bold border border-border">Volver</button>
      </div>
    );
  }

  const hasWelcomeAudio = !!fiesta.welcomeAudioUrl;
  const customAccent = fiesta.station.accentColor || '#6366f1';

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between select-none">

      {/* HEADER */}
      <header className="px-4 py-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 mx-2">
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {fiesta.station.brandText || 'Buzón de Recuerdos'}
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
            {fiesta.eventName || 'Fiesta'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVoiceEnabled(prev => !prev)}
          aria-label={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
          title={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-zinc-300"
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
        </button>
      </header>

      {/* CELEBRATION */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-2 border border-primary/20">
              <CheckCircle2 className="w-16 h-16 animate-bounce" />
            </div>
            <h2 className="text-3xl font-black text-foreground">¡Mensaje al Buzón!</h2>
            <p className="text-muted-foreground text-sm max-w-xs mt-2">Tu recuerdo ha sido guardado exitosamente para el futuro.</p>
            <button onClick={() => setShowCelebration(false)} className="mt-6 px-6 py-3 rounded-lg text-xs font-bold text-foreground uppercase tracking-wider border border-border hover:bg-muted transition">
              Grabar otro recuerdo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col justify-start gap-6 z-10">

        {/* Welcome Card — only shown on landing */}
        {selectedMode === null && hasWelcomeAudio && (
          <div className="p-5 rounded-xl bg-card border border-border shadow-sm flex items-center gap-4">
            <button
              onClick={toggleWelcomeAudio}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition transform hover:scale-105 shrink-0 bg-primary text-primary-foreground"
            >
              {isWelcomePlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Mensaje Inicial
              </p>
              <h3 className="text-xs font-black text-foreground mt-0.5">Escuchá el saludo de los anfitriones</h3>
            </div>
          </div>
        )}

        {selectedMode === null ? (
          /* ── LANDING SELECTION MENU ── */
          <div className="flex flex-col gap-5">
            <div className="text-center space-y-2.5">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight leading-none text-foreground">
                Cápsula de los Recuerdos
              </h2>
              <p className="text-xs font-bold text-primary uppercase tracking-widest leading-relaxed">
                ¡Dejale tu saludo especial!
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                Elegí el formato que prefieras para grabar o subir tu recuerdo y guardarlo para siempre.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              {/* Opción 1: Sacar Foto */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { handleSelectMode('photo_record'); startPhotoCamera(); }}
                className="group relative w-full overflow-hidden rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 transition-transform group-hover:scale-110">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-foreground uppercase tracking-wider">Sacar Foto</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-amber-500 text-black font-mono">
                        FOTO
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">Sacate una selfie de recuerdo con tu dedicatoria.</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
              </motion.button>

              {/* Opción 2: Grabar Video */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { handleSelectMode('vhs_record'); startCamera(); }}
                className="group relative w-full overflow-hidden rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 transition-transform group-hover:scale-110">
                    <Video className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-foreground uppercase tracking-wider">Grabar Video</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-rose-500 text-white animate-pulse">
                        REC 15s
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">Dejá un recuerdo inolvidable en video (15s).</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
              </motion.button>

              {/* Opción 3: Grabar Audio Directo */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectMode('audio_record')}
                className="group relative w-full overflow-hidden rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-110">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground uppercase tracking-wider">Mensaje de Audio</p>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">Dejá una nota de voz con tus mejores deseos (60s).</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </div>
              </motion.button>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => { handleSelectMode('photo_upload'); setTimeout(() => photoInputRef.current?.click(), 100); }}
                  className="min-h-24 rounded-xl border border-border bg-card px-2.5 py-4 text-left hover:border-primary/40 hover:bg-muted/20 transition shadow-sm"
                >
                  <Upload className="w-5 h-5 text-amber-500 mb-2" />
                  <span className="block text-xs font-black text-foreground uppercase">Subir foto</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">Galería</span>
                </button>
                <button
                  onClick={() => handleSelectMode('vhs_upload')}
                  className="min-h-24 rounded-xl border border-border bg-card px-2.5 py-4 text-left hover:border-primary/40 hover:bg-muted/20 transition shadow-sm"
                >
                  <Upload className="w-5 h-5 text-primary mb-2" />
                  <span className="block text-xs font-black text-foreground uppercase">Subir video</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">Galería</span>
                </button>
                <button
                  onClick={() => handleSelectMode('audio_upload')}
                  className="min-h-24 rounded-xl border border-border bg-card px-2.5 py-4 text-left hover:border-primary/40 hover:bg-muted/20 transition shadow-sm"
                >
                  <Upload className="w-5 h-5 text-primary mb-2" />
                  <span className="block text-xs font-black text-foreground uppercase">Subir audio</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">Archivo</span>
                </button>
                <button
                  onClick={() => handleSelectMode('audio_retro')}
                  className="col-span-3 min-h-16 rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3 text-left hover:border-amber-500/40 hover:bg-muted/20 transition shadow-sm"
                >
                  <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>
                    <span className="block text-xs font-black text-foreground uppercase">Cabina telefónica retro</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Dejá tu mensaje después del tono</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── INTERACTIVE SCREEN ── */
          <div className="flex-1 flex flex-col justify-between min-h-[380px] w-full">
            <div className="flex-1 flex flex-col items-center justify-start gap-6 w-full">

              {/* Volver button */}
              <button
                onClick={handleGoBack}
                className="self-start flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Volver al menú
              </button>

              {/* Title Header for Active Mode */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black uppercase tracking-wider text-foreground">
                  {selectedMode === 'photo_record' && 'Sacar Foto'}
                  {selectedMode === 'photo_upload' && 'Subir Foto'}
                  {selectedMode === 'vhs_record' && 'Grabar Video'}
                  {selectedMode === 'vhs_upload' && 'Subir Video'}
                  {selectedMode === 'audio_record' && 'Grabar Audio Directo'}
                  {selectedMode === 'audio_retro' && 'Cabina Telefónica'}
                  {selectedMode === 'audio_upload' && 'Subir Archivo de Audio'}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                  {selectedMode === 'photo_record' && 'Sacate una selfie con la cámara frontal'}
                  {selectedMode === 'photo_upload' && 'Seleccioná una foto de tu galería'}
                  {selectedMode === 'vhs_record' && 'Graba con tu cámara frontal'}
                  {selectedMode === 'vhs_upload' && 'Selecciona un video de tu galería'}
                  {selectedMode === 'audio_record' && 'Graba un saludo de voz directo'}
                  {selectedMode === 'audio_retro' && 'Auricular descolgado'}
                  {selectedMode === 'audio_upload' && 'Selecciona un archivo de audio'}
                </p>
              </div>

              {/* 📸 MODE: PHOTO RECORD 📸 */}
              {selectedMode === 'photo_record' && (
                <div className="w-full">
                  {photoState === 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-6 w-full">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-4 bg-amber-500/20 rounded-full animate-pulse" />
                        <div className="relative z-10 w-24 h-24 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-lg border border-amber-400/50">
                          <Camera className="w-10 h-10 drop-shadow-md" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Preparado para la foto</p>
                        <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">Acomodate frente a la cámara y sonreí.</p>
                      </div>
                      <button
                        onClick={startPhotoCamera}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                      >
                        <Camera className="w-5 h-5" /> Activar Cámara
                      </button>
                    </motion.div>
                  )}

                  {photoState === 'capturing' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full flex flex-col items-center space-y-4">
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-black relative shadow-lg">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
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
                      </div>

                      <button
                        onClick={capturePhotoWithCountdown}
                        disabled={countdown !== null}
                        className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <Camera className="w-5 h-5" /> {countdown !== null ? '¡Sonreí!' : '📸 Sacar Foto'}
                      </button>
                    </motion.div>
                  )}

                  {photoState === 'review' && photoUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-4 text-center">
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border relative shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl} alt="Foto capturada" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="text-left">
                          <p className="text-xs font-black text-foreground uppercase tracking-wider">Foto Lista</p>
                          <p className="text-xs text-muted-foreground font-bold mt-0.5">Completá tus datos abajo para enviarla.</p>
                        </div>
                        <button onClick={handleReTakePhoto} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive rounded-lg text-xs font-black uppercase tracking-wider transition">
                          <RefreshCw className="w-3.5 h-3.5" /> Sacar de nuevo
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* 📸 MODE: PHOTO UPLOAD 📸 */}
              {selectedMode === 'photo_upload' && (
                <div className="w-full">
                  <input type="file" accept="image/*" onChange={handlePhotoFileChange} ref={photoInputRef} className="hidden" />
                  {photoState === 'idle' || !photoUrl ? (
                    <button
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full p-8 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-3.5"
                    >
                      <Upload className="w-8 h-8 text-amber-500" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-foreground uppercase tracking-wider">Subir Foto de Galería</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">JPG, PNG o WEBP (máx. 15MB)</p>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-4 text-center">
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border relative shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl} alt="Foto cargada" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="text-left">
                          <p className="text-xs font-black text-foreground uppercase tracking-wider">Foto Cargada</p>
                          <p className="text-xs text-muted-foreground font-bold mt-0.5">Completá tus datos abajo para enviarla.</p>
                        </div>
                        <button onClick={resetPhotoUpload} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive rounded-lg text-xs font-black uppercase tracking-wider transition">
                          <RefreshCw className="w-3.5 h-3.5" /> Elegir otra
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 🔴 MODE: VHS RECORD 🔴 */}
              {selectedMode === 'vhs_record' && (
                <div className="w-full">
                  {videoState === 'idle' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-6 w-full">
                      <div className="relative w-40 h-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-4 bg-rose-500/20 rounded-full animate-pulse" />
                        <div className="relative z-10 w-24 h-24 bg-rose-600 rounded-full flex items-center justify-center shadow-lg border border-rose-400/50">
                          <Camera className="w-10 h-10 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Preparado para video</p>
                        <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">Acomodate y prepará tu mejor sonrisa.</p>
                      </div>
                      <button
                        onClick={startCamera}
                        className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                      >
                        <Camera className="w-5 h-5" /> Activar Cámara
                      </button>
                    </motion.div>
                  )}

                  {videoState === 'recording' && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full flex flex-col items-center space-y-4">
                      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                      {/* Video y Overlays */}
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-black relative shadow-lg">
                        <canvas ref={vhsCanvasRef} className="w-full h-full object-cover" />

                        {/* Overlay VHS Effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none bg-[size:100%_4px,3px_100%]" />
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
                          className="w-full py-3.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                          <VideoOff className="w-5 h-5" /> Detener Grabación
                        </button>
                      ) : (
                        <button
                          onClick={handleStartVideoWithCountdown}
                          disabled={countdown !== null}
                          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                        >
                          <Video className="w-5 h-5" /> {countdown !== null ? 'Preparando...' : 'Comenzar a Grabar'}
                        </button>
                      )}
                    </motion.div>
                  )}

                  {videoState === 'review' && videoUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-4 text-center">
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border relative shadow-lg">
                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                        <VideoFrameOverlay
                          template={fiesta?.buzonConfig?.videoFrameTemplate}
                          customText={fiesta?.buzonConfig?.customText}
                          eventName={fiesta?.eventName}
                        />
                      </div>
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="text-left">
                          <p className="text-xs font-black text-foreground uppercase tracking-wider">Video Grabado</p>
                          <p className="text-xs text-muted-foreground font-bold mt-0.5">Duración: {Math.round(videoDuration)} segundos</p>
                        </div>
                        <button onClick={handleReRecordVideo} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive rounded-lg text-xs font-black uppercase tracking-wider transition">
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
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-4 bg-primary/20 rounded-full animate-pulse" />
                        <div className="relative z-10 w-24 h-24 bg-primary rounded-full flex items-center justify-center shadow-lg border border-primary/50 text-primary-foreground">
                          <Mic className="w-10 h-10 drop-shadow-md" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Preparado para grabar</p>
                        <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed mx-auto">Presioná el botón de abajo cuando estés listo para dejar tu mensaje de voz (Max 60s).</p>
                      </div>
                      <button
                        onClick={startDirectAudioRecording}
                        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
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
                            className="w-2 bg-primary rounded-full"
                          />
                        ))}
                      </div>

                      <div className="space-y-2">
                        <p className="text-5xl font-black tracking-wider text-foreground tabular-nums drop-shadow-sm">
                          0:{recordingSeconds.toString().padStart(2, '0')}
                        </p>
                        <p className="text-xs text-primary font-bold uppercase tracking-widest animate-pulse">Grabando tu saludo...</p>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-border">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${(recordingSeconds / 60) * 100}%` }}
                        />
                      </div>

                      <button
                        onClick={stopDirectAudioRecording}
                        className="w-full py-3.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                      >
                        <Square className="w-5 h-5 fill-current" /> Finalizar Grabación
                      </button>
                    </motion.div>
                  )}

                  {phoneState === 'review' && audioUrl && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full p-5 bg-card border border-border rounded-xl flex flex-col items-center gap-4 text-center shadow-sm">
                      <p className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Revisá tu saludo</p>

                      <div className="flex items-center gap-4 w-full">
                        <button
                          onClick={togglePlayRecording}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95"
                        >
                          {isPlayingRecording ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>

                        <div className="flex-1 text-left">
                          <p className="text-sm font-black text-foreground uppercase tracking-wide">Mensaje de voz</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div className="h-full bg-primary" initial={{ width: "100%" }} />
                            </div>
                            <p className="text-xs text-muted-foreground font-bold tabular-nums shrink-0">{recordingSeconds}s</p>
                          </div>
                        </div>

                        <button onClick={resetAudioRecording} className="p-2.5 text-destructive hover:bg-destructive/10 transition rounded-lg border border-transparent">
                          <Trash2 className="w-4 h-4" />
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
                  {videoState === 'processing' ? (
                    <div className="w-full p-8 rounded-xl border border-border bg-card flex flex-col items-center gap-4 text-center shadow-sm">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <div>
                        <p className="text-xs font-black text-foreground uppercase tracking-wider">Preparando video con marco</p>
                        <p className="text-xs text-muted-foreground mt-1">No cierres esta pantalla.</p>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden bg-muted">
                        <div
                          className="h-full bg-primary transition-[width]"
                          style={{ width: `${videoProcessingProgress}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-primary">{videoProcessingProgress}%</p>
                    </div>
                  ) : videoState !== 'review' ? (
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full p-8 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-3.5"
                    >
                      <Upload className="w-8 h-8 text-primary" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-foreground uppercase tracking-wider">Seleccionar Video</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Máximo 15 segundos de duración</p>
                      </div>
                    </button>
                  ) : (
                    videoUrl && (
                      <div className="w-full flex flex-col items-center gap-4 text-center">
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-black border border-border relative shadow-lg">
                          <video src={videoUrl} controls className="w-full h-full object-contain" />
                        </div>
                        <div className="flex items-center justify-between w-full px-2">
                          <div className="text-left">
                            <p className="text-xs font-black text-foreground uppercase tracking-wider">Video Cargado</p>
                            <p className="text-xs text-muted-foreground font-bold mt-0.5">Duración: {Math.round(videoDuration)} segundos</p>
                          </div>
                          <button onClick={resetVideoUpload} className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive rounded-lg text-xs font-black uppercase tracking-wider transition">
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
                      className="w-full p-8 rounded-xl border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-3.5"
                    >
                      <Upload className="w-8 h-8 text-primary" />
                      <div className="space-y-1">
                        <p className="text-xs font-black text-foreground uppercase tracking-wider">Subir Archivo de Audio</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Formatos soportados: MP3, WAV, M4A o WEBM</p>
                      </div>
                    </button>
                  ) : (
                    audioUrl && (
                      <div className="w-full p-5 bg-card border border-border rounded-xl flex flex-col items-center gap-4 text-center shadow-sm">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Escuchá el audio cargado</p>
                        <div className="flex items-center gap-4 w-full">
                          <button
                            onClick={togglePlayRecording}
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground transition shrink-0"
                          >
                            {isPlayingRecording ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          </button>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Audio cargado</p>
                            <p className="text-xs text-muted-foreground font-bold mt-0.5">Duración: {recordingSeconds}s</p>
                          </div>
                          <button onClick={resetAudioRecording} className="p-2.5 text-muted-foreground hover:text-destructive transition rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            </div>

            {/* SUBMISSION FORM (Only shown when recording/photo exists) */}
            {((activeTab === 'photo' && photoUrl && photoState === 'review') || (activeTab === 'audio' && audioUrl && phoneState === 'review') || (activeTab === 'video' && videoUrl && videoState === 'review')) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4 w-full">
                <div className="space-y-1.5">
                  <label className="text-xs text-foreground font-black uppercase tracking-wider pl-1">Tu Nombre y Apellido</label>
                  <input
                    type="text"
                    placeholder="Ej: Laura Pérez"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={30}
                    className="w-full bg-muted/20 border border-border focus:border-primary rounded-lg px-4 py-3 text-sm font-semibold outline-none text-foreground transition"
                  />
                </div>

                {/* Bloque G: Cápsula del tiempo */}
                <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Cápsula del Tiempo</p>
                        <p className="text-[10px] text-muted-foreground">Guardar este saludo para abrir en el futuro</p>
                      </div>
                    </div>
                    <Switch checked={isTimeCapsule} onCheckedChange={setIsTimeCapsule} />
                  </div>

                  {isTimeCapsule && (
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1.5">
                          ¿Dentro de cuántos años abrirlo?
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {[
                            { years: 1, label: '1 año' },
                            { years: 3, label: '3 años' },
                            { years: 5, label: '5 años' },
                            { years: 10, label: '10 años' },
                            { years: 15, label: '15 años' },
                          ].map((opt) => (
                            <button
                              key={opt.years}
                              type="button"
                              onClick={() => setUnlockYears(opt.years)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition border ${
                                unlockYears === opt.years
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-muted/30 border-border text-foreground hover:bg-muted'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-1">
                          Destinatario / Motivo (opcional)
                        </label>
                        <input
                          type="text"
                          value={recipientNote}
                          onChange={(e) => setRecipientNote(e.target.value)}
                          placeholder="Ej: Para los 15 de mi hija, o aniversario"
                          className="w-full bg-muted/20 border border-border focus:border-primary rounded-lg px-3 py-2 text-xs font-medium outline-none text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-sm flex items-center justify-center gap-2 transform transition hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando en cápsula...</> : <><Send className="w-4 h-4" /> Enviar Recuerdo</>}
                </button>
              </motion.div>
            )}

          </div>
        )}
      </main>

      <footer className="py-6 border-t border-border bg-card text-center">
        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Experiencia por AK Producciones</p>
      </footer>

      <KioskUnlockButton />
    </div>
  );
}
