'use client';

import React from 'react';
import { UserCheck, Sparkles, AlertCircle, Lightbulb, Users, DollarSign, Building2, TrendingUp } from 'lucide-react';
import type { AnalisisClienteIdeal } from '@/lib/marketing/cliente-ideal';

interface Props {
  analisis: AnalisisClienteIdeal;
}

export function FichaClienteIdeal({ analisis }: Props) {
  if (!analisis.hayDatosSuficientes) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center space-y-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center">
          <UserCheck className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">Perfil de Cliente Ideal en Construcción</h3>
        <p className="text-xs text-zinc-600 max-w-md mx-auto">
          {analisis.mensajeInsuficiente}
        </p>
        <span className="inline-block text-[11px] font-semibold text-zinc-400">
          Contratos analizados: {analisis.totalContratosAnalizados} | Presupuestos pendientes: {analisis.totalPerdidosAnalizados}
        </span>
      </div>
    );
  }

  const { datos, consejos, fichaResumen } = analisis;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-black text-zinc-950">Tu Cliente Ideal (Calculado con Datos Reales)</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Basado en {analisis.totalContratosAnalizados} contratos confirmados y {analisis.totalPerdidosAnalizados} propuestas analizadas. Sin inventar nada.
          </p>
        </div>
      </div>

      {/* Ficha Resumen */}
      {fichaResumen && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            Ficha Rápida del Perfil Ganador
          </p>
          <p className="mt-2 text-sm font-semibold text-purple-950 leading-relaxed">
            {fichaResumen}
          </p>
        </div>
      )}

      {/* Métricas del Perfil */}
      {datos && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Evento Principal
            </div>
            <p className="mt-1 text-base font-black text-zinc-950">{datos.tipoEventoTop.nombre}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{datos.tipoEventoTop.porcentajeCierre}% de los cierres</p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
              <Users className="h-3.5 w-3.5 text-indigo-600" /> Rango Invitados
            </div>
            <p className="mt-1 text-base font-black text-zinc-950">{datos.rangoInvitadosTop.rango}</p>
            <p className="text-[10px] text-zinc-500 font-medium">Mayor tasa de éxito</p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Ticket Promedio
            </div>
            <p className="mt-1 text-base font-black text-zinc-950">${datos.ticketPromedioUYU.toLocaleString('es-UY')}</p>
            <p className="text-[10px] text-zinc-500 font-medium">En contratos cerrados</p>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3">
            <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
              <Building2 className="h-3.5 w-3.5 text-amber-600" /> Salón Preferido
            </div>
            <p className="mt-1 text-base font-black text-zinc-950 truncate">{datos.salonPreferido.nombre}</p>
            <p className="text-[10px] text-zinc-500 font-medium">{datos.salonPreferido.porcentaje}% de elecciones</p>
          </div>
        </div>
      )}

      {/* 3 Consejos Accionables */}
      {consejos.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            3 Decisiones de Negocio Sugeridas por tus Datos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {consejos.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 space-y-2 flex flex-col justify-between hover:border-purple-300 transition"
              >
                <div className="space-y-1.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      c.impacto === 'alto'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.impacto === 'medio'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.impacto === 'alto' ? 'Impacto Alto' : c.impacto === 'medio' ? 'Estrategia' : 'Oportunidad'}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-950">{c.titulo}</h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">{c.consejo}</p>
                </div>
                <div className="pt-2 border-t border-zinc-100 text-[10px] text-zinc-400 font-medium">
                  📊 <span className="text-zinc-600">{c.datoRespaldo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
