
'use client';

import { Suspense, useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, Ticket } from 'lucide-react';
import type { Invitado } from '@/types/invitado';
import { checkInGuestFiestaActual } from '@/app/actions/fiesta-actual';
import { getFiestaById } from '@/app/actions/fiesta-actual';

/**
 * Convierte una falla tecnica en algo que el invitado pueda entender.
 *
 * Con el WiFi del salon saturado, la pantalla llegaba a mostrar "Failed to
 * fetch" en ingles. El invitado no sabe que hacer con eso; con "revisa tu
 * conexion" sabe que tiene que moverse o esperar.
 */
function mensajeParaElInvitado(error: unknown, porDefecto: string) {
  const texto = error instanceof Error ? error.message : String(error ?? '');
  const esDeRed = /failed to fetch|network|load failed|fetch failed|timeout|abort/i.test(texto);
  if (esDeRed || !texto.trim()) {
    return 'No pudimos cargar los datos. Revisá tu conexión y probá de nuevo en unos segundos.';
  }
  return texto.length > 120 ? porDefecto : texto;
}

function CheckInContent() {
  const searchParams = useSearchParams();
  const guestId = searchParams.get('guestId');
  const fiestaId = searchParams.get('fiestaId');

  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wasAlreadyCheckedIn, setWasAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    async function performCheckIn() {
      if (!guestId || !fiestaId) {
        setError("Faltan datos para el check-in (ID de fiesta o invitado).");
        setIsLoading(false);
        return;
      }
      try {
        // Antes se comparaba contra "la fiesta actual", que es la de fecha mas
        // proxima entre TODAS las cargadas. Con una fiesta agendada mas adelante,
        // esa era la "actual" y todos los QR de la fiesta de esta noche se
        // rechazaban en la puerta. Ahora se busca la fiesta del QR.
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) {
          throw new Error("No encontramos la fiesta de este QR.");
        }

        const invitadoOriginal = fiesta.invitados?.find(i => i.id === guestId);
        
        if (invitadoOriginal?.checkedIn) {
             setWasAlreadyCheckedIn(true);
             setInvitado(invitadoOriginal);
        } else {
            const result = await checkInGuestFiestaActual(fiestaId, guestId);
            if (result.success && result.invitado) {
                setInvitado(result.invitado);
            } else {
                throw new Error(result.error || "Error al registrar la entrada.");
            }
        }
      } catch (err: any) {
        setError(mensajeParaElInvitado(err, 'No se pudo registrar la entrada.'));
      } finally {
        setIsLoading(false);
      }
    }
    performCheckIn();
  }, [guestId, fiestaId]);

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" /><p className="mt-4 text-lg">Registrando entrada...</p></div>;
  }
  if (error) {
    return <Card className="w-full max-w-md shadow-lg bg-destructive/10"><CardHeader className="text-center"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" /><CardTitle className="text-xl font-semibold text-destructive">Error en Check-in</CardTitle></CardHeader><CardContent className="text-center space-y-4 py-6"><p className="text-muted-foreground">{error}</p><p className="text-sm text-muted-foreground">Mostrale esta pantalla a alguien del equipo de AK y te hacemos la entrada a mano. No pierdas tu lugar en la fila.</p>{/* Una pantalla de error SIN SALIDA deja al invitado parado en la puerta sin saber que hacer. */}<a href={fiestaId ? `/evento/hub/${fiestaId}` : '/'} className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:opacity-90">Ir a la fiesta</a></CardContent></Card>;
  }
  if (!invitado) return null;

  return (
    <Card className="w-full max-w-md shadow-2xl border-t-4 border-green-500">
      <CardHeader className="text-center pb-4">
        <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
        <CardTitle className="text-3xl font-bold font-headline text-green-600">
          {wasAlreadyCheckedIn ? "Ya Registrado" : "¡Check-in Exitoso!"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-2 pb-8">
        <p className="text-2xl font-semibold">{invitado.nombre}</p>
        <p className="text-muted-foreground">({invitado.partySize || 1} persona/s)</p>
        {invitado.tableNumber && (
          <div className="pt-4 flex items-center justify-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            <p className="text-xl">Mesa: <span className="font-bold text-2xl">{invitado.tableNumber}</span></p>
          </div>
        )}
        {wasAlreadyCheckedIn && invitado.checkInTimestamp && (
          <p className="text-sm text-yellow-600 pt-2">(Registrado el: {new Date(invitado.checkInTimestamp).toLocaleString('es-ES')})</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function CheckInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-center p-8"><Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" /></div>}>
        <CheckInContent />
      </Suspense>
    </div>
  );
}
