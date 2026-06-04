'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertTriangle, Clock, Music2, UtensilsCrossed, CalendarDays, Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getMenuById } from '@/app/actions/menus-catering';
import type { FiestaEnPlanificacion, ProgramaEventoItem, MusicaFiesta } from '@/types/fiesta';
import type { FullMenu } from '@/types/catering';

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-UY', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function ProveedorPage() {
  const params = useParams();
  const fiestaId = params.id as string;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [menu, setMenu] = useState<FullMenu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!fiestaId) return;
    setIsLoading(true);
    try {
      const f = await getFiestaById(fiestaId);
      if (!f) { setError('Evento no encontrado.'); return; }
      setFiesta(f);
      if (f.menuAsignadoId) {
        const m = await getMenuById(f.menuAsignadoId);
        setMenu(m);
      }
    } catch {
      setError('No se pudo cargar la información del evento.');
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-3">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <p className="text-lg font-semibold">{error ?? 'Evento no encontrado'}</p>
            <p className="text-muted-foreground text-sm">Verificá el link con quien te lo envió.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cfg = fiesta.configuracion;
  const programa: ProgramaEventoItem[] = fiesta.programa ?? [];
  const musica: MusicaFiesta = fiesta.musica ?? {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <Badge variant="outline" className="mb-2 text-xs">Acceso Proveedor · Solo Lectura</Badge>
          <h1 className="text-2xl font-bold">{cfg.nombreEvento || 'Evento'}</h1>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {formatDate(cfg.fechaEvento)}
            </span>
            {cfg.invitadosEstimados && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {cfg.invitadosEstimados} invitados
              </span>
            )}
            {cfg.nombreLugar && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {cfg.nombreLugar}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Timeline / Programa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Cronograma del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programa.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay cronograma cargado aún.</p>
            ) : (
              <ol className="relative border-l border-gray-200 space-y-4 ml-2">
                {programa.map((item, i) => (
                  <li key={item.id ?? i} className="ml-4">
                    <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary border-2 border-white" />
                    <time className="text-xs font-semibold text-primary">{item.hora}</time>
                    <p className="font-medium text-sm">{item.titulo}</p>
                    {item.descripcion && (
                      <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Menu */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              Menú del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {menu ? (
              <div className="space-y-3">
                <p className="font-semibold text-base">{menu.name}</p>
                {menu.description && <p className="text-sm text-muted-foreground">{menu.description}</p>}
                {menu.items && menu.items.length > 0 && (
                  <ul className="space-y-1.5">
                    {menu.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <span><strong>{item.name}</strong>{item.type ? ` · ${item.type}` : ''}{item.notes ? ` – ${item.notes}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {(!menu.items || menu.items.length === 0) && (
                  <p className="text-muted-foreground text-sm">Detalles del menú no disponibles.</p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Menú no asignado aún.</p>
            )}
          </CardContent>
        </Card>

        {/* Music */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music2 className="w-5 h-5 text-violet-500" />
              Lista Musical
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {musica.cancionEntrada && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entrada</p>
                <p className="text-sm">{musica.cancionEntrada}</p>
              </div>
            )}
            {musica.cancionVals && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vals / Primer Baile</p>
                <p className="text-sm">{musica.cancionVals}</p>
              </div>
            )}
            {musica.cancionesTortaBrindis && musica.cancionesTortaBrindis.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Torta / Brindis</p>
                <ul className="space-y-0.5">
                  {musica.cancionesTortaBrindis.map((c, i) => (
                    <li key={i} className="text-sm">• {c}</li>
                  ))}
                </ul>
              </div>
            )}
            {musica.playlistFiesta && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Playlist General</p>
                <p className="text-sm whitespace-pre-wrap">{musica.playlistFiesta}</p>
              </div>
            )}
            {musica.listaNoReproducir && (
              <div>
                <Separator />
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mt-3">No reproducir</p>
                <p className="text-sm whitespace-pre-wrap">{musica.listaNoReproducir}</p>
              </div>
            )}
            {musica.sugerenciasInvitados && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sugerencias de Invitados</p>
                <p className="text-sm whitespace-pre-wrap">{musica.sugerenciasInvitados}</p>
              </div>
            )}
            {!musica.cancionEntrada && !musica.cancionVals && !musica.playlistFiesta && (
              <p className="text-muted-foreground text-sm">Lista musical no configurada aún.</p>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground py-2">
          AK Producciones · Acceso de solo lectura para proveedores
        </p>
      </div>
    </div>
  );
}
