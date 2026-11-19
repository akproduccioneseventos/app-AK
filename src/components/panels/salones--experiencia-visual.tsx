'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Box, Building2, Compass, ExternalLink, Loader2, Save, Sparkles, Video } from 'lucide-react';

import { getSalones, saveSalon } from '@/app/actions/salones';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { isClubUruguay } from '@/lib/club-uruguay';
import type { Salon, SalonExperiencia3D } from '@/types/salon';

type Draft = Required<SalonExperiencia3D>;

const emptyDraft: Draft = {
  videoUrl: '',
  recorridoUrl: '',
  modelo3dUrl: '',
  notas: '',
};

function toDraft(salon: Salon): Draft {
  return {
    videoUrl: salon.experiencia3D?.videoUrl || '',
    recorridoUrl: salon.experiencia3D?.recorridoUrl || '',
    modelo3dUrl: salon.experiencia3D?.modelo3dUrl || '',
    notas: salon.experiencia3D?.notas || '',
  };
}

function toExperience(draft: Draft): SalonExperiencia3D | undefined {
  const next: SalonExperiencia3D = {
    videoUrl: draft.videoUrl.trim() || undefined,
    recorridoUrl: draft.recorridoUrl.trim() || undefined,
    modelo3dUrl: draft.modelo3dUrl.trim() || undefined,
    notas: draft.notas.trim() || undefined,
  };
  return Object.values(next).some(Boolean) ? next : undefined;
}

function hasVisualExperience(salon: Salon) {
  return Boolean(
    salon.experiencia3D?.videoUrl ||
    salon.experiencia3D?.recorridoUrl ||
    salon.experiencia3D?.modelo3dUrl ||
    salon.experiencia3D?.notas
  );
}

export default function SalonVisualExperiencePage() {
  const { toast } = useToast();
  const [salones, setSalones] = useState<Salon[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadSalones = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getSalones();
      const list = Array.isArray(data) ? data : [];
      setSalones(list);
      setDrafts(Object.fromEntries(list.map((salon) => [salon.id, toDraft(salon)])));
    } catch (error: any) {
      toast({ title: 'No se pudieron cargar los salones', description: error?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSalones();
  }, [loadSalones]);

  const completedCount = useMemo(() => salones.filter(hasVisualExperience).length, [salones]);

  const updateDraft = (salonId: string, field: keyof Draft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [salonId]: { ...(prev[salonId] || emptyDraft), [field]: value },
    }));
  };

  const handleSave = async (salon: Salon) => {
    const draft = drafts[salon.id] || emptyDraft;
    setSavingId(salon.id);
    try {
      const result = await saveSalon({ ...salon, experiencia3D: toExperience(draft) });
      if (!result.success) throw new Error(result.error || 'No se pudo guardar.');
      toast({ title: 'Experiencia visual guardada', description: `${salon.nombre} quedo actualizado.` });
      await loadSalones();
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error?.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/empresa/salones">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a salones
            </Link>
          </Button>
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Cierre CTO</Badge>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-4 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                <Sparkles className="h-4 w-4" />
                Video, recorrido y modelo 3D por salon
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Experiencia visual de salones</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla completa lo que faltaba: cargar links de video, recorrido 360 o modelo 3D para que la web publica y el equipo comercial puedan mostrar mejor cada salon sin tocar el diseno 2D/3D existente.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardHeader><CardTitle>Estado simple</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Salones cargados</span><strong>{salones.length}</strong></div>
              <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Con experiencia visual</span><strong>{completedCount}</strong></div>
              <div className="rounded-md bg-white p-3 text-muted-foreground">Club Uruguay queda priorizado automaticamente si esta marcado como salon destacado.</div>
            </CardContent>
          </Card>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-slate-700" /></div>
        ) : salones.length === 0 ? (
          <Card><CardContent className="p-10 text-center text-muted-foreground">Todavia no hay salones cargados.</CardContent></Card>
        ) : (
          <section className="grid gap-5 xl:grid-cols-2">
            {salones.map((salon) => {
              const draft = drafts[salon.id] || emptyDraft;
              const club = salon.esClubUruguay || isClubUruguay(salon.nombre);
              const saving = savingId === salon.id;
              return (
                <Card key={salon.id} className={club ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'}>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-slate-600" />
                        {salon.nombre}
                      </CardTitle>
                      {club && <Badge className="bg-amber-500 text-white hover:bg-amber-500">Club Uruguay</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/empresa/salones/${salon.id}/diseno`}>Abrir diseno 2D/3D</Link>
                      </Button>
                      {draft.recorridoUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={draft.recorridoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-3.5 w-3.5" />Ver recorrido</a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2"><Video className="h-4 w-4" />Video del salon</Label>
                        <Input value={draft.videoUrl} onChange={(event) => updateDraft(salon.id, 'videoUrl', event.target.value)} placeholder="https://youtube.com/..." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2"><Compass className="h-4 w-4" />Recorrido 360</Label>
                        <Input value={draft.recorridoUrl} onChange={(event) => updateDraft(salon.id, 'recorridoUrl', event.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2"><Box className="h-4 w-4" />Modelo 3D o visor externo</Label>
                      <Input value={draft.modelo3dUrl} onChange={(event) => updateDraft(salon.id, 'modelo3dUrl', event.target.value)} placeholder="https://.../modelo.glb o visor 3D" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notas para vender mejor este salon</Label>
                      <Textarea value={draft.notas} onChange={(event) => updateDraft(salon.id, 'notas', event.target.value)} rows={3} placeholder="Ej: ideal para bodas, entrada por calle principal, mejor ubicacion de pista..." />
                    </div>
                    <Button onClick={() => handleSave(salon)} disabled={saving} className="w-full bg-slate-900 hover:bg-slate-800">
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      {saving ? 'Guardando...' : 'Guardar experiencia visual'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
