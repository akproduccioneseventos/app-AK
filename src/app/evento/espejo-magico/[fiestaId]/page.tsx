'use client';

import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  SwitchCamera,
  Download,
  Send,
  ArrowLeft,
  Loader2,
  RefreshCw,
  SmilePlus,
  X,
  Volume2,
  VolumeX,
  FileImage,
  Radio,
  Zap,
  Printer,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { QrRecuerdo } from '@/components/entretenimiento/QrRecuerdo';
import { imprimirRecuerdo } from '@/lib/entretenimiento/imprimir-recuerdo';
import { componerTiraDeFotos } from '@/lib/entretenimiento/tira-fotocabina';
import { AvisoDeFallaEnEstacion } from '@/components/entretenimiento/AvisoDeFallaEnEstacion';
import {
  getPublicEntertainmentEvent,
  uploadEntretenimientoMedia,
} from '@/app/actions/fiesta/entretenimiento.actions';
import {
  getEntertainmentSession,
  startEntertainmentSession,
  updateEntertainmentSessionStatus,
  resetEntertainmentSession,
  completeEntertainmentSessionCycle,
  type EntertainmentSession,
} from '@/app/actions/fiesta/sesion-entretenimiento';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { PublicEntertainmentEventStatus } from '@/components/entertainment/public-entertainment-event-status';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { isVideoFrameReady } from '@/lib/entertainment/camera-readiness';
import { waitForInitialPublicLoad } from '@/lib/public-experience/wait-for-initial-public-load';
import { saveOfflineMedia } from '@/lib/offline/offline-db';
import { SyncStatusIndicator } from '@/components/offline/sync-status-indicator';
import { applyEspejoFaceSwap, isEspejoIaDisponible } from '@/app/actions/espejo-magico-ai';
import {
  ESPEJO_TEMPLATES,
  FACESWAP_CATEGORIES,
  type FaceSwapCategoryId,
} from '@/lib/entertainment/espejo-magico-templates';
import { parseEventDate } from '@/lib/public-experience/event-date';

