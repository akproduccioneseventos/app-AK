'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getGastoDeIA, setTopeDeIA, setTopeDiarioDeIA } from '@/app/actions/ai-consumo';
import { COSTO_ESTIMADO_UYU, type FuncionConCosto, type ResumenDeGasto } from '@/lib/ai/consumo';

/**
 * Cuánto va gastado del mes en los efectos de las fotos, y el tope.
 *
 * Los topes por invitado frenan el abuso de una persona; esto es lo otro: saber
 * cuánto se lleva consumido antes de que llegue la factura.
 */

const COLORES: Record<ResumenDeGasto['estado'], string> = {
  'sin-tope': 'border-slate-200 bg-slate-50/70 text-slate-900',
  tranquilo: 'border-emerald-100 bg-emerald-50/60 text-emerald-950',
  'cerca-del-tope': 'border-amber-200 bg-amber-50/70 text-amber-950',
  pasado: 'border-rose-200 bg-rose-50/70 text-rose-950',
};

const BARRA: Record<ResumenDeGasto['estado'], string> = {
  'sin-tope': 'bg-slate-400',
  tranquilo: 'bg-emerald-500',
  'cerca-del-tope': 'bg-amber-500',
  pasado: 'bg-rose-500',
};

const NOMBRES_FUNCION: Record<FuncionConCosto, string> = {
  touchpix: 'Fotocabina Touchpix',
  'espejo-magico': 'Espejo mágico',
  'foto-del-salon': 'Visualización del salón',
  remarketing: 'Remarketing',
  'vendedor-virtual': 'Vendedor virtual',
  'seguimiento-comercial': 'Seguimiento comercial',
  'material-post-evento': 'Material post-evento',
  'revision-diaria': 'Revisión diaria',
  'clasificacion-comentarios': 'Comentarios en redes',
  'copiloto-presupuesto': 'Copiloto de presupuesto',
  'chat-de-la-fiesta': 'Chat de la fiesta',
  'encargado-general': 'Encargado general',
  'nota-del-blog': 'Notas del blog',
  multiagente: 'Asistente multiagente',
  'armar-web-evento': 'Web del evento',
  'lectura-recibo': 'Lectura de comprobantes',
  'resumen-feedback': 'Resumen de encuestas',
  'sugerir-paleta': 'Paleta de colores',
  'catalogo-decoracion': 'Catálogo de decoración',
  'extraccion-prospecto-whatsapp': 'Datos desde WhatsApp',
  'trivia-ia': 'Trivia con IA',
  'voz-cliente': 'Voz con clientes',
  'voz-equipo': 'Voz con el equipo',
  'whatsapp-media': 'Audios e imágenes de WhatsApp',
  'asistente-dot-contador': 'Asistente contable',
  'recorte-decoracion': 'Recorte de decoración',
  'respuesta-profunda': 'Respuestas profundas',
  decisiones: 'Decisiones rápidas',
  papeleria: 'Papelería del evento',
  sofia: 'Sofía (simulador)',
  cerebro: 'Consultas generales',
};

