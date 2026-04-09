'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { calcularProgresoEvento } from '@/lib/event-progress';

type SemaforoColor = 'green' | 'yellow' | 'red' | 'gray';

interface SemaforoCard {
  titulo: string;
  emoji: string;
  color: SemaforoColor;
  descripcion: string;
  href: string;
}

function calcularSemaforos(fiesta: FiestaEnPlanificacion): SemaforoCard[] {
  const fiestaId = fiesta.id;
  const hoy = new Date();
  const fechaEvento = fiesta.configuracion?.fechaEvento ? new Date(fiesta.configuracion.fechaEvento) : null;
  const diasRestantes = fechaEvento ? Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  // Pagos
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  let pagoColor: SemaforoColor = 'green';
  let pagoDesc = 'Todos los pagos al día ✓';
  if (cuotas.length > 0) {
    const vencidas = cuotas.filter(c => c.estado !== 'pagado' && c.fechaVencimiento && new Date(c.fechaVencimiento) < hoy);
    const proximas = cuotas.filter(c => c.estado !== 'pagado' && c.fechaVencimiento && new Date(c.fechaVencimiento) >= hoy && new Date(c.fechaVencimiento) <= new Date(hoy.getTime() + 7 * 86400000));
    if (vencidas.length > 0) { pagoColor = 'red'; pagoDesc = `${vencidas.length} cuota(s) vencida(s) sin pagar`; }
    else if (proximas.length > 0) { pagoColor = 'yellow'; pagoDesc = `${proximas.length} cuota(s) vencen en los próximos 7 días`; }
  } else {
    pagoColor = 'gray'; pagoDesc = 'Sin plan de pagos definido';
  }

  // Invitados
  const invitados = fiesta.invitados ?? [];
  const confirmados = invitados.filter(i => i.rsvp === 'Confirmado').length;
  const estimados = Number(fiesta.configuracion?.invitadosEstimados) || 0;
  const pctConfirmados = estimados > 0 ? confirmados / estimados : 0;
  let invColor: SemaforoColor = 'gray';
  let invDesc = 'Sin lista de invitados';
  if (estimados > 0) {
    if (pctConfirmados >= 0.8) { invColor = 'green'; invDesc = `${confirmados}/${estimados} confirmados (${Math.round(pctConfirmados * 100)}%)`; }
    else if (pctConfirmados >= 0.5) { invColor = 'yellow'; invDesc = `${confirmados}/${estimados} confirmados (${Math.round(pctConfirmados * 100)}%)`; }
    else if (diasRestantes <= 30) { invColor = 'red'; invDesc = `Solo ${confirmados}/${estimados} confirmados y faltan ${diasRestantes} días`; }
    else { invColor = 'yellow'; invDesc = `${confirmados}/${estimados} confirmados (${Math.round(pctConfirmados * 100)}%)`; }
  }

  // Menú
  const menu = fiesta.menuMesa;
  let menuColor: SemaforoColor;
  let menuDesc: string;
  if (menu?.entrada && menu?.platoPrincipal) { menuColor = 'green'; menuDesc = 'Menú completo definido ✓'; }
  else if (menu?.entrada || menu?.platoPrincipal) { menuColor = 'yellow'; menuDesc = 'Menú parcialmente definido'; }
  else if (diasRestantes <= 60) { menuColor = 'red'; menuDesc = `Menú sin definir y faltan ${diasRestantes} días`; }
  else { menuColor = 'yellow'; menuDesc = 'Menú pendiente de definición'; }

  // Contrato
  const contrato = fiesta.contratoFirmaInfo;
  let contratoColor: SemaforoColor;
  let contratoDesc: string;
  if (contrato?.isSigned) { contratoColor = 'green'; contratoDesc = `Contrato firmado el ${contrato.signedAt ? new Date(contrato.signedAt).toLocaleDateString('es-UY') : '—'}`; }
  else if (diasRestantes > 30) { contratoColor = 'yellow'; contratoDesc = 'Contrato pendiente de firma'; }
  else { contratoColor = 'red'; contratoDesc = `Contrato sin firmar y faltan ${diasRestantes} días`; }

  // Fotografía
  const foto = fiesta.fotografiaYFilmacion;
  let fotoColor: SemaforoColor;
  let fotoDesc: string;
  if (!foto) { fotoColor = diasRestantes <= 30 ? 'red' : 'gray'; fotoDesc = 'Sin servicio de fotografía asignado'; }
  else {
    const allEntregados = (foto.servicios ?? []).every(s => s.estado === 'Entregado completo');
    const algunProceso = (foto.servicios ?? []).some(s => s.estado === 'En edición' || s.estado === 'En revisión');
    if (allEntregados) { fotoColor = 'green'; fotoDesc = 'Todos los archivos entregados ✓'; }
    else if (algunProceso) { fotoColor = 'yellow'; fotoDesc = 'Archivos en proceso de edición'; }
    else { fotoColor = diasRestantes <= 0 ? 'red' : 'yellow'; fotoDesc = 'Servicio contratado, pendiente de entrega'; }
  }

  // Decoración
  const deco = fiesta.decoracion;
  let decoColor: SemaforoColor;
  let decoDesc: string;
  if (deco?.moodboardItems?.some(i => i.likedByClient)) { decoColor = 'green'; decoDesc = 'Decoración aprobada por el cliente ✓'; }
  else if (deco?.moodboardItems?.length) { decoColor = 'yellow'; decoDesc = 'Decoración en diseño / pendiente aprobación'; }
  else if (diasRestantes <= 30) { decoColor = 'red'; decoDesc = `Decoración sin definir y faltan ${diasRestantes} días`; }
  else { decoColor = 'yellow'; decoDesc = 'Decoración pendiente de planificación'; }

  return [
    { titulo: 'Pagos', emoji: '💳', color: pagoColor, descripcion: pagoDesc, href: `/fiestas/nueva?fiestaId=${fiestaId}&tab=pagos` },
    { titulo: 'Invitados', emoji: '👥', color: invColor, descripcion: invDesc, href: `/fiestas/nueva/invitados?fiestaId=${fiestaId}` },
    { titulo: 'Menú', emoji: '🍽️', color: menuColor, descripcion: menuDesc, href: `/fiestas/nueva/menu-mesa?fiestaId=${fiestaId}` },
    { titulo: 'Documentos', emoji: '📄', color: contratoColor, descripcion: contratoDesc, href: `/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}` },
    { titulo: 'Fotografía', emoji: '📸', color: fotoColor, descripcion: fotoDesc, href: `/fiestas/nueva/fotografia?fiestaId=${fiestaId}` },
    { titulo: 'Decoración', emoji: '🎨', color: decoColor, descripcion: decoDesc, href: `/fiestas/nueva/decoracion?fiestaId=${fiestaId}` },
  ];
}

