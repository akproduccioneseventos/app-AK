
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SocialConnection, SeccionInvitacion, GiftItem, DetalleEventoEspecifico, TextWithStyle, TextStyle, ProgramaEventoItem } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { Church, Building, PartyPopper, Heart, MapPin, Play, Pause, Facebook, Instagram, Music, MessageSquare, Sparkles, Check, ArrowRight, X, Calendar, User, Mail, Grid, Code, Palette as PaletteIcon, Share2, Camera as CameraIcon, ArrowLeft, Clock, Users as UsersIcon, Link as LinkIcon, QrCode, Download, Utensils, GlassWater, CakeSlice, Diamond, PlusCircle, Gift as GiftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { SocialPlatformName } from '@/types/settings';
import { motion, AnimatePresence } from "framer-motion";
import { WatermarkedImage } from '@/components/watermarked-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { claimGiftFiestaActual, addGiftToRegistryFiestaActual } from '@/app/actions/fiesta-actual';
import { Loader2 } from 'lucide-react';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Textarea } from '@/components/ui/textarea';
import QRCodeStylized from 'qrcode.react';
import { saveSugerenciaMusicalFiestaActual } from '@/app/actions/fiesta-actual';

const formatDate = (dateString?: string) => {
  if (!dateString) return "Fecha no definida";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Camera, Diamond, PartyPopper, Clock,
};

const SectionWrapper: React.FC<{
    seccion: SeccionInvitacion,
    children: React.ReactNode,
    onClick?: () => void,
    isSelected?: boolean,
    className?: string,
    backgroundColor?: string,
    innerClassName?: string;
}> = ({ seccion, children, onClick, isSelected, className, backgroundColor, innerClassName }) => {
    if (!seccion.data?.visible) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            id={seccion.tipo}
            className={cn("relative py-24 px-6 md:px-12", className, onClick && "cursor-pointer group/section")}
            onClick={onClick}
            style={{ backgroundColor }}
        >
            {onClick && <div className={cn("absolute inset-0 border-4 transition-all pointer-events-none z-30", isSelected ? 'border-primary' : 'border-transparent')}></div>}
            
            {seccion.data.imagenFondoUrl && (
                <div className="absolute inset-0 -z-10">
                    <NextImage src={seccion.data.imagenFondoUrl} alt="" layout="fill" objectFit="cover" className="opacity-10 grayscale" />
                    <div className="absolute inset-0 bg-background/90"></div>
                </div>
            )}
            
            <div className={cn("max-w-5xl mx-auto", innerClassName)}>
              {children}
            </div>
        </motion.section>
    );
};

