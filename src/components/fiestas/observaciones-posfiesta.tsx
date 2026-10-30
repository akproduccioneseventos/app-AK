'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMisPermisos } from '@/app/actions/sesion';
import { PERMISOS } from '@/lib/auth/perfiles';
import { obtenerObservacionesFiestaPosfiesta, obtenerSugerenciasPosfiesta, guardarObservacionesPosfiesta } from '@/app/actions/fiesta/observaciones-posfiesta.actions';
import type { CategoriaObservacionPosfiesta, EntradaObservacionPosfiesta, ObservacionPosfiesta, SugerenciaPosfiesta } from '@/lib/fiesta/sugerencias-posfiesta';

const nuevaEntrada = (): EntradaObservacionPosfiesta => ({ categoria: 'comida', tipo: undefined, elemento: '', cantidad: undefined, unidad: '' });

export function ObservacionesPosfiesta({ fiestaId, editable = false }: {
  fiestaId: string;
  editable?: boolean;
}) {
  const idFormulario = useId();
  const [observaciones, setObservaciones] = useState<ObservacionPosfiesta[]>([]);
  const [sugerencias, setSugerencias] = useState<SugerenciaPosfiesta[]>([]);
  const [entradas, setEntradas] = useState<EntradaObservacionPosfiesta[]>([nuevaEntrada()]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [puedeEditar, setPuedeEditar] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerObservacionesFiestaPosfiesta(fiestaId), obtenerSugerenciasPosfiesta(fiestaId), getMisPermisos()]).then(([propias, historicas, acceso]) => {
      const editar = acceso.permisos.includes(PERMISOS.ADMINISTRACION) || acceso.permisos.includes(PERMISOS.ORGANIZACION);
      if (activo) { setObservaciones(propias); setSugerencias(historicas); setPuedeEditar(editar); }
    }).catch((e) => {
      if (activo) setError(e instanceof Error ? e.message : 'No se pudieron leer las observaciones guardadas.');
    });
    return () => { activo = false; };
  }, [fiestaId]);

  const actualizar = (indice: number, cambio: Partial<EntradaObservacionPosfiesta>) => setEntradas((actuales) => actuales.map((item, i) => i === indice ? { ...item, ...cambio } : item));

  async function guardar() {
    setGuardando(true);
    setError('');
    try {
      const respuesta = await guardarObservacionesPosfiesta(fiestaId, entradas);
      if (!respuesta.success) {
        setError('No se confirmo el guardado. Los datos siguen en el formulario para reintentar.');
        return;
      }
      setObservaciones((previas) => [...previas.filter((item) => !respuesta.observaciones.some((nuevo) => nuevo.id === item.id)), ...respuesta.observaciones]);
      setEntradas([nuevaEntrada()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las observaciones.');
    } finally {
      setGuardando(false);
    }
  }

  return <Card>
    <CardHeader>
      <CardTitle>{editable ? 'Hechos observados después de la fiesta' : 'Referencias de fiestas anteriores'}</CardTitle>
      <CardDescription>{editable ? 'Anotá solo sobrantes o faltantes comprobados. Sin dato no significa cero.' : 'Referencias históricas; requieren revisión y no alteran compras ni asignaciones.'}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {editable && puedeEditar && <div className="space-y-3">{entradas.map((entrada, indice) => <div key={indice} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1"><Label htmlFor={`${idFormulario}-${indice}-categoria`}>Categoría</Label><Select value={entrada.categoria} onValueChange={(v) => actualizar(indice, { categoria: v as CategoriaObservacionPosfiesta })}><SelectTrigger id={`${idFormulario}-${indice}-categoria`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="comida">Comida</SelectItem><SelectItem value="bebida">Bebida</SelectItem><SelectItem value="personal">Personal</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label htmlFor={`${idFormulario}-${indice}-tipo`}>Observación</Label><Select value={entrada.tipo || ''} onValueChange={(v) => actualizar(indice, { tipo: v as 'sobro' | 'falto' })}><SelectTrigger id={`${idFormulario}-${indice}-tipo`}><SelectValue placeholder="Elegir" /></SelectTrigger><SelectContent><SelectItem value="sobro">Sobró</SelectItem><SelectItem value="falto">Faltó</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label htmlFor={`${idFormulario}-${indice}-elemento`}>Artículo o rol</Label><Input id={`${idFormulario}-${indice}-elemento`} maxLength={80} value={entrada.elemento} onChange={(e) => actualizar(indice, { elemento: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor={`${idFormulario}-${indice}-cantidad`}>Cantidad observada</Label><Input id={`${idFormulario}-${indice}-cantidad`} type="number" min={0.01} max={100000} step={entrada.categoria === 'personal' ? 1 : 0.01} value={entrada.cantidad ?? ''} onChange={(e) => actualizar(indice, { cantidad: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div className="space-y-1"><Label htmlFor={`${idFormulario}-${indice}-unidad`}>Unidad</Label><Input id={`${idFormulario}-${indice}-unidad`} maxLength={24} value={entrada.unidad || ''} onChange={(e) => actualizar(indice, { unidad: e.target.value })} /></div>
      </div>)}<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={entradas.length >= 30} onClick={() => setEntradas((previas) => [...previas, nuevaEntrada()])}>Agregar observación</Button><Button type="button" disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar hechos'}</Button></div></div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {editable && <section aria-label="Hechos guardados en esta fiesta" className="space-y-2"><h3 className="text-sm font-semibold">Hechos guardados en esta fiesta</h3>{observaciones.length ? <ul className="space-y-1 text-sm">{observaciones.map((item) => <li key={item.id}>{item.tipo === 'sobro' ? 'Sobró' : 'Faltó'} {item.cantidad} {item.unidad} de {item.elemento} ({item.categoria}); registrado {new Date(item.actualizadoEn).toLocaleString('es-UY')}.</li>)}</ul> : <p className="text-sm text-muted-foreground">Todavía no hay hechos registrados para esta fiesta.</p>}</section>}
      {sugerencias.length ? <section aria-label="Sugerencias basadas en fiestas anteriores" className="space-y-2"><h3 className="text-sm font-semibold">Referencias históricas (máximo 5, más cercanas por cantidad de invitados)</h3><ul className="space-y-2 text-sm">{sugerencias.map((item) => <li key={item.id} className="border-l-2 pl-3"><strong>{item.tipo === 'sobro' ? 'Sobró' : 'Faltó'} {item.cantidad} {item.unidad} de {item.elemento}</strong> ({item.categoria}). {item.procedencia}; {item.baseInvitados === 'observados' ? 'asistencia observada' : 'cantidad estimada'}: {item.invitadosReferencia} personas. Fiesta actual: {item.invitadosActuales} {item.baseInvitadosActuales === 'observados' ? 'observadas' : 'estimadas'}; diferencia: {item.diferenciaInvitados > 0 ? '+' : ''}{item.diferenciaInvitados}. <span className="font-medium">Revisar; no modifica cantidades ni asignaciones.</span></li>)}</ul></section> : <p className="text-sm text-muted-foreground">No hay referencias históricas comparables disponibles; no se infieren sobrantes ni faltantes.</p>}
    </CardContent>
  </Card>;
}
