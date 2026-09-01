'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ChefHat, Loader2, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { armarHojaDeCocina, type HojaDeCocina } from '@/lib/catering/hoja-de-cocina';

/**
 * La hoja que se imprime y se pega en la cocina la noche del evento.
 *
 * La lista de compras agrupa por proveedor, que sirve para ir al mercado. En la
 * cocina la pregunta es otra: **cuantas entradas salen, cuantos principales,
 * cuantos postres, y cuantos platos especiales aparte**.
 *
 * Los numeros salen de la misma cuenta que la lista de compras, para que las dos
 * pantallas nunca den distinto.
 */
function HojaDeCocinaContenido() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId') || '';

  const [hoja, setHoja] = useState<HojaDeCocina | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!fiestaId) {
      setError('Falta decir de qué fiesta es la hoja.');
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const fiesta = await getFiestaById(fiestaId);
      if (!fiesta) throw new Error('No se encontró la fiesta.');

      const presupuesto = fiesta.presupuestoId ? await getPresupuestoById(fiesta.presupuestoId) : null;

      const adultos = presupuesto?.invitadosAdultos || Number(fiesta.configuracion?.invitadosEstimados) || 0;
      const chicos = (presupuesto?.invitadosNinos || 0) + (presupuesto?.invitadosAdolescentes || 0);

      const platos = (presupuesto?.itemsPresupuestados || [])
        .filter((item) =>
          item.idServicioCatalogo?.startsWith('dish_') ||
          item.idServicioCatalogo?.startsWith('menu_') ||
          item.idServicioCatalogo?.startsWith('new_item_'),
        )
        .map((item) => ({ nombre: item.nombreServicio, categoria: item.categoriaServicio }));

      setHoja(armarHojaDeCocina(fiesta, platos, { adultos, chicos }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo armar la hoja de cocina.');
    } finally {
      setCargando(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !hoja) {
    return (
      <div className="p-6">
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-900">
              <AlertTriangle className="h-5 w-5" /> No se pudo armar la hoja
            </CardTitle>
            <CardDescription className="text-amber-800">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const fecha = hoja.fecha ? new Date(hoja.fecha).toLocaleDateString('es-UY') : '';

  return (
    <div className="mx-auto max-w-4xl p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button asChild variant="ghost">
          <Link href={`/fiestas/nueva/catering?fiestaId=${fiestaId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la comida
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Imprimir para la cocina
        </Button>
      </div>

      <header className="mb-6 border-b-2 border-slate-900 pb-4">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
          <ChefHat className="h-4 w-4" /> Hoja de cocina
        </p>
        <h1 className="text-3xl font-black text-slate-900">{hoja.nombreDeLaFiesta}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {fecha && <span className="font-semibold">{fecha} · </span>}
          {hoja.adultos} adultos y {hoja.chicos} chicos — <strong>{hoja.totalContratado} personas</strong>
          {hoja.totalConfirmado > 0 && <span> · {hoja.totalConfirmado} confirmaron</span>}
        </p>
      </header>

      {hoja.avisos.length > 0 && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {hoja.avisos.map((aviso) => (
            <p key={aviso} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {aviso}
            </p>
          ))}
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-black uppercase tracking-wide text-slate-900">Qué sale, y cuánto</h2>
        <table className="w-full border-collapse text-base">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Momento</th>
              <th className="py-2">Plato</th>
              <th className="py-2 text-right">Porciones</th>
            </tr>
          </thead>
          <tbody>
            {hoja.platos.map((plato, i) => (
              <tr key={`${plato.nombre}-${i}`} className="border-b border-slate-200">
                <td className="py-3 text-sm font-semibold text-slate-500">{plato.momento}</td>
                <td className="py-3 font-bold text-slate-900">{plato.nombre}</td>
                <td className="py-3 text-right">
                  <span className="text-2xl font-black text-slate-900">{plato.porciones}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {plato.paraQuien === 'adultos' ? 'adultos' : plato.paraQuien === 'chicos' ? 'chicos' : 'todos'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black uppercase tracking-wide text-slate-900">
          Platos especiales, aparte
        </h2>
        {hoja.especiales.length === 0 ? (
          <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
            Ningún invitado confirmado avisó restricciones. Igual conviene tener algo sin gluten a mano.
          </p>
        ) : (
          <ul className="space-y-2">
            {hoja.especiales.map((especial) => (
              <li
                key={especial.restriccion}
                className="flex items-start justify-between gap-4 rounded-lg border-2 border-slate-900 p-4"
              >
                <div>
                  <p className="text-lg font-black text-slate-900">{especial.restriccion}</p>
                  {especial.detalle && <p className="text-sm text-slate-600">{especial.detalle}</p>}
                </div>
                <span className="shrink-0 text-3xl font-black text-slate-900">{especial.personas}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function HojaDeCocinaPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <HojaDeCocinaContenido />
    </Suspense>
  );
}
