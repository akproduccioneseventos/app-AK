'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { aplicarPonerAlDia, getPonerAlDia, type ResultadoPonerAlDia } from '@/app/actions/poner-al-dia';
import type { PonerAlDia } from '@/lib/contabilidad/poner-al-dia';
import type { MetodoPago } from '@/types/presupuesto';
import { hoyEnUruguay } from '@/lib/utils';

const pesos = (n: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(n);
const fecha = (f: string) => (f ? f.split('-').reverse().join('/') : '—');

/**
 * Poner al día lo atrasado: cobros de fiestas pasadas, cancelaciones, copias y presupuestos de
 * prueba. Viene marcado lo que la app ya sabe; las cancelaciones las marca una persona. Nada se
 * aplica hasta tocar el botón.
 */
export default function PonerAlDiaPage() {
  const { toast } = useToast();
  const [datos, setDatos] = useState<PonerAlDia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cobrar, setCobrar] = useState<Set<string>>(new Set());
  const [detalleCobros, setDetalleCobros] = useState<Record<string, { fecha: string; metodoPago: MetodoPago }>>({});
  const [cancelar, setCancelar] = useState<Set<string>>(new Set());
  const [copias, setCopias] = useState<Set<string>>(new Set());
  const [pruebas, setPruebas] = useState<Set<string>>(new Set());
  const [aplicando, setAplicando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPonerAlDia | null>(null);

  const cargar = async () => {
    setError(null);
    try {
      const r = await getPonerAlDia();
      if (!r.success) {
        setError(r.error);
        return;
      }
      setDatos(r.datos);
      // Los cobros NO vienen marcados (13/11/2026): un toque registraba como cobradas todas las fiestas pasadas,
      // con la fecha de la fiesta y sin comprobante. Marcar un cobro lo decide una persona, uno por uno.
      setCobrar(new Set());
      setCancelar(new Set());
      setCopias(new Set(r.datos.copias.map((c) => c.fiestaId)));
      setPruebas(new Set(r.datos.pruebas.map((p) => p.presupuestoId)));
    } catch {
      setError('No se pudo cargar la lista. Probá de nuevo.');
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const total = useMemo(() => cobrar.size + cancelar.size + copias.size + pruebas.size, [cobrar, cancelar, copias, pruebas]);

  const alternar = (conjunto: Set<string>, poner: (s: Set<string>) => void, id: string) => {
    const s = new Set(conjunto);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    poner(s);
  };

  const aplicar = async () => {
    const marcados = (datos?.cobros || []).filter((c) => cobrar.has(c.presupuestoId));
    const sinFecha = marcados.filter((c) => !detalleCobros[c.presupuestoId]?.fecha);
    if (sinFecha.length > 0) {
      toast({ title: 'Falta la fecha del cobro', description: `Poné en qué fecha se cobró: ${sinFecha.map((c) => c.cliente).join(', ')}.`, variant: 'destructive' });
      return;
    }
    if (marcados.length > 0) {
      const suma = marcados.reduce((s, c) => s + c.saldo, 0);
      if (!window.confirm(`Vas a registrar ${marcados.length} cobro(s) por ${pesos(suma)}. ¿Confirmás?`)) return;
    }
    setAplicando(true);
    try {
      const r = await aplicarPonerAlDia({
        cobrar: [...cobrar],
        detalleCobros,
        cancelar: [...cancelar],
        archivarCopias: [...copias],
        archivarPruebas: [...pruebas],
      });
      setResultado(r);
      if (r.error) {
        toast({ title: 'No se aplicó', description: r.error, variant: 'destructive' });
      } else if (r.success) {
        toast({ title: 'Listo', description: `Se aplicaron ${r.hechos} cambios.` });
      } else {
        toast({ title: `Se aplicaron ${r.hechos}, fallaron ${r.fallas.length}`, description: 'Mirá la lista de abajo.', variant: 'destructive' });
      }
      await cargar();
    } catch {
      toast({ title: 'No se pudo aplicar', description: 'Se cortó la conexión. Recargá para ver qué quedó hecho.', variant: 'destructive' });
    } finally {
      setAplicando(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card><CardHeader><CardTitle>No se pudo abrir</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
          <CardContent><Button onClick={() => void cargar()}>Reintentar</Button></CardContent></Card>
      </div>
    );
  }
  if (!datos) {
    return <div className="flex items-center justify-center p-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const Fila = ({ marcado, onChange, children }: { marcado: boolean; onChange: () => void; children: React.ReactNode }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-slate-50">
      <input type="checkbox" checked={marcado} onChange={onChange} className="h-5 w-5" />
      <span className="flex-1 text-sm">{children}</span>
    </label>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-black">Poner al día</h1>
        <p className="text-sm text-slate-500">
          Lo que quedó atrasado en la app. Viene marcado lo que la app ya sabe, salvo los cobros: marcá sólo los que ya cobraste de verdad, las cancelaciones, y tocá
          &quot;Aplicar&quot;. Nada cambia hasta que lo tocás.
        </p>
      </div>

      {resultado && resultado.fallas.length > 0 && (
        <Card className="border-rose-200 bg-rose-50"><CardContent className="space-y-1 p-4 text-sm text-rose-800" role="alert">
          {resultado.fallas.map((f) => <p key={f.que}>{f.que}: {f.error}</p>)}
        </CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Fiestas que ya pasaron y figuran sin cobrar ({datos.cobros.length})</CardTitle>
          <CardDescription>Se registra un cobro confirmado por el saldo, con la fecha en que se cobró y el medio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {datos.cobros.length === 0 && <p className="text-sm text-slate-500">No hay ninguna.</p>}
          {datos.cobros.map((c) => (
            <div key={c.presupuestoId}>
            <Fila marcado={cobrar.has(c.presupuestoId)} onChange={() => alternar(cobrar, setCobrar, c.presupuestoId)}>
              <b>{c.cliente}</b> · {fecha(c.fecha)} · saldo <b>{pesos(c.saldo)}</b>
              <span className="text-slate-500"> (total {pesos(c.total)}, cobrado {pesos(c.cobrado)})</span>
            </Fila>
              {cobrar.has(c.presupuestoId) && (
                <div className="ml-11 -mt-1 mb-1 flex flex-wrap items-center gap-2">
                  <label className="text-xs text-slate-600">
                    Se cobró el{' '}
                    <input
                      type="date"
                      aria-label={`Fecha en que se cobró a ${c.cliente}`}
                      max={hoyEnUruguay()}
                      value={detalleCobros[c.presupuestoId]?.fecha || ''}
                      onChange={(e) => setDetalleCobros((d) => ({ ...d, [c.presupuestoId]: { metodoPago: d[c.presupuestoId]?.metodoPago || 'Transferencia Bancaria', fecha: e.target.value } }))}
                      className="rounded border px-1 py-0.5"
                    />
                  </label>
                  <select
                    aria-label={`Medio de pago de ${c.cliente}`}
                    value={detalleCobros[c.presupuestoId]?.metodoPago || 'Transferencia Bancaria'}
                    onChange={(e) => setDetalleCobros((d) => ({ ...d, [c.presupuestoId]: { fecha: d[c.presupuestoId]?.fecha || '', metodoPago: e.target.value as MetodoPago } }))}
                    className="rounded border px-1 py-0.5 text-xs"
                  >
                    <option value="Transferencia Bancaria">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="MercadoPago">Mercado Pago</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>¿Alguna de estas se canceló?</CardTitle>
          <CardDescription>Marcá las que se cancelaron: pasan a suspendidas (se pueden reactivar).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {datos.vigentes.map((f) => (
            <Fila key={f.fiestaId} marcado={cancelar.has(f.fiestaId)} onChange={() => alternar(cancelar, setCancelar, f.fiestaId)}>
              <b>{f.cliente || f.nombre}</b> · {fecha(f.fecha)} <span className="text-slate-500">· {f.nombre}</span>
            </Fila>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fiestas cargadas dos veces ({datos.copias.length})</CardTitle>
          <CardDescription>Copias viejas, sin presupuesto detrás, de una fiesta que ya está bien cargada. Se archivan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {datos.copias.length === 0 && <p className="text-sm text-slate-500">No hay ninguna.</p>}
          {datos.copias.map((c) => (
            <Fila key={c.fiestaId} marcado={copias.has(c.fiestaId)} onChange={() => alternar(copias, setCopias, c.fiestaId)}>
              {fecha(c.fecha)} · <span className="text-slate-500">copia de</span> <b>{c.igualA}</b>
            </Fila>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Presupuestos de prueba ({datos.pruebas.length})</CardTitle>
          <CardDescription>Sin confirmar, sin fiesta y con la fecha pasada. Se archivan (se pueden recuperar).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {datos.pruebas.length === 0 && <p className="text-sm text-slate-500">No hay ninguno.</p>}
          {datos.pruebas.map((p) => (
            <Fila key={p.presupuestoId} marcado={pruebas.has(p.presupuestoId)} onChange={() => alternar(pruebas, setPruebas, p.presupuestoId)}>
              <b>{p.cliente}</b> · {fecha(p.fecha)} · {pesos(p.total)}
            </Fila>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-lg">
        <span className="text-sm font-bold">{total} cambios marcados</span>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/empresa/contabilidad">Volver</Link></Button>
          <Button onClick={() => void aplicar()} disabled={aplicando || total === 0}>
            {aplicando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
