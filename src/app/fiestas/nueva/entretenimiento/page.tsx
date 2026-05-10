'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Download,
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

type StationId = 'fotocabina' | 'plataforma360';
type StationStatus = 'preparando' | 'listo' | 'en-vivo' | 'pausado';

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
  captureModes: string[];
  deliveryChannels: string[];
  checklist: EntertainmentChecklistItem[];
  script: string;
  notes: string;
  media: EntertainmentMediaItem[];
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

const CHANNELS = [
  { id: 'qr', label: 'QR', icon: QrCode },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: Share2 },
  { id: 'galeria', label: 'Galeria', icon: ImageIcon },
  { id: 'descarga', label: 'Descarga', icon: Download },
];

const FEATURE_LIBRARY: Record<StationId, string[]> = {
  fotocabina: ['Foto', 'GIF', 'Boomerang', 'Filtros', 'Marcos', 'Impresion'],
  plataforma360: ['Video 360', 'Slow motion', 'Speed ramp', 'Intro/Outro', 'Musica', 'QR por video'],
};

function makeChecklist(type: StationId): EntertainmentChecklistItem[] {
  const shared = [
    'Branding del evento cargado',
    'QR visible para invitados',
    'Galeria y muro social abiertos',
    'Prueba de envio realizada',
    'Responsable asignado',
  ];
  const specific =
    type === 'fotocabina'
      ? ['Plantilla de foto aprobada', 'Fondo o marco elegido', 'Impresora / salida digital verificada']
      : ['Celular con bateria suficiente', 'Tripode o soporte estable', 'Prueba de giro y encuadre hecha'];

  return [...specific, ...shared].map((text, index) => ({
    id: `${type}_check_${index + 1}`,
    text,
    done: index < 2,
  }));
}

function makeStation(type: StationId, fiesta?: FiestaEnPlanificacion | null): EntertainmentStation {
  const eventName = fiesta?.configuracion?.nombreEvento || 'Evento AK';

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
      captureModes: ['Foto', 'GIF', 'Boomerang'],
      deliveryChannels: ['qr', 'mail', 'whatsapp', 'galeria'],
      checklist: makeChecklist('fotocabina'),
      script: 'Captura, aplica marco AK, muestra QR y deja la foto lista para galeria y muro social.',
      notes: '',
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
    },
  };
}

function mergeEntertainmentData(
  stored: Partial<EntertainmentData> | null | undefined,
  fiesta?: FiestaEnPlanificacion | null,
  origin = ''
): EntertainmentData {
  const defaults = makeDefaultEntertainment(fiesta, origin);
  const modules = {
    fotocabina: { ...defaults.modules.fotocabina, ...(stored?.modules?.fotocabina || {}) },
    plataforma360: { ...defaults.modules.plataforma360, ...(stored?.modules?.plataforma360 || {}) },
  };

  modules.fotocabina.checklist = stored?.modules?.fotocabina?.checklist || defaults.modules.fotocabina.checklist;
  modules.plataforma360.checklist =
    stored?.modules?.plataforma360?.checklist || defaults.modules.plataforma360.checklist;
  modules.fotocabina.media = stored?.modules?.fotocabina?.media || [];
  modules.plataforma360.media = stored?.modules?.plataforma360?.media || [];

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
  return Math.min(100, score);
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
  const Icon = station.id === 'fotocabina' ? Camera : RotateCcw;
  const score = stationScore(station);
  const captureAccept = station.id === 'plataforma360' ? 'video/*,image/*' : 'image/*,video/*';

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
                  {station.id === 'fotocabina'
                    ? 'Captura fotos, GIFs y boomerangs con marca del evento, QR y galeria.'
                    : 'Control de clips 360 usando celular, subida rapida y salida lista para compartir.'}
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
                <p className="mt-4 text-xs font-semibold leading-relaxed text-white/60">
                  Este QR apunta a la experiencia social de la fiesta para que el invitado vea, comparta y participe.
                </p>
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
                      capture={station.id === 'plataforma360' ? 'environment' : undefined}
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
    return Math.round((stationScore(data.modules.fotocabina) + stationScore(data.modules.plataforma360)) / 2);
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
    toast({ title: 'Entretenimiento guardado', description: 'Fotocabina y Plataforma 360 quedaron actualizadas.' });
  }, [data, fiesta, fiestaId, origin, toast]);

  const uploadMedia = useCallback(async (file: File, stationId: StationId) => {
    if (!fiestaId) return;
    setUploadingStation(stationId);
    const formData = new FormData();
    formData.append('fiestaId', fiestaId);
    formData.append('moduleId', stationId);
    formData.append('file', file);
    formData.append('authorName', 'AK Producciones');
    formData.append('caption', stationId === 'plataforma360' ? 'Captura 360' : 'Captura fotocabina');

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
                Fotocabina y Plataforma 360 como estaciones profesionales conectadas al evento, al QR y al muro social.
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
                    <p className="text-2xl font-black text-slate-950">{data.eventHashtag}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Hashtag</p>
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

        <Tabs defaultValue="fotocabina" className="space-y-5">
          <TabsList className="grid h-auto grid-cols-2 rounded-2xl bg-white p-1 shadow-lg">
            <TabsTrigger value="fotocabina" className="rounded-xl py-3 font-black">
              <Camera className="mr-2 h-4 w-4" />
              Fotocabina
            </TabsTrigger>
            <TabsTrigger value="plataforma360" className="rounded-xl py-3 font-black">
              <RotateCcw className="mr-2 h-4 w-4" />
              Plataforma 360
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fotocabina">
            <StationPanel
              station={data.modules.fotocabina}
              galleryUrl={data.galleryUrl}
              eventHashtag={data.eventHashtag}
              uploading={uploadingStation === 'fotocabina'}
              onUpdate={(patch) => updateStation('fotocabina', patch)}
              onToggleChecklist={(checkId) => toggleChecklist('fotocabina', checkId)}
              onToggleArrayValue={(field, value) => toggleArrayValue('fotocabina', field, value)}
              onUpload={uploadMedia}
            />
          </TabsContent>

          <TabsContent value="plataforma360">
            <StationPanel
              station={data.modules.plataforma360}
              galleryUrl={data.galleryUrl}
              eventHashtag={data.eventHashtag}
              uploading={uploadingStation === 'plataforma360'}
              onUpdate={(patch) => updateStation('plataforma360', patch)}
              onToggleChecklist={(checkId) => toggleChecklist('plataforma360', checkId)}
              onToggleArrayValue={(field, value) => toggleArrayValue('plataforma360', field, value)}
              onUpload={uploadMedia}
            />
          </TabsContent>
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
