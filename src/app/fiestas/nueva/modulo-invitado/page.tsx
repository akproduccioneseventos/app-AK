'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Save, Loader2, Eye,
  Images, Globe, MapPin, Music, Gift, QrCode,
  PartyPopper, Star, Instagram, Heart, Sparkles, Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, GuestPortalSettings } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { updateGuestPortalSettings } from '@/app/actions/fiesta/fiesta.actions';

const DEFAULT_SETTINGS: GuestPortalSettings = {
  showMural: true,
  showFotos: true,
  showInvitacionWeb: true,
  showMesaAsignada: true,
  showItinerario: true,
  showMusica: true,
  showRegalos: false,
  showCheckin: false,
  welcomeMessage: '',
  customBgColor: '#f8f5ff',
  customAccentColor: '#9333ea',
};

const FEATURE_CONFIG = [
  {
    key: 'showMesaAsignada' as const,
    icon: MapPin,
    label: 'Mesa Asignada',
    description: 'El invitado puede ver qué mesa tiene asignada.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    key: 'showInvitacionWeb' as const,
    icon: Globe,
    label: 'Invitación Web',
    description: 'Acceso a la invitación digital del evento.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    key: 'showMural' as const,
    icon: Images,
    label: 'Muro Social & Fotos',
    description: 'Participar en el muro, subir fotos y dedicatorias.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    key: 'showFotos' as const,
    icon: Star,
    label: 'Galería de Fotos',
    description: 'Ver y descargar la galería oficial del evento.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    key: 'showItinerario' as const,
    icon: PartyPopper,
    label: 'Programa del Evento',
    description: 'Ver el cronograma de actividades.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  {
    key: 'showMusica' as const,
    icon: Music,
    label: 'Pedido de Canciones',
    description: 'Sugerir canciones al DJ.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    key: 'showRegalos' as const,
    icon: Gift,
    label: 'Lista de Regalos',
    description: 'Ver y reservar regalos de la lista.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    key: 'showCheckin' as const,
    icon: QrCode,
    label: 'Check-in QR',
    description: 'Mostrar código QR para check-in en el evento.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
];

function GuestModuleContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [settings, setSettings] = useState<GuestPortalSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      toast({ title: 'Error', description: 'No se encontró el ID del evento.', variant: 'destructive' });
      router.replace('/eventos');
      return;
    }
    setIsLoading(true);
    try {
      const data = await getFiestaById(fiestaId);
      if (!data) throw new Error('Evento no encontrado');
      setFiesta(data);
      setSettings({ ...DEFAULT_SETTINGS, ...(data.guestPortalSettings || {}) });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Error al cargar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateGuestPortalSettings(fiestaId, settings);
      if (result.success) {
        toast({ title: '¡Configuración guardada!', description: 'El portal del invitado ha sido actualizado.' });
      } else {
        throw new Error((result as { success: false; error?: string }).error);
      }
    } catch (e: unknown) {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (key: keyof GuestPortalSettings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const enabledCount = FEATURE_CONFIG.filter(f => settings[f.key]).length;

  if (isLoading || !fiesta) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const nombreEvento = fiesta.configuracion.nombreEvento || 'El Evento';
  // Validate hex color to prevent CSS injection
  const accentColor = /^#[0-9A-Fa-f]{3,8}$/.test(settings.customAccentColor || '') 
    ? settings.customAccentColor! 
    : '#9333ea';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-headline text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Módulo del Invitado
              </h1>
              <p className="text-xs text-muted-foreground">{nombreEvento}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {enabledCount}/{FEATURE_CONFIG.length} activos
            </Badge>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Main Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature Toggles */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">¿Qué puede ver el invitado?</h2>
              <p className="text-sm text-muted-foreground">Activa o desactiva las secciones que el invitado verá en su portal.</p>
            </div>
            <div className="space-y-3">
              {FEATURE_CONFIG.map(({ key, icon: Icon, label, description, color, bg }) => (
                <div
                  key={key}
                  className={`rounded-2xl border-2 p-4 flex items-center justify-between transition-all ${settings[key] ? `${bg} border-transparent` : 'bg-white border-slate-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${settings[key] ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                      <Icon className={`w-5 h-5 ${settings[key] ? color : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${settings[key] ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={!!settings[key]}
                    onCheckedChange={() => toggle(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Visual Config & Preview */}
          <div className="space-y-6">
            {/* Customization */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Personalización Visual
                </CardTitle>
                <CardDescription className="text-xs">Ajusta los colores y el mensaje de bienvenida.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Color de Fondo</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.customBgColor || '#f8f5ff'}
                        onChange={e => setSettings(prev => ({ ...prev, customBgColor: e.target.value }))}
                        className="w-10 h-9 rounded cursor-pointer border border-slate-200 p-0.5"
                      />
                      <span className="text-xs text-muted-foreground">{settings.customBgColor || '#f8f5ff'}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Color Acento</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.customAccentColor || '#9333ea'}
                        onChange={e => setSettings(prev => ({ ...prev, customAccentColor: e.target.value }))}
                        className="w-10 h-9 rounded cursor-pointer border border-slate-200 p-0.5"
                      />
                      <span className="text-xs text-muted-foreground">{settings.customAccentColor || '#9333ea'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Mensaje de Bienvenida</Label>
                  <Input
                    value={settings.welcomeMessage || ''}
                    onChange={e => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    placeholder="¡Bienvenido/a! Nos alegra que estés aquí."
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Phone Preview */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" /> Vista Previa del Portal
                </CardTitle>
                <CardDescription className="text-xs">Así verá el invitado su portal personalizado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mx-auto w-[200px] rounded-[24px] border-4 border-slate-700 shadow-xl overflow-hidden" style={{ height: '380px' }}>
                  <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: settings.customBgColor || '#f8f5ff' }}>
                    {/* Mini header */}
                    <div className="px-4 py-3 text-white text-center shrink-0" style={{ backgroundColor: accentColor }}>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Portal del Invitado</p>
                      <p className="text-[11px] font-bold mt-0.5 truncate">{nombreEvento}</p>
                    </div>

                    {/* Welcome */}
                    {settings.welcomeMessage && (
                      <div className="px-3 py-2 text-center shrink-0">
                        <p className="text-[8px] text-slate-600 italic">{settings.welcomeMessage}</p>
                      </div>
                    )}

                    {/* Feature grid */}
                    <div className="flex-1 overflow-y-auto px-3 py-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {FEATURE_CONFIG.filter(f => settings[f.key]).map(({ key, icon: Icon, label, color, bg }) => (
                          <div key={key} className={`rounded-xl p-2 flex flex-col items-center gap-1 ${bg}`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                            <p className="text-[7px] font-bold text-slate-700 text-center leading-tight">{label}</p>
                          </div>
                        ))}
                        {FEATURE_CONFIG.filter(f => settings[f.key]).length === 0 && (
                          <div className="col-span-2 text-center py-4">
                            <p className="text-[8px] text-slate-400">Activa secciones para el invitado</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer with social */}
                    <div className="px-3 py-2 text-center shrink-0 border-t border-white/50" style={{ backgroundColor: `${accentColor}18` }}>
                      <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: accentColor }}>AK Producciones</p>
                      <div className="flex justify-center gap-2">
                        <Instagram className="w-3 h-3" style={{ color: accentColor }} />
                        <Heart className="w-3 h-3" style={{ color: accentColor }} />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  El contacto y redes sociales de la empresa se muestran siempre al pie.
                </p>
              </CardContent>
            </Card>

            <Separator />

            {/* Company info note */}
            <div className="rounded-2xl p-4 text-sm space-y-2" style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30`, border: '2px solid' }}>
              <p className="font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
                El portal siempre muestra tu empresa
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Las redes sociales, datos de contacto y el logo de <strong>AK Producciones</strong> están presentes en todo momento en el portal del invitado, promoviendo constantemente tus servicios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuestModulePage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8 h-screen items-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <GuestModuleContent />
    </Suspense>
  );
}
