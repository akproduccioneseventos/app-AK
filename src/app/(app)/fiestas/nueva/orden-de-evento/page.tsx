'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  ChefHat,
  Clock,
  FileText,
  GlassWater,
  Loader2,
  MapPin,
  Palette,
  Printer,
  Truck,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { armarHojaDeCocina, type HojaDeCocina } from '@/lib/catering/hoja-de-cocina';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Empleado } from '@/types/empleado';
import type { Rol } from '@/types/rol';

function OrdenDeEventoContenido() {
  const searchParams = useSearchParams();
  const [fiestaId, setFiestaId] = useState(searchParams.get('fiestaId') || '');

  useEffect(() => {
    if (fiestaId) return;
    const deUrl = new URLSearchParams(window.location.search).get('fiestaId');
    if (deUrl) setFiestaId(deUrl);
  }, [fiestaId]);

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [hojaCocina, setHojaCocina] = useState<HojaDeCocina | null>(null);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    if (!fiestaId) {
      setError('Falta indicar la fiesta.');
      setCargando(false);
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const [fiestaData, listaEmpleados, listaRoles] = await Promise.all([
        getFiestaById(fiestaId),
        getEmpleados().catch(() => [] as Empleado[]),
        getRoles().catch(() => [] as Rol[]),
      ]);

      if (!fiestaData) throw new Error('Fiesta no encontrada');

      setFiesta(fiestaData);
      setEmpleados(listaEmpleados);
      setRoles(listaRoles);

      const presupuesto = fiestaData.presupuestoId
        ? await getPresupuestoById(fiestaData.presupuestoId).catch(() => null)
        : null;

      const adultos =
        presupuesto?.invitadosAdultos ||
        Number(fiestaData.configuracion?.invitadosEstimados) ||
        0;
      const chicos =
        (presupuesto?.invitadosNinos || 0) +
        (presupuesto?.invitadosAdolescentes || 0);

      const platos = (presupuesto?.itemsPresupuestados || [])
        .filter(
          (item) =>
            item.idServicioCatalogo?.startsWith('dish_') ||
            item.idServicioCatalogo?.startsWith('menu_') ||
            item.idServicioCatalogo?.startsWith('new_item_'),
        )
        .map((item) => ({
          nombre: item.nombreServicio,
          categoria: item.categoriaServicio,
        }));

      setHojaCocina(armarHojaDeCocina(fiestaData, platos, { adultos, chicos }));
    } catch (e: any) {
      setError(e?.message || 'Error al cargar orden de evento');
    } finally {
      setCargando(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  if (cargando) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="p-8 text-center text-destructive">
        <p>{error || 'No se pudo cargar la orden de evento.'}</p>
        <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
          <Button variant="outline" className="mt-4">
            Volver a la fiesta
          </Button>
        </Link>
      </div>
    );
  }

  const { configuracion } = fiesta;
  const cronograma = Array.isArray(fiesta.programa) ? [...fiesta.programa] : [];
  cronograma.sort((a: any, b: any) => (a.hora || '').localeCompare(b.hora || ''));

  const personalAsignado = fiesta.personalAsignado || [];
  const empleadosMap = new Map(empleados.map((e) => [e.id, e.nombre]));
  const rolesMap = new Map(roles.map((r) => [r.id, r.nombre]));

  // Tragos
  const tragos = fiesta.cartaTragos?.items || [];

  // Decoración
  const temaDeco = fiesta.decoracion?.tema;
  const rawPaleta = fiesta.decoracion?.paletaColores;
  const paletaDeco = Array.isArray(rawPaleta)
    ? rawPaleta.join(', ')
    : typeof rawPaleta === 'string'
      ? rawPaleta
      : rawPaleta && typeof rawPaleta === 'object'
        ? Object.values(rawPaleta).filter(Boolean).join(', ')
        : 'Estándar';

  // Carga operativa
  const categoriasCarga = fiesta.listaDeCargaOperativa?.categorias || [];

  // Alergias
  const confirmadosConAlergia = (fiesta.invitados || []).filter(
    (inv) =>
      inv.rsvp === 'Confirmado' &&
      ((inv.dietaryRestriction && inv.dietaryRestriction !== 'Ninguna') ||
        inv.alergiasEspecificas),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 print:p-0 print:max-w-none print:m-0 text-slate-900">
      {/* Botonera superior (oculta al imprimir) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orden de Evento</h1>
            <p className="text-sm text-muted-foreground">
              Hoja única operativa para el equipo en el salón (sin datos comerciales).
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.print()} className="bg-slate-900 text-white">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* DOCUMENTO OPERATIVO EN UNA HOJA */}
      <div className="bg-white border rounded-xl p-6 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
        {/* Cabecera */}
        <div className="border-b pb-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                AK Producciones — Orden de Evento
              </span>
              <h2 className="text-3xl font-extrabold uppercase mt-1">
                {configuracion.nombreEvento || 'Evento Sin Nombre'}
              </h2>
            </div>
            <Badge variant="outline" className="text-sm uppercase font-semibold">
              {configuracion.tipoCelebracion || 'Fiesta'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block uppercase font-bold">Fecha</span>
              <span className="font-semibold flex items-center gap-1 mt-0.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                {configuracion.fechaEvento || 'A definir'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block uppercase font-bold">Horario</span>
              <span className="font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="h-4 w-4 text-slate-500" />
                {configuracion.horaInicio || '21:00'} a {configuracion.horaFin || '05:00'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block uppercase font-bold">Lugar / Salón</span>
              <span className="font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="h-4 w-4 text-slate-500" />
                {configuracion.nombreLugar || 'A coordinar'}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block uppercase font-bold">Invitados</span>
              <span className="font-semibold flex items-center gap-1 mt-0.5">
                <Users className="h-4 w-4 text-slate-500" />
                {configuracion.invitadosEstimados || 0} personas
              </span>
            </div>
          </div>
        </div>

        {/* 1. Cronograma */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            1. Cronograma
          </h3>
          {cronograma.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Sin cargar.{' '}
              <Link
                href={`/fiestas/nueva/itinerario?fiestaId=${fiestaId}`}
                className="text-blue-600 underline print:hidden"
              >
                Cargar en Itinerario
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {cronograma.map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 border-b border-dashed border-slate-200 pb-1">
                  <span className="font-mono font-bold text-slate-700 min-w-14">
                    {item.hora || '--:--'}
                  </span>
                  <div>
                    <span className="font-medium text-slate-900">
                      {item.titulo || item.actividad || 'Momento'}
                    </span>
                    {item.responsable && (
                      <span className="text-xs text-slate-500 ml-1.5">({item.responsable})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Cocina y Menú */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-amber-600" />
            2. Cocina y Menú
          </h3>
          {!hojaCocina || hojaCocina.platos.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Sin cargar.{' '}
              <Link
                href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`}
                className="text-blue-600 underline print:hidden"
              >
                Cargar en Catering
              </Link>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {hojaCocina.platos.map((plato, idx) => (
                  <div key={idx} className="border p-2 rounded bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-semibold block uppercase">
                      {plato.momento}
                    </span>
                    <span className="font-medium">{plato.nombre}</span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      {plato.porciones} porciones ({plato.paraQuien})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Alergias y Dietas Especiales */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-red-600" />
            3. Alergias y Restricciones Alimentarias
          </h3>
          {confirmadosConAlergia.length === 0 ? (
            <div className="text-sm text-slate-500">No se registraron alergias ni restricciones en invitados confirmados.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {confirmadosConAlergia.map((inv) => (
                <div key={inv.id} className="border p-2 rounded bg-red-50/40 border-red-100">
                  <span className="font-semibold block">{inv.nombre}</span>
                  <span className="text-xs text-red-700">
                    {inv.dietaryRestriction || 'Especial'}
                    {inv.alergiasEspecificas ? ` (${inv.alergiasEspecificas})` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Barra y Bebidas */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <GlassWater className="h-4 w-4 text-cyan-600" />
            4. Barra y Bebidas
          </h3>
          {tragos.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Sin cargar.{' '}
              <Link
                href={`/fiestas/nueva/carta-tragos?fiestaId=${fiestaId}`}
                className="text-blue-600 underline print:hidden"
              >
                Cargar en Carta de Tragos
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 text-sm">
              {tragos.map((t: any, idx: number) => (
                <Badge key={idx} variant="secondary" className="font-medium text-xs">
                  {t.nombre}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 5. Personal Operativo Asignado */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            5. Personal en el Evento
          </h3>
          {personalAsignado.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Sin cargar.{' '}
              <Link
                href={`/fiestas/nueva/personal?fiestaId=${fiestaId}`}
                className="text-blue-600 underline print:hidden"
              >
                Cargar en Personal
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
              {personalAsignado.map((p, idx) => {
                const nombreEmpleado = empleadosMap.get(p.empleadoId) || p.empleadoId;
                const nombreRol = rolesMap.get(p.rolId) || p.rolId;
                return (
                  <div key={idx} className="border p-2 rounded bg-slate-50">
                    <span className="font-semibold block">{nombreEmpleado}</span>
                    <span className="text-xs text-slate-500 uppercase">{nombreRol}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6. Equipamiento y Carga Operativa */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <Truck className="h-4 w-4 text-orange-600" />
            6. Equipamiento y Carga
          </h3>
          {categoriasCarga.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Sin cargar.{' '}
              <Link
                href={`/fiestas/nueva/carga-operativa?fiestaId=${fiestaId}`}
                className="text-blue-600 underline print:hidden"
              >
                Cargar en Carga Operativa
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {categoriasCarga.map((cat, idx) => (
                <div key={idx} className="border p-2 rounded">
                  <span className="font-bold text-xs uppercase text-slate-600 block mb-1">
                    {cat.nombre}
                  </span>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {(cat.items || []).slice(0, 6).map((it, iIdx) => (
                      <li key={iIdx}>
                        {it.nombre} {it.cantidad ? `(x${it.cantidad})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Decoración y Estilo */}
        <div>
          <h3 className="text-base font-bold uppercase tracking-wide border-b pb-1 mb-2 flex items-center gap-2">
            <Palette className="h-4 w-4 text-pink-600" />
            7. Ambientación y Colores
          </h3>
          {!temaDeco && !paletaDeco ? (
            <div className="text-sm text-muted-foreground">
              Sin cargar.{' '}
              <Link
                href={`/fiestas/nueva/decoracion?fiestaId=${fiestaId}`}
                className="text-blue-600 underline print:hidden"
              >
                Cargar en Decoración
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block">Temática</span>
                <span className="font-semibold">{temaDeco || 'Estándar'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-bold block">Paleta de Colores</span>
                <span className="font-semibold">{paletaDeco || 'Estándar'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrdenDeEventoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OrdenDeEventoContenido />
    </Suspense>
  );
}
