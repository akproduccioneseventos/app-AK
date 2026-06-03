'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cloud,
  Download,
  Eye,
  Gauge,
  Image as ImageIcon,
  Loader2,
  Mail,
  Monitor,
  Pause,
  Play,
  QrCode,
  RadioTower,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Upload,
  Users,
  Video,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import {
  getEntretenimientoFiesta,
  saveEntretenimientoFiesta,
  uploadEntretenimientoMedia,
} from '@/app/actions/fiesta/entretenimiento.actions';

type StationId = 'fotocabina' | 'plataforma360' | 'bogue' | 'espejoMagico' | 'totems' | 'laboratorioAk';
type StationStatus = 'preparando' | 'listo' | 'en-vivo' | 'pausado';
type ModerationMode = 'auto' | 'revision' | 'solo-equipo';

interface EntertainmentChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface EntertainmentMediaItem {
  id: string;
  moduleId: StationId;
  fileName: string;
  url: string;
  type: 'image' | 'video';
  caption?: string;
  authorName?: string;
  uploadedAt: string;
  publishTarget?: string;
  socialPostId?: string;
  syncStatus?: 'publicado' | 'pendiente';
}

interface EntertainmentStation {
  id: StationId;
  title: string;
  enabled: boolean;
  status: StationStatus;
  operatorName: string;
  deviceName: string;
  location: string;
  startTime: string;
  overlayName: string;
  accentColor: string;
  activeTemplateId: string;
  templateName: string;
  brandText: string;
  footerText: string;
  qrCallout: string;
  logoUrl: string;
  filterPreset: string;
  musicTrack: string;
  backgroundStyle: string;
  printLayout: string;
  animationStyle: string;
  outputFormat: string;
  qualityPreset: string;
  sessionGoal: string;
  shareMessage: string;
  printCopies: number;
  maxRetakes: number;
  estimatedDurationSeconds: number;
  moderationMode: ModerationMode;
  offlineQueueEnabled: boolean;
  autoPublish: boolean;
  leadCaptureEnabled: boolean;
  analyticsEnabled: boolean;
  backupPlan: string;
  equipment: string[];
  guestFlow: string[];
  proHighlights: string[];
  captureModes: string[];
  deliveryChannels: string[];
  checklist: EntertainmentChecklistItem[];
  script: string;
  notes: string;
  media: EntertainmentMediaItem[];
}

interface EntertainmentTemplatePreset {
  id: string;
  name: string;
  mood: string;
  overlayName: string;
  accentColor: string;
  outputFormat: string;
  qualityPreset: string;
  filterPreset: string;
  musicTrack: string;
  backgroundStyle: string;
  printLayout: string;
  animationStyle: string;
}

interface EntertainmentData {
  updatedAt?: string;
  eventName: string;
  eventHashtag: string;
  galleryUrl: string;
  modules: Record<StationId, EntertainmentStation>;
}

