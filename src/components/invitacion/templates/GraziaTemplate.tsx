'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SeccionInvitacion, GiftItem, ProgramaEventoItem, TextStyle, Invitado } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { 
  Church, 
  MapPin, 
  Play, 
  Pause, 
  Heart, 
  PartyPopper, 
  Clock, 
  Utensils, 
  GlassWater, 
  Music, 
  CakeSlice, 
  Camera as CameraIcon, 
  Diamond, 
  Sparkles, 
  Gift as GiftIcon,
  ClipboardCopy,
  Calendar,
  ChevronDown,
  Share2,
  Check,
  Send,
  Loader2,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { getChatMessages, addChatMessage } from '@/app/actions/social-gallery';
import type { ChatMessage } from '@/types/social-gallery';
import { claimGift } from '@/app/actions/fiesta/regalos.actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TemplateProps {
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections: SocialConnection[];
  isPreview?: boolean;
  onSectionClick?: (sectionId: string) => void;
  onUpdate?: (newData: Partial<InvitacionDigitalData>) => void;
  onRsvpSubmit?: (submission: any) => Promise<boolean>;
  selectedSectionId?: string | null;
}

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Camera: CameraIcon, Diamond, PartyPopper, Clock,
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "PRÓXIMAMENTE";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).toUpperCase();
  } catch (e) {
    return 'FECHA INVÁLIDA';
  }
};

const SectionWrapper: React.FC<{
    seccion: SeccionInvitacion,
    children: React.ReactNode,
    onClick?: () => void,
    isSelected?: boolean,
    className?: string,
    backgroundColor?: string,
    innerClassName?: string,
}> = ({ seccion, children, onClick, isSelected, className, backgroundColor, innerClassName }) => {
    if (!seccion.data?.visible) return null;

    return (
        <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            id={seccion.tipo}
            className={cn("relative py-24 md:py-32 px-6 overflow-hidden", className, onClick && "cursor-pointer group/section")}
            onClick={onClick}
            style={{ backgroundColor }}
        >
            {onClick && <div className={cn("absolute inset-0 border-4 transition-all duration-500 pointer-events-none z-40", isSelected ? 'border-primary' : 'border-transparent')}></div>}
            <div className={cn("max-w-4xl mx-auto relative z-10", innerClassName)}>
              {children}
            </div>
        </motion.section>
    );
};

