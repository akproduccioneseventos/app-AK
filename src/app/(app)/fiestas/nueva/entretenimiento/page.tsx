'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
  Mic,
  Trash2,
  FileAudio,
  Settings,
  Printer,
  ListTodo,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Square,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import QrFlyerGenerator from '@/components/social-wall/QrFlyerGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getEntretenimientoFiesta,
  getEntertainmentLaunchToken,
  saveEntretenimientoFiesta,
  uploadEntretenimientoMedia,
} from '@/app/actions/fiesta/entretenimiento.actions';
import {
  getEntertainmentGuestPath,
  getEntertainmentOperatorPath,
  getEntertainmentPrintPath,
} from '@/lib/entertainment/station-config';
import {
  getBuzonMessages,
  deleteBuzonMessage,
  uploadWelcomeAudio,
  deleteWelcomeAudio,
  BuzonMessage
} from '@/app/actions/buzon';

type StationId =
  | 'fotocabina'
  | 'plataforma360'
  | 'bogue'
  | 'espejoMagicoFoto'
  | 'espejoMagicoFirma'
  | 'espejoMagicoIA'
  | 'totems'
  | 'capsulaTiempo';

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
  type: 'image' | 'video' | 'audio';
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
  countdownSeconds: number;
  recordingDurationSeconds: number;
  reviewSeconds: number;
  allowGuestRetake: boolean;
  consentRequired: boolean;
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
  preparando: { label: 'Preparando', className: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50' },
  listo: { label: 'Listo', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'en-vivo': { label: 'En vivo', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  pausado: { label: 'Pausado', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

const STATION_IDS: StationId[] = [
  'fotocabina',
  'plataforma360',
  'bogue',
  'espejoMagicoFoto',
  'espejoMagicoFirma',
  'espejoMagicoIA',
  'totems',
  'capsulaTiempo',
];

const STATION_META: Record<StationId, { shortLabel: string; description: string; caption: string; icon: React.ElementType }> = {
  fotocabina: {
    shortLabel: 'Fotocabina Social',
    description: 'Cabina clásica o tótem fotográfico para fotos con marco de la fiesta, impresión 10x15, QR y WhatsApp.',
    caption: 'Captura fotocabina',
    icon: Camera,
  },
  plataforma360: {
    shortLabel: 'Plataforma 360',
    description: 'Videos en slow motion con giros de cámara, intros/outros cinemáticas, speed ramp y descarga al instante.',
    caption: 'Captura plataforma 360',
    icon: RotateCcw,
  },
  bogue: {
    shortLabel: 'Bogue (Boomerang)',
    description: 'Clips cortos y dinámicos estilo boomerang con loops y música, listos para historias de Instagram.',
    caption: 'Captura bogue',
    icon: Video,
  },
  espejoMagicoFoto: {
    shortLabel: 'Espejo (Foto)',
    description: 'Espejo táctil interactivo configurado exclusivamente para toma de fotografías limpias de alta calidad.',
    caption: 'Foto espejo limpio',
    icon: Sparkles,
  },
  espejoMagicoFirma: {
    shortLabel: 'Espejo (Firma)',
    description: 'Espejo interactivo completo con prompts guiados, stickers y lienzo táctil para firmas y dibujos.',
    caption: 'Foto espejo firmado',
    icon: Sparkles,
  },
  espejoMagicoIA: {
    shortLabel: 'Espejo (Retrato IA)',
    description: 'Estación de inteligencia artificial y face-swap utilizando plantillas del multiverso (Marvel, princesas, etc.).',
    caption: 'Retrato IA',
    icon: Wand2,
  },
  totems: {
    shortLabel: 'Tótems Interactivos',
    description: 'Pantallas informativas y de juegos táctiles para guiar invitados, realizar encuestas y ver el muro en vivo.',
    caption: 'Interacción tótem',
    icon: Monitor,
  },
  capsulaTiempo: {
    shortLabel: 'Cápsula del Tiempo',
    description: 'Buzón digital interactivo de video y mensajes de voz para que los invitados regalen recuerdos eternos.',
    caption: 'Mensaje de cápsula',
    icon: Mic,
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
  fotocabina: ['Foto', 'Marcos', 'Impresión 10x15', 'Galería live', 'QR/WhatsApp'],
  plataforma360: ['Video 360', 'Slow motion', 'Speed ramp', 'Intro/Outro', 'Música', 'QR por video', 'Overlay animado', 'Salida LED'],
  bogue: ['Boomerang', 'Loop adelante/atrás', 'Video corto', 'Música', 'Overlay animado', 'Compartir por QR'],
  espejoMagicoFoto: ['Pantalla táctil', 'Foto limpia', 'Impresión premium', 'Filtros de piel', 'Galería QR', 'Prompts animados'],
  espejoMagicoFirma: ['Pantalla táctil', 'Firma digital', 'Dibujo libre', 'Stickers/Props', 'Impresión', 'Galería QR', 'Asistente de voz'],
  espejoMagicoIA: ['Face Swap', 'Marvel / Fantasía / Realeza', 'Estilo Cómics', 'Procesado IA en la nube', 'QR de descarga', 'Glow premium'],
  totems: ['Pantalla táctil', 'Bienvenida', 'Encuestas', 'Juegos interactivos', 'Mapa de salón', 'Muro social en vivo'],
  capsulaTiempo: ['Grabar Audio', 'Grabar Video', 'Reproducción de voz', 'Descarga ZIP', 'Audio de bienvenida', 'Notificaciones de pantalla'],
};

const MODERATION_LABELS: Record<ModerationMode, string> = {
  auto: 'Publicar automático',
  revision: 'Revisar antes de publicar',
  'solo-equipo': 'Solo equipo AK',
};

const PRO_EQUIPMENT: Record<StationId, string[]> = {
  fotocabina: ['Cámara Reflex o iPad Pro', 'Aro de luz profesional', 'Estructura totem', 'Impresora fotográfica opcional'],
  plataforma360: ['iPhone con app AK', 'Plataforma circular estable', 'Brazo giratorio motorizado', 'Aro de luz LED', 'Batería externa'],
  bogue: ['Celular o tablet', 'Trípode vertical', 'Iluminación continua', 'Código QR de sharing'],
  espejoMagicoFoto: ['Espejo táctil', 'Cámara DSLR oculta', 'Impresora fotográfica', 'Iluminación flash interna'],
  espejoMagicoFirma: ['Espejo táctil capacitivo', 'Cámara DSLR', 'Impresora fotográfica', 'Props físicos y cartel QR'],
  espejoMagicoIA: ['Tablet o espejo conectado', 'Cámara HD', 'Conexión a internet estable', 'Instrucciones del multiverso'],
  totems: ['Pantalla táctil vertical', 'Soporte físico reforzado', 'Cables de alimentación ocultos', 'Conexión local/offline'],
  capsulaTiempo: ['iPad/Celular con soporte', 'Micrófono de solapa con supresión de ruido', 'Luz de relleno suave', 'Auriculares de monitoreo'],
};

const PRO_FLOW: Record<StationId, string[]> = {
  fotocabina: ['Invitado toca pantalla', 'Tanda de fotos con cuenta regresiva', 'Armado automático 10x15', 'Escanea QR o imprime'],
  plataforma360: ['Invitado sube a plataforma', 'Giro del brazo con grabación', 'Generación de cámara lenta y speed ramp', 'Descarga por QR'],
  bogue: ['Invitado posa haciendo acción corta', 'Se graba loop corto', 'Se añade overlay y música', 'Comparte en redes'],
  espejoMagicoFoto: ['Invitado toca el espejo', 'Cuenta regresiva guiada', 'Toma foto espectacular', 'Imprime y escanea QR'],
  espejoMagicoFirma: ['Invitado toca el espejo', 'Cuenta regresiva', 'Dibuja o firma en pantalla', 'Elige stickers', 'Imprime / QR'],
  espejoMagicoIA: ['Invitado elige avatar', 'Toma foto de rostro', 'El motor IA procesa el face swap', 'Escanea QR del retrato mágico'],
  totems: ['Invitado interactúa con el menú', 'Completa encuesta o juego', 'Ve fotos de la fiesta en el muro', 'Consulta mapa/agenda'],
  capsulaTiempo: ['Invitado toca pantalla', 'Escucha mensaje de bienvenida del anfitrión', 'Graba su video o audio de felicitación', 'Guarda el recuerdo'],
};

const PRO_HIGHLIGHTS: Record<StationId, string[]> = {
  fotocabina: ['Fondo de la invitación', 'Diseños personalizados', 'Impresión rápida 10x15', 'Envío por WhatsApp'],
  plataforma360: ['Efectos cinemáticos', 'Música incorporada', 'Renderizado en 15 segundos', 'Muro social integrado'],
  bogue: ['Contenido super liviano', 'Efecto repetitivo viral', 'Música de fiesta', 'Estilo vertical historias'],
  espejoMagicoFoto: ['Look premium elegante', 'Fotos sin distracciones', 'Filtro de brillo glam', 'Impresión 4x6 instantánea'],
  espejoMagicoFirma: ['Altamente interactivo', 'Mensajes personalizados', 'Confeti digital', 'Props virtuales y físicos'],
  espejoMagicoIA: ['Experiencia tecnológica wow', 'Resultados realistas', 'Atracción garantizada', 'Integración Touchpix AI'],
  totems: ['Autoservicio total', 'Captura de feedback', 'Mapeo de mesas', 'Estadísticas de participación'],
  capsulaTiempo: ['Mensajes de voz emotivos', 'Videos divertidos de pista', 'Álbum digital privado', 'Descarga zip completa'],
};

const MARKET_BENCHMARK_INSIGHTS = [
  { label: 'Touchpix AI', detail: 'Sincronización remota, face swap automático, plantillas y modo sharing station offline.' },
  { label: 'Snappic Premium', detail: 'Filtros de beauty avanzados, edición de videos con speed-ramping y micrositios de galería.' },
  { label: 'Audio Guestbook Físico', detail: 'Teléfonos retro que graban audios. AK lo supera integrando video y QR en una sola tablet.' },
];

const TEMPLATE_PRESETS: Record<StationId, EntertainmentTemplatePreset[]> = {
  fotocabina: [
    {
      id: 'fc-elegante',
      name: 'Elegante Blanco',
      mood: 'Estilo boda minimalista',
      overlayName: 'Marco blanco con flores finas',
      accentColor: '#ffffff',
      outputFormat: 'JPG 10x15 (1200x1800) + Impresión',
      qualityPreset: 'Alta calidad DSLR',
      filterPreset: 'Color natural con balance de luz',
      musicTrack: 'Ninguna',
      backgroundStyle: 'Cortina clara o fondo de flores',
      printLayout: 'Foto completa 4x6 con QR',
      animationStyle: 'Flash tradicional',
    },
  ],
  plataforma360: [
    {
      id: '360-party',
      name: 'Pista de Baño 360',
      mood: 'Alta energía, pista de baile',
      overlayName: 'Overlay de luces de neon',
      accentColor: '#a855f7',
      outputFormat: 'MP4 vertical 1080p',
      qualityPreset: 'HD 60fps',
      filterPreset: 'Contraste alto + colores saturados',
      musicTrack: 'Beat electrónico de 10s',
      backgroundStyle: 'Luces led de pista',
      printLayout: 'Video vertical con logo del evento',
      animationStyle: 'Slow-motion central con aceleración en puntas',
    },
  ],
  bogue: [
    {
      id: 'bogue-glam',
      name: 'Glam Boomerang',
      mood: 'Estetico y chic',
      overlayName: 'Filtro destellos dorados',
      accentColor: '#eab308',
      outputFormat: 'MP4 loop + GIF',
      qualityPreset: 'HD Liviano',
      filterPreset: 'Golden hour glam',
      musicTrack: 'Pop bailable corto',
      backgroundStyle: 'Fondo de lentejuelas doradas',
      printLayout: 'Historia 9:16 con QR inferior',
      animationStyle: 'Loop ida y vuelta rápido',
    },
  ],
  espejoMagicoFoto: [
    {
      id: 'mirror-clean',
      name: 'Foto Limpia Pro',
      mood: 'Retrato formal premium',
      overlayName: 'Sin marco sobreimpreso',
      accentColor: '#10b981',
      outputFormat: 'JPG + Print 4x6',
      qualityPreset: 'Super HD',
      filterPreset: 'Retoque de piel natural',
      musicTrack: 'Prompt de voz suave',
      backgroundStyle: 'Espejo real',
      printLayout: 'Fotografía completa 4x6 con logo pequeño',
      animationStyle: 'Destello estroboscópico',
    },
  ],
  espejoMagicoFirma: [
    {
      id: 'mirror-signature',
      name: 'Firma y Dedicatoria',
      mood: 'Divertido y familiar',
      overlayName: 'Marco de felicitaciones interactivo',
      accentColor: '#ec4899',
      outputFormat: 'JPG con dibujo',
      qualityPreset: 'Alta calidad 300dpi',
      filterPreset: 'Contraste vivo',
      musicTrack: 'Música alegre de fondo',
      backgroundStyle: 'Lienzo interactivo',
      printLayout: 'Foto con dedicatoria firmada',
      animationStyle: 'Confeti digital al finalizar',
    },
  ],
  espejoMagicoIA: [
    {
      id: 'mirror-ia-marvel',
      name: 'Héroes del Multiverso',
      mood: 'Tecnológico y lúdico',
      overlayName: 'Borde cómic Marvel',
      accentColor: '#ef4444',
      outputFormat: 'JPG Face Swap',
      qualityPreset: 'FHD optimizado',
      filterPreset: 'Fusión de texturas IA',
      musicTrack: 'Fanfarria heroica',
      backgroundStyle: 'Fondo de ciudad destruida o galaxia',
      printLayout: 'Póster de superhéroe con rostro de invitado',
      animationStyle: 'Efecto escáner futurista',
    },
  ],
  totems: [
    {
      id: 'totem-welcome',
      name: 'Bienvenida Interactiva',
      mood: 'Informativo y social',
      overlayName: 'Pantalla con agenda de la fiesta',
      accentColor: '#06b6d4',
      outputFormat: 'Pantalla interactiva',
      qualityPreset: 'Modo kiosco rápido',
      filterPreset: 'Contraste para interiores',
      musicTrack: 'Chill out suave',
      backgroundStyle: 'Fondo temático del evento',
      printLayout: 'Agenda + QR de fotos',
      animationStyle: 'Transiciones de diapositiva suaves',
    },
  ],
  capsulaTiempo: [
    {
      id: 'capsula-default',
      name: 'Cofre de Recuerdos',
      mood: 'Sentimental y alegre',
      overlayName: 'Buzón digital grabador',
      accentColor: '#f43f5e',
      outputFormat: 'Audio / Video mensaje',
      qualityPreset: 'Audio HD sin pérdidas / Video HD',
      filterPreset: 'Iluminación cálida de rostro',
      musicTrack: 'Sonido de campana para grabar',
      backgroundStyle: 'Cabina aislada',
      printLayout: 'Tarjeta digital de agradecimiento',
      animationStyle: 'Onda de audio reactiva',
    },
  ],
};

function makeChecklist(type: StationId): EntertainmentChecklistItem[] {
  const shared = [
    'Branding del evento cargado',
    'QR visible para invitados',
    'Prueba de envío realizada',
    'Plan B de respaldo definido',
    'Responsable de estación asignado',
  ];
  const specificByType: Record<StationId, string[]> = {
    fotocabina: ['Plantilla de foto cargada', 'Cámara y aro de luz calibrados', 'Impresora conectada y con papel'],
    plataforma360: ['Celular cargado al 100%', 'Brazo giratorio calibrado', 'Ángulo y luz de pista chequeados'],
    bogue: ['Configuración de duración ajustada', 'Efecto loop testeado', 'Soporte de celular bloqueado'],
    espejoMagicoFoto: ['Espejo limpio y calibrado', 'Impresión de prueba lista', 'Guía de voz activada'],
    espejoMagicoFirma: ['Pincel de firma probado', 'Stickers virtuales cargados', 'Espejo limpio y listo'],
    espejoMagicoIA: ['Conexión de red de alta velocidad', 'Límites de créditos IA validados', 'Plantillas cargadas'],
    totems: ['Menú táctil configurado', 'Muro en vivo enlazado', 'Código QR de mesas verificado'],
    capsulaTiempo: ['Micrófono inalámbrico probado', 'Audio de bienvenida grabado', 'Espacio en disco suficiente'],
  };
  const specific = specificByType[type] || [];
  return [...specific, ...shared].map((text, index) => ({
    id: `${type}_check_${index + 1}`,
    text,
    done: index < 2,
  }));
}

function makeProDefaults(type: StationId, eventName: string): Omit<EntertainmentStation, 'id' | 'title' | 'enabled' | 'status' | 'operatorName' | 'deviceName' | 'location' | 'startTime' | 'overlayName' | 'accentColor' | 'captureModes' | 'deliveryChannels' | 'checklist' | 'script' | 'notes' | 'media'> {
  const preset = TEMPLATE_PRESETS[type]?.[0] || TEMPLATE_PRESETS['fotocabina'][0];
  return {
    activeTemplateId: preset.id,
    templateName: `${eventName} - Pro`,
    brandText: eventName,
    footerText: 'AK Producciones',
    qrCallout: 'Escaneá y llevate tu recuerdo al instante',
    logoUrl: '',
    filterPreset: preset.filterPreset,
    musicTrack: preset.musicTrack,
    backgroundStyle: preset.backgroundStyle,
    printLayout: preset.printLayout,
    animationStyle: preset.animationStyle,
    outputFormat: preset.outputFormat,
    qualityPreset: preset.qualityPreset,
    sessionGoal: 'Entregar el mejor recuerdo de la fiesta',
    shareMessage: `¡Tu recuerdo de ${eventName} ya está listo! Ingresá al link, descargalo y compartilo en tus redes.`,
    printCopies: type.startsWith('espejoMagico') || type === 'fotocabina' ? 1 : 0,
    maxRetakes: 2,
    estimatedDurationSeconds: 15,
    countdownSeconds: type === 'plataforma360' ? 5 : 4,
    recordingDurationSeconds: type === 'plataforma360' ? 15 : type === 'bogue' ? 4 : 3,
    reviewSeconds: 20,
    allowGuestRetake: true,
    consentRequired: type === 'espejoMagicoIA',
    moderationMode: 'auto',
    offlineQueueEnabled: true,
    autoPublish: true,
    leadCaptureEnabled: true,
    analyticsEnabled: true,
    backupPlan: 'Guardar localmente en la cola offline y subir al retornar internet.',
    equipment: PRO_EQUIPMENT[type] || [],
    guestFlow: PRO_FLOW[type] || [],
    proHighlights: PRO_HIGHLIGHTS[type] || [],
  };
}

function makeStation(type: StationId, fiesta?: FiestaEnPlanificacion | null): EntertainmentStation {
  const eventName = fiesta?.configuracion?.nombreEvento || 'Evento AK';
  const proDefaults = makeProDefaults(type, eventName);
  const meta = STATION_META[type];

  let captureModes = ['Foto'];
  if (type === 'plataforma360') captureModes = ['Video 360', 'Slow motion'];
  else if (type === 'bogue') captureModes = ['Boomerang', 'Loop'];
  else if (type === 'espejoMagicoFirma') captureModes = ['Foto', 'Firma', 'Stickers'];
  else if (type === 'espejoMagicoIA') captureModes = ['Foto', 'IA Face Swap'];
  else if (type === 'totems') captureModes = ['Información', 'Juegos', 'Muro'];
  else if (type === 'capsulaTiempo') captureModes = ['Audio', 'Video'];

  return {
    id: type,
    title: meta.shortLabel,
    enabled: true,
    status: 'preparando',
    operatorName: '',
    deviceName: 'iPad / Notebook / Android',
    location: 'Salón Principal',
    startTime: '22:00',
    overlayName: `${eventName} - Overlay AK`,
    accentColor: presetColor(type),
    ...proDefaults,
    captureModes,
    deliveryChannels: ['qr', 'whatsapp', 'galeria'],
    checklist: makeChecklist(type),
    script: `El operador asiste a los invitados, inicia la captura en el ${meta.shortLabel} y les indica que escaneen el QR al terminar.`,
    notes: '',
    media: [],
  };
}

function presetColor(type: StationId): string {
  switch (type) {
    case 'fotocabina': return '#3b82f6';
    case 'plataforma360': return '#a855f7';
    case 'bogue': return '#eab308';
    case 'espejoMagicoFoto': return '#10b981';
    case 'espejoMagicoFirma': return '#ec4899';
    case 'espejoMagicoIA': return '#f43f5e';
    case 'totems': return '#06b6d4';
    case 'capsulaTiempo': return '#f43f5e';
  }
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
    modules: STATION_IDS.reduce((acc, id) => {
      acc[id] = makeStation(id, fiesta);
      return acc;
    }, {} as Record<StationId, EntertainmentStation>),
  };
}

function mergeEntertainmentData(
  stored: Partial<EntertainmentData> | null | undefined,
  fiesta?: FiestaEnPlanificacion | null,
  origin = ''
): EntertainmentData {
  const defaults = makeDefaultEntertainment(fiesta, origin);

  // Migración del antiguo espejoMagico unificado a las nuevas variantes divididas
  const storedOldEspejo = (stored?.modules as any)?.[ 'espejoMagico' ];

  const modules = STATION_IDS.reduce((acc, stationId) => {
    let storedStation = stored?.modules?.[stationId];

    // Si no hay datos específicos de la estación dividida, pero existía la unificada, la heredamos
    if (!storedStation && storedOldEspejo && (stationId === 'espejoMagicoFoto' || stationId === 'espejoMagicoFirma' || stationId === 'espejoMagicoIA')) {
      storedStation = {
        ...storedOldEspejo,
        id: stationId,
        title: STATION_META[stationId].shortLabel,
      };
    }

    const defaultStation = defaults.modules[stationId];
    acc[stationId] = {
      ...defaultStation,
      ...(storedStation || {}),
      checklist: storedStation?.checklist || defaultStation.checklist,
      media: storedStation?.media || [],
      equipment: storedStation?.equipment || defaultStation.equipment,
      guestFlow: storedStation?.guestFlow || defaultStation.guestFlow,
      proHighlights: storedStation?.proHighlights || defaultStation.proHighlights,
      moderationMode: (storedStation?.moderationMode || defaultStation.moderationMode) as ModerationMode,
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
      countdownSeconds: storedStation?.countdownSeconds || defaultStation.countdownSeconds,
      recordingDurationSeconds:
        storedStation?.recordingDurationSeconds || defaultStation.recordingDurationSeconds,
      reviewSeconds: storedStation?.reviewSeconds || defaultStation.reviewSeconds,
      allowGuestRetake:
        storedStation?.allowGuestRetake ?? defaultStation.allowGuestRetake,
      consentRequired: storedStation?.consentRequired ?? defaultStation.consentRequired,
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
  const checksScore = station.checklist.length ? Math.round((checksDone / station.checklist.length) * 35) : 0;
  let score = checksScore;
  if (station.enabled) score += 15;
  if (station.status === 'listo' || station.status === 'en-vivo') score += 15;
  if (station.operatorName?.trim()) score += 10;
  if (station.location?.trim()) score += 10;
  if (station.overlayName?.trim()) score += 5;
  if (station.deliveryChannels.length >= 2) score += 10;
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
    <span className={cn('inline-flex rounded-full border px-3 py-0.5 text-[10px] font-black uppercase tracking-wider', STATUS_META[status].className)}>
      {STATUS_META[status].label}
    </span>
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
  const [launchTokens, setLaunchTokens] = useState<
    Partial<Record<StationId, { guest: string; operator: string }>>
  >({});

  // Active sub-section / Wizard state
  const [activeStationId, setActiveStationId] = useState<StationId | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isQrFlyerOpen, setIsQrFlyerOpen] = useState(false);

  // Buzon configuration/messages state for Capsula de Tiempo
  const [buzonMessages, setBuzonMessages] = useState<BuzonMessage[]>([]);
  const [isWelcomeSaving, setIsWelcomeSaving] = useState(false);
  const [isDeletingMsg, setIsDeletingMsg] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isWelcomePlaying, setIsWelcomePlaying] = useState(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const msgAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const loadBuzonData = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const msgs = await getBuzonMessages(fiestaId);
      setBuzonMessages(msgs);
    } catch (err) {
      console.error('Error al cargar mensajes de buzon:', err);
    }
  }, [fiestaId]);

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

      // Cargar mensajes de buzon para capsula de tiempo
      await loadBuzonData();
    };
    load();
  }, [fiestaId, toast, loadBuzonData]);

  useEffect(() => {
    if (!fiestaId || !activeStationId || launchTokens[activeStationId]) return;
    let cancelled = false;
    getEntertainmentLaunchToken(fiestaId, activeStationId).then((result) => {
      if (!cancelled && result.success && result.guestToken && result.operatorToken) {
        setLaunchTokens((current) => ({
          ...current,
          [activeStationId]: { guest: result.guestToken, operator: result.operatorToken },
        }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeStationId, fiestaId, launchTokens]);

  const overallScore = useMemo(() => {
    if (!data) return 0;
    return Math.round(STATION_IDS.reduce((sum, id) => sum + stationScore(data.modules[id]), 0) / STATION_IDS.length);
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
  }, [data, fiesta, fiestaId, origin, toast]);

  const uploadMedia = useCallback(async (file: File, stationId: StationId) => {
    if (!fiestaId) return;

    // Si la estación es la Cápsula del Tiempo, subimos de forma diferente si es el audio de bienvenida
    setUploadingStation(stationId);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('moduleId', stationId);
    formData.append('file', file);
    formData.append('authorName', 'Equipo AK');
    formData.append('caption', STATION_META[stationId].caption);

    const result = await uploadEntretenimientoMedia(formData);
    setUploadingStation(null);

    if (!result.success) {
      toast({ title: 'No se pudo subir', description: result.error, variant: 'destructive' });
      return;
    }

    setData(mergeEntertainmentData(result.data, fiesta, origin));
  }, [fiesta, fiestaId, origin, toast]);

  // Audio Welcome Controls for Cápsula del Tiempo
  const toggleWelcomePlay = () => {
    if (!fiesta?.buzonConfig?.welcomeAudioUrl) return;
    if (!welcomeAudioRef.current) {
      welcomeAudioRef.current = new Audio(fiesta.buzonConfig.welcomeAudioUrl);
      welcomeAudioRef.current.onended = () => setIsWelcomePlaying(false);
    }
    if (isWelcomePlaying) {
      welcomeAudioRef.current.pause();
      setIsWelcomePlaying(false);
    } else {
      if (playingMsgId && msgAudioRef.current) {
        msgAudioRef.current.pause();
        setPlayingMsgId(null);
      }
      welcomeAudioRef.current.play();
      setIsWelcomePlaying(true);
    }
  };

  const startRecording = async () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch {
      toast({
        title: 'Error de micrófono',
        description: 'Permití el acceso al micrófono para grabar el audio.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const saveRecordedWelcome = async () => {
    if (!audioBlob || !fiestaId) return;
    setIsWelcomeSaving(true);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('file', audioBlob, 'bienvenida.webm');
    try {
      const res = await uploadWelcomeAudio(formData);
      if (res.success) {
        setAudioBlob(null);
        setAudioUrl(null);
        welcomeAudioRef.current = null;
        // Refrescar fiesta
        const result = await getEntretenimientoFiesta(fiestaId);
        if (result.success && result.fiesta) {
          setFiesta(result.fiesta);
        }
      } else {
        toast({ title: 'Error al subir', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsWelcomeSaving(false);
    }
  };

  const handleDeleteWelcome = async () => {
    if (!fiestaId) return;
    if (!confirm('¿Seguro que deseás eliminar el audio de bienvenida?')) return;
    setIsWelcomeSaving(true);
    try {
      const res = await deleteWelcomeAudio(fiestaId);
      if (res.success) {
        welcomeAudioRef.current = null;
        setIsWelcomePlaying(false);
        // Refrescar fiesta
        const result = await getEntretenimientoFiesta(fiestaId);
        if (result.success && result.fiesta) {
          setFiesta(result.fiesta);
        }
      } else {
        toast({ title: 'Error al eliminar', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsWelcomeSaving(false);
    }
  };

  // Play messages from guests
  const handlePlayMessage = (msg: BuzonMessage) => {
    if (playingMsgId === msg.id) {
      msgAudioRef.current?.pause();
      setPlayingMsgId(null);
    } else {
      if (msgAudioRef.current) {
        msgAudioRef.current.pause();
      }
      if (isWelcomePlaying && welcomeAudioRef.current) {
        welcomeAudioRef.current.pause();
        setIsWelcomePlaying(false);
      }
      msgAudioRef.current = new Audio(msg.mediaUrl);
      msgAudioRef.current.onended = () => setPlayingMsgId(null);
      msgAudioRef.current.play();
      setPlayingMsgId(msg.id);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar este saludo?')) return;
    setIsDeletingMsg(id);
    try {
      const res = await deleteBuzonMessage(id);
      if (res.success) {
        setBuzonMessages(prev => prev.filter(m => m.id !== id));
        toast({ title: 'Saludo eliminado correctamente.' });
      } else {
        toast({ title: 'Error al eliminar', description: res.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error de red', variant: 'destructive' });
    } finally {
      setIsDeletingMsg(null);
    }
  };

  const getGuestLaunchLink = (stationId: StationId) =>
    getEntertainmentGuestPath(fiestaId || '', stationId, launchTokens[stationId]?.guest);

  const getOperatorLaunchLink = (stationId: StationId) =>
    getEntertainmentOperatorPath(fiestaId || '', stationId, launchTokens[stationId]?.operator);

  // La cola de impresion: solo en las estaciones que imprimen (fotocabina,
  // plataforma 360 y 360 con inteligencia artificial). La pantalla existia y no se
  // llegaba desde ningun lado: habia que escribir la direccion a mano.
  const getPrintLaunchLink = (stationId: StationId) =>
    getEntertainmentPrintPath(fiestaId || '', stationId, launchTokens[stationId]?.operator);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-rose-500 mx-auto" />
          <p className="text-zinc-400 text-xs uppercase tracking-widest font-black">Cargando Tecnología de Entretenimiento...</p>
        </div>
      </div>
    );
  }

  if (!fiestaId || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center bg-[#09090b] px-6 text-center text-white">
        <Camera className="mb-4 h-16 w-16 text-rose-500" />
        <h1 className="text-3xl font-black tracking-tight">Falta seleccionar una fiesta</h1>
        <p className="mt-2 text-zinc-400 font-semibold text-sm">Entrá desde el planificador para usar este módulo.</p>
        <Button asChild className="mt-6 bg-rose-600 hover:bg-rose-500 font-black"><Link href="/eventos">Volver a eventos</Link></Button>
      </div>
    );
  }

  // Active Station details for the wizard
  const activeStation = (activeStationId ? data.modules[activeStationId] : null) as EntertainmentStation;

  return (
    <div className="min-h-screen bg-[#09090b] text-white px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* HEADER GENERAL */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-zinc-800/60 pb-8">
          <div className="flex items-start gap-4">
            <Button asChild variant="outline" size="icon" className="rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/10 font-bold text-[10px] uppercase tracking-widest">
                  Tecnología Operativa
                </Badge>
                <Badge className="border-zinc-800 bg-zinc-900 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
                  AK Suite v2
                </Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
                Entretenimiento en Vivo
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-400">
                Configuración progresiva del equipamiento en campo para operadores y personal técnico de AK Producciones.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {/*
              La puerta al tablero de la noche.
              La pantalla existia y no habia forma de llegar: ningun boton ni menu
              llevaba hasta ella, asi que nadie la iba a abrir nunca. Va aca, que es
              donde el equipo arma el entretenimiento de esta fiesta.
            */}
            <Button asChild variant="outline" className="rounded-xl border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 hover:text-white font-black">
              <Link href={`/fiestas/${fiestaId}/entretenimiento/control`}>
                <Monitor className="mr-2 h-4 w-4" />
                Tablero de la noche
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800 hover:text-white font-black">
              <Link href={`/fiestas/nueva/muro-social?fiestaId=${fiestaId}`}>
                <Monitor className="mr-2 h-4 w-4" />
                Muro Social
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQrFlyerOpen(true)}
              className="rounded-xl border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 hover:text-white font-black"
            >
              <Printer className="mr-2 h-4 w-4" />
              Carteles QR para Mesas
            </Button>
            <Button onClick={saveNow} disabled={isSaving} className="rounded-xl bg-rose-600 font-black text-white hover:bg-rose-500 transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)]">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* SI NO HAY NINGUNA ESTACION SELECCIONADA: MOSTRAR DASHBOARD DE TARJETAS */}
        {!activeStationId ? (
          <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">

            {/* PANEL DE PROGRESO GENERAL */}
            <Card className="border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 bg-rose-500/10 rounded-full blur-3xl" />
              <CardContent className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] lg:p-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-white">{data.eventName}</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-400">
                      <span>Puesta a punto general</span>
                      <span className="text-white">{overallScore}%</span>
                    </div>
                    <Progress value={overallScore} className="h-2.5 bg-zinc-800" />
                  </div>
                  <p className="text-zinc-400 text-xs font-medium">
                    Sincronizá el checklist operativo de todas las cabinas contratadas para garantizar un evento sin fallas.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/80 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                    <Users className="h-5 w-5 text-rose-400 mb-2" />
                    <p className="text-2xl font-black">{fiesta?.configuracion?.invitadosEstimados || 0}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Invitados</p>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
                    <Sparkles className="h-5 w-5 text-amber-400 mb-2" />
                    <p className="text-2xl font-black">{STATION_IDS.length}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Módulos Totales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DASHBOARD GRID DE TARJETAS */}
            <div>
              <h2 className="text-xl font-black mb-6 uppercase tracking-wider text-zinc-300">Estaciones Disponibles</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {STATION_IDS.map((stationId) => {
                  const station = data.modules[stationId];
                  const meta = STATION_META[stationId];
                  const Icon = meta.icon;
                  const score = stationScore(station);
                  const activeStyle = station.enabled
                    ? 'border-rose-500/40 bg-zinc-950/90 shadow-[0_0_30px_rgba(244,63,94,0.05)]'
                    : 'border-zinc-800 bg-zinc-950/40 opacity-70';

                  return (
                    <div
                      key={stationId}
                      className={cn(
                        'rounded-[2rem] border p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1',
                        activeStyle
                      )}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className={cn(
                            'rounded-2xl p-3 text-white shadow-lg',
                            station.enabled ? 'bg-rose-600' : 'bg-zinc-800'
                          )}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <StatusBadge status={station.status} />
                        </div>

                        <div>
                          <h3 className="text-lg font-black leading-tight text-white">{meta.shortLabel}</h3>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            <span>Preparación</span>
                            <span className="text-white">{score}%</span>
                          </div>
                          <Progress value={score} className="h-1.5 bg-zinc-900" />
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase text-zinc-500">
                          {station.enabled ? 'Activa' : 'Inactiva'}
                        </div>
                        <Button
                          onClick={() => {
                            setActiveStationId(stationId);
                            setWizardStep(1);
                          }}
                          className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-black uppercase tracking-wider border border-zinc-800 px-4 py-2"
                        >
                          Configurar
                          <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN BENCHMARK DE MERCADO */}
            <Card className="border-zinc-800/60 bg-zinc-950/40">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-400">Benchmark del mercado y ventajas AK</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {MARKET_BENCHMARK_INSIGHTS.map((item) => (
                    <div key={item.label} className="bg-zinc-900/30 border border-zinc-800/30 rounded-2xl p-4">
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-xs font-semibold leading-relaxed text-zinc-400">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (

          /* SI HAY UNA ESTACION SELECCIONADA: MOSTRAR EL ASISTENTE PROGRESIVO (WIZARD) */
          <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">

            {/* CABECERA DEL WIZARD */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-zinc-950/90 border border-zinc-800/80 rounded-[2rem] p-6">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setActiveStationId(null)}
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-rose-500">Paso {wizardStep} de 4</span>
                    <Badge className="border-zinc-800 bg-zinc-900 text-zinc-300 font-bold text-[9px] uppercase tracking-widest">
                      {activeStation.title}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-black">Asistente de Configuración</h2>
                </div>
              </div>

              {/* INDICADORES VISUALES DE PASOS */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => {
                  const stepLabels = ['Datos', 'Temas', 'Checklist', 'Lanzar'];
                  const active = wizardStep === step;
                  const done = wizardStep > step;
                  return (
                    <button
                      key={step}
                      disabled
                      className={cn(
                        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all',
                        active
                          ? 'bg-rose-600 text-white font-black'
                          : done
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/50'
                            : 'bg-zinc-900/40 text-zinc-600 border border-zinc-900'
                      )}
                    >
                      <span className={cn('h-4 w-4 rounded-full text-[9px] flex items-center justify-center font-black', active ? 'bg-white text-rose-600' : done ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-950 text-zinc-700')}>
                        {step}
                      </span>
                      <span className="hidden sm:inline">{stepLabels[step - 1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CONTENIDO DEL PASO ACTIVO */}
            <div className="bg-zinc-950/60 border border-zinc-800/40 rounded-[2rem] p-6 lg:p-8 min-h-[400px]">

              {/* PASO 1: DATOS OPERATIVOS */}
              {wizardStep === 1 && (
                <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
                  <div className="border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-rose-500" />
                      1. Datos Operativos de Estación
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Configuración del personal, ubicación física y estado en vivo.</p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-between">
                      <Label className="text-zinc-400 text-xs font-black uppercase tracking-widest">Estado de Módulo</Label>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm font-bold text-white">{activeStation.enabled ? 'Habilitado' : 'Deshabilitado'}</span>
                        <Switch
                          checked={activeStation.enabled}
                          onCheckedChange={(enabled) => updateStation(activeStationId, { enabled })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Responsable / Operador</Label>
                      <Input
                        value={activeStation.operatorName}
                        onChange={(e) => updateStation(activeStationId, { operatorName: e.target.value })}
                        placeholder="Nombre del personal AK"
                        className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Ubicación en Salón</Label>
                      <Input
                        value={activeStation.location}
                        onChange={(e) => updateStation(activeStationId, { location: e.target.value })}
                        placeholder="Ej: Entrada, Pista de Baile"
                        className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Hora Programada Inicio</Label>
                      <Input
                        value={activeStation.startTime}
                        onChange={(e) => updateStation(activeStationId, { startTime: e.target.value })}
                        placeholder="Ej: 22:30"
                        className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Estado de Operación Actual</Label>
                    <div className="grid gap-4 md:grid-cols-4">
                      {(['preparando', 'listo', 'en-vivo', 'pausado'] as StationStatus[]).map((status) => {
                        const active = activeStation.status === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStation(activeStationId, { status })}
                            className={cn(
                              'rounded-2xl border p-4 text-left transition-all duration-200',
                              active
                                ? 'border-rose-500 bg-rose-950/20 text-white shadow-xl'
                                : 'border-zinc-800/80 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            )}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              {status === 'en-vivo' ? <Play className="h-4 w-4 text-rose-500" /> : status === 'pausado' ? <Pause className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                              <span className="text-xs font-black uppercase tracking-widest">{STATUS_META[status].label}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed text-zinc-500">
                              Define el estado visible en el feed del evento.
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* EQUIPAMIENTO REQUERIDO */}
                  <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6">
                    <h4 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-4 flex items-center gap-2">
                      <ListTodo className="h-4 w-4 text-zinc-400" />
                      Equipamiento Técnico Mínimo Requerido:
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      {activeStation.equipment.map((item) => (
                        <div key={item} className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/30 rounded-xl p-3">
                          <CheckCircle2 className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="text-xs font-bold text-zinc-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: AJUSTES Y TEMAS (PERSONALIZACIÓN) */}
              {wizardStep === 2 && (
                <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
                  <div className="border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-rose-500" />
                      2. Personalización y Temas Visuales
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Configuración del branding del cliente, plantillas y canales de entrega.</p>
                  </div>

                  {/* PLANTILLAS PREESTABLECIDAS */}
                  {TEMPLATE_PRESETS[activeStationId] && TEMPLATE_PRESETS[activeStationId].length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Presets de Plantilla</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        {TEMPLATE_PRESETS[activeStationId].map((preset) => {
                          const active = activeStation.activeTemplateId === preset.id;
                          return (
                            <button
                              type="button"
                              key={preset.id}
                              onClick={() => updateStation(activeStationId, templatePresetToPatch(activeStation, preset))}
                              className={cn(
                                'rounded-[1.5rem] border p-5 text-left transition-all duration-200 hover:-translate-y-0.5',
                                active
                                  ? 'border-rose-500 bg-rose-950/20 text-white shadow-xl'
                                  : 'border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700'
                              )}
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="h-4 w-4 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: preset.accentColor }} />
                                  <span className="text-sm font-black">{preset.name}</span>
                                </div>
                                <Badge className="text-[9px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300">Preset</Badge>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed">{preset.mood}</p>
                              <div className="mt-3 flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                <span>{preset.outputFormat}</span>
                                <span>•</span>
                                <span>{preset.qualityPreset}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CONFIGURACIÓN BRANDING */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-zinc-300">Textos de Marca</h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Título del Evento (Brand Text)</Label>
                          <Input
                            value={activeStation.brandText}
                            onChange={(e) => updateStation(activeStationId, { brandText: e.target.value })}
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Pie de Impresión / Copyright</Label>
                          <Input
                            value={activeStation.footerText}
                            onChange={(e) => updateStation(activeStationId, { footerText: e.target.value })}
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Llamado al QR de Descarga</Label>
                          <Input
                            value={activeStation.qrCallout}
                            onChange={(e) => updateStation(activeStationId, { qrCallout: e.target.value })}
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Overlay / Nombre del Marco</Label>
                          <Input
                            value={activeStation.overlayName}
                            onChange={(e) => updateStation(activeStationId, { overlayName: e.target.value })}
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-wider text-zinc-300">Canales y Modos de Captura</h4>

                      {activeStationId !== 'capsulaTiempo' && (
                        <div className="space-y-3">
                          <Label className="text-xs text-zinc-400 font-bold">Modos de Captura Habilitados</Label>
                          <div className="flex flex-wrap gap-2">
                            {FEATURE_LIBRARY[activeStationId]?.map((mode) => {
                              const active = activeStation.captureModes.includes(mode);
                              return (
                                <button
                                  type="button"
                                  key={mode}
                                  onClick={() => toggleArrayValue(activeStationId, 'captureModes', mode)}
                                  className={cn(
                                    'rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest transition-all',
                                    active
                                      ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700'
                                  )}
                                >
                                  {mode}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-xs text-zinc-400 font-bold">Métodos de Entrega</Label>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {CHANNELS.map((channel) => {
                            const ChannelIcon = channel.icon;
                            const active = activeStation.deliveryChannels.includes(channel.id);
                            return (
                              <button
                                type="button"
                                key={channel.id}
                                onClick={() => toggleArrayValue(activeStationId, 'deliveryChannels', channel.id)}
                                className={cn(
                                  'flex items-center gap-2 rounded-xl border p-3 text-xs font-black uppercase tracking-widest transition-all',
                                  active
                                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700'
                                )}
                              >
                                <ChannelIcon className="h-4 w-4" />
                                {channel.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Copias de Impresión</Label>
                          <Input
                            type="number"
                            min={0}
                            value={activeStation.printCopies}
                            onChange={(e) => updateStation(activeStationId, { printCopies: Number(e.target.value) || 0 })}
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Color Acento</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={activeStation.accentColor}
                              onChange={(e) => updateStation(activeStationId, { accentColor: e.target.value })}
                              className="h-10 w-12 bg-zinc-900/40 border-zinc-800 text-white rounded-xl p-1 shrink-0 cursor-pointer"
                            />
                            <Input
                              value={activeStation.accentColor}
                              onChange={(e) => updateStation(activeStationId, { accentColor: e.target.value })}
                              className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Cuenta regresiva</Label>
                          <Input
                            type="number"
                            min={2}
                            max={10}
                            value={activeStation.countdownSeconds}
                            onChange={(e) =>
                              updateStation(activeStationId, {
                                countdownSeconds: Math.max(2, Number(e.target.value) || 4),
                              })
                            }
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Duracion de captura</Label>
                          <Input
                            type="number"
                            min={2}
                            max={60}
                            value={activeStation.recordingDurationSeconds}
                            onChange={(e) =>
                              updateStation(activeStationId, {
                                recordingDurationSeconds: Math.max(2, Number(e.target.value) || 3),
                              })
                            }
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Tiempo de revision</Label>
                          <Input
                            type="number"
                            min={5}
                            max={120}
                            value={activeStation.reviewSeconds}
                            onChange={(e) =>
                              updateStation(activeStationId, {
                                reviewSeconds: Math.max(5, Number(e.target.value) || 20),
                              })
                            }
                            className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                          <span className="text-xs font-bold text-zinc-300">Permitir repetir captura</span>
                          <Switch
                            checked={activeStation.allowGuestRetake}
                            onCheckedChange={(allowGuestRetake) =>
                              updateStation(activeStationId, { allowGuestRetake })
                            }
                          />
                        </label>
                        {activeStationId === 'espejoMagicoIA' && (
                          <label className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                            <span className="text-xs font-bold text-zinc-300">Consentimiento para IA</span>
                            <Switch
                              checked={activeStation.consentRequired}
                              onCheckedChange={(consentRequired) =>
                                updateStation(activeStationId, { consentRequired })
                              }
                            />
                          </label>
                        )}
                      </div>

                      {/* MARCOS HABILITADOS PARA FOTOCABINA */}
                      {activeStationId === 'fotocabina' && (
                        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-zinc-300 font-bold uppercase tracking-wider">
                              Marcos Habilitados para la Fiesta
                            </Label>
                            <span className="text-[10px] text-zinc-400">
                              Elegí qué marcos estarán disponibles en pantalla
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'none', label: 'Sin Marco' },
                              { id: 'golden', label: 'Dorado Elegante' },
                              { id: 'neon', label: 'Neón Glow' },
                              { id: 'flowers', label: 'Flores Románticas' },
                              { id: 'ak_brand', label: 'AK Brand Oficial' },
                            ].map((marco) => {
                              const list = activeStation.marcosHabilitados || ['none', 'golden', 'neon', 'flowers', 'ak_brand'];
                              const active = list.includes(marco.id);
                              return (
                                <button
                                  type="button"
                                  key={marco.id}
                                  onClick={() => {
                                    const next = active
                                      ? list.filter((m) => m !== marco.id)
                                      : [...list, marco.id];
                                    updateStation(activeStationId, { marcosHabilitados: next });
                                  }}
                                  className={cn(
                                    'flex items-center justify-between rounded-xl border p-2.5 text-xs font-bold transition-all',
                                    active
                                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:border-zinc-700'
                                  )}
                                >
                                  <span>{marco.label}</span>
                                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* FILTRO DE COLOR Y ESTILO VISUAL DE LA ESTACIÓN */}
                      <div className="grid gap-4 sm:grid-cols-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Filtro de Color</Label>
                          <Select
                            value={activeStation.filterPreset || 'normal'}
                            onValueChange={(filterPreset) => updateStation(activeStationId, { filterPreset })}
                          >
                            <SelectTrigger className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl">
                              <SelectValue placeholder="Normal" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="normal">Natural / Sin filtro</SelectItem>
                              <SelectItem value="vintage">Vintage Cálido</SelectItem>
                              <SelectItem value="bn">Blanco y Negro Clásico</SelectItem>
                              <SelectItem value="vibrante">Color Vibrante</SelectItem>
                              <SelectItem value="sepia">Sepia Nostálgico</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Animación del Disparo</Label>
                          <Select
                            value={activeStation.animationStyle || 'flash_clasico'}
                            onValueChange={(animationStyle) => updateStation(activeStationId, { animationStyle })}
                          >
                            <SelectTrigger className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl">
                              <SelectValue placeholder="Flash Clásico" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="flash_clasico">Flash Blanco Clásico</SelectItem>
                              <SelectItem value="destello_neon">Destello Neón</SelectItem>
                              <SelectItem value="suave">Transición Suave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400 font-bold">Estilo de Fondo</Label>
                          <Select
                            value={activeStation.backgroundStyle || 'predeterminado'}
                            onValueChange={(backgroundStyle) => updateStation(activeStationId, { backgroundStyle })}
                          >
                            <SelectTrigger className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl">
                              <SelectValue placeholder="Predeterminado" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                              <SelectItem value="predeterminado">Predeterminado del Evento</SelectItem>
                              <SelectItem value="elegante">Elegante Dorado</SelectItem>
                              <SelectItem value="fiesta">Fiesta Neón</SelectItem>
                              <SelectItem value="minimalista">Minimalista Oscuro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-zinc-300">Mensajes de Compartir y Plan B</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-400 font-bold">Mensaje a Compartir (WhatsApp/Mail)</Label>
                        <Textarea
                          value={activeStation.shareMessage}
                          onChange={(e) => updateStation(activeStationId, { shareMessage: e.target.value })}
                          rows={3}
                          className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-zinc-400 font-bold">Plan B Operativo (Falla técnica)</Label>
                        <Textarea
                          value={activeStation.backupPlan}
                          onChange={(e) => updateStation(activeStationId, { backupPlan: e.target.value })}
                          rows={3}
                          className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: CHECKLIST OPERATIVO */}
              {wizardStep === 3 && (
                <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
                  <div className="border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <ListTodo className="h-5 w-5 text-rose-500" />
                      3. Checklist de Puesta a Punto
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">El operador debe marcar todos los requerimientos listos antes de iniciar operaciones.</p>
                  </div>

                  <div className="max-w-2xl mx-auto space-y-4">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">
                      <span>Tareas completadas</span>
                      <span>{activeStation.checklist.filter(i => i.done).length} de {activeStation.checklist.length}</span>
                    </div>
                    <Progress
                      value={activeStation.checklist.length ? (activeStation.checklist.filter(i => i.done).length / activeStation.checklist.length) * 100 : 0}
                      className="h-2 bg-zinc-900"
                    />

                    <div className="grid gap-3 pt-4">
                      {activeStation.checklist.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => toggleChecklist(activeStationId, item.id)}
                          className={cn(
                            'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
                            item.done
                              ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-300'
                              : 'border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700'
                          )}
                        >
                          <span className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full border shrink-0',
                            item.done
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                              : 'border-zinc-700 bg-zinc-950 text-zinc-600'
                          )}>
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-bold">{item.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 4: MODO OPERATIVO Y LANZAMIENTO */}
              {wizardStep === 4 && (
                <div className="space-y-8 animate-[fadeIn_0.2s_ease-out]">
                  <div className="border-b border-[#18181b] pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <RadioTower className="h-5 w-5 text-rose-500" />
                      4. Lanzamiento y Control Técnico
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">Lanzá el servicio interactivo, probá la cámara y visualizá los mensajes grabados.</p>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

                    {/* PANEL IZQUIERDO: CONTROLES / BUZÓN DE RECUERDOS SI ES CÁPSULA DEL TIEMPO */}
                    <div className="space-y-6">

                      {/* SI ES LA CÁPSULA DEL TIEMPO, RENDERIZAMOS LA INTERFAZ DE CONFIGURACIÓN DEL BUZÓN */}
                      {activeStationId === 'capsulaTiempo' ? (
                        <div className="space-y-6">

                          {/* SALUDO DE BIENVENIDA DEL ANFITRIÓN */}
                          <Card className="border-zinc-800 bg-zinc-900/30">
                            <CardHeader>
                              <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                                <Volume2 className="h-4 w-4 text-rose-400" />
                                Mensaje de Bienvenida de los Anfitriones
                              </CardTitle>
                              <CardDescription className="text-zinc-500 text-xs">
                                Este audio sonará automáticamente en la tablet cuando el invitado vaya a dejar su saludo.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">

                              {/* Estado del audio actual */}
                              {fiesta?.buzonConfig?.welcomeAudioUrl ? (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-rose-600/10 border border-rose-500/20 p-3 text-rose-400">
                                      <FileAudio className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-white">Audio de Bienvenida Activo</p>
                                      <p className="text-[10px] text-zinc-500">Subido para esta fiesta</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={toggleWelcomePlay}
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl border-zinc-800 bg-zinc-900 text-xs font-bold"
                                    >
                                      {isWelcomePlaying ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                                      {isWelcomePlaying ? 'Pausar' : 'Escuchar'}
                                    </Button>
                                    <Button
                                      onClick={handleDeleteWelcome}
                                      variant="destructive"
                                      size="sm"
                                      className="rounded-xl text-xs font-bold"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center">
                                  <Volume2 className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                                  <p className="text-xs font-bold text-zinc-400">No hay audio de bienvenida cargado aún.</p>
                                </div>
                              )}

                              {/* Formulario para grabar o subir */}
                              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                                <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                                  <Mic className="h-6 w-6 text-rose-400" />
                                  <p className="text-xs font-bold">Grabar desde micrófono</p>

                                  {isRecording ? (
                                    <div className="flex flex-col items-center gap-2">
                                      <span className="text-xs font-black text-rose-500 animate-pulse uppercase">Grabando... {recordingSeconds}s</span>
                                      <Button onClick={stopRecording} variant="destructive" size="sm" className="rounded-xl font-bold">
                                        <Square className="h-3 w-3 mr-1.5 fill-current animate-pulse text-rose-600" /> Detener
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-2">
                                      {audioUrl ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <Button onClick={() => new Audio(audioUrl!).play()} variant="outline" size="sm" className="rounded-xl text-[10px] font-bold">Reproducir grabación</Button>
                                          <Button onClick={saveRecordedWelcome} disabled={isWelcomeSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold">
                                            {isWelcomeSaving ? 'Subiendo...' : 'Guardar'}
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button onClick={startRecording} variant="outline" size="sm" className="rounded-xl font-bold text-xs">Iniciar Grabación</Button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                                  <Upload className="h-6 w-6 text-zinc-400" />
                                  <p className="text-xs font-bold">Subir archivo de audio</p>
                                  <label className="cursor-pointer inline-flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-300">
                                    {isWelcomeSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1.5" />}
                                    Seleccionar
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      className="hidden"
                                      disabled={isWelcomeSaving}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setIsWelcomeSaving(true);
                                        const formData = new FormData();
                                        formData.append('fiestaId', fiestaId);
                                        formData.append('file', file);
                                        const res = await uploadWelcomeAudio(formData);
                                        setIsWelcomeSaving(false);
                                        if (res.success) {
                                          const result = await getEntretenimientoFiesta(fiestaId);
                                          if (result.success && result.fiesta) {
                                            setFiesta(result.fiesta);
                                          }
                                        } else {
                                          toast({ title: 'Error al subir', description: res.error, variant: 'destructive' });
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* RECUERDOS GRABADOS POR INVITADOS */}
                          <Card className="border-zinc-800 bg-zinc-900/30">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-300">Recuerdos Grabados por Invitados</CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">Listado de mensajes grabados por los asistentes a la fiesta.</CardDescription>
                              </div>
                              <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30">{buzonMessages.length}</Badge>
                            </CardHeader>
                            <CardContent className="max-h-[350px] overflow-y-auto space-y-3">
                              {buzonMessages.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 p-8 text-center">
                                  <FileAudio className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
                                  <p className="text-xs font-semibold text-zinc-500">Nadie grabó recuerdos en la Cápsula del Tiempo aún.</p>
                                </div>
                              ) : (
                                buzonMessages.map((msg) => (
                                  <div key={msg.id} className="flex items-center justify-between gap-4 bg-zinc-950/80 border border-zinc-800/60 rounded-2xl p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-2.5 text-zinc-400">
                                        {msg.mediaType === 'video' ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-white">{msg.authorName}</p>
                                        <p className="text-[9px] text-zinc-500">
                                          {msg.mediaType === 'video' ? 'Video' : 'Voz'} • {msg.durationSeconds}s • {formatDateTime(msg.timestamp)}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {msg.mediaType === 'audio' ? (
                                        <Button
                                          onClick={() => handlePlayMessage(msg)}
                                          variant="outline"
                                          size="sm"
                                          className="rounded-lg text-[10px] font-bold"
                                        >
                                          {playingMsgId === msg.id ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                          {playingMsgId === msg.id ? 'Pausar' : 'Escuchar'}
                                        </Button>
                                      ) : (
                                        <Button
                                          asChild
                                          variant="outline"
                                          size="sm"
                                          className="rounded-lg text-[10px] font-bold"
                                        >
                                          <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">Ver Video</a>
                                        </Button>
                                      )}
                                      <Button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg"
                                        disabled={isDeletingMsg === msg.id}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </CardContent>
                          </Card>

                        </div>
                      ) : (

                        /* SI NO ES CÁPSULA DEL TIEMPO, MOSTRAMOS LA SUBIDA DE ARCHIVOS DE PRUEBA Y GUION */
                        <div className="space-y-6">
                          <Card className="border-zinc-800 bg-zinc-900/30">
                            <CardHeader>
                              <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                                <Upload className="h-4 w-4 text-zinc-400" />
                                Subir Capturas de Prueba
                              </CardTitle>
                              <CardDescription className="text-zinc-500 text-xs">
                                Subí fotos o videos para validar que el overlay, filtros y branding se apliquen correctamente.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex items-center gap-4">
                                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-xl transition-all">
                                  {uploadingStation === activeStationId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                  Subir Archivo
                                  <input
                                    type="file"
                                    accept={activeStationId === 'plataforma360' || activeStationId === 'bogue' ? 'video/*' : 'image/*'}
                                    className="hidden"
                                    disabled={uploadingStation === activeStationId}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) await uploadMedia(file, activeStationId);
                                      e.currentTarget.value = '';
                                    }}
                                  />
                                </label>
                              </div>

                              {/* LISTA DE CAPTURAS RECIENTES */}
                              <div className="grid gap-4 sm:grid-cols-2">
                                {activeStation.media.length === 0 ? (
                                  <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 p-6 text-center text-zinc-500">
                                    <ImageIcon className="mx-auto mb-2 h-7 w-7 text-zinc-700" />
                                    <p className="text-xs font-semibold">No hay capturas cargadas para esta estación aún.</p>
                                  </div>
                                ) : (
                                  activeStation.media.slice(0, 4).map((item) => (
                                    <a
                                      key={item.id}
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-rose-500/40 hover:bg-zinc-950"
                                    >
                                      <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        <div className="flex items-center gap-1.5">
                                          {item.type === 'video' ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                                          <span>{item.type}</span>
                                        </div>
                                        <span>{formatDateTime(item.uploadedAt)}</span>
                                      </div>
                                      <p className="line-clamp-1 text-xs font-bold text-zinc-300">{item.fileName}</p>
                                    </a>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* GUION Y NOTAS INTERNAS */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Guion del Operador</Label>
                              <Textarea
                                value={activeStation.script}
                                onChange={(e) => updateStation(activeStationId, { script: e.target.value })}
                                rows={3}
                                className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl text-xs"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Notas de Montaje Técnico</Label>
                              <Textarea
                                value={activeStation.notes}
                                onChange={(e) => updateStation(activeStationId, { notes: e.target.value })}
                                rows={3}
                                placeholder="Ej: llevar trípode de repuesto, asegurar wifi, probar sensor."
                                className="bg-zinc-900/40 border-zinc-800 text-white rounded-xl text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* PANEL DERECHO: QR DE ACCESO Y ENLACES DE OPERACIÓN */}
                    <div className="space-y-6">

                      {/* CARTEL DE QR DE LA ESTACIÓN */}
                      <Card className="overflow-hidden border-zinc-800 bg-zinc-950/80 text-white flex flex-col items-center p-6 text-center">
                        <div className="mb-4 flex items-center justify-between w-full border-b border-zinc-900 pb-3">
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">QR de Acceso Invitados</p>
                            <p className="text-sm font-black text-rose-400">{data.eventHashtag}</p>
                          </div>
                          <RadioTower className="h-5 w-5 text-rose-500" />
                        </div>

                        <div className="rounded-3xl bg-white p-5 shadow-2xl shadow-rose-500/5 my-3">
                          <QRCodeSVG
                            value={`${origin}${getGuestLaunchLink(activeStationId)}`}
                            size={180}
                          />
                        </div>

                        <div className="w-full mt-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 text-left space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            <span>Marca: {activeStation.footerText || 'AK'}</span>
                            <span>{activeStation.outputFormat}</span>
                          </div>
                          <p className="text-sm font-black leading-snug">{activeStation.brandText}</p>
                          <p className="text-xs text-zinc-400">{activeStation.qrCallout}</p>
                        </div>
                      </Card>

                      {/* ENLACES OPERATIVOS PARA EL OPERADOR */}
                      <Card className="border-zinc-800 bg-zinc-950/80">
                        <CardHeader>
                          <CardTitle className="text-sm font-black uppercase tracking-wider text-zinc-300">Pantallas de Funcionamiento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Copiá o abrí estos enlaces en el dispositivo operativo (tablet, celular o notebook del operador) para iniciar el funcionamiento interactivo.
                          </p>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <Button
                              asChild
                              className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(225,29,72,0.15)]"
                            >
                              <a
                                href={getGuestLaunchLink(activeStationId)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Pantalla Invitado
                              </a>
                            </Button>
                            {getOperatorLaunchLink(activeStationId) && (
                              <Button asChild variant="outline" className="w-full rounded-xl border-zinc-700 bg-zinc-900 text-white font-black text-xs uppercase tracking-wider">
                                <a
                                  href={getOperatorLaunchLink(activeStationId)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Consola Operador
                                </a>
                              </Button>
                            )}
                            {getPrintLaunchLink(activeStationId) && (
                              <Button asChild variant="outline" className="w-full rounded-xl border-amber-700/60 bg-amber-950/40 text-amber-100 font-black text-xs uppercase tracking-wider">
                                <a
                                  href={getPrintLaunchLink(activeStationId)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Cola de Impresión
                                </a>
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                navigator.clipboard.writeText(`${origin}${getGuestLaunchLink(activeStationId)}`);
                                toast({ title: 'Enlace de invitado copiado.' });
                              }}
                              variant="outline"
                              className="w-full rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 text-xs font-black uppercase tracking-wider"
                            >
                              Copiar Invitado
                            </Button>
                            {getOperatorLaunchLink(activeStationId) && (
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${origin}${getOperatorLaunchLink(activeStationId)}`);
                                  toast({ title: 'Enlace de operador copiado.' });
                                }}
                                variant="outline"
                                className="w-full rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 text-xs font-black uppercase tracking-wider"
                              >
                                Copiar Operador
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* BOTONES DE NAVEGACIÓN DEL WIZARD */}
            <div className="flex items-center justify-between bg-zinc-950/90 border border-zinc-800/80 rounded-[2rem] p-6">
              <Button
                onClick={() => {
                  if (wizardStep === 1) {
                    setActiveStationId(null);
                  } else {
                    setWizardStep(prev => prev - 1);
                  }
                }}
                variant="outline"
                className="rounded-xl border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white font-black text-xs uppercase tracking-wider"
              >
                <ChevronLeft className="h-4 w-4 mr-1.5" />
                {wizardStep === 1 ? 'Dashboard' : 'Anterior'}
              </Button>

              <Button
                onClick={() => {
                  if (wizardStep === 4) {
                    saveNow();
                    setActiveStationId(null);
                  } else {
                    setWizardStep(prev => prev + 1);
                  }
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.2)] text-white"
              >
                {wizardStep === 4 ? 'Finalizar y Guardar' : 'Siguiente'}
                {wizardStep !== 4 && <ChevronRight className="h-4 w-4 ml-1.5" />}
              </Button>
            </div>

          </div>
        )}

        {/* Social Wall Table QR Flyer Generator Modal */}
        <Dialog open={isQrFlyerOpen} onOpenChange={setIsQrFlyerOpen}>
          <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white">Carteles QR de Mesa para el Muro</DialogTitle>
            </DialogHeader>
            <QrFlyerGenerator
              qrUrl={`${origin}/evento/social-wall/${fiestaId}`}
              eventName={fiesta?.configuracion?.nombreEvento || data?.eventName || 'Nuestra Fiesta'}
              onClose={() => setIsQrFlyerOpen(false)}
            />
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

export default function EntretenimientoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-10 w-10 animate-spin text-rose-500" />
      </div>
    }>
      <EntretenimientoContent />
    </Suspense>
  );
}
