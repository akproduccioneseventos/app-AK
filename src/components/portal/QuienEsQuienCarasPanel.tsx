'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Check, Loader2, Search, Undo2, Users } from 'lucide-react';
import {
  asignarNombreCaraDesdePortal,
  obtenerPersonasParaPortalCliente,
  type PersonaPortalCliente,
} from '@/app/actions/social-gallery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface QuienEsQuienCarasPanelProps {
  fiestaId: string;
}

export function QuienEsQuienCarasPanel({ fiestaId }: QuienEsQuienCarasPanelProps) {
  const [personas, setPersonas] = useState<PersonaPortalCliente[]>([]);
  const [invitados, setInvitados] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busquedas, setBusquedas] = useState<Record<string, string>>({});
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (typeof obtenerPersonasParaPortalCliente !== 'function') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await obtenerPersonasParaPortalCliente(fiestaId);
      if (res.success) {
        setPersonas(res.personas);
        setInvitados(res.invitados);
        setError(null);
      } else {
        setError(res.error || 'No pudimos cargar las caras de la fiesta.');
      }
    } catch (err) {
      console.warn('[QuienEsQuienCarasPanel] Error cargando caras:', err);
      setError('No pudimos cargar las caras de la fiesta.');
    } finally {
      setLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const asignar = async (persona: PersonaPortalCliente, invitado?: { id: string; nombre: string }) => {
    setGuardandoId(persona.id);
    setAviso(null);
    try {
      const res = await asignarNombreCaraDesdePortal({
        fiestaId,
        personaId: persona.id,
        representativeFotoId: persona.representativeFotoId,
        invitadoId: invitado?.id,
        nombre: invitado?.nombre,
      });
      if (res.success) {
        setPersonas((prev) =>
          prev.map((p) =>
            p.id === persona.id
              ? { ...p, invitadoId: res.invitadoId, nombre: res.nombre }
              : p,
          ),
        );
        setAviso(
          res.nombre
            ? `Listo: vinculamos esa cara con ${res.nombre}.`
            : 'Se quitó la asignación de esa cara.',
        );
      } else {
        setError(res.error || 'No pudimos guardar el nombre.');
      }
    } catch (err) {
      console.warn('[QuienEsQuienCarasPanel] Error asignando cara:', err);
      setError('No pudimos guardar el nombre.');
    } finally {
      setGuardandoId(null);
    }
  };

  const invitadosOrdenados = useMemo(
    () => [...invitados].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [invitados],
  );

  return (
    <section
      data-testid="quien-es-quien-panel"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">¿Quién es quién?</h2>
            <p className="text-xs text-slate-600">
              Nombrá a los invitados de tu fiesta en las caras detectadas para que sus fotos les lleguen solas.
            </p>
          </div>
        </div>
        <Badge variant="secondary">{personas.length} personas</Badge>
      </div>

      {aviso && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {aviso}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando caras de la fiesta...</span>
        </div>
      ) : personas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Todavía no hay caras agrupadas en las fotos aprobadas de tu fiesta.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => {
            const filtro = (busquedas[persona.id] || '').trim().toLowerCase();
            const coincidencias = filtro
              ? invitadosOrdenados.filter((inv) => inv.nombre.toLowerCase().includes(filtro)).slice(0, 8)
              : invitadosOrdenados.slice(0, 8);
            const busy = guardandoId === persona.id;

            return (
              <div
                key={persona.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm">
                    {persona.thumbnailUrl ? (
                      <img
                        src={persona.thumbnailUrl}
                        alt={persona.nombre || 'Persona detectada'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">
                      {persona.nombre || 'Sin asignar'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {persona.fotoIds.length} {persona.fotoIds.length === 1 ? 'foto' : 'fotos'}
                    </p>
                  </div>
                  {persona.invitadoId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => asignar(persona, undefined)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Deshacer
                    </Button>
                  )}
                </div>

                {!persona.invitadoId && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={busquedas[persona.id] || ''}
                        onChange={(e) =>
                          setBusquedas((prev) => ({ ...prev, [persona.id]: e.target.value }))
                        }
                        placeholder="Buscar invitado de tu fiesta..."
                        className="h-8 bg-white pl-8 text-xs"
                        disabled={busy}
                      />
                    </div>
                    {coincidencias.length === 0 ? (
                      <p className="text-[11px] text-slate-500">Sin coincidencias en tu lista.</p>
                    ) : (
                      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                        {coincidencias.map((inv) => (
                          <button
                            key={inv.id}
                            type="button"
                            disabled={busy}
                            onClick={() => asignar(persona, inv)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Check className="h-3 w-3 text-rose-600" />
                            {inv.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
