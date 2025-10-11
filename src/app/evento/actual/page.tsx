
'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, InvitacionDigitalData, SocialConnection, Invitado } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getSocialConnections } from '@/app/actions/social-connections';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { merge, cloneDeep } from 'lodash';
import { GraziaTemplate } from '@/components/invitacion/templates/GraziaTemplate';
import { AllegriaTemplate } from '@/components/invitacion/templates/AllegriaTemplate';
import { handleRsvpSubmission } from '@/app/actions/fiesta/invitados.actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, PartyPopper } from 'lucide-react';

function EventoPublicoPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New state for RSVP success
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [confirmedGuest, setConfirmedGuest] = useState<Invitado | null>(null);
  
  const loadEventData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se especificó un ID de evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [data, socialData] = await Promise.all([
          getFiestaById(fiestaId),
          getSocialConnections()
      ]);

      if (!data) throw new Error("Evento no encontrado.");
      
      setFiesta(data);
      const mergedInvitacionData = merge(cloneDeep(defaultInvitacionDigitalData), data.invitacionDigital || {});
      setInvitacionData(mergedInvitacionData);
      setSocialConnections(socialData);

    } catch (err: any) {
      console.error("Error loading event data for public page:", err);
      setError("No se pudo cargar la información del evento. Por favor, intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);
  
  const onRsvpSubmit = async (submission: {nombreCompleto: string, confirmacion: string, numeroAsistentes: number, mensaje: string, companionNames: string[]}): Promise<boolean> => {
    if(!fiestaId) return false;
    try {
      const result = await handleRsvpSubmission(fiestaId, submission);
      if(result.success && result.invitado) {
        setConfirmedGuest(result.invitado);
        setRsvpSuccess(true);
        return true;
      } else {
        throw new Error(result.error || "No se pudo enviar la confirmación.")
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      return false;
    }
  }

  const renderTemplate = () => {
    if(!fiesta) return null;

    const props = {
      fiesta,
      invitacionData,
      socialConnections,
      isPreview: false,
      onRsvpSubmit,
      onSectionClick: () => {}, // No-op for public view
      onUpdate: () => {}, // No-op for public view
      selectedSectionId: null,
    };

    switch(invitacionData.plantilla) {
      case 'Grazia':
        return <GraziaTemplate {...props} />;
      case 'Allegria':
         return <AllegriaTemplate {...props} />;
      default:
        return <GraziaTemplate {...props} />; // Fallback
    }
  }

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="text-lg mt-4">Cargando detalles del evento...</p></div>;
  }

  if (error || !fiesta) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center"><p>{error || "No se pudo encontrar el evento."}</p></div>;
  }
  
  if (rsvpSuccess && confirmedGuest) {
    return (
       <div className="min-h-screen bg-gradient-to-br from-green-50 to-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-green-500 animate-in fade-in-50 zoom-in-95">
          <CardHeader className="text-center pb-4">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold font-headline text-green-600">
              ¡Confirmación Recibida!
            </CardTitle>
            <CardDescription className="text-md">¡Gracias por confirmar, {confirmedGuest.nombre}!</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4 py-8">
            <p className="text-lg text-muted-foreground">Pronto te asignaremos una mesa. ¡Nos vemos en la fiesta!</p>
          </CardContent>
          <CardFooter className="justify-center py-4">
            <p className="text-xs text-muted-foreground flex items-center gap-2"><PartyPopper className="w-4 h-4"/> ¡Te esperamos!</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return renderTemplate();
}


export default function EventoPublicoPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        }>
            <EventoPublicoPageContent />
        </Suspense>
    )
}
