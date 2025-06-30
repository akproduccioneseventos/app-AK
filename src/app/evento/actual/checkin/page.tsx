
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle, Ticket } from 'lucide-react';
import type { Invitado } from '@/types/invitado';
import { checkInGuest } from '@/app/actions/fiesta-actual';

function CheckInContent() {
  const searchParams = useSearchParams();
  const guestId = searchParams.get('guestId');

  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wasAlreadyCheckedIn, setWasAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    async function performCheckIn() {
      if (!guestId) {
        setError("No se proporcionó ID de invitado.");
        setIsLoading(false);
        return;
      }
      try {
        const result = await checkInGuest(guestId);
        if (result.success && result.invitado) {
          if (result.invitado.checkedIn && result.invitado.checkInTimestamp && new Date(result.invitado.checkInTimestamp).getTime() < Date.now() - 2000) {
            setWasAlreadyCheckedIn(true);
          }
          setInvitado(result.invitado);
        } else {
          throw new Error(result.error || "Error al registrar la entrada.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    performCheckIn();
  }, [guestId]);

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" /><p className="mt-4 text-lg">Registrando entrada...</p></div>;
  }
  if (error) {
    return <Card className="w-full max-w-md shadow-lg bg-destructive/10"><CardHeader className="text-center"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" /><CardTitle className="text-xl font-semibold text-destructive">Error en Check-in</CardTitle></CardHeader><CardContent className="text-center space-y-4 py-6"><p className="text-muted-foreground">{error}</p></CardContent></Card>;
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
