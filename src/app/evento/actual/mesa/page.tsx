
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Home, User, Ticket, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import type { FiestaEnPlanificacion, Invitado } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';


function MesaLookupContent() {
  const searchParams = useSearchParams();
  const guestId = searchParams.get('guestId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!guestId) {
        setError("No se proporcionó ID de invitado.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fiestaData = await getFiestaActual();
        setFiesta(fiestaData);
        const foundInvitado = fiestaData.invitados?.find(inv => inv.id === guestId);
        
        if (foundInvitado) {
          setInvitado(foundInvitado);
        } else {
          setError("Invitación no encontrada. Por favor, verifica el código QR o contacta al organizador.");
        }
      } catch (err: any) {
        setError("Error al cargar la información del evento. Intenta de nuevo más tarde.");
        console.error("Error fetching data for table lookup:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [guestId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Buscando tu mesa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-destructive/10">
          <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" />
          <CardTitle className="text-xl font-semibold text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 py-6">
          <p className="text-muted-foreground">{error}</p>
          <Link href={`/evento/actual`} passHref>
            <Button variant="outline">Volver a la Página del Evento</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!invitado || !fiesta) {
    return (
       <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold">Información No Disponible</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 py-6">
          <p className="text-muted-foreground">No se pudo cargar la información necesaria.</p>
        </CardContent>
      </Card>
    );
  }
  
  const pagePrimaryColor = fiesta.decoracion?.paletaColores?.primary || 'hsl(var(--primary))';


  return (
    <Card className="w-full max-w-md shadow-xl border-t-4" style={{ borderColor: pagePrimaryColor }}>
      <CardHeader className="text-center pb-4">
         <PartyPopper className="w-12 h-12 mx-auto mb-3" style={{ color: pagePrimaryColor }} />
        <CardTitle className="text-2xl font-bold font-headline" style={{ color: pagePrimaryColor }}>
          {fiesta.configuracion.nombreEvento}
        </CardTitle>
        <CardDescription className="text-md">¡Bienvenido/a, {invitado.nombre}!</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-6 py-8">
        {invitado.tableNumber ? (
          <>
            <p className="text-lg text-muted-foreground">Tu mesa asignada es la número:</p>
            <div 
                className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full border-4 text-4xl md:text-5xl font-bold shadow-inner"
                style={{ borderColor: pagePrimaryColor, color: pagePrimaryColor, backgroundColor: `${pagePrimaryColor}1A` }}
            >
              {invitado.tableNumber}
            </div>
            <p className="text-sm text-muted-foreground pt-2">¡Disfruta de la fiesta!</p>
          </>
        ) : (
          <>
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground/70 mb-2" />
            <p className="text-lg font-medium">Tu mesa aún no ha sido asignada.</p>
            <p className="text-muted-foreground">Por favor, consulta con el personal del evento al llegar o revisa esta pantalla más tarde.</p>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center py-4">
         <Link href={`/evento/actual`} passHref>
            <Button variant="outline" size="sm">Volver a la Página del Evento</Button>
          </Link>
      </CardFooter>
    </Card>
  );
}


export default function MesaPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex flex-col items-center justify-center p-4">
            <Suspense fallback={
                 <div className="flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Cargando...</p>
                </div>
            }>
                <MesaLookupContent />
            </Suspense>
        </div>
    );
}
    
