
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SeccionInvitacion, GiftItem, TextStyle, Invitado } from '@/types/fiesta';
import type { SocialConnection } from '@/types/settings';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { Church, GlassWater, Gift, MapPin, Calendar, Heart, PartyPopper, Clock, Utensils, ClipboardCopy, Camera, Share2, Sparkles, Send, Loader2, AlertTriangle, Check, Tag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getChatMessages, addChatMessage } from '@/app/actions/social-gallery';
import type { ChatMessage } from '@/types/social-gallery';
import { claimGift } from '@/app/actions/fiesta/regalos.actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export const AllegriaTemplate: React.FC<TemplateProps> = ({ 
    fiesta, 
    invitacionData, 
    socialConnections, 
    onUpdate, 
    onSectionClick, 
    onRsvpSubmit,
    selectedSectionId, 
    isPreview 
}) => {
    const { toast } = useToast();
    const paleta = invitacionData.cabecera.paletaColores;
    const primaryColor = paleta?.primary || '#E11D48';
    
    const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);

    // RSVP form state
    const [rsvpName, setRsvpName] = useState('');
    const [rsvpGuests, setRsvpGuests] = useState(1);
    const [rsvpCategory, setRsvpCategory] = useState<'Adulto' | 'Niño/Adolescente'>('Adulto');
    const [isCeliac, setIsCeliac] = useState(false);
    const [rsvpTag, setRsvpTag] = useState('');
    const [companionNames, setCompanionNames] = useState<string[]>([]);
    const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

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
        const numCompanions = rsvpGuests > 1 ? rsvpGuests - 1 : 0;
        setCompanionNames(prev => {
            const newNames = Array(numCompanions).fill('');
            for (let i = 0; i < Math.min(prev.length, numCompanions); i++) {
                newNames[i] = prev[i];
            }
            return newNames;
        });
    }, [rsvpGuests]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "PRÓXIMAMENTE";
        return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    };

    const handleCopyAccount = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "Los datos bancarios se han copiado." });
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

    const handleRsvpFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rsvpName.trim() || !onRsvpSubmit) return;
        setIsSubmittingRsvp(true);
        try {
            const success = await onRsvpSubmit({
                nombreCompleto: rsvpName,
                confirmacion: 'Confirmado',
                adultsCount: rsvpGuests,
                kidsCount: 0,
                isCeliac: isCeliac,
                mensaje: '',
                companionNames: companionNames,
                tag: rsvpTag || undefined
            });
            if (success) {
                setIsRsvpModalOpen(false);
                setRsvpName('');
                setRsvpGuests(1);
                setIsCeliac(false);
                setRsvpTag('');
            }
        } catch (error: any) {
            toast({ title: "Error al confirmar asistencia", description: error.message || "No se pudo enviar tu confirmación. Verifica tu conexión e inténtalo de nuevo.", variant: "destructive" });
        } finally {
            setIsSubmittingRsvp(false);
        }
    };

    const protagonist1 = fiesta.configuracion.protagonista1Nombre || invitacionData.cabecera.protagonista1;
    const protagonist2 = fiesta.configuracion.protagonista2Nombre || invitacionData.cabecera.protagonista2;
    const subtitleText = fiesta.configuracion.tipoCelebracion || invitacionData.cabecera.subtitulo.text;
    const eventDate = formatDate(fiesta.configuracion.fechaEvento);

    const isXV = fiesta.configuracion.tipoCelebracion === 'XV años';
    const displayWelcomeTitle = (isXV && invitacionData.bienvenida.titulo.text === '¡Nos Casamos!') 
        ? '¡Mis 15 Años!' 
        : invitacionData.bienvenida.titulo.text;

    const relationshipOptions = fiesta.configuracion.tipoCelebracion === 'Boda' 
        ? ["Familia Novio", "Familia Novia", "Amigos Novio", "Amigos Novia", "Trabajo", "Otros"]
        : ["Familia", "Amigos", "Trabajo", "Otros"];

    return (
        <div className={cn("font-body text-slate-900 bg-white w-full max-w-full overflow-x-hidden selection:bg-primary/10", isPreview && "h-full overflow-y-auto")}>
            <section 
                onClick={() => onSectionClick?.('cabecera')}
                className="relative min-h-[60vh] sm:min-h-[70vh] md:min-h-screen flex flex-col items-center justify-end pb-16 sm:pb-24 md:pb-32 overflow-hidden"
            >
                <motion.div 
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 15, ease: "linear" }}
                    className="absolute inset-0 -z-10"
                >
                    {invitacionData.cabecera.videoFondoUrl ? (
                        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                            <source src={invitacionData.cabecera.videoFondoUrl} type="video/mp4" />
                        </video>
                    ) : (
                        <NextImage 
                            src={invitacionData.cabecera.imagenFondoUrl || 'https://picsum.photos/seed/celebration/1200/1600'} 
                            alt="" layout="fill" objectFit="cover" 
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90"></div>
                </motion.div>

                <div className="text-center text-white space-y-6 md:space-y-8 px-4 sm:px-6 relative z-10 w-full max-w-full overflow-hidden">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
                        <span className="text-sm font-black tracking-[0.8em] uppercase opacity-70">
                            {subtitleText}
                        </span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 1.2, type: "spring" }} className="text-4xl sm:text-6xl md:text-[10rem] font-headline font-bold leading-tight md:leading-none tracking-tight md:tracking-tighter break-words">
                        {protagonist1}
                        {protagonist2 && (
                            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                                <span className="text-2xl sm:text-4xl md:text-6xl italic font-dancing" style={{ color: primaryColor }}>&</span>
                                <span>{protagonist2}</span>
                            </div>
                        )}
                    </motion.h1>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="flex items-center justify-center gap-4 md:gap-8 text-base sm:text-xl md:text-2xl font-bold tracking-[0.2em] sm:tracking-[0.4em]">
                        <div className="h-px w-8 sm:w-16 bg-white/30"></div>
                        <span>{eventDate}</span>
                        <div className="h-px w-8 sm:w-16 bg-white/30"></div>
                    </motion.div>
                </div>
                
                {isPreview && selectedSectionId === 'cabecera' && <div className="absolute inset-0 border-8 border-primary z-50 pointer-events-none"></div>}
            </section>

            {invitacionData.cuentaRegresiva.visible && (
                <section className="py-16 sm:py-24 md:py-32 bg-slate-950 text-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" style={{ backgroundColor: primaryColor }}></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" style={{ backgroundColor: primaryColor }}></div>
                    </div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-10 sm:space-y-16 relative z-10">
                        <span className="text-xs font-black tracking-[0.6em] uppercase opacity-40">Cuenta regresiva</span>
                        <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
                    </div>
                </section>
            )}

            {invitacionData.bienvenida.visible && (
                <section className="py-16 sm:py-24 md:py-48 px-4 sm:px-6 bg-white relative overflow-hidden">
                    <div className="max-w-3xl mx-auto text-center space-y-12">
                        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", damping: 12 }}>
                            <Heart className="w-20 h-20 mx-auto text-primary" fill={primaryColor} />
                        </motion.div>
                        <h2 className="text-4xl sm:text-5xl md:text-8xl font-headline font-bold leading-tight tracking-tighter">{displayWelcomeTitle}</h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-500 leading-relaxed font-medium italic px-2 sm:px-4 md:px-12">
                            "{invitacionData.bienvenida.texto.text}"
                        </p>
                    </div>
                </section>
            )}

            <section className="py-16 sm:py-24 md:py-48 bg-slate-50 px-4 sm:px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16 md:gap-24 items-center">
                    {[invitacionData.detallesEvento.ceremoniaReligiosa, invitacionData.detallesEvento.celebracion].filter(d => d.visible).map((detalle, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: i === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className={cn("flex flex-col gap-8 sm:gap-10 md:gap-12", i === 1 && "md:flex-col-reverse")}
                        >
                            <div className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-3xl shadow-slate-200">
                                <NextImage src={detalle.imagenUrl || 'https://picsum.photos/seed/location/1200/1600'} alt="" layout="fill" objectFit="cover" />
                                <div className="absolute top-10 right-10 w-20 h-20 bg-white/90 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center shadow-2xl">
                                    {i === 0 ? <Church className="w-10 h-10 text-primary" style={{ color: primaryColor }} /> : <PartyPopper className="w-10 h-10 text-primary" style={{ color: primaryColor }} />}
                                </div>
                            </div>
                            <div className="space-y-8 px-4">
                                <h3 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold">{detalle.titulo}</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 sm:gap-6 text-base sm:text-lg md:text-xl font-bold">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"><Calendar className="w-6 h-6 text-primary" style={{ color: primaryColor }} /></div>
                                        <span className="uppercase tracking-widest">{formatDate(detalle.fecha || fiesta.configuracion.fechaEvento)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 sm:gap-6 text-base sm:text-lg md:text-xl font-bold">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"><MapPin className="w-6 h-6 text-primary" style={{ color: primaryColor }} /></div>
                                        <span>{detalle.nombreLugar}</span>
                                    </div>
                                </div>
                                <Button asChild className="w-full h-12 sm:h-16 md:h-20 rounded-2xl md:rounded-[2rem] text-sm sm:text-lg md:text-xl font-black shadow-2xl shadow-primary/30" style={{ backgroundColor: primaryColor }}>
                                    <a href={detalle.mapaUrl || '#'}>VER UBICACIÓN</a>
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {invitacionData.itinerario.visible && (
                <section className="py-16 sm:py-24 md:py-48 px-4 sm:px-6 bg-slate-900 text-white text-center">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <Sparkles className="w-20 h-20 mx-auto text-primary" style={{ color: primaryColor }} />
                        <h2 className="text-4xl sm:text-5xl md:text-8xl font-headline font-bold tracking-tighter">Plan de Vuelo</h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-medium italic">Todo lo que pasará en esta noche mágica.</p>
                        <Button 
                            onClick={(e) => { e.stopPropagation(); setIsItineraryModalOpen(true); }}
                            size="lg" 
                            className="h-12 sm:h-16 md:h-20 px-6 sm:px-10 md:px-16 rounded-full text-sm sm:text-xl md:text-2xl font-bold shadow-3xl shadow-primary/20 hover:scale-105 transition-all w-full sm:w-auto"
                            style={{ backgroundColor: primaryColor }}
                        >
                            VER ITINERARIO
                        </Button>
                    </div>
                    
                    <Dialog open={isItineraryModalOpen} onOpenChange={setIsItineraryModalOpen}>
                        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl md:rounded-[3rem] p-6 sm:p-8 md:p-12 border-none shadow-3xl">
                            <DialogHeader className="text-center pb-10 border-b border-slate-100">
                                <DialogTitle className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-slate-900">Cronograma</DialogTitle>
                                <DialogDescription className="text-lg">Momentos clave del evento</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-12 pt-12">
                                {(fiesta.programa || []).map((item) => (
                                    <div key={item.id} className="flex items-center gap-10 text-left">
                                        <div className="text-2xl font-black text-primary min-w-[100px]" style={{ color: primaryColor }}>{item.hora}</div>
                                        <div className="flex-grow space-y-1">
                                            <h4 className="text-2xl font-bold text-slate-800 leading-tight">{item.titulo}</h4>
                                            <p className="text-sm text-slate-400 font-medium">{item.descripcion}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter className="mt-12">
                                <DialogClose asChild><Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-slate-200 text-lg font-bold">Cerrar</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </section>
            )}

            {invitacionData.regalos.visible && (
                <section className="py-16 sm:py-24 md:py-48 px-4 sm:px-6 text-center space-y-12 sm:space-y-16 md:space-y-24 bg-white">
                    <div className="max-w-4xl mx-auto space-y-16">
                        <div className="inline-block p-10 bg-slate-50 rounded-[3rem] shadow-inner">
                            <Gift className="w-16 h-16" style={{ color: primaryColor }} />
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-8xl font-headline font-bold tracking-tighter">{invitacionData.regalos.titulo.text}</h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                            {invitacionData.regalos.texto.text}
                        </p>
                        
                        {invitacionData.regalos.datosBancarios && (
                            <div className="p-6 sm:p-8 md:p-12 border border-slate-200 rounded-2xl md:rounded-[4rem] bg-slate-50/50 backdrop-blur relative group shadow-2xl shadow-slate-100">
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Datos para el regalo</span>
                                <p className="font-mono text-lg sm:text-2xl md:text-4xl tracking-tighter font-black text-slate-900 break-all mb-6 md:mb-8">
                                    {invitacionData.regalos.datosBancarios}
                                </p>
                                <Button 
                                    variant="outline" 
                                    className="h-14 px-10 rounded-2xl border-slate-200 font-bold hover:bg-white"
                                    onClick={() => handleCopyAccount(invitacionData.regalos.datosBancarios)}
                                >
                                    <ClipboardCopy className="w-5 h-5 mr-3"/> COPIAR DATOS
                                </Button>
                            </div>
                        )}

                        {(invitacionData.regalos.items && invitacionData.regalos.items.length > 0) && (
                            <Button 
                                onClick={(e) => { e.stopPropagation(); setIsGiftModalOpen(true); }}
                                size="lg"
                                className="h-12 sm:h-16 md:h-20 px-6 sm:px-10 md:px-16 rounded-2xl md:rounded-[2rem] text-sm sm:text-xl md:text-2xl font-bold shadow-3xl shadow-primary/20 w-full sm:w-auto"
                                style={{ backgroundColor: primaryColor }}
                            >
                                VER MESA DE REGALOS
                            </Button>
                        )}
                    </div>

                    <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
                        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl md:rounded-[4rem] p-6 sm:p-8 md:p-12 border-none shadow-3xl">
                            <DialogHeader className="text-center pb-10 border-b">
                                <DialogTitle className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-slate-900">Sugerencias</DialogTitle>
                                <DialogDescription className="text-xl">Ideas para obsequiarnos (Haz clic para elegir)</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pt-12">
                                {(invitacionData.regalos.items || []).map((item: GiftItem) => (
                                    <Card 
                                        key={item.id} 
                                        onClick={() => handleClaimGift(item)}
                                        className={cn(
                                            "group border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white transition-all",
                                            !item.isClaimed && "cursor-pointer hover:scale-105"
                                        )}
                                    >
                                        <div className="relative aspect-square">
                                            <NextImage src={item.imageUrl || 'https://picsum.photos/seed/gift/600/600'} alt={item.name} layout="fill" objectFit="cover" className="group-hover:scale-110 transition-transform duration-1000" />
                                            {item.isClaimed && <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
                                                <span className="font-black text-2xl uppercase tracking-widest">Ya Elegido</span>
                                                <span className="text-sm font-bold opacity-80 mt-2">Por: {item.claimedBy}</span>
                                            </div>}
                                        </div>
                                        <CardContent className="p-8 text-center space-y-4">
                                            <h4 className="text-2xl font-headline font-bold text-slate-900 leading-tight">{item.name}</h4>
                                            <Button className="w-full h-14 rounded-2xl font-black text-xs tracking-widest shadow-xl" style={{ backgroundColor: primaryColor }} disabled={item.isClaimed}>
                                                {item.isClaimed ? '¡GRACIAS!' : 'ELEGIR'}
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <DialogFooter className="mt-12">
                                <DialogClose asChild><Button variant="outline" className="w-full h-16 rounded-3xl font-bold">Cerrar</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </section>
            )}

            {invitacionData.redesSociales.visible && (
                <section className="py-16 sm:py-24 md:py-48 px-4 sm:px-6 bg-slate-50 text-center">
                    <div className="max-w-2xl mx-auto space-y-12">
                        <MessageSquare className="w-16 h-16 mx-auto" style={{ color: primaryColor }} />
                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-headline font-bold tracking-tighter">Chat de la Previa</h2>
                        <Card className="shadow-2xl border-none rounded-[2rem] overflow-hidden bg-white">
                            <CardContent className="p-0">
                                <ScrollArea className="h-80 p-8" viewportRef={chatEndRef}>
                                    <div className="space-y-6">
                                        {chatMessages.map(msg => (
                                            <div key={msg.id} className="flex flex-col items-start text-left">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">{msg.authorName}</span>
                                                <div className="bg-slate-50 px-6 py-4 rounded-[1.5rem] rounded-tl-none shadow-sm text-sm font-medium text-slate-700 leading-relaxed max-w-[90%]">
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {chatMessages.length === 0 && <p className="text-slate-400 italic py-12">¡Sé el primero en dejar un mensaje!</p>}
                                    </div>
                                </ScrollArea>
                                <form onSubmit={handleSendChat} className="p-6 bg-white border-t flex gap-3">
                                    <Input 
                                        value={newChatMsg} 
                                        onChange={e => setNewChatMsg(e.target.value)} 
                                        placeholder="Escribe un saludo..." 
                                        className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border-none px-4 sm:px-6"
                                    />
                                    <Button type="submit" disabled={isSendingChat || !newChatMsg.trim()} size="icon" className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-xl shrink-0" style={{ backgroundColor: primaryColor }}>
                                        {isSendingChat ? <Loader2 className="animate-spin w-5 h-5"/> : <Send className="w-5 h-5" />}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            )}

            {invitacionData.confirmacion.visible && (
                <section className="py-16 sm:py-24 md:py-48 bg-slate-900 text-white text-center px-4 sm:px-6 relative overflow-hidden">
                    <div className="max-w-2xl mx-auto space-y-12 relative z-10">
                        <span className="text-xs font-black tracking-[0.6em] uppercase opacity-40">RSVP</span>
                        <h2 className="text-4xl sm:text-5xl md:text-8xl font-headline font-bold tracking-tighter" style={{ color: primaryColor }}>¿Vienes?</h2>
                        <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                            Tu presencia es el mejor regalo. Por favor, confirma tu asistencia antes del 
                            <span className="block mt-2 text-white font-bold text-xl sm:text-2xl md:text-3xl uppercase tracking-widest">{formatDate(fiesta.configuracion.fechaEvento)}</span>
                        </p>
                        <Button 
                            onClick={() => setIsRsvpModalOpen(true)}
                            size="lg" 
                            className="h-12 sm:h-16 md:h-20 px-6 sm:px-10 md:px-16 rounded-full text-sm sm:text-xl md:text-2xl font-bold shadow-3xl shadow-primary/20 hover:scale-105 transition-all duration-500 w-full sm:w-auto" 
                            style={{ backgroundColor: primaryColor }}
                        >
                            CONFIRMAR ASISTENCIA
                        </Button>
                    </div>
                </section>
            )}

            <footer className="py-16 sm:py-24 md:py-48 bg-slate-950 text-white text-center px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>
                <div className="relative z-10 space-y-12">
                    <h2 className="text-4xl sm:text-6xl md:text-9xl font-dancing leading-none" style={{ color: primaryColor }}>
                        {invitacionData.footer.titulo.text}
                    </h2>
                    <div className="flex justify-center gap-4 sm:gap-6 md:gap-10 flex-wrap">
                        {socialConnections.filter(c => c.isConnected).map(c => (
                            <a key={c.platform} href={c.profileUrl} target="_blank" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all duration-500 group">
                                <Share2 className="w-8 h-8 opacity-50 group-hover:opacity-100" />
                            </a>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <div className="w-24 h-1 bg-white/10 mx-auto rounded-full"></div>
                        <p className="text-xs font-black tracking-[0.6em] uppercase opacity-30">
                            {invitacionData.footer.nombreEmpresa.text}
                        </p>
                    </div>
                </div>
            </footer>

            <Dialog open={isRsvpModalOpen} onOpenChange={setIsRsvpModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl md:rounded-[2.5rem] p-5 sm:p-8 md:p-10 border-none shadow-3xl">
                    <DialogHeader className="text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${primaryColor}1A` }}>
                            <Check className="w-10 h-10 text-primary" style={{ color: primaryColor }} />
                        </div>
                        <DialogTitle className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-slate-900">¡Te esperamos!</DialogTitle>
                        <DialogDescription className="text-base">Completa tus datos para confirmar.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRsvpFormSubmit} className="space-y-8 pt-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Tu Nombre Completo</Label>
                            <Input value={rsvpName} onChange={e => setRsvpName(e.target.value)} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border-none text-base sm:text-lg font-bold focus-visible:ring-2" style={{ "--tw-ring-color": primaryColor } as any} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">¿Cuántos vienen?</Label>
                                <Input type="number" value={rsvpGuests} onChange={e => setRsvpGuests(Number(e.target.value))} className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border-none text-base sm:text-lg font-bold focus-visible:ring-2" style={{ "--tw-ring-color": primaryColor } as any} min={1} required />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Categoría</Label>
                                <Select value={rsvpCategory} onValueChange={(v) => setRsvpCategory(v as any)}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Adulto">Adulto</SelectItem>
                                        <SelectItem value="Niño/Adolescente">Niño / Adol.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {invitacionData.confirmacion.showRelationshipTags && (
                            <div className="space-y-3">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Relación / Grupo</Label>
                                <Select value={rsvpTag} onValueChange={setRsvpTag}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
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
                                <Label htmlFor="celiac-switch-all" className="text-sm font-bold text-amber-900">Soy Celíaco</Label>
                            </div>
                            <Switch id="celiac-switch-all" checked={isCeliac} onCheckedChange={setIsCeliac} />
                        </div>
                        {companionNames.map((name, i) => (
                            <div key={i} className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">Nombre Acompañante {i+1}</Label>
                                <Input value={name} onChange={e => {
                                    const n = [...companionNames]; n[i] = e.target.value; setCompanionNames(n);
                                }} className="h-12 rounded-xl bg-slate-50 border-none text-sm" />
                            </div>
                        ))}
                        <DialogFooter>
                            <Button type="submit" className="w-full h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-[1.5rem] text-sm sm:text-base md:text-lg font-black tracking-widest shadow-2xl shadow-primary/20" style={{ backgroundColor: primaryColor }} disabled={isSubmittingRsvp}>
                                {isSubmittingRsvp ? <Loader2 className="animate-spin w-6 h-6" /> : 'CONFIRMAR'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
