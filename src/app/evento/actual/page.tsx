'use client';

import React, { useState, useEffect, useCallback, type FormEvent, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import NextImage from 'next/image';
import { Loader2, AlertTriangle, PartyPopper, CalendarDays, MapPin, Music2 as MusicIcon, Check, Users, MessageSquare, Send, CheckCircle, Gift, Clock, QrCode, Facebook, Instagram, Music, Utensils, GlassWater, Diamond, Sparkles, CakeSlice, Camera, Link as LinkIcon, ExternalLink, Heart, Church, Handshake, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, EventWebPageSettings, ColorPalette, Invitado, GiftItem, ProgramaEventoItem } from '@/types/fiesta';
import { getFiestaActual, handleRsvpSubmissionFiestaActual, claimGiftFiestaActual, getFiestaById } from '@/app/actions/fiesta-actual';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { SocialConnection } from '@/types/settings';
import { CountdownTimer } from '@/components/countdown-timer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCodeStylized from 'qrcode.react';
import { defaultWebPageSettings } from '@/lib/fiesta-defaults';
import { merge, cloneDeep } from 'lodash';
import { WatermarkedImage } from '@/components/watermarked-image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// --- PLANTILLA GRAZIA ---
const GraziaTemplate: React.FC<{
  fiesta: FiestaEnPlanificacion;
  webSettings: EventWebPageSettings;
  paletaColores: ColorPalette | null;
  children: React.ReactNode;
}> = ({ fiesta, webSettings, paletaColores, children }) => {
  const primaryColor = paletaColores?.primary || '#D9B8FF';
  const secondaryColor = paletaColores?.secondary || '#FCD3DE';
  const textColor = paletaColores?.accent || '#333';
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Fecha a confirmar";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const mapQuery = fiesta.configuracion.nombreLugar ? encodeURIComponent(fiesta.configuracion.nombreLugar) : '';
  const mapUrl = `https://www.google.com/maps?q=${mapQuery}`;

  const FloralSeparator = () => (
    <div className="text-center my-8" aria-hidden="true">
      <svg width="100" height="20" viewBox="0 0 100 20" className="inline-block" fill={primaryColor}>
        <path d="M50 10 L10 10 Q5 10, 5 15 M50 10 L90 10 Q95 10, 95 15 M50 10 Q45 10, 45 5 M50 10 Q55 10, 55 5" stroke={primaryColor} strokeWidth="1" fill="none" />
        <circle cx="50" cy="10" r="3" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-body" style={{'--theme-primary': primaryColor, '--theme-secondary': secondaryColor, '--theme-text': textColor} as React.CSSProperties}>
       <header 
        className="relative py-16 md:py-24 text-center bg-cover bg-center min-h-[400px] flex items-center justify-center"
        style={{ backgroundImage: `url(${webSettings.coverImageUrl || 'https://picsum.photos/seed/wedding-hero/1200/800'})` }}
      >
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
        <div className="relative z-10 p-6 max-w-2xl mx-auto text-center">
            <h2 className="font-headline text-2xl" style={{color: textColor}}>Nuestra Boda</h2>
            <h1 className="font-headline text-5xl md:text-7xl my-3" style={{color: primaryColor}}>
               {webSettings.pageTitle || fiesta.configuracion.nombreEvento}
            </h1>
            <p className="text-xl font-headline" style={{color: textColor}}>
                {formatDate(fiesta.configuracion.fechaEvento)}
            </p>
        </div>
      </header>
       <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-12">
        {webSettings.showCountdown && fiesta.configuracion.fechaEvento && (
          <section id="countdown" className="text-center">
            <h3 className="font-headline text-2xl mb-4" style={{color: primaryColor}}>Faltan</h3>
            <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
          </section>
        )}
        
        <FloralSeparator />

        <section id="ceremonia" className="text-center">
            <Church className="w-12 h-12 mx-auto mb-3" style={{color: primaryColor}}/>
            <h3 className="font-headline text-3xl mb-3" style={{color: textColor}}>Ceremonia</h3>
            <p className="text-lg text-muted-foreground">{fiesta.configuracion.horaInicio} hs.</p>
            <p className="text-lg font-semibold" style={{color: textColor}}>{fiesta.configuracion.nombreLugar}</p>
        </section>

        <FloralSeparator />
        
        <section id="celebracion" className="text-center">
             <Handshake className="w-12 h-12 mx-auto mb-3" style={{color: primaryColor}}/>
            <h3 className="font-headline text-3xl mb-3" style={{color: textColor}}>Celebración</h3>
            <p className="text-lg text-muted-foreground">{fiesta.configuracion.horaFin ? `A partir de las ${fiesta.configuracion.horaFin} hs.` : 'Luego de la ceremonia'}</p>
            <p className="text-lg font-semibold" style={{color: textColor}}>{fiesta.configuracion.nombreLugar}</p>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="mt-4"><MapPin className="w-4 h-4 mr-2"/> Ver en Mapa</Button>
            </a>
        </section>

        <FloralSeparator />
        
        {webSettings.showGiftRegistry && (
            <section id="regalos" className="text-center">
                 <Gift className="w-12 h-12 mx-auto mb-3" style={{color: primaryColor}}/>
                <h3 className="font-headline text-3xl mb-3" style={{color: textColor}}>Lista de Regalos</h3>
                <p className="text-muted-foreground max-w-md mx-auto">{webSettings.giftRegistryText}</p>
            </section>
        )}

        <FloralSeparator />

        {webSettings.showRsvp && <div id="rsvp">{children}</div>}

       </main>
       <footer className="text-center py-6 mt-8 border-t">
          <p className="text-sm font-headline" style={{color: primaryColor}}>AK Producciones</p>
       </footer>
    </div>
  );
};


// Componente principal de la página
function EventoPublicoPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [webSettings, setWebSettings] = useState<EventWebPageSettings>(defaultWebPageSettings);
  const [paletaColores, setPaletaColores] = useState<ColorPalette | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialConnection[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // State for claim gift dialog
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [guestName, setGuestName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadEventData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se especificó un ID de evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [data, connections] = await Promise.all([ getFiestaById(fiestaId), getSocialConnections() ]);
      if (!data) throw new Error("Evento no encontrado.");
      setFiesta(data);
      const mergedWebSettings = merge(cloneDeep(defaultWebPageSettings), data.webPageSettings || {});
      setWebSettings(mergedWebSettings);
      setPaletaColores(data.decoracion?.paletaColores || null);
      setSocialLinks(connections.filter(c => c.isConnected && c.profileUrl));
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
  
  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="text-lg mt-4">Cargando detalles del evento...</p></div>;
  }

  if (error || !fiesta) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center"><AlertTriangle className="w-16 h-16 mb-4 text-destructive" /><h2 className="text-2xl font-semibold mb-2">Error al Cargar</h2><p>{error || "No se pudo encontrar el evento."}</p></div>;
  }
  
  const templateName = webSettings.templateName || 'Grazia';
  
  const RsvpComponent = <RsvpForm fiesta={fiesta} />;

  return (
    <>
      {templateName === 'Grazia' ? (
        <GraziaTemplate fiesta={fiesta} webSettings={webSettings} paletaColores={paletaColores}>
           {RsvpComponent}
        </GraziaTemplate>
      ) : (
        // ObsidianaTemplate u otras como fallback
        <div className="text-center p-8"> Plantilla "{templateName}" no encontrada. </div>
      )}
    </>
  );
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


function RsvpForm({ fiesta }: { fiesta: FiestaEnPlanificacion }) {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [confirmacion, setConfirmacion] = useState<'si' | 'no' | 'tal-vez' | null>(null);
  const [numeroAsistentes, setNumeroAsistentes] = useState(1);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { toast } = useToast();

  const handlePartySizeChange = (newSize: number) => {
    const size = isNaN(newSize) || newSize < 1 ? 1 : newSize;
    setNumeroAsistentes(size);
    const companionCount = size > 1 ? size - 1 : 0;
    setCompanionNames(currentNames => {
      const newNames = [...currentNames];
      while (newNames.length < companionCount) { newNames.push(''); }
      return newNames.slice(0, companionCount);
    });
  };

  const handleCompanionNameChange = (index: number, name: string) => {
    setCompanionNames(currentNames => {
      const newNames = [...currentNames];
      newNames[index] = name;
      return newNames;
    });
  };
  
  const handleConfirmacionChange = (value: 'si' | 'no' | 'tal-vez') => {
      setConfirmacion(value);
      if (value === 'no') { handlePartySizeChange(1); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) { toast({ title: "Nombre requerido", variant: "destructive" }); return; }
    if (!confirmacion) { toast({ title: "Confirmación requerida", variant: "destructive" }); return; }

    setIsSubmitting(true);
    setFormMessage(null);

    const submissionData = {
      nombreCompleto: nombreCompleto.trim(),
      confirmacion, numeroAsistentes, mensaje: mensaje.trim(),
      companionNames: companionNames.map(name => name.trim()).filter(name => name !== ''),
    };

    try {
      const result = await handleRsvpSubmissionFiestaActual(submissionData);
      if (result.success) {
        setFormMessage({ type: 'success', text: '¡Gracias! Tu respuesta ha sido enviada.' });
        setNombreCompleto(''); setConfirmacion(null); handlePartySizeChange(1); setMensaje('');
      } else { throw new Error(result.error || "No se pudo procesar tu respuesta."); }
    } catch (error: any) {
      setFormMessage({ type: 'error', text: error.message || 'Ocurrió un error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryColor = fiesta.decoracion?.paletaColores?.primary || 'hsl(var(--primary))';

  return (
    <section id="rsvp" className="py-8">
      <h3 className="font-headline text-3xl text-center mb-8" style={{color: primaryColor}}>Confirmar Asistencia</h3>
      <Card className="max-w-xl mx-auto shadow-lg border-none bg-background/50">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2"><Label htmlFor="nombre-completo">Nombre y Apellido *</Label><Input id="nombre-completo" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required disabled={isSubmitting} /></div>
            <div className="space-y-3"><Label>¿Asistirás? *</Label><RadioGroup value={confirmacion || ''} onValueChange={handleConfirmacionChange} className="flex flex-col sm:flex-row gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="si" id="rsvp-si" /><Label htmlFor="rsvp-si">Sí, ¡allí estaré!</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="tal-vez" id="rsvp-tal-vez" /><Label htmlFor="rsvp-tal-vez">Tal vez</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="no" id="rsvp-no" /><Label htmlFor="rsvp-no">No podré asistir</Label></div></RadioGroup></div>
            {(confirmacion === 'si' || confirmacion === 'tal-vez') && (<div className="p-4 border-l-4 rounded-r-md space-y-4 bg-muted/50" style={{borderColor: primaryColor}}><div className="space-y-2"><Label htmlFor="numero-asistentes">Nº de Asistentes (contándote)</Label><Input id="numero-asistentes" type="number" min="1" value={numeroAsistentes} onChange={(e) => handlePartySizeChange(parseInt(e.target.value, 10))} disabled={isSubmitting} /></div>{numeroAsistentes > 1 && (<div className="space-y-3"><Label>Nombres de tus acompañantes:</Label>{Array.from({ length: numeroAsistentes - 1 }).map((_, index) => (<div key={index} className="space-y-1"><Input id={`companion-name-${index}`} value={companionNames[index] || ''} onChange={(e) => handleCompanionNameChange(index, e.target.value)} disabled={isSubmitting} placeholder={`Acompañante ${index + 1}`}/></div>))}</div>)}</div>)}
            <div className="space-y-2"><Label htmlFor="mensaje">¿Alguna canción que no pueda faltar?</Label><Textarea id="mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} disabled={isSubmitting} rows={3} placeholder="¡Sugiérenos una canción para la fiesta!" /></div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4 mr-2" /> Enviar Confirmación</>}</Button>
            {formMessage && (<div className={`text-sm text-center p-2 rounded-md ${formMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/10 text-destructive'}`}>{formMessage.text}</div>)}
          </CardFooter>
        </form>
      </Card>
    </section>
  );
}