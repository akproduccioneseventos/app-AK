'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { saveMenuSeleccion } from '@/app/actions/fiesta/portal.actions';
import type { FiestaEnPlanificacion, MenuSeleccionPortal } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SESSION_KEY_PREFIX = 'portal_auth_';

export default function MenuPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const fiestaId = params.id;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MenuSeleccionPortal>({});

  useEffect(() => {
    const accessKey = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!accessKey) { sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId); router.replace(`/portal-cliente/${fiestaId}`); return; }
    getFiestaById(fiestaId)
      .then(data => {
        if (!data) { setError('Evento no encontrado.'); return; }
        setFiesta(data);
        setForm(data.menuSeleccionPortal ?? {});
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveMenuSeleccion(fiestaId, form);
    if (result.success) {
      toast({ title: '✅ Menú guardado', description: 'Tu selección de menú fue enviada.' });
    } else {
      toast({ title: 'Error', description: result.error ?? 'No se pudo guardar.', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
    </div>
  );

  if (error || !fiesta) return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md text-center border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-2" />
          <p className="text-red-700 font-semibold">{error ?? 'Error al cargar.'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const menuBase = fiesta.menuMesa;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">🍽️ Selección de Menú</p>
            <p className="text-xs text-slate-500">{fiesta.configuracion?.nombreEvento}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {menuBase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-black">Menú del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              {menuBase.entrada && <p><span className="font-semibold">Entrada:</span> {menuBase.entrada}</p>}
              {menuBase.platoPrincipal && <p><span className="font-semibold">Plato principal:</span> {menuBase.platoPrincipal}</p>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-black">Tu confirmación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="restricciones">Restricciones alimentarias</Label>
              <Textarea
                id="restricciones"
                placeholder="Ej: soy celíaco, vegetariano, alérgico a los mariscos..."
                value={form.restriccionesAlimentarias ?? ''}
                onChange={e => setForm(prev => ({ ...prev, restriccionesAlimentarias: e.target.value }))}
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full bg-purple-600 hover:bg-purple-700">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Confirmar selección
            </Button>
            {form.confirmado && form.fechaConfirmacion && (
              <p className="text-xs text-green-600 text-center">
                ✓ Confirmado el {new Date(form.fechaConfirmacion).toLocaleDateString('es-UY')}
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
