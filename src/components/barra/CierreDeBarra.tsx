'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getCierreDeBarra, guardarCierreDeBarra } from '@/app/actions/fiesta/barra-tecnologica.actions';
import { compararConElConteo, type FilaDelCierre } from '@/lib/barra/cierre-de-barra';
import type { CierreDeBarraGuardado } from '@/types/barra-tecnologica';

/**
 * Cierre de barra (28/09/2026). Al terminar la noche se cuentan las botellas y la app
 * compara con lo que descontaron los pedidos: la diferencia es lo que salió sin
 * registrarse. Opcionalmente deja el depósito en lo contado.
 */
export function CierreDeBarra({ fiestaId }: { fiestaId: string }) {
  const { toast } = useToast();
  const [filas, setFilas] = useState<FilaDelCierre[]>([]);
  const [ultimo, setUltimo] = useState<CierreDeBarraGuardado | undefined>();
  const [conteo, setConteo] = useState<Record<string, string>>({});
  const [ajustar, setAjustar] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!fiestaId) return;
    setCargando(true);
    const res = await getCierreDeBarra(fiestaId).catch((e) => ({ success: false as const, error: String(e?.message || e) }));
    if (res.success) {
      setFilas(res.filas ?? []);
      setUltimo(res.ultimoCierre);
      setError('');
    } else {
      setError(res.error || 'No se pudo cargar el cierre de barra.');
    }
    setCargando(false);
  }, [fiestaId]);

  useEffect(() => { void cargar(); }, [cargar]);

  const comparadas = useMemo(() => {
    const numeros: Record<string, number | undefined> = {};
    for (const [id, texto] of Object.entries(conteo)) numeros[id] = texto === '' ? undefined : Number(texto);
    return compararConElConteo(filas, numeros);
  }, [filas, conteo]);

  const faltantes = comparadas.filter((f) => (f.diferencia ?? 0) > 0);

  const guardar = async () => {
    const numeros: Record<string, number | undefined> = {};
    for (const [id, texto] of Object.entries(conteo)) numeros[id] = texto === '' ? undefined : Number(texto);
    setGuardando(true);
    const res = await guardarCierreDeBarra(fiestaId, numeros, ajustar)
      .catch((e) => ({ success: false as const, error: String(e?.message || e) }));
    setGuardando(false);
    if (!res.success) {
      toast({ title: 'No se guardó el cierre', description: res.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Cierre guardado', description: ajustar ? 'El depósito quedó en lo contado.' : 'El depósito no se tocó.' });
    setConteo({});
    await cargar();
  };

  return (
    <Card className="rounded-[2rem] border shadow-lg" data-testid="cierre-de-barra">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-xl font-black"><ClipboardCheck className="h-5 w-5 text-primary" /> Cierre de barra</CardTitle>
          <CardDescription>
            Al cerrar, contá las botellas que quedan. La app compara con lo que descontaron los pedidos y te dice qué salió sin registrarse.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void cargar()} disabled={cargando}><RefreshCw className="mr-1 h-4 w-4" /> Actualizar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {cargando ? (
          <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Cargando botellas…</p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>
        ) : filas.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Los tragos de esta fiesta no tienen botellas del depósito con stock cargado. Cargá la receta de cada trago con sus insumos para poder cerrar la barra.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-2">Botella</th>
                    <th className="py-2 text-right">Pedidos</th>
                    <th className="py-2 text-right">Según el sistema</th>
                    <th className="py-2 text-right">Contado</th>
                    <th className="py-2 text-right">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {comparadas.map((fila) => (
                    <tr key={fila.insumoId} className="border-t border-slate-100">
                      <td className="py-2 font-semibold text-slate-700">{fila.nombre} <span className="text-slate-400">{fila.unidad}</span></td>
                      <td className="py-2 text-right text-slate-500">{fila.consumidoPorPedidos}</td>
                      <td className="py-2 text-right font-bold text-slate-800">{fila.enSistema}</td>
                      <td className="py-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          aria-label={`Cuánto quedó de ${fila.nombre}`}
                          className="ml-auto h-8 w-24 text-right"
                          value={conteo[fila.insumoId] ?? ''}
                          onChange={(e) => setConteo((actual) => ({ ...actual, [fila.insumoId]: e.target.value }))}
                        />
                      </td>
                      <td className={`py-2 text-right font-black ${(fila.diferencia ?? 0) > 0 ? 'text-red-600' : (fila.diferencia ?? 0) < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {fila.diferencia === undefined ? '—' : fila.diferencia > 0 ? `faltan ${fila.diferencia}` : fila.diferencia < 0 ? `sobran ${-fila.diferencia}` : 'justo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {faltantes.length > 0 && (
              <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900" data-testid="cierre-faltantes">
                Salieron sin registrarse: {faltantes.map((f) => `${f.diferencia} ${f.unidad} de ${f.nombre}`).join(', ')}.
              </p>
            )}

            <label className="flex items-center justify-between gap-3 rounded-2xl border bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              Dejar el depósito en lo que conté
              <Switch checked={ajustar} onCheckedChange={setAjustar} />
            </label>

            <Button className="w-full rounded-2xl font-black" onClick={() => void guardar()} disabled={guardando}>
              {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
              Guardar cierre
            </Button>
          </>
        )}

        {ultimo && (
          <p className="text-xs text-slate-500">
            Último cierre: {new Date(ultimo.at).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })}
            {ultimo.depositoAjustado ? ', con el depósito ajustado.' : ', sin tocar el depósito.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
