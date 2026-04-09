'use client';

import type { FiestaEnPlanificacion } from '@/types/fiesta';

interface Props {
  fiesta: FiestaEnPlanificacion;
}

function calcularProgreso(fiesta: FiestaEnPlanificacion): { porcentaje: number; items: { label: string; completado: boolean }[] } {
  const hoy = new Date();
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  const allPaid = cuotas.length > 0 && cuotas.every(c => c.estado === 'pagado');
  const senaPagada = cuotas.some(c => c.descripcion?.toLowerCase().includes('seña') && c.estado === 'pagado');
  const menuDefinido = !!(fiesta.menuMesa?.entrada && fiesta.menuMesa?.platoPrincipal);
  const invitadosConfirmados = (fiesta.invitados ?? []).filter(i => i.rsvp === 'Confirmado').length;
  const invitadosEstimados = Number(fiesta.configuracion?.invitadosEstimados) || 0;
  const listaInvitadosOk = invitadosEstimados > 0 && invitadosConfirmados >= invitadosEstimados * 0.5;
  const pagosAlDia = cuotas.length === 0 || cuotas.filter(c => {
    if (c.estado === 'pagado') return false;
    if (!c.fechaVencimiento) return false;
    return new Date(c.fechaVencimiento) < hoy;
  }).length === 0;
  const decoracionAprobada = !!(fiesta.decoracion?.moodboardItems?.some(i => i.likedByClient));
  const cronogramaCargado = !!(fiesta.timeline && fiesta.timeline.length > 0);

  const items = [
    { label: 'Evento creado', completado: true },
    { label: 'Seña pagada', completado: senaPagada },
    { label: 'Menú definido', completado: menuDefinido },
    { label: 'Lista de invitados (+50%)', completado: listaInvitadosOk },
    { label: 'Pagos al día', completado: pagosAlDia },
    { label: 'Decoración aprobada', completado: decoracionAprobada },
    { label: 'Cronograma cargado', completado: cronogramaCargado },
    { label: 'Pagos completados 100%', completado: allPaid },
  ];

  const weights = [10, 15, 15, 15, 15, 10, 10, 10];
  const porcentaje = items.reduce((sum, item, i) => sum + (item.completado ? weights[i] : 0), 0);
  return { porcentaje, items };
}

function getMotivoMensaje(pct: number): string {
  if (pct >= 90) return '🎉 ¡Tu evento está casi listo! Estamos muy cerca del gran día.';
  if (pct >= 70) return '💪 ¡Muy bien! Van quedando pocos detalles por resolver.';
  if (pct >= 50) return '🚀 ¡A mitad de camino! Sigamos avanzando juntos.';
  if (pct >= 30) return '📋 Buen comienzo. Hay algunos pasos importantes por completar.';
  return '✨ ¡Empezamos! Completá los primeros pasos para avanzar en la planificación.';
}

export function EventProgressBar({ fiesta }: Props) {
  const { porcentaje, items } = calcularProgreso(fiesta);
  const incompletos = items.filter(i => !i.completado);

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-black text-slate-800 text-sm">📊 Progreso de tu evento</p>
        <span className="text-2xl font-black text-purple-700">{porcentaje}%</span>
      </div>

      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${porcentaje}%`, background: 'linear-gradient(90deg, #9333ea, #22c55e)' }}
        />
      </div>

      <p className="text-xs text-slate-600">{getMotivoMensaje(porcentaje)}</p>

      {incompletos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Pendiente</p>
          {incompletos.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-4 h-4 rounded border border-slate-200 inline-flex items-center justify-center shrink-0">⬜</span>
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
