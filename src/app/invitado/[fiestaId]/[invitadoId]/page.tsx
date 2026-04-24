'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateGuestRsvp } from '@/app/actions/fiesta/invitados.actions';
import type { FiestaEnPlanificacion, Invitado, PerfilInvitado, GuestPortalSettings, RsvpStatus, DietaryRestriction } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Loader2, AlertTriangle, Send, CheckCircle2, XCircle, HelpCircle,
  Star, Accessibility, Crown, Users, User, Map, CloudRain, ParkingCircle,
  Navigation, Images, Globe, MapPin, Music, Gift, QrCode,
  Instagram, Facebook, Phone,
  Utensils, ChevronDown, ChevronUp, Plus, Trash2, Clock, CalendarCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Config helpers ───────────────────────────────────────────────────────────

const rsvpConfig: Record<RsvpStatus, { icon: React.ElementType; cls: string; badge: string; label: string }> = {
  Confirmado: { icon: CheckCircle2, cls: 'text-green-500', badge: 'bg-green-100 text-green-700 border-green-200', label: 'Confirmado' },
  Rechazado:  { icon: XCircle,      cls: 'text-red-400',   badge: 'bg-red-100 text-red-700 border-red-200',     label: 'No asistiré' },
  'Tal vez':  { icon: HelpCircle,   cls: 'text-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Tal vez' },
  Pendiente:  { icon: HelpCircle,   cls: 'text-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Pendiente' },
};

const perfilConfig: Record<PerfilInvitado, { label: string; icon: React.ElementType; color: string; bg: string; gradient: string }> = {
  VIP:                  { label: 'Invitado VIP',     icon: Crown,        color: 'text-amber-700', bg: 'bg-amber-100',  gradient: 'from-amber-500 to-yellow-500'   },
  Familia:              { label: 'Familia',           icon: Users,        color: 'text-blue-700',  bg: 'bg-blue-100',   gradient: 'from-blue-500 to-indigo-500'    },
  General:              { label: 'Invitado',          icon: User,         color: 'text-slate-700', bg: 'bg-slate-100',  gradient: 'from-purple-500 to-pink-500'    },
  'Necesidades Especiales': { label: 'Atención Especial', icon: Accessibility, color: 'text-green-700', bg: 'bg-green-100', gradient: 'from-green-500 to-teal-500' },
};

const DIETARY_OPTIONS: DietaryRestriction[] = [
  'Ninguna', 'Celiaco', 'Vegetariano', 'Vegano',
  'Sin Gluten', 'Sin Lactosa', 'Alergia Mariscos', 'Alergia Frutos Secos', 'Otro',
];

// ─── Collapsible section ─────────────────────────────────────────────────────

