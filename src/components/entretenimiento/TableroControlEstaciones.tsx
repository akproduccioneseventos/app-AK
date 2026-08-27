'use client';

import React from 'react';
import Link from 'next/link';
import {
  Camera,
  RotateCcw,
  Video,
  Sparkles,
  Monitor,
  Mic,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface EstadoEstacionOperador {
  id: string;
  nombre: string;
  tipo: 'fotocabina' | 'plataforma360' | 'bogue' | 'espejoMagico' | 'totems' | 'capsulaTiempo';
  activa: boolean;
  estadoOperativo: 'idle' | 'countdown' | 'recording' | 'processing' | 'done' | 'desconectada' | 'falla';
  totalCapturas: number;
  ultimaCapturaUrl?: string;
  ultimoError?: string;
  rutaOperador: string;
  rutaPantalla: string;
}

export interface TableroControlEstacionesProps {
  fiestaId: string;
  nombreEvento: string;
  estaciones: EstadoEstacionOperador[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function TableroControlEstaciones({
  fiestaId,
  nombreEvento,
  estaciones,
  onRefresh,
  isLoading = false,
}: TableroControlEstacionesProps) {
  const totalGeneral = estaciones.reduce((sum, e) => sum + e.totalCapturas, 0);
  const activasCount = estaciones.filter((e) => e.activa).length;
  const conFalla = estaciones.filter((e) => e.estadoOperativo === 'falla' || Boolean(e.ultimoError));

  return (
    <div className="space-y-6">
      {/* Resumen Superior */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Capturas Esta Noche</p>
            <p className="mt-2 text-4xl font-black text-amber-400">{totalGeneral}</p>
            <p className="mt-1 text-xs text-slate-500">Recuerdos generados en vivo</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estaciones Activas</p>
            <p className="mt-2 text-4xl font-black text-emerald-400">
              {activasCount} <span className="text-xl text-slate-500 font-normal">/ {estaciones.length}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Listas para los invitados</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-900/60 backdrop-blur">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado del Sistema</p>
            <div className="mt-2 flex items-center gap-2">
              {conFalla.length === 0 ? (
                <>
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  <span className="text-xl font-bold text-white">Todo en orden</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-7 w-7 text-amber-400" />
                  <span className="text-xl font-bold text-amber-300">
                    {conFalla.length} {conFalla.length === 1 ? 'con aviso' : 'con avisos'}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">Monitoreo continuo en tiempo real</p>
          </CardContent>
        </Card>
      </div>

      {/* Botón Refrescar */}
      {onRefresh && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-white/10 bg-zinc-800/80 text-xs font-bold"
          >
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar Tablero
          </Button>
        </div>
      )}

      {/* Grilla de Estaciones */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {estaciones.map((est) => {
          const tieneError = est.estadoOperativo === 'falla' || Boolean(est.ultimoError);

          return (
            <Card
              key={est.id}
              className={`border transition ${
                tieneError
                  ? 'border-red-500/50 bg-red-950/20'
                  : est.activa
                  ? 'border-white/10 bg-zinc-900/80'
                  : 'border-white/5 bg-zinc-950/40 opacity-70'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-white">{est.nombre}</CardTitle>
                    <p className="text-xs text-slate-400 capitalize">{est.tipo}</p>
                  </div>
                  <Badge
                    variant={est.activa ? (tieneError ? 'destructive' : 'default') : 'secondary'}
                    className="capitalize text-xs font-semibold"
                  >
                    {tieneError ? 'Falla' : est.estadoOperativo}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Conteo y Miniatura */}
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-black/40 p-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Capturas</p>
                    <p className="text-2xl font-black text-amber-400">{est.totalCapturas}</p>
                  </div>

                  <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-zinc-800 flex items-center justify-center">
                    {est.ultimaCapturaUrl ? (
                      <img
                        src={est.ultimaCapturaUrl}
                        alt="Última captura"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-zinc-600" />
                    )}
                  </div>
                </div>

                {/* Aviso en criollo si hay falla */}
                {tieneError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-900/30 p-3 text-xs text-red-200">
                    <p className="font-bold">Aviso para el operador:</p>
                    <p className="mt-0.5">{est.ultimoError || 'La estación se desconectó. Verificá la cámara y la conexión.'}</p>
                  </div>
                )}

                {/* Acciones directas */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href={est.rutaOperador}
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                  >
                    Operar
                  </Link>

                  <Link
                    href={est.rutaPantalla}
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-zinc-700"
                  >
                    Ver Pantalla <ExternalLink className="ml-1.5 h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
