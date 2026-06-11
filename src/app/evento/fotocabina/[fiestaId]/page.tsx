'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, SwitchCamera, Download, Send, ArrowLeft, Loader2, PartyPopper, RefreshCw, Volume2, VolumeX, FileImage } from 'lucide-react';
import { uploadSocialPost } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const FRAMES = [
  { id: 'none', label: 'Sin Marco', bg: 'transparent' },
  { id: 'golden', label: 'Dorado', bg: 'border-[16px] border-amber-400/80 rounded-3xl' },
  { id: 'neon', label: 'Neón', bg: 'border-[12px] border-purple-500/80 shadow-[inset_0_0_20px_#a855f7] rounded-3xl' },
  { id: 'flowers', label: 'Flores', bg: 'border-[16px] border-pink-400/80 rounded-3xl' },
  { id: 'stars', label: 'Estrellas', bg: 'border-[8px] border-yellow-300/80 rounded-3xl' },
  { id: 'ak_brand', label: 'AK Brand', bg: 'border-b-[40px] border-zinc-900 rounded-b-3xl' },
];

export default function FotocabinaPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFrame, setSelectedFrame] = useState('none');
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

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

  useEffect(() => {
    getFiestaById(fiestaId).then(f => setFiesta(f)).catch(() => {});
    return () => stopCamera();
  }, [fiestaId]);

  useEffect(() => {
    startCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setErrorMsg('No se pudo acceder a la cámara. Por favor, revisa los permisos del navegador.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
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

  const takePhoto = () => {
    if (countdown !== null) return;
    
    let currentCount = 3;
    setCountdown(currentCount);
    playBeep();
    speak("Tres");
    
    const interval = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playBeep();
        if (currentCount === 2) speak("Dos");
        if (currentCount === 1) speak("Uno");
      } else {
        clearInterval(interval);
        setCountdown(null);
        playBeep(1200, 0.3); // High beep for capture
        speak("¡Sonríe!");
        captureToCanvas();
      }
    }, 1000);
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!watermarkEnabled) return;
    
    const eventName = fiesta?.configuracion?.nombreEvento || 'Nuestra Fiesta';
    const rawDate = fiesta?.configuracion?.fechaEvento;
    let eventDateStr = '';
    if (rawDate) {
      try {
        const date = new Date(rawDate);
        eventDateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        eventDateStr = rawDate;
      }
    }

    // Draw semi-transparent gradient banner at the bottom
    const bannerHeight = h * 0.08; // 8% of height
    const grad = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

    // Draw event name
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

  const captureToCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video internal dimensions for best quality
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video
    if (facingMode === 'user') {
      // Mirror the image for front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset transform before drawing overlay
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Draw Frame over it
    drawFrameOverlay(ctx, canvas.width, canvas.height);

    // Draw Watermark Overlay
    drawWatermark(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();

    // Voice guidance for review screen
    setTimeout(() => {
      speak("¡Mirá qué buena foto! Elegí un marco o presiona subir al muro.");
    }, 800);
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
      ctx.fillText('🌸', 40, h - 60);
      ctx.fillText('🌸', w - 120, h - 60);
    } else if (selectedFrame === 'stars') {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.8)';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.font = '60px sans-serif';
      ctx.fillText('✨', 30, 80);
      ctx.fillText('⭐', w - 90, 120);
      ctx.fillText('🌟', 50, h - 80);
    } else if (selectedFrame === 'ak_brand') {
      ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
      ctx.fillRect(0, h - 120, w, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AK PRODUCCIONES', w / 2, h - 45);
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

  const handleUpload = async () => {
    if (!capturedImage || !canvasRef.current) return;
    setIsUploading(true);
    speak("Subiendo tu foto al muro");
    try {
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Error al generar imagen');
      
      const file = new File([blob], `fotocabina-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Fotocabina AK');
      formData.append('source', 'entertainment');
      formData.append('sourceModule', 'fotocabina');
      
      const res = await uploadSocialPost(formData);
      if (res.success) {
        speak("¡Excelente! Tu foto ya está en el muro.");
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          retake();
        }, 3000);
      } else {
        throw new Error(res.error || 'Error al subir');
      }
    } catch (err) {
      speak("Ups, ocurrió un error al subir");
      alert('No se pudo subir la foto. ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const getFrameOverlayClass = () => FRAMES.find(f => f.id === selectedFrame)?.bg || 'transparent';

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center drop-shadow-md">
          <h1 className="text-sm font-bold uppercase tracking-widest text-amber-400">Fotocabina</h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.configuracion?.nombreEvento}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!capturedImage ? (
            <>
              <button 
                onClick={() => setVoiceEnabled(v => !v)} 
                className={`p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition ${voiceEnabled ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/10 text-white'}`}
                title={voiceEnabled ? 'Desactivar Asistente de Voz' : 'Activar Asistente de Voz'}
              >
                {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>
              <button 
                onClick={() => setWatermarkEnabled(w => !w)} 
                className={`p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition ${watermarkEnabled ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/10 text-white'}`}
                title={watermarkEnabled ? 'Desactivar Marca de Agua' : 'Activar Marca de Agua'}
              >
                <FileImage className="w-6 h-6" />
              </button>
              <button onClick={toggleCamera} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
                <SwitchCamera className="w-6 h-6" />
              </button>
            </>
          ) : <div className="w-10"></div>}
        </div>
      </div>

      {/* FLASH SCREEN */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* VIEWPORT AREA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {errorMsg ? (
          <div className="p-6 text-center text-red-400 font-medium">
            <p className="text-5xl mb-4">📷🚫</p>
            {errorMsg}
          </div>
        ) : !capturedImage ? (
          <div className="relative w-full h-full">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
            />
            {/* CSS Frame Preview overlay */}
            <div className={`absolute inset-0 pointer-events-none m-4 transition-all duration-300 ${getFrameOverlayClass()}`} />
          </div>
        ) : (
          <img src={capturedImage} className="w-full h-full object-contain bg-black" alt="Captura" />
        )}

        {/* COUNTDOWN */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute z-30 flex items-center justify-center"
            >
              <span className="text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* SUCCESS CELEBRATION */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6"
            >
              <PartyPopper className="w-24 h-24 text-amber-400 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-white mb-2">¡Foto enviada!</h2>
              <p className="text-lg text-zinc-300">Ya está en el muro de la fiesta</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* BOTTOM CONTROLS */}
      <div className="h-48 bg-zinc-950 shrink-0 pb-safe z-20 flex flex-col justify-end">
        {!capturedImage ? (
          <>
            {/* Frame Selector */}
            <div className="flex overflow-x-auto gap-3 px-4 py-4 hide-scrollbar">
              {FRAMES.map(frame => (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap border-2
                    ${selectedFrame === frame.id ? 'border-amber-400 bg-amber-400/20 text-amber-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}
                >
                  {frame.label}
                </button>
              ))}
              <Link
                href={`/evento/touchpix/${fiestaId}`}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap border-2 border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 text-fuchsia-400 hover:from-fuchsia-600/30 hover:to-purple-600/30 flex items-center gap-1.5"
              >
                🪄 Touchpix IA
              </Link>
            </div>

            {/* Shutter Button */}
            <div className="flex justify-center pb-6">
              <button
                onClick={takePhoto}
                disabled={countdown !== null || !!errorMsg}
                className="w-20 h-20 rounded-full bg-white/20 p-1.5 backdrop-blur-md transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-zinc-900 shadow-xl">
                  <Camera className="w-8 h-8" />
                </div>
              </button>
            </div>
          </>
        ) : (
          /* Review Controls */
          <div className="flex items-center justify-around px-6 pb-8 pt-4">
            <button onClick={retake} className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold">Repetir</span>
            </button>

            <button 
              onClick={handleUpload}
              disabled={isUploading || showSuccess}
              className="flex flex-col items-center gap-2 text-white hover:text-amber-400 transition"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center">
                {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8 ml-1" />}
              </div>
              <span className="text-sm font-black uppercase tracking-wide">Subir al Muro</span>
            </button>

            <button onClick={handleDownload} className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold">Guardar</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
