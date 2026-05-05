'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, PlayCircle, Save, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { Salon, SalonExperiencia3D } from '@/types/salon';
import { getSalonById, saveSalonExperiencia3D } from '@/app/actions/salones';

function isSafeUrl(value?: string) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function SalonExperienciaPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [form, setForm] = useState<SalonExperiencia3D>({ videoUrl: '', recorridoUrl: '', modelo3dUrl: '', notas: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const data = await getSalonById(params.id);
      if (!mounted) return;
      setSalon(data);
      setForm({
        videoUrl: data?.experiencia3D?.videoUrl || '',
        recorridoUrl: data?.experiencia3D?.recorridoUrl || '',
        modelo3dUrl: data?.experiencia3D?.modelo3dUrl || '',
        notas: data?.experiencia3D?.notas || '',
      });
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await saveSalonExperiencia3D(params.id, form);
      if (!result.success) throw new Error(result.error || 'No se pudo guardar.');
      setSalon(result.salon || salon);
      toast({ title: 'Experiencia guardada', description: 'Se actualizó la experiencia visual del salón.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const previewUrl = form.recorridoUrl || form.videoUrl || form.modelo3dUrl;

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!salon) {
    return (
      <div className="space-y-4">
        <Link href="/empresa/salones"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Button></Link>
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No encontré el salón.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-3 bg-red-600 text-white">Experiencia visual</Badge>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">{salon.nombre}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Acá cargás algo simple: video, link de recorrido o modelo futuro. No tenés que medir todo el salón. Esto es para mostrarlo mejor y dejar preparada la experiencia visual.
          </p>
        </div>
        <Link href="/empresa/salones"><Button variant="outline" className="rounded-2xl font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> Salones</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-3xl border-red-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-red-600" /> Cargar experiencia</CardTitle>
            <CardDescription>Podés pegar links de Drive, YouTube, Matterport, Polycam, KIRI, Luma o cualquier recorrido web.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video simple del salón</Label>
              <Input id="videoUrl" value={form.videoUrl || ''} onChange={(e) => setForm(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Ideal para un video caminando por el salón.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recorridoUrl">Link de recorrido 3D / 360</Label>
              <Input id="recorridoUrl" value={form.recorridoUrl || ''} onChange={(e) => setForm(prev => ({ ...prev, recorridoUrl: e.target.value }))} placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Sirve para Matterport, Polycam, KIRI, Luma o un visor externo.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo3dUrl">Modelo 3D futuro</Label>
              <Input id="modelo3dUrl" value={form.modelo3dUrl || ''} onChange={(e) => setForm(prev => ({ ...prev, modelo3dUrl: e.target.value }))} placeholder="https://... archivo GLB / GLTF" />
              <p className="text-xs text-muted-foreground">No es obligatorio. Queda preparado para más adelante.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas internas</Label>
              <Textarea id="notas" value={form.notas || ''} onChange={(e) => setForm(prev => ({ ...prev, notas: e.target.value }))} rows={4} placeholder="Ej: video tomado desde entrada principal, recorrido pendiente de actualizar..." />
            </div>
            <Button onClick={handleSave} disabled={saving} className="rounded-2xl bg-red-600 font-bold hover:bg-red-700">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar experiencia
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-red-100 bg-slate-950 text-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlayCircle className="h-5 w-5 text-red-300" /> Vista rápida</CardTitle>
            <CardDescription className="text-slate-300">Lo que se muestre acá también puede aparecer en la página pública de Club Uruguay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewUrl && isSafeUrl(previewUrl) ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-slate-200">
                  Hay una experiencia visual cargada. Abrila para revisar que el link funcione.
                </div>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-2xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/20"><ExternalLink className="mr-2 h-4 w-4" /> Abrir link</Button>
                </a>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 p-6 text-sm leading-6 text-slate-300">
                Todavía no hay link cargado. Empezá con un video simple del salón; después, si aparece un recorrido 3D, lo pegás acá.
              </div>
            )}
            <div className="rounded-2xl bg-white/5 p-4 text-sm leading-6 text-slate-300">
              <p className="mb-2 font-black text-white">Importante</p>
              <p>Diseño del salón sigue siendo el módulo 2D/3D para mesas y distribución. Decoración sigue siendo otro módulo separado con lienzo para la decoradora.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-bold text-green-200">
              <CheckCircle2 className="h-5 w-5" /> Se suma sobre lo existente, no reemplaza nada.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