const STATUS_META: Record<StationStatus, { label: string; className: string }> = {
  preparando: { label: 'Preparando', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  listo: { label: 'Listo', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'en-vivo': { label: 'En vivo', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  pausado: { label: 'Pausado', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const STATION_IDS: StationId[] = ['fotocabina', 'plataforma360', 'bogue', 'espejoMagico', 'totems', 'laboratorioAk'];

const STATION_META: Record<StationId, { shortLabel: string; description: string; caption: string; icon: React.ElementType }> = {
  fotocabina: {
    shortLabel: 'Fotocabina',
    description: 'Cabina social con fotos, GIFs, boomerangs, branding AK, QR, WhatsApp, galeria viva y salida para pantalla.',
    caption: 'Captura fotocabina',
    icon: Camera,
  },
  plataforma360: {
    shortLabel: 'Plataforma 360',
    description: 'Clips 360 cinematicos con slow motion, speed ramp, intro/outro, overlay AK, QR instantaneo y muro social.',
    caption: 'Captura 360',
    icon: RotateCcw,
  },
  bogue: {
    shortLabel: 'Bogue',
    description: 'Clips boomerang cortos con loop, musica, overlay y QR para compartir al instante.',
    caption: 'Clip Bogue / Boomerang',
    icon: Video,
  },
  espejoMagico: {
    shortLabel: 'Espejo magico',
    description: 'Espejo interactivo premium con pantalla tactil, prompts, firma, dibujo, props, impresion y galeria QR.',
    caption: 'Captura Espejo Magico',
    icon: Sparkles,
  },
  totems: {
    shortLabel: 'Totems interactivos',
    description: 'Totems tactiles para fotos, encuesta, QR, bienvenida, juegos, galeria y orientacion de invitados por sectores.',
    caption: 'Captura Totem AK',
    icon: Monitor,
  },
  laboratorioAk: {
    shortLabel: 'Invento AK',
    description: 'Laboratorio de nueva tecnologia AK para probar ideas propias: dinamicas, sensores, juegos, pantallas y experiencias futuras.',
    caption: 'Prueba Invento AK',
    icon: Wand2,
  },
};

const CHANNELS = [
  { id: 'qr', label: 'QR', icon: QrCode },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: Share2 },
  { id: 'galeria', label: 'Galeria', icon: ImageIcon },
  { id: 'descarga', label: 'Descarga', icon: Download },
];

const FEATURE_LIBRARY: Record<StationId, string[]> = {
  fotocabina: ['Foto', 'GIF', 'Boomerang', 'Filtros', 'Marcos', 'Impresion', 'Galeria live', 'QR/WhatsApp'],
  plataforma360: ['Video 360', 'Slow motion', 'Speed ramp', 'Intro/Outro', 'Musica', 'QR por video', 'Overlay animado', 'TV/LED'],
  bogue: ['Boomerang', 'Loop forward/reverse', 'Video corto', 'Musica', 'Overlay animado', 'QR por clip'],
  espejoMagico: ['Pantalla tactil', 'Firma', 'Dibujo', 'Sellos', 'Impresion', 'Galeria QR', 'Prompts animados', 'Lead capture'],
  totems: ['Pantalla tactil', 'Bienvenida', 'Encuestas', 'Juegos', 'QR por estacion', 'Galeria', 'Mapa salon', 'Pedidos'],
  laboratorioAk: ['Prototipo', 'Sensor o interaccion', 'Pantalla LED', 'QR', 'Ranking', 'Modo sorpresa', 'Medicion', 'Guion comercial'],
};

const MODERATION_LABELS: Record<ModerationMode, string> = {
  auto: 'Publicar automatico',
  revision: 'Revisar antes de publicar',
  'solo-equipo': 'Solo equipo AK',
};

const PRO_EQUIPMENT: Record<StationId, string[]> = {
  fotocabina: ['Camara o tablet', 'Aro de luz', 'Fondo o marco', 'Impresora opcional', 'QR visible'],
  plataforma360: ['Celular AK', 'Soporte estable', 'Luz frontal', 'Plataforma fisica', 'Bateria externa'],
  bogue: ['Celular o tablet', 'Soporte vertical', 'Luz continua', 'Musica corta', 'Cartel de QR'],
  espejoMagico: ['Espejo/pantalla tactil', 'Camara', 'Impresora opcional', 'Props fisicos', 'Limpieza de pantalla'],
  totems: ['Pantalla o tablet', 'Soporte/totem fisico', 'Extension electrica', 'QR visible', 'Conexion o modo offline'],
  laboratorioAk: ['Equipo prototipo', 'Notebook o celular controlador', 'Pantalla LED opcional', 'Kit de cables', 'Plan de prueba'],
};

const PRO_FLOW: Record<StationId, string[]> = {
  fotocabina: ['Invitado elige plantilla', 'Captura foto/GIF', 'Se aplica overlay', 'Ve QR o comparte', 'Aparece en galeria/muro'],
  plataforma360: ['Invitado sube a plataforma', 'Se graba clip corto', 'Se aplica slow/speed ramp', 'Se sube al modulo', 'Se comparte por QR/muro'],
  bogue: ['Invitado hace movimiento corto', 'Se graba loop', 'Se reproduce ida/vuelta', 'Se aplica musica/overlay', 'Se comparte como clip viral'],
  espejoMagico: ['Invitado toca el espejo', 'Sigue prompts guiados', 'Firma o agrega sellos', 'Confirma o repite', 'Recibe QR/impresion/galeria'],
  totems: ['Invitado toca el totem', 'Elige juego o accion', 'Escanea QR o deja dato', 'Aparece en pantalla/muro', 'Recibe proximo paso'],
  laboratorioAk: ['Equipo AK activa la prueba', 'Invitados participan', 'Se mide respuesta', 'Se muestra resultado en LED', 'Se decide si pasa a producto'],
};

const PRO_HIGHLIGHTS: Record<StationId, string[]> = {
  fotocabina: ['Plantillas por evento', 'Filtros en vivo', 'Impresion opcional', 'Galeria QR', 'Datos de invitados', 'Modo sharing station'],
  plataforma360: ['Slow motion', 'Speed ramp', 'Intro/outro', 'Overlay animado', 'Salida social', 'Clip listo para reels'],
  bogue: ['Loop ida/vuelta', 'Clip rapido', 'Musica por evento', 'Overlay animado', 'Formato vertical'],
  espejoMagico: ['Pantalla tactil', 'Firma y dibujo', 'Sellos/props', 'Prompts guiados', 'Experiencia premium', 'Recuerdo firmado'],
  totems: ['Punto de autoservicio', 'Encuestas y juegos', 'QR por sector', 'Contenido para LED', 'Captura de datos', 'Orientacion de invitados'],
  laboratorioAk: ['Diferencial propio', 'Producto en validacion', 'Prueba controlada', 'Guion para vender', 'Aprendizaje post-fiesta', 'Escalable a futuro'],
};

const MARKET_BENCHMARK_INSIGHTS = [
  { label: 'Sparkbooth', detail: 'Layout editor, kiosk de impresion/compartir y modo espejo con animaciones.' },
  { label: 'Touchpix', detail: 'Dashboard remoto, 6 modos de captura, QR, WhatsApp, offline queue y TV/AirPlay.' },
  { label: 'Snappic', detail: '360 cinematico con slow motion, speed ramps, intros/outros y overlays de marca.' },
  { label: 'Simple Booth', detail: 'Galerias live con branding, hashtag, performance movil y analitica de shares.' },
];

const AK_SUPERIORITY_STACK = [
  'Un QR conecta invitado, galeria, muro social y pantalla LED.',
  'Cada estacion nace con marca AK y marca del evento, no como proveedor suelto.',
  'Modo operativo: responsable, checklist, plan B offline y estado en vivo.',
  'Post-fiesta: recuerdos, galeria, material para redes y proxima venta.',
];

const BENCHMARK_FEATURES: Record<StationId, string[]> = {
  fotocabina: ['Editor de layout', 'Kiosk/sharing station', 'Foto + GIF + boomerang', 'Impresion/QR', 'Galeria live con analytics'],
  plataforma360: ['Bluetooth/trigger remoto', 'Slow motion + speed ramp', 'Intro/outro con marca', 'QR por video', 'TV/LED para descarga'],
  bogue: ['Loop vertical rapido', 'Overlay animado', 'Musica corta', 'QR por clip', 'Formato historia/reel'],
  espejoMagico: ['Modo espejo animado', 'Pantalla tactil', 'Firma/dibujo/stickers', 'Print premium', 'Galeria QR'],
  totems: ['Kiosk tactil', 'Encuestas/juegos', 'QR por pantalla', 'Integracion LED', 'Modo autoservicio'],
  laboratorioAk: ['Prototipo configurable', 'Experiencia propia', 'Medicion de uso', 'Salida a pantalla', 'Iteracion rapida'],
};

const AK_SELLING_PROOF: Record<StationId, string[]> = {
  fotocabina: ['La foto no queda aislada: entra a galeria, muro social y WhatsApp.', 'Sirve para recuerdos y tambien para capturar datos del cliente/invitado.'],
  plataforma360: ['El clip se vende como contenido social premium, no solo como giro.', 'AK lo conecta a pantalla, QR y post-fiesta para multiplicar el impacto.'],
  bogue: ['Ideal para momentos de pista: rapido, liviano y compartible.', 'Complementa la 360 cuando hay mucha gente y se necesita velocidad.'],
  espejoMagico: ['Se siente como atraccion premium de entrada o recepcion.', 'El invitado participa, firma y se lleva un recuerdo con marca del evento.'],
  totems: ['Convierte pantallas en puntos activos, no solo decoracion.', 'Ayuda a guiar invitados y alimentar el muro o la LED.'],
  laboratorioAk: ['Permite vender innovacion AK aunque el producto todavia este en prueba.', 'Ordena hipotesis, equipamiento y medicion antes de prometerlo.'],
};

const OUTPUT_FORMATS: Record<StationId, string> = {
  fotocabina: 'JPG + GIF + print 4x6',
  plataforma360: 'MP4 vertical 1080p',
  bogue: 'MP4 loop + GIF',
  espejoMagico: 'JPG firmado + print 4x6',
  totems: 'Pantalla tactil + QR + galeria',
  laboratorioAk: 'Prototipo AK + salida LED',
};

const TEMPLATE_PRESETS: Record<StationId, EntertainmentTemplatePreset[]> = {
  fotocabina: [
    {
      id: 'photo-premium',
      name: 'Premium blanco',
      mood: 'Elegante y limpio',
      overlayName: 'Marco blanco premium con logo AK',
      accentColor: '#2563eb',
      outputFormat: 'JPG + GIF + print 4x6',
      qualityPreset: 'Alta calidad + copia web',
      filterPreset: 'Piel natural + contraste suave',
      musicTrack: 'Sin musica, foco en captura',
      backgroundStyle: 'Fondo claro con marco fino',
      printLayout: 'Foto 4x6 + QR inferior',
      animationStyle: 'Flash suave + entrada limpia',
    },
    {
      id: 'photo-party',
      name: 'Fiesta social',
      mood: 'Colorido y compartible',
      overlayName: 'Marco social con stickers del evento',
      accentColor: '#7c3aed',
      outputFormat: 'JPG + GIF + historia vertical',
      qualityPreset: 'Social HD + copia impresion',
      filterPreset: 'Brillo fiesta + piel calida',
      musicTrack: 'Intro corta para GIF',
      backgroundStyle: 'Fondo con luces y detalle del evento',
      printLayout: 'Tira doble + QR de galeria',
      animationStyle: 'Pop de stickers + brillo final',
    },
  ],
  plataforma360: [
    {
      id: '360-cinematic',
      name: 'Cinematico 360',
      mood: 'Premium para pantalla grande',
      overlayName: 'Overlay 360 cinematic con intro AK',
      accentColor: '#0ea5e9',
      outputFormat: 'MP4 vertical 1080p',
      qualityPreset: 'Social HD 1080p',
      filterPreset: 'Contraste alto + luces frias',
      musicTrack: 'Beat elegante de 12 segundos',
      backgroundStyle: 'Escena oscura con aro de luz',
      printLayout: 'Video vertical + portada automatica',
      animationStyle: 'Slow motion + speed ramp + outro',
    },
    {
      id: '360-neon',
      name: 'Neon viral',
      mood: 'Energia de pista',
      overlayName: 'Overlay neon con hashtag del evento',
      accentColor: '#22c55e',
      outputFormat: 'MP4/Reel 1080p + miniatura',
      qualityPreset: 'Reel social con compresion liviana',
      filterPreset: 'Neon vivo + piel natural',
      musicTrack: 'Drop corto para redes',
      backgroundStyle: 'Luces de pista y fondo oscuro',
      printLayout: 'Miniatura vertical con QR',
      animationStyle: 'Speed ramp agresivo + flash beat',
    },
  ],
  bogue: [
    {
      id: 'bogue-loop',
      name: 'Loop viral',
      mood: 'Rapido y divertido',
      overlayName: 'Overlay Bogue loop con marca del evento',
      accentColor: '#8b5cf6',
      outputFormat: 'MP4 loop + GIF',
      qualityPreset: 'Loop HD liviano',
      filterPreset: 'Color vivo + nitidez social',
      musicTrack: 'Beat corto repetible',
      backgroundStyle: 'Fondo vertical con luces suaves',
      printLayout: 'GIF + portada para QR',
      animationStyle: 'Ida/vuelta + rebote final',
    },
    {
      id: 'bogue-glam',
      name: 'Glam Bogue',
      mood: 'Estetico tipo alfombra',
      overlayName: 'Overlay glam con firma AK',
      accentColor: '#f59e0b',
      outputFormat: 'MP4 vertical + GIF social',
      qualityPreset: 'Glam social HD',
      filterPreset: 'Glow suave + piel premium',
      musicTrack: 'Intro glam de 6 segundos',
      backgroundStyle: 'Fondo claro con destellos',
      printLayout: 'Portada vertical + QR',
      animationStyle: 'Loop suave + destello de cierre',
    },
  ],
  espejoMagico: [
    {
      id: 'mirror-signature',
      name: 'Firma premium',
      mood: 'Recuerdo elegante',
      overlayName: 'Marco espejo con firma y sellos',
      accentColor: '#f59e0b',
      outputFormat: 'JPG firmado + print 4x6',
      qualityPreset: 'Alta calidad + impresion',
      filterPreset: 'Piel natural + brillo espejo',
      musicTrack: 'Prompt sonoro suave',
      backgroundStyle: 'Fondo espejo con borde luminoso',
      printLayout: '4x6 firmado + QR discreto',
      animationStyle: 'Prompt tactil + brillo de firma',
    },
    {
      id: 'mirror-fun',
      name: 'Espejo divertido',
      mood: 'Juego con props',
      overlayName: 'Marco espejo con props y stickers',
      accentColor: '#ec4899',
      outputFormat: 'JPG + GIF + print opcional',
      qualityPreset: 'Social + impresion opcional',
      filterPreset: 'Color fiesta + suavizado',
      musicTrack: 'Sonidos de premio y captura',
      backgroundStyle: 'Fondo con props y sellos',
      printLayout: 'Collage 2 fotos + QR',
      animationStyle: 'Prompts animados + confeti digital',
    },
  ],
  totems: [
    {
      id: 'totem-welcome',
      name: 'Totem bienvenida',
      mood: 'Recepcion guiada',
      overlayName: 'Pantalla tactil con bienvenida y QR',
      accentColor: '#14b8a6',
      outputFormat: 'Pantalla tactil + QR + galeria',
      qualityPreset: 'Kiosk estable + modo offline',
      filterPreset: 'Visual claro alto contraste',
      musicTrack: 'Loop suave de bienvenida',
      backgroundStyle: 'Fondo del evento con logo AK',
      printLayout: 'QR grande + acciones rapidas',
      animationStyle: 'Transiciones tactiles simples',
    },
    {
      id: 'totem-games',
      name: 'Totem juegos',
      mood: 'Participativo',
      overlayName: 'Totem con encuesta, ranking y retos',
      accentColor: '#2563eb',
      outputFormat: 'Pantalla + ranking + salida LED',
      qualityPreset: 'Interaccion rapida para fila',
      filterPreset: 'Color vivo + lectura facil',
      musicTrack: 'Beat corto de juego',
      backgroundStyle: 'Fondo dinamico por desafio',
      printLayout: 'Resultado + QR de participacion',
      animationStyle: 'Ranking animado + celebracion',
    },
  ],
  laboratorioAk: [
    {
      id: 'lab-sorpresa',
      name: 'Experiencia sorpresa',
      mood: 'Invento en validacion',
      overlayName: 'Prototipo AK conectado a pantalla',
      accentColor: '#f97316',
      outputFormat: 'Prototipo AK + salida LED',
      qualityPreset: 'Prueba controlada por equipo',
      filterPreset: 'Look tecnico premium',
      musicTrack: 'Audio corto de activacion',
      backgroundStyle: 'Pantalla experimental AK',
      printLayout: 'Resultado visual + QR',
      animationStyle: 'Activacion sorpresa + resultado',
    },
    {
      id: 'lab-ranking',
      name: 'Ranking interactivo',
      mood: 'Juego propio AK',
      overlayName: 'Ranking en vivo con participantes',
      accentColor: '#0f172a',
      outputFormat: 'Ranking + QR + medicion',
      qualityPreset: 'Prueba de producto con datos',
      filterPreset: 'Contraste alto para LED',
      musicTrack: 'Stinger de puntaje',
      backgroundStyle: 'Fondo competitivo con marca AK',
      printLayout: 'Resultado final para redes',
      animationStyle: 'Subida de puntaje + ganador',
    },
  ],
};

function makeChecklist(type: StationId): EntertainmentChecklistItem[] {
  const shared = [
    'Branding del evento cargado',
    'QR visible para invitados',
    'WhatsApp / descarga probados',
    'Galeria y muro social abiertos',
    'Prueba de envio realizada',
    'Plan B offline definido',
    'Responsable asignado',
  ];
  const specificByType: Record<StationId, string[]> = {
    fotocabina: ['Plantilla de foto aprobada', 'Fondo o marco elegido', 'Impresora / salida digital verificada', 'Modo sharing station listo'],
    plataforma360: ['Celular con bateria suficiente', 'Tripode o soporte estable', 'Prueba de giro y encuadre hecha', 'Intro/outro y musica probadas'],
    bogue: ['Duracion del loop configurada', 'Musica o sonido corto elegido', 'Prueba de ida y vuelta realizada'],
    espejoMagico: ['Espejo/pantalla tactil limpia', 'Firma y sellos probados', 'Plantilla de impresion aprobada', 'Prompts de bienvenida cargados'],
    totems: ['Pantalla/totem probado', 'Menu tactil definido', 'QR de acciones activo', 'Salida a LED o muro revisada'],
    laboratorioAk: ['Hipotesis de prueba escrita', 'Equipo prototipo probado', 'Guion de uso definido', 'Criterio de exito acordado'],
  };
  const specific = specificByType[type];

  return [...specific, ...shared].map((text, index) => ({
    id: `${type}_check_${index + 1}`,
    text,
    done: index < 2,
  }));
}

function makeProDefaults(type: StationId, eventName: string): Pick<
  EntertainmentStation,
  | 'activeTemplateId'
  | 'templateName'
  | 'brandText'
  | 'footerText'
  | 'qrCallout'
  | 'logoUrl'
  | 'filterPreset'
  | 'musicTrack'
  | 'backgroundStyle'
  | 'printLayout'
  | 'animationStyle'
  | 'outputFormat'
  | 'qualityPreset'
  | 'sessionGoal'
  | 'shareMessage'
  | 'printCopies'
  | 'maxRetakes'
  | 'estimatedDurationSeconds'
  | 'moderationMode'
  | 'offlineQueueEnabled'
  | 'autoPublish'
  | 'leadCaptureEnabled'
  | 'analyticsEnabled'
  | 'backupPlan'
  | 'equipment'
  | 'guestFlow'
  | 'proHighlights'
> {
  const label = STATION_META[type].shortLabel;
  const isVideoExperience = type === 'plataforma360' || type === 'bogue';
  const preset = TEMPLATE_PRESETS[type][0];
  return {
    activeTemplateId: preset.id,
    templateName: `${eventName} - ${label} Pro`,
    brandText: eventName,
    footerText: 'AK Producciones',
    qrCallout: 'Escanea, descarga y comparti tu recuerdo',
    logoUrl: '',
    filterPreset: preset.filterPreset,
    musicTrack: preset.musicTrack,
    backgroundStyle: preset.backgroundStyle,
    printLayout: preset.printLayout,
    animationStyle: preset.animationStyle,
    outputFormat: preset.outputFormat || OUTPUT_FORMATS[type],
    qualityPreset: preset.qualityPreset || (isVideoExperience ? 'Social HD 1080p' : 'Alta calidad + copia web'),
    sessionGoal: type === 'espejoMagico' ? 'Entrada premium y recuerdo firmado' : 'Contenido compartible durante la fiesta',
    shareMessage: `Tu recuerdo de ${eventName} ya esta listo en la experiencia AK. Abrilo, descargalo y compartilo por WhatsApp.`,
    printCopies: type === 'fotocabina' || type === 'espejoMagico' ? 1 : 0,
    maxRetakes: type === 'espejoMagico' ? 2 : 1,
    estimatedDurationSeconds: type === 'plataforma360' ? 12 : type === 'bogue' ? 6 : 18,
    moderationMode: isVideoExperience ? 'revision' : 'auto',
    offlineQueueEnabled: true,
    autoPublish: type !== 'espejoMagico',
    leadCaptureEnabled: type === 'espejoMagico' || type === 'fotocabina',
    analyticsEnabled: true,
    backupPlan: isVideoExperience
      ? 'Guardar copia local, mostrar QR general y subir la cola al volver internet.'
      : 'Guardar original local, usar QR general y repetir con modo digital si falla impresion.',
    equipment: PRO_EQUIPMENT[type],
    guestFlow: PRO_FLOW[type],
    proHighlights: PRO_HIGHLIGHTS[type],
  };
}

function makeStation(type: StationId, fiesta?: FiestaEnPlanificacion | null): EntertainmentStation {
  const eventName = fiesta?.configuracion?.nombreEvento || 'Evento AK';
  const proDefaults = makeProDefaults(type, eventName);

  if (type === 'fotocabina') {
    return {
      id: 'fotocabina',
      title: 'Fotocabina AK Pro',
      enabled: true,
      status: 'listo',
      operatorName: '',
      deviceName: 'Tablet / camara / notebook',
      location: 'Zona de fotos',
      startTime: '22:30',
      overlayName: `${eventName} - marco premium`,
      accentColor: '#2563eb',
      ...proDefaults,
      captureModes: ['Foto', 'GIF', 'Boomerang'],
      deliveryChannels: ['qr', 'mail', 'whatsapp', 'galeria'],
      checklist: makeChecklist('fotocabina'),
      script: 'Captura, aplica marco AK, muestra QR y deja la foto lista para galeria y muro social.',
      notes: '',
      media: [],
    };
  }

  if (type === 'bogue') {
    return {
      id: 'bogue',
      title: 'Bogue AK',
      enabled: true,
      status: 'listo',
      operatorName: '',
      deviceName: 'Celular / tablet con soporte',
      location: 'Zona de activacion',
      startTime: '23:30',
      overlayName: `${eventName} - loop social`,
      accentColor: '#0ea5e9',
      ...proDefaults,
      captureModes: ['Boomerang', 'Loop forward/reverse', 'Video corto'],
      deliveryChannels: ['qr', 'whatsapp', 'galeria', 'descarga'],
      checklist: makeChecklist('bogue'),
      script: 'Grabar clips cortos de movimiento, aplicar marca AK y publicarlos como loop para QR, galeria y muro social.',
      notes: 'Ideal para entrada, cotillon o momento de pista con mucha energia.',
      media: [],
    };
  }

  if (type === 'espejoMagico') {
    return {
      id: 'espejoMagico',
      title: 'Espejo Magico AK',
      enabled: true,
      status: 'preparando',
      operatorName: '',
      deviceName: 'Espejo / pantalla tactil / camara',
      location: 'Recepcion o salon principal',
      startTime: '21:30',
      overlayName: `${eventName} - espejo interactivo`,
      accentColor: '#f59e0b',
      ...proDefaults,
      captureModes: ['Pantalla tactil', 'Firma', 'Dibujo', 'Sellos'],
      deliveryChannels: ['qr', 'mail', 'whatsapp', 'galeria', 'descarga'],
      checklist: makeChecklist('espejoMagico'),
      script: 'El invitado toca el espejo, sigue prompts, firma o dibuja sobre la foto y la recibe por QR o galeria.',
      notes: 'Pensado como experiencia premium de entrada, elegante y muy visual.',
      media: [],
    };
  }

  if (type === 'totems') {
    return {
      id: 'totems',
      title: 'Totems Interactivos AK',
      enabled: true,
      status: 'preparando',
      operatorName: '',
      deviceName: 'Pantalla / tablet en totem',
      location: 'Recepcion, pista o sector de juegos',
      startTime: '21:00',
      overlayName: `${eventName} - totem interactivo`,
      accentColor: '#14b8a6',
      ...proDefaults,
      captureModes: ['Bienvenida', 'Encuesta', 'Juegos', 'QR por sector'],
      deliveryChannels: ['qr', 'galeria', 'whatsapp'],
      checklist: makeChecklist('totems'),
      script: 'Instalar una pantalla tactil para guiar invitados, activar juegos, mostrar QR y alimentar el muro o la pantalla LED.',
      notes: 'Pensado para recepcion, fila de fotos, zona adolescente o punto de informacion del evento.',
      media: [],
    };
  }

  if (type === 'laboratorioAk') {
    return {
      id: 'laboratorioAk',
      title: 'Laboratorio de Inventos AK',
      enabled: false,
      status: 'preparando',
      operatorName: '',
      deviceName: 'Prototipo / notebook / celular controlador',
      location: 'Zona de prueba controlada',
      startTime: '23:00',
      overlayName: `${eventName} - invento AK`,
      accentColor: '#f97316',
      ...proDefaults,
      captureModes: ['Prototipo', 'Ranking', 'Sensor/accion', 'Salida LED'],
      deliveryChannels: ['qr', 'galeria', 'descarga'],
      checklist: makeChecklist('laboratorioAk'),
      script: 'Probar una experiencia nueva con invitados, medir respuesta y decidir si se convierte en producto fijo de AK.',
      notes: 'Usar solo cuando el alcance este claro: que hace, que equipo necesita, que se muestra y como se mide.',
      media: [],
    };
  }

  return {
    id: 'plataforma360',
    title: 'Plataforma 360 AK',
    enabled: true,
    status: 'listo',
    operatorName: '',
    deviceName: 'Celular principal AK',
    location: 'Pista / entrada luminica',
    startTime: '02:30',
    overlayName: `${eventName} - 360 cinematic`,
    accentColor: '#7c3aed',
    ...proDefaults,
    captureModes: ['Video 360', 'Slow motion', 'Speed ramp'],
    deliveryChannels: ['qr', 'whatsapp', 'galeria', 'descarga'],
    checklist: makeChecklist('plataforma360'),
    script: 'Grabar con celular en vertical u horizontal, subir video al modulo y compartir por QR o muro social.',
    notes: 'Modo recomendado: celular cargado, buena luz frontal, clip corto de 8 a 12 segundos.',
    media: [],
  };
}

function makeDefaultEntertainment(fiesta?: FiestaEnPlanificacion | null, origin = ''): EntertainmentData {
  const eventName = fiesta?.configuracion?.nombreEvento || 'Evento AK';
  const safeName = eventName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 24);

  return {
    eventName,
    eventHashtag: `#${safeName || 'FiestaAK'}`,
    galleryUrl: origin && fiesta?.id ? `${origin}/evento/social/${fiesta.id}` : '',
    modules: {
      fotocabina: makeStation('fotocabina', fiesta),
      plataforma360: makeStation('plataforma360', fiesta),
      bogue: makeStation('bogue', fiesta),
      espejoMagico: makeStation('espejoMagico', fiesta),
      totems: makeStation('totems', fiesta),
      laboratorioAk: makeStation('laboratorioAk', fiesta),
    },
  };
}

function mergeEntertainmentData(
  stored: Partial<EntertainmentData> | null | undefined,
  fiesta?: FiestaEnPlanificacion | null,
  origin = ''
): EntertainmentData {
  const defaults = makeDefaultEntertainment(fiesta, origin);
  const modules = STATION_IDS.reduce((acc, stationId) => {
    const storedStation = stored?.modules?.[stationId];
    const defaultStation = defaults.modules[stationId];
    acc[stationId] = {
      ...defaultStation,
      ...(storedStation || {}),
      checklist: storedStation?.checklist || defaultStation.checklist,
      media: storedStation?.media || [],
      equipment: storedStation?.equipment || defaultStation.equipment,
      guestFlow: storedStation?.guestFlow || defaultStation.guestFlow,
      proHighlights: storedStation?.proHighlights || defaultStation.proHighlights,
      moderationMode: storedStation?.moderationMode || defaultStation.moderationMode,
      activeTemplateId: storedStation?.activeTemplateId || defaultStation.activeTemplateId,
      brandText: storedStation?.brandText || defaultStation.brandText,
      footerText: storedStation?.footerText || defaultStation.footerText,
      qrCallout: storedStation?.qrCallout || defaultStation.qrCallout,
      logoUrl: storedStation?.logoUrl || defaultStation.logoUrl,
      filterPreset: storedStation?.filterPreset || defaultStation.filterPreset,
      musicTrack: storedStation?.musicTrack || defaultStation.musicTrack,
      backgroundStyle: storedStation?.backgroundStyle || defaultStation.backgroundStyle,
      printLayout: storedStation?.printLayout || defaultStation.printLayout,
      animationStyle: storedStation?.animationStyle || defaultStation.animationStyle,
      outputFormat: storedStation?.outputFormat || defaultStation.outputFormat,
      qualityPreset: storedStation?.qualityPreset || defaultStation.qualityPreset,
      shareMessage: storedStation?.shareMessage || defaultStation.shareMessage,
      backupPlan: storedStation?.backupPlan || defaultStation.backupPlan,
    };
    return acc;
  }, {} as Record<StationId, EntertainmentStation>);

  return {
    ...defaults,
    ...(stored || {}),
    eventName: stored?.eventName || defaults.eventName,
    eventHashtag: stored?.eventHashtag || defaults.eventHashtag,
    galleryUrl: stored?.galleryUrl || defaults.galleryUrl,
    modules,
  };
}

function stationScore(station: EntertainmentStation) {
  const checksDone = station.checklist.filter((item) => item.done).length;
  const checksScore = station.checklist.length ? Math.round((checksDone / station.checklist.length) * 38) : 0;
  let score = checksScore;
  if (station.enabled) score += 15;
  if (station.status === 'listo' || station.status === 'en-vivo') score += 14;
  if (station.overlayName.trim()) score += 10;
  if (station.deliveryChannels.length >= 3) score += 10;
  if (station.captureModes.length >= 2) score += 8;
  if (station.media.length > 0) score += 5;
  if (station.offlineQueueEnabled) score += 2;
  if (station.analyticsEnabled) score += 2;
  if (station.templateName?.trim()) score += 2;
  if (station.backupPlan?.trim()) score += 2;
  if (station.activeTemplateId?.trim()) score += 3;
  if (station.brandText?.trim()) score += 3;
  if (station.qrCallout?.trim()) score += 2;
  if (station.filterPreset?.trim()) score += 2;
  if (station.musicTrack?.trim()) score += 2;
  if (station.backgroundStyle?.trim()) score += 2;
  if (station.printLayout?.trim()) score += 2;
  if (station.animationStyle?.trim()) score += 2;
  return Math.min(100, score);
}

function stationPendingCount(station: EntertainmentStation) {
  return station.media.filter((item) => item.syncStatus === 'pendiente').length;
}

function templatePresetToPatch(station: EntertainmentStation, preset: EntertainmentTemplatePreset): Partial<EntertainmentStation> {
  return {
    activeTemplateId: preset.id,
    templateName: `${station.title} - ${preset.name}`,
    overlayName: preset.overlayName,
    accentColor: preset.accentColor,
    outputFormat: preset.outputFormat,
    qualityPreset: preset.qualityPreset,
    filterPreset: preset.filterPreset,
    musicTrack: preset.musicTrack,
    backgroundStyle: preset.backgroundStyle,
    printLayout: preset.printLayout,
    animationStyle: preset.animationStyle,
  };
}

function formatDateTime(value?: string) {
  if (!value) return 'Sin fecha';
  try {
    return new Date(value).toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Sin fecha';
  }
}

function StatusBadge({ status }: { status: StationStatus }) {
  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest', STATUS_META[status].className)}>
      {STATUS_META[status].label}
    </span>
  );
}

interface StationPanelProps {
  station: EntertainmentStation;
  galleryUrl: string;
  eventHashtag: string;
  uploading: boolean;
  onUpdate: (patch: Partial<EntertainmentStation>) => void;
  onToggleChecklist: (checkId: string) => void;
  onToggleArrayValue: (field: 'captureModes' | 'deliveryChannels', value: string) => void;
  onUpload: (file: File, stationId: StationId) => Promise<void>;
}

function StationPanel({
  station,
  galleryUrl,
  eventHashtag,
  uploading,
  onUpdate,
  onToggleChecklist,
  onToggleArrayValue,
  onUpload,
}: StationPanelProps) {
  const Icon = STATION_META[station.id].icon;
  const score = stationScore(station);
  const pendingSync = stationPendingCount(station);
  const captureAccept = station.id === 'plataforma360' || station.id === 'bogue' ? 'video/*,image/*' : 'image/*,video/*';

  return (
    <div className="space-y-5">
      <Card className="border-slate-200 bg-white/95 shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-950 p-4 text-white shadow-xl">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl font-black text-slate-900">{station.title}</CardTitle>
                  <StatusBadge status={station.status} />
                </div>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
                  {STATION_META[station.id].description}
                </p>
              </div>
            </div>
            <div className="min-w-[180px] rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Preparacion</span>
                <span className="text-lg font-black text-slate-900">{score}%</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">Activo</Label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-slate-700">{station.enabled ? 'Disponible' : 'Apagado'}</span>
                <Switch checked={station.enabled} onCheckedChange={(enabled) => onUpdate({ enabled })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Input value={station.operatorName} onChange={(event) => onUpdate({ operatorName: event.target.value })} placeholder="Nombre del operador" />
            </div>
            <div className="space-y-2">
              <Label>Equipo</Label>
              <Input value={station.deviceName} onChange={(event) => onUpdate({ deviceName: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Hora de uso</Label>
              <Input value={station.startTime} onChange={(event) => onUpdate({ startTime: event.target.value })} placeholder="02:30" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(['preparando', 'listo', 'en-vivo', 'pausado'] as StationStatus[]).map((status) => {
              const active = station.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onUpdate({ status })}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    active ? 'border-slate-900 bg-slate-950 text-white shadow-xl' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    {status === 'en-vivo' ? <Play className="h-4 w-4" /> : status === 'pausado' ? <Pause className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span className="text-xs font-black uppercase tracking-widest">{STATUS_META[status].label}</span>
                  </div>
                  <p className={cn('text-xs font-semibold', active ? 'text-white/70' : 'text-slate-400')}>
                    Cambia el estado operativo visible para el equipo.
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <BarChart3 className="mb-2 h-5 w-5 text-blue-600" />
              <p className="text-2xl font-black text-slate-950">{station.media.length}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Capturas</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Share2 className="mb-2 h-5 w-5 text-violet-600" />
              <p className="text-2xl font-black text-slate-950">{station.deliveryChannels.length}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Salidas</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Cloud className="mb-2 h-5 w-5 text-emerald-600" />
              <p className="text-2xl font-black text-slate-950">{pendingSync}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pendientes</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Gauge className="mb-2 h-5 w-5 text-amber-600" />
              <p className="text-2xl font-black text-slate-950">{station.estimatedDurationSeconds}s</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sesion</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-slate-700" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Benchmark mercado</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {BENCHMARK_FEATURES[station.id].map((feature) => (
                  <span key={feature} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <p className="text-xs font-black uppercase tracking-widest text-emerald-800">Ventaja AK superior</p>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {AK_SELLING_PROOF[station.id].map((proof) => (
                  <div key={proof} className="rounded-xl bg-white/80 px-3 py-2 text-sm font-bold leading-relaxed text-emerald-900">
                    {proof}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <Wand2 className="h-5 w-5 text-indigo-600" />
                  Plantilla, marca y salidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Overlay / marco</Label>
                    <Input value={station.overlayName} onChange={(event) => onUpdate({ overlayName: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Color acento</Label>
                    <Input type="color" value={station.accentColor} onChange={(event) => onUpdate({ accentColor: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Plantillas listas</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {TEMPLATE_PRESETS[station.id].map((preset) => {
                      const active = station.activeTemplateId === preset.id;
                      return (
                        <button
                          type="button"
                          key={preset.id}
                          onClick={() => onUpdate(templatePresetToPatch(station, preset))}
                          className={cn(
                            'rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5',
                            active ? 'border-slate-900 bg-slate-950 text-white shadow-xl' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                          )}
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full border border-white/40 shadow-inner" style={{ backgroundColor: preset.accentColor }} />
                            <span className="text-sm font-black">{preset.name}</span>
                          </div>
                          <p className={cn('text-xs font-semibold leading-relaxed', active ? 'text-white/65' : 'text-slate-500')}>{preset.mood}</p>
                          <p className={cn('mt-2 text-[10px] font-black uppercase tracking-widest', active ? 'text-white/45' : 'text-slate-400')}>{preset.outputFormat}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Texto principal</Label>
                    <Input value={station.brandText} onChange={(event) => onUpdate({ brandText: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pie / marca</Label>
                    <Input value={station.footerText} onChange={(event) => onUpdate({ footerText: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Texto QR</Label>
                    <Input value={station.qrCallout} onChange={(event) => onUpdate({ qrCallout: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo o imagen de marca</Label>
                    <Input value={station.logoUrl} onChange={(event) => onUpdate({ logoUrl: event.target.value })} placeholder="URL opcional" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Filtro / look</Label>
                    <Input value={station.filterPreset} onChange={(event) => onUpdate({ filterPreset: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Musica / sonido</Label>
                    <Input value={station.musicTrack} onChange={(event) => onUpdate({ musicTrack: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fondo / escena</Label>
                    <Input value={station.backgroundStyle} onChange={(event) => onUpdate({ backgroundStyle: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Layout final</Label>
                    <Input value={station.printLayout} onChange={(event) => onUpdate({ printLayout: event.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Animacion / edicion</Label>
                    <Input value={station.animationStyle} onChange={(event) => onUpdate({ animationStyle: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Modos de captura</Label>
                  <div className="flex flex-wrap gap-2">
                    {FEATURE_LIBRARY[station.id].map((mode) => {
                      const active = station.captureModes.includes(mode);
                      return (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => onToggleArrayValue('captureModes', mode)}
                          className={cn(
                            'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-all',
                            active ? 'border-slate-900 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-400'
                          )}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Canales de entrega</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {CHANNELS.map((channel) => {
                      const ChannelIcon = channel.icon;
                      const active = station.deliveryChannels.includes(channel.id);
                      return (
                        <button
                          type="button"
                          key={channel.id}
                          onClick={() => onToggleArrayValue('deliveryChannels', channel.id)}
                          className={cn(
                            'flex min-h-[4rem] items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase tracking-widest transition-all',
                            active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-400'
                          )}
                        >
                          <ChannelIcon className="h-4 w-4" />
                          {channel.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 bg-slate-950 text-white">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-white/50">QR de experiencia</p>
                    <p className="text-lg font-black">{eventHashtag}</p>
                  </div>
                  <RadioTower className="h-6 w-6 text-blue-300" />
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <QRCodeSVG value={galleryUrl || 'https://akproducciones.uy'} size={140} />
                </div>
                <div
                  className="overflow-hidden rounded-2xl border border-white/10 p-4 shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${station.accentColor} 0%, #020617 58%, #0f172a 100%)`,
                  }}
                >
                  <div className="mb-8 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-white/70">
                    <span>{station.footerText || 'AK Producciones'}</span>
                    <span>{station.outputFormat}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-black leading-tight text-white">{station.brandText}</p>
                    <p className="text-xs font-semibold leading-relaxed text-white/70">{station.overlayName}</p>
                  </div>
                  <div className="mt-6 grid gap-2 text-[10px] font-black uppercase tracking-widest text-white/75">
                    <span className="rounded-full bg-white/10 px-3 py-2">{station.filterPreset}</span>
                    <span className="rounded-full bg-white/10 px-3 py-2">{station.animationStyle}</span>
                    <span className="rounded-full bg-white px-3 py-2 text-slate-950">{station.qrCallout}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold leading-relaxed text-white/60">
                  Este QR apunta a la experiencia social de la fiesta para que el invitado vea, comparta y participe.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <SlidersHorizontal className="h-5 w-5 text-slate-700" />
                Control pro de la estacion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Plantilla activa</Label>
                  <Input value={station.templateName} onChange={(event) => onUpdate({ templateName: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Formato de salida</Label>
                  <Input value={station.outputFormat} onChange={(event) => onUpdate({ outputFormat: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Calidad</Label>
                  <Input value={station.qualityPreset} onChange={(event) => onUpdate({ qualityPreset: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo</Label>
                  <Input value={station.sessionGoal} onChange={(event) => onUpdate({ sessionGoal: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duracion sesion</Label>
                  <Input
                    type="number"
                    min={1}
                    value={station.estimatedDurationSeconds}
                    onChange={(event) => onUpdate({ estimatedDurationSeconds: Number(event.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reintentos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={station.maxRetakes}
                    onChange={(event) => onUpdate({ maxRetakes: Number(event.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Copias impresion</Label>
                  <Input
                    type="number"
                    min={0}
                    value={station.printCopies}
                    onChange={(event) => onUpdate({ printCopies: Number(event.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Moderacion</Label>
                  <select
                    value={station.moderationMode}
                    onChange={(event) => onUpdate({ moderationMode: event.target.value as ModerationMode })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {Object.entries(MODERATION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { key: 'offlineQueueEnabled', label: 'Cola offline', icon: Cloud },
                  { key: 'autoPublish', label: 'Auto publicar', icon: RadioTower },
                  { key: 'leadCaptureEnabled', label: 'Captura datos', icon: ClipboardCheck },
                  { key: 'analyticsEnabled', label: 'Metricas', icon: BarChart3 },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const checked = Boolean(station[item.key as keyof EntertainmentStation]);
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <ItemIcon className="h-5 w-5 text-slate-500" />
                        <span className="text-sm font-black text-slate-700">{item.label}</span>
                      </div>
                      <Switch checked={checked} onCheckedChange={(value) => onUpdate({ [item.key]: value } as Partial<EntertainmentStation>)} />
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mensaje de envio</Label>
                  <Textarea value={station.shareMessage} onChange={(event) => onUpdate({ shareMessage: event.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Plan B operativo</Label>
                  <Textarea value={station.backupPlan} onChange={(event) => onUpdate({ backupPlan: event.target.value })} rows={3} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Flujo invitado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {station.guestFlow.map((step, index) => (
                  <div key={`${step}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span>
                    <p className="text-sm font-bold leading-relaxed text-slate-600">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Equipo minimo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {station.equipment.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-600">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-black">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                  Funciones pro
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {station.proHighlights.map((item) => (
                  <span key={item} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-violet-700">
                    {item}
                  </span>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-black">Checklist operativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {station.checklist.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onToggleChecklist(item.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-400"
                  >
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', item.done ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-slate-300 bg-white text-slate-300')}>
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className={cn('text-sm font-bold', item.done ? 'text-slate-900' : 'text-slate-500')}>{item.text}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-black">Capturas del evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <Label>Subir desde celular o equipo</Label>
                    <p className="text-xs font-semibold text-slate-400">
                      En celular abre camara/galeria; en PC permite cargar archivos ya editados.
                    </p>
                  </div>
                  <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black uppercase tracking-widest text-white shadow-xl transition hover:-translate-y-0.5">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Subir
                    <input
                      type="file"
                      accept={captureAccept}
                      capture={station.id === 'plataforma360' || station.id === 'bogue' ? 'environment' : undefined}
                      className="hidden"
                      disabled={uploading}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) await onUpload(file, station.id);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {station.media.length === 0 ? (
                    <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                      <ImageIcon className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">Todavia no hay capturas cargadas.</p>
                    </div>
                  ) : (
                    station.media.slice(0, 6).map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {item.type === 'video' ? <Video className="h-4 w-4 text-violet-600" /> : <ImageIcon className="h-4 w-4 text-blue-600" />}
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500">{item.type === 'video' ? 'Video' : 'Foto'}</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{formatDateTime(item.uploadedAt)}</span>
                        </div>
                        <p className="line-clamp-2 text-sm font-black text-slate-800">{item.fileName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {item.syncStatus === 'pendiente' ? 'Pendiente de sincronizar con muro social' : 'Publicado en muro social'}
                        </p>
                      </a>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Guion operativo</Label>
              <Textarea value={station.script} onChange={(event) => onUpdate({ script: event.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Notas internas</Label>
              <Textarea value={station.notes} onChange={(event) => onUpdate({ notes: event.target.value })} rows={4} placeholder="Ej: llevar aro de luz, probar sonido, ubicar carteleria." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EntretenimientoContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [data, setData] = useState<EntertainmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingStation, setUploadingStation] = useState<StationId | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!fiestaId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const result = await getEntretenimientoFiesta(fiestaId);
      if (!result.success || !result.fiesta) {
        toast({ title: 'No se pudo cargar entretenimiento', description: result.error, variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      setFiesta(result.fiesta);
      setData(mergeEntertainmentData(result.data, result.fiesta, window.location.origin));
      setIsLoading(false);
    };
    load();
  }, [fiestaId, toast]);

  const overallScore = useMemo(() => {
    if (!data) return 0;
    return Math.round(STATION_IDS.reduce((sum, stationId) => sum + stationScore(data.modules[stationId]), 0) / STATION_IDS.length);
  }, [data]);

  const updateStation = useCallback((stationId: StationId, patch: Partial<EntertainmentStation>) => {
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        modules: {
          ...current.modules,
          [stationId]: {
            ...current.modules[stationId],
            ...patch,
          },
        },
      };
    });
  }, []);

  const toggleChecklist = useCallback((stationId: StationId, checkId: string) => {
    setData((current) => {
      if (!current) return current;
      const station = current.modules[stationId];
      return {
        ...current,
        modules: {
          ...current.modules,
          [stationId]: {
            ...station,
            checklist: station.checklist.map((item) => item.id === checkId ? { ...item, done: !item.done } : item),
          },
        },
      };
    });
  }, []);

  const toggleArrayValue = useCallback((stationId: StationId, field: 'captureModes' | 'deliveryChannels', value: string) => {
    setData((current) => {
      if (!current) return current;
      const station = current.modules[stationId];
      const values = station[field];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      return {
        ...current,
        modules: {
          ...current.modules,
          [stationId]: {
            ...station,
            [field]: nextValues,
          },
        },
      };
    });
  }, []);

  const saveNow = useCallback(async () => {
    if (!fiestaId || !data) return;
    setIsSaving(true);
    const result = await saveEntretenimientoFiesta(fiestaId, data);
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'No se pudo guardar', description: result.error, variant: 'destructive' });
      return;
    }
    setData(mergeEntertainmentData(result.data, fiesta, origin));
    toast({ title: 'Entretenimiento guardado', description: 'Todas las estaciones quedaron actualizadas.' });
  }, [data, fiesta, fiestaId, origin, toast]);

  const uploadMedia = useCallback(async (file: File, stationId: StationId) => {
    if (!fiestaId) return;
    setUploadingStation(stationId);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('moduleId', stationId);
    formData.append('file', file);
    formData.append('authorName', 'AK Producciones');
    formData.append('caption', STATION_META[stationId].caption);

    const result = await uploadEntretenimientoMedia(formData);
    setUploadingStation(null);

    if (!result.success) {
      toast({ title: 'No se pudo subir', description: result.error, variant: 'destructive' });
      return;
    }

    setData(mergeEntertainmentData(result.data, fiesta, origin));
    toast({ title: 'Captura subida', description: 'Quedo guardada dentro del modulo de entretenimiento.' });
  }, [fiesta, fiestaId, origin, toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
      </div>
    );
  }

  if (!fiestaId || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Camera className="mb-4 h-12 w-12 text-slate-400" />
        <h1 className="text-2xl font-black text-slate-900">Falta seleccionar una fiesta</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Entrá desde el planificador para usar este módulo.</p>
        <Link href="/eventos" className="mt-6">
          <Button>Volver a eventos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="ak-entertainment-page min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
              <Button variant="outline" size="icon" className="rounded-2xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <Badge className="mb-3 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">Tecnologia de fiesta</Badge>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Entretenimiento
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-slate-500 sm:text-base">
                Fotocabina, Plataforma 360, Bogue y Espejo Magico como estaciones profesionales conectadas al evento, al QR, WhatsApp, pantalla LED, galeria y muro social.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={`/fiestas/nueva/muro-social?fiestaId=${fiestaId}`}>
              <Button variant="outline" className="w-full rounded-2xl font-black">
                <Monitor className="mr-2 h-4 w-4" />
                Muro social
              </Button>
            </Link>
            <Button onClick={saveNow} disabled={isSaving} className="rounded-2xl bg-slate-950 font-black text-white hover:bg-slate-800">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-xl">
            <CardContent className="grid gap-6 p-5 lg:grid-cols-[1fr_.85fr] lg:p-7">
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100">App interna AK</Badge>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Activa por fiesta</Badge>
                  <Badge className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50">Celular compatible</Badge>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-950 sm:text-4xl">{data.eventName}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Preparacion general del modulo: {overallScore}%.
                  </p>
                </div>
                <Progress value={overallScore} className="h-3 max-w-xl" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Users className="mb-2 h-5 w-5 text-blue-600" />
                    <p className="text-2xl font-black text-slate-950">{fiesta?.configuracion?.invitadosEstimados || 0}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Invitados</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Clock className="mb-2 h-5 w-5 text-amber-600" />
                    <p className="text-2xl font-black text-slate-950">{data.modules.plataforma360.startTime}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Momento 360</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Sparkles className="mb-2 h-5 w-5 text-violet-600" />
                    <p className="text-2xl font-black text-slate-950">{STATION_IDS.length}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Estaciones</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Modelo AK frente al mercado</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {AK_SUPERIORITY_STACK.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-relaxed text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="relative">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-white/50">Modo celular</p>
                      <p className="text-xl font-black">Plataforma 360</p>
                    </div>
                    <Smartphone className="h-8 w-8 text-blue-200" />
                  </div>
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <div className="mx-auto max-w-[180px] rounded-[2rem] border border-white/15 bg-slate-900 p-3">
                      <div className="aspect-[9/16] rounded-[1.4rem] bg-gradient-to-b from-slate-800 via-blue-950 to-violet-950 p-4">
                        <div className="flex h-full flex-col justify-between">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                            <span>AK 360</span>
                            <span>REC</span>
                          </div>
                          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10">
                            <Video className="h-9 w-9 text-white" />
                          </div>
                          <div className="rounded-2xl bg-white/10 p-3 text-center text-[10px] font-black uppercase tracking-widest text-white/70">
                            QR + video listo
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-black">
                <QrCode className="h-5 w-5 text-blue-600" />
                QR general
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-blue-700">Referencias usadas como benchmark</p>
                <div className="grid gap-2">
                  {MARKET_BENCHMARK_INSIGHTS.map((item) => (
                    <div key={item.label} className="rounded-xl bg-white px-3 py-2">
                      <p className="text-sm font-black text-slate-900">{item.label}</p>
                      <p className="text-xs font-semibold leading-relaxed text-slate-500">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mx-auto flex w-fit rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
                <QRCodeSVG value={data.galleryUrl || `${origin}/evento/social/${fiestaId}`} size={168} />
              </div>
              <div className="space-y-2">
                <Label>Link de galeria / muro</Label>
                <Input value={data.galleryUrl} onChange={(event) => setData({ ...data, galleryUrl: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hashtag</Label>
                <Input value={data.eventHashtag} onChange={(event) => setData({ ...data, eventHashtag: event.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STATION_IDS.map((stationId) => {
            const station = data.modules[stationId];
            const StationIcon = STATION_META[stationId].icon;
            return (
              <div key={stationId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-950 p-3 text-white">
                      <StationIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{STATION_META[stationId].shortLabel}</p>
                      <p className="text-xs font-semibold text-slate-400">{station.outputFormat}</p>
                    </div>
                  </div>
                  <StatusBadge status={station.status} />
                </div>
                <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Pro readiness</span>
                  <span className="text-slate-900">{stationScore(station)}%</span>
                </div>
                <Progress value={stationScore(station)} className="h-2" />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-slate-50 p-2">
                    <p className="text-lg font-black text-slate-950">{station.media.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">media</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2">
                    <p className="text-lg font-black text-slate-950">{station.captureModes.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">modos</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-2">
                    <p className="text-lg font-black text-slate-950">{station.deliveryChannels.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">salidas</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Tabs defaultValue="fotocabina" className="space-y-5">
          <TabsList className="grid h-auto grid-cols-2 rounded-2xl bg-white p-1 shadow-lg lg:grid-cols-3 xl:grid-cols-6">
            {STATION_IDS.map((stationId) => {
              const StationIcon = STATION_META[stationId].icon;
              return (
                <TabsTrigger key={stationId} value={stationId} className="rounded-xl py-3 font-black">
                  <StationIcon className="mr-2 h-4 w-4" />
                  {STATION_META[stationId].shortLabel}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {STATION_IDS.map((stationId) => (
            <TabsContent key={stationId} value={stationId}>
              <StationPanel
                station={data.modules[stationId]}
                galleryUrl={data.galleryUrl}
                eventHashtag={data.eventHashtag}
                uploading={uploadingStation === stationId}
                onUpdate={(patch) => updateStation(stationId, patch)}
                onToggleChecklist={(checkId) => toggleChecklist(stationId, checkId)}
                onToggleArrayValue={(field, value) => toggleArrayValue(stationId, field, value)}
                onUpload={uploadMedia}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

export default function EntretenimientoPage() {
  return (
    <Suspense fallback={null}>
      <EntretenimientoContent />
    </Suspense>
  );
}
