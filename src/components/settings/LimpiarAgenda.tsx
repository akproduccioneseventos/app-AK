'use client';

import { useState } from 'react';
import { AlertTriangle, CalendarCheck, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { limpiarAgendaDeAK, revisarAgendaDeAK, type EventoSobrante } from '@/app/actions/google-workspace';

/**
 * Dejar la agenda limpia, con un toque.
 *
 * La app habia duplicado eventos y dejado fechas viejas en el calendario del
 * dueno. Las causas ya estan arregladas; esto limpia lo que quedo sucio.
 *
 * Primero muestra que sobra y por que. Borrar es una segunda decision, suya.
 * Nunca toca un evento personal: solo los que puso la app.
 */
export function LimpiarAgenda() {
  const { toast } = useToast();
  const [revisando, setRevisando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [sobrantes, setSobrantes] = useState<EventoSobrante[] | null>(null);
  const [revisados, setRevisados] = useState(0);

  const revisar = async () => {
    setRevisando(true);
    try {
      const resultado = await revisarAgendaDeAK();
      if (!resultado.ok) {
        toast({ variant: 'destructive', title: 'No se pudo mirar la agenda', description: resultado.error });
        return;
      }
      setSobrantes(resultado.sobrantes);
      setRevisados(resultado.revisados);
    } finally {
      setRevisando(false);
    }
  };

  const limpiar = async () => {
    if (!sobrantes || sobrantes.length === 0) return;
    setBorrando(true);
    try {
      const resultado = await limpiarAgendaDeAK(sobrantes.map((s) => s.id));
      if (!resultado.ok) {
        toast({ variant: 'destructive', title: 'No se pudo limpiar', description: resultado.error });
        return;
      }
      toast({
        title: 'Agenda limpia',
        description: `Se sacaron ${resultado.borrados} eventos que sobraban.`,
      });
      await revisar();
    } finally {
      setBorrando(false);
    }
  };

  return (
    <Card data-testid="limpiar-agenda">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarCheck className="h-4 w-4" /> Revisar mi agenda de Google
        </CardTitle>
        <CardDescription>
          Busca eventos repetidos y fiestas que quedaron en una fecha vieja. Solo mira los que puso
          la app: tus eventos personales no se tocan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={revisar} disabled={revisando || borrando}>
          {revisando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {revisando ? 'Mirando tu agenda...' : 'Revisar mi agenda'}
        </Button>

        {sobrantes !== null && sobrantes.length === 0 && (
          <p className="text-sm text-emerald-700">
            Tu agenda esta limpia. Se miraron {revisados} eventos puestos por la app y no sobra ninguno.
          </p>
        )}

        {sobrantes !== null && sobrantes.length > 0 && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Sobran {sobrantes.length} de los {revisados} eventos que puso la app.
            </p>
            <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
              {sobrantes.map((evento) => (
                <li key={evento.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold text-slate-800">{evento.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {evento.cuando ? evento.cuando.substring(0, 10) : 'sin fecha'} - {evento.explicacion}
                  </p>
                </li>
              ))}
            </ul>
            <Button variant="destructive" onClick={limpiar} disabled={borrando}>
              {borrando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {borrando ? 'Sacandolos...' : `Sacar los ${sobrantes.length} que sobran`}
            </Button>
            <p className="text-xs text-slate-500">
              De cada fiesta siempre queda uno: el que esta en la fecha correcta.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
