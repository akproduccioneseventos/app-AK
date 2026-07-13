'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ExternalLink, Loader2, MonitorPlay, Plus, QrCode, Save, Sparkles, Trash2, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateSocialGallerySettingsFiestaActual } from '@/app/actions/fiesta-actual';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import type { FiestaEnPlanificacion, SocialGallerySettings, TotemScreenSettings } from '@/types/fiesta';

const DEFAULT_ACCENT = '#dc2626';

function makeTotemDefaults(fiesta: FiestaEnPlanificacion, origin = ''): TotemScreenSettings[] {
  const eventName = fiesta.configuracion?.nombreEvento || 'Fiesta AK';
  const socialUrl = origin ? `${origin}/evento/social/${fiesta.id}` : `/evento/social/${fiesta.id}`;
  return [
    {
      id: 'entrada-vip',
      enabled: true,
      title: 'Bienvenidos',
      subtitle: 'Escaneá el QR y compartí tus fotos en la pantalla.',
      honoreeName: eventName,
      backgroundMode: 'aurora',
      layout: 'portrait',
      accentColor: DEFAULT_ACCENT,
      qrUrl: socialUrl,
      qrLabel: 'Subí tu foto al muro',
      showQr: true,
      showLatestPhotos: true,
      syncedWithSocialWall: true,
      audioReactive: false,
    },
    {
      id: 'pista-baile',
      enabled: true,
      title: 'Modo pista',
      subtitle: 'Luces, fotos y movimiento sincronizados con la fiesta.',
      honoreeName: eventName,
      backgroundMode: 'spotlights',
      layout: 'landscape',
      accentColor: '#06b6d4',
      qrUrl: socialUrl,
      qrLabel: 'Participá en vivo',
      showQr: true,
      showLatestPhotos: true,
      syncedWithSocialWall: true,
      audioReactive: true,
    },
    {
      id: 'social-snap',
      enabled: true,
      title: 'Fotos de la noche',
      subtitle: 'Tu foto puede aparecer en las pantallas AK.',
      honoreeName: eventName,
      backgroundMode: 'social-rain',
      layout: 'portrait',
      accentColor: '#a855f7',
      qrUrl: socialUrl,
      qrLabel: 'Escaneá y compartí',
      showQr: true,
      showLatestPhotos: true,
      syncedWithSocialWall: true,
      audioReactive: false,
    },
  ];
}

function normalizeTotems(fiesta: FiestaEnPlanificacion | null, origin = '') {
  if (!fiesta) return [];
  const existing = fiesta.socialGallerySettings?.totemScreens;
  if (existing?.length) return existing;
  return makeTotemDefaults(fiesta, origin);
}

function PantallasTotemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [totems, setTotems] = useState<TotemScreenSettings[]>([]);
  const [origin, setOrigin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTotemId, setUploadingTotemId] = useState<string | null>(null);

  const handleUploadPhotos = async (totemId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !fiestaId) return;

    setUploadingTotemId(totemId);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', fiestaId);

        const res = await uploadPublicPageAsset(formData);
        if (res.success && res.url) {
          uploadedUrls.push(res.url);
        } else {
          toast({
            title: `Error al subir ${file.name}`,
            description: res.error || 'Ocurrió un problema',
            variant: 'destructive',
          });
        }
      }

      if (uploadedUrls.length > 0) {
        const currentTotem = totems.find((t) => t.id === totemId);
        const existingUrls = currentTotem?.heroPhotoUrl
          ? currentTotem.heroPhotoUrl.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean)
          : [];
        const newUrls = [...existingUrls, ...uploadedUrls].join('\n');
        updateTotem(totemId, { heroPhotoUrl: newUrls });
        toast({
          title: 'Fotos subidas',
          description: `${uploadedUrls.length} foto(s) se agregaron con éxito.`,
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error de carga',
        description: err.message || 'No se pudieron subir las imágenes.',
        variant: 'destructive',
      });
    } finally {
      setUploadingTotemId(null);
      // Reset input value
      event.target.value = '';
    }
  };

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      router.replace('/eventos');
      return;
    }
    setIsLoading(true);
    const data = await getFiestaById(fiestaId);
    if (!data) {
      toast({ title: 'Fiesta no encontrada', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    setOrigin(currentOrigin);
    setFiesta(data);
    setTotems(normalizeTotems(data, currentOrigin));
    setIsLoading(false);
  }, [fiestaId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const socialUrl = useMemo(() => {
    if (!fiestaId || !origin) return '';
    return `${origin}/evento/social/${fiestaId}`;
  }, [fiestaId, origin]);

  const updateTotem = (id: string, patch: Partial<TotemScreenSettings>) => {
    setTotems((current) => current.map((totem) => (
      totem.id === id ? { ...totem, ...patch, updatedAt: new Date().toISOString() } : totem
    )));
  };

  const addTotem = () => {
    if (!fiesta) return;
    const id = `totem_${Date.now()}`;
    setTotems((current) => [
      ...current,
      {
        id,
        enabled: true,
        title: 'Nuevo tótem AK',
        subtitle: 'Personalizá esta pantalla para una zona de la fiesta.',
        honoreeName: fiesta.configuracion?.nombreEvento || 'Fiesta AK',
        backgroundMode: 'particles',
        layout: 'portrait',
        accentColor: DEFAULT_ACCENT,
        qrUrl: socialUrl,
        qrLabel: 'Escaneá y participá',
        showQr: true,
        showLatestPhotos: true,
        syncedWithSocialWall: true,
        audioReactive: false,
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const removeTotem = (id: string) => {
    setTotems((current) => current.filter((totem) => totem.id !== id));
  };

  const saveTotems = async () => {
    if (!fiestaId || !fiesta) return;
    setIsSaving(true);
    const settings: SocialGallerySettings = {
      enabled: true,
      allowLikes: true,
      allowComments: true,
      uploadsActive: true,
      ...(fiesta.socialGallerySettings || {}),
      totemScreens: totems,
    };
    const result = await updateSocialGallerySettingsFiestaActual(fiestaId, settings);
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Pantallas guardadas', description: 'Los tótems se actualizan en las pantallas públicas.' });
      await loadData();
    } else {
      toast({ title: 'No se pudo guardar', description: result.error, variant: 'destructive' });
    }
  };

  if (isLoading || !fiesta) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <main className="space-y-6 pb-16">
      <header className="overflow-hidden rounded-[2rem] border bg-white shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-white shadow-xl">
              <Tv className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary/70">Zona tecnológica visual</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Pantallas Tótem</h1>
              <p className="mt-2 max-w-3xl text-base font-semibold text-slate-500">
                Creá pantallas verticales u horizontales con nombre, foto, logo, fondos en movimiento, QR y fotos sincronizadas del muro social.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" className="rounded-2xl"><Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link></Button>
                <Button onClick={saveTotems} disabled={isSaving} className="rounded-2xl font-black">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar pantallas
                </Button>
                <Button type="button" variant="outline" onClick={addTotem} className="rounded-2xl font-bold"><Plus className="mr-2 h-4 w-4" /> Agregar tótem</Button>
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">QR principal</p>
            <div className="mt-3 flex justify-center rounded-3xl bg-white p-4">
              <QRCodeSVG value={socialUrl || 'https://akproducciones.uy'} size={150} includeMargin />
            </div>
            <p className="mt-3 break-all text-xs font-semibold text-slate-500">{socialUrl}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-5">
        {totems.map((totem) => {
          const totemUrl = origin && fiestaId ? `${origin}/evento/totem/${fiestaId}/${totem.id}` : '';
          return (
            <Card key={totem.id} className="overflow-hidden rounded-[2rem] shadow-lg">
              <CardHeader className="border-b bg-slate-50/70">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <MonitorPlay className="h-5 w-5 text-primary" />
                      {totem.title}
                      <Badge variant={totem.enabled ? 'default' : 'outline'}>{totem.enabled ? 'Activo' : 'Pausado'}</Badge>
                    </CardTitle>
                    <CardDescription>{totemUrl}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={totemUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="rounded-2xl"><ExternalLink className="mr-2 h-4 w-4" /> Abrir</Button>
                    </a>
                    <Button type="button" variant="ghost" className="rounded-2xl text-destructive hover:text-destructive" onClick={() => removeTotem(totem.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Quitar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 xl:grid-cols-[1fr_280px]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input value={totem.title} onChange={(event) => updateTotem(totem.id, { title: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre / logo textual</Label>
                    <Input value={totem.honoreeName || ''} onChange={(event) => updateTotem(totem.id, { honoreeName: event.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Texto secundario</Label>
                    <Textarea value={totem.subtitle || ''} onChange={(event) => updateTotem(totem.id, { subtitle: event.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Fotos del Tótem (URLs o carga directa)</Label>
                    <Textarea
                      value={totem.heroPhotoUrl || ''}
                      onChange={(event) => updateTotem(totem.id, { heroPhotoUrl: event.target.value })}
                      placeholder="Escribí una URL por línea o cargá fotos directamente."
                      rows={3}
                      className="rounded-2xl"
                    />
                    <div className="flex flex-col gap-2 mt-1">
                      <div>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleUploadPhotos(totem.id, e)}
                          disabled={uploadingTotemId === totem.id}
                          className="hidden"
                          id={`upload-totem-photos-${totem.id}`}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => document.getElementById(`upload-totem-photos-${totem.id}`)?.click()}
                          disabled={uploadingTotemId === totem.id}
                          className="rounded-2xl w-full text-xs font-bold"
                        >
                          {uploadingTotemId === totem.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo imágenes...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" /> Subir fotos de la Quinceañera / Evento
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {totem.heroPhotoUrl && (
                        <div className="flex flex-wrap gap-2 p-3 rounded-2xl border bg-slate-50 mt-1 max-h-40 overflow-y-auto">
                          {totem.heroPhotoUrl.split(/[\n,]+/).map((url) => url.trim()).filter(Boolean).map((url, i) => (
                            <div key={i} className="relative w-12 h-16 rounded-xl overflow-hidden group border border-slate-200 shadow-sm bg-white shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element -- Admin previews may use arbitrary external or data URLs. */}
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const urls = (totem.heroPhotoUrl || '').split(/[\n,]+/).map((u) => u.trim()).filter(Boolean);
                                  urls.splice(i, 1);
                                  updateTotem(totem.id, { heroPhotoUrl: urls.join('\n') });
                                }}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input value={totem.logoUrl || ''} onChange={(event) => updateTotem(totem.id, { logoUrl: event.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Fondo imagen/video URL</Label>
                    <Input value={totem.backgroundMediaUrl || ''} onChange={(event) => updateTotem(totem.id, { backgroundMediaUrl: event.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>QR URL</Label>
                    <Input value={totem.qrUrl || ''} onChange={(event) => updateTotem(totem.id, { qrUrl: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Texto QR</Label>
                    <Input value={totem.qrLabel || ''} onChange={(event) => updateTotem(totem.id, { qrLabel: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Color acento</Label>
                    <Input type="color" value={totem.accentColor} onChange={(event) => updateTotem(totem.id, { accentColor: event.target.value })} className="h-12" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:col-span-2">
                    <SelectLike label="Formato" value={totem.layout} options={['portrait', 'landscape', 'square']} onChange={(value) => updateTotem(totem.id, { layout: value as TotemScreenSettings['layout'] })} />
                    <SelectLike label="Fondo movible" value={totem.backgroundMode} options={['aurora', 'spotlights', 'particles', 'photo-float', 'social-rain']} onChange={(value) => updateTotem(totem.id, { backgroundMode: value as TotemScreenSettings['backgroundMode'] })} />
                  </div>
                </div>
                <aside className="space-y-3">
                  <ToggleRow label="Tótem activo" checked={totem.enabled} onCheckedChange={(value) => updateTotem(totem.id, { enabled: value })} />
                  <ToggleRow label="Mostrar QR" checked={totem.showQr} onCheckedChange={(value) => updateTotem(totem.id, { showQr: value })} />
                  <ToggleRow label="Fotos del muro" checked={totem.showLatestPhotos} onCheckedChange={(value) => updateTotem(totem.id, { showLatestPhotos: value })} />
                  <ToggleRow label="Sincronizado" checked={totem.syncedWithSocialWall} onCheckedChange={(value) => updateTotem(totem.id, { syncedWithSocialWall: value })} />
                  <ToggleRow label="Modo baile" checked={totem.audioReactive} onCheckedChange={(value) => updateTotem(totem.id, { audioReactive: value })} />
                  <div className="rounded-3xl border bg-white p-4 text-center">
                    <QRCodeSVG value={totemUrl || socialUrl || 'https://akproducciones.uy'} size={150} includeMargin />
                    <p className="mt-2 text-xs font-bold text-slate-500"><QrCode className="mr-1 inline h-3 w-3" /> QR de este tótem</p>
                  </div>
                </aside>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-slate-50 p-3">
      <p className="text-sm font-bold text-slate-700">{label}</p>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function SelectLike({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select className="h-11 w-full rounded-md border bg-white px-3 text-sm font-semibold" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default function PantallasTotemPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <PantallasTotemContent />
    </Suspense>
  );
}
