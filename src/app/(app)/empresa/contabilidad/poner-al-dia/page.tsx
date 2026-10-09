'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { aplicarPonerAlDia, getPonerAlDia, type ResultadoPonerAlDia } from '@/app/actions/poner-al-dia';
import type { PonerAlDia } from '@/lib/contabilidad/poner-al-dia';

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
      setCobrar(new Set(r.datos.cobros.map((c) => c.presupuestoId)));
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
    setAplicando(true);
    try {
      const r = await aplicarPonerAlDia({
        cobrar: [...cobrar],
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
          Lo que quedó atrasado en la app. Viene marcado lo que la app ya sabe; revisalo, marcá las cancelaciones y tocá
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
          <CardDescription>Se registra un cobro confirmado por el saldo, con la fecha de la fiesta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {datos.cobros.length === 0 && <p className="text-sm text-slate-500">No hay ninguna.</p>}
          {datos.cobros.map((c) => (
            <Fila key={c.presupuestoId} marcado={cobrar.has(c.presupuestoId)} onChange={() => alternar(cobrar, setCobrar, c.presupuestoId)}>
              <b>{c.cliente}</b> · {fecha(c.fecha)} · saldo <b>{pesos(c.saldo)}</b>
              <span className="text-slate-500"> (total {pesos(c.total)}, cobrado {pesos(c.cobrado)})</span>
            </Fila>
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
