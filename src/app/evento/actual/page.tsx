
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NextImage from 'next/image';
import { Loader2, AlertTriangle, ImageOff, Send, PartyPopper, CalendarDays, MapPin, CheckCircle, QrCode, Users, Info, BookOpen, Percent, Gift, Music2 as MusicIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings, ColorPalette } from '@/types/fiesta';
import type { Invitado, RsvpStatus } from '@/types/invitado';
import { getFiestaActual, handleRsvpSubmission } from '@/app/actions/fiesta-actual';
import QRCodeStylized from 'qrcode.react';
import { CountdownTimer } from '@/components/countdown-timer'; 
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const formatDate = (dateString?: string, includeTime: boolean = true, timeString?: string) => {
  if (!dateString) return "Fecha por confirmar";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'long', day: 'numeric'
    };
    let formattedDate = date.toLocaleDateString('es-ES', options);
    if (includeTime && timeString) {
      const [hours, minutes] = timeString.split(':');
      if (hours && minutes) {
        let hourNum = parseInt(hours, 10);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        hourNum = hourNum % 12 || 12; 
        formattedDate += ` a las ${hourNum}:${minutes} ${ampm}`;
      } else if (includeTime && date.getHours() !== 0 || date.getMinutes() !== 0) { // Fallback to date's time if timeString is bad but includeTime is true
        formattedDate += ` a las ${date.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      }
    }
    return formattedDate;
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
      setWebSettings(data.webPageSettings || { 
          pageTitle: data.configuracion.nombreEvento || 'Nuestro Evento', 
          welcomeMessage: '¡Te esperamos!', 
          galleryImageUrls: [],
          showCountdown: true,
          showOurStory: true,
          showEventDetails: true,
          showGallery: true,
          showRsvp: true,
      });
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
        if (result.invitado.rsvp === 'Confirmado' || result.invitado.rsvp === 'Quizás') {
          setConfirmedGuestDetails(result.invitado);
          setRsvpSubmittedSuccessfully(true); 
        } else { // Rechazado
          toast({
            title: "Respuesta Recibida",
            description: `Gracias ${rsvpForm.nombreCompleto}, hemos recibido tu respuesta. ¡Lamentamos que no puedas asistir!`,
          });
          setRsvpForm({ nombreCompleto: '', email: '', confirmacion: '', numeroAsistentes: 1, mensaje: '' }); 
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

  if (error || !fiesta || !webSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-6 text-center">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al Cargar el Evento</h2>
        <p>{error || "No se pudo encontrar la información del evento."}</p>
        <Button onClick={loadEventData} variant="destructive" className="mt-6">Intentar de Nuevo</Button>
      </div>
    );
  }
  
  const primaryColor = paletaColores?.primary || 'hsl(var(--primary))';
  const secondaryColor = paletaColores?.secondary || 'hsl(var(--secondary))';
  const accentColor = paletaColores?.accent || 'hsl(var(--accent))';
  const heroTextStyle = webSettings.coverImageUrl ? 'text-white' : 'text-primary-foreground';

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header 
        className="relative py-20 md:py-32 text-center bg-cover bg-center"
        style={{ backgroundImage: webSettings.coverImageUrl ? `url(${webSettings.coverImageUrl})` : 'none', backgroundColor: !webSettings.coverImageUrl ? primaryColor : 'transparent' }}
      >
        <div className={cn("absolute inset-0 z-0", webSettings.coverImageUrl ? 'bg-black/50' : '')}></div>
        <div className={cn("relative z-10 p-6 rounded-lg max-w-3xl mx-auto", webSettings.coverImageUrl ? 'bg-black/30 backdrop-blur-sm' : '')}>
            <PartyPopper className={cn("w-16 h-16 mx-auto mb-4", heroTextStyle)} style={{ color: webSettings.coverImageUrl ? 'white' : (paletaColores?.accent || 'hsl(var(--accent-foreground))') }} />
            <h1 className={cn("text-4xl md:text-6xl font-bold font-headline", heroTextStyle)}>
              {webSettings.pageTitle || fiesta.configuracion.nombreEvento}
            </h1>
            {webSettings.heroSubtitle && <p className={cn("text-xl md:text-2xl mt-2", heroTextStyle)}>{webSettings.heroSubtitle}</p>}
            <p className={cn("text-lg md:text-xl mt-3", heroTextStyle)}>
                <CalendarDays className="inline-block w-5 h-5 mr-2 align-middle" />
                {formatDate(fiesta.configuracion.fechaEvento, false)}
            </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 md:space-y-16">
        
        {webSettings.showCountdown && fiesta.configuracion.fechaEvento && (
          <section id="countdown" className="text-center">
            <h2 className="text-2xl md:text-3xl font-semibold font-headline mb-6" style={{color: primaryColor}}>Cuenta Regresiva</h2>
            <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
          </section>
        )}

        {webSettings.welcomeMessage && (
             <section id="welcome" className="text-center">
                <p className="text-lg md:text-xl text-muted-foreground whitespace-pre-line">{webSettings.welcomeMessage}</p>
            </section>
        )}

        {webSettings.showOurStory && (webSettings.ourStoryText || webSettings.ourStoryImageUrl) && (
            <section id="our-story" className="py-8" style={{ backgroundColor: `${secondaryColor}1A` }}>
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-8" style={{color: primaryColor}}>{webSettings.ourStoryTitle || "Nuestra Historia"}</h2>
                    <div className="md:flex md:items-center md:gap-8">
                        {webSettings.ourStoryImageUrl && (
                            <div className="md:w-1/2 mb-6 md:mb-0">
                                <NextImage src={webSettings.ourStoryImageUrl} alt="Nuestra Historia" width={600} height={400} className="rounded-lg shadow-lg object-cover mx-auto" data-ai-hint="couple story photo" />
                            </div>
                        )}
                        {webSettings.ourStoryText && (
                            <div className={cn("md:w-1/2 prose prose-lg dark:prose-invert max-w-none", !webSettings.ourStoryImageUrl && 'mx-auto text-center')}>
                                <p className="whitespace-pre-line text-muted-foreground">{webSettings.ourStoryText}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        )}
        
        {webSettings.showEventDetails && (
            <section id="event-details" className="py-8">
                 <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-8" style={{color: primaryColor}}>{webSettings.eventDetailsTitle || "Detalles del Evento"}</h2>
                 <Card className="shadow-lg">
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <CalendarDays className="w-6 h-6 mt-1" style={{color: accentColor}}/>
                            <div>
                                <h3 className="font-semibold">Fecha y Hora</h3>
                                <p className="text-muted-foreground">{formatDate(fiesta.configuracion.fechaEvento, true, fiesta.configuracion.horaInicio)}</p>
                            </div>
                        </div>
                        {fiesta.configuracion.nombreLugar && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-6 h-6 mt-1" style={{color: accentColor}}/>
                                <div>
                                    <h3 className="font-semibold">Lugar</h3>
                                    <p className="text-muted-foreground">{fiesta.configuracion.nombreLugar}</p>
                                </div>
                            </div>
                        )}
                        {webSettings.eventDetailsText && (
                            <div className="pt-3 prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-muted-foreground">
                                {webSettings.eventDetailsText}
                            </div>
                        )}
                        {webSettings.programaEventoText && (<>
                            <Separator/>
                            <h3 className="font-semibold pt-2">Programa del Evento:</h3>
                             <div className="pt-1 prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-muted-foreground">
                                {webSettings.programaEventoText}
                            </div>
                        </>)}
                    </CardContent>
                 </Card>
            </section>
        )}
         {webSettings.musicaEspecialText && (
             <section id="musica-especial" className="text-center py-8" style={{ backgroundColor: `${secondaryColor}1A` }}>
                 <h2 className="text-2xl md:text-3xl font-semibold font-headline mb-4" style={{color: primaryColor}}>Música Especial</h2>
                 <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                    <MusicIcon className="w-6 h-6" style={{color: accentColor}}/>
                    <p>{webSettings.musicaEspecialText}</p>
                 </div>
            </section>
        )}

        {webSettings.showDressCode && webSettings.dressCodeText && (
            <section id="dress-code" className="text-center py-8" style={{ backgroundColor: `${secondaryColor}1A`}}>
                 <h2 className="text-2xl md:text-3xl font-semibold font-headline mb-4" style={{color: primaryColor}}>Código de Vestimenta</h2>
                 <p className="text-lg text-muted-foreground">{webSettings.dressCodeText}</p>
            </section>
        )}
        
        {webSettings.showGiftRegistry && webSettings.giftRegistryText && (
            <section id="gift-registry" className="py-8">
                 <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-6" style={{color: primaryColor}}>{webSettings.giftRegistryTitle || "Regalos"}</h2>
                 <Card className="shadow-md">
                    <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none whitespace-pre-line text-muted-foreground text-center">
                        {webSettings.giftRegistryText}
                    </CardContent>
                 </Card>
            </section>
        )}

        {webSettings.showGallery && webSettings.galleryImageUrls && webSettings.galleryImageUrls.length > 0 && (
          <section id="gallery" className="py-8" style={{ backgroundColor: `${secondaryColor}1A`}}>
            <h2 className="text-2xl md:text-3xl font-semibold font-headline text-center mb-8" style={{color: primaryColor}}>Galería de Fotos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {webSettings.galleryImageUrls.map((url, index) => (
                <div key={index} className="aspect-square relative rounded-lg overflow-hidden border shadow-sm hover:shadow-xl transition-shadow">
                  <NextImage src={url} alt={`Foto de galería ${index + 1}`} layout="fill" objectFit="cover" data-ai-hint="event photo gallery"/>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {webSettings.showRsvp && (
            <section id="rsvp" className="py-8">
                <Card className="shadow-xl border-t-4" style={{ borderColor: primaryColor }}>
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl md:text-3xl" style={{ color: primaryColor }}>
                        {rsvpSubmittedSuccessfully && confirmedGuestDetails ? `¡Gracias, ${confirmedGuestDetails.nombre}!` : 'Confirma tu Asistencia'}
                    </CardTitle>
                    <CardDescription className="text-md">
                        {rsvpSubmittedSuccessfully && confirmedGuestDetails ? 'Hemos recibido tu respuesta.' : 'Por favor, ayúdanos a organizar mejor el evento.'}
                    </CardDescription>
                </CardHeader>
                {rsvpSubmittedSuccessfully && confirmedGuestDetails ? (
                    <CardContent className="text-center space-y-6 py-8">
                        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                         <p className="text-xl">
                            Tu estado de asistencia ({confirmedGuestDetails.rsvp}) para {confirmedGuestDetails.partySize} persona(s) ha sido registrado.
                        </p>
                        {confirmedGuestDetails.id && (confirmedGuestDetails.rsvp === 'Confirmado' || confirmedGuestDetails.rsvp === 'Quizás') && (
                            <div className="mt-8 space-y-4">
                                <p className="font-semibold text-lg">Tu código QR para el evento:</p>
                                <div className="flex justify-center p-4 bg-white rounded-lg border shadow-inner">
                                    <QRCodeStylized value={getTableAssignmentUrl(confirmedGuestDetails.id)} size={180} level="H" fgColor={primaryColor} />
                                </div>
                                <p className="text-md text-muted-foreground">Escanea este código QR al llegar al salón para conocer tu número de mesa asignado.</p>
                                {confirmedGuestDetails.tableNumber && <p className="text-lg font-bold mt-2">Mesa Asignada: {confirmedGuestDetails.tableNumber}</p>}
                                {!confirmedGuestDetails.tableNumber && <p className="text-md text-muted-foreground mt-2">Tu mesa será asignada pronto. ¡Vuelve a escanear el QR más cerca de la fecha!</p>}
                            </div>
                        )}
                        {confirmedGuestDetails.notes && <p className="text-sm italic mt-4 text-muted-foreground">Mensaje Adicional: {confirmedGuestDetails.notes}</p>}
                    </CardContent>
                ) : (
                    <form onSubmit={handleRsvpSubmit}>
                        <CardContent className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <Label htmlFor="rsvp-nombre" className="font-medium">Nombre Completo (como figura en la invitación)</Label>
                            <Input id="rsvp-nombre" value={rsvpForm.nombreCompleto} onChange={(e) => handleRsvpInputChange('nombreCompleto', e.target.value)} placeholder="Tu nombre y apellido" required className="text-base p-3" disabled={isSubmittingRsvp}/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="rsvp-email" className="font-medium">Email (Opcional)</Label>
                            <Input id="rsvp-email" type="email" value={rsvpForm.email} onChange={(e) => handleRsvpInputChange('email', e.target.value)} placeholder="tu@correo.com" className="text-base p-3" disabled={isSubmittingRsvp}/>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="rsvp-confirmacion" className="font-medium">¿Asistirás al evento?</Label>
                            <Select value={rsvpForm.confirmacion} onValueChange={(value: RsvpFormData['confirmacion']) => handleRsvpConfirmacionChange(value)} required disabled={isSubmittingRsvp}>
                            <SelectTrigger id="rsvp-confirmacion" className="text-base p-3 h-auto"><SelectValue placeholder="Selecciona una opción..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="si" className="text-base">Sí, ¡allí estaré!</SelectItem>
                                <SelectItem value="no" className="text-base">No, lamentablemente no podré asistir.</SelectItem>
                                <SelectItem value="quizas" className="text-base">Quizás, aún no estoy seguro/a.</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                        {(rsvpForm.confirmacion === 'si' || rsvpForm.confirmacion === 'quizas') && (
                            <div className="space-y-1">
                            <Label htmlFor="rsvp-asistentes" className="font-medium">¿Cuántas personas en total (incluyéndote)?</Label>
                            <Input id="rsvp-asistentes" type="number" value={rsvpForm.numeroAsistentes} onChange={(e) => handleRsvpInputChange('numeroAsistentes', parseInt(e.target.value, 10) || 1)} min="1" className="text-base p-3" disabled={isSubmittingRsvp}/>
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="rsvp-mensaje" className="font-medium">Mensaje Adicional (Opcional)</Label>
                            <Textarea id="rsvp-mensaje" value={rsvpForm.mensaje} onChange={(e) => handleRsvpInputChange('mensaje', e.target.value)} placeholder="Ej: Alergias, canción favorita, ¡muchas felicidades!, etc." rows={3} className="text-base p-3" disabled={isSubmittingRsvp}/>
                        </div>
                        </CardContent>
                        <CardFooter>
                        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmittingRsvp} style={{ backgroundColor: accentColor, color: paletaColores?.primary ? 'hsl(var(--primary-foreground))' : 'hsl(var(--accent-foreground))' }}>
                            {isSubmittingRsvp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                            {isSubmittingRsvp ? 'Enviando Confirmación...' : 'Enviar Confirmación'}
                        </Button>
                        </CardFooter>
                    </form>
                )}
                </Card>
            </section>
        )}
      </main>
      <footer className="text-center py-10 mt-12 border-t" style={{ borderColor: `${secondaryColor}33` }}>
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {fiesta.configuracion.nombreEvento}. Creado con cariño.</p>
      </footer>
    </div>
  );
}
    