
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import NextImage from 'next/image';
import { Loader2, AlertTriangle, PartyPopper, CalendarDays, MapPin, Music2 as MusicIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings, ColorPalette } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { CountdownTimer } from '@/components/countdown-timer';
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


export default function EventoPublicoPage() {
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [webSettings, setWebSettings] = useState<EventWebPageSettings | null>(null);
  const [paletaColores, setPaletaColores] = useState<ColorPalette | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
      </main>
      <footer className="text-center py-10 mt-12 border-t" style={{ borderColor: `${secondaryColor}33` }}>
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {fiesta.configuracion.nombreEvento}. Creado con cariño.</p>
      </footer>
    </div>
  );
}
