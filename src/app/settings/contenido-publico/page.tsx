'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, PlusCircle, Trash2, ArrowUp, ArrowDown, Save, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipoCatalogo, setTipoCatalogo] = useState('bodas');
  const [presentacion, setPresentacion] = useState<PresentacionLedSettings | null>(null);
  const [catalogo, setCatalogo] = useState<CatalogoSettings | null>(null);

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

  const handleSave = async () => {
    if (!presentacion || !catalogo) return;
    setSaving(true);
    try {
      await Promise.all([
        savePresentacionLedSettings(presentacion),
        saveCatalogoSettings(tipoCatalogo, catalogo),
      ]);
      toast({ title: 'Guardado', description: 'Los cambios se guardaron correctamente.' });
    } catch {
      console.error('Error saving contenido público settings');
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !presentacion || !catalogo) {
    return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Contenido Público</h1>
          <p className="text-sm text-muted-foreground">Editá textos e imágenes de /presentacion-led y /catalogo/[tipo].</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
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

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-44">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