function Section({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  headerClassName = '',
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  headerClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${headerClassName}`}
      >
        <Icon className="w-4 h-4 shrink-0 text-purple-600" />
        <span className="flex-1 text-sm font-bold text-slate-800">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <CardContent className="pt-0 pb-4 space-y-3">{children}</CardContent>}
    </Card>
  );
}

/** Ensures at least 3 editable song slots, preserving any existing suggestions. */
function initializeSongSlots(existing?: string[]): string[] {
  if (!existing || existing.length === 0) return ['', '', ''];
  const minSlots = Math.max(3, existing.length);
  return [...existing, ...Array(minSlots - existing.length).fill('')].slice(0, minSlots);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InvitadoPage() {
  const params = useParams<{ fiestaId: string; invitadoId: string }>();
  const { fiestaId, invitadoId } = params;
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Form state
  const [rsvp, setRsvp] = useState<RsvpStatus>('Pendiente');
  const [partySize, setPartySize] = useState(1);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [dietary, setDietary] = useState<DietaryRestriction>('Ninguna');
  const [alergias, setAlergias] = useState('');
  const [songs, setSongs] = useState<string[]>(['', '', '']);
  const [mensaje, setMensaje] = useState('');

  const load = useCallback(async () => {
    if (!fiestaId || !invitadoId) return;
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) { setError('Evento no encontrado.'); return; }
      setFiesta(data);
      const inv = (data.invitados ?? []).find(i => i.id === invitadoId);
      if (!inv) { setError('Invitado no encontrado.'); return; }
      setInvitado(inv);
      // Populate form from saved data
      setRsvp(inv.rsvp ?? 'Pendiente');
      setPartySize(inv.partySize ?? 1);
      setCompanionNames(inv.companionNames ?? []);
      setDietary(inv.dietaryRestriction ?? 'Ninguna');
      setAlergias(inv.alergiasEspecificas ?? '');
      setSongs(initializeSongSlots(inv.cancionesDJ));
      setMensaje(inv.mensaje ?? '');
      if (inv.rsvp && inv.rsvp !== 'Pendiente') setSaved(true);
    } catch {
      setError('No se pudo cargar el evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, invitadoId]);

  useEffect(() => { load(); }, [load]);

  const handlePartySizeChange = (val: number) => {
    const size = Math.max(1, val);
    setPartySize(size);
    setCompanionNames(prev => {
      const companions = size - 1;
      if (companions <= 0) return [];
      return Array.from({ length: companions }, (_, i) => prev[i] ?? '');
    });
  };

  const handleSongChange = (idx: number, val: string) => {
    setSongs(prev => prev.map((s, i) => i === idx ? val : s));
  };

  const addSongSlot = () => setSongs(prev => [...prev, '']);

  const removeSongSlot = (idx: number) => setSongs(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!invitado) return;
    setIsSaving(true);
    const filteredSongs = songs.map(s => s.trim()).filter(Boolean);
    const result = await updateGuestRsvp(fiestaId, invitadoId, {
      rsvp,
      partySize,
      companionNames: companionNames.map(n => n.trim()).filter(Boolean),
      dietaryRestriction: dietary,
      alergiasEspecificas: alergias.trim(),
      cancionesDJ: filteredSongs,
      mensaje: mensaje.trim() || undefined,
    });
    if (result.success) {
      setSaved(true);
      if (result.invitado) setInvitado(result.invitado);
      toast({ title: '✅ ¡Todo guardado!', description: 'Tu confirmación fue registrada correctamente.' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudo guardar.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  // ─── Loading / error ──────────────────────────────────────────────────────

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-black">
      <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
    </div>
  );

  if (error || !fiesta || !invitado) return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-purple-950 via-slate-900 to-black">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'No se encontró el invitado.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Derived data ─────────────────────────────────────────────────────────

  const config = fiesta.configuracion;
  const fechaEvento = config?.fechaEvento ? new Date(config.fechaEvento) : null;
  const diasRestantes = fechaEvento
    ? Math.ceil((fechaEvento.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const perfil = invitado.perfil ?? 'General';
  const perfilCfg = perfilConfig[perfil];
  const PerfilIcon = perfilCfg.icon;
  const isVip = perfil === 'VIP';
  const isAccesibilidad = perfil === 'Necesidades Especiales' || invitado.requiereAccesibilidad;

  // Guest portal settings (what the admin has configured as visible)
  const gps: GuestPortalSettings = {
    showMural: true,
    showFotos: true,
    showInvitacionWeb: true,
    showMesaAsignada: true,
    showItinerario: true,
    showMusica: true,
    showRegalos: false,
    showCheckin: false,
    ...(fiesta.guestPortalSettings ?? {}),
  };

  // Validate custom colors from admin settings
  const accentRaw = gps.customAccentColor || '';
  const accentColor = /^#[0-9A-Fa-f]{3,8}$/.test(accentRaw) ? accentRaw : '#7c3aed';
  const bgRaw = gps.customBgColor || '';
  const customBg = /^#[0-9A-Fa-f]{3,8}$/.test(bgRaw) ? bgRaw : null;

  const headerBg = customBg ? { backgroundColor: accentColor } : undefined;
  const headerCls = customBg ? '' : 'bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900';
  const pageBg = customBg ? { backgroundColor: customBg } : undefined;
  const pageCls = customBg
    ? 'min-h-screen'
    : 'min-h-screen bg-gradient-to-br from-purple-950 via-slate-900 to-black';

  const invitacionUrl = fiesta.invitacionSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invitacion/${fiesta.invitacionSlug}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/invitacion/${fiestaId}`;

  const quickLinks = [
    gps.showInvitacionWeb && {
      icon: Globe, label: 'Invitación', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100',
      href: invitacionUrl, external: true,
    },
    gps.showMural && {
      icon: Images, label: 'Muro', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100',
      href: `/evento/muro-en-vivo/${fiestaId}`, external: true,
    },
    gps.showMusica && {
      icon: Music, label: 'Canciones', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100',
      href: `/portal-cliente/${fiestaId}/musica`, external: false,
    },
    gps.showRegalos && {
      icon: Gift, label: 'Regalos', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100',
      href: `/portal-cliente/${fiestaId}/regalos`, external: false,
    },
    gps.showCheckin && {
      icon: QrCode, label: 'Check-in', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100',
      href: `/evento/accesos/${fiestaId}`, external: false,
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType; label: string; color: string; bg: string; href: string; external: boolean;
  }>;

  return (
    <div className={pageCls} style={pageBg}>

      {/* Header */}
      <header className={`${headerCls} border-b border-purple-700/30 shadow-2xl sticky top-0 z-40`} style={headerBg}>
        <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-purple-200 opacity-80">{config?.tipoCelebracion}</p>
          </div>
          {diasRestantes !== null && diasRestantes >= 0 && (
            <Badge variant="outline" className="text-amber-300 border-amber-400/50 bg-amber-500/20 shrink-0 font-bold">
              {diasRestantes === 0 ? '🎉 ¡Hoy!' : `${diasRestantes} días`}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">

        {/* Welcome message from admin */}
        {gps.welcomeMessage && (
          <div className="rounded-2xl border text-center px-5 py-4 bg-white/90 shadow-sm">
            <p className="text-sm text-slate-600 italic">{gps.welcomeMessage}</p>
          </div>
        )}

        {/* Quick Links (controlled by guestPortalSettings) */}
        {quickLinks.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(({ icon: Icon, label, color, bg, href, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 text-center transition-transform hover:scale-105 active:scale-95 shadow-sm bg-white ${bg}`}
                >
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className={`text-[11px] font-bold ${color}`}>{label}</span>
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 text-center transition-transform hover:scale-105 active:scale-95 shadow-sm bg-white ${bg}`}
                >
                  <Icon className={`w-6 h-6 ${color}`} />
                  <span className={`text-[11px] font-bold ${color}`}>{label}</span>
                </Link>
              ),
            )}
          </div>
        )}

        {/* Welcome */}
        <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white via-slate-50 to-purple-50">
          <div className={`h-2 bg-gradient-to-r ${perfilCfg.gradient}`} />
          <CardContent className="pt-6 text-center space-y-3">
            <div className={`w-16 h-16 rounded-full ${perfilCfg.bg} flex items-center justify-center mx-auto ring-4 ring-white shadow-lg`}>
              {isVip
                ? <Crown className={`w-8 h-8 ${perfilCfg.color} animate-pulse`} />
                : <span className="text-3xl">🎉</span>}
            </div>
            <div>
              {perfil !== 'General' && (
                <Badge className={`${perfilCfg.bg} ${perfilCfg.color} border-0 text-xs mb-1`}>
                  <PerfilIcon className="w-3 h-3 mr-1" />
                  {perfilCfg.label}
                </Badge>
              )}
              <p className="text-xl font-black text-slate-900">¡Hola, {invitado.nombre}!</p>
              <p className="text-sm text-slate-500 mt-1">
                Estás invitado/a a <span className="font-semibold">{config?.nombreEvento}</span>
              </p>
            </div>
            {fechaEvento && (
              <p className="text-sm text-slate-600">
                📅 {fechaEvento.toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                {config?.horaInicio && <> · {config.horaInicio}h</>}
              </p>
            )}
            {config?.nombreLugar && <p className="text-sm text-slate-600">📍 {config.nombreLugar}</p>}
            {config?.direccionLugar && <p className="text-xs text-slate-400">{config.direccionLugar}</p>}
          </CardContent>
        </Card>

        {/* Personalized message */}
        {invitado.mensajePersonalizado && (
          <Card className={`border ${isVip ? 'border-amber-200 bg-amber-50' : 'border-indigo-200 bg-indigo-50'}`}>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className={`text-sm font-black flex items-center gap-2 ${isVip ? 'text-amber-800' : 'text-indigo-800'}`}>
                <Star className="w-4 h-4" />
                Mensaje especial para vos
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className={`text-sm leading-relaxed italic ${isVip ? 'text-amber-900' : 'text-indigo-900'}`}>
                &ldquo;{invitado.mensajePersonalizado}&rdquo;
              </p>
            </CardContent>
          </Card>
        )}

        {/* Saved confirmation banner */}
        {saved && (
          <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800">Confirmación registrada</p>
              <p className="text-xs text-green-700">Estado actual: <span className="font-semibold">{rsvp}</span></p>
            </div>
            <Badge className={`text-xs border ${rsvpConfig[rsvp]?.badge ?? ''}`}>{rsvpConfig[rsvp]?.label}</Badge>
          </div>
        )}

        {/* ── FORM ─────────────────────────────────────────────────────── */}

        {/* 1. RSVP */}
        <Section title="¿Vas a asistir?" icon={CalendarCheck} defaultOpen>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {(['Confirmado', 'Tal vez', 'Rechazado'] as RsvpStatus[]).map(status => {
              const cfg = rsvpConfig[status];
              const Icon = cfg.icon;
              const active = rsvp === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRsvp(status)}
                  aria-label={`Seleccionar: ${cfg.label}`}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 px-2 text-xs font-semibold transition-all
                    ${active ? 'border-purple-500 bg-purple-50 shadow-md scale-105' : 'border-slate-200 bg-white hover:border-purple-300'}`}
                >
                  <Icon className={`w-5 h-5 ${active ? cfg.cls : 'text-slate-400'}`} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* 2. Party size & companion names (only when confirming) */}
        {rsvp === 'Confirmado' && (
          <Section title="¿Cuántos vienen?" icon={Users} defaultOpen>
            <div className="flex items-center gap-3 pt-1">
              <Label className="text-sm font-semibold text-slate-700 shrink-0">Total de personas</Label>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button" variant="outline" size="icon"
                  className="h-8 w-8"
                  aria-label="Reducir cantidad de personas"
                  onClick={() => handlePartySizeChange(partySize - 1)}
                  disabled={partySize <= 1}
                >–</Button>
                <span className="w-8 text-center font-bold text-slate-900" aria-live="polite">{partySize}</span>
                <Button
                  type="button" variant="outline" size="icon"
                  className="h-8 w-8"
                  aria-label="Aumentar cantidad de personas"
                  onClick={() => handlePartySizeChange(partySize + 1)}
                >+</Button>
              </div>
            </div>
            {partySize > 1 && (
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-slate-500">Nombres de acompañantes (opcional)</Label>
                {Array.from({ length: partySize - 1 }, (_, i) => (
                  <Input
                    key={i}
                    placeholder={`Acompañante ${i + 1}`}
                    value={companionNames[i] ?? ''}
                    onChange={e => {
                      const next = [...companionNames];
                      next[i] = e.target.value;
                      setCompanionNames(next);
                    }}
                  />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* 3. Dietary restrictions */}
        <Section title="Restricciones alimentarias" icon={Utensils}>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {DIETARY_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setDietary(opt)}
                className={`text-xs rounded-lg border py-2 px-3 text-left font-medium transition-all
                  ${dietary === opt ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {(dietary !== 'Ninguna') && (
            <div className="pt-1">
              <Label className="text-xs text-slate-500 mb-1 block">Detalle de alergias específicas (opcional)</Label>
              <Textarea
                placeholder="Ej: alergia al maní, intolerancia al gluten severa..."
                value={alergias}
                onChange={e => setAlergias(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </Section>

        {/* 4. DJ Songs */}
        <Section title="Sugerencias para el DJ" icon={Music}>
          <div className="space-y-2 pt-1">
            {songs.map((song, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder={`Canción ${idx + 1} – artista o título`}
                  value={song}
                  onChange={e => handleSongChange(idx, e.target.value)}
                  className="flex-1"
                />
                {songs.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-400 hover:text-red-600" onClick={() => removeSongSlot(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addSongSlot}>
              <Plus className="w-4 h-4" /> Agregar canción
            </Button>
          </div>
        </Section>

        {/* 5. Message to hosts */}
        <Section title="Mensaje para los festejados" icon={Send} defaultOpen>
          <Textarea
            placeholder="Escribí un mensaje especial para los festejados..."
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            rows={3}
            className="pt-1"
          />
        </Section>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base font-bold shadow-lg"
        >
          {isSaving
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Guardando…</>
            : <><Send className="w-5 h-5 mr-2" />{saved ? 'Actualizar confirmación' : 'Confirmar y enviar'}</>}
        </Button>

        {/* ── INFO BLOCKS ──────────────────────────────────────────────── */}

        {/* Table assigned */}
        {invitado.tableNumber && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                {invitado.tableNumber}
              </div>
              <div>
                <p className="text-sm font-bold text-purple-900">Mesa asignada</p>
                {invitado.partySize && invitado.partySize > 1 && (
                  <p className="text-xs text-purple-700">Grupo de {invitado.partySize} personas</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accessibility */}
        {isAccesibilidad && config?.rutaAccesibilidad && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-green-800">
                <Accessibility className="w-4 h-4" />
                Información de Accesibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-green-800 leading-relaxed">{config.rutaAccesibilidad}</p>
              {config.telefonoAsistencia && (
                <p className="text-xs text-green-700 mt-2">📞 Asistencia: {config.telefonoAsistencia}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map */}
        {config?.mapaDelSalonUrl && (
          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-indigo-800">
                <Map className="w-4 h-4" />
                Mapa del Salón
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <a
                href={config.mapaDelSalonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 underline underline-offset-2"
              >
                <Navigation className="w-3.5 h-3.5" />
                Ver mapa del salón
              </a>
            </CardContent>
          </Card>
        )}

        {/* Arrival instructions */}
        {config?.instruccionesLlegada && (
          <Section title="Cómo llegar" icon={Navigation}>
            <p className="text-sm text-slate-600 leading-relaxed">{config.instruccionesLlegada}</p>
            {config.infoEstacionamiento && (
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <ParkingCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{config.infoEstacionamiento}</span>
              </div>
            )}
            {config.googleMapsUrl && (
              <a
                href={config.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 underline underline-offset-2"
              >
                <Navigation className="w-3 h-3" /> Ver en Google Maps
              </a>
            )}
          </Section>
        )}

        {/* Rain protocol */}
        {config?.protocoloLluvia && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-blue-800">
                <CloudRain className="w-4 h-4" />
                Plan de lluvia
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-sm text-blue-700 leading-relaxed">{config.protocoloLluvia}</p>
            </CardContent>
          </Card>
        )}

        {/* Check-in status */}
        {invitado.checkedIn && invitado.checkInTimestamp && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Check-in realizado ✅</p>
              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(invitado.checkInTimestamp).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )}

      </main>

      <footer className="py-8 text-center">
        <div className="max-w-md mx-auto px-4">
          <div
            className="p-6 rounded-2xl border"
            style={{
              background: customBg
                ? `${accentColor}18`
                : 'linear-gradient(135deg, rgba(109,40,217,0.4), rgba(67,56,202,0.4))',
              borderColor: customBg ? `${accentColor}40` : 'rgba(139,92,246,0.2)',
            }}
          >
            <p
              className="text-sm font-black mb-0.5"
              style={{ color: customBg ? accentColor : '#fcd34d' }}
            >
              ✨ AK Producciones Eventos
            </p>
            <p
              className="text-xs mb-3 opacity-70"
              style={{ color: customBg ? accentColor : '#ddd6fe' }}
            >
              Salto, Uruguay · Organizamos momentos únicos
            </p>
            <div className="flex items-center justify-center gap-4 mt-1">
              <a
                href="https://www.instagram.com/akproduccioneseventos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ color: customBg ? accentColor : '#c4b5fd' }}
              >
                <Instagram className="w-3.5 h-3.5" />
                Instagram
              </a>
              <a
                href="https://www.facebook.com/akproduccioneseventos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ color: customBg ? accentColor : '#c4b5fd' }}
              >
                <Facebook className="w-3.5 h-3.5" />
                Facebook
              </a>
              <a
                href="tel:+59899000000"
                className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ color: customBg ? accentColor : '#c4b5fd' }}
              >
                <Phone className="w-3.5 h-3.5" />
                Contacto
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
