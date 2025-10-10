
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import NextImage from 'next/image';
import { Loader2, AlertTriangle, PartyPopper, CalendarDays, MapPin, Check, Users, MessageSquare, Send, CheckCircle, Gift, Clock, QrCode, Facebook, Instagram, Music, Utensils, GlassWater, Diamond, Sparkles, CakeSlice, Camera, Link as LinkIcon, ExternalLink, Heart, Church, Mail, Music2, Play, Pause, Handshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, Invitado, GiftItem, ProgramaEventoItem, SeccionInvitacion } from '@/types/fiesta';
import { getFiestaById, handleRsvpSubmissionFiestaActual, claimGiftFiestaActual } from '@/app/actions/fiesta-actual';
import { getSocialConnections } from '@/app/actions/social-connections';
import type { SocialConnection, SocialPlatformName } from '@/types/settings';
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
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import { merge, cloneDeep } from 'lodash';
import { WatermarkedImage } from '@/components/watermarked-image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from "framer-motion";

// --- TEMPLATE COMPONENTS ---

const SectionWrapper: React.FC<{ seccion: SeccionInvitacion, children: React.ReactNode }> = ({ seccion, children }) => {
    if (!seccion.data.visible) return null;

    const sectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    };

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            id={seccion.tipo}
            className="py-12 px-4 text-center relative"
        >
            {seccion.data.imagenFondoUrl && (
                <>
                    <NextImage src={seccion.data.imagenFondoUrl} alt="" layout="fill" objectFit="cover" className="absolute inset-0 -z-10" />
                    <div className="absolute inset-0 bg-background/80 -z-10"></div>
                </>
            )}
            {children}
        </motion.section>
    );
};

const SectionIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
        {children}
    </motion.div>
);

const FloralSeparator: React.FC<{ color: string }> = ({ color }) => (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center my-8" aria-hidden="true">
        <svg width="100" height="20" viewBox="0 0 100 20" className="inline-block" fill={color}>
            <path d="M50 10 L10 10 Q5 10, 5 15 M50 10 L90 10 Q95 10, 95 15 M50 10 Q45 10, 45 5 M50 10 Q55 10, 55 5" stroke={color} strokeWidth="1" fill="none" />
            <circle cx="50" cy="10" r="3" />
        </svg>
    </motion.div>
);

// --- SECTIONS FOR GRAZIA TEMPLATE ---

const GraziaCabecera: React.FC<{ data: InvitacionDigitalData['cabecera'], fiesta: FiestaEnPlanificacion, paleta: ColorPalette, children: React.ReactNode }> = ({ data, fiesta, paleta, children }) => {
  if (!data.visible) return null;
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Fecha a confirmar";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  return (
    <header className="relative py-16 md:py-24 text-center bg-cover bg-center min-h-[400px] flex items-center justify-center">
        {data.videoFondoUrl && (
            <video src={data.videoFondoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover -z-10"/>
        )}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm -z-10"></div>
        <div className="relative z-10 p-6 max-w-2xl mx-auto text-center">
            {children}
            <h1 className="font-headline text-5xl md:text-7xl my-3" style={{color: paleta.primary}}>
               {data.protagonista1 || fiesta.configuracion.nombreEvento}
               {data.protagonista2 && ` & ${data.protagonista2}`}
            </h1>
            <p className="text-xl font-headline" style={{color: paleta.accent}}>
                {formatDate(fiesta.configuracion.fechaEvento)}
            </p>
        </div>
    </header>
  );
};

const GraziaDetalles: React.FC<{ data: InvitacionDigitalData['detallesEvento'], fiesta: FiestaEnPlanificacion, paleta: ColorPalette }> = ({ data, fiesta, paleta }) => {
    const mapQuery = fiesta.configuracion.nombreLugar ? encodeURIComponent(fiesta.configuracion.nombreLugar) : '';
    const mapUrl = `https://www.google.com/maps?q=${mapQuery}`;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <SectionIcon><Church className="w-12 h-12 mx-auto mb-3" style={{color: paleta.primary}}/></SectionIcon>
                <h3 className="font-headline text-3xl mb-3" style={{color: paleta.accent}}>Ceremonia</h3>
                <p className="text-lg text-muted-foreground">{fiesta.configuracion.horaInicio} hs.</p>
                <p className="text-lg font-semibold" style={{color: paleta.accent}}>{fiesta.configuracion.nombreLugar}</p>
            </div>
            <div>
                <SectionIcon><Handshake className="w-12 h-12 mx-auto mb-3" style={{color: paleta.primary}}/></SectionIcon>
                <h3 className="font-headline text-3xl mb-3" style={{color: paleta.accent}}>Celebración</h3>
                <p className="text-lg text-muted-foreground">{fiesta.configuracion.horaFin ? `A partir de las ${fiesta.configuracion.horaFin} hs.` : 'Luego de la ceremonia'}</p>
                <p className="text-lg font-semibold" style={{color: paleta.accent}}>{fiesta.configuracion.nombreLugar}</p>
            </div>
            <div className="md:col-span-2">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="mt-4"><MapPin className="w-4 h-4 mr-2"/> Ver en Mapa</Button>
                </a>
            </div>
        </div>
    );
};