export function GastoIaCard({ initialResumen = null }: { initialResumen?: ResumenDeGasto | null }) {
  const { toast } = useToast();
  const [resumen, setResumen] = useState<ResumenDeGasto | null>(initialResumen);
  const [topeInput, setTopeInput] = useState(
    initialResumen && initialResumen.topeUYU > 0 ? String(initialResumen.topeUYU) : '',
  );
  const [guardando, setGuardando] = useState(false);
  const [topeDiarioInput, setTopeDiarioInput] = useState(
    initialResumen ? String(initialResumen.topeDiarioProfundo ?? 40) : '',
  );
  const [guardandoDiario, setGuardandoDiario] = useState(false);

  useEffect(() => {
    if (initialResumen) return;
    let vigente = true;
    getGastoDeIA()
      .then((valor) => {
        if (!vigente) return;
        setResumen(valor);
        setTopeInput(valor.topeUYU > 0 ? String(valor.topeUYU) : '');
        setTopeDiarioInput(String(valor.topeDiarioProfundo ?? 40));
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [initialResumen]);

  const guardarTope = async () => {
    const limpio = topeInput.trim();
    const valor = limpio === '' ? 0 : Number(limpio);
    if (!Number.isFinite(valor) || valor < 0) {
      toast({
        variant: 'destructive',
        title: 'Ese número no sirve',
        description: 'Poné cuántos pesos como máximo, o dejalo vacío para no poner tope.',
      });
      return;
    }

    setGuardando(true);
    try {
      const resultado = await setTopeDeIA(valor);
      if (!resultado.success || !resultado.resumen) {
        toast({
          variant: 'destructive',
          title: 'No se pudo guardar',
          description: resultado.error || 'Probá de nuevo en un momento.',
        });
        return;
      }
      setResumen(resultado.resumen);
      toast({
        title: valor > 0 ? 'Tope guardado' : 'Tope sacado',
        description:
          valor > 0
            ? `Cuando el mes llegue a $${valor}, los efectos de las fotos se apagan solos.`
            : 'No hay tope: se gasta lo que haga falta.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar',
        description: 'Revisá la conexión y probá de nuevo.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const guardarTopeDiario = async () => {
    const limpio = topeDiarioInput.trim();
    const valor = limpio === '' ? 40 : Number(limpio);
    if (!Number.isFinite(valor) || valor < 0) {
      toast({
        variant: 'destructive',
        title: 'Ese número no sirve',
        description: 'Poné cuántas respuestas inteligentes por día como máximo.',
      });
      return;
    }

    setGuardandoDiario(true);
    try {
      const resultado = await setTopeDiarioDeIA(valor);
      if (!resultado.success || !resultado.resumen) {
        toast({
          variant: 'destructive',
          title: 'No se pudo guardar',
          description: resultado.error || 'Probá de nuevo en un momento.',
        });
        return;
      }
      setResumen(resultado.resumen);
      toast({
        title: 'Tope diario guardado',
        description: `Se permiten hasta ${valor} respuestas inteligentes por día.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar',
        description: 'Revisá la conexión y probá de nuevo.',
      });
    } finally {
      setGuardandoDiario(false);
    }
  };

  if (!resumen) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando el gasto del mes…
      </div>
    );
  }

  const ancho = resumen.topeUYU > 0 ? Math.min(100, resumen.porcentaje) : 0;
  const desglosePorFuncion = Object.entries(resumen.porFuncion ?? {})
    .map(([funcion, cantidad]) => {
      const usos = Number(cantidad) || 0;
      const costoUnitario = COSTO_ESTIMADO_UYU[funcion as FuncionConCosto] ?? 0;
      const subtotalUYU = Math.round(usos * costoUnitario);
      return {
        funcion,
        nombre: NOMBRES_FUNCION[funcion as FuncionConCosto] || funcion,
        usos,
        subtotalUYU,
      };
    })
    .filter((item) => item.usos > 0)
    .sort((a, b) => b.subtotalUYU - a.subtotalUYU || b.usos - a.usos);

  return (
    <div className={`space-y-4 rounded-2xl border p-4 text-sm ${COLORES[resumen.estado]}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-bold">
          <Sparkles className="h-4 w-4 shrink-0" />
          Gasto del mes en inteligencia artificial
        </div>
        <p className="text-xs opacity-90">{resumen.mensaje}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-wider">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          {resumen.generaciones} usos este mes
        </span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          ${resumen.gastadoUYU} estimados
        </span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">
          Respuestas inteligentes hoy: {resumen.respuestasProfundasHoy ?? 0} de {resumen.topeDiarioProfundo ?? 40}
        </span>
      </div>

      {resumen.topeUYU > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
          <div
            className={`h-full rounded-full transition-all ${BARRA[resumen.estado]}`}
            style={{ width: `${ancho}%` }}
          />
        </div>
      )}

      {/* Desglose por función */}
      <div className="space-y-2 rounded-xl border border-black/5 bg-white/75 p-3">
        <p className="text-xs font-bold text-slate-800">Desglose por función este mes</p>
        {desglosePorFuncion.length === 0 ? (
          <p className="text-xs text-slate-500">Todavía no se registró consumo por función este mes.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {desglosePorFuncion.map((item) => (
              <div key={item.funcion} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800">{item.nombre}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-400">({item.funcion})</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-slate-500">{item.usos} {item.usos === 1 ? 'uso' : 'usos'}</span>
                  <span className="font-bold text-slate-900">${item.subtotalUYU}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="tope-ia" className="text-xs font-semibold">
            Tope del mes, en pesos
          </Label>
          <Input
            id="tope-ia"
            inputMode="numeric"
            placeholder="Sin tope"
            value={topeInput}
            onChange={(e) => setTopeInput(e.target.value)}
            className="h-9 w-40 bg-white"
          />
        </div>
        <Button
          onClick={guardarTope}
          disabled={guardando}
          className="h-9 rounded-xl font-bold"
          variant="outline"
        >
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar tope'}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-black/5">
        <div className="space-y-1">
          <Label htmlFor="tope-diario-ia" className="text-xs font-semibold">
            Tope diario respuestas inteligentes
          </Label>
          <Input
            id="tope-diario-ia"
            inputMode="numeric"
            placeholder="40"
            value={topeDiarioInput}
            onChange={(e) => setTopeDiarioInput(e.target.value)}
            className="h-9 w-40 bg-white"
          />
        </div>
        <Button
          onClick={guardarTopeDiario}
          disabled={guardandoDiario}
          className="h-9 rounded-xl font-bold"
          variant="outline"
        >
          {guardandoDiario ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar tope diario'}
        </Button>
      </div>

      <p className="text-xs opacity-80">
        Al llegar al tope, la fotocabina y el espejo <strong>siguen andando</strong>: sacan
        la foto igual, con un efecto simple, sin gastar. Dejalo vacío si no querés tope.
      </p>
    </div>
  );
}
