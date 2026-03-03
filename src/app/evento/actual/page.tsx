
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
import { CheckCircle, PartyPopper, Download, Ticket } from 'lucide-react';
import QRCodeStylized from 'qrcode.react';

function EventoPublicoPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError("No se pudo cargar la información del evento.");
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

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-invitado') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR-Entrada-${confirmedGuest?.nombre}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const renderTemplate = () => {
    if(!fiesta) return null;

    const props = {
      fiesta,
      invitacionData,
      socialConnections,
      isPreview: false,
      onRsvpSubmit,
      onSectionClick: () => {}, 
      onUpdate: () => {}, 
      selectedSectionId: null,
    };

    switch(invitacionData.plantilla) {
      case 'Grazia':
        return <GraziaTemplate {...props} />;
      case 'Allegria':
         return <AllegriaTemplate {...props} />;
      default:
        return <GraziaTemplate {...props} />;
    }
  }

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-white"><Loader2 className="w-16 h-16 animate-spin text-primary" /><p className="text-xl font-headline mt-6 tracking-widest text-primary animate-pulse uppercase">Preparando tu invitación...</p></div>;
  }

  if (error || !fiesta) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center p-6"><AlertTriangle className="w-12 h-12 text-destructive mb-4"/><p className="text-xl font-headline">{error || "No se pudo encontrar el evento."}</p></div>;
  }
  
  if (rsvpSuccess && confirmedGuest) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const qrValue = `${baseUrl}/evento/actual/checkin?fiestaId=${fiesta.id}&guestId=${confirmedGuest.id}`;
    return (
       <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-3xl border-none rounded-[3rem] overflow-hidden animate-in fade-in zoom-in duration-700">
          <CardHeader className="text-center pb-4 pt-12">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}>
                <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
            </motion.div>
            <CardTitle className="text-4xl font-headline text-slate-900 mb-2">
              ¡Te esperamos!
            </CardTitle>
            <CardDescription className="text-lg">Gracias por confirmar, {confirmedGuest.nombre}.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-8 py-8 px-10">
             <div className="p-8 bg-white rounded-[2rem] shadow-inner border border-slate-100 inline-block">
                <QRCodeStylized id="qr-code-invitado" value={qrValue} size={200} level="H" />
             </div>
             <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Tu pase digital</p>
                <p className="text-xl font-bold flex items-center justify-center gap-3 text-slate-800">
                    <Ticket className="w-6 h-6 text-primary"/>
                    {confirmedGuest.partySize || 1} PERSONA(S)
                </p>
             </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 pb-12 px-10">
             <Button onClick={downloadQR} size="lg" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                <Download className="w-5 h-5 mr-3"/>GUARDAR EN GALERÍA
            </Button>
            <p className="text-xs text-slate-400 text-center uppercase tracking-widest leading-loose">Presenta este código en la entrada<br/>del evento para tu ingreso.</p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return renderTemplate();
}

export default function EventoPublicoPage() {
    return (
        <Suspense fallback={null}>
            <EventoPublicoPageContent />
        </Suspense>
    )
}
