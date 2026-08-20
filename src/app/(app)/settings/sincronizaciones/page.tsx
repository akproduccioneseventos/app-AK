'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  ExternalLink,
  Zap,
  RefreshCw,
  Share2,
  Calendar,
  MessageCircle,
  CreditCard,
  Music,
  Video,
  Globe,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getEstadoConexiones, type ResumenConexion } from '@/app/actions/conexiones-estado.actions';

export default function SincronizacionesPage() {
  const [conexiones, setConexiones] = useState<ResumenConexion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'conectada' | 'falta-configurarla' | 'no-se-usa'>('todas');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await getEstadoConexiones();
      setConexiones(data);
    } catch (err) {
      console.error('Error al cargar conexiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const total = conexiones.length;
  const conectadas = conexiones.filter((c) => c.estado === 'conectada').length;
  const faltantes = conexiones.filter((c) => c.estado === 'falta-configurarla').length;
  const noUsa = conexiones.filter((c) => c.estado === 'no-se-usa').length;

  const filtradas = conexiones.filter((c) => {
    if (filtro === 'todas') return true;
    return c.estado === filtro;
  });

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-indigo-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">¿Qué está conectado?</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Estado real y transparente de las 13 integraciones y plataformas externas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={loading}
            className="gap-2 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/settings/tareas-automaticas">
            <Button size="sm" variant="outline" className="gap-2 text-amber-700 border-amber-300 hover:bg-amber-50">
              <Zap className="h-4 w-4" />
              Tareas automáticas
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumen de contadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card
          onClick={() => setFiltro('todas')}
          className={`cursor-pointer transition-all border-slate-200 shadow-sm ${
            filtro === 'todas' ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : 'hover:bg-slate-50'
          }`}
        >
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-slate-500">TOTAL PLATAFORMAS</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-800">{total}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-400">Servicios soportados</CardContent>
        </Card>

        <Card
          onClick={() => setFiltro('conectada')}
          className={`cursor-pointer transition-all border-emerald-200 bg-emerald-50/40 shadow-sm ${
            filtro === 'conectada' ? 'ring-2 ring-emerald-500' : 'hover:bg-emerald-50/70'
          }`}
        >
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-emerald-700">CONECTADAS</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              {conectadas}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-emerald-600 font-medium">Funcionando activas</CardContent>
        </Card>

        <Card
          onClick={() => setFiltro('falta-configurarla')}
          className={`cursor-pointer transition-all border-amber-200 bg-amber-50/40 shadow-sm ${
            filtro === 'falta-configurarla' ? 'ring-2 ring-amber-500' : 'hover:bg-amber-50/70'
          }`}
        >
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-amber-700">FALTA CONFIGURAR</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              {faltantes}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-amber-600 font-medium">Requieren datos o cuenta</CardContent>
        </Card>

        <Card
          onClick={() => setFiltro('no-se-usa')}
          className={`cursor-pointer transition-all border-slate-200 bg-slate-50/60 shadow-sm ${
            filtro === 'no-se-usa' ? 'ring-2 ring-slate-400' : 'hover:bg-slate-100/60'
          }`}
        >
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs font-semibold text-slate-600">NO SE USA</CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-600 flex items-center gap-2">
              <MinusCircle className="h-5 w-5 text-slate-500" />
              {noUsa}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-slate-500 font-medium">Opcionales desactivadas</CardContent>
        </Card>
      </div>

      {/* Lista de Conexiones */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">
                Plataformas e Integraciones Externas ({filtradas.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                La pantalla nunca simula datos: si una conexión no tiene credenciales, lo declara con honestidad.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-slate-100">
          {filtradas.map((c) => {
            const esConectada = c.estado === 'conectada';
            const esFaltante = c.estado === 'falta-configurarla';
            const esNoUsa = c.estado === 'no-se-usa';

            return (
              <div
                key={c.id}
                className={`p-5 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  esFaltante ? 'bg-amber-50/15' : esNoUsa ? 'bg-slate-50/30 opacity-80' : 'hover:bg-slate-50/40'
                }`}
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-bold text-base text-slate-900">{c.nombre}</span>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {c.categoria}
                    </span>

                    {esConectada && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 gap-1 font-semibold text-xs">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        Conectada
                      </Badge>
                    )}
                    {esFaltante && (
                      <Badge className="bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-100 gap-1 font-bold text-xs">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        Falta configurarla
                      </Badge>
                    )}
                    {esNoUsa && (
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 gap-1 font-medium text-xs">
                        <MinusCircle className="h-3 w-3 text-slate-400" />
                        No se usa
                      </Badge>
                    )}
                  </div>

                  {/* Detalle actual */}
                  <p className="text-xs text-slate-500 font-medium">
                    <strong className="text-slate-700">Estado actual: </strong>
                    {c.detalle}
                  </p>

                  {/* Qué se pierde si falta */}
                  {(esFaltante || esNoUsa) && (
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-amber-800 font-semibold">Qué se pierde: </strong>
                      {c.queSePierdeSiFalta}
                    </p>
                  )}
                </div>

                {/* Botón de configurar */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  {c.enlaceConfiguracion && (
                    <Link href={c.enlaceConfiguracion}>
                      <Button
                        size="sm"
                        variant={esFaltante ? 'default' : 'outline'}
                        className={`gap-2 font-medium ${
                          esFaltante
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {esConectada ? 'Administrar' : 'Configurar'}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
