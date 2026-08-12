'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, PlusCircle, Trash2, ArrowUp, ArrowDown, Save, Loader2, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getPresentacionLedSettings,
  savePresentacionLedSettings,
  getCatalogoSettings,
  saveCatalogoSettings,
} from '@/app/actions/contenido-publico';
import type { CatalogoSettings, PresentacionLedSettings } from '@/types/contenido-publico';
import { useAutoSave } from '@/hooks/use-auto-save';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';
import { getBlogPosts, saveBlogPost, deleteBlogPost } from '@/app/actions/blog';
import { runMarketingAutomationFromAdmin } from '@/app/actions/marketing-automation';
import { RecontactoAutomaticoCard } from '@/components/marketing/recontacto-automatico-card';
import type { BlogPost, BlogCategory } from '@/types/blog';

const CATALOG_TYPES = ['bodas', 'xv-anos', 'cumpleanos', 'fiestas', 'corporativos', 'aniversarios'];

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(target, 0, item);
  return copy;
}

export default function ContenidoPublicoSettingsPage() {
  const { toast } = useToast();
  const autoMarketingStarted = useRef(false);
  const [loading, setLoading] = useState(true);
  const [tipoCatalogo, setTipoCatalogo] = useState('bodas');
  const [presentacion, setPresentacion] = useState<PresentacionLedSettings | null>(null);
  const [catalogo, setCatalogo] = useState<CatalogoSettings | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [blogActionLoading, setBlogActionLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<{
    success?: boolean;
    skipped?: boolean;
    ranSeo?: boolean;
    ranInstagram?: boolean;
    message?: string;
    error?: string;
    warning?: string;
  } | null>(null);

  const handleRunMarketingAutomation = async (force = true) => {
    setGeneratingAI(true);
    try {
      const result = await runMarketingAutomationFromAdmin({ force });
      setAutomationStatus(result);
      if (result.success) {
        if (result.ranSeo) await loadBlog();
        toast({
          title: result.warning
            ? 'Automatizacion ejecutada con una conexion pendiente'
            : result.skipped
              ? 'Marketing automatico al dia'
              : 'Automatizacion ejecutada',
          description: result.warning || result.message || 'SEO e Instagram revisados correctamente.',
        });
      } else {
        toast({ title: 'Error', description: result.error || 'No se pudo ejecutar la automatizacion.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al conectar con el servicio de IA.', variant: 'destructive' });
    } finally {
      setGeneratingAI(false);
    }
  };

  const loadBlog = useCallback(async () => {
    try {
      const posts = await getBlogPosts();
      setBlogPosts(posts);
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar los artículos del blog.', variant: 'destructive' });
    }
  }, [toast]);

  const handleSavePost = async (post: BlogPost) => {
    setBlogActionLoading(true);
    try {
      const res = await saveBlogPost(post);
      if (res.success) {
        toast({ title: 'Éxito', description: 'Artículo guardado correctamente.' });
        setEditingPost(null);
        await loadBlog();
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo guardar el artículo.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al conectar con el servidor.', variant: 'destructive' });
    } finally {
      setBlogActionLoading(false);
    }
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar este artículo?')) return;
    setBlogActionLoading(true);
    try {
      const res = await deleteBlogPost(slug);
      if (res.success) {
        toast({ title: 'Éxito', description: 'Artículo eliminado correctamente.' });
        if (editingPost?.slug === slug) setEditingPost(null);
        await loadBlog();
      } else {
        toast({ title: 'Error', description: res.error || 'No se pudo eliminar el artículo.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error al conectar con el servidor.', variant: 'destructive' });
    } finally {
      setBlogActionLoading(false);
    }
  };

  const handleNewPost = () => {
    setEditingPost({
      slug: '',
      title: '',
      excerpt: '',
      category: 'Organizacion',
      readTime: '5 min',
      publishedAt: new Date().toISOString().split('T')[0],
      accent: 'from-purple-700 to-slate-950',
      icon: 'BookOpen',
      takeaway: '',
      sections: [{ heading: '', body: [''] }],
      checklist: [''],
    });
  };

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  useEffect(() => {
    if (autoMarketingStarted.current) return;
    autoMarketingStarted.current = true;
    handleRunMarketingAutomation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, c] = await Promise.all([
          getPresentacionLedSettings(),
          getCatalogoSettings(tipoCatalogo),
        ]);
        setPresentacion(p);
        setCatalogo(c);
      } catch {
        console.error('Error loading contenido público settings');
        toast({ title: 'Error', description: 'No se pudo cargar la configuración.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tipoCatalogo, toast]);

  const autoSaveData = useMemo(() => ({ presentacion, catalogo }), [presentacion, catalogo]);

  const { isSaving: saving, lastSaved, saveError, saveNow } = useAutoSave({
    data: autoSaveData,
    onSave: async (d) => {
      if (!d.presentacion || !d.catalogo) return { success: false, error: 'Sin datos' };
      await Promise.all([
        savePresentacionLedSettings(d.presentacion),
        saveCatalogoSettings(tipoCatalogo, d.catalogo),
      ]);
      return { success: true };
    },
    enabled: !loading && !!presentacion && !!catalogo,
  });

  if (loading || !presentacion || !catalogo) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Contenido Público</h1>
          <p className="text-sm text-muted-foreground">Editá textos e imágenes de /presentacion-led y /catalogo/[tipo].</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <AutoSaveIndicator isSaving={saving} lastSaved={lastSaved} saveError={saveError} />
          <Button asChild variant="outline"><Link href="/settings"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Link></Button>
          <Button onClick={() => window.open('/presentacion-led', '_blank')} variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Ver preview LED</Button>
          <Button onClick={() => window.open(`/catalogo/${tipoCatalogo}`, '_blank')} variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Ver preview catálogo</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portal LED</CardTitle>
          <CardDescription>Portada, beneficios, salón y cierre.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Título principal</Label><Input value={presentacion.portada.tituloPrincipal} onChange={(e) => setPresentacion((p) => p ? ({ ...p, portada: { ...p.portada, tituloPrincipal: e.target.value } }) : p)} /></div>
            <div className="space-y-2"><Label>Subtítulo</Label><Input value={presentacion.portada.subtitulo} onChange={(e) => setPresentacion((p) => p ? ({ ...p, portada: { ...p.portada, subtitulo: e.target.value } }) : p)} /></div>
            <div className="space-y-2"><Label>Imagen de fondo URL</Label><Input value={presentacion.portada.imagenFondoUrl} onChange={(e) => setPresentacion((p) => p ? ({ ...p, portada: { ...p.portada, imagenFondoUrl: e.target.value } }) : p)} /></div>
            <div className="space-y-2"><Label>Color de acento</Label><Input value={presentacion.portada.colorAcento} onChange={(e) => setPresentacion((p) => p ? ({ ...p, portada: { ...p.portada, colorAcento: e.target.value } }) : p)} placeholder="from-indigo-500 to-emerald-500" /></div>
          </div>

          <div className="space-y-2">
            <Label>Beneficios (máx. 6)</Label>
            {presentacion.porQueElegirnos.beneficios.map((b, idx) => (
              <div key={idx} className="grid grid-cols-[80px_1fr_auto_auto_auto] gap-2 items-center">
                <Input value={b.emoji} onChange={(e) => setPresentacion((p) => p ? ({ ...p, porQueElegirnos: { ...p.porQueElegirnos, beneficios: p.porQueElegirnos.beneficios.map((x, i) => i === idx ? { ...x, emoji: e.target.value } : x) } }) : p)} placeholder="✨" />
                <Input value={b.texto} onChange={(e) => setPresentacion((p) => p ? ({ ...p, porQueElegirnos: { ...p.porQueElegirnos, beneficios: p.porQueElegirnos.beneficios.map((x, i) => i === idx ? { ...x, texto: e.target.value } : x) } }) : p)} />
                <Button type="button" size="icon" variant="outline" onClick={() => setPresentacion((p) => p ? ({ ...p, porQueElegirnos: { ...p.porQueElegirnos, beneficios: moveItem(p.porQueElegirnos.beneficios, idx, -1) } }) : p)}><ArrowUp className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="outline" onClick={() => setPresentacion((p) => p ? ({ ...p, porQueElegirnos: { ...p.porQueElegirnos, beneficios: moveItem(p.porQueElegirnos.beneficios, idx, 1) } }) : p)}><ArrowDown className="w-4 h-4" /></Button>
                <Button type="button" size="icon" variant="destructive" onClick={() => setPresentacion((p) => p ? ({ ...p, porQueElegirnos: { ...p.porQueElegirnos, beneficios: p.porQueElegirnos.beneficios.filter((_, i) => i !== idx) } }) : p)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setPresentacion((p) => p && p.porQueElegirnos.beneficios.length < 6 ? ({ ...p, porQueElegirnos: { ...p.porQueElegirnos, beneficios: [...p.porQueElegirnos.beneficios, { emoji: '✨', texto: '' }] } }) : p)}><PlusCircle className="w-4 h-4 mr-2" />Agregar beneficio</Button>
          </div>

          <div className="space-y-2">
            <Label>Slide Salón</Label>
            <Input value={presentacion.salon.titulo} onChange={(e) => setPresentacion((p) => p ? ({ ...p, salon: { ...p.salon, titulo: e.target.value } }) : p)} placeholder="Título" />
            <Textarea value={presentacion.salon.descripcion} onChange={(e) => setPresentacion((p) => p ? ({ ...p, salon: { ...p.salon, descripcion: e.target.value } }) : p)} placeholder="Descripción" />
            {presentacion.salon.fotos.map((foto, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={foto} onChange={(e) => setPresentacion((p) => p ? ({ ...p, salon: { ...p.salon, fotos: p.salon.fotos.map((f, i) => i === idx ? e.target.value : f) } }) : p)} />
                <Button type="button" size="icon" variant="destructive" onClick={() => setPresentacion((p) => p ? ({ ...p, salon: { ...p.salon, fotos: p.salon.fotos.filter((_, i) => i !== idx) } }) : p)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setPresentacion((p) => p ? ({ ...p, salon: { ...p.salon, fotos: [...p.salon.fotos, ''] } }) : p)}><PlusCircle className="w-4 h-4 mr-2" />Agregar foto</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Título cierre</Label><Input value={presentacion.cierre.titulo} onChange={(e) => setPresentacion((p) => p ? ({ ...p, cierre: { ...p.cierre, titulo: e.target.value } }) : p)} /></div>
            <div className="space-y-2"><Label>Texto botón CTA</Label><Input value={presentacion.cierre.ctaTexto} onChange={(e) => setPresentacion((p) => p ? ({ ...p, cierre: { ...p.cierre, ctaTexto: e.target.value } }) : p)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Mensaje cierre</Label><Textarea value={presentacion.cierre.mensaje} onChange={(e) => setPresentacion((p) => p ? ({ ...p, cierre: { ...p.cierre, mensaje: e.target.value } }) : p)} /></div>
            <div className="space-y-2"><Label>Acción CTA</Label><Select value={presentacion.cierre.ctaAccion} onValueChange={(value: 'generar-presupuesto' | 'whatsapp' | 'contacto') => setPresentacion((p) => p ? ({ ...p, cierre: { ...p.cierre, ctaAccion: value } }) : p)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="generar-presupuesto">Generar presupuesto</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="contacto">Contacto</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo por tipo</CardTitle>
          <CardDescription>Elegí el tipo de fiesta y editá su contenido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label>Tipo de catálogo</Label>
            <Select value={tipoCatalogo} onValueChange={setTipoCatalogo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATALOG_TYPES.map((tipo) => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}</SelectContent></Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Hero título</Label><Input value={catalogo.hero.titulo} onChange={(e) => setCatalogo((c) => c ? ({ ...c, hero: { ...c.hero, titulo: e.target.value } }) : c)} /></div>
            <div className="space-y-2"><Label>Hero subtítulo</Label><Input value={catalogo.hero.subtitulo} onChange={(e) => setCatalogo((c) => c ? ({ ...c, hero: { ...c.hero, subtitulo: e.target.value } }) : c)} /></div>
            <div className="space-y-2"><Label>Hero imagen de fondo URL</Label><Input value={catalogo.hero.imagenFondoUrl} onChange={(e) => setCatalogo((c) => c ? ({ ...c, hero: { ...c.hero, imagenFondoUrl: e.target.value } }) : c)} /></div>
            <div className="space-y-2"><Label>Color</Label><Input value={catalogo.hero.color} onChange={(e) => setCatalogo((c) => c ? ({ ...c, hero: { ...c.hero, color: e.target.value } }) : c)} /></div>
          </div>

          <div className="space-y-2">
            <Label>Texto presentación</Label>
            <Textarea value={catalogo.textoPresentacion} onChange={(e) => setCatalogo((c) => c ? ({ ...c, textoPresentacion: e.target.value }) : c)} />
          </div>
          <div className="space-y-2">
            <Label>Texto ¿Por qué elegirnos?</Label>
            <Textarea value={catalogo.textoPorQueElegirnos} onChange={(e) => setCatalogo((c) => c ? ({ ...c, textoPorQueElegirnos: e.target.value }) : c)} />
          </div>

          <div className="space-y-2">
            <Label>Testimonios</Label>
            {catalogo.testimonios.map((t, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={t} onChange={(e) => setCatalogo((c) => c ? ({ ...c, testimonios: c.testimonios.map((x, i) => i === idx ? e.target.value : x) }) : c)} />
                <Button type="button" size="icon" variant="destructive" onClick={() => setCatalogo((c) => c ? ({ ...c, testimonios: c.testimonios.filter((_, i) => i !== idx) }) : c)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setCatalogo((c) => c ? ({ ...c, testimonios: [...c.testimonios, ''] }) : c)}><PlusCircle className="w-4 h-4 mr-2" />Agregar testimonio</Button>
          </div>

          <div className="space-y-2">
            <Label>Galería</Label>
            {catalogo.galeria.map((g, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={g.url} onChange={(e) => setCatalogo((c) => c ? ({ ...c, galeria: c.galeria.map((x, i) => i === idx ? { ...x, url: e.target.value } : x) }) : c)} placeholder="URL" />
                <Input value={g.alt} onChange={(e) => setCatalogo((c) => c ? ({ ...c, galeria: c.galeria.map((x, i) => i === idx ? { ...x, alt: e.target.value } : x) }) : c)} placeholder="Alt" />
                <Button type="button" size="icon" variant="destructive" onClick={() => setCatalogo((c) => c ? ({ ...c, galeria: c.galeria.filter((_, i) => i !== idx) }) : c)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setCatalogo((c) => c ? ({ ...c, galeria: [...c.galeria, { url: '', alt: '' }] }) : c)}><PlusCircle className="w-4 h-4 mr-2" />Agregar foto</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Blog Corporativo</CardTitle>
            <CardDescription>SEO automatico: revisa Instagram cada 6 horas y crea articulos de valor semanalmente.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleRunMarketingAutomation(true)}
              disabled={generatingAI}
              variant="outline"
              size="sm"
              className="border-indigo-200 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800"
            >
              {generatingAI ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2 text-indigo-500" />
              )}
              Actualizar ahora
            </Button>
            <Button onClick={handleNewPost} variant="outline" size="sm">
              <PlusCircle className="w-4 h-4 mr-2" />
              Nuevo artículo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-950">
                {generatingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                ) : automationStatus?.success === false || automationStatus?.warning ? (
                  <Clock className="h-4 w-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                {automationStatus?.warning ? 'Marketing activo con una conexion pendiente' : 'Marketing automatico activo'}
              </div>
              <p className="text-xs text-indigo-900/75">
                {automationStatus?.message || 'La app revisa Instagram hasta cada 6 horas y genera contenido SEO semanal cuando corresponde.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider text-indigo-800">
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">Instagram {automationStatus?.ranInstagram ? 'sincronizado' : automationStatus?.warning ? 'pendiente' : 'programado'}</span>
              <span className="rounded-full bg-white px-3 py-1 shadow-sm">SEO {automationStatus?.ranSeo ? 'generado' : 'programado'}</span>
            </div>
          </div>

          <RecontactoAutomaticoCard />

          {/* List of articles */}
          <div className="border rounded-lg divide-y bg-slate-50/50">
            {blogPosts.map((post) => (
              <div key={post.slug} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900">{post.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    URL: /public/blog/{post.slug} | Categoría: <span className="font-semibold">{post.category}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => setEditingPost(post)} variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button onClick={() => handleDeletePost(post.slug)} variant="destructive" size="icon">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {blogPosts.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No hay artículos de blog creados. Hacé clic en "Nuevo artículo" para comenzar.
              </div>
            )}
          </div>

          {/* Post editor form */}
          {editingPost && (
            <div className="border p-6 rounded-2xl bg-white space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">
                {editingPost.slug ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título del Artículo</Label>
                  <Input
                    value={editingPost.title}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    placeholder="Ej: Cómo elegir el menú para tu boda"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug de la URL (único)</Label>
                  <Input
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="ej-como-elegir-el-menu"
                    disabled={!!blogPosts.find(p => p.slug === editingPost.slug) && editingPost.slug !== (blogPosts.find(p => p.slug === editingPost.slug)?.slug || '')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={editingPost.category}
                    onValueChange={(val: BlogCategory) => setEditingPost({ ...editingPost, category: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Organizacion">Organización</SelectItem>
                      <SelectItem value="Presupuesto">Presupuesto</SelectItem>
                      <SelectItem value="Catering">Catering</SelectItem>
                      <SelectItem value="XV anos">XV años</SelectItem>
                      <SelectItem value="Bodas">Bodas</SelectItem>
                      <SelectItem value="Checklists">Checklists</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tiempo de lectura</Label>
                  <Input
                    value={editingPost.readTime}
                    onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                    placeholder="Ej: 5 min"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color de acento (Tailwind Gradient)</Label>
                  <Input
                    value={editingPost.accent}
                    onChange={(e) => setEditingPost({ ...editingPost, accent: e.target.value })}
                    placeholder="from-purple-700 to-slate-950"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icono (Nombre de icono Lucide)</Label>
                  <Input
                    value={editingPost.icon}
                    onChange={(e) => setEditingPost({ ...editingPost, icon: e.target.value })}
                    placeholder="CalendarCheck, Utensils, Heart, BookOpen..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Resumen (Excerpt)</Label>
                  <Textarea
                    value={editingPost.excerpt}
                    onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                    placeholder="Breve introducción del artículo..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Conclusión clave (Takeaway)</Label>
                  <Textarea
                    value={editingPost.takeaway}
                    onChange={(e) => setEditingPost({ ...editingPost, takeaway: e.target.value })}
                    placeholder="Idea central o consejo clave..."
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-slate-800">Secciones de Contenido</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPost({
                      ...editingPost,
                      sections: [...(editingPost.sections || []), { heading: '', body: [''] }]
                    })}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Agregar sección
                  </Button>
                </div>

                {(editingPost.sections || []).map((sec, sIdx) => (
                  <div key={sIdx} className="p-4 border rounded-xl bg-slate-50 space-y-3 relative">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setEditingPost({
                        ...editingPost,
                        sections: editingPost.sections.filter((_, i) => i !== sIdx)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="space-y-2 pr-8">
                      <Label>Subtítulo de la Sección</Label>
                      <Input
                        value={sec.heading}
                        onChange={(e) => setEditingPost({
                          ...editingPost,
                          sections: editingPost.sections.map((s, i) => i === sIdx ? { ...s, heading: e.target.value } : s)
                        })}
                        placeholder="Ej: Empezar con un plan claro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cuerpo de la Sección (Párrafos, uno por línea)</Label>
                      <Textarea
                        value={sec.body.join('\n')}
                        onChange={(e) => setEditingPost({
                          ...editingPost,
                          sections: editingPost.sections.map((s, i) => i === sIdx ? { ...s, body: e.target.value.split('\n').filter(Boolean) } : s)
                        })}
                        rows={4}
                        placeholder="Escribí los párrafos. Cada salto de línea creará un párrafo separado..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Checklist */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-slate-800">Checklist recomendada</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPost({
                      ...editingPost,
                      checklist: [...(editingPost.checklist || []), '']
                    })}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Agregar ítem
                  </Button>
                </div>

                {(editingPost.checklist || []).map((item, cIdx) => (
                  <div key={cIdx} className="flex gap-2 items-center">
                    <Input
                      value={item}
                      onChange={(e) => setEditingPost({
                        ...editingPost,
                        checklist: editingPost.checklist?.map((x, i) => i === cIdx ? e.target.value : x)
                      })}
                      placeholder="Ej: Definir la cantidad de invitados"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => setEditingPost({
                        ...editingPost,
                        checklist: editingPost.checklist?.filter((_, i) => i !== cIdx)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Editor buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setEditingPost(null)}
                  variant="outline"
                  disabled={blogActionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSavePost(editingPost)}
                  disabled={blogActionLoading || !editingPost.title || !editingPost.slug}
                  className="min-w-32"
                >
                  {blogActionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveNow} disabled={saving} className="min-w-44">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar ahora
        </Button>
      </div>
    </div>
  );
}
