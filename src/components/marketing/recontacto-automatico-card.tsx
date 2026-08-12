'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  getRecontactoAutomaticoActivo,
  setRecontactoAutomaticoActivo,
} from '@/app/actions/marketing-automation';

/**
 * El interruptor del mensaje automático al que pidió presupuesto y no señó.
 *
 * Viene apagado y se explica en criollo qué hace exactamente antes de prenderlo:
 * son mensajes de WhatsApp a clientes reales y no se pueden deshacer.
 */
export function RecontactoAutomaticoCard() {
  const { toast } = useToast();
  const [activo, setActivo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    getRecontactoAutomaticoActivo()
      .then((valor) => {
        if (vigente) setActivo(valor);
      })
      .catch(() => undefined)
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const cambiar = async (nuevo: boolean) => {
    setGuardando(true);
    const anterior = activo;
    setActivo(nuevo);
    try {
      const resultado = await setRecontactoAutomaticoActivo(nuevo);
      if (!resultado.success) {
        setActivo(anterior);
        toast({
          variant: 'destructive',
          title: 'No se pudo cambiar',
          description: resultado.error || 'Probá de nuevo en un momento.',
        });
        return;
      }
      toast({
        title: nuevo ? 'Recontacto prendido' : 'Recontacto apagado',
        description: nuevo
          ? 'A partir de ahora se le escribe una vez a cada consulta que no señó.'
          : 'No se va a enviar ningún mensaje automático.',
      });
    } catch {
      setActivo(anterior);
      toast({
        variant: 'destructive',
        title: 'No se pudo cambiar',
        description: 'Revisá la conexión y probá de nuevo.',
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm md:grid-cols-[1fr_auto] md:items-center">
      <div className="space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-950">
          <MessageCircle className="h-4 w-4 text-emerald-600" />
          Volver a escribirle al que no señó
        </div>
        <p className="text-xs text-emerald-900/80">
          Cuando alguien pide un presupuesto y a los dos días no señó, la aplicación le
          manda <strong>un</strong> mensaje de WhatsApp preguntándole si le quedó alguna
          duda. Se le escribe una sola vez en la vida, y sólo si dejó su permiso para
          recibir mensajes.
        </p>
        <p className="text-xs text-emerald-900/70">
          Nunca se le escribe a quien ya contrató, ni a quien vos marcaste como
          perdido. Si lo apagás, deja de mandar en el acto.
        </p>
      </div>
      <div className="flex items-center gap-3 justify-self-start md:justify-self-end">
        <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
          {cargando ? 'Cargando' : activo ? 'Prendido' : 'Apagado'}
        </span>
        {cargando || guardando ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        ) : (
          <Switch
            checked={activo}
            onCheckedChange={cambiar}
            aria-label="Volver a escribirle al que no señó"
          />
        )}
      </div>
    </div>
  );
}