const SectionHeader: React.FC<{ icon: React.ElementType, title: string, subtitle?: string, color: string, style?: TextStyle }> = ({ icon: Icon, title, subtitle, color, style }) => (
    <div className="mb-12 md:mb-16 space-y-4 md:space-y-6 text-center">
        <motion.div 
            initial={{ scale: 0, rotate: -180 }} 
            whileInView={{ scale: 1, rotate: 0 }} 
            viewport={{ once: true }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-xl flex items-center justify-center mx-auto mb-6 md:mb-8 border border-slate-50"
        >
            <Icon className="w-8 h-8 md:w-10 md:h-10" style={{ color }} />
        </motion.div>
        <div className="space-y-2">
            {subtitle && (
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-slate-400 block mb-2">
                    {subtitle}
                </span>
            )}
            <h2 className="text-4xl md:text-7xl font-headline font-bold leading-tight text-slate-900" style={{ color: style?.color || 'inherit', fontFamily: style?.fontFamily || 'var(--font-belleza)' }}>
                {title}
            </h2>
        </div>
        <div className="w-16 md:w-20 h-1 mx-auto mt-6 md:mt-8 rounded-full" style={{ backgroundColor: color, opacity: 0.3 }}></div>
    </div>
);

const GraziaCabecera: React.FC<{ data: any, fiesta: FiestaEnPlanificacion, paleta: ColorPalette, isPreview: boolean }> = ({ data, fiesta, paleta }) => {
    const protagonist1 = fiesta.configuracion.protagonista1Nombre || data.protagonista1;
    const protagonist2 = fiesta.configuracion.protagonista2Nombre || data.protagonista2;
    const subtitleText = fiesta.configuracion.tipoCelebracion || data.subtitulo?.text;
    const eventDate = formatDate(fiesta.configuracion.fechaEvento);

    return (
        <section className="relative h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-slate-50">
            <motion.div 
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 -z-10"
            >
                {data.videoFondoUrl ? (
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src={data.videoFondoUrl} type="video/mp4" />
                    </video>
                ) : (
                    <NextImage src={data.imagenFondoUrl || 'https://picsum.photos/seed/bg/1200/1600'} alt="" layout="fill" objectFit="cover" />
                )}
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white/90"></div>
            </motion.div>

            <div className="space-y-8 md:space-y-12 px-6">
                {data.logoUrl && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <NextImage src={data.logoUrl} alt="Logo" width={100} height={100} className="mx-auto drop-shadow-2xl md:w-[120px] md:h-[120px]" />
                    </motion.div>
                )}
                
                <div className="space-y-4 md:space-y-6">
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-[10px] md:text-sm font-black tracking-[0.6em] uppercase text-primary block" style={{ color: paleta.primary }}>
                        {subtitleText}
                    </motion.span>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1 }} className="text-5xl md:text-[9rem] font-headline font-bold text-slate-900 leading-none tracking-tighter">
                        {protagonist1}
                        {protagonist2 && (
                            <>
                                <span className="block text-3xl md:text-6xl my-2 md:my-4 italic font-dancing text-primary" style={{ color: paleta.primary }}>&</span>
                                {protagonist2}
                            </>
                        )}
                    </motion.h1>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="flex items-center justify-center gap-4 md:gap-8 text-sm md:text-xl font-headline font-bold text-slate-600 tracking-[0.3em]">
                    <div className="h-px w-8 md:w-16 bg-slate-300"></div>
                    <span>{eventDate}</span>
                    <div className="h-px w-8 md:w-16 bg-slate-300"></div>
                </motion.div>
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 1 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2"
            >
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Scroll</span>
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-px h-12 md:h-16 bg-gradient-to-b from-primary to-transparent" style={{ backgroundColor: paleta.primary }}></motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export const GraziaTemplate: React.FC<TemplateProps> = ({ fiesta, invitacionData, socialConnections, isPreview = false, onSectionClick, onUpdate, onRsvpSubmit, selectedSectionId }) => {
  const { toast } = useToast();
  const paletaColores = invitacionData.cabecera.paletaColores;
  const primaryColor = paletaColores.primary || 'hsl(var(--primary))';

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  
  // RSVP form state - Refactorizado para cupos por categoría
  const [rsvpName, setRsvpName] = useState('');
  const [numAdults, setNumAdults] = useState(1);
  const [numKids, setNumKids] = useState(0);
  const [isCeliac, setIsCeliac] = useState(false);
  const [rsvpTag, setRsvpTag] = useState('');
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpMusicSuggestion, setRsvpMusicSuggestion] = useState('');

  // Pre-party Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMsg, setNewChatMsg] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPreview && fiesta.id) {
        getChatMessages(fiesta.id).then(setChatMessages);
        const interval = setInterval(() => {
            getChatMessages(fiesta.id).then(setChatMessages);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [fiesta.id, isPreview]);

  useEffect(() => {
    const totalOthers = (numAdults + numKids) - 1;
    const numCompanions = Math.max(0, totalOthers);
    setCompanionNames(prev => {
        const newNames = Array(numCompanions).fill('');
        for (let i = 0; i < Math.min(prev.length, numCompanions); i++) {
            newNames[i] = prev[i];
        }
        return newNames;
    });
  }, [numAdults, numKids]);

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
    
    try {
      const success = await onRsvpSubmit({
        nombreCompleto: rsvpName,
        confirmacion: 'Confirmado',
        adultsCount: numAdults,
        kidsCount: numKids,
        isCeliac: isCeliac,
        mensaje: rsvpMusicSuggestion.trim() ? `Sugerencia: ${rsvpMusicSuggestion}` : '',
        companionNames: companionNames,
        tag: rsvpTag || undefined
      });
      
      if (success) {
        setIsRsvpModalOpen(false);
        setRsvpName('');
        setNumAdults(1);
        setNumKids(0);
        setIsCeliac(false);
        setRsvpTag('');
      }
    } catch (error: any) {
      toast({ title: "Error al confirmar asistencia", description: error.message || "No se pudo enviar tu confirmación. Verifica tu conexión e inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newChatMsg.trim() || isPreview) return;
      setIsSendingChat(true);
      const res = await addChatMessage(fiesta.id, newChatMsg, rsvpName || "Invitado");
      if (res.success) {
          setNewChatMsg('');
          getChatMessages(fiesta.id).then(setChatMessages);
      }
      setIsSendingChat(false);
  };

  const handleClaimGift = async (gift: GiftItem) => {
      if (isPreview || gift.isClaimed) return;
      const guestName = prompt("Para reservar este regalo, dinos tu nombre:");
      if (!guestName) return;
      
      const res = await claimGift(fiesta.id, gift.id, guestName);
      if (res.success) {
          toast({ title: "¡Regalo Reservado!", description: "Gracias por tu detalle." });
      }
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Los datos bancarios se han copiado al portapapeles." });
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
        const isXV = fiesta.configuracion.tipoCelebracion === 'XV años';
        const welcomeTitle = (isXV && seccion.data.titulo.text === '¡Nos Casamos!') ? '¡Mis 15 Años!' : seccion.data.titulo.text;

        return (
          <SectionWrapper {...wrapperProps} className="bg-white">
            <SectionHeader icon={Heart} title={welcomeTitle} color={primaryColor} style={seccion.data.titulo.style} />
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-lg md:text-2xl text-slate-500 font-medium leading-relaxed italic">
                <EditableText 
                    initialValue={seccion.data.texto.text} 
                    style={seccion.data.texto.style} 
                    onSave={v => onUpdate?.({ bienvenida: { ...seccion.data, texto: { ...seccion.data.texto, text: v } } })} 
                    textarea 
                />
              </div>
            </div>
          </SectionWrapper>
        );

      case 'cuentaRegresiva':
        return (
          <SectionWrapper {...wrapperProps} className="bg-slate-900 text-white text-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="space-y-8 md:space-y-12">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-primary/60" style={{ color: `${primaryColor}99` }}>La espera termina en</span>
                <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
            </motion.div>
          </SectionWrapper>
        );

      case 'detallesEvento':
        return (
          <SectionWrapper {...wrapperProps} className="bg-white" innerClassName="max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-8">
              {[seccion.data.ceremoniaReligiosa, seccion.data.ceremoniaCivil, seccion.data.celebracion].filter(d => d?.visible).map((detalle, idx) => (
                <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    className="space-y-6 md:space-y-8"
                >
                  <div className="relative aspect-[3/4] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl md:shadow-3xl shadow-slate-200 group">
                    <NextImage src={detalle.imagenUrl || 'https://picsum.photos/seed/event/800/1200'} alt="" layout="fill" objectFit="cover" className="group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 text-white text-left">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4">
                        {idx === 0 ? <Church className="w-5 h-5 md:w-6 md:h-6" /> : <PartyPopper className="w-5 h-5 md:w-6 md:h-6" />}
                      </div>
                      <h4 className="text-2xl md:text-3xl font-headline font-bold mb-1 md:mb-2">{detalle.titulo}</h4>
                      <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest opacity-70">{detalle.nombreLugar}</p>
                    </div>
                  </div>
                  <div className="space-y-3 md:space-y-4 text-center px-2">
                    <div className="space-y-1">
                        <p className="font-bold text-xl md:text-2xl text-slate-800">{formatDate(detalle.fecha || fiesta.configuracion.fechaEvento)}</p>
                        <p className="text-primary font-black text-lg md:text-xl tracking-tighter" style={{ color: primaryColor }}>{detalle.hora || (idx === 2 ? fiesta.configuracion.horaInicio : '')} HS</p>
                    </div>
                    <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed">{detalle.direccionLugar}</p>
                    <Button asChild variant="outline" className="mt-2 md:mt-4 rounded-xl h-10 md:h-12 px-6 md:px-8 border-slate-200 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all font-bold text-xs md:text-sm">
                      <a href={detalle.mapaUrl || '#'} target="_blank"><MapPin className="w-3 h-3 md:w-4 md:h-4 mr-2"/> VER UBICACIÓN</a>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'itinerario':
        return (
          <SectionWrapper {...wrapperProps} className="bg-slate-50 text-center">
            <SectionHeader icon={Clock} title="Itinerario" subtitle="Los momentos que harán esta noche mágica" color={primaryColor} />
            <div className="max-w-xl mx-auto">
                <Button 
                    onClick={(e) => { e.stopPropagation(); setIsItineraryModalOpen(true); }}
                    size="lg" 
                    className="rounded-2xl h-14 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold shadow-2xl hover:scale-105 transition-all"
                    style={{ backgroundColor: primaryColor }}
                >
                    <Clock className="w-4 h-4 md:w-5 md:h-5 mr-3"/> ABRIR CRONOGRAMA
                </Button>
            </div>
            
            <Dialog open={isItineraryModalOpen} onOpenChange={setIsItineraryModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-3xl">
                    <DialogHeader className="text-center pb-6 md:pb-8 border-b">
                        <DialogTitle className="text-3xl md:text-4xl font-headline font-bold text-slate-900">Cronograma</DialogTitle>
                        <DialogDescription className="text-sm md:text-base">Momentos clave del evento</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-8 md:space-y-10 pt-8 md:pt-10 relative">
                        <div className="absolute left-[19px] md:left-[23px] top-10 bottom-10 w-px bg-slate-100"></div>
                        {(fiesta.programa && fiesta.programa.length > 0 ? fiesta.programa : []).map((item) => (
                            <div key={item.id} className="relative flex items-start gap-6 md:gap-8">
                                <div className="relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xl shadow-slate-100">
                                    {React.createElement(iconMap[item.icono || 'Clock'] || Clock, { className: "w-5 h-5 md:w-6 md:h-6 text-primary", style: { color: primaryColor } })}
                                </div>
                                <div className="pt-1 md:pt-1.5 text-left space-y-0.5 md:space-y-1">
                                    <span className="text-primary font-black text-[10px] md:text-xs uppercase tracking-widest" style={{ color: primaryColor }}>{item.hora}</span>
                                    <h4 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{item.titulo}</h4>
                                    <p className="text-xs md:text-sm text-slate-400 font-medium">{item.descripcion}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="mt-8 md:mt-10">
                        <DialogClose asChild><Button variant="secondary" className="w-full h-12 md:h-14 rounded-xl md:rounded-[2.5rem] font-bold">ENTENDIDO</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </SectionWrapper>
        );

      case 'galeria':
        return (
          <SectionWrapper {...wrapperProps} className="bg-white">
            <SectionHeader icon={CameraIcon} title="Nuestros Momentos" color={primaryColor} />
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
              {(seccion.data.fotos || []).map((url: string, i: number) => (
                <motion.div 
                    key={i} 
                    whileHover={{ y: -5 }} 
                    className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl border-2 md:border-4 border-white inline-block w-full"
                >
                  <NextImage src={url} alt="" width={800} height={1200} className="w-full h-auto" />
                </motion.div>
              ))}
            </div>
          </SectionWrapper>
        );

      case 'regalos':
        return (
          <SectionWrapper {...wrapperProps} className="bg-slate-50">
            <SectionHeader icon={GiftIcon} title={seccion.data.titulo.text} subtitle="Ideas por si quieres obsequiarnos algo" color={primaryColor} style={seccion.data.titulo.style} />
            <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 text-center">
                <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed italic">{seccion.data.texto.text}</p>
                
                {seccion.data.datosBancarios && (
                    <div className="p-8 md:p-12 border border-slate-200 rounded-[2.5rem] md:rounded-[3rem] bg-white shadow-xl md:shadow-2xl shadow-slate-200/50 relative group">
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-3 md:mb-4">Transferencia Bancaria</p>
                        <p className="text-xl md:text-2xl font-mono break-all font-black text-slate-800 tracking-tight">
                            {seccion.data.datosBancarios}
                        </p>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-4 md:mt-6 text-primary font-bold hover:bg-primary/5 rounded-full text-xs"
                            onClick={(e) => { e.stopPropagation(); handleCopyAccount(seccion.data.datosBancarios); }}
                        >
                            <ClipboardCopy className="w-5 h-5 mr-2"/> COPIAR DATOS
                        </Button>
                    </div>
                )}

                {(seccion.data.items && seccion.data.items.length > 0) && (
                    <Button 
                        onClick={(e) => { e.stopPropagation(); setIsGiftModalOpen(true); }}
                        size="lg"
                        className="rounded-full h-14 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold shadow-2xl hover:scale-105 transition-all"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <GiftIcon className="w-4 h-4 md:w-5 md:h-5 mr-3"/> VER LISTA DE REGALOS
                    </Button>
                )}
            </div>

            <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border-none shadow-3xl">
                    <DialogHeader className="text-center pb-6 md:pb-8 border-b">
                        <DialogTitle className="text-3xl md:text-4xl font-headline font-bold text-slate-900">Mesa de Regalos</DialogTitle>
                        <DialogDescription className="text-sm md:text-base">Haz clic en un regalo para elegirlo</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 pt-8 md:pt-10">
                        {(seccion.data.items || []).map((item: GiftItem) => (
                            <Card 
                                key={item.id} 
                                onClick={() => handleClaimGift(item)}
                                className={cn(
                                    "group border-none shadow-lg md:shadow-xl rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-slate-50 transition-all",
                                    !item.isClaimed && "cursor-pointer hover:scale-105"
                                )}
                            >
                                <div className="relative aspect-square">
                                    <NextImage src={item.imageUrl || 'https://picsum.photos/seed/gift/600/600'} alt={item.name} layout="fill" objectFit="cover" className="group-hover:scale-110 transition-transform duration-1000" />
                                    {item.isClaimed && <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                                        <span className="font-black text-xl md:text-2xl uppercase tracking-widest text-center">YA ELEGIDO</span>
                                        <span className="text-xs md:text-sm font-bold opacity-80 mt-1 md:mt-2">Por: {item.claimedBy}</span>
                                    </div>}
                                </div>
                                <CardContent className="p-6 md:p-8 text-center space-y-3 md:space-y-4">
                                    <h4 className="text-xl md:text-2xl font-headline font-bold text-slate-800 leading-tight">{item.name}</h4>
                                    <p className="text-xs md:text-sm text-slate-400 font-medium line-clamp-2">{item.description}</p>
                                    <Button className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm tracking-widest shadow-lg shadow-primary/20" style={{ backgroundColor: primaryColor }} disabled={item.isClaimed}>
                                        {item.isClaimed ? '¡GRACIAS!' : 'ELEGIR REGALO'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <DialogFooter className="mt-8 md:mt-10">
                        <DialogClose asChild><Button variant="outline" className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-bold">VOLVER</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </SectionWrapper>
        );

      case 'redesSociales':
        return (
          <SectionWrapper {...wrapperProps} className="bg-white text-center">
            <SectionHeader icon={CameraIcon} title="Chat de la Previa" subtitle="¡Dinos algo antes de la fiesta!" color={primaryColor} />
            <Card className="max-w-2xl mx-auto shadow-xl md:shadow-2xl border-none rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-slate-50">
                <CardContent className="p-0">
                    <ScrollArea className="h-64 md:h-80 p-4 md:p-8" viewportRef={chatEndRef}>
                        <div className="space-y-4 md:space-y-6">
                            {chatMessages.map(msg => (
                                <div key={msg.id} className="flex flex-col items-start text-left">
                                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1 ml-3 md:ml-4">{msg.authorName}</span>
                                    <div className="bg-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-[1.5rem] rounded-tl-none shadow-sm text-xs md:text-sm font-medium text-slate-700 leading-relaxed max-w-[90%] border border-slate-100">
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {chatMessages.length === 0 && <p className="text-slate-400 italic py-8 md:py-12 text-sm">¡Sé el primero en dejar un mensaje!</p>}
                        </div>
                    </ScrollArea>
                    <form onSubmit={handleSendChat} className="p-4 md:p-6 bg-white border-t flex gap-2 md:gap-3">
                        <Input 
                            value={newChatMsg} 
                            onChange={e => setNewChatMsg(e.target.value)} 
                            placeholder="Escribe un saludo..." 
                            className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-none px-4 md:px-6 text-sm focus-visible:ring-2"
                            style={{ "--tw-ring-color": primaryColor } as any}
                        />
                        <Button type="submit" disabled={isSendingChat || !newChatMsg.trim()} size="icon" className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl shadow-xl shrink-0" style={{ backgroundColor: primaryColor }}>
                            {isSendingChat ? <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5"/> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                        </Button>
                    </form>
                </CardContent>
            </Card>
          </SectionWrapper>
        );

      case 'confirmacion':
        return (
          <SectionWrapper {...wrapperProps} className="bg-slate-900 text-white py-32 md:py-48 text-center relative">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-primary/10 rounded-full blur-[80px] md:blur-[100px] -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: `${primaryColor}1A` }}></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-primary/5 rounded-full blur-[100px] md:blur-[120px] translate-x-1/2 translate-y-1/2" style={{ backgroundColor: `${primaryColor}0D` }}></div>
            </div>
            <div className="max-w-2xl mx-auto space-y-8 md:space-y-12 relative z-10">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-primary/60" style={{ color: `${primaryColor}99` }}>RSVP</span>
              <h2 className="text-5xl md:text-8xl font-headline font-bold leading-none tracking-tighter" style={{ color: primaryColor }}>¿Vienes?</h2>
              <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed px-4">
                Tu presencia es el mejor regalo. Por favor, confirma tu asistencia antes del 
                <span className="block mt-2 text-white font-bold text-xl md:text-2xl uppercase tracking-widest">{formatDate(fiesta.configuracion.fechaEvento)}</span>
              </p>
              <Button size="lg" className="h-16 md:h-20 px-10 md:px-16 rounded-full text-lg md:text-xl font-bold shadow-2xl hover:scale-105 transition-all duration-500" style={{ backgroundColor: primaryColor }} onClick={() => setIsRsvpModalOpen(true)}>
                CONFIRMAR ASISTENCIA
              </Button>
            </div>
          </SectionWrapper>
        );

      default: return null;
    }
  };

  const relationshipOptions = fiesta.configuracion.tipoCelebracion === 'Boda' 
    ? ["Familia Novio", "Familia Novia", "Amigos Novio", "Amigos Novia", "Trabajo", "Otros"]
    : ["Familia", "Amigos", "Trabajo", "Otros"];

  const showKidsSelector = (Number(fiesta.configuracion.invitadosNinos) || 0) > 0;

  return (
    <div className={cn("min-h-screen bg-white font-body selection:bg-primary/20 selection:text-white", isPreview && "h-full overflow-y-auto")}>
      <GraziaCabecera data={invitacionData.cabecera} fiesta={fiesta} paleta={paletaColores} isPreview={isPreview} />
      
      <main className="relative">
        <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50 flex flex-col gap-3 md:gap-4">
            {invitacionData.musicaFondoUrl && !isPreview && (
                <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    onClick={togglePlayPause} 
                    className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center border border-slate-100 group"
                >
                    {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 text-primary animate-pulse" /> : <Play className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-primary transition-colors" />}
                </motion.button>
            )}
        </div>

        {invitacionData.secciones.map(seccion => renderSectionComponent(seccion))}
      </main>

      <footer className="py-24 md:py-32 text-center bg-slate-50 px-6 border-t border-slate-100">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="space-y-8 md:space-y-12">
            <h4 className="text-4xl md:text-7xl font-dancing text-slate-800" style={{ color: primaryColor }}>{invitacionData.footer?.titulo?.text ?? ''}</h4>
            <div className="flex justify-center gap-6 md:gap-8">
            {socialConnections.filter(c => c.isConnected).map(c => (
                <a key={c.platform} href={c.profileUrl} target="_blank" className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 text-slate-400">
                <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                </a>
            ))}
            </div>
            <div className="space-y-2">
                <div className="w-12 md:w-16 h-1 bg-primary/20 mx-auto rounded-full mb-4 md:mb-6"></div>
                <p className="text-[8px] md:text-[10px] font-black tracking-[0.5em] text-slate-300 uppercase">{invitacionData.footer?.nombreEmpresa?.text ?? ''}</p>
            </div>
        </motion.div>
      </footer>
      
      <audio ref={audioRef} src={invitacionData.musicaFondoUrl} loop />

      <Dialog open={isRsvpModalOpen} onOpenChange={setIsRsvpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-none shadow-3xl">
          <DialogHeader className="text-center space-y-3 md:space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${primaryColor}1A` }}>
                <Check className="w-8 h-8 md:w-10 md:h-10 text-primary" style={{ color: primaryColor }} />
            </div>
            <DialogTitle className="text-3xl md:text-4xl font-headline font-bold text-slate-900">¡Te esperamos!</DialogTitle>
            <DialogDescription className="text-sm md:text-base font-medium">Confirma tu asistencia y la de tus acompañantes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRsvpFormSubmit} className="space-y-6 md:space-y-8 pt-4 md:pt-6">
            <div className="space-y-2 md:space-y-3">
              <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Tu Nombre Completo</Label>
              <Input value={rsvpName} onChange={e => setRsvpName(e.target.value)} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-none text-base md:text-lg font-bold focus-visible:ring-2" style={{ "--tw-ring-color": primaryColor } as any} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 md:space-y-3">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Nº Adultos</Label>
                    <Input type="number" value={numAdults} onChange={e => setNumAdults(Math.max(1, Number(e.target.value)))} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-none text-base md:text-lg font-bold focus-visible:ring-2" style={{ "--tw-ring-color": primaryColor } as any} min={1} required />
                </div>
                {showKidsSelector ? (
                    <div className="space-y-2 md:space-y-3">
                        <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Nº Niños/Adolescentes</Label>
                        <Input type="number" value={numKids} onChange={e => setNumKids(Math.max(0, Number(e.target.value)))} className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-none text-base md:text-lg font-bold focus-visible:ring-2" style={{ "--tw-ring-color": primaryColor } as any} min={0} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center">Fiesta Solo Adultos</p>
                    </div>
                )}
            </div>

            {invitacionData.confirmacion?.showRelationshipTags && (
                <div className="space-y-2 md:space-y-3">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Relación / Grupo</Label>
                    <Select value={rsvpTag} onValueChange={setRsvpTag}>
                        <SelectTrigger className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 border-none font-bold">
                            <SelectValue placeholder="Selecciona tu relación..." />
                        </SelectTrigger>
                        <SelectContent>
                            {relationshipOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <Label htmlFor="celiac-switch" className="text-sm font-bold text-amber-900">Soy Celíaco</Label>
                </div>
                <Switch id="celiac-switch" checked={isCeliac} onCheckedChange={setIsCeliac} />
            </div>

            {companionNames.map((name, i) => (
              <div key={i} className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Nombre Acompañante {i+1}</Label>
                <Input value={name} onChange={e => {
                  const n = [...companionNames]; n[i] = e.target.value; setCompanionNames(n);
                }} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-50 border-none text-sm" />
              </div>
            ))}
            
            {invitacionData.musica?.visible && (
                <div className="space-y-2 md:space-y-3">
                    <Label className="text-[9px] md:text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Sugerencia Musical</Label>
                    <Input value={rsvpMusicSuggestion} onChange={e => setRsvpMusicSuggestion(e.target.value)} placeholder={invitacionData.musica.placeholder} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-slate-50 border-none text-sm" />
                </div>
            )}

            <DialogFooter>
              <Button type="submit" className="w-full h-14 md:h-16 rounded-xl md:rounded-[1.5rem] text-base md:text-lg font-black tracking-widest shadow-2xl shadow-primary/20" style={{ backgroundColor: primaryColor }} disabled={isSubmittingRsvp}>
                {isSubmittingRsvp ? <Loader2 className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : 'ENVIAR CONFIRMACIÓN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
