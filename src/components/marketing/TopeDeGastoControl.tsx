'use client';

import React, { useState, useTransition } from 'react';
import { ShieldCheck, TrendingUp, AlertCircle, History, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { actualizarTopePublicidad } from '@/app/actions/marketing-ads';
import type { EstadoDelTope } from '@/lib/marketing/tope-de-gasto-publicidad';
import type { AccionPublicidadEjecutada } from '@/lib/marketing/meta-ads-acciones';

interface Props {
  estadoInicial: EstadoDelTope;
  historialInicial: AccionPublicidadEjecutada[];
}

export function TopeDeGastoControl({ estadoInicial, historialInicial }: Props) {
  const [tope, setTope] = useState(estadoInicial.topeMensualUYU);
  const [estado, setEstado] = useState(estadoInicial);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleGuardar = () => {
    startTransition(async () => {
      const res = await actualizarTopePublicidad(Number(tope) || 0);
      if (res.success) {
        setMensaje(res.mensaje);
        setEstado((prev) => ({
          ...prev,
          topeMensualUYU: Number(tope) || 0,
          disponibleUYU: Math.max(0, (Number(tope) || 0) - prev.comprometidoUYU),
        }));
        setTimeout(() => setMensaje(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Panel del Freno de Mano */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-black text-zinc-950">Freno de Mano del Agente (Tope Mensual)</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              El agente tiene autorización para pausar y ajustar anuncios solo, pero tiene prohibido comprometer más de este monto por mes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">$</span>
              <Input
                type="number"
                min="0"
                step="500"
                value={tope || ''}
                onChange={(e) => setTope(Number(e.target.value))}
                placeholder="0"
                className="w-36 pl-7 font-black text-sm"
              />
            </div>
            <Button
              onClick={handleGuardar}
              disabled={isPending}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Tope'}
            </Button>
          </div>
        </div>

        {mensaje && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            {mensaje}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Tope */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tope Mensual Configurado</span>
            <p className="mt-2 text-2xl font-black text-zinc-950">
              ${Math.round(estado.topeMensualUYU).toLocaleString('es-UY')}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 font-medium">
              {estado.topeMensualUYU === 0 ? 'Sin tope: el agente no puede gastar' : 'Límite máximo en pesos'}
            </p>
          </div>

          {/* Card 2: Comprometido */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Comprometido en el Mes</span>
            <p className="mt-2 text-2xl font-black text-amber-700">
              ${Math.round(estado.comprometidoUYU).toLocaleString('es-UY')}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500 font-medium">
              Por campañas activas en los {estado.diasQueQuedanDelMes} días restantes
            </p>
          </div>

          {/* Card 3: Disponible */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Disponible para el Agente</span>
            <p className="mt-2 text-2xl font-black text-emerald-700">
              ${Math.round(estado.disponibleUYU).toLocaleString('es-UY')}
            </p>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">
              Margen libre para escalar o crear campañas
            </p>
          </div>
        </div>
      </div>

      {/* Historial de Acciones Autónomas */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <History className="h-5 w-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-black text-zinc-950">Registro de Acciones del Agente de Publicidad</h3>
            <p className="text-xs text-zinc-500">Historial de qué cambió, cuándo y por qué motivo.</p>
          </div>
        </div>

        {historialInicial.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-500 font-medium">
            El agente aún no ha ejecutado cambios autónomos en Meta Ads.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-700 border-b border-zinc-200">
                <tr>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Acción</th>
                  <th className="px-3 py-2.5">Campaña</th>
                  <th className="px-3 py-2.5">Detalle</th>
                  <th className="px-3 py-2.5">Motivo</th>
                  <th className="px-3 py-2.5 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {historialInicial.map((acc) => (
                  <tr key={acc.id} className="hover:bg-zinc-50/50">
                    <td className="px-3 py-3 text-zinc-500">
                      {new Date(acc.fecha).toLocaleDateString('es-UY', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          acc.tipo === 'pausar'
                            ? 'bg-amber-100 text-amber-800'
                            : acc.tipo === 'ajustar_presupuesto' || acc.tipo === 'reactivar'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {acc.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-bold text-zinc-900">{acc.campanaNombre}</td>
                    <td className="px-3 py-3 text-zinc-600">
                      {acc.presupuestoNuevoUYU
                        ? `$${acc.presupuestoAnteriorUYU ?? 0} → $${acc.presupuestoNuevoUYU}/día`
                        : acc.estadoNuevo ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-zinc-500 max-w-xs truncate">{acc.motivo}</td>
                    <td className="px-3 py-3 text-right font-bold">
                      {acc.ejecutadoConExito ? (
                        <span className="text-emerald-600">Éxito</span>
                      ) : (
                        <span className="text-red-600" title={acc.resultadoDetalle}>
                          Rechazado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
