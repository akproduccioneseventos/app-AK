
'use client';

import React, { useState } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SocialConnection, SeccionInvitacion } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { Church, GlassWater, Gift, MapPin, Calendar, Heart, PartyPopper, Clock, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import type { DetalleEventoEspecifico } from '@/types/fiesta';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface TemplateProps {
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections: SocialConnection[];
  isPreview?: boolean;
  onSectionClick?: (sectionId: string) => void;
  onUpdate?: (newData: Partial<InvitacionDigitalData>) => void;
  selectedSectionId?: string | null;
}

export const AllegriaTemplate: React.FC<TemplateProps> = ({ fiesta, invitacionData, onUpdate, onSectionClick, selectedSectionId, isPreview }) => {
    const paleta = invitacionData.cabecera.paletaColores;
    const primaryColor = paleta?.primary || '#E11D48';
    
    const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "PRÓXIMAMENTE";
        return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    };

    return (
        <div className={cn("font-body text-slate-900 bg-white selection:bg-primary/10", isPreview && "h-full overflow-y-auto")}>
            {/* HERO - Full Screen Experience */}
            <section 
                onClick={() => onSectionClick?.('cabecera')}
                className="relative h-screen flex flex-col items-center justify-end pb-24 overflow-hidden"
            >
                <motion.div 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="absolute inset-0 -z-10"
                >
                    <NextImage 
                        src={invitacionData.cabecera.imagenFondoUrl || 'https://picsum.photos/seed/celebration/1200/1600'} 
                        alt="" layout="fill" objectFit="cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80"></div>
                </motion.div>

                <div className="text-center text-white space-y-6 px-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="text-sm font-bold tracking-[0.5em] uppercase opacity-80">
                            {fiesta.configuracion.tipoCelebracion || invitacionData.cabecera.subtitulo.text}
                        </span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-6xl md:text-8xl font-headline font-bold">
                        {fiesta.configuracion.protagonista1Nombre || invitacionData.cabecera.protagonista1}
                        {fiesta.configuracion.protagonista2Nombre && (
                            <>
                                <br /><span style={{ color: primaryColor }}>&</span><br />
                                {fiesta.configuracion.protagonista2Nombre}
                            </>
                        )}
                    </motion.h1>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex items-center justify-center gap-4 text-xl">
                        <Separator className="w-12 bg-white/30" />
                        <span className="font-bold tracking-widest">{formatDate(fiesta.configuracion.fechaEvento)}</span>
                        <Separator className="w-12 bg-white/30" />
                    </motion.div>
                </div>
                
                {isPreview && selectedSectionId === 'cabecera' && <div className="absolute inset-0 border-8 border-primary z-50 pointer-events-none"></div>}
            </section>

            {/* COUNTDOWN BOLD */}
            {invitacionData.cuentaRegresiva.visible && (
                <section className="py-20 bg-slate-900 text-white overflow-hidden">
                    <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
                        <h2 className="text-xl font-bold tracking-[0.3em] uppercase opacity-50">Comienza el conteo</h2>
                        <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
                    </div>
                </section>
            )}

            {/* WELCOME SECTION */}
            {invitacionData.bienvenida.visible && (
                <section className="py-32 px-6">
                    <div className="max-w-2xl mx-auto text-center space-y-8">
                        <Heart className="w-12 h-12 mx-auto text-primary animate-pulse" fill={primaryColor} />
                        <h2 className="text-5xl font-headline font-bold leading-tight">{invitacionData.bienvenida.titulo.text}</h2>
                        <p className="text-xl text-slate-600 leading-relaxed italic">
                            "{invitacionData.bienvenida.texto.text}"
                        </p>
                    </div>
                </section>
            )}

            {/* LOCATIONS - GRID LAYOUT */}
            <section className="py-32 bg-slate-50 px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
                    {[invitacionData.detallesEvento.ceremoniaReligiosa, invitacionData.detallesEvento.celebracion].filter(d => d.visible).map((detalle, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col"
                        >
                            <div className="relative aspect-video">
                                <NextImage src={detalle.imagenUrl || 'https://picsum.photos/seed/location/800/600'} alt="" layout="fill" objectFit="cover" />
                                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur p-4 rounded-full">
                                    {i === 0 ? <Church className="text-primary" /> : <PartyPopper className="text-primary" />}
                                </div>
                            </div>
                            <div className="p-12 space-y-6">
                                <h3 className="text-3xl font-headline font-bold">{detalle.titulo}</h3>
                                <div className="space-y-4 text-lg">
                                    <div className="flex items-center gap-4 text-slate-500">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <span>{formatDate(detalle.fecha || fiesta.configuracion.fechaEvento)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        <span>{detalle.nombreLugar}</span>
                                    </div>
                                </div>
                                <Button asChild className="w-full h-16 rounded-2xl text-lg font-bold" style={{ backgroundColor: primaryColor }}>
                                    <a href={detalle.mapaUrl || '#'}>VER UBICACIÓN</a>
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ITINERARIO SECTION */}
            {invitacionData.itinerario.visible && (
                <section className="py-32 px-6 bg-white text-center">
                    <div className="max-w-2xl mx-auto space-y-8">
                        <Clock className="w-16 h-16 mx-auto text-primary" />
                        <h2 className="text-5xl font-headline font-bold">Cronograma</h2>
                        <p className="text-xl text-slate-600 italic">Descubre los momentos clave del evento.</p>
                        <Button 
                            onClick={(e) => { e.stopPropagation(); setIsItineraryModalOpen(true); }}
                            size="lg" 
                            className="h-16 px-12 rounded-2xl text-xl font-bold shadow-xl shadow-primary/20"
                            style={{ backgroundColor: primaryColor }}
                        >
                            VER ITINERARIO
                        </Button>
                    </div>
                    
                    <Dialog open={isItineraryModalOpen} onOpenChange={setIsItineraryModalOpen}>
                        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto rounded-[2rem] p-8 border-none shadow-3xl">
                            <DialogHeader className="text-center pb-6 border-b">
                                <DialogTitle className="text-4xl font-headline font-bold">Cronograma</DialogTitle>
                                <DialogDescription>Horarios y actividades del evento</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-8 pt-8">
                                {(fiesta.programa || []).map((item) => (
                                    <div key={item.id} className="flex items-center gap-6 text-left">
                                        <div className="text-xl font-bold text-primary w-20 shrink-0">{item.hora}</div>
                                        <div className="h-10 w-px bg-slate-200"></div>
                                        <div>
                                            <h4 className="text-lg font-bold leading-tight">{item.titulo}</h4>
                                            <p className="text-sm text-slate-500">{item.descripcion}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter className="mt-10">
                                <DialogClose asChild><Button variant="outline" className="w-full h-14 rounded-xl border-slate-200 text-slate-600">Cerrar</Button></DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </section>
            )}

            {/* GIFT SECTION */}
            {invitacionData.regalos.visible && (
                <section className="py-32 px-6 text-center space-y-12 bg-slate-50">
                    <div className="max-w-xl mx-auto space-y-6">
                        <div className="inline-block p-6 bg-primary/10 rounded-full mb-4">
                            <Gift className="w-10 h-10" style={{ color: primaryColor }} />
                        </div>
                        <h2 className="text-5xl font-headline font-bold">{invitacionData.regalos.titulo.text}</h2>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            {invitacionData.regalos.texto.text}
                        </p>
                        {invitacionData.regalos.datosBancarios && (
                            <div className="p-10 border-2 border-dashed border-slate-200 rounded-[2rem] bg-white">
                                <p className="font-mono text-2xl tracking-tighter font-bold text-slate-800 break-all">
                                    {invitacionData.regalos.datosBancarios}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* FOOTER */}
            <footer className="py-24 bg-slate-900 text-white text-center px-6">
                <h2 className="text-6xl font-dancing mb-8" style={{ color: primaryColor }}>
                    {invitacionData.footer.titulo.text}
                </h2>
                <div className="w-16 h-1 bg-white/20 mx-auto mb-8 rounded-full"></div>
                <p className="text-sm font-bold tracking-[0.4em] uppercase opacity-40">
                    {invitacionData.footer.nombreEmpresa.text}
                </p>
            </footer>
        </div>
    );
};
