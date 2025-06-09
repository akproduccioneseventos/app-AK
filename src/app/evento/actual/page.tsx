
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NextImage from 'next/image';
import { Loader2, AlertTriangle, ImageOff, Send, PartyPopper, CalendarDays, MapPin, Mail, Users as UsersIcon, MessageSquare, CheckCircle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings, ColorPalette } from '@/types/fiesta';
import type { Invitado } from '@/types/invitado';
import { getFiestaActual, handleRsvpSubmission } from '@/app/actions/fiesta-actual';
import QRCodeStylized from 'qrcode.react';


const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha por confirmar";
  try {
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) return "Fecha inválida";
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  } catch (e) { return "Fecha inválida"; }
};

type RsvpFormData = {
  nombreCompleto: string;
  email: string;
  confirmacion: 'si' | 'no' | 'quizas' | '';
  numeroAsistentes: number;
  mensaje: string;
};

export default function EventoPublicoPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [webSettings, setWebSettings] = useState<EventWebPageSettings | null>(null);
  const [paletaColores, setPaletaColores] = useState<ColorPalette | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [rsvpForm, setRsvpForm] = useState<RsvpFormData>({
    nombreCompleto: '',
    email: '',
    confirmacion: '',
    numeroAsistentes: 1,
    mensaje: ''
  });
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSubmittedSuccessfully, setRsvpSubmittedSuccessfully] = useState(false);
  const [confirmedGuestDetails, setConfirmedGuestDetails] = useState<Invitado | null>(null);

  const loadEventData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFiestaActual();
      setFiesta(data);
      setWebSettings(data.webPageSettings || { pageTitle: data.configuracion.nombreEvento || 'Nuestro Evento', welcomeMessage: '¡Te esperamos!', galleryImageUrls: [] });
      setPaletaColores(data.decoracion?.paletaColores || null);
    } catch (err: any) {
      console.error("Error loading event data for public page:", err);
      setError("No se pudo cargar la información del evento. Por favor, intenta más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  const handleRsvpInputChange = (field: keyof RsvpFormData, value: string | number) => {
    setRsvpForm(prev => ({...prev, [field]: value}));
  };
  
  const handleRsvpConfirmacionChange = (value: RsvpFormData['confirmacion']) => {
    setRsvpForm(prev => ({
      ...prev, 
      confirmacion: value,
      numeroAsistentes: (value === 'si' || value === 'quizas') ? (prev.numeroAsistentes || 1) : 1,
    }));
  };

  const handleRsvpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.nombreCompleto.trim()) {
      toast({ title: "Nombre Requerido", description: "Por favor, ingresa tu nombre completo.", variant: "destructive" });
      return;
    }
    if (!rsvpForm.confirmacion) {
      toast({ title: "Confirmación Requerida", description: "Por favor, selecciona una opción de asistencia.", variant: "destructive" });
      return;
    }
    if ((rsvpForm.confirmacion === 'si' || rsvpForm.confirmacion === 'quizas') && rsvpForm.numeroAsistentes < 1) {
      toast({ title: "Número de Asistentes Inválido", description: "El número de asistentes debe ser al menos 1.", variant: "destructive" });
      return;
    }

    setIsSubmittingRsvp(true);
    
    try {
      const result = await handleRsvpSubmission({
        nombreCompleto: rsvpForm.nombreCompleto,
        email: rsvpForm.email,
        confirmacion: rsvpForm.confirmacion,
        numeroAsistentes: rsvpForm.numeroAsistentes,
        mensaje: rsvpForm.mensaje,
      });

      if (result.success && result.invitado) {
        if (result.invitado.rsvp === 'Confirmado') {
          setConfirmedGuestDetails(result.invitado);
          setRsvpSubmittedSuccessfully(true); // Hide form, show thank you and QR
        } else {
          toast({
            title: "¡Respuesta Recibida!",
            description: `Gracias ${rsvpForm.nombreCompleto}, hemos recibido tu respuesta.`,
            className: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 dark:border-blue-700"
          });
          setRsvpForm({ nombreCompleto: '', email: '', confirmacion: '', numeroAsistentes: 1, mensaje: '' }); // Reset form
        }
      } else {
        toast({ title: "Error en la Confirmación", description: result.error || "No se pudo procesar tu respuesta. Por favor, contacta al organizador.", variant: "destructive" });
      }
    } catch (err:any) {
        toast({ title: "Error", description: err.message || "Ocurrió un problema al enviar tu confirmación.", variant: "destructive" });
    } finally {
        setIsSubmittingRsvp(false);
    }
  };
  
  const getTableAssignmentUrl = (guestId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/evento/actual/mesa?guestId=${guestId}`;
    }
    return '';
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Cargando detalles del evento...</p>
      </div>
    );
  }

  if (error || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-6 text-center">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar el Evento</h2>
        <p>{error || "No se pudo encontrar la información del evento."}</p>
        <Button onClick={loadEventData} variant="destructive" className="mt-6">Intentar de Nuevo</Button>
      </div>
    );
  }
  
  const pagePrimaryColor = paletaColores?.primary || 'hsl(var(--primary))';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="py-8 text-center relative">
        {webSettings?.coverImageUrl && (
          <NextImage 
            src={webSettings.coverImageUrl} 
            alt="Portada del Evento" 
            layout="fill" 
            objectFit="cover" 
            className="absolute inset-0 z-0 opacity-30" 
            data-ai-hint="event cover background"
            priority
          />
        )}
        <div className="relative z-10 bg-background/80 backdrop-blur-sm inline-block p-6 rounded-lg shadow-lg">
            <PartyPopper className="w-16 h-16 mx-auto mb-4" style={{ color: pagePrimaryColor }} />
            <h1 className="text-4xl md:text-5xl font-bold font-headline" style={{ color: pagePrimaryColor }}>
            {webSettings?.pageTitle || fiesta.configuracion.nombreEvento}
            </h1>
            {fiesta.configuracion.tipoCelebracion && <p className="text-xl text-muted-foreground mt-1">{fiesta.configuracion.tipoCelebracion}</p>}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-10">
        <Card className="shadow-xl border-t-4" style={{ borderColor: pagePrimaryColor }}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl" style={{ color: pagePrimaryColor }}>
                ¡Estás Invitado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            {webSettings?.welcomeMessage && <p className="whitespace-pre-line">{webSettings.welcomeMessage}</p>}
            <div className="space-y-2 pt-2">
                <p className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-primary" /> <strong>Fecha y Hora:</strong> {formatDate(fiesta.configuracion.fechaEvento)}</p>
                {fiesta.configuracion.nombreLugar && <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> <strong>Lugar:</strong> {fiesta.configuracion.nombreLugar}</p>}
                {fiesta.configuracion.direccionLugar && <p className="text-xs text-muted-foreground ml-7">{fiesta.configuracion.direccionLugar}</p>}
            </div>
          </CardContent>
        </Card>

        {webSettings?.galleryImageUrls && webSettings.galleryImageUrls.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl" style={{ color: pagePrimaryColor }}>Galería</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {webSettings.galleryImageUrls.map((url, index) => (
                <div key={index} className="aspect-square relative rounded-md overflow-hidden border hover:opacity-90 transition-opacity">
                  <NextImage src={url} alt={`Galería ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="event photo gallery"/>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        <Card id="rsvp" className="shadow-xl border-t-4" style={{ borderColor: pagePrimaryColor }}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl" style={{ color: pagePrimaryColor }}>
                {rsvpSubmittedSuccessfully && confirmedGuestDetails ? `¡Gracias, ${confirmedGuestDetails.nombre}!` : 'Confirma tu Asistencia (RSVP)'}
            </CardTitle>
            <CardDescription>
                {rsvpSubmittedSuccessfully && confirmedGuestDetails ? 'Hemos recibido tu confirmación.' : 'Por favor, ayúdanos a organizar mejor el evento confirmando tu presencia.'}
            </CardDescription>
          </CardHeader>
          {rsvpSubmittedSuccessfully && confirmedGuestDetails ? (
            <CardContent className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <p className="text-lg">Tu asistencia para {confirmedGuestDetails.partySize} persona(s) ha sido registrada.</p>
                {confirmedGuestDetails.id && (
                    <div className="mt-6 space-y-3">
                        <p className="font-semibold">Tu código QR para el evento:</p>
                        <div className="flex justify-center p-4 bg-white rounded-md border shadow-inner">
                            <QRCodeStylized value={getTableAssignmentUrl(confirmedGuestDetails.id)} size={160} level="H" fgColor={pagePrimaryColor} />
                        </div>
                        <p className="text-sm text-muted-foreground">Escanea este código QR al llegar al salón para conocer tu número de mesa asignado.</p>
                         {confirmedGuestDetails.tableNumber && <p className="text-md font-bold mt-2">Mesa Asignada: {confirmedGuestDetails.tableNumber}</p>}
                        {!confirmedGuestDetails.tableNumber && <p className="text-md text-muted-foreground mt-2">Tu mesa será asignada pronto. ¡Vuelve a escanear el QR más cerca de la fecha!</p>}
                    </div>
                )}
                 {confirmedGuestDetails.notes && <p className="text-sm italic mt-3">Mensaje adicional: {confirmedGuestDetails.notes}</p>}
            </CardContent>
          ) : (
            <form onSubmit={handleRsvpSubmit}>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="rsvp-nombre" className="text-base">Nombre Completo (como figura en la invitación)</Label>
                    <Input 
                    id="rsvp-nombre" 
                    value={rsvpForm.nombreCompleto} 
                    onChange={(e) => handleRsvpInputChange('nombreCompleto', e.target.value)}
                    placeholder="Tu nombre y apellido" 
                    required 
                    className="text-base p-3"
                    disabled={isSubmittingRsvp}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rsvp-email" className="text-base">Email (Opcional)</Label>
                    <Input 
                    id="rsvp-email" 
                    type="email"
                    value={rsvpForm.email} 
                    onChange={(e) => handleRsvpInputChange('email', e.target.value)}
                    placeholder="tu@correo.com" 
                    className="text-base p-3"
                    disabled={isSubmittingRsvp}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="rsvp-confirmacion" className="text-base">¿Asistirás al evento?</Label>
                    <Select 
                    value={rsvpForm.confirmacion} 
                    onValueChange={(value: RsvpFormData['confirmacion']) => handleRsvpConfirmacionChange(value)}
                    required
                    disabled={isSubmittingRsvp}
                    >
                    <SelectTrigger id="rsvp-confirmacion" className="text-base p-3 h-auto"><SelectValue placeholder="Selecciona una opción..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="si" className="text-base">Sí, ¡allí estaré!</SelectItem>
                        <SelectItem value="no" className="text-base">No, lamentablemente no podré asistir.</SelectItem>
                        <SelectItem value="quizas" className="text-base">Quizás, aún no estoy seguro/a.</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {(rsvpForm.confirmacion === 'si' || rsvpForm.confirmacion === 'quizas') && (
                    <div className="space-y-2">
                    <Label htmlFor="rsvp-asistentes" className="text-base">¿Cuántas personas en total (incluyéndote)?</Label>
                    <Input 
                        id="rsvp-asistentes" 
                        type="number" 
                        value={rsvpForm.numeroAsistentes} 
                        onChange={(e) => handleRsvpInputChange('numeroAsistentes', parseInt(e.target.value, 10) || 1)} 
                        min="1" 
                        className="text-base p-3"
                        disabled={isSubmittingRsvp}
                    />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="rsvp-mensaje" className="text-base">Mensaje Adicional (Opcional)</Label>
                    <Textarea 
                    id="rsvp-mensaje" 
                    value={rsvpForm.mensaje} 
                    onChange={(e) => handleRsvpInputChange('mensaje', e.target.value)}
                    placeholder="Ej: Alergias, canción favorita, ¡muchas felicidades!, etc." 
                    rows={3}
                    className="text-base p-3"
                    disabled={isSubmittingRsvp}
                    />
                </div>
                </CardContent>
                <CardFooter>
                <Button type="submit" className="w-full text-lg py-6" disabled={isSubmittingRsvp} style={{ backgroundColor: pagePrimaryColor, color: 'hsl(var(--primary-foreground))' }}>
                    {isSubmittingRsvp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    {isSubmittingRsvp ? 'Enviando Confirmación...' : 'Enviar Confirmación'}
                </Button>
                </CardFooter>
            </form>
          )}
        </Card>
      </main>
      <footer className="text-center py-8 mt-10 border-t" style={{ borderColor: pagePrimaryColor !== 'hsl(var(--primary))' ? `${pagePrimaryColor}33` : 'hsl(var(--border))' }}>
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {fiesta.configuracion.nombreEvento}. Creado con cariño.</p>
      </footer>
    </div>
  );
}

