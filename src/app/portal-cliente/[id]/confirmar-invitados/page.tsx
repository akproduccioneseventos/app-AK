'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion, Invitado, RsvpStatus } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, HelpCircle,
  Users, Accessibility, Utensils, Music, Clock, Search, Filter,
} from 'lucide-react';

const SESSION_KEY_PREFIX = 'portal_auth_';

const rsvpConfig: Record<RsvpStatus, { icon: React.ElementType; cls: string; badge: string }> = {
  Confirmado: { icon: CheckCircle2, cls: 'text-green-500', badge: 'bg-green-100 text-green-700 border-green-200' },
  Rechazado:  { icon: XCircle,      cls: 'text-red-400',   badge: 'bg-red-100 text-red-700 border-red-200'     },
  'Tal vez':  { icon: HelpCircle,   cls: 'text-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  Pendiente:  { icon: HelpCircle,   cls: 'text-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

type FilterTab = 'Todos' | 'Confirmado' | 'Pendiente' | 'Rechazado' | 'Tal vez' | 'Con necesidades' | 'Sin responder';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps a display label to the correct FilterTab value. */
function labelToFilter(label: string): FilterTab {
  if (label === 'Pendientes') return 'Pendiente';
  return label as FilterTab;
}

/** Returns whether a guest has accessibility requirements. */
function hasAccessibilityNeeds(inv: Invitado): boolean {
  return !!(inv.requiereAccesibilidad || inv.perfil === 'Necesidades Especiales');
}

export default function ConfirmarInvitadosPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FilterTab>('Todos');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const accessKey = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!accessKey) {
      sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId);
      router.replace(`/portal-cliente/${fiestaId}`);
      return;
    }
    getFiestaById(fiestaId)
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

  const invitados = fiesta.invitados ?? [];

  // Counts
  const confirmados       = invitados.filter(i => i.rsvp === 'Confirmado');
  const rechazados        = invitados.filter(i => i.rsvp === 'Rechazado');
  const talVez            = invitados.filter(i => i.rsvp === 'Tal vez');
  const pendientes        = invitados.filter(i => i.rsvp === 'Pendiente');
  const conNecesidades    = invitados.filter(hasAccessibilityNeeds);
  const totalPersonas     = invitados.reduce((s, i) => s + (i.partySize ?? 1), 0);
  const conDieta          = invitados.filter(i => i.dietaryRestriction && i.dietaryRestriction !== 'Ninguna');
  const conCanciones      = invitados.filter(i => i.cancionesDJ && i.cancionesDJ.length > 0);
  const checkedIn         = invitados.filter(i => i.checkedIn);

  // Filtered list
  const applyFilter = (list: Invitado[]): Invitado[] => {
    switch (filtro) {
      case 'Confirmado':      return list.filter(i => i.rsvp === 'Confirmado');
      case 'Rechazado':       return list.filter(i => i.rsvp === 'Rechazado');
      case 'Tal vez':         return list.filter(i => i.rsvp === 'Tal vez');
      case 'Pendiente':       return list.filter(i => i.rsvp === 'Pendiente');
      case 'Con necesidades': return list.filter(hasAccessibilityNeeds);
      case 'Sin responder':   return list.filter(i => i.rsvp === 'Pendiente');
      default:                return list;
    }
  };

  const filtrados = applyFilter(invitados).filter(i =>
    !search || i.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const TABS: FilterTab[] = ['Todos', 'Confirmado', 'Pendiente', 'Rechazado', 'Tal vez', 'Con necesidades'];
  const tabCount = (tab: FilterTab): number => {
    switch (tab) {
      case 'Confirmado':      return confirmados.length;
      case 'Rechazado':       return rechazados.length;
      case 'Tal vez':         return talVez.length;
      case 'Pendiente':       return pendientes.length;
      case 'Con necesidades': return conNecesidades.length;
      default:                return invitados.length;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">👥 Invitados</p>
            <p className="text-xs text-slate-500">{fiesta.configuracion?.nombreEvento}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(v => !v)}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
        {showSearch && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <Input
              autoFocus
              placeholder="Buscar invitado…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h1 className="text-2xl font-black text-slate-900">👥 Estado de Confirmaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Seguimiento de los RSVP de tus invitados</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Confirmados',  count: confirmados.length,  cls: 'text-green-700 bg-green-50 border-green-200',   icon: CheckCircle2 },
            { label: 'Pendientes',   count: pendientes.length,   cls: 'text-slate-700 bg-slate-50 border-slate-200',   icon: HelpCircle   },
            { label: 'Rechazados',   count: rechazados.length,   cls: 'text-red-700 bg-red-50 border-red-200',         icon: XCircle      },
            { label: 'Tal vez',      count: talVez.length,       cls: 'text-amber-700 bg-amber-50 border-amber-200',   icon: HelpCircle   },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => setFiltro(labelToFilter(item.label))}
                aria-label={`Filtrar por ${item.label.toLowerCase()}`}
                className={`rounded-2xl border p-3 text-center transition-all hover:scale-105 ${item.cls}`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
                <p className="text-2xl font-black">{item.count}</p>
                <p className="text-xs font-semibold">{item.label}</p>
              </button>
            );
          })}
        </div>

        {/* Extra stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" />
            <p className="text-xl font-black text-slate-800">{totalPersonas}</p>
            <p className="text-xs text-slate-500">personas totales</p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-center">
            <Utensils className="w-4 h-4 mx-auto text-orange-400 mb-1" />
            <p className="text-xl font-black text-orange-800">{conDieta.length}</p>
            <p className="text-xs text-orange-600">restricciones</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto text-green-500 mb-1" />
            <p className="text-xl font-black text-green-800">{checkedIn.length}</p>
            <p className="text-xs text-green-600">check-in</p>
          </div>
        </div>

        {/* Attention alerts */}
        {(conNecesidades.length > 0 || pendientes.length > 0) && (
          <div className="space-y-2">
            {conNecesidades.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 flex items-center gap-2 text-sm text-blue-800">
                <Accessibility className="w-4 h-4 shrink-0" />
                <span><strong>{conNecesidades.length}</strong> invitado(s) con necesidades especiales de accesibilidad</span>
              </div>
            )}
            {pendientes.length > 5 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 flex items-center gap-2 text-sm text-amber-800">
                <Clock className="w-4 h-4 shrink-0" />
                <span><strong>{pendientes.length}</strong> invitados aún sin responder</span>
              </div>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {TABS.map(tab => {
            const count = tabCount(tab);
            return (
              <button
                key={tab}
                onClick={() => setFiltro(tab)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all
                  ${filtro === tab
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400'}`}
              >
                {tab} {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Guest list */}
        <div className="space-y-2">
          {filtrados.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-400 text-sm">
                Sin invitados en este filtro
              </CardContent>
            </Card>
          ) : (
            filtrados.map(inv => {
              const cfg = rsvpConfig[inv.rsvp] ?? rsvpConfig.Pendiente;
              const Icon = cfg.icon;
              const hasDiet     = inv.dietaryRestriction && inv.dietaryRestriction !== 'Ninguna';
              const hasAccess   = hasAccessibilityNeeds(inv);
              const hasSongs    = inv.cancionesDJ && inv.cancionesDJ.length > 0;
              const hasMensaje  = !!inv.mensaje;

              return (
                <div
                  key={inv.id}
                  className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.cls}`} />
                    <div className="flex-1 min-w-0">
                      {/* Name + RSVP */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{inv.nombre}</p>
                        {inv.perfil && inv.perfil !== 'General' && (
                          <Badge className="text-xs border-0 bg-purple-100 text-purple-700">{inv.perfil}</Badge>
                        )}
                        {inv.checkedIn && (
                          <Badge className="text-xs border-0 bg-emerald-100 text-emerald-700">✅ Check-in</Badge>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        {inv.tableNumber && (
                          <span className="text-xs text-slate-500">Mesa <strong>{inv.tableNumber}</strong></span>
                        )}
                        {inv.partySize && inv.partySize > 1 && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {inv.partySize} personas
                          </span>
                        )}
                        {hasDiet && (
                          <span className="text-xs text-orange-600 flex items-center gap-1">
                            <Utensils className="w-3 h-3" /> {inv.dietaryRestriction}
                          </span>
                        )}
                        {inv.alergiasEspecificas && (
                          <span className="text-xs text-red-600">⚠ {inv.alergiasEspecificas}</span>
                        )}
                        {hasAccess && (
                          <span className="text-xs text-blue-600 flex items-center gap-1">
                            <Accessibility className="w-3 h-3" /> Accesibilidad
                          </span>
                        )}
                        {hasSongs && (
                          <span className="text-xs text-violet-600 flex items-center gap-1">
                            <Music className="w-3 h-3" /> {inv.cancionesDJ!.length} canción(es)
                          </span>
                        )}
                      </div>

                      {/* Companion names */}
                      {inv.companionNames && inv.companionNames.length > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          Acomp.: {inv.companionNames.filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Message preview */}
                      {hasMensaje && (
                        <p className="text-xs text-slate-400 mt-1 italic truncate">💬 &ldquo;{inv.mensaje}&rdquo;</p>
                      )}
                    </div>

                    <Badge className={`text-xs shrink-0 border ${cfg.badge}`}>{inv.rsvp}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DJ song summary */}
        {conCanciones.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-violet-800">
                <Music className="w-4 h-4" />
                Sugerencias al DJ ({conCanciones.reduce((s, i) => s + (i.cancionesDJ?.length ?? 0), 0)} canciones)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              {conCanciones.map(inv => (
                <div key={inv.id}>
                  <p className="text-xs font-semibold text-slate-600">{inv.nombre}</p>
                  <ul className="list-disc list-inside text-xs text-slate-500 ml-1">
                    {inv.cancionesDJ!.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Dietary summary */}
        {conDieta.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-orange-800">
                <Utensils className="w-4 h-4" />
                Restricciones alimentarias ({conDieta.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-1">
              {conDieta.map(inv => (
                <div key={inv.id} className="flex items-start gap-2 text-xs">
                  <span className="font-semibold text-slate-700 shrink-0">{inv.nombre}:</span>
                  <span className="text-orange-700">{inv.dietaryRestriction}</span>
                  {inv.alergiasEspecificas && (
                    <span className="text-red-600">· ⚠ {inv.alergiasEspecificas}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
