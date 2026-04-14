'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Save, Loader2, Eye, Globe, Palette, Layout, Type, BarChart3, Phone, Plus, Trash2, ExternalLink, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLandingSettings, saveLandingSettings } from '@/app/actions/landing-editor';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import type { LandingSettings, LandingStatItem, LandingFaqItem } from '@/types/landing-editor';
import { defaultLandingSettings } from '@/types/landing-editor';

/**
 * Sanitizes a URL to ensure it uses only http(s) protocol.
 * Returns null if the URL is unsafe (e.g., javascript:).
 */
function sanitizeImageUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Extract a hex color from a CSS color value (hex or rgba).
 * Falls back to provided defaultHex if extraction fails.
 */
function extractHexColor(value: string, defaultHex: string): string {
  if (!value) return defaultHex;
  // Handle hex directly
  if (/^#[0-9a-f]{3,6}$/i.test(value.trim())) return value.trim();
  // Try to extract from rgba(r,g,b,...) by converting to hex
  const rgbaMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return defaultHex;
}

export default function LandingEditorPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LandingSettings>(defaultLandingSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLandingSettings();
      setSettings(data);
      if (data.updatedAt) setLastSaved(new Date(data.updatedAt).toLocaleString('es-UY'));
    } catch {
      toast({ title: 'Error', description: 'No se pudo cargar la configuración.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveLandingSettings(settings);
      if (result.success) {
        toast({ title: '✅ Guardado', description: 'La landing page se actualizó correctamente.' });
        setLastSaved(new Date().toLocaleString('es-UY'));
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHeroImage(true);
    try {
      const result = await uploadPublicPageAsset('landing-editor', file);
      if (!result.success || !result.url) throw new Error(result.error || 'Error al subir');
      updateHero('backgroundImageUrl', result.url);
      toast({ title: '✅ Imagen subida', description: 'La imagen de fondo fue cargada correctamente.' });
    } catch (err: any) {
      toast({ title: 'Error al subir imagen', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingHeroImage(false);
      e.target.value = '';
    }
  };

  const handleUploadOgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingOgImage(true);
    try {
      const result = await uploadPublicPageAsset('landing-editor', file);
      if (!result.success || !result.url) throw new Error(result.error || 'Error al subir');
      updateSeo('ogImageUrl', result.url);
      toast({ title: '✅ Imagen subida', description: 'La imagen OG fue cargada correctamente.' });
    } catch (err: any) {
      toast({ title: 'Error al subir imagen', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingOgImage(false);
      e.target.value = '';
    }
  };

  const updateHero = (field: keyof LandingSettings['hero'], value: string) => {
    setSettings(s => ({ ...s, hero: { ...s.hero, [field]: value } }));
  };

  const updateCta = (field: keyof LandingSettings['cta'], value: string) => {
    setSettings(s => ({ ...s, cta: { ...s.cta, [field]: value } }));
  };

  const updateColors = (field: keyof LandingSettings['colors'], value: string) => {
    setSettings(s => ({ ...s, colors: { ...s.colors, [field]: value } }));
  };

  const updateSeo = (field: keyof LandingSettings['seo'], value: string) => {
    setSettings(s => ({ ...s, seo: { ...s.seo, [field]: value } }));
  };

  const updateStat = (index: number, field: keyof LandingStatItem, value: string) => {
    setSettings(s => ({
      ...s,
      stats: s.stats.map((stat, i) => i === index ? { ...stat, [field]: value } : stat),
    }));
  };

  const addStat = () => {
    setSettings(s => ({
      ...s,
      stats: [...s.stats, { value: '0', label: 'Nuevo stat', icon: '⭐' }],
    }));
  };

  const removeStat = (index: number) => {
    setSettings(s => ({ ...s, stats: s.stats.filter((_, i) => i !== index) }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white shrink-0">
            <Layout className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black tracking-tight font-headline uppercase">
              Editor de Landing Page
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
              Editá textos, colores y datos de tu página pública
              {lastSaved && <span className="ml-2 text-emerald-500">· Guardado: {lastSaved}</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/landing" target="_blank" className="flex-1 md:flex-none">
            <Button variant="outline" className="rounded-xl w-full md:w-auto">
              <Eye className="w-4 h-4 mr-2" />
              Ver Landing
              <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
            </Button>
          </Link>
          <Link href="/empresa" className="flex-1 md:flex-none">
            <Button variant="outline" className="rounded-xl w-full md:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl flex-1 md:flex-none">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </header>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-slate-100 p-1 rounded-2xl h-auto border border-slate-200">
          <TabsTrigger value="hero" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 flex items-center gap-1">
            <Type className="w-3 h-3" /> Hero
          </TabsTrigger>
          <TabsTrigger value="stats" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Estadísticas
          </TabsTrigger>
          <TabsTrigger value="cta" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 flex items-center gap-1">
            <Phone className="w-3 h-3" /> CTA
          </TabsTrigger>
          <TabsTrigger value="colors" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 flex items-center gap-1">
            <Palette className="w-3 h-3" /> Colores
          </TabsTrigger>
          <TabsTrigger value="seo" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 flex items-center gap-1">
            <Globe className="w-3 h-3" /> SEO
          </TabsTrigger>
          <TabsTrigger value="faq" className="rounded-xl font-bold uppercase text-[10px] tracking-widest py-3 flex items-center gap-1">
            ❓ FAQ
          </TabsTrigger>
        </TabsList>

        {/* ── HERO ── */}
        <TabsContent value="hero" className="space-y-6 pt-4 animate-in fade-in duration-500">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" /> Sección Principal (Hero)
              </CardTitle>
              <CardDescription>El primer bloque que ven los visitantes de tu página.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de WhatsApp Global</Label>
                  <Input
                    value={settings.whatsappNumber}
                    onChange={e => setSettings(s => ({ ...s, whatsappNumber: e.target.value }))}
                    placeholder="59898355530"
                    className="rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground">Se usa en todos los botones de WhatsApp de la página.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto del Badge</Label>
                  <Input
                    value={settings.hero.badgeText}
                    onChange={e => updateHero('badgeText', e.target.value)}
                    placeholder="Producción Integral de Eventos"
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título Principal (Headline)</Label>
                <Textarea
                  value={settings.hero.headline}
                  onChange={e => updateHero('headline', e.target.value)}
                  placeholder="Hacemos Realidad&#10;tu Celebración"
                  rows={3}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Usá saltos de línea (\n) para separar líneas. La segunda línea se resalta automáticamente.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo (Subheadline)</Label>
                <Textarea
                  value={settings.hero.subheadline}
                  onChange={e => updateHero('subheadline', e.target.value)}
                  rows={3}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagen de Fondo (URL o subir archivo)</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.hero.backgroundImageUrl}
                    onChange={e => updateHero('backgroundImageUrl', e.target.value)}
                    placeholder="https://..."
                    className="rounded-xl"
                  />
                  <label htmlFor="hero-image-upload" className="shrink-0">
                    <Button asChild variant="outline" className="rounded-xl" disabled={isUploadingHeroImage}>
                      <span>
                        {isUploadingHeroImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </span>
                    </Button>
                    <input id="hero-image-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadHeroImage} disabled={isUploadingHeroImage} />
                  </label>
                </div>
                {settings.hero.backgroundImageUrl && sanitizeImageUrl(settings.hero.backgroundImageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sanitizeImageUrl(settings.hero.backgroundImageUrl)!}
                    alt="Vista previa del fondo"
                    className="mt-2 rounded-xl w-full h-40 object-cover border border-slate-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto del Botón CTA</Label>
                  <Input
                    value={settings.hero.ctaLabel}
                    onChange={e => updateHero('ctaLabel', e.target.value)}
                    placeholder="Cotizá tu evento ahora"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL del Botón CTA</Label>
                  <Input
                    value={settings.hero.ctaUrl}
                    onChange={e => updateHero('ctaUrl', e.target.value)}
                    placeholder="/simulador-de-presupuesto"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── STATS ── */}
        <TabsContent value="stats" className="space-y-6 pt-4 animate-in fade-in duration-500">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Estadísticas / Logros
                  </CardTitle>
                  <CardDescription>Los números que aparecen en la sección de estadísticas.</CardDescription>
                </div>
                <Button onClick={addStat} size="sm" className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" /> Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {settings.stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-3 gap-3 flex-grow">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Icono (emoji)</Label>
                      <Input
                        value={stat.icon}
                        onChange={e => updateStat(index, 'icon', e.target.value)}
                        placeholder="🎉"
                        className="rounded-xl text-center text-2xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Valor</Label>
                      <Input
                        value={stat.value}
                        onChange={e => updateStat(index, 'value', e.target.value)}
                        placeholder="+500"
                        className="rounded-xl font-black"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Etiqueta</Label>
                      <Input
                        value={stat.label}
                        onChange={e => updateStat(index, 'label', e.target.value)}
                        placeholder="Eventos Realizados"
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStat(index)}
                    className="text-rose-400 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {settings.stats.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay estadísticas. Hacé clic en "Agregar" para añadir una.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CTA ── */}
        <TabsContent value="cta" className="space-y-6 pt-4 animate-in fade-in duration-500">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" /> Sección de Llamada a la Acción (CTA)
              </CardTitle>
              <CardDescription>El bloque final que invita al visitante a contactarte.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título Principal</Label>
                <Input
                  value={settings.cta.headline}
                  onChange={e => updateCta('headline', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo</Label>
                <Textarea
                  value={settings.cta.subheadline}
                  onChange={e => updateCta('subheadline', e.target.value)}
                  rows={2}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto del Botón</Label>
                  <Input
                    value={settings.cta.ctaLabel}
                    onChange={e => updateCta('ctaLabel', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número WhatsApp</Label>
                  <Input
                    value={settings.cta.whatsappNumber}
                    onChange={e => updateCta('whatsappNumber', e.target.value)}
                    placeholder="59898355530"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COLORS ── */}
        <TabsContent value="colors" className="space-y-6 pt-4 animate-in fade-in duration-500">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" /> Colores
              </CardTitle>
              <CardDescription>Personalizá la paleta de colores de tu landing page.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Color preview */}
              <div
                className="w-full h-28 rounded-2xl border border-slate-200 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${settings.colors.overlayFrom}, ${settings.colors.overlayTo})`,
                }}
              >
                <div className="h-full flex items-center justify-center text-white font-black text-lg uppercase tracking-widest">
                  Vista previa del overlay del Hero
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overlay — Color Inicio</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={extractHexColor(settings.colors.overlayFrom, '#58007f')}
                      onChange={e => updateColors('overlayFrom', e.target.value + 'cc')}
                      className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={settings.colors.overlayFrom}
                      onChange={e => updateColors('overlayFrom', e.target.value)}
                      placeholder="rgba(88,28,135,0.8)"
                      className="rounded-xl flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overlay — Color Fin</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={extractHexColor(settings.colors.overlayTo, '#7e007e')}
                      onChange={e => updateColors('overlayTo', e.target.value + '99')}
                      className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={settings.colors.overlayTo}
                      onChange={e => updateColors('overlayTo', e.target.value)}
                      placeholder="rgba(112,26,117,0.6)"
                      className="rounded-xl flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color de Acento</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.colors.accentColor}
                      onChange={e => updateColors('accentColor', e.target.value)}
                      className="h-10 w-16 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <Input
                      value={settings.colors.accentColor}
                      onChange={e => updateColors('accentColor', e.target.value)}
                      placeholder="#a855f7"
                      className="rounded-xl flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SEO ── */}
        <TabsContent value="seo" className="space-y-6 pt-4 animate-in fade-in duration-500">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" /> SEO &amp; Redes Sociales
              </CardTitle>
              <CardDescription>Configurá el título y descripción que aparecen en Google y al compartir el link.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título de la Página (Title Tag)</Label>
                <Input
                  value={settings.seo.title}
                  onChange={e => updateSeo('title', e.target.value)}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Máx. 60 caracteres recomendado. Actual: {settings.seo.title.length}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción Meta</Label>
                <Textarea
                  value={settings.seo.description}
                  onChange={e => updateSeo('description', e.target.value)}
                  rows={3}
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">Máx. 160 caracteres recomendado. Actual: {settings.seo.description.length}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagen OG (para redes sociales — URL o subir archivo)</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.seo.ogImageUrl}
                    onChange={e => updateSeo('ogImageUrl', e.target.value)}
                    placeholder="https://..."
                    className="rounded-xl"
                  />
                  <label htmlFor="og-image-upload" className="shrink-0">
                    <Button asChild variant="outline" className="rounded-xl" disabled={isUploadingOgImage}>
                      <span>
                        {isUploadingOgImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      </span>
                    </Button>
                    <input id="og-image-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadOgImage} disabled={isUploadingOgImage} />
                  </label>
                </div>
                {settings.seo.ogImageUrl && sanitizeImageUrl(settings.seo.ogImageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sanitizeImageUrl(settings.seo.ogImageUrl)!}
                    alt="Vista previa OG"
                    className="mt-2 rounded-xl w-full h-40 object-cover border border-slate-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
              {/* OG Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Preview en Google/Redes:</p>
                <p className="text-base font-bold text-blue-700 leading-tight">{settings.seo.title || '(sin título)'}</p>
                <p className="text-xs text-green-700">akproducciones.uy/landing</p>
                <p className="text-sm text-slate-600 leading-relaxed">{settings.seo.description || '(sin descripción)'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── FAQ ── */}
        <TabsContent value="faq" className="space-y-6 pt-4 animate-in fade-in duration-500">
          <Card className="shadow-xl border-none rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                ❓ Preguntas Frecuentes (FAQ)
              </CardTitle>
              <CardDescription>Editá las preguntas y respuestas que aparecen en la sección FAQ de tu página web.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {(settings.faqs || []).map((faq, index) => (
                <div key={faq.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pregunta {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setSettings(s => ({ ...s, faqs: (s.faqs || []).filter(f => f.id !== faq.id) }))}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pregunta</Label>
                    <Input
                      value={faq.question}
                      onChange={e => setSettings(s => ({ ...s, faqs: (s.faqs || []).map(f => f.id === faq.id ? { ...f, question: e.target.value } : f) }))}
                      className="rounded-xl"
                      placeholder="¿Cuánto cuesta...?"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Respuesta</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={e => setSettings(s => ({ ...s, faqs: (s.faqs || []).map(f => f.id === faq.id ? { ...f, answer: e.target.value } : f) }))}
                      rows={3}
                      className="rounded-xl"
                      placeholder="La respuesta..."
                    />
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl border-dashed"
                onClick={() => {
                  const newFaq: LandingFaqItem = { id: `faq_${Date.now()}`, question: '', answer: '' };
                  setSettings(s => ({ ...s, faqs: [...(s.faqs || []), newFaq] }));
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Agregar pregunta
              </Button>

              {(!settings.faqs || settings.faqs.length === 0) && (
                <p className="text-center text-slate-400 text-xs py-4">No hay preguntas. Agregá la primera.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between gap-4 z-50 shadow-xl print:hidden">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
          {lastSaved ? `Último guardado: ${lastSaved}` : 'Cambios sin guardar'}
        </div>
        <div className="flex gap-2 ml-auto">
          <Link href="/landing" target="_blank">
            <Button variant="outline" size="sm" className="rounded-xl">
              <Eye className="w-4 h-4 mr-2" />
              Ver Landing
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={isSaving} className="rounded-xl">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