const semaforoEmoji: Record<SemaforoColor, string> = { green: '🟢', yellow: '🟡', red: '🔴', gray: '⚪' };
const semaforoBg: Record<SemaforoColor, string> = {
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-amber-50 border-amber-200',
  red: 'bg-red-50 border-red-200',
  gray: 'bg-slate-50 border-slate-200',
};
const semaforoText: Record<SemaforoColor, string> = {
  green: 'text-green-700',
  yellow: 'text-amber-700',
  red: 'text-red-700',
  gray: 'text-slate-500',
};

export default function CentroDeMandoPage() {
  const params = useParams();
  const router = useRouter();
  const fiestaId = params.id as string;
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fiestaId) return;
    getFiestaById(fiestaId)
      .then(data => {
        if (!data) setError('Evento no encontrado.');
        else setFiesta(data);
      })
      .catch(() => setError('No se pudo cargar el evento.'))
      .finally(() => setIsLoading(false));
  }, [fiestaId]);

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
          <p className="text-red-700 font-semibold">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  const config = fiesta.configuracion;
  const fechaEvento = config?.fechaEvento ? new Date(config.fechaEvento) : null;
  const hoy = new Date();
  const diasRestantes = fechaEvento ? Math.ceil((fechaEvento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const { porcentaje, items } = calcularProgresoEvento(fiesta);
  const semaforos = calcularSemaforos(fiesta);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-slate-50">
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{config?.nombreEvento ?? 'Evento'}</p>
            <p className="text-xs text-slate-500">{config?.tipoCelebracion} · {fechaEvento ? fechaEvento.toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
          {diasRestantes !== null && (
            <Badge variant="outline" className={diasRestantes <= 0 ? 'text-green-700 border-green-200 bg-green-50' : 'text-purple-700 border-purple-200 bg-purple-50'}>
              {diasRestantes <= 0 ? '🎉 ¡Hoy!' : `${diasRestantes} días`}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">🎯 Centro de Mando</h1>
          <p className="text-slate-500 text-sm mt-1">Visión general del estado de tu evento</p>
        </div>

        {/* Progreso general */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-black">
              <TrendingUp className="w-5 h-5 text-purple-600" /> Progreso General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black text-purple-700">{porcentaje}%</span>
              <div className="flex-1">
                <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${porcentaje}%`, background: 'linear-gradient(90deg, #9333ea, #22c55e)' }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {porcentaje >= 80 ? '🎉 ¡Casi listo!' : porcentaje >= 50 ? '💪 Vas muy bien' : '📋 Hay trabajo por hacer'}
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span>{item.completado ? '✅' : '⬜'}</span>
                  <span className={item.completado ? 'text-slate-700' : 'text-slate-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Semáforos */}
        <div>
          <h2 className="text-lg font-black text-slate-800 mb-4">🚦 Estado por Área</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semaforos.map((s, i) => (
              <Link key={i} href={s.href}>
                <Card className={`cursor-pointer hover:shadow-md transition-all ${semaforoBg[s.color]}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{semaforoEmoji[s.color]}</span>
                        <div>
                          <p className="font-black text-sm text-slate-800">{s.emoji} {s.titulo}</p>
                          <p className={`text-xs mt-0.5 ${semaforoText[s.color]}`}>{s.descripcion}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Links rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-black">⚡ Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Ver Timeline', href: `/fiestas/${fiestaId}/timeline`, emoji: '📅' },
              { label: 'Portal Cliente', href: `/portal-cliente/${fiestaId}`, emoji: '🌐' },
              { label: 'Configuración', href: `/fiestas/nueva/configuracion?fiestaId=${fiestaId}`, emoji: '⚙️' },
              { label: 'Presupuesto', href: `/fiestas/nueva?fiestaId=${fiestaId}`, emoji: '💰' },
            ].map((link, i) => (
              <Link key={i} href={link.href}>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold text-slate-700">{link.emoji} {link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