const GraziaRegalos: React.FC<{ data: InvitacionDigitalData['regalos'], paleta: ColorPalette }> = ({ data, paleta }) => {
    return (
        <>
            <SectionIcon><Gift className="w-12 h-12 mx-auto mb-3" style={{color: paleta.primary}}/></SectionIcon>
            <h3 className="font-headline text-3xl mb-3" style={{color: paleta.accent}}>{data.titulo}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{data.texto}</p>
        </>
    );
};


// --- PLANTILLA GRAZIA ---
export const GraziaTemplate: React.FC<{
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections: SocialConnection[];
  children?: React.ReactNode; 
  isPreview?: boolean;
}> = ({ fiesta, invitacionData, socialConnections, children, isPreview = false }) => {
  
  const paletaColores = fiesta.decoracion?.paletaColores || defaultInvitacionDigitalData.cabecera.paletaColores;
  const primaryColor = paletaColores?.primary || 'hsl(var(--primary))';
  const textColor = paletaColores?.accent || '#333';
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (isPreview) return; // Disable audio in preview
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };
  
  const socialIcons: Record<SocialPlatformName, React.ElementType> = { Facebook, Instagram, TikTok: Music, WhatsApp: MessageSquare };

  const renderSectionComponent = (seccion: SeccionInvitacion) => {
    const props = { data: seccion.data, fiesta, paleta: paletaColores! };
    switch (seccion.tipo) {
      case 'bienvenida': return <SectionWrapper seccion={seccion}><SectionIcon><Heart className="w-12 h-12 mx-auto mb-3" style={{color: primaryColor}} /></SectionIcon><h2 className="font-headline text-2xl mb-4" style={{color: textColor}}>{seccion.data.titulo}</h2><p className="max-w-xl mx-auto text-muted-foreground">{seccion.data.texto}</p></SectionWrapper>;
      case 'cuentaRegresiva': return <SectionWrapper seccion={seccion}><h3 className="font-headline text-2xl mb-4" style={{color: primaryColor}}>Faltan</h3><CountdownTimer targetDate={fiesta.configuracion.fechaEvento} /></SectionWrapper>;
      case 'detallesEvento': return <SectionWrapper seccion={seccion}><GraziaDetalles {...props} /></SectionWrapper>;
      case 'regalos': return <SectionWrapper seccion={seccion}><GraziaRegalos {...props} /></SectionWrapper>;
      case 'confirmacion': return <div id="rsvp">{children}</div>
      default: return null;
    }
  }

  return (
    <div className={cn("min-h-screen bg-background font-body", isPreview && "overflow-y-auto h-full")} style={{'--theme-primary': primaryColor, '--theme-text': textColor} as React.CSSProperties}>
       <GraziaCabecera data={invitacionData.cabecera} fiesta={fiesta} paleta={paletaColores!}>
         <h2 className="font-headline text-2xl" style={{color: textColor}}>{invitacionData.bienvenida.titulo}</h2>
       </GraziaCabecera>
       
       <main className="max-w-3xl mx-auto p-4 md:p-8">
        {invitacionData.secciones.map((seccion, index) => (
            <React.Fragment key={seccion.id}>
                {renderSectionComponent(seccion)}
                {index < invitacionData.secciones.length - 1 && <FloralSeparator color={primaryColor}/>}
            </React.Fragment>
        ))}
       </main>

       {invitacionData.musicaFondoUrl && !isPreview && (
            <>
              <audio ref={audioRef} src={invitacionData.musicaFondoUrl} loop />
              <Button onClick={togglePlayPause} variant="outline" size="icon" className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            </>
       )}
       <footer className="text-center py-8 mt-8 border-t bg-muted/20">
          <p className="text-sm font-headline mb-4" style={{color: primaryColor}}>AK Producciones</p>
          <div className="flex justify-center items-center gap-4">
            {socialConnections.filter(c => c.isConnected).map(conn => {
                const Icon = socialIcons[conn.platform];
                return Icon ? (
                    <a key={conn.platform} href={conn.profileUrl || '#'} target="_blank" rel="noopener noreferrer" aria-label={`Perfil de ${conn.platform}`}>
                        <Button variant="ghost" size="icon"><Icon className="w-6 h-6" /></Button>
                    </a>
                ) : null;
            })}
          </div>
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
  const [invitacionData, setInvitacionData] = useState<InvitacionDigitalData>(defaultInvitacionDigitalData);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  
  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="text-lg mt-4">Cargando detalles del evento...</p></div>;
  }

  if (error || !fiesta) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center"><AlertTriangle className="w-16 h-16 mb-4 text-destructive" /><h2 className="text-2xl font-semibold mb-2">Error al Cargar</h2><p>{error || "No se pudo encontrar el evento."}</p></div>;
  }
  
  const templateName = invitacionData.plantilla || 'Grazia';
  
  const RsvpComponent = <div>RSVP Form Placeholder</div>; // Replace with your actual RSVP form component

  return (
    <>
      {templateName === 'Grazia' ? (
        <GraziaTemplate fiesta={fiesta} invitacionData={invitacionData} socialConnections={socialConnections}>
           {RsvpComponent}
        </GraziaTemplate>
      ) : (
        // Placeholder for other templates
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
