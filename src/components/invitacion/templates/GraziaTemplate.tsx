
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SocialConnection, SeccionInvitacion } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { Church, GlassWater, Gift, Heart, MapPin, Play, Pause, Facebook, Instagram, Music, MessageSquare, Building, PartyPopper, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { SocialPlatformName } from '@/types/settings';
import { motion } from "framer-motion";
import type { DetalleEventoEspecifico } from '@/types/fiesta';
import { WatermarkedImage } from '@/components/watermarked-image';


interface TemplateProps {
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections: SocialConnection[];
  isPreview?: boolean;
  onSectionClick?: (sectionId: string) => void;
  onUpdate?: (newData: Partial<InvitacionDigitalData>) => void;
  selectedSectionId?: string | null;
  children?: React.ReactNode; 
}

const SectionWrapper: React.FC<{ 
    seccion: SeccionInvitacion, 
    children: React.ReactNode,
    onClick?: () => void,
    isSelected?: boolean,
    className?: string,
}> = ({ seccion, children, onClick, isSelected, className }) => {
    if (!seccion.data.visible) return null;

    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
    };

    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            id={seccion.tipo}
            className={cn("py-16 px-6 text-center relative", className, onClick && "cursor-pointer group/section")}
            onClick={onClick}
        >
            {onClick && <div className={cn("absolute inset-0 border-2 transition-all pointer-events-none", isSelected ? 'border-primary' : 'border-transparent group-hover/section:border-primary/50')}></div>}
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

const GraziaCabecera: React.FC<{ data: InvitacionDigitalData['cabecera'], fiesta: FiestaEnPlanificacion, paleta: ColorPalette, onUpdate?: (newData: Partial<InvitacionDigitalData>) => void, isPreview?: boolean }> = ({ data, fiesta, paleta, onUpdate, isPreview }) => {
  if (!data.visible) return null;
  
  const handleUpdateProtagonista = (field: 'protagonista1' | 'protagonista2', value: string) => {
    onUpdate?.({ cabecera: { ...data, [field]: value } });
  };
  
  const primaryColor = paleta.primary || 'hsl(var(--primary))';
  
  return (
    <header 
        className="relative py-24 md:py-32 text-center bg-cover bg-center min-h-[70vh] flex items-center justify-center"
        style={{
            backgroundImage: `url(${data.videoFondoUrl ? '' : (data.imagenFondoUrl || '')})`,
            backgroundAttachment: 'fixed',
        }}
    >
        {data.videoFondoUrl && (
            <video src={data.videoFondoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover -z-10"/>
        )}
        <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-sm -z-10"></div>
        <div className="relative z-10 p-6 max-w-2xl mx-auto text-center">
            {data.logoUrl && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="relative h-28 w-full mb-6">
                        <WatermarkedImage src={data.logoUrl} alt="Logo del evento" containerClassName="h-full w-full"/>
                    </div>
                </motion.div>
            )}
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
                <EditableText 
                    initialValue={data.subtitulo?.text || "Nuestra Boda"}
                    style={data.subtitulo?.style}
                    onSave={(val) => onUpdate?.({ cabecera: { ...data, subtitulo: { ...(data.subtitulo || {style:{}}), text: val } } })}
                    className="font-headline text-2xl"
                    textarea={false} 
                />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="font-headline text-6xl md:text-8xl my-4" style={{color: primaryColor}}>
               <EditableText 
                    initialValue={data.protagonista1 || "Protagonista 1"} 
                    style={{ fontFamily: 'Belleza', fontSize: 'inherit', color: 'inherit' }}
                    onSave={(val) => handleUpdateProtagonista('protagonista1', val)}
                    textarea={false}
                />
               {data.protagonista2 && <span className="mx-2">&</span>}
               {data.protagonista2 && 
                <EditableText 
                    initialValue={data.protagonista2} 
                    style={{ fontFamily: 'Belleza', fontSize: 'inherit', color: 'inherit' }}
                    onSave={(val) => handleUpdateProtagonista('protagonista2', val)}
                    textarea={false}
                />
               }
            </motion.h1>
        </div>
    </header>
  );
};


const GraziaDetalles: React.FC<{ data: InvitacionDigitalData['detallesEvento'], fiesta: FiestaEnPlanificacion, paleta: ColorPalette, onUpdate?: (newData: Partial<InvitacionDigitalData>) => void }> = ({ data, fiesta, paleta, onUpdate }) => {
  
  const detallesAMostrar = [
    {...data.ceremoniaReligiosa, icon: Church},
    {...data.ceremoniaCivil, icon: Building},
    {...data.celebracion, icon: GlassWater}
  ].filter(d => d && d.visible);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) { return "Fecha inválida"; }
  };
  
  const renderDetalle = (detalle: DetalleEventoEspecifico & {icon: React.ElementType}) => {
    if (!detalle || !detalle.visible) return null;
    
    const mapUrl = detalle.mapaUrl || (detalle.nombreLugar ? `https://www.google.com/maps?q=${encodeURIComponent(detalle.nombreLugar)}` : '#');
    const Icon = detalle.icon;

    return (
      <div key={detalle.titulo} className="max-w-md mx-auto text-center mb-12 last:mb-0">
        <SectionIcon><Icon className="w-12 h-12 mx-auto mb-4" style={{color: paleta.primary}} /></SectionIcon>
        <h3 className="font-headline text-3xl mb-4" style={{color: paleta.accent}}>{detalle.titulo}</h3>
        {detalle.imagenUrl && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg mb-6">
            <NextImage src={detalle.imagenUrl} alt={`Foto de ${detalle.nombreLugar}`} layout="fill" objectFit="cover" />
          </div>
        )}
        <div className="text-lg space-y-1">
          {detalle.fecha && <p className="font-semibold">{formatDate(detalle.fecha)}</p>}
          {detalle.hora && <p className="text-muted-foreground">{detalle.hora} hs.</p>}
          {detalle.nombreLugar && <p className="text-xl font-semibold mt-1">{detalle.nombreLugar}</p>}
          {detalle.direccionLugar && <p className="text-sm text-muted-foreground">{detalle.direccionLugar}</p>}
        </div>
        {(detalle.mapaUrl || detalle.nombreLugar) && (
          <Button asChild variant="link" className="mt-4 text-lg" style={{color: paleta.primary}}>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-5 h-5 mr-2"/> Ver en Mapa
            </a>
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
        {detallesAMostrar.length > 0 ? (
          detallesAMostrar.map(renderDetalle)
        ) : (
          <p className="text-muted-foreground italic">Los detalles del evento no están configurados.</p>
        )}
    </div>
  );
};

const GraziaRegalos: React.FC<{ data: InvitacionDigitalData['regalos'], paleta: ColorPalette, onUpdate?: (newData: Partial<InvitacionDigitalData>) => void }> = ({ data, paleta, onUpdate }) => {
    const handleUpdate = (updates: Partial<typeof data>) => {
        if(onUpdate) {
            onUpdate({ regalos: { ...data, ...updates } });
        }
    };
    
    return (
        <>
            <SectionIcon><Gift className="w-12 h-12 mx-auto mb-3" style={{color: paleta.primary}}/></SectionIcon>
            <h3 className="font-headline text-3xl mb-3" style={{color: paleta.accent}}>
              <EditableText 
                initialValue={data.titulo?.text || "Lista de Regalos"} 
                style={data.titulo?.style} 
                onSave={v => handleUpdate({ titulo: { ...(data.titulo || {style:{}}), text: v }})} 
                textarea={false}
              />
            </h3>
            <div className="text-muted-foreground max-w-md mx-auto">
              <EditableText 
                initialValue={data.texto?.text || "Tu presencia es nuestro mejor regalo..."} 
                style={data.texto?.style} 
                onSave={v => handleUpdate({ texto: { ...(data.texto || {style:{}}), text: v }})}
                textarea
              />
            </div>
        </>
    );
};

export const GraziaTemplate: React.FC<TemplateProps> = ({ fiesta, invitacionData, socialConnections, isPreview = false, onSectionClick, onUpdate, selectedSectionId, children }) => {
  
  const paletaColores = invitacionData?.cabecera?.paletaColores;
  const primaryColor = paletaColores?.primary || 'hsl(var(--primary))';
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayPause = () => {
    if (isPreview) return; // Disable audio in preview
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };
  
  const socialIcons: Record<SocialPlatformName, React.ElementType> = { Facebook, Instagram, Music, MessageSquare };

  const renderSectionComponent = (seccion: SeccionInvitacion) => {
    if (!seccion.data) return null; // Safety check
    const props = { data: seccion.data, fiesta, paleta: paletaColores!, onUpdate };
    
    const wrapperProps = onSectionClick ? {
      seccion: seccion,
      onClick: () => onSectionClick(seccion.id),
      isSelected: selectedSectionId === seccion.id,
    } : { seccion };
    
    switch (seccion.tipo) {
      case 'bienvenida': return <SectionWrapper {...wrapperProps}><SectionIcon><Heart className="w-12 h-12 mx-auto mb-3" style={{color: primaryColor}} /></SectionIcon><h2 className="font-headline text-2xl mb-4"><EditableText initialValue={seccion.data.titulo?.text || ""} style={seccion.data.titulo?.style} onSave={v => onUpdate?.({ bienvenida: {...seccion.data, titulo: {...(seccion.data.titulo || {style: {}}), text: v}}})} textarea={false} /></h2><div className="max-w-xl mx-auto text-muted-foreground"><EditableText initialValue={seccion.data.texto?.text || ""} style={seccion.data.texto?.style} onSave={v => onUpdate?.({ bienvenida: {...seccion.data, texto: {...(seccion.data.texto || {style: {}}), text: v}}})} textarea/></div></SectionWrapper>;
      case 'cuentaRegresiva': return <SectionWrapper {...wrapperProps}><h3 className="font-headline text-2xl mb-4" style={{color: primaryColor}}>Faltan</h3><CountdownTimer targetDate={fiesta.configuracion.fechaEvento} /></SectionWrapper>;
      case 'detallesEvento': return <SectionWrapper {...wrapperProps}><GraziaDetalles {...props} /></SectionWrapper>;
      case 'regalos': return <SectionWrapper {...wrapperProps}><GraziaRegalos {...props} /></SectionWrapper>;
      case 'confirmacion': return <div id="rsvp" onClick={() => onSectionClick?.(seccion.id)}><div className={cn("relative", selectedSectionId === seccion.id && "border-2 border-primary")}>{children}</div></div>;
      default: return null;
    }
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-background to-muted/30 font-body", isPreview && "overflow-y-auto h-full")} style={{'--theme-primary': primaryColor} as React.CSSProperties}>
       <div onClick={() => onSectionClick?.('cabecera')} className={cn("relative", isPreview && "cursor-pointer")}>
        {isPreview && <div className={cn("absolute inset-0 border-2 transition-all pointer-events-none", selectedSectionId === 'cabecera' ? 'border-primary' : 'border-transparent')}></div>}
        <GraziaCabecera data={invitacionData.cabecera} fiesta={fiesta} paleta={paletaColores} onUpdate={onUpdate} isPreview={isPreview} />
       </div>
       
       <main className={!isPreview ? 'max-w-3xl mx-auto p-4 md:p-8' : ''}>
        {invitacionData.secciones.map((seccion, index) => {
           if(seccion.tipo === 'cabecera') return null;
           const component = renderSectionComponent(seccion);
           if (!component) return null;
            return (
                <React.Fragment key={seccion.id}>
                    {component}
                    {index < invitacionData.secciones.length - 1 && seccion.data.visible && <FloralSeparator color={primaryColor}/>}
                </React.Fragment>
            )
        })}
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
                return (
                    <a key={conn.platform} href={conn.profileUrl || '#'} target="_blank" rel="noopener noreferrer" aria-label={`Perfil de ${conn.platform}`}>
                        <Button variant="ghost" size="icon">
                            {conn.logoUrl ? 
                                <img src={conn.logoUrl} alt={`${conn.platform} logo`} className="w-6 h-6 object-contain" /> :
                                (Icon ? <Icon className="w-6 h-6" /> : null)
                            }
                        </Button>
                    </a>
                );
            })}
          </div>
       </footer>
    </div>
  );
};
