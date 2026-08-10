'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  Flame,
  Gamepad2,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Monitor,
  QrCode,
  Save,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Wand2,
  Wine,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyStateModulo } from '@/components/ui/empty-state-modulo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  buildZonaDigitalPublicUrl,
  buildZonaDigitalScore,
  withZonaDigitalDefaults,
} from '@/lib/zona-digital-adolescentes';
import {
  getFiestaById,
  updateZonaDigitalSettingsFiestaActual,
} from '@/app/actions/fiesta-actual';
import type {
  FiestaEnPlanificacion,
  ZonaDigitalAdolescentesSettings,
  ZonaDigitalChallenge,
  ZonaDigitalFeatureToggle,
  ZonaDigitalGame,
  ZonaDigitalSocialNetwork,
} from '@/types/fiesta';

const featureIcons: Record<string, React.ElementType> = {
  muro_social: ImageIcon,
  retos: Trophy,
  juegos: Gamepad2,
  fotocabina: Camera,
  plataforma360: Sparkles,
  bogue: Wand2,
  espejo_magico: Monitor,
  barra: Wine,
  totems: Smartphone,
  audioritmico: Flame,
  ranking: BarChart3,
  recap: Heart,
};

const backgroundLabels: Record<ZonaDigitalAdolescentesSettings['backgroundStyle'], string> = {
  neon_clean: 'Neon limpio',
  glass_party: 'Glass party',
  white_premium: 'Blanco premium',
  club_mode: 'Club mode',
};

function boolCount(items: Array<{ enabled: boolean }>) {
  return items.filter(item => item.enabled).length;
}

function ZonaDigitalPageContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [settings, setSettings] = useState<ZonaDigitalAdolescentesSettings>(withZonaDigitalDefaults());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!fiestaId) return;
      setIsLoading(true);
      const current = await getFiestaById(fiestaId);
      setFiesta(current);
      setSettings(withZonaDigitalDefaults(current?.zonaDigitalAdolescentes));
      setIsLoading(false);
    }
    load();
  }, [fiestaId]);

  const publicUrl = fiestaId ? buildZonaDigitalPublicUrl(fiestaId) : '';
  const fullPublicUrl = typeof window !== 'undefined' && publicUrl ? `${window.location.origin}${publicUrl}` : publicUrl;
  const report = useMemo(() => {
    if (!fiesta) {
      return buildZonaDigitalScore({
        id: 'preview',
        configuracion: { nombreEvento: 'Preview', tipoCelebracion: 'XV', horaInicio: '', horaFin: '', nombreLugar: '', invitadosEstimados: 0, presupuestoEstimado: 0, notesAdicionales: '' },
        personalAsignado: [],
        zonaDigitalAdolescentes: settings,
      });
    }
    return buildZonaDigitalScore({ ...fiesta, zonaDigitalAdolescentes: settings });
  }, [fiesta, settings]);

  const updateSettings = (patch: Partial<ZonaDigitalAdolescentesSettings>) => {
    setSettings(prev => withZonaDigitalDefaults({ ...prev, ...patch }));
  };

  const updateFeature = (id: string, patch: Partial<ZonaDigitalFeatureToggle>) => {
    updateSettings({
      features: settings.features.map(item => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const updateChallenge = (id: string, patch: Partial<ZonaDigitalChallenge>) => {
    updateSettings({
      challenges: settings.challenges.map(item => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const updateGame = (id: string, patch: Partial<ZonaDigitalGame>) => {
    updateSettings({
      games: settings.games.map(item => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const updateSocialNetwork = (id: string, patch: Partial<ZonaDigitalSocialNetwork>) => {
    updateSettings({
      socialNetworks: settings.socialNetworks.map(item => item.id === id ? { ...item, ...patch } : item),
    });
  };

  const handleSave = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    const result = await updateZonaDigitalSettingsFiestaActual(fiestaId, {
      ...settings,
      qrUrl: publicUrl,
    });
    setIsSaving(false);
    if (!result.success) {
      toast({ title: 'No se pudo guardar', description: result.error, variant: 'destructive' });
      return;
    }
    setSettings(withZonaDigitalDefaults(result.settings));
    toast({ title: 'Zona Digital AK guardada', description: 'Los adolescentes veran solo lo que este activo.' });
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-red-600" /></div>;
  }

  if (!fiestaId || !fiesta) {
    return (
      <div className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="text-2xl font-black">No encontre la fiesta</h1>
        <Button asChild className="mt-4"><Link href="/eventos">Volver a eventos</Link></Button>
      </div>
    );
  }

  if (fiesta.modulosContratados && !fiesta.modulosContratados.zonaDigital) {
    return (
      <EmptyStateModulo
        titulo="Zona Digital AK"
        descripcion="El módulo de Zona Digital no está contratado para este evento. Habilitalo desde la configuración o tienda."
        fiestaId={fiestaId}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 -ml-3">
              <Button asChild variant="ghost">
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="hidden sm:flex bg-white hover:bg-slate-50 text-slate-700">
                <Link href={publicUrl} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2 text-red-500" />
                  Previsualizar
                </Link>
              </Button>
            </div>
            <Badge className="mb-3 border-red-200 bg-red-50 text-red-700">Experiencia adolescente</Badge>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
              Zona Digital AK
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-600 sm:text-lg">
              Centro para activar retos, juegos, fotos, 360, barra, totems, emojis, redes y pantalla. Si algo no esta contratado, se apaga y no aparece al invitado.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <p className="text-xs font-black uppercase text-slate-400">Listo</p>
                <p className="text-3xl font-black">{report.score}%</p>
                <Progress value={report.score} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <p className="text-xs font-black uppercase text-slate-400">Activos</p>
                <p className="text-3xl font-black">{report.visibleFeatures.length}</p>
                <p className="text-xs text-slate-500">experiencias visibles</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <p className="text-xs font-black uppercase text-slate-400">Juegos</p>
                <p className="text-3xl font-black">{boolCount(settings.games)}</p>
                <p className="text-xs text-slate-500">dinamicas prendidas</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-none shadow-xl">
            <CardHeader className="bg-slate-950 text-white">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Sparkles className="h-6 w-6 text-red-400" />
                Control maestro
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-base font-black">Zona activa</Label>
                    <p className="text-sm text-slate-500">Prende o apaga toda la experiencia adolescente.</p>
                  </div>
                  <Switch checked={settings.enabled} onCheckedChange={checked => updateSettings({ enabled: checked })} />
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-base font-black">Moderacion</Label>
                    <p className="text-sm text-slate-500">Revisar antes de salir en pantalla.</p>
                  </div>
                  <Switch checked={settings.moderationRequired} onCheckedChange={checked => updateSettings({ moderationRequired: checked })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Titulo publico</Label>
                <Input value={settings.title} onChange={event => updateSettings({ title: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hashtag</Label>
                <Input value={settings.hashtag} onChange={event => updateSettings({ hashtag: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Mensaje para adolescentes</Label>
                <Textarea value={settings.subtitle} onChange={event => updateSettings({ subtitle: event.target.value })} className="min-h-24" />
              </div>
              <div className="space-y-2">
                <Label>Color principal</Label>
                <Input type="color" value={settings.primaryColor} onChange={event => updateSettings({ primaryColor: event.target.value })} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Color de energia</Label>
                <Input type="color" value={settings.accentColor} onChange={event => updateSettings({ accentColor: event.target.value })} className="h-11" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Estilo visual</Label>
                <div className="grid gap-2 sm:grid-cols-4">
                  {Object.entries(backgroundLabels).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      variant={settings.backgroundStyle === value ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => updateSettings({ backgroundStyle: value as ZonaDigitalAdolescentesSettings['backgroundStyle'] })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-red-600" />
                QR de acceso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center">
                <QRCodeSVG value={fullPublicUrl || publicUrl} size={180} includeMargin />
                <p className="mt-3 text-sm font-bold text-slate-700">Los adolescentes escanean y entran a la zona.</p>
                <p className="mt-1 break-all text-xs text-slate-500">{fullPublicUrl}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['Ranking', settings.showLeaderboard, 'showLeaderboard'],
                  ['Puntos', settings.showPoints, 'showPoints'],
                  ['Barra emojis', settings.showEmojiBar, 'showEmojiBar'],
                  ['Pedir follow', settings.showSocialFollowGate, 'showSocialFollowGate'],
                  ['Dedicatorias', settings.allowDedications, 'allowDedications'],
                  ['Votos musica', settings.allowSongVotes, 'allowSongVotes'],
                ].map(([label, checked, key]) => (
                  <div key={String(key)} className="flex items-center justify-between rounded-2xl border bg-white p-3">
                    <Label className="font-bold">{label}</Label>
                    <Switch checked={Boolean(checked)} onCheckedChange={value => updateSettings({ [key as string]: value } as Partial<ZonaDigitalAdolescentesSettings>)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="experiencias" className="space-y-4">
          <TabsList className="grid h-auto grid-cols-2 gap-2 bg-white p-2 shadow-sm sm:grid-cols-5">
            <TabsTrigger value="experiencias">Experiencias</TabsTrigger>
            <TabsTrigger value="retos">Retos</TabsTrigger>
            <TabsTrigger value="juegos">Juegos</TabsTrigger>
            <TabsTrigger value="redes">Redes</TabsTrigger>
            <TabsTrigger value="seguridad">Reglas</TabsTrigger>
          </TabsList>

          <TabsContent value="experiencias" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settings.features.map(item => {
              const Icon = featureIcons[item.id] ?? Sparkles;
              return (
                <Card key={item.id} className={cn('border-none shadow-lg transition', item.enabled ? 'bg-white' : 'bg-slate-50 opacity-70')}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-black">{item.label}</h3>
                          <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <Switch checked={item.enabled} onCheckedChange={checked => updateFeature(item.id, { enabled: checked })} />
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                      <span className="text-sm font-bold">Visible para invitados</span>
                      <Switch checked={item.visibleForGuests} onCheckedChange={checked => updateFeature(item.id, { visibleForGuests: checked })} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.requiresHardware && <Badge variant="outline">requiere equipo</Badge>}
                      {item.linkedModuleId && <Badge variant="outline">sincroniza {item.linkedModuleId}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="retos" className="grid gap-4 md:grid-cols-2">
            {settings.challenges.map(item => (
              <Card key={item.id} className="border-none shadow-lg">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <div className="text-4xl">{item.emoji}</div>
                  <div>
                    <Input value={item.title} onChange={event => updateChallenge(item.id, { title: event.target.value })} className="font-black" />
                    <Textarea value={item.description} onChange={event => updateChallenge(item.id, { description: event.target.value })} className="mt-2 min-h-20" />
                    <div className="mt-2 flex items-center gap-2">
                      <Label className="text-xs">Puntos</Label>
                      <Input type="number" value={item.points} onChange={event => updateChallenge(item.id, { points: Number(event.target.value) || 0 })} className="h-9 w-24" />
                      <Badge variant={item.featured ? 'default' : 'outline'}>destacado</Badge>
                    </div>
                  </div>
                  <Switch checked={item.enabled} onCheckedChange={checked => updateChallenge(item.id, { enabled: checked })} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="juegos" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {settings.games.map(item => (
              <Card key={item.id} className="border-none shadow-lg">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-4xl">{item.emoji}</div>
                      <h3 className="mt-2 font-black">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.prompt}</p>
                    </div>
                    <Switch checked={item.enabled} onCheckedChange={checked => updateGame(item.id, { enabled: checked })} />
                  </div>
                  <Input value={item.title} onChange={event => updateGame(item.id, { title: event.target.value })} />
                  <Textarea value={item.prompt} onChange={event => updateGame(item.id, { prompt: event.target.value })} className="min-h-20" />
                  <div className="grid grid-cols-2 gap-2">
                    {(['mobile', 'pantalla', 'ambos'] as const).map(mode => (
                      <Button key={mode} type="button" variant={item.screenMode === mode ? 'default' : 'outline'} onClick={() => updateGame(item.id, { screenMode: mode })}>
                        {mode}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="redes" className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
            <div className="grid gap-4">
              {settings.socialNetworks.map(network => (
                <Card key={network.id} className="border-none shadow-lg">
                  <CardContent className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                    <div>
                      <Label>{network.label}</Label>
                      <Input value={network.handle} onChange={event => updateSocialNetwork(network.id, { handle: event.target.value })} />
                    </div>
                    <div>
                      <Label>Link</Label>
                      <Input value={network.url} onChange={event => updateSocialNetwork(network.id, { url: event.target.value })} />
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center">
                        <Label className="text-xs">Activo</Label>
                        <Switch checked={network.enabled} onCheckedChange={checked => updateSocialNetwork(network.id, { enabled: checked })} />
                      </div>
                      <div className="text-center">
                        <Label className="text-xs">Antes de descargar</Label>
                        <Switch checked={!!network.requireBeforeDownload} onCheckedChange={checked => updateSocialNetwork(network.id, { requireBeforeDownload: checked })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-none bg-slate-950 text-white shadow-xl">
              <CardContent className="space-y-4 p-6">
                <Share2 className="h-8 w-8 text-red-400" />
                <h3 className="text-2xl font-black">Redes mas fuertes</h3>
                <p className="text-sm text-white/70">
                  La descarga puede mostrar primero las redes de AK, el hashtag, el marco del evento y el QR. Esto no bloquea tecnicamente una red externa, pero si guia al invitado como paso natural.
                </p>
                <div className="flex flex-wrap gap-2">
                  {settings.emojiReactions.map(reaction => (
                    <button
                      key={reaction.emoji}
                      type="button"
                      onClick={() => updateSettings({ emojiReactions: settings.emojiReactions.map(item => item.emoji === reaction.emoji ? { ...item, enabled: !item.enabled } : item) })}
                      className={cn('rounded-full border px-4 py-2 text-xl transition', reaction.enabled ? 'border-white bg-white text-slate-950' : 'border-white/20 text-white/40')}
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad" className="grid gap-4 lg:grid-cols-2">
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-red-600" /> Reglas visibles</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={settings.safetyRules.join('\n')}
                  onChange={event => updateSettings({ safetyRules: event.target.value.split('\n').map(line => line.trim()).filter(Boolean) })}
                  className="min-h-56"
                />
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle>Sincronizaciones</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ['Muro social', settings.syncWithMuroSocial, 'syncWithMuroSocial'],
                  ['Totems', settings.syncWithTotems, 'syncWithTotems'],
                  ['Barra tecnologica', settings.syncWithBarra, 'syncWithBarra'],
                  ['Entretenimiento', settings.syncWithEntretenimiento, 'syncWithEntretenimiento'],
                  ['Rotar en pantallas', settings.autoRotateOnScreens, 'autoRotateOnScreens'],
                  ['Recap final', settings.recapEnabled, 'recapEnabled'],
                ].map(([label, checked, key]) => (
                  <div key={String(key)} className="flex items-center justify-between rounded-2xl border bg-white p-4">
                    <Label className="font-bold">{label}</Label>
                    <Switch checked={Boolean(checked)} onCheckedChange={value => updateSettings({ [key as string]: value } as Partial<ZonaDigitalAdolescentesSettings>)} />
                  </div>
                ))}
                {!!report.missing.length && (
                  <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-black">Para llegar al 100%:</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {report.missing.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-4 z-20 flex justify-center">
          <div className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-full border bg-white/90 p-2 shadow-2xl backdrop-blur">
            <div className="hidden items-center gap-2 pl-4 text-sm font-bold text-slate-600 sm:flex">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {settings.enabled ? 'Zona activa' : 'Zona apagada'} | {boolCount(settings.challenges)} retos | {boolCount(settings.games)} juegos
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href={publicUrl} target="_blank"><Smartphone className="mr-2 h-4 w-4" /> Ver invitado</Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="rounded-full bg-red-600 px-6 hover:bg-red-700">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ZonaDigitalPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-red-600" /></div>}>
      <ZonaDigitalPageContent />
    </Suspense>
  );
}
