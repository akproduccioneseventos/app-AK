'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, SwitchCamera, Download, Send, ArrowLeft, Loader2, PartyPopper, RefreshCw, SmilePlus, X, Volume2, VolumeX, FileImage } from 'lucide-react';
import { uploadSocialPost } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const FILTERS = [
  { id: 'normal', label: 'Sin filtro', css: 'none' },
  { id: 'glamour', label: 'Glamour', css: 'brightness(1.1) contrast(1.05) saturate(1.2)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
  { id: 'neon', label: 'Neón', css: 'hue-rotate(270deg) saturate(2) brightness(1.1)' },
  { id: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.4)' },
  { id: 'warm', label: 'Cálido', css: 'brightness(1.05) saturate(1.3) hue-rotate(10deg)' },
  { id: 'cool', label: 'Frío', css: 'brightness(1.0) saturate(1.2) hue-rotate(200deg)' },
  { id: 'dreamy', label: 'Sueño', css: 'blur(0.5px) brightness(1.1) saturate(0.8) contrast(0.95)' },
];

const STICKERS_LIST = ['🎉', '🎊', '🥂', '💫', '⭐', '🎈', '💖', '🔥', '👑', '🌟', '🎆', '🏆'];

export default function EspejoMagicoPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.fiestaId as string;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  
  const [stickers, setStickers] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showStickerPanel, setShowStickerPanel] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  useEffect(() => {
    getFiestaById(fiestaId).then(f => setFiesta(f)).catch(() => {});
  }, [fiestaId]);

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

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingActiveRef = useRef(false);
  const [drawColor, setDrawColor] = useState('#f43f5e');

  const DRAW_COLORS = [
    { id: 'rose', value: '#f43f5e', label: '🌹 Rosa' },
    { id: 'gold', value: '#fbbf24', label: '⭐ Oro' },
    { id: 'blue', value: '#3b82f6', label: '💧 Azul' },
    { id: 'green', value: '#10b981', label: '🍀 Verde' },
    { id: 'white', value: '#ffffff', label: '⚪ Blanco' },
  ];

  // Set drawing canvas dimensions when capturedImage changes
  useEffect(() => {
    if (capturedImage && drawingCanvasRef.current && containerRef.current) {
      drawingCanvasRef.current.width = containerRef.current.clientWidth;
      drawingCanvasRef.current.height = containerRef.current.clientHeight;
    }
  }, [capturedImage]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = drawColor;
    ctx.shadowBlur = 6;
    ctx.shadowColor = drawColor;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingActiveRef.current = true;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingActiveRef.current) return;
    e.preventDefault();
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    isDrawingActiveRef.current = false;
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const mergeDrawing = () => {
    if (!canvasRef.current || !drawingCanvasRef.current) return;
    const baseCanvas = canvasRef.current;
    const drawCanvas = drawingCanvasRef.current;
    const ctx = baseCanvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(drawCanvas, 0, 0, baseCanvas.width, baseCanvas.height);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
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
      setErrorMsg('No se pudo acceder a la cámara.');
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
  };

  const addSticker = (emoji: string) => {
    if (!containerRef.current) return;
    const cx = containerRef.current.clientWidth / 2 - 40;
    const cy = containerRef.current.clientHeight / 2 - 40;
    setStickers(prev => [...prev, { id: Date.now().toString(), emoji, x: cx, y: cy }]);
    setShowStickerPanel(false);
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    if (capturedImage) return; // disable dragging after capture
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 40; // 40 is half sticker width
    const y = e.clientY - rect.top - 40;
    setStickers(prev => prev.map(s => s.id === draggingId ? { ...s, x, y } : s));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
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
    setShowStickerPanel(false);
    
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
        playBeep(1200, 0.3);
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
    if (!videoRef.current || !canvasRef.current || !containerRef.current) return;
    
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // We use container dimensions to accurately map stickers
    const contW = containerRef.current.clientWidth;
    const contH = containerRef.current.clientHeight;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const scaleX = canvas.width / contW;
    const scaleY = canvas.height / contH;

    // Apply CSS filter to canvas context
    ctx.filter = selectedFilter.css;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    // Draw video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none'; // reset filter for stickers

    // Draw stickers
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${80 * Math.max(scaleX, scaleY)}px sans-serif`;
    
    stickers.forEach(s => {
      const drawX = (s.x + 40) * scaleX; // +40 because we offset by 40 in the UI
      const drawY = (s.y + 40) * scaleY;
      ctx.fillText(s.emoji, drawX, drawY);
    });

    // Draw Watermark
    drawWatermark(ctx, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();

    // Voice guidance for review screen
    setTimeout(() => {
      speak("¡Qué foto espectacular! Firma tu foto abajo o presiona subir al muro.");
    }, 800);
  };

  const handleDownload = () => {
    if (!capturedImage || !canvasRef.current) return;
    mergeDrawing();
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `EspejoMagico-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUpload = async () => {
    if (!capturedImage || !canvasRef.current) return;
    setIsUploading(true);
    speak("Subiendo tu foto al muro");
    try {
      mergeDrawing();
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Error al procesar');
      
      const file = new File([blob], `espejo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Espejo Mágico');
      formData.append('source', 'entertainment');
      formData.append('sourceModule', 'espejoMagico');
      
      const res = await uploadSocialPost(formData);
      if (res.success) {
        speak("¡Listo! Foto enviada al muro");
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
      alert('Error: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setStickers([]);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-zinc-950/90 to-transparent pb-8 pt-safe">
        <button onClick={() => router.back()} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl animate-pulse">✨</span>
            <h1 className="text-lg font-black uppercase tracking-widest bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent drop-shadow-md">
              Espejo Mágico
            </h1>
            <span className="text-xl animate-pulse">✨</span>
          </div>
          {fiesta && <p className="text-xs font-semibold text-zinc-300 mt-0.5">{fiesta.configuracion?.nombreEvento}</p>}
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
              <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition">
                <SwitchCamera className="w-6 h-6" />
              </button>
            </>
          ) : <div className="w-10"></div>}
        </div>
      </div>

      {flash && <div className="absolute inset-0 bg-white z-50 animate-[flash_0.3s_ease-out]" />}

      {/* VIEWPORT */}
      <div 
        className="flex-1 relative w-full h-full bg-zinc-900 border-[8px] border-zinc-800 rounded-[2.5rem] overflow-hidden m-2 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {errorMsg ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 font-medium p-6 text-center">
            {errorMsg}
          </div>
        ) : !capturedImage ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            style={{ filter: selectedFilter.css }}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover" alt="Captura" />
            <canvas
              ref={drawingCanvasRef}
              className="absolute inset-0 w-full h-full z-15 touch-none bg-transparent"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={endDrawing}
              onPointerLeave={endDrawing}
            />
          </>
        )}

        {/* STICKERS LAYER */}
        {stickers.map(s => (
          <div
            key={s.id}
            onPointerDown={(e) => handlePointerDown(s.id, e)}
            className="absolute text-[80px] leading-none select-none cursor-move z-10 touch-none flex items-center justify-center w-[80px] h-[80px]"
            style={{ 
              transform: `translate(${s.x}px, ${s.y}px)`,
              filter: capturedImage ? 'none' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
            }}
          >
            {s.emoji}
            {!capturedImage && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeSticker(s.id); }}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        ))}

        {/* CURRENT FILTER LABEL */}
        {!capturedImage && selectedFilter.id !== 'normal' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-white/90 text-sm font-bold tracking-widest uppercase">
            {selectedFilter.label}
          </div>
        )}

        {/* COUNTDOWN */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center"
            >
              <span className="text-9xl font-black text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]">{countdown}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STICKER PANEL BOTTOM SHEET */}
      <AnimatePresence>
        {showStickerPanel && !capturedImage && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 rounded-t-3xl z-40 pb-safe"
          >
            <div className="p-4 flex justify-between items-center border-b border-zinc-800/50">
              <h3 className="font-bold text-zinc-300">Stickers</h3>
              <button onClick={() => setShowStickerPanel(false)} className="p-2 bg-zinc-800 rounded-full">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 p-6">
              {STICKERS_LIST.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addSticker(emoji)}
                  className="text-4xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM CONTROLS */}
      <div className="h-[200px] shrink-0 pb-safe z-20 flex flex-col justify-end bg-zinc-950">
        {!capturedImage ? (
          <>
            {/* Filter Selector */}
            <div className="flex overflow-x-auto gap-3 px-4 py-3 hide-scrollbar">
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border
                    ${selectedFilter.id === f.id ? 'border-amber-400 bg-amber-400/20 text-amber-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                >
                  {f.label}
                </button>
              ))}
              <Link
                href={`/evento/touchpix/${fiestaId}`}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border border-fuchsia-500/60 bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 text-fuchsia-400 hover:from-fuchsia-600/30 hover:to-purple-600/30 flex items-center gap-1.5"
              >
                🪄 Touchpix IA
              </Link>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between px-8 pb-6">
              <button
                onClick={() => setShowStickerPanel(true)}
                disabled={countdown !== null}
                className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 transition"
              >
                <SmilePlus className="w-6 h-6" />
              </button>

              <button
                onClick={takePhoto}
                disabled={countdown !== null || !!errorMsg}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-1.5 shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-transform active:scale-95 disabled:opacity-50"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-rose-500">
                  <Camera className="w-8 h-8" />
                </div>
              </button>

              <div className="w-14" /> {/* Spacer to center the camera button */}
            </div>
          </>
        ) : (
          /* Review Controls */
          <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
            {/* Color Palette Selector for Drawing */}
            <div className="flex justify-center items-center gap-4 py-2 border-b border-zinc-900">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-2">Firma:</span>
              <div className="flex gap-3">
                {DRAW_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setDrawColor(c.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-95
                      ${drawColor === c.value ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                    style={{ backgroundColor: c.value, boxShadow: drawColor === c.value ? `0 0 8px ${c.value}` : 'none' }}
                    title={c.label}
                  />
                ))}
              </div>
              <button
                onClick={clearDrawing}
                className="ml-auto text-[10px] font-black uppercase border border-zinc-800 bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-full hover:text-white"
              >
                Borrar
              </button>
            </div>

            <div className="flex items-center justify-around">
              <button onClick={retake} className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Repetir</span>
              </button>

              <button 
                onClick={handleUpload}
                disabled={isUploading || showSuccess}
                className="flex flex-col items-center gap-2 text-white hover:text-rose-400 transition"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 shadow-[0_0_30px_rgba(244,63,94,0.3)] flex items-center justify-center">
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
          </div>
        )}
      </div>
      
      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
          >
            <PartyPopper className="w-24 h-24 text-rose-500 mb-4 animate-bounce" />
            <h2 className="text-3xl font-black text-white mb-2">¡Magia en el muro!</h2>
            <p className="text-lg text-zinc-300">Tu foto ya se subió</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
