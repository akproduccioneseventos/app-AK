'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Save, Plus, Trash2, ExternalLink, Globe, BookOpen, Image as ImageIcon,
  Video, ArrowLeft, Copy, ToggleLeft, ToggleRight, Pencil, X, Check,
  GripVertical, Link as LinkIcon, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  getLandingPageSettings, saveLandingPageSettings,
  getPromoPages, savePromoPage, deletePromoPage,
} from '@/app/actions/landing';
import type { LandingPageSettings, GalleryItem, PromoLandingPage, PromoPackage } from '@/types/landing';
import { defaultLandingPageSettings } from '@/types/landing';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID();
}

// ─── Gallery Item Row ─────────────────────────────────────────────────────────

function GalleryItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: GalleryItem;
  onUpdate: (updated: GalleryItem) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
      <GripVertical className="w-4 h-4 text-slate-300 mt-2 shrink-0" />
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs font-semibold">Tipo</Label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => onUpdate({ ...item, type: 'photo' })}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${item.type === 'photo' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              <ImageIcon className="w-3 h-3" /> Foto
            </button>
            <button
              onClick={() => onUpdate({ ...item, type: 'video' })}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${item.type === 'video' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              <Video className="w-3 h-3" /> Video
            </button>
          </div>
        </div>
        <div className="sm:col-span-1">
          <Label className="text-xs font-semibold">
            {item.type === 'photo' ? 'URL de imagen' : 'URL de YouTube/Vimeo'}
          </Label>
          <Input
            value={item.url}
            onChange={(e) => onUpdate({ ...item, url: e.target.value })}
            placeholder={item.type === 'photo' ? 'https://...' : 'https://youtube.com/watch?v=...'}
            className="mt-1 h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Descripción (opcional)</Label>
          <Input
            value={item.caption || ''}
            onChange={(e) => onUpdate({ ...item, caption: e.target.value })}
            placeholder="XV años de María..."
            className="mt-1 h-9 text-sm"
          />
        </div>
      </div>
      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive shrink-0 mt-1" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Package Editor ───────────────────────────────────────────────────────────

function PackageEditor({
  pkg,
  onUpdate,
  onDelete,
}: {
  pkg: PromoPackage;
  onUpdate: (updated: PromoPackage) => void;
  onDelete: () => void;
}) {
  const [newInclude, setNewInclude] = useState('');

  return (
    <div className={`rounded-2xl border-2 p-5 space-y-4 ${pkg.isHighlighted ? 'border-primary bg-primary/5' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800">{pkg.name || 'Nuevo Paquete'}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate({ ...pkg, isHighlighted: !pkg.isHighlighted })}
            className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${pkg.isHighlighted ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary'}`}
          >
            ⭐ Destacado
          </button>
          <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold">Nombre del paquete</Label>
          <Input value={pkg.name} onChange={(e) => onUpdate({ ...pkg, name: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Paquete Premium" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Precio (opcional)</Label>
          <Input value={pkg.price || ''} onChange={(e) => onUpdate({ ...pkg, price: e.target.value })} className="mt-1 h-9 text-sm" placeholder="$X.XXX" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs font-semibold">Descripción corta (opcional)</Label>
          <Input value={pkg.description || ''} onChange={(e) => onUpdate({ ...pkg, description: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Todo lo que necesitás para tu gran día" />
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold">Incluye</Label>
        <div className="mt-2 space-y-2">
          {pkg.includes.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <Input
                value={item}
                onChange={(e) => {
                  const includes = [...pkg.includes];
                  includes[i] = e.target.value;
                  onUpdate({ ...pkg, includes });
                }}
                className="h-8 text-sm flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-destructive shrink-0"
                onClick={() => onUpdate({ ...pkg, includes: pkg.includes.filter((_, idx) => idx !== i) })}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newInclude}
              onChange={(e) => setNewInclude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newInclude.trim()) {
                  onUpdate({ ...pkg, includes: [...pkg.includes, newInclude.trim()] });
                  setNewInclude('');
                }
              }}
              placeholder="DJ profesional... (Enter para agregar)"
              className="h-8 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 shrink-0"
              disabled={!newInclude.trim()}
              onClick={() => {
                if (newInclude.trim()) {
                  onUpdate({ ...pkg, includes: [...pkg.includes, newInclude.trim()] });
                  setNewInclude('');
                }
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Promo Page Editor ────────────────────────────────────────────────────────

function PromoPageEditor({
  page,
  onSave,
  onCancel,
}: {
  page: Partial<PromoLandingPage>;
  onSave: (p: Partial<PromoLandingPage>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Partial<PromoLandingPage>>(page);

  const updatePackage = (index: number, updated: PromoPackage) => {
    const packages = [...(draft.packages || [])];
    packages[index] = updated;
    setDraft({ ...draft, packages });
  };

  const removePackage = (index: number) => {
    const packages = (draft.packages || []).filter((_, i) => i !== index);
    setDraft({ ...draft, packages });
  };

  const addPackage = () => {
    const newPkg: PromoPackage = {
      id: uid(),
      name: 'Nuevo Paquete',
      includes: [],
    };
    setDraft({ ...draft, packages: [...(draft.packages || []), newPkg] });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold">Título *</Label>
          <Input value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1" placeholder="Paquete Bodas 2026" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Slug (URL) *</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/landing/</span>
            <Input
              value={draft.slug || ''}
              onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="pl-20"
              placeholder="bodas-2026"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Subtítulo</Label>
          <Input value={draft.subtitle || ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className="mt-1" placeholder="Todo lo que necesitás para tu gran día" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Color de acento</Label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={draft.accentColor || '#9333ea'}
              onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            />
            <Input
              value={draft.accentColor || '#9333ea'}
              onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
              className="flex-1"
              placeholder="#9333ea"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs font-semibold">Descripción</Label>
          <Textarea
            value={draft.description || ''}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className="mt-1"
            rows={2}
            placeholder="Descripción de esta promoción..."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">URL imagen de fondo del hero (opcional)</Label>
          <Input value={draft.heroImageUrl || ''} onChange={(e) => setDraft({ ...draft, heroImageUrl: e.target.value })} className="mt-1" placeholder="https://..." />
        </div>
        <div>
          <Label className="text-xs font-semibold">Mensaje personalizado de WhatsApp</Label>
          <Input value={draft.ctaWhatsAppMessage || ''} onChange={(e) => setDraft({ ...draft, ctaWhatsAppMessage: e.target.value })} className="mt-1" placeholder="¡Hola! Me interesa este paquete..." />
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800">Paquetes</h4>
          <Button size="sm" variant="outline" onClick={addPackage} className="rounded-xl">
            <Plus className="w-3.5 h-3.5 mr-1" /> Agregar paquete
          </Button>
        </div>
        <div className="space-y-4">
          {(draft.packages || []).map((pkg, i) => (
            <PackageEditor
              key={pkg.id}
              pkg={pkg}
              onUpdate={(updated) => updatePackage(i, updated)}
              onDelete={() => removePackage(i)}
            />
          ))}
          {(draft.packages || []).length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No hay paquetes. Agregá uno para mostrar opciones a tus clientes.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          onClick={() => onSave(draft)}
          disabled={!draft.title?.trim() || !draft.slug?.trim()}
          className="rounded-xl"
        >
          <Save className="w-4 h-4 mr-2" /> Guardar página
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-xl">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Main Editor Page ─────────────────────────────────────────────────────────

export default function LandingEditorPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<LandingPageSettings>(defaultLandingPageSettings);
  const [promoPages, setPromoPages] = useState<PromoLandingPage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPromo, setEditingPromo] = useState<Partial<PromoLandingPage> | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [s, pages] = await Promise.all([getLandingPageSettings(), getPromoPages()]);
    setSettings(s);
    setPromoPages(pages);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const result = await saveLandingPageSettings(settings);
    setIsSaving(false);
    if (result.success) {
      toast({ title: '¡Guardado!', description: 'La configuración de la landing page se guardó correctamente.' });
    } else {
      toast({ title: 'Error', description: result.error || 'No se pudo guardar.', variant: 'destructive' });
    }
  };

  const handleSavePromo = async (draft: Partial<PromoLandingPage>) => {
    if (!draft.title?.trim() || !draft.slug?.trim()) {
      toast({ title: 'Error', description: 'El título y el slug son obligatorios.', variant: 'destructive' });
      return;
    }
    const result = await savePromoPage({
      isActive: draft.isActive ?? true,
      packages: draft.packages ?? [],
      title: draft.title,
      slug: draft.slug,
      subtitle: draft.subtitle,
      description: draft.description,
      heroImageUrl: draft.heroImageUrl,
      accentColor: draft.accentColor,
      ctaWhatsAppMessage: draft.ctaWhatsAppMessage,
      id: draft.id,
      createdAt: draft.createdAt,
    });
    if (result.success) {
      toast({ title: '¡Guardado!', description: 'La página promocional se guardó correctamente.' });
      setEditingPromo(null);
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeletePromo = async (id: string) => {
    const result = await deletePromoPage(id);
    if (result.success) {
      toast({ title: 'Eliminado', description: 'La página promocional fue eliminada.' });
      loadData();
    }
  };

  const handleTogglePromo = async (page: PromoLandingPage) => {
    await savePromoPage({ ...page, isActive: !page.isActive });
    loadData();
  };

  const addGalleryItem = () => {
    const newItem: GalleryItem = { id: uid(), type: 'photo', url: '' };
    setSettings({ ...settings, galleryItems: [...settings.galleryItems, newItem] });
  };

  const updateGalleryItem = (index: number, updated: GalleryItem) => {
    const items = [...settings.galleryItems];
    items[index] = updated;
    setSettings({ ...settings, galleryItems: items });
  };

  const removeGalleryItem = (index: number) => {
    setSettings({ ...settings, galleryItems: settings.galleryItems.filter((_, i) => i !== index) });
  };

  const getLandingUrl = () => {
    if (typeof window === 'undefined') return '/empresa/landing';
    return `${window.location.origin}/empresa/landing`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Globe className="w-8 h-8 text-primary" />
            Editor de Landing Page
          </h1>
          <p className="text-muted-foreground mt-1">
            Configurá tu página pública y las páginas de promociones.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href="/empresa/landing" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="rounded-xl gap-2">
              <ExternalLink className="w-4 h-4" />
              Ver página
            </Button>
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(getLandingUrl()); toast({ title: '¡Copiado!', description: 'Link de la landing page copiado.' }); }}
            className="flex items-center gap-2 h-9 rounded-xl px-3 border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copiar link
          </button>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="rounded-2xl bg-slate-100">
          <TabsTrigger value="general" className="rounded-xl">General</TabsTrigger>
          <TabsTrigger value="galeria" className="rounded-xl">Galería</TabsTrigger>
          <TabsTrigger value="catalogo" className="rounded-xl">Catálogo</TabsTrigger>
          <TabsTrigger value="promos" className="rounded-xl">Promociones</TabsTrigger>
        </TabsList>

        {/* ── General Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Sección Hero</CardTitle>
              <CardDescription>El encabezado principal de tu landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título principal</Label>
                <Input
                  value={settings.heroTitle}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="mt-1"
                  placeholder="AK Producciones Eventos"
                />
              </div>
              <div>
                <Label>Subtítulo (frase)</Label>
                <Input
                  value={settings.heroSubtitle}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  className="mt-1"
                  placeholder="Hacemos tus sueños realidad"
                />
              </div>
              <div>
                <Label>Descripción del hero</Label>
                <Textarea
                  value={settings.heroDescription}
                  onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>Sobre nosotros</CardTitle>
              <CardDescription>Texto de la sección &quot;Quiénes somos&quot;.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.aboutText}
                onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
                rows={4}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle>WhatsApp de contacto</CardTitle>
              <CardDescription>Número que se usará en los botones de contacto (solo dígitos, con código de país).</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value.replace(/\D/g, '') })}
                placeholder="59899123456"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="rounded-2xl px-8">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar cambios
            </Button>
          </div>
        </TabsContent>

        {/* ── Gallery Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="galeria" className="mt-6 space-y-6">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Galería de fotos y videos</CardTitle>
                  <CardDescription>
                    Agregá fotos de eventos (URLs directas de imagen) o links de YouTube/Vimeo.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={addGalleryItem} className="rounded-xl shrink-0">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {settings.galleryItems.length === 0 && (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No hay ítems en la galería.</p>
                  <p className="text-slate-300 text-xs mt-1">Hacé clic en &quot;Agregar&quot; para empezar.</p>
                </div>
              )}
              {settings.galleryItems.map((item, i) => (
                <GalleryItemRow
                  key={item.id}
                  item={item}
                  onUpdate={(updated) => updateGalleryItem(i, updated)}
                  onDelete={() => removeGalleryItem(i)}
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="rounded-2xl px-8">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar galería
            </Button>
          </div>
        </TabsContent>

        {/* ── Catalog Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="catalogo" className="mt-6 space-y-6">
          <Card className="rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Visor de Catálogo
              </CardTitle>
              <CardDescription>
                Pegá la URL de tu catálogo. Podés usar Canva, Google Drive, un PDF, o cualquier URL que soporte iframe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-700 space-y-1">
                <p className="font-bold">¿Cómo obtener el link de Canva?</p>
                <p>1. Abrí tu diseño en Canva → Compartir → Embed (Incrustar)</p>
                <p>2. Copiá la URL que aparece en el código del iframe (empieza con <code className="bg-blue-100 px-1 rounded">https://www.canva.com/design/</code>)</p>
                <p>3. Pegala aquí abajo.</p>
              </div>
              <div>
                <Label>URL del catálogo</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={settings.catalogUrl || ''}
                      onChange={(e) => setSettings({ ...settings, catalogUrl: e.target.value })}
                      className="pl-9"
                      placeholder="https://www.canva.com/design/.../view?embed"
                    />
                  </div>
                  {settings.catalogUrl && (
                    <a href={settings.catalogUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              {settings.catalogUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video">
                  <iframe
                    src={settings.catalogUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title="Vista previa del catálogo"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="rounded-2xl px-8">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar catálogo
            </Button>
          </div>
        </TabsContent>

        {/* ── Promos Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="promos" className="mt-6 space-y-6">
          {editingPromo ? (
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-primary" />
                  {editingPromo.id ? 'Editar página promocional' : 'Nueva página promocional'}
                </CardTitle>
                <CardDescription>
                  Cada página tiene su propio link: <code>/landing/[slug]</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PromoPageEditor
                  page={editingPromo}
                  onSave={handleSavePromo}
                  onCancel={() => setEditingPromo(null)}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Páginas Promocionales</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Creá landing pages para eventos específicos o promociones.
                  </p>
                </div>
                <Button
                  onClick={() => setEditingPromo({ isActive: true, packages: [] })}
                  className="rounded-2xl gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nueva promoción
                </Button>
              </div>

              {promoPages.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No tenés páginas promocionales aún.</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Creá una para &quot;Paquete Bodas 2026&quot;, &quot;Descuento XV Años&quot;, etc.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {promoPages.map((page) => {
                    const promoUrl = typeof window !== 'undefined' ? `${window.location.origin}/landing/${page.slug}` : `/landing/${page.slug}`;
                    return (
                      <Card key={page.id} className="rounded-2xl shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-800 truncate">{page.title}</h4>
                              <Badge variant={page.isActive ? 'default' : 'secondary'} className="rounded-lg text-xs shrink-0">
                                {page.isActive ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">/landing/{page.slug}</p>
                            {page.packages && page.packages.length > 0 && (
                              <p className="text-xs text-slate-500 mt-1">{page.packages.length} paquete(s)</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => { navigator.clipboard.writeText(promoUrl); toast({ title: '¡Copiado!' }); }}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
                              title="Copiar link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a href={`/landing/${page.slug}`} target="_blank" rel="noopener noreferrer">
                              <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors" title="Ver página">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </a>
                            <button
                              onClick={() => handleTogglePromo(page)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
                              title={page.isActive ? 'Desactivar' : 'Activar'}
                            >
                              {page.isActive ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingPromo(page)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePromo(page.id)}
                              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-destructive hover:border-destructive transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
