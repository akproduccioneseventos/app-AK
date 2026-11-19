'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getComparativaDeGanancias } from '@/app/actions/comparativa-ganancias';
import type { Comparativa, ResumenDeGrupo } from '@/lib/costos/comparativa';

/**
 * Qué tipo de fiesta deja más plata.
 *
 * El Analizador de Rentabilidad muestra una fiesta por vez. Esta pantalla las pone
 * a todas juntas, que es lo que hace falta para decidir qué conviene vender.
 */

const pesos = (monto: number) =>
  `$ ${Math.round(monto).toLocaleString('es-UY')}`;

const NOMBRE_DE_MES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function mesEnCriollo(clave: string): string {
  const [anio, mes] = clave.split('-');
  const indice = Number(mes) - 1;
  if (!NOMBRE_DE_MES[indice]) return clave;
  return `${NOMBRE_DE_MES[indice]} de ${anio}`;
}

function Fila({ grupo, etiqueta }: { grupo: ResumenDeGrupo; etiqueta: string }) {
  const gana = grupo.gananciaReal >= 0;
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pr-4 font-semibold text-slate-900">{etiqueta}</td>
      <td className="py-3 pr-4 text-right tabular-nums text-slate-500">{grupo.cantidad}</td>
      <td className="py-3 pr-4 text-right tabular-nums text-slate-600">{pesos(grupo.ingreso)}</td>
      <td className="py-3 pr-4 text-right tabular-nums text-slate-600">{pesos(grupo.costoReal)}</td>
      <td
        className={`py-3 pr-4 text-right font-bold tabular-nums ${gana ? 'text-emerald-700' : 'text-rose-700'}`}
      >
        {pesos(grupo.gananciaReal)}
      </td>
      <td
        className={`py-3 text-right font-semibold tabular-nums ${gana ? 'text-emerald-700' : 'text-rose-700'}`}
      >
        {Math.round(grupo.margenReal)}%
      </td>
    </tr>
  );
}

function Tabla({
  titulo,
  bajada,
  grupos,
  etiqueta,
}: {
  titulo: string;
  bajada: string;
  grupos: ResumenDeGrupo[];
  etiqueta: (clave: string) => string;
}) {
  if (grupos.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
      <p className="mb-4 text-sm text-slate-500">{bajada}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
              <th className="pb-2 pr-4 text-left">&nbsp;</th>
              <th className="pb-2 pr-4 text-right">Fiestas</th>
              <th className="pb-2 pr-4 text-right">Se cobró</th>
              <th className="pb-2 pr-4 text-right">Costó</th>
              <th className="pb-2 pr-4 text-right">Quedó</th>
              <th className="pb-2 text-right">Margen</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <Fila key={grupo.clave} grupo={grupo} etiqueta={etiqueta(grupo.clave)} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ComparativaGananciasPage() {
  const [comparativa, setComparativa] = useState<Comparativa | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getComparativaDeGanancias()
      .then((r) => {
        if (r.ok && r.comparativa) setComparativa(r.comparativa);
        else setError(r.error || 'No se pudo cargar la comparación.');
      })
      .catch(() => setError('No se pudo cargar la comparación.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Juntando las cuentas de todas las fiestas…
      </div>
    );
  }

  if (error || !comparativa) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  const { total, porTipo, porMes, fiestas, sinGastoCargado } = comparativa;

  if (fiestas.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Todavía no hay nada para comparar</h1>
        <p className="text-slate-500">
          Cuando las fiestas tengan cargado lo que se cobró y lo que costó, acá vas a ver cuál
          te deja más plata.
        </p>
      </div>
    );
  }

  const gana = total.gananciaReal >= 0;
  const mejorTipo = porTipo[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Qué fiesta deja más plata
          </h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            Todas las fiestas juntas, para ver de un vistazo qué conviene vender.
          </p>
        </div>
        <Button asChild variant="outline" className="h-10 rounded-xl">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-900 p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Se cobró</p>
          <p className="mt-1 text-2xl font-black tabular-nums">{pesos(total.ingreso)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Costó</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-slate-800">
            {pesos(total.costoReal)}
          </p>
        </div>
        <div
          className={`rounded-2xl p-5 ${gana ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}
        >
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${gana ? 'text-emerald-700' : 'text-rose-700'}`}
          >
            Quedó
          </p>
          <p
            className={`mt-1 flex items-center gap-2 text-2xl font-black tabular-nums ${gana ? 'text-emerald-800' : 'text-rose-800'}`}
          >
            {gana ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            {pesos(total.gananciaReal)}
          </p>
          <p className={`text-xs ${gana ? 'text-emerald-700' : 'text-rose-700'}`}>
            {Math.round(total.margenReal)}% de lo cobrado, en {total.cantidad} fiestas
          </p>
        </div>
      </section>

      {mejorTipo && porTipo.length > 1 && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Lo que más te deja hoy son <strong>{mejorTipo.clave.toLowerCase()}</strong>: unos{' '}
          <strong>{pesos(mejorTipo.gananciaPromedio)}</strong> por fiesta.
        </p>
      )}

      {sinGastoCargado > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Ojo: {sinGastoCargado} de {total.cantidad} fiestas todavía no tienen cargado lo que
            se pagó de verdad, así que para esas se usa lo que se estimó gastar. A medida que
            cargues los pagos, estos números se vuelven más certeros.
          </span>
        </p>
      )}

      <Tabla
        titulo="Por tipo de fiesta"
        bajada="Cuál conviene vender más."
        grupos={porTipo}
        etiqueta={(clave) => clave}
      />

      <Tabla
        titulo="Mes a mes"
        bajada="Cómo viene el año."
        grupos={porMes}
        etiqueta={mesEnCriollo}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Fiesta por fiesta</h2>
        <p className="mb-4 text-sm text-slate-500">De la que más dejó a la que menos.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400">
                <th className="pb-2 pr-4 text-left">Fiesta</th>
                <th className="pb-2 pr-4 text-right">Se cobró</th>
                <th className="pb-2 pr-4 text-right">Costó</th>
                <th className="pb-2 pr-4 text-right">Quedó</th>
                <th className="pb-2 text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              {fiestas.map((f) => {
                const positiva = f.ganancia.gananciaReal >= 0;
                return (
                  <tr key={f.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4">
                      <span className="font-semibold text-slate-900">{f.nombre}</span>
                      <span className="block text-xs text-slate-400">
                        {f.tipo}
                        {f.mes ? ` · ${mesEnCriollo(f.mes)}` : ''}
                        {!f.ganancia.hayGastoCargado ? ' · gasto estimado' : ''}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-600">
                      {pesos(f.ganancia.ingreso)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-600">
                      {pesos(f.ganancia.costoReal)}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-bold tabular-nums ${positiva ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {pesos(f.ganancia.gananciaReal)}
                    </td>
                    <td
                      className={`py-3 text-right font-semibold tabular-nums ${positiva ? 'text-emerald-700' : 'text-rose-700'}`}
                    >
                      {Math.round(f.ganancia.margenReal)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
