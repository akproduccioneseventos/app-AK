'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

const SESSION_KEY_PREFIX = 'portal_auth_';

const rsvpConfig = {
  Confirmado: { icon: CheckCircle2, cls: 'text-green-500', badge: 'bg-green-100 text-green-700' },
  Rechazado: { icon: XCircle, cls: 'text-red-400', badge: 'bg-red-100 text-red-700' },
  'Tal vez': { icon: HelpCircle, cls: 'text-amber-400', badge: 'bg-amber-100 text-amber-700' },
  Pendiente: { icon: HelpCircle, cls: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' },
};

export default function ConfirmarInvitadosPortalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fiestaId = params.id;

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>('Todos');

  useEffect(() => {
    const accessKey = sessionStorage.getItem(SESSION_KEY_PREFIX + fiestaId);
    if (!accessKey) { sessionStorage.removeItem(SESSION_KEY_PREFIX + fiestaId); router.replace(`/portal-cliente/${fiestaId}`); return; }
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

  const invitados = fiesta.invitados ?? [];
  const confirmados = invitados.filter(i => i.rsvp === 'Confirmado').length;
  const rechazados = invitados.filter(i => i.rsvp === 'Rechazado').length;
  const pendientes = invitados.filter(i => i.rsvp === 'Pendiente' || i.rsvp === 'Tal vez').length;

  const filtrados = filtro === 'Todos' ? invitados : invitados.filter(i => i.rsvp === filtro);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900">👥 Invitados</p>
            <p className="text-xs text-slate-500">{fiesta.configuracion?.nombreEvento}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">👥 Estado de Confirmaciones</h1>
          <p className="text-slate-500 text-sm mt-1">Seguimiento de los RSVP de tus invitados</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Confirmados', count: confirmados, cls: 'text-green-700 bg-green-50 border-green-200' },
            { label: 'Rechazados', count: rechazados, cls: 'text-red-700 bg-red-50 border-red-200' },
            { label: 'Pendientes', count: pendientes, cls: 'text-slate-700 bg-slate-50 border-slate-200' },
          ].map((item, i) => (
            <div key={i} className={`rounded-2xl border p-3 text-center ${item.cls}`}>
              <p className="text-2xl font-black">{item.count}</p>
              <p className="text-xs font-semibold">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {['Todos', 'Confirmado', 'Pendiente', 'Rechazado'].map(f => (
            <Button
              key={f}
              size="sm"
              variant={filtro === f ? 'default' : 'outline'}
              onClick={() => setFiltro(f)}
              className={filtro === f ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {f}
            </Button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {filtrados.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-400 text-sm">Sin invitados en este filtro</CardContent>
            </Card>
          ) : (
            filtrados.map(inv => {
              const cfg = rsvpConfig[inv.rsvp] ?? rsvpConfig.Pendiente;
              const Icon = cfg.icon;
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                  <Icon className={`w-5 h-5 shrink-0 ${cfg.cls}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{inv.nombre}</p>
                    {inv.tableNumber && <p className="text-xs text-slate-400">Mesa {inv.tableNumber}</p>}
                  </div>
                  <Badge className={`text-xs shrink-0 ${cfg.badge}`}>{inv.rsvp}</Badge>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
