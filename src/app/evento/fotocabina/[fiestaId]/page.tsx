'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  SwitchCamera,
  Download,
  Send,
  ArrowLeft,
  Loader2,
  PartyPopper,
  RefreshCw,
  Volume2,
  VolumeX,
  FileImage,
  Radio,
  Zap,
  Check,
  Printer,
  Share2,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { QrRecuerdo } from '@/components/entretenimiento/QrRecuerdo';
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
  EntertainmentSession,
} from '@/app/actions/fiesta/sesion-entretenimiento';
import type { PublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import { PublicEntertainmentEventStatus } from '@/components/entertainment/public-entertainment-event-status';
import { KioskUnlockButton } from '@/components/kiosk/kiosk-unlock-button';
import { isVideoFrameReady } from '@/lib/entertainment/camera-readiness';
import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { QuinceaneraLeadPrompt } from '@/components/public/QuinceaneraLeadPrompt';
import { saveOfflineMedia } from '@/lib/offline/offline-db';
import { SyncStatusIndicator } from '@/components/offline/sync-status-indicator';
import {
  componerTiraDeFotos,
  FOTOS_POR_TANDA,
  SEGUNDOS_PRIMERA_FOTO,
  GUIA_POR_FOTO,
} from '@/lib/entretenimiento/tira-fotocabina';
import { imprimirRecuerdo } from '@/lib/entretenimiento/imprimir-recuerdo';
import { waitForInitialPublicLoad } from '@/lib/public-experience/wait-for-initial-public-load';
import { parseEventDate } from '@/lib/public-experience/event-date';
import { aplicarFiltroBelleza } from '@/lib/entretenimiento/filtro-belleza';
import {
  obtenerModosCapturaHabilitados,
  obtenerDimensionesPorOrientacion,
  METADATOS_MODOS_CAPTURA,
} from '@/lib/entretenimiento/modos-captura';
import {
  aplicarChromaKey,
  procesarFondoCanvas,
  type OpcionFondo,
} from '@/lib/entretenimiento/segmentacion-fondo';

const FRAMES = [
  { id: 'none', label: 'Sin Marco', bg: 'transparent' },
  { id: 'golden', label: 'Dorado', bg: 'border-[16px] border-amber-400/80 rounded-3xl' },
  { id: 'neon', label: 'Neón', bg: 'border-[12px] border-purple-500/80 shadow-[inset_0_0_20px_#a855f7] rounded-3xl' },
  { id: 'flowers', label: 'Flores', bg: 'border-[16px] border-pink-400/80 rounded-3xl' },
  { id: 'ak_brand', label: 'AK Brand', bg: 'border-b-[40px] border-zinc-900 rounded-b-3xl' },
];

export default function FotocabinaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = params.fiestaId as string;
  const role = searchParams.get('role') || 'display'; // 'display' | 'operator'
  const accessToken = searchParams.get('access') || undefined;
  const guestId = searchParams.get('guestId') || undefined;
  const guestAccessToken = searchParams.get('guestAccessToken') || searchParams.get('token') || undefined;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const takePhotoRef = useRef<() => void>(() => undefined);
  const retakeRef = useRef<() => void>(() => undefined);
  const localStatusRef = useRef<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');

  const [fiesta, setFiesta] = useState<PublicEntertainmentEvent | null>(null);
  const [isEventLoading, setIsEventLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [fondoVirtual, setFondoVirtual] = useState<OpcionFondo>({ id: 'ninguno', nombre: 'Sin fondo', tipo: 'ninguno' });
  const imagenFondoRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (fiesta?.imagenFondoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = fiesta.imagenFondoUrl;
      img.onload = () => {
        imagenFondoRef.current = img;
      };
    } else {
      imagenFondoRef.current = null;
    }
  }, [fiesta?.imagenFondoUrl]);

  // Bucle de vista previa en vivo sobre el canvas de espera y countdown
  useEffect(() => {
    let animId: number;
    const renderLivePreview = () => {
      const video = videoRef.current;
      const canvas = previewCanvasRef.current;
      if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          procesarFondoCanvas({
            canvasDestino: canvas,
            videoOrigen: video,
            fondoSeleccionado: fondoVirtual,
            imagenFondo: fondoVirtual.tipo === 'imagen' ? imagenFondoRef.current : null,
            toleranciaChroma: 90,
          });
          ctx.restore();
        }
      }
      animId = requestAnimationFrame(renderLivePreview);
    };
    animId = requestAnimationFrame(renderLivePreview);
    return () => cancelAnimationFrame(animId);
  }, [fondoVirtual, facingMode]);

  // Sync
  const [session, setSession] = useState<EntertainmentSession | null>(null);
  const [localStatus, setLocalStatus] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'done'>('idle');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Tanda de fotos, como las cabinas clasicas: se sacan varias seguidas y
  // recien al final se arma el recuerdo con todas juntas.
  const [fotosDeLaTanda, setFotosDeLaTanda] = useState<string[]>([]);
  const [fotoEnCurso, setFotoEnCurso] = useState(0);
  const fotosDeLaTandaRef = useRef<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  // Marca que la copia automatica ya salio, para que no se dispare dos veces
  // al volver a dibujarse la pantalla y para poder ofrecer "otra copia".
  const [yaSeImprimio, setYaSeImprimio] = useState(false);
  // Cantidad de copias que el operador pidió. Se pasa a imprimirRecuerdo.
  const copias = Math.max(1, Math.min(10, fiesta?.station.fotosPorTanda ?? 1));

  // Si el cliente no contrato el muro, el recuerdo no tiene a donde subir: la
  // cabina lo imprime ahi mismo en vez de dejar al invitado con las manos vacias.
  const hayMuro = fiesta?.socialWallEnabled !== false;

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
      const cameraError = 'No se pudo acceder a la cámara. Por favor, revisa los permisos del navegador.';
      setErrorMsg(cameraError);
      void updateEntertainmentSessionStatus(
        fiestaId,
        'fotocabina',
        'idle',
        { lastError: cameraError },
        accessToken,
      ).catch((statusError) => console.error('No se pudo avisar la falla de cámara al operador:', statusError));
    }
  }, [accessToken, facingMode, fiestaId, stopCamera]);

  // 1. Load details
  useEffect(() => {
    let active = true;
    setFiesta(null);
    setErrorMsg(null);
    setIsEventLoading(true);
    const loadTask = getPublicEntertainmentEvent(fiestaId, 'fotocabina', accessToken)
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
  }, [accessToken, fiestaId]);

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
        const s = await getEntertainmentSession(fiestaId, 'fotocabina', accessToken);
        setSession(s);

        const currentStatus = localStatusRef.current;
        if (role === 'display' && s && s.status !== currentStatus) {
          if (s.status === 'countdown' && currentStatus === 'idle') {
            const frameToUse = s.settings?.frameId || 'none';
            setSelectedFrame(frameToUse);
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
  }, [accessToken, fiestaId, role, stopCamera]);

  // 2. Camera controller for display
  useEffect(() => {
    if (fiesta && role === 'display' && (localStatus === 'idle' || localStatus === 'countdown' || localStatus === 'recording')) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [fiesta, localStatus, role, startCamera, stopCamera]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // 3. Capture workflow
  // Arranca la tanda desde cero. Cada disparo encadena el siguiente hasta
  // completar las tres fotos, y recien ahi se arma el recuerdo.
  const takePhoto = async () => {
    fotosDeLaTandaRef.current = [];
    setFotosDeLaTanda([]);
    setFotoEnCurso(1);
    await correrCuentaRegresiva(1);
  };

  const correrCuentaRegresiva = async (numeroDeFoto = 1) => {
    setLocalStatus('countdown');
    if (role === 'display') {
      await updateEntertainmentSessionStatus(fiestaId, 'fotocabina', 'countdown', {}, accessToken);
    }

    // La primera cuenta es larga para que se acomoden; despues se acorta para
    // no hacer cola.
    const primerConteo = fiesta?.station.segundosCuentaRegresiva || SEGUNDOS_PRIMERA_FOTO;
    let currentCount = numeroDeFoto === 1
      ? primerConteo
      : (fiesta?.station.countdownSeconds || 4);
    setCountdown(currentCount);
    playBeep();
    speak(GUIA_POR_FOTO[numeroDeFoto - 1] || '¡Preparate!');

    const interval = setInterval(async () => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playBeep();
        // Solo se cantan los ultimos cinco numeros: contar en voz alta desde
        // diez es cansador y tapa la musica del salon.
        if (currentCount <= 5) speak(String(currentCount));
      } else {
        clearInterval(interval);
        setCountdown(null);
        playBeep(1200, 0.3); // High beep for capture
        speak("¡Sonríe!");
        captureToCanvas();
      }
    }, 1000);
  };

  const captureToCanvas = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!isVideoFrameReady(videoRef.current)) {
      setErrorMsg('La camara todavia se esta preparando. Intenta nuevamente en un instante.');
      setLocalStatus('idle');
      return;
    }

    /**
     * PRIMERO SE SACA LA FOTO. El aviso a la base viene despues.
     *
     * Antes esto estaba al reves: se avisaba a la base y se esperaba la
     * respuesta, y recien despues se leia la camara. En ese rato la pantalla ya
     * habia cambiado de estado, el recuadro de la camara se habia ido del DOM, y
     * la linea siguiente reventaba con `Cannot read properties of null (reading
     * 'videoWidth')`. **La fotocabina quedaba en negro**: el invitado apretaba,
     * la pantalla se apagaba y no salia ninguna foto.
     *
     * Se vio abriendo la fotocabina en un navegador y disparando la tanda. En el
     * codigo no se veia: el control de arriba comprueba que la camara este, pero
     * la comprobacion valia para el instante anterior a la espera.
     */
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    setLocalStatus('recording');
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    if (fondoVirtual && fondoVirtual.tipo !== 'ninguno') {
      procesarFondoCanvas({
        canvasDestino: canvas,
        videoOrigen: video,
        fondoSeleccionado: fondoVirtual,
        imagenFondo: fondoVirtual.tipo === 'imagen' ? imagenFondoRef.current : null,
        toleranciaChroma: 90,
      });
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Aplicar filtros configurados de la estación
    if (fiesta?.station.enableBeautyFilter) {
      aplicarFiltroBelleza(ctx, canvas.width, canvas.height);
    }
    if (fiesta?.station.enableChromaKey) {
      aplicarChromaKey(ctx, canvas.width, canvas.height);
    }

    // El marco va en cada foto; el nombre del evento no, porque en el recuerdo
    // final va una sola vez abajo y repetirlo tres veces queda cargado.
    drawFrameOverlay(ctx, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Con la foto ya sacada, se le avisa a la base. Si la base tarda o falla, la
    // foto ya esta: el invitado no pierde su recuerdo por un problema de red.
    void updateEntertainmentSessionStatus(fiestaId, 'fotocabina', 'recording', {}, accessToken);

    const tanda = [...fotosDeLaTandaRef.current, dataUrl];
    fotosDeLaTandaRef.current = tanda;
    setFotosDeLaTanda(tanda);

    const limiteFotos = fiesta?.station.fotosPorTanda || FOTOS_POR_TANDA;

    if (tanda.length < limiteFotos) {
      // Todavia faltan fotos: se muestra la que salio un instante y sigue la
      // tanda sola, sin que el invitado tenga que tocar nada.
      const siguiente = tanda.length + 1;
      setFotoEnCurso(siguiente);
      // Se queda en 'countdown' sin numero: sigue viendose la camara y la guia
      // mientras el invitado cambia la pose. Si se pasa a otro
      // estado, la pantalla queda en negro entre foto y foto.
      setLocalStatus('countdown');
      setCountdown(null);
      setTimeout(() => { void correrCuentaRegresiva(siguiente); }, 1800);
      return;
    }

    stopCamera();
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(fiestaId, 'fotocabina', 'processing', {}, accessToken);

    try {
      const recuerdo = await componerTiraDeFotos({
        fotos: tanda,
        nombreDelEvento: fiesta?.eventName || '',
        nombreHomenajeado: fiesta?.nombreAgasajado || '',
        motivoDelEvento: fiesta?.tipoCelebracion || '',
        fechaDelEvento: fiesta?.eventDate || '',
        colorDeAcento: fiesta?.primaryColor || fiesta?.station.accentColor || '#d97706',
        colorFondo: fiesta?.colorFondo,
        imagenFondoUrl: fiesta?.imagenFondoUrl,
        textoDeMarca: watermarkEnabled ? (fiesta?.station.brandText || 'AK Producciones') : undefined,
      });
      setCapturedImage(recuerdo);
    } catch (err) {
      // Si el armado falla, al menos queda la ultima foto: peor es dejar al
      // invitado sin nada despues de haberse sacado las fotos.
      setCapturedImage(dataUrl);
      setErrorMsg('No se pudo armar la tira con las fotos. Queda la última.');
    }

    setLocalStatus('done');
    await updateEntertainmentSessionStatus(
      fiestaId,
      'fotocabina',
      'done',
      { reviewPending: true },
      accessToken
    );
  };

  /**
   * Sin muro contratado no hay a donde subir: se imprime en la cabina. Se abre
   * una ventana con la hoja sola para no arrastrar la pantalla del kiosco a la
   * impresora.
   */
  const handleImprimir = (esAutomatica = false) => {
    if (!capturedImage) return;
    setIsPrinting(true);
    setYaSeImprimio(true);
    try {
      const resultado = imprimirRecuerdo(capturedImage, copias);
      if (!resultado.ok) {
        setErrorMsg(resultado.aviso || 'No se pudo mandar a imprimir.');
        return;
      }
      speak('Tu recuerdo se esta imprimiendo');
      // Solo la copia automatica reinicia la cabina. Si el invitado pide otra
      // copia, la pantalla se queda donde esta para que pueda pedir mas.
      if (esAutomatica) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          retake();
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
      }
    } catch (err) {
      setErrorMsg('No se pudo mandar a imprimir. Avisá al operador.');
    } finally {
      setIsPrinting(false);
    }
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
    } else if (selectedFrame === 'ak_brand') {
      ctx.fillStyle = 'rgba(24, 24, 27, 0.9)';
      ctx.fillRect(0, h - 120, w, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AK PRODUCCIONES', w / 2, h - 45);
    }
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!watermarkEnabled) return;

    const eventName = fiesta?.eventName || 'Nuestra Fiesta';
    const rawDate = fiesta?.eventDate;
    let eventDateStr = '';
    if (rawDate) {
      try {
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

  const handleAcceptAndPublish = async () => {
    if (!canvasRef.current) return;
    setLocalStatus('processing');
    await updateEntertainmentSessionStatus(
      fiestaId,
      'fotocabina',
      'processing',
      {},
      accessToken
    );
    setIsUploading(true);
    speak("Subiendo tu foto al muro");

    try {
      const blob = await new Promise<Blob | null>(resolve => canvasRef.current!.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Error al generar la imagen');

      const fileName = `fotocabina-${Date.now()}.jpg`;

      // Si estamos sin conexión, guardar directamente en IndexedDB
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        try {
          await saveOfflineMedia({
            fiestaId,
            moduleId: 'fotocabina',
            fileBlob: blob,
            fileName,
            mimeType: 'image/jpeg',
            authorName: 'Fotocabina AK',
            guestId,
            guestAccessToken,
            accessToken,
          });
        } catch (errorAlGuardar: any) {
          // Si el aparato se queda sin lugar, la foto NO se guardo. Antes el
          // error caia en el aviso general de "no se pudo subir", y el invitado
          // se iba creyendo que su foto estaba esperando internet: se perdia sin
          // que nadie se enterara. Hay que decirlo con todas las letras.
          const sinEspacio =
            errorAlGuardar?.name === 'QuotaExceededError' ||
            /quota|space|storage/i.test(String(errorAlGuardar?.message || ''));
          setErrorMsg(
            sinEspacio
              ? 'Esta computadora se quedo sin lugar para guardar fotos. Avisale al encargado: hay que subir las que estan esperando antes de sacar mas.'
              : 'No se pudo guardar la foto en esta computadora. Avisale al encargado antes de seguir.'
          );
          setLocalStatus('idle');
          return;
        }

        setQrCodeUrl('');
        setLocalStatus('done');
        speak("¡Excelente! Tu foto quedó guardada y se subirá apenas vuelva la señal.");
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          retake();
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
        return;
      }

      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('fiestaId', fiestaId);
      formData.append('file', file);
      formData.append('authorName', 'Fotocabina AK');
      formData.append('moduleId', 'fotocabina');
      if (accessToken) formData.append('accessToken', accessToken);
      if (guestId) formData.append('guestId', guestId);
      if (guestAccessToken) formData.append('guestAccessToken', guestAccessToken);

      const res = await uploadEntretenimientoMedia(formData);
      if (res.success) {
        const mediaUrl = res.media?.url || '';
        setQrCodeUrl(mediaUrl);
        setLocalStatus('done');
        await updateEntertainmentSessionStatus(
          fiestaId,
          'fotocabina',
          'done',
          { mediaUrl, reviewPending: false, lastError: null },
          accessToken
        );
        speak("¡Excelente! Tu foto ya está lista.");
        setShowSuccess(true);

        // Auto reset after 12 seconds
        setTimeout(() => {
          setShowSuccess(false);
          retake();
        }, (fiesta?.station.reviewSeconds || 20) * 1000);
      } else {
        throw new Error(res.error || 'Error al subir');
      }
    } catch (err) {
      console.warn('[Fotocabina] Falla en subida directa, encolando en IndexedDB...', err);
      // Respaldo en IndexedDB ante cualquier error de red durante la subida
      try {
        const blob = await new Promise<Blob | null>(resolve => canvasRef.current?.toBlob(resolve, 'image/jpeg', 0.9));
        if (blob) {
          await saveOfflineMedia({
            fiestaId,
            moduleId: 'fotocabina',
            fileBlob: blob,
            fileName: `fotocabina-${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
            authorName: 'Fotocabina AK',
            guestId,
            guestAccessToken,
            accessToken,
          });
          speak("Tu foto quedó guardada y se subirá cuando vuelva la señal.");
          setLocalStatus('done');
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            retake();
          }, (fiesta?.station.reviewSeconds || 20) * 1000);
          return;
        }
      } catch (fallbackErr) {
        console.error('[Fotocabina] Error al encolar en IndexedDB:', fallbackErr);
      }

      setQrCodeUrl('');
      setErrorMsg((err as Error).message || 'No se pudo subir la foto. Puedes descargarla en este dispositivo.');
      setLocalStatus('done');
      await updateEntertainmentSessionStatus(
        fiestaId,
        'fotocabina',
        'done',
        { lastError: 'No se pudo subir la foto del invitado al muro.' },
        accessToken
      );
      speak("No se pudo subir al muro, pero puedes guardarla");
    } finally {
      setIsUploading(false);
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

  const retake = () => {
    setCapturedImage(null);
    setQrCodeUrl('');
    setLocalStatus('idle');
    setShowSuccess(false);
    // La tanda se rehace entera: si se dejan las fotos viejas, la proxima
    // vuelve con cuatro o cinco pegadas.
    fotosDeLaTandaRef.current = [];
    setFotosDeLaTanda([]);
    setFotoEnCurso(0);
    setYaSeImprimio(false);
    void completeEntertainmentSessionCycle(fiestaId, 'fotocabina', accessToken);
    if (role === 'display') {
      startCamera();
    }
  };

  useEffect(() => {
    takePhotoRef.current = () => { void takePhoto(); };
    retakeRef.current = retake;
  });

  // Impresion automatica: apenas el recuerdo esta armado sale la copia, sin
  // que el invitado tenga que apretar nada. Asi funcionan las cabinas del
  // rubro. Solo corre en la pantalla del invitado, nunca en la del operador,
  // que si no imprimiria dos veces la misma tanda.
  useEffect(() => {
    if (role !== 'display') return;
    if (localStatus !== 'done') return;
    if (!capturedImage || yaSeImprimio) return;
    if (fotosDeLaTanda.length < FOTOS_POR_TANDA) return;
    handleImprimir(true);
    // handleImprimir se recrea en cada dibujo; alcanza con mirar el recuerdo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturedImage, localStatus, role, yaSeImprimio, fotosDeLaTanda.length]);

  const handleOperatorStart = async () => {
    setErrorMsg(null);
    const result = await startEntertainmentSession(
      fiestaId,
      'fotocabina',
      {
        frameId: selectedFrame,
        countdownSeconds: fiesta?.station.countdownSeconds || 4,
        operatorName: fiesta?.station.operatorName,
      },
      accessToken
    );
    if (!result.success) setErrorMsg(result.error || 'No se pudo disparar la fotocabina.');
  };

  const handleOperatorReset = async () => {
    setErrorMsg(null);
    const result = await resetEntertainmentSession(fiestaId, 'fotocabina', accessToken);
    if (!result.success) setErrorMsg(result.error || 'No se pudo reiniciar la fotocabina.');
  };

  if (isEventLoading || !fiesta) {
    return <PublicEntertainmentEventStatus isLoading={isEventLoading} error={errorMsg} />;
  }

  // 4. Operator view
  if (role === 'operator') {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 text-white sm:p-6">
        <div className="mx-auto max-w-md space-y-5">
          <AvisoDeFallaEnEstacion mensaje={session?.lastError} cuando={session?.lastErrorAt} />
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button onClick={() => router.back()} aria-label="Volver" title="Volver" className="rounded-lg p-2 transition hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-amber-300">
              <Radio className="h-5 w-5 text-amber-300 motion-safe:animate-pulse" /> Operador de fotocabina
            </h1>
            <div className="w-9" />
          </div>

          <div className="space-y-5 rounded-lg border border-white/10 bg-zinc-900 p-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estado de la Fotocabina</p>
              <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/30 px-4 py-3">
                <Radio className={`w-5 h-5 ${session?.status === 'idle' ? 'text-slate-500' : 'text-amber-500 animate-pulse'}`} />
                <span className="font-bold capitalize text-sm">{session?.status || 'Desconectado'}</span>
              </div>
            </div>

            {/* Frame Selector */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Marco para la Foto</p>
              <div className="grid grid-cols-2 gap-2">
                {FRAMES.filter((f) => !fiesta?.station.marcosHabilitados || fiesta.station.marcosHabilitados.length === 0 || fiesta.station.marcosHabilitados.includes(f.id)).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFrame(f.id)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs font-bold transition ${
                      selectedFrame === f.id
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <span>{f.label}</span>
                    {selectedFrame === f.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Shutter / reset */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleOperatorStart}
                disabled={session?.status && session.status !== 'idle' && session.status !== 'done'}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-amber-400 text-base font-black text-zinc-950 transition hover:bg-amber-300 disabled:pointer-events-none disabled:opacity-50"
              >
                <Zap className="w-6 h-6 fill-zinc-950" />
                Iniciar cuenta regresiva
              </button>

              <button
                onClick={handleOperatorReset}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                Reiniciar sesion
              </button>
              {errorMsg && <p className="text-center text-xs font-bold text-rose-400">{errorMsg}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Display View UI
  return (
    <div className="fixed inset-0 bg-zinc-950 text-white flex flex-col overflow-hidden select-none">
      <canvas ref={canvasRef} className="hidden" />

      {/* FLASH SCREEN */}
      {flash && <div className="absolute inset-0 bg-white z-50 animate-pulse" />}

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button type="button" onClick={() => router.back()} aria-label="Volver" title="Volver" className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md transition hover:bg-white/20">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="text-center drop-shadow-md">
          <h1 className="text-sm font-black uppercase tracking-widest text-amber-400">Fotocabina AK</h1>
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
              <button type="button" onClick={toggleCamera} aria-label="Cambiar camara" title="Cambiar camara" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20">
                <SwitchCamera className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEWPORT AREA */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-black">

        {errorMsg && (
          <div className="p-6 text-center text-red-400 font-medium z-10">
            <p className="text-5xl mb-4">📷🚫</p>
            {errorMsg}
          </div>
        )}

        {/* State: Idle / Welcome */}
        {localStatus === 'idle' && !capturedImage && !errorMsg && (
          <div className="relative w-full h-full">
            {/* Live Preview de Cámara pasándolo por procesarFondoCanvas en un <canvas> */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            <canvas
              ref={previewCanvasRef}
              data-testid="preview-canvas"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/80">
              <div className="relative z-10 space-y-6 max-w-sm">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                >
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                    {fiesta?.station.brandText || 'Fotocabina'}
                  </h2>
                  <p className="text-sm text-zinc-300">
                    Prepara tu pose. La foto se captura con la camara web de esta pantalla.
                  </p>
                </div>

                {/* Selector táctil de fondo virtual */}
                <div className="flex flex-col gap-2 w-full pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 text-left">
                    Elegí el fondo
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFondoVirtual({ id: 'ninguno', nombre: 'Sin fondo', tipo: 'ninguno' })}
                      className={`h-12 rounded-xl text-xs font-black transition border ${
                        fondoVirtual.tipo === 'ninguno'
                          ? 'bg-white text-zinc-950 border-white shadow-lg'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      Sin fondo
                    </button>
                    <button
                      type="button"
                      onClick={() => setFondoVirtual({ id: 'desenfoque', nombre: 'Fondo borroso', tipo: 'desenfoque' })}
                      className={`h-12 rounded-xl text-xs font-black transition border ${
                        fondoVirtual.tipo === 'desenfoque'
                          ? 'bg-amber-400 text-zinc-950 border-amber-400 shadow-lg'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      Fondo borroso
                    </button>
                    {fiesta?.imagenFondoUrl ? (
                      <button
                        type="button"
                        onClick={() => setFondoVirtual({
                          id: 'imagen',
                          nombre: 'Fondo de la fiesta',
                          tipo: 'imagen',
                          url: fiesta.imagenFondoUrl,
                        })}
                        className={`h-12 rounded-xl text-xs font-black transition border ${
                          fondoVirtual.tipo === 'imagen'
                            ? 'bg-purple-400 text-zinc-950 border-purple-400 shadow-lg'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }`}
                      >
                        De la fiesta
                      </button>
                    ) : (
                      <div className="h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-[10px] text-zinc-500 font-bold">
                        Sin fondo extra
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={takePhoto}
                    className="w-full h-16 rounded-xl text-white font-black text-base uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2"
                    style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                  >
                    <Camera className="w-5 h-5" />
                    Preparar foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State: Countdown */}
        {localStatus === 'countdown' && !capturedImage && (
          <div className="relative w-full h-full flex items-center justify-center">
            <canvas
              ref={previewCanvasRef}
              data-testid="preview-canvas-countdown"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25 z-20 pointer-events-none" />

            {/* Guia al invitado: cual va y que hacer. Sin esto se queda mirando
                el numero sin saber que despues vienen dos mas. */}
            {fotoEnCurso > 0 && (
              <div className="absolute inset-x-0 top-24 z-10 flex flex-col items-center gap-3 px-6 text-center">
                <div className="flex items-center gap-2">
                  {Array.from({ length: FOTOS_POR_TANDA }).map((_, indice) => (
                    <span
                      key={indice}
                      className={`h-2.5 rounded-full transition-all ${
                        indice < fotoEnCurso - 1
                          ? 'w-8 bg-emerald-400'
                          : indice === fotoEnCurso - 1
                            ? 'w-8 bg-amber-400'
                            : 'w-2.5 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-amber-300">
                  Foto {fotoEnCurso} de {FOTOS_POR_TANDA}
                </p>
                <p className="max-w-md text-lg font-bold text-white drop-shadow-lg sm:text-xl">
                  {GUIA_POR_FOTO[fotoEnCurso - 1]}
                </p>
              </div>
            )}

            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 1 }}
                  exit={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="relative z-10"
                >
                  <span className="text-8xl font-black text-white sm:text-9xl">{countdown}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* State: Processing */}
        {localStatus === 'processing' && (
          <div className="absolute inset-0 z-40 bg-zinc-950 flex flex-col items-center justify-center text-center p-6">
            <Loader2 className="w-16 h-16 text-amber-400 animate-spin mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Procesando Foto...</h3>
            <p className="text-sm text-zinc-400">Preparando la previsualizacion de tu captura web.</p>
          </div>
        )}

        {/* State: Done (Photo Preview + QR Download) */}
        {localStatus === 'done' && capturedImage && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start gap-6 overflow-y-auto overscroll-contain bg-zinc-950 px-4 pb-8 pt-20 md:flex-row md:justify-center md:gap-8 md:p-6">

            {/* Captured Image Preview */}
            <div className="relative h-[52dvh] max-h-[32rem] w-auto max-w-full shrink-0 aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl md:h-[80dvh] md:max-h-[48rem]">
              {/* eslint-disable-next-line @next/next/no-img-element -- Canvas output is generated only in this browser. */}
              <img src={capturedImage} className="w-full h-full object-contain" alt="Captura Final" />
              <div className="absolute left-4 top-4 rounded-lg bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-950">
                Asi se imprime
              </div>
            </div>

            {/* Las tres fotos por separado. El recuerdo armado se ve chico en
                la pantalla de la cabina, y el invitado quiere revisar una por
                una antes de mandar a imprimir. */}
            {fotosDeLaTanda.length > 1 && (
              <div className="flex shrink-0 flex-row gap-2 md:flex-col">
                {fotosDeLaTanda.map((foto, indice) => (
                  <div key={indice} className="relative h-24 w-16 overflow-hidden rounded-md border border-white/10 bg-black md:h-32 md:w-24">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Sale del canvas de este mismo navegador. */}
                    <img src={foto} className="h-full w-full object-cover" alt={`Foto ${indice + 1} de la tanda`} />
                    <span className="absolute bottom-0 right-0 bg-black/70 px-1.5 text-[9px] font-black text-white">
                      {indice + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* QR sharing code */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-xs">
              {/* Sin enlace y con error, la subida fallo: hay que decirlo aca.
                  El aviso de errorMsg vive en otra capa, tapada por esta
                  pantalla final, asi que el invitado se iba creyendo que su
                  foto habia quedado publicada. */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">
                  {qrCodeUrl ? 'Tu recuerdo esta listo' : errorMsg ? 'No se pudo publicar' : 'Tus tres fotos'}
                </h3>
                <p className="text-sm text-zinc-400">
                  {qrCodeUrl
                    ? fiesta?.station.qrCallout
                    : errorMsg
                      ? 'Tu foto no llego al muro. Podes imprimirla o volver a intentar.'
                      : 'Imprimila para llevartela, o repetí la tanda si alguna no te gustó.'}
                </p>
                {!qrCodeUrl && errorMsg && (
                  <p className="text-xs font-bold text-rose-400" role="alert">{errorMsg}</p>
                )}
              </div>

              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-xl shadow-2xl relative">
                  <QRCodeSVG value={qrCodeUrl} size={180} level="Q" includeMargin={false} />
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                {/* Imprimir va primero y siempre: es lo que el invitado se
                    lleva en la mano. El muro es el extra, y sin muro
                    contratado este es el unico camino. */}
                <button
                  onClick={() => handleImprimir(false)}
                  disabled={isPrinting}
                  className="w-full h-14 rounded-xl text-white font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: fiesta?.station.accentColor || '#d97706' }}
                >
                  {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                  {yaSeImprimio ? 'Quiero otra copia' : 'Imprimir mi recuerdo'}
                </button>

                {qrCodeUrl ? (
                  <>
                    <button
                      onClick={handleDownload}
                      className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Guardar en el celular
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `¡Hola! Guardá este enlace para ver tus fotos y el video recuerdo de la fiesta mañana: ${qrCodeUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Mandarme el enlace por WhatsApp
                    </a>
                  </>
                ) : hayMuro ? (
                  <button
                    onClick={handleAcceptAndPublish}
                    disabled={isUploading}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Publicar en el muro
                  </button>
                ) : null}
                {fiesta?.station.allowGuestRetake && fiesta.station.maxRetakes > 0 && (
                  <button
                    onClick={retake}
                    className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Repetir foto
                  </button>
                )}

                {role !== 'operator' && (
                  <div className="pt-3 text-center space-y-3 w-full">
                    <QuinceaneraLeadPrompt
                      fiestaId={fiestaId}
                      nombreFiesta={fiesta?.eventName}
                      origen="fotocabina"
                      className="text-left"
                    />
                    <div className="pt-2 flex flex-col items-center gap-1.5 border-t border-white/10">
                      <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Esto lo hizo AK Producciones</span>
                      </div>
                      <a
                        href={`https://wa.me/59898355530?text=${encodeURIComponent(
                          `¡Hola AK Producciones! Me saqué una foto en la fotocabina de la fiesta de ${fiesta?.eventName || 'un evento'} y me encantó. Quería consultarles para mi fiesta.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Escribinos por WhatsApp</span>
                      </a>
                    </div>
                    <a
                      href={appendCommercialAttribution('/simulador-de-presupuesto', {
                        source: 'guest_portal',
                        campaign: 'fotocabina',
                        refFiestaId: fiestaId,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors py-1"
                    >
                      <span>¿Te toca festejar el año que viene? Mirá cuánto sale tu fiesta</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      <KioskUnlockButton />
      <SyncStatusIndicator
        fiestaId={fiestaId}
        moduleId="fotocabina"
        accessToken={accessToken}
        guestId={guestId}
        guestAccessToken={guestAccessToken}
      />
    </div>
  );
}