const SectionHeader: React.FC<{ icon: React.ElementType, title: string, subtitle?: string, color: string, style?: TextStyle }> = ({ icon: Icon, title, subtitle, color, style }) => (
    <div className="mb-12 space-y-4">
        <motion.div 
            initial={{ scale: 0 }} 
            whileInView={{ scale: 1 }} 
            viewport={{ once: true }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
            <Icon className="w-8 h-8" style={{ color }} />
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-headline tracking-tight" style={{ color: style?.color || color, fontFamily: style?.fontFamily || 'var(--font-playfair_display)' }}>
            {title}
        </h2>
        {subtitle && <p className="text-muted-foreground text-lg italic">{subtitle}</p>}
        <div className="w-24 h-1 bg-primary/30 mx-auto mt-4 rounded-full"></div>
    </div>
);

export const GraziaTemplate: React.FC<TemplateProps> = ({ fiesta, invitacionData, socialConnections, isPreview = false, onSectionClick, onUpdate, onRsvpSubmit, selectedSectionId }) => {
  const { toast } = useToast();
  const paletaColores = invitacionData.cabecera.paletaColores;
  const primaryColor = paletaColores.primary || 'hsl(var(--primary))';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // RSVP Form State
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpMusicSuggestion, setRsvpMusicSuggestion] = useState('');
  
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSuggestion, setMusicSuggestion] = useState('');
  const [suggesterName, setSuggesterName] = useState('');
  const [isSubmittingMusic, setIsSubmittingMusic] = useState(false);

  useEffect(() => {
    const numCompanions = rsvpGuests > 1 ? rsvpGuests - 1 : 0;
    setCompanionNames(prev => {
        const newNames = Array(numCompanions).fill('');
        for (let i = 0; i < Math.min(prev.length, numCompanions); i++) {
            newNames[i] = prev[i];
        }
        return newNames;
    });
  }, [rsvpGuests]);

  const togglePlayPause = () => {
    if (isPreview) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleRsvpFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !onRsvpSubmit) return;
    setIsSubmittingRsvp(true);
    const success = await onRsvpSubmit({
      nombreCompleto: rsvpName,
      confirmacion: 'Confirmado',
      numeroAsistentes: rsvpGuests,
      mensaje: rsvpMusicSuggestion.trim() ? `Sugerencia: ${rsvpMusicSuggestion}` : '',
      companionNames: companionNames
    });
    if (success) {
      setIsRsvpModalOpen(false);
      setRsvpName('');
      setRsvpGuests(1);
    }
    setIsSubmittingRsvp(false);
  };

  const renderSectionComponent = (seccion: SeccionInvitacion) => {
    if (!seccion.data?.visible) return null;
    const wrapperProps = {
      seccion,
      onClick: onSectionClick ? () => onSectionClick(seccion.id) : undefined,
      isSelected: selectedSectionId === seccion.id,
    };

    switch (seccion.tipo) {
      case 'bienvenida':
        return (
          <SectionWrapper {...wrapperProps} className="bg-white">
            <SectionHeader icon={Heart} title={seccion.data.titulo.text} color={primaryColor} style={seccion.data.titulo.style} />
            <div className="max-w-2xl mx-auto leading-relaxed text-lg text-muted-foreground">
              <EditableText initialValue={seccion.data.texto.text} style={seccion.data.texto.style} onSave={v => onUpdate?.({ bienvenida: { ...seccion.data, texto: { ...seccion.data.texto, text: v } } })} textarea />
            </div>
          </SectionWrapper>
        );

      case 'cuentaRegresiva':
        return (
          <SectionWrapper {...wrapperProps} className="bg-muted/30">
            <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-primary mb-8">La espera termina en</h3>
            <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
          </SectionWrapper>
        );

      case 'detallesEvento':
        return (
          <SectionWrapper {...wrapperProps} className="bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[seccion.data.ceremoniaReligiosa, seccion.data.ceremoniaCivil, seccion.data.celebracion].filter(d => d.visible).map((detalle, idx) => (
                <motion.div key={idx} whileHover={{ y: -10 }} className="space-y-6">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                    <NextImage src={detalle.imagenUrl || 'https://picsum.photos/seed/event/600/800'} alt="" layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-white text-left">
                      <h4 className="text-2xl font-headline mb-1">{detalle.titulo}</h4>
                      <p className="text-sm opacity-90">{detalle.nombreLugar}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="font-semibold text-xl">{formatDate(detalle.fecha)}</p>
                    <p className="text-primary font-bold">{detalle.hora} HS</p>
                    <p className="text-sm text-muted-foreground">{detalle.direccionLugar}</p>
                    <Button asChild variant="outline" className="mt-4 rounded-full border-primary/20 hover:bg-primary/5">
                      <a href={detalle.mapaUrl || '#'} target="_blank"><MapPin className="w-4 h-4 mr-2"/> Cómo llegar</a>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'itinerario':
        return (
          <SectionWrapper {...wrapperProps} className="bg-muted/50">
            <SectionHeader icon={Clock} title="Cronograma" color={primaryColor} />
            <div className="max-w-2xl mx-auto space-y-8 relative">
              <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-primary/20 md:left-1/2 md:-ml-px"></div>
              {(fiesta.programa || []).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }} whileInView={{ opacity: 1, x: 0 }} className={cn("flex items-center gap-8 md:gap-0", i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse")}>
                  <div className="w-full md:w-1/2 md:px-12 text-left md:text-right">
                    {i % 2 === 0 && (
                      <div className="bg-white p-6 rounded-2xl shadow-xl border border-primary/5">
                        <span className="text-primary font-bold text-lg">{item.hora}</span>
                        <h4 className="text-xl font-headline my-1">{item.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 w-14 h-14 rounded-full bg-white border-4 border-primary flex items-center justify-center shrink-0 shadow-lg">
                    {React.createElement(iconMap[item.icono || 'Clock'] || Clock, { className: "w-6 h-6 text-primary" })}
                  </div>
                  <div className="w-full md:w-1/2 md:px-12 text-left">
                    {i % 2 !== 0 && (
                      <div className="bg-white p-6 rounded-2xl shadow-xl border border-primary/5">
                        <span className="text-primary font-bold text-lg">{item.hora}</span>
                        <h4 className="text-xl font-headline my-1">{item.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'galeria':
        return (
          <SectionWrapper {...wrapperProps} className="bg-white">
            <SectionHeader icon={CameraIcon} title="Momentos" color={primaryColor} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(seccion.data.fotos || []).map((url: string, i: number) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className={cn("relative rounded-xl overflow-hidden shadow-lg", i % 3 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square")}>
                  <NextImage src={url} alt="" layout="fill" objectFit="cover" className="hover:scale-110 transition-transform duration-700" />
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'regalos':
        return (
          <SectionWrapper {...wrapperProps} className="bg-muted/20">
            <SectionHeader icon={GiftIcon} title={seccion.data.titulo.text} color={primaryColor} style={seccion.data.titulo.style} />
            <p className="max-w-2xl mx-auto mb-12 text-muted-foreground">{seccion.data.texto.text}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(seccion.data.items || []).map((item: GiftItem) => (
                <Card key={item.id} className="group border-none shadow-xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur">
                  <div className="relative aspect-square">
                    <NextImage src={item.imageUrl || 'https://picsum.photos/seed/gift/400/400'} alt={item.name} layout="fill" objectFit="cover" />
                    {item.isClaimed && <div className="absolute inset-0 bg-primary/60 backdrop-blur-[2px] flex items-center justify-center text-white font-bold text-xl uppercase tracking-widest">Ya Elegido</div>}
                  </div>
                  <CardContent className="p-6">
                    <h4 className="text-xl font-headline mb-2">{item.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    <Button className="w-full mt-6 rounded-full" style={{ backgroundColor: primaryColor }} disabled={item.isClaimed}>
                      {item.isClaimed ? '¡Gracias!' : 'Lo quiero regalar'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'confirmacion':
        return (
          <SectionWrapper {...wrapperProps} className="bg-primary/5 py-32">
            <div className="max-w-xl mx-auto space-y-8">
              <h2 className="text-5xl font-headline" style={{ color: primaryColor }}>¿Nos acompañas?</h2>
              <p className="text-lg">Tu presencia es lo más importante para nosotros. Por favor, confirma antes del {formatDate(fiesta.configuracion.fechaEvento)}.</p>
              <Button size="lg" className="h-16 px-12 rounded-full text-xl font-headline shadow-2xl hover:scale-105 transition-transform" style={{ backgroundColor: primaryColor }} onClick={() => setIsRsvpModalOpen(true)}>
                Confirmar Asistencia
              </Button>
            </div>
          </SectionWrapper>
        );

      default: return null;
    }
  };

  return (
    <div className={cn("min-h-screen bg-background font-body selection:bg-primary/20", isPreview && "h-full overflow-y-auto")}>
      <GraziaCabecera data={invitacionData.cabecera} fiesta={fiesta} paleta={paletaColores} onUpdate={onUpdate} isPreview={isPreview} />
      
      <main>
        {invitacionData.secciones.map(seccion => renderSectionComponent(seccion))}
      </main>

      {/* Música de fondo flotante */}
      {invitacionData.musicaFondoUrl && !isPreview && (
        <div className="fixed bottom-8 right-8 z-50">
          <audio ref={audioRef} src={invitacionData.musicaFondoUrl} loop />
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={togglePlayPause} className="w-14 h-14 rounded-full bg-white shadow-2xl flex items-center justify-center border border-primary/10">
            {isPlaying ? <Pause className="w-6 h-6 text-primary animate-pulse" /> : <Play className="w-6 h-6 text-primary" />}
          </motion.button>
        </div>
      )}

      {/* Modal RSVP Estilizado */}
      <Dialog open={isRsvpModalOpen} onOpenChange={setIsRsvpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-3xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-headline text-primary">Confirmar Asistencia</DialogTitle>
            <DialogDescription className="text-lg">¡Qué alegría que quieras venir!</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRsvpFormSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Tu Nombre Completo</Label>
              <Input value={rsvpName} onChange={e => setRsvpName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-none text-lg" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Cantidad de Personas</Label>
              <Input type="number" value={rsvpGuests} onChange={e => setRsvpGuests(Number(e.target.value))} className="h-12 rounded-xl bg-muted/50 border-none text-lg" min={1} required />
            </div>
            {companionNames.map((name, i) => (
              <div key={i} className="space-y-2 animate-in slide-in-from-top-2">
                <Label className="text-xs text-muted-foreground">Acompañante {i+1}</Label>
                <Input value={name} onChange={e => {
                  const n = [...companionNames]; n[i] = e.target.value; setCompanionNames(n);
                }} className="h-10 rounded-lg bg-muted/30 border-none" />
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-headline" style={{ backgroundColor: primaryColor }} disabled={isSubmittingRsvp}>
                {isSubmittingRsvp ? <Loader2 className="animate-spin" /> : 'Enviar Confirmación'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="py-20 text-center bg-white border-t border-primary/10">
        <h4 className="text-3xl font-headline mb-4" style={{ color: primaryColor }}>{invitacionData.footer.titulo.text}</h4>
        <div className="flex justify-center gap-6 mb-8">
          {socialConnections.filter(c => c.isConnected).map(c => (
            <a key={c.platform} href={c.profileUrl} target="_blank" className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Share2 className="w-5 h-5 text-primary" />
            </a>
          ))}
        </div>
        <p className="text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">{invitacionData.footer.nombreEmpresa.text}</p>
      </footer>
    </div>
  );
};
