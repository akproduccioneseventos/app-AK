'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';

const SESSION_KEY_PREFIX = 'portal_auth_';

const estadoLabel: Record<string, { label: string; cls: string }> = {
  'Pendiente':          { label: 'Pendiente',          cls: 'bg-slate-100 text-slate-600' },
  'En edición':         { label: 'En edición',         cls: 'bg-blue-100 text-blue-700' },
  'En revisión':        { label: 'En revisión',        cls: 'bg-amber-100 text-amber-700' },
  'Entregado parcial':  { label: 'Entregado parcial',  cls: 'bg-green-100 text-green-700' },
  'Entregado completo': { label: 'Entregado completo', cls: 'bg-green-100 text-green-700' },
};

export default function FotosVideoPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessKey = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!accessKey) { router.replace(`/portal-cliente/${fiestaId}`); return; }
    getFiestaByAccessKey(fiestaId, accessKey)
      .then(data => {
        if (!data) { setError('Evento no encontrado.'); return; }
        setFiesta(data);
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId, router]);

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

  const servicios = fiesta.fotografiaYFilmacion?.servicios ?? [];
  const notas = fiesta.fotografiaYFilmacion?.notasGenerales;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">📸 Fotos & Video</p>
            <p className="text-xs text-slate-500">{fiesta.configuracion?.nombreEvento}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">📸 Fotos & Video</h1>
          <p className="text-slate-500 text-sm mt-1">Estado de entrega de tus archivos</p>
        </div>

        {servicios.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500 text-sm">
              <p>Aún no hay servicios de fotografía o filmación registrados.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {servicios.map(servicio => {
              const cfg = estadoLabel[servicio.estado] ?? { label: servicio.estado, cls: 'bg-slate-100 text-slate-600' };
              return (
                <Card key={servicio.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base font-black">{servicio.nombre}</CardTitle>
                      <Badge className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    {servicio.fechaEntregaEstimada && (
                      <p>📅 Entrega estimada: {new Date(servicio.fechaEntregaEstimada).toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    )}
                    {servicio.notas && <p className="text-slate-500">{servicio.notas}</p>}
                    {servicio.linkEntrega && (
                      <a href={servicio.linkEntrega} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 mt-1">
                          <ExternalLink className="w-4 h-4 mr-1.5" /> Descargar archivos
                        </Button>
                      </a>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {notas && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-black">📝 Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{notas}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