const FILTERS = [
  { id: 'normal', label: 'Sin filtro', css: 'none' },
  { id: 'glamour', label: 'Glamour', css: 'brightness(1.1) contrast(1.05) saturate(1.2)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
  { id: 'neon', label: 'Neon', css: 'hue-rotate(270deg) saturate(2) brightness(1.1)' },
  { id: 'bw', label: 'B&W', css: 'grayscale(1) contrast(1.4)' },
];

const STICKERS_LIST = ['★', '♡', '✦', '✧', 'AK', '15', 'VIP', 'Love', 'Party', 'Smile', 'Wow', 'Gold'];

const MODE_COPY = {
  foto: {
    eyebrow: 'Foto limpia',
    title: 'Espejo Mágico Foto',
    start: 'Tocar para foto',
    subtitle: 'Prepara la pose, captura la foto y revisala antes de guardarla o compartirla.',
    operatorCta: 'Disparar foto',
    doneLabel: 'Foto lista',
    author: 'Espejo Mágico Foto',
    review: 'La foto se envía automáticamente al muro de la fiesta.',
    reviewStandalone: 'Revisá la foto antes de guardarla en la galería.',
  },
  firma: {
    eyebrow: 'Firma y stickers',
    title: 'Espejo Mágico Firma',
    start: 'Tocar para firmar',
    subtitle: 'Captura la foto, agrega tu firma y revisa el resultado antes de compartirlo.',
    operatorCta: 'Disparar captura',
    doneLabel: 'Foto firmada',
    author: 'Espejo Mágico Firma',
    review: 'Firma o dibujá sobre la foto y después subila al muro.',
    reviewStandalone: 'Firma o dibujá sobre la foto y después guardala.',
  },
  ia: {
    eyebrow: 'Face Swap IA',
    title: 'Espejo Mágico IA',
    start: 'Crear avatar IA',
    subtitle: 'Elegis un estilo, aceptas el procesamiento temporal y luego generamos el retrato.',
    operatorCta: 'Disparar IA',
    doneLabel: 'Avatar listo',
    author: 'Face Swap IA',
    review: 'Podés firmar el resultado o subirlo directo al muro.',
    reviewStandalone: 'Podés firmar el resultado o guardarlo directo.',
  },
} as const;

export default function EspejoMagicoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const requestedMode = searchParams.get('mode') || 'firma';
  const mode = requestedMode === 'foto' || requestedMode === 'ia' ? requestedMode : 'firma';
  const modeCopy = MODE_COPY[mode];
  const role = searchParams.get('role') || 'display'; // 'display' | 'operator'
  const accessToken = searchParams.get('access') || undefined;
  const guestId = searchParams.get('guestId') || undefined;
  const guestAccessToken = searchParams.get('guestAccessToken') || searchParams.get('token') || undefined;
  const showKioskUnlock = searchParams.get('kiosk') === '1';

  // Choose Firestore module Id based on mode
  const moduleId = mode === 'foto' ? 'espejoMagicoFoto' : mode === 'ia' ? 'espejoMagicoIA' : 'espejoMagicoFirma';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const takePhotoRef = useRef<() => void>(() => undefined);
  const retakeRef = useRef<() => void>(() => undefined);
  const localStatusRef = useRef<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [photoSessionId, setPhotoSessionId] = useState<string>(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const [stickers, setStickers] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showStickerPanel, setShowStickerPanel] = useState(false);

  // AI Face Swap IA States
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('kpop_stars');
  const [selectedCategory, setSelectedCategory] = useState<FaceSwapCategoryId>('showbiz');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<string>('idle'); // 'idle' | 'detecting' | 'aligning' | 'gemini' | 'rendering'
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  // Sync state
  const [session, setSession] = useState<EntertainmentSession | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // null = todavia no se pregunto. Solo le interesa al operador, para saber
  // antes de abrir la fila si la estacion va a transformar las fotos o las va a
  // devolver tal cual.
  const [iaDisponible, setIaDisponible] = useState<boolean | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  /**
   * Cuando hay que pedirle permiso al invitado antes de sacarle la foto.
   *
   * Estaba clavado a mano: se pedía **sólo** en el modo con inteligencia
   * artificial. El ajuste `consentRequired` de la fiesta existía, se podía tocar
   * en la pantalla del equipo… y **no lo leía nadie**. O sea: el operador lo
   * marcaba, guardaba, y al invitado no se le preguntaba nada.
   *
   * Ahora manda el ajuste: si la fiesta lo pide, se pregunta siempre. Y el modo
   * con IA lo sigue pidiendo igual, esté como esté el ajuste, porque ahí la foto
   * sale de la app para transformarse.
   */

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  /** Lo que pidió la fiesta: si está marcado, al invitado se le pregunta antes. */
  const hayQuePedirPermiso = Boolean(fiesta?.station?.consentRequired);

  /**
   * Estilos que se le ofrecen al invitado en ESTA fiesta.
   *
   * Si la fiesta no eligio ninguno en particular, se ofrecen todos, que es como
   * venia funcionando. Curar la lista importa: en un cumpleanos de nenes no
   * viene al caso el agente secreto de esmoquin, y ofrecerle cuarenta opciones
   * a un chico de siete lo marea en vez de entusiasmarlo.
   */
  const plantillasHabilitadas = useMemo(() => {
    const permitidas = fiesta?.station?.allowedTemplateIds ?? [];
    const todas = Object.values(ESPEJO_TEMPLATES);
    if (permitidas.length === 0) return todas;
    const filtradas = todas.filter((t) => permitidas.includes(t.id));
    // Si la configuracion quedo apuntando a estilos que ya no existen, es mejor
    // mostrar todos que dejar la pantalla sin ninguna opcion.
    return filtradas.length > 0 ? filtradas : todas;
  }, [fiesta]);

  const categoriasHabilitadas = useMemo(
    () => FACESWAP_CATEGORIES.filter((c) => plantillasHabilitadas.some((t) => t.categoryId === c.id)),
    [plantillasHabilitadas],
  );

  const selectAiCategory = (categoryId: FaceSwapCategoryId) => {
    setSelectedCategory(categoryId);
    setSelectedTemplateId((currentTemplateId) => {
      const currentTemplate = plantillasHabilitadas.find((t) => t.id === currentTemplateId);
      if (currentTemplate?.categoryId === categoryId) return currentTemplateId;
      return (
        plantillasHabilitadas.find((template) => template.categoryId === categoryId)?.id ||
        currentTemplateId
      );
    });
  };
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const isDrawingActiveRef = useRef(false);
  const [drawColor, setDrawColor] = useState('#f43f5e');

  const DRAW_COLORS = [
    { id: 'rose', value: '#f43f5e', label: '🌹 Rosa' },
    { id: 'gold', value: '#fbbf24', label: '⭐ Oro' },
    { id: 'blue', value: '#3b82f6', label: '💧 Azul' },
    { id: 'green', value: '#10b981', label: '🍀 Verde' },
    { id: 'white', value: '#ffffff', label: '⚪ Blanco' },
  ];

  const speak = useCallback((text: string) => {
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
  }, [voiceEnabled]);

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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMsg(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const cameraError = 'No se pudo acceder a la cámara. Revisa los permisos del navegador y vuelve a intentar.';
      setErrorMsg(cameraError);
      void updateEntertainmentSessionStatus(
        fiestaId,
        moduleId,
        'idle',
        { lastError: cameraError },
        accessToken,
      ).catch((statusError) => console.error('No se pudo avisar la falla de cámara al operador:', statusError));
    }
  }, [accessToken, facingMode, fiestaId, moduleId, stopCamera]);

  // 1. Initial configuration load
  useEffect(() => {
    let active = true;
    setFiesta(null);
    setErrorMsg(null);
    setIsEventLoading(true);
    const loadTask = getPublicEntertainmentEvent(fiestaId, moduleId, accessToken)
      .then((result) => {
        if (!active) return;
        if (result.success && result.event) {
          setFiesta(result.event);
          setErrorMsg(null);
        } else {
          setErrorMsg(result.error || 'No se pudo abrir esta estacion.');
        }
      })
      .catch(() => {
        if (active) setErrorMsg('No se pudo abrir esta estacion.');
      });
    void waitForInitialPublicLoad(loadTask).then((result) => {
      if (!active) return;
      if (result === 'timeout') setErrorMsg('La validacion del evento demoro demasiado. Intenta nuevamente.');
      setIsEventLoading(false);
    });
    return () => {
      active = false;
    };
  }, [accessToken, fiestaId, moduleId]);

  useEffect(() => {
    localStatusRef.current = localStatus;
  }, [localStatus]);

  // Keep one remote-control channel alive during the full capture workflow.
  useEffect(() => {
    let pollInFlight = false;
    const interval = setInterval(async () => {
      if (pollInFlight) return;
      pollInFlight = true;
      try {
        const s = await getEntertainmentSession(fiestaId, moduleId, accessToken);
        setSession(s);

        const currentStatus = localStatusRef.current;
        if (role === 'display' && s && s.status !== currentStatus) {
          if (s.status === 'countdown' && currentStatus === 'idle') {
            takePhotoRef.current();
          } else if (s.status === 'idle') {
            retakeRef.current();
          }
        }
      } finally {
        pollInFlight = false;
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      stopCamera();
    };
  }, [accessToken, fiestaId, moduleId, role, stopCamera]);

  // Set drawing canvas dimensions when capturedImage changes
  useEffect(() => {
    if (capturedImage && drawingCanvasRef.current && containerRef.current) {
      drawingCanvasRef.current.width = containerRef.current.clientWidth;
      drawingCanvasRef.current.height = containerRef.current.clientHeight;
    }
  }, [capturedImage]);

  // Camera hooks
  //
  // La camara vive solo mientras NO hay una foto tomada esperando decision. Sin
  // el `!capturedImage`, dos momentos quedaban mal: al firmar sobre la foto la
  // camara seguia prendida detras del dibujo, y si fallaba la subida el estado
  // volvia a 'recording' y la camara se reencendia encima del cartel de error,
  // asi que el invitado veia su cara en vivo mientras la pantalla le decia que
  // algo habia fallado.
  useEffect(() => {
    const esperandoDecision = Boolean(capturedImage);
    const enVivo = localStatus === 'idle' || localStatus === 'countdown' || localStatus === 'recording';
    if (fiesta && role === 'display' && enVivo && !esperandoDecision) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [fiesta, localStatus, role, capturedImage, startCamera, stopCamera]);

  // Welcome Speech Cues
  useEffect(() => {
    if (role === 'display' && localStatus === 'idle' && !capturedImage) {
      if (mode === 'ia') {
        speak('Hola. Elegí tu estilo de IA y prepará tu mejor pose.');
      } else {
        speak(`Hola. ${modeCopy.start}.`);
      }
    }
  }, [localStatus, capturedImage, mode, modeCopy.start, role, speak]);

  // El operador tiene que enterarse antes de la fiesta, no cuando se queja el
  // primer invitado que eligio "Superheroe" y recibio su foto comun.
  useEffect(() => {
    if (role !== 'operator' || mode !== 'ia') return;
    let vigente = true;
    isEspejoIaDisponible()
      .then(res => {
        if (vigente) setIaDisponible(res.disponible);
      })
      .catch(() => {
        if (vigente) setIaDisponible(false);
      });
    return () => {
      vigente = false;
    };
  }, [role, mode]);

  const runFaceSwapIA = async (originalPhotoUrl: string) => {
    setAiProcessing(true);
    setLocalStatus('recording');
    setAiStep('detecting');
    speak("Procesando tu rostro con Inteligencia Artificial. Por favor, aguarda.");

    const stepTimer1 = setTimeout(() => setAiStep('aligning'), 2000);
    const stepTimer2 = setTimeout(() => setAiStep('gemini'), 4500);
    const stepTimer3 = setTimeout(() => setAiStep('rendering'), 7500);

    try {
      const file = dataURLtoFile(originalPhotoUrl, 'source.jpg');

      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      if (accessToken) formData.append('accessToken', accessToken);
      formData.append('consentAccepted', String(consentAccepted));
      formData.append('templateId', selectedTemplateId);
      formData.append('sourceFile', file);
      formData.append('photoSessionId', photoSessionId);

      const result = await applyEspejoFaceSwap(formData);

      if (result.success && result.imageBase64) {
        const fullBase64 = `data:image/jpeg;base64,${result.imageBase64}`;
        setAiImageBase64(fullBase64);

        await loadAiImageToCanvas(fullBase64);

        setCapturedImage(fullBase64);
        setAiStep('idle');
        if (result.faceSwapApplied === false) {
          speak('Modo prueba. Se muestra la foto original.');
        } else {
          speak('Listo. Mirá tu avatar de IA. Podés firmarlo si querés.');
        }
      } else {
        throw new Error(result.error || 'Error al procesar la IA.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'La IA no pudo procesar tu avatar. Podés subir igual tu foto original.');
      speak('La inteligencia artificial no pudo con esta foto, pero tu foto original está lista. Podés subirla igual o volver a intentar.');
      // Antes esto saltaba a 'done', que es la pantalla de "Escanea tu recuerdo"
      // con el codigo QR. Pero cuando la IA falla la foto nunca se subio: el QR
      // se quedaba girando para siempre y el invitado se iba convencido de que
      // tenia su recuerdo guardado, cuando no habia nada. Se queda en la
      // pantalla de revision, con la foto original a la vista y los botones
      // para subirla o reintentar.
      setLocalStatus('recording');
      await updateEntertainmentSessionStatus(fiestaId, moduleId, 'idle', {}, accessToken);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setAiProcessing(false);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const loadAiImageToCanvas = (base64Url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        reject(new Error('Tiempo de carga de imagen agotado.'));
      }, 10_000);
      img.onload = () => {
        clearTimeout(timer);
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        }
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('No se pudo cargar la imagen de IA.'));
      };
      img.src = base64Url;
    });
  };

  // Canvas Drawing
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 14;
    ctx.strokeStyle = drawColor;

    // Pincel de Neon: shadowBlur + shadowColor matches current brush stroke
    ctx.shadowBlur = 15;
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

    // Scale drawing coordinates back to canvas original size
    ctx.drawImage(drawCanvas, 0, 0, baseCanvas.width, baseCanvas.height);
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
    const x = e.clientX - rect.left - 40;
    const y = e.clientY - rect.top - 40;
    setStickers(prev => prev.map(s => s.id === draggingId ? { ...s, x, y } : s));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  // Photo Shoot countdown
  const takePhoto = async () => {
    if ((mode === 'ia' || hayQuePedirPermiso) && !consentAccepted) {
      setErrorMsg(
        mode === 'ia'
          ? 'Tenés que aceptar el uso de IA antes de sacar la foto.'
          : 'Tenés que aceptar que tu foto se muestre en la pantalla antes de sacarla.',
      );
      return;
    }
    setErrorMsg(null);
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(fiestaId, moduleId, 'countdown', {}, accessToken);
    }
    setShowStickerPanel(false);

    let currentCount = fiesta?.station.countdownSeconds || 4;
    setCountdown(currentCount);
    playBeep();

    const speakNumber = (num: number) => {
      if (num === 5) speak("Cinco");
      else if (num === 4) speak("Cuatro");
      else if (num === 3) speak("Tres");
      else if (num === 2) speak("Dos");
      else if (num === 1) speak("Uno");
      else if (num > 5) speak(String(num));
    };

    speakNumber(currentCount);

    const interval = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playBeep();
        speakNumber(currentCount);
      } else {
        clearInterval(interval);
        setCountdown(null);
        playBeep(1200, 0.3);
        speak('Sonreí');
        captureToCanvas();
      }
    }, 1000);
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!watermarkEnabled) return;

    const eventName = fiesta?.eventName || 'Nuestra Fiesta';
    const rawDate = fiesta?.eventDate;
    let eventDateStr = '';
    if (rawDate) {
      try {
        // `parseEventDate`: sin esto la marca de agua de la foto salia con la
        // fecha del dia anterior a la fiesta.
        const date = parseEventDate(rawDate);
        eventDateStr = date ? date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : rawDate;
      } catch (e) {
        eventDateStr = rawDate;
      }
    }

    const bannerHeight = h * 0.08;
    const grad = ctx.createLinearGradient(0, h - bannerHeight, 0, h);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.6)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, h - bannerHeight, w, bannerHeight);

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

  const captureToCanvas = async () => {
    if (!videoRef.current || !canvasRef.current || !containerRef.current) return;
    if (!isVideoFrameReady(videoRef.current)) {
      setErrorMsg('La camara todavia se esta preparando. Intenta nuevamente en un instante.');
      setLocalStatus('idle');
      return;
    }

    setLocalStatus('recording');
    await updateEntertainmentSessionStatus(fiestaId, moduleId, 'recording', {}, accessToken);

    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const contW = containerRef.current.clientWidth;
    const contH = containerRef.current.clientHeight;

    // Configurar canvas con la altura nativa del video pero con la proporción (aspect ratio) del contenedor
    canvas.height = video.videoHeight;
    canvas.width = Math.round(video.videoHeight * (contW / contH));

    const scale = canvas.width / contW;

    // Calcular recorte object-cover del video original de la cámara
    const vr = video.videoWidth / video.videoHeight;
    const cr = contW / contH;
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
    if (vr > cr) {
      sw = video.videoHeight * cr;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = video.videoWidth / cr;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.filter = selectedFilter.css;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Dibujar el video aplicando el recorte proporcional calculado
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';

    // Dibujar los stickers de forma proporcional y no deformada
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${80 * scale}px sans-serif`;

    stickers.forEach(s => {
      const drawX = (s.x + 40) * scale;
      const drawY = (s.y + 40) * scale;
      ctx.fillText(s.emoji, drawX, drawY);
    });

    drawWatermark(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setOriginalPhotoUrl(dataUrl);
    setCapturedImage(dataUrl);
    stopCamera();

    if (mode === 'ia') {
      await runFaceSwapIA(dataUrl);
    } else if (mode === 'foto') {
      // If photo mode, directly upload
      setLocalStatus('processing');
      await updateEntertainmentSessionStatus(fiestaId, moduleId, 'processing', {}, accessToken);
      await handleUpload(dataUrl);
    } else {
      // Firma mode gives drawing screen first
      setLocalStatus('recording'); // keeps drawing controls visible
      speak('Perfecto. Firma tu foto en la pantalla y presiona subir.');
    }
  };

  const handleDownload = () => {
    if (!capturedImage || !canvasRef.current) return;
    if (mode !== 'foto') {
      mergeDrawing();
    }
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `EspejoMagico-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Los espejos del rubro imprimen ademas de mandar la copia digital, y en la
   * version con firma el papel es medio punto del juego: el invitado firma y se
   * lo lleva. Se imprime lo que esta en el lienzo, asi la firma y los stickers
   * salen en la hoja.
   */
  const handleImprimir = async () => {
    if (!capturedImage || !canvasRef.current) return;
    if (mode !== 'foto') {
      mergeDrawing();
    }
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    try {
      const tiraPersonalizada = await componerTiraDeFotos({
        fotos: [dataUrl],
        nombreDelEvento: fiesta?.eventName || '',
        nombreHomenajeado: fiesta?.nombreAgasajado || '',
        motivoDelEvento: fiesta?.tipoCelebracion || '',
        fechaDelEvento: fiesta?.eventDate || '',
        colorDeAcento: fiesta?.primaryColor || fiesta?.station.accentColor || '#d4a574',
        colorFondo: fiesta?.colorFondo,
        imagenFondoUrl: fiesta?.imagenFondoUrl,
        textoDeMarca: 'AK Producciones',
      });
      const resultado = imprimirRecuerdo(tiraPersonalizada);
      if (!resultado.ok) {
        setErrorMsg(resultado.aviso || 'No se pudo mandar a imprimir.');
      }
    } catch {
      const resultado = imprimirRecuerdo(dataUrl);
      if (!resultado.ok) {
        setErrorMsg(resultado.aviso || 'No se pudo mandar a imprimir.');
      }
    }
  };

  const handleUpload = async (imageOverride?: string) => {
    if (!canvasRef.current || (!capturedImage && !imageOverride)) return;

    setIsUploading(true);
    setLocalStatus('processing');
    void updateEntertainmentSessionStatus(fiestaId, moduleId, 'processing', {}, accessToken).catch(() => undefined);
    speak("Subiendo tu foto al muro");

    let pendingBlob: Blob | null = null;
    const fileName = `espejo-${Date.now()}.jpg`;

    try {
      if (mode !== 'foto') {
        mergeDrawing();
      }
      pendingBlob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/jpeg', 0.9));
      if (!pendingBlob) throw new Error('Error al procesar');
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Sin conexión');
      }

      const file = new File([pendingBlob], fileName, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', modeCopy.author);
      formData.append('moduleId', moduleId);
      if (accessToken) formData.append('accessToken', accessToken);
      if (guestId) formData.append('guestId', guestId);
      if (guestAccessToken) formData.append('guestAccessToken', guestAccessToken);

      const res = await uploadEntretenimientoMedia(formData);
      if (!res.success) throw new Error(res.error || 'Error al subir');

      const mediaUrl = res.media?.url || '';
      setQrCodeUrl(mediaUrl);
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(
        fiestaId,
        moduleId,
        'done',
        { mediaUrl, lastError: null },
        accessToken
      );
      speak('Listo. Foto enviada al muro.');

      setTimeout(() => {
        retake();
      }, 12000);
    } catch (err) {
      console.error(err);
      setQrCodeUrl('');

      if (pendingBlob) {
        try {
          await saveOfflineMedia({
            fiestaId,
            moduleId,
            fileBlob: pendingBlob,
            fileName,
            mimeType: 'image/jpeg',
            authorName: modeCopy.author,
            guestId,
            guestAccessToken,
            accessToken,
          });
          setErrorMsg(null);
          setLocalStatus('done');
          void updateEntertainmentSessionStatus(
            fiestaId,
            moduleId,
            'done',
            { mediaUrl: null, reviewPending: true, lastError: null },
            accessToken,
          ).catch(() => undefined);
          speak('Tu foto quedó guardada y se subirá cuando vuelva la señal.');
          setTimeout(() => {
            retake();
          }, 5000);
          return;
        } catch (offlineError) {
          console.error('[EspejoMagico] No se pudo guardar la captura sin conexión:', offlineError);
        }
      }

      setErrorMsg((err as Error).message || 'No se pudo subir la foto. Puedes descargarla en este dispositivo.');
      setLocalStatus('recording');
      void updateEntertainmentSessionStatus(
        fiestaId,
        moduleId,
        'idle',
        { lastError: 'No se pudo subir ni guardar la foto del invitado.' },
        accessToken,
      ).catch(() => undefined);
      speak('No se pudo guardar la foto. Podés reintentar o descargarla en este dispositivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const retake = () => {
    setErrorMsg(null);
    setCapturedImage(null);
    setStickers([]);
    setQrCodeUrl('');
    setOriginalPhotoUrl(null);
    setAiImageBase64(null);
    setAiStep('idle');
    setAiProcessing(false);
    setLocalStatus('idle');
    setPhotoSessionId(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    setSliderPosition(50);
    void completeEntertainmentSessionCycle(fiestaId, moduleId, accessToken);
    if (role === 'display') {
      startCamera();
    }
  };

  useEffect(() => {
    takePhotoRef.current = () => { void takePhoto(); };
    retakeRef.current = retake;
  });

  const openDisplayScreen = () => {
    const params = new URLSearchParams({ mode });
    if (accessToken) params.set('access', accessToken);
    params.set('kiosk', '1');
    window.open(`/evento/espejo-magico/${fiestaId}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const handleOperatorStart = async () => {
    setErrorMsg(null);
    const now = new Date().toISOString();
    const result = await startEntertainmentSession(
      fiestaId,
      moduleId,
      { mode, operatorName: fiesta?.station.operatorName, stationTitle: modeCopy.title },
      accessToken
    );

    if (result.success) {
      setSession({
        fiestaId,
        moduleId,
        status: 'countdown',
        timestamp: now,
        lastUpdated: now,
        settings: { mode, operatorName: fiesta?.station.operatorName, stationTitle: modeCopy.title },
      });
    } else {
      setErrorMsg(result.error || 'No se pudo disparar el espejo.');
    }
  };

  const handleOperatorReset = async () => {
    setErrorMsg(null);
    const now = new Date().toISOString();
    const result = await resetEntertainmentSession(fiestaId, moduleId, accessToken);
    if (result.success) {
      setSession({
        fiestaId,
        moduleId,
        status: 'idle',
        timestamp: now,
        lastUpdated: now,
      });
    } else {
      setErrorMsg(result.error || 'No se pudo reiniciar el espejo.');
    }
  };

  // 5. Operator View
  if (isEventLoading || !fiesta) {
    return <PublicEntertainmentEventStatus isLoading={isEventLoading} error={errorMsg} />;
  }

  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#18181b_0%,_#09090b_70%)] text-white p-4 sm:p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Cabina operador</p>
              <h1 className="text-lg font-black tracking-widest text-rose-500 uppercase flex items-center gap-2">
                <Radio className="w-5 h-5 animate-pulse text-rose-500" /> {modeCopy.title}
              </h1>
            </div>
            <div className="w-9" />
          </div>

          {/* Aviso antes de que llegue el primer invitado: si la IA no esta
              disponible, la estacion devuelve la foto sin transformar y el
              invitado se lleva una foto comun creyendo que es su avatar. */}
          <AvisoDeFallaEnEstacion mensaje={session?.lastError} cuando={session?.lastErrorAt} />

          {mode === 'ia' && iaDisponible === false && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4" role="alert">
              <p className="text-sm font-black text-amber-300">La transformacion con IA no esta disponible</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                La estacion funciona igual, pero va a entregar la foto sin transformar. Avisale al
                equipo antes de abrir la fila: el invitado elige un estilo y recibe su foto comun.
              </p>
            </div>
          )}

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Evento</p>
                <p className="mt-1 text-sm font-bold text-white">{fiesta?.eventName || 'Evento AK'}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Modo</p>
                <p className="mt-1 text-sm font-bold text-white">{modeCopy.eyebrow}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pantalla</p>
                <div className="mt-1 flex items-center gap-2">
                  <Radio className={`h-4 w-4 ${session?.status && session.status !== 'idle' ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                  <span className="text-sm font-bold capitalize text-white">{session?.status || 'Sin conectar'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-sm font-semibold text-rose-100">{modeCopy.subtitle}</p>
              <p className="mt-2 text-xs text-rose-100/70">
                Pantalla: {fiesta?.station.deviceName || 'sin dispositivo'} | Ubicación: {fiesta?.station.location || 'sin asignar'}
              </p>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
                {errorMsg}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr]">
              <button
                onClick={handleOperatorStart}
                disabled={session?.status && session.status !== 'idle' && session.status !== 'done'}
                className="h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-base uppercase tracking-wide shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all"
              >
                <Zap className="w-6 h-6 fill-white" />
                {modeCopy.operatorCta}
              </button>

              <button
                onClick={openDisplayScreen}
                className="h-16 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-base uppercase tracking-wide transition hover:bg-white/10 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" />
                Abrir pantalla
              </button>

              <button
                onClick={handleOperatorReset}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm border border-white/5 transition flex items-center justify-center gap-2 sm:col-span-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar Espejo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display View UI
  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-zinc-950/90 to-transparent pb-8 pt-safe">
        <button type="button" onClick={() => router.back()} aria-label="Volver" title="Volver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">{modeCopy.eyebrow}</p>
          <h1 className="text-sm font-black uppercase tracking-widest text-rose-500">{modeCopy.title}</h1>
          {fiesta && <p className="text-xs font-semibold text-zinc-300">{fiesta.eventName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {localStatus === 'idle' && !capturedImage && !errorMsg && fiesta && (
            <>
              <button
                type="button"
                onClick={() => setVoiceEnabled(v => !v)}
                aria-label={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition ${voiceEnabled ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/10 text-white'}`}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => setWatermarkEnabled(w => !w)}
                aria-label={watermarkEnabled ? 'Quitar marca del evento' : 'Agregar marca del evento'}
                title={watermarkEnabled ? 'Quitar marca del evento' : 'Agregar marca del evento'}
                className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition ${watermarkEnabled ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-white/10 text-white'}`}
              >
                <FileImage className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} aria-label="Cambiar camara" title="Cambiar camara" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20">
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* VIEWPORT */}
      <div
        className="relative m-2 flex-1 w-auto overflow-hidden rounded-lg border-4 border-zinc-800 bg-zinc-900"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {errorMsg ? (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950 p-6 text-center">
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-white">No pudimos subir la foto</h3>
              <p className="mt-3 font-medium text-red-300">{errorMsg}</p>
              <p className="mt-2 text-sm text-zinc-400">El recuerdo sigue en esta pantalla y no mostramos un QR inválido.</p>
              {capturedImage && (
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      void handleUpload(capturedImage);
                    }}
                    className="h-12 rounded-lg bg-rose-600 px-4 font-black text-white hover:bg-rose-500"
                  >
                    Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="h-12 rounded-lg bg-white px-4 font-black text-zinc-950 hover:bg-zinc-200"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={retake}
                    className="h-12 rounded-lg border border-white/15 bg-white/5 px-4 font-bold text-white hover:bg-white/10"
                  >
                    Otra foto
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : localStatus === 'idle' && !capturedImage ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover opacity-40 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            <div className="absolute inset-0 flex touch-pan-y flex-col items-center overflow-y-auto bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-zinc-950/80 px-4 pb-8 pt-24 text-center">
              <div className="relative z-10 my-auto w-full max-w-sm space-y-4 sm:space-y-6">
                {mode === 'ia' && (
                  <div className="w-full space-y-3 text-left bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-rose-500/30">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> 1. Elegí tu Estilo IA
                      </p>
                      <span
                        data-testid="selected-ai-style"
                        className="text-[10px] text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full font-bold"
                      >
                        {ESPEJO_TEMPLATES[selectedTemplateId]?.label || 'K-Pop Star'}
                      </span>
                    </div>

                    {/* Category Tabs */}
                    <div
                      className="hide-scrollbar flex touch-pan-x gap-1.5 overflow-x-auto pb-1"
                      aria-label="Categorías de estilos IA"
                    >
                      {categoriasHabilitadas.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => selectAiCategory(cat.id)}
                          aria-pressed={selectedCategory === cat.id}
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                            selectedCategory === cat.id
                              ? 'bg-rose-500 text-white shadow-md'
                              : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Template Pills Grid */}
                    <div
                      className="grid max-h-36 touch-pan-y grid-cols-2 gap-1.5 overflow-y-auto pr-1"
                      aria-label="Estilos IA disponibles"
                    >
                      {plantillasHabilitadas
                        .filter((t) => t.categoryId === selectedCategory)
                        .map((template) => {
                          const isSelected = selectedTemplateId === template.id;
                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              aria-pressed={isSelected}
                              className={`p-2 rounded-xl text-left border transition-all ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-500/25 text-white font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                                  : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                              }`}
                            >
                              <p className="text-xs font-extrabold truncate">{template.label}</p>
                            </button>
                          );
                        })}
                    </div>

                    <label className="flex cursor-pointer items-start gap-2.5 pt-2 border-t border-white/10 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={consentAccepted}
                        onChange={(event) => setConsentAccepted(event.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-rose-500 shrink-0"
                      />
                      <span>
                        {mode === 'ia'
                          ? 'Acepto el procesamiento temporal de mi foto para generar la transformación con IA.'
                          : 'Acepto que mi foto se muestre en la pantalla de la fiesta.'}
                      </span>
                    </label>
                  </div>
                )}
                {hayQuePedirPermiso && mode !== 'ia' && (
                  <label className="flex w-full cursor-pointer items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-black/60 p-4 text-left text-xs text-zinc-200 backdrop-blur-md">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(event) => setConsentAccepted(event.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-rose-500 shrink-0"
                    />
                    <span>Acepto que mi foto se muestre en la pantalla de la fiesta.</span>
                  </label>
                )}

                <button
                  onClick={takePhoto}
                  disabled={(mode === 'ia' || hayQuePedirPermiso) && !consentAccepted}
                  className="mx-auto flex h-36 w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg bg-rose-500 text-white font-black uppercase tracking-wide transition hover:bg-rose-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  <Camera className="h-9 w-9" />
                  <span className="px-4 text-center text-sm font-black leading-tight">{modeCopy.start}</span>
                </button>

                <div className="space-y-3 text-zinc-300">
                  <p className="text-sm font-semibold leading-relaxed">{modeCopy.subtitle}</p>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">1 Prepara</span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">2 Captura</span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">3 Revisa</span>
                  </div>
                  <p className="text-xs text-zinc-500">También puede dispararlo el operador de cabina.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {!capturedImage && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                style={{ filter: selectedFilter.css }}
              />
            )}
            {capturedImage && (
              mode === 'ia' && aiImageBase64 && originalPhotoUrl ? (
                <div
                  className="absolute inset-0 w-full h-full select-none overflow-hidden touch-none"
                  onPointerMove={(e) => {
                    if (isDraggingSlider) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      setSliderPosition(x);
                    }
                  }}
                  onPointerUp={() => setIsDraggingSlider(false)}
                  onPointerLeave={() => setIsDraggingSlider(false)}
                >
                  {/* Base: Original captured image */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- Runtime camera output uses data/blob URLs. */}
                  <img
                    src={originalPhotoUrl}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                    alt="Antes"
                  />
                  {/* Top Layer: AI Image with clipPath */}
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Runtime AI output uses a data URL. */}
                    <img
                      src={aiImageBase64}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="Después"
                    />
                  </div>

                  {/* Before / After labels */}
                  <div className="absolute top-4 left-4 z-30 px-2 py-1 rounded-full bg-cyan-500/90 text-[9px] font-black uppercase tracking-wider text-white">
                    IA
                  </div>
                  <div className="absolute top-4 right-4 z-30 px-2 py-1 rounded-full bg-zinc-700/90 text-[9px] font-black uppercase tracking-wider text-white">
                    ANTES
                  </div>

                  {/* Slider line handle */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize z-20 shadow-[0_0_10px_#22d3ee]"
                    style={{ left: `${sliderPosition}%` }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setIsDraggingSlider(true);
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center shadow-lg">
                      <span className="text-[10px] text-zinc-950 font-black">&lt;-&gt;</span>
                    </div>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={capturedImage} className="absolute inset-0 w-full h-full object-cover" alt="Captura" />
              )
            )}
            {capturedImage && localStatus !== 'done' && mode !== 'foto' && (
              <canvas
                ref={drawingCanvasRef}
                className="absolute inset-0 w-full h-full z-[15] touch-none bg-transparent"
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={endDrawing}
                onPointerLeave={endDrawing}
              />
            )}
          </>
        )}

        {/* State: AI Processing Loader */}
        {aiProcessing && (
          <div className="absolute inset-0 z-[45] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6">
            <div className="relative w-72 aspect-[9/16] bg-black rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-6">
              {/* Laser scanning overlay line */}
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20"
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- Runtime camera output uses a data/blob URL. */}
              <img src={originalPhotoUrl || ''} className="w-full h-full object-cover opacity-60 filter grayscale" alt="Escaneo" />
            </div>

            <div className="space-y-4 max-w-xs text-center">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-2" />
              <h3 className="text-xl font-black uppercase text-cyan-400 tracking-wider">Procesando Face Swap IA</h3>

              <div className="h-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={aiStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-xs text-zinc-300 font-bold tracking-wide uppercase leading-normal"
                  >
                    {aiStep === 'detecting' && 'Detectando rostro y contorno facial...'}
                    {aiStep === 'aligning' && 'Mapeando puntos de referencia...'}
                    {aiStep === 'gemini' && 'Fusionando iluminacion y sombras con Gemini...'}
                    {aiStep === 'rendering' && 'Renderizando retrato digital en alta definicion...'}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
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

        {/* State: Processing */}
        {localStatus === 'processing' && (
          <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-16 h-16 text-rose-500 animate-spin mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">{fiesta?.socialWallEnabled ? 'Subiendo foto al muro...' : 'Guardando foto...'}</h3>
          </div>
        )}

        {/* State: Done (Photo Preview + QR Download) */}
        {localStatus === 'done' && capturedImage && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start gap-6 overflow-y-auto overscroll-contain bg-zinc-950 px-4 pb-8 pt-20 md:flex-row md:justify-center md:gap-8 md:p-6">
            {/* Captured image with overlay merged */}
            <div className="relative h-[52dvh] max-h-[32rem] w-auto max-w-full shrink-0 aspect-[9/16] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl md:h-[80dvh] md:max-h-[48rem]">
              {/* eslint-disable-next-line @next/next/no-img-element -- Canvas output is generated only in this browser. */}
              <img src={canvasRef.current?.toDataURL('image/jpeg', 0.9) || capturedImage} className="w-full h-full object-cover" alt="Espejo Final" />
              <div className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider">
                {modeCopy.doneLabel}
              </div>
            </div>

            {/* QR sharing code */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Escanea tu recuerdo</h3>
                <p className="text-sm text-zinc-400">Usá este código QR con tu celular para descargarlo o compartirlo.</p>
              </div>

              {/* QR Container */}
              <div className="bg-white p-4 rounded-3xl shadow-2xl relative">
                <QrRecuerdo qrCodeUrl={qrCodeUrl} error={errorMsg} />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleImprimir}
                  className="w-full h-14 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" /> Imprimir mi foto
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Guardar en el celular
                </button>
                {fiesta?.station.allowGuestRetake && fiesta.station.maxRetakes > 0 && (
                  <button
                    onClick={retake}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Tomar Otra Foto
                  </button>
                )}
                {role !== 'operator' && (
                  <div className="pt-2 flex flex-col items-center gap-1.5 border-t border-white/10 w-full text-center">
                    <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Esto lo hizo AK Producciones</span>
                    </div>
                    <a
                      href={`https://wa.me/59898355530?text=${encodeURIComponent(
                        `¡Hola AK Producciones! Me saqué una foto en el Espejo Mágico de la fiesta de ${fiesta?.eventName || 'un evento'} y me encantó. Quería consultarles para mi propio evento.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Escribinos por WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STICKER PANEL */}
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
                <button key={emoji} onClick={() => addSticker(emoji)} className="text-4xl hover:scale-125 transition-transform">
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM CONTROLS */}
      {(mode !== 'ia' || localStatus !== 'idle' || capturedImage) && (
        <div className="h-[200px] shrink-0 pb-safe z-20 flex flex-col justify-end bg-zinc-950">
        {localStatus === 'idle' && !capturedImage ? (
          <>
              {/* Filter Selector */}
              <div className="flex overflow-x-auto gap-3 px-4 py-3 hide-scrollbar">
                {FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f)}
                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap border
                      ${selectedFilter.id === f.id ? 'border-rose-500 bg-rose-500/20 text-rose-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between px-8 pb-6">
                <button
                  onClick={() => setShowStickerPanel(true)}
                  aria-label="Agregar stickers"
                  disabled={countdown !== null}
                  className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 transition animate-pulse"
                >
                  <SmilePlus className="w-6 h-6 text-rose-400 shrink-0" />
                </button>

                <button
                  onClick={takePhoto}
                  aria-label="Tomar fotografía"
                  disabled={countdown !== null || !!errorMsg}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-1.5 shadow-[0_0_30px_rgba(244,63,94,0.2)] transition-transform active:scale-95 disabled:opacity-50"
                >
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-rose-500">
                    <Camera className="w-8 h-8 shrink-0" />
                  </div>
                </button>

                <div className="w-14" />
              </div>
          </>
        ) : capturedImage && localStatus !== 'done' ? (
          /* Drawing / Review Controls */
          <div className="flex flex-col gap-3 px-6 pb-6 pt-2">
            <p className="text-center text-xs font-semibold text-zinc-400">{fiesta?.socialWallEnabled ? modeCopy.review : modeCopy.reviewStandalone}</p>
            {/* Color Palette Selector for Drawing */}
            {mode !== 'foto' && (
              <div className="flex justify-center items-center gap-4 py-2 border-b border-zinc-900">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-2">Color Pincel:</span>
                <div className="flex gap-3">
                  {DRAW_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setDrawColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-95
                        ${drawColor === c.value ? 'border-white scale-110' : 'border-transparent opacity-70'}`}
                      style={{ backgroundColor: c.value, boxShadow: drawColor === c.value ? `0 0 10px ${c.value}` : 'none' }}
                      title={c.label}
                    />
                  ))}
                </div>
                <button
                  onClick={clearDrawing}
                  className="ml-auto text-[10px] font-black uppercase border border-zinc-800 bg-zinc-900 text-zinc-400 px-3 py-1.5 rounded-full hover:text-white"
                >
                  Limpiar
                </button>
              </div>
            )}

            <div className="flex items-center justify-around">
              <button onClick={retake} className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Repetir</span>
              </button>

              <button
                onClick={() => handleUpload()}
                disabled={isUploading}
                className="flex flex-col items-center gap-2 text-white hover:text-rose-400 transition"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 shadow-[0_0_30px_rgba(244,63,94,0.3)] flex items-center justify-center">
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8 ml-1" />}
                </div>
                <span className="text-sm font-black uppercase tracking-wide">{fiesta?.socialWallEnabled ? 'Subir al Muro' : 'Guardar Foto'}</span>
              </button>

              <button onClick={handleDownload} className="flex flex-col items-center gap-2 text-zinc-400 hover:text-white transition">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Download className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Guardar</span>
              </button>
            </div>
          </div>
        ) : null}
        </div>
      )}

      {showKioskUnlock && <KioskUnlockButton />}
      <SyncStatusIndicator
        fiestaId={fiestaId}
        moduleId={moduleId}
        accessToken={accessToken}
        guestId={guestId}
        guestAccessToken={guestAccessToken}
      />
    </div>
  );
}
