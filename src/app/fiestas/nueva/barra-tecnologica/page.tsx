'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, ExternalLink, Loader2, Martini, Monitor, Save, Share2, Smartphone, Sparkles, Tv, Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BarDrinkOrderStatus, BarTechnologyDashboard, BarTechnologySettings } from '@/types/barra-tecnologica';
import {
  getBarraTecnologicaDashboard,
  saveBarraTecnologicaSettings,
} from '@/app/actions/fiesta/barra-tecnologica.actions';

const STATUS_LABELS: Record<BarDrinkOrderStatus, string> = {
  nuevo: 'Nuevos',
  preparando: 'Preparando',
  listo: 'Listos',
  entregado: 'Entregados',
  cancelado: 'Cancelados',
};

function BarraTecnologicaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fiestaId = searchParams.get('fiestaId');
  const { toast } = useToast();

  const [dashboard, setDashboard] = useState<BarTechnologyDashboard | null>(null);
  const [settings, setSettings] = useState<BarTechnologySettings | null>(null);
  const [origin, setOrigin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!fiestaId) {
      router.replace('/eventos');
      return;
    }
    setIsLoading(true);
    const result = await getBarraTecnologicaDashboard(fiestaId);
    if (result.success && result.data) {
      setDashboard(result.data);
      setSettings(result.data.settings);
    } else {
      toast({ title: 'No se pudo cargar', description: result.error, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [fiestaId, router, toast]);

  useEffect(() => {
    setOrigin(window.location.origin);
    loadData();
  }, [loadData]);

  const urls = useMemo(() => {
    if (!fiestaId || !origin) return { guest: '', barman: '', muro: '' };
    return {
      guest: `${origin}/evento/barra/${fiestaId}`,
      barman: `${origin}/evento/barra/${fiestaId}/barman`,
      muro: `${origin}/evento/muro-en-vivo/${fiestaId}`,
    };
  }, [fiestaId, origin]);

  const statusCounts = useMemo(() => {
    const base: Record<BarDrinkOrderStatus, number> = { nuevo: 0, preparando: 0, listo: 0, entregado: 0, cancelado: 0 };
    for (const order of dashboard?.orders || []) base[order.status] += 1;
    return base;
  }, [dashboard]);

  const updateSetting = <K extends keyof BarTechnologySettings>(key: K, value: BarTechnologySettings[K]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };

  const saveSettings = async () => {
    if (!fiestaId || !settings) return;
    setIsSaving(true);
    const result = await saveBarraTecnologicaSettings(fiestaId, settings);
    if (result.success && result.data) {
      setSettings(result.data);
      toast({ title: 'Barra guardada', description: 'La experiencia tactil quedo actualizada.' });
      await loadData();
    } else {
      toast({ title: 'No se pudo guardar', description: result.error, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    toast({ title: 'Link copiado' });
  };

  if (isLoading || !dashboard || !settings) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <main className="space-y-6 pb-16">
      <header className="overflow-hidden rounded-[2rem] border bg-white shadow-xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-white shadow-xl">
              <Martini className="h-8 w-8" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-primary/70">Zona tecnologica de barra</p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Barra tactil + fotos sociales</h1>
              <p className="mt-2 max-w-3xl text-base font-semibold text-slate-500">
                Invitados piden tragos en una pantalla, el barman los recibe en otra y la gente puede sacarse fotos tipo espejo magico para subirlas al muro social.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}><Button variant="outline" className="rounded-2xl"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
                <Button className="rounded-2xl font-black" onClick={saveSettings} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar configuracion
                </Button>
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Estado en vivo</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(Object.keys(statusCounts) as BarDrinkOrderStatus[]).map((status) => (
                <div key={status} className="rounded-2xl bg-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">{STATUS_LABELS[status]}</p>
                  <p className="text-2xl font-black text-slate-950">{statusCounts[status]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <Card className="rounded-[2rem] shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Personalizacion de experiencia</CardTitle>
              <CardDescription>Esto es lo que ve el invitado en la pantalla tactil de la barra.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Titulo</Label>
                <Input value={settings.title} onChange={(event) => updateSetting('title', event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Subtitulo</Label>
                <Textarea value={settings.subtitle} onChange={(event) => updateSetting('subtitle', event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Mensaje guia del invitado</Label>
                <Textarea value={settings.guestPrompt} onChange={(event) => updateSetting('guestPrompt', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hashtag</Label>
                <Input value={settings.hashtag} onChange={(event) => updateSetting('hashtag', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Instagram / red principal</Label>
                <Input value={settings.instagramHandle} onChange={(event) => updateSetting('instagramHandle', event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Texto de marca en fotos</Label>
                <Input value={settings.brandText} onChange={(event) => updateSetting('brandText', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Color de acento</Label>
                <Input type="color" value={settings.accentColor} onChange={(event) => updateSetting('accentColor', event.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Titulo pantalla barman</Label>
                <Input value={settings.barmanTitle} onChange={(event) => updateSetting('barmanTitle', event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] shadow-lg">
            <CardHeader>
              <CardTitle>Controles</CardTitle>
              <CardDescription>Activan o pausan partes de la experiencia durante la fiesta.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <ToggleRow label="Barra tactil activa" checked={settings.enabled} onCheckedChange={(value) => updateSetting('enabled', value)} />
              <ToggleRow label="Pedir nombre al invitado" checked={settings.requireGuestName} onCheckedChange={(value) => updateSetting('requireGuestName', value)} />
              <ToggleRow label="Fotos tipo espejo magico" checked={settings.allowPhotoCapture} onCheckedChange={(value) => updateSetting('allowPhotoCapture', value)} />
              <ToggleRow label="Publicar fotos al muro" checked={settings.autoPublishPhotos} onCheckedChange={(value) => updateSetting('autoPublishPhotos', value)} />
              <ToggleRow label="Mostrar ingredientes" checked={settings.showIngredients} onCheckedChange={(value) => updateSetting('showIngredients', value)} />
              <ToggleRow label="Mostrar sin alcohol" checked={settings.showAlcoholFreeTag} onCheckedChange={(value) => updateSetting('showAlcoholFreeTag', value)} />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] shadow-lg">
            <CardHeader>
              <CardTitle>Tragos sincronizados</CardTitle>
              <CardDescription>Se toman de la carta de tragos del evento y del modulo maestro de tragos.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {dashboard.drinks.slice(0, 12).map((drink) => (
                <div key={drink.id} className="rounded-2xl border bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Wine className="h-4 w-4 text-primary" />
                    <p className="font-black text-slate-900">{drink.nombre}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{drink.ingredientes?.join(' · ') || 'Sin ingredientes cargados'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <QrCard title="Pantalla tactil invitados" icon={Smartphone} url={urls.guest} onCopy={copyLink} />
          <QrCard title="Pantalla barman" icon={Monitor} url={urls.barman} onCopy={copyLink} />
          <QrCard title="Muro social pantalla grande" icon={Tv} url={urls.muro} onCopy={copyLink} />
        </aside>
      </section>
    </main>
  );
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
      <p className="font-bold text-slate-700">{label}</p>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function QrCard({ title, icon: Icon, url, onCopy }: { title: string; icon: ElementType; url: string; onCopy: (url: string) => void }) {
  return (
    <Card className="rounded-[2rem] shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {title}</CardTitle>
        <CardDescription>Se puede abrir en otra pantalla o escanear desde un celular.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center rounded-3xl bg-white p-4 shadow-inner">
          {url ? <QRCodeSVG value={url} size={180} includeMargin /> : <Loader2 className="h-10 w-10 animate-spin" />}
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-500 break-all">{url}</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => onCopy(url)}><Share2 className="mr-2 h-4 w-4" /> Copiar</Button>
          <a href={url} target="_blank" rel="noreferrer">
            <Button className="w-full rounded-2xl"><ExternalLink className="mr-2 h-4 w-4" /> Abrir</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BarraTecnologicaPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <BarraTecnologicaContent />
    </Suspense>
  );
}
