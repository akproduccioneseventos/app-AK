
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SocialConnection, SeccionInvitacion, GiftItem, DetalleEventoEspecifico, TextWithStyle, TextStyle, ProgramaEventoItem } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { Church, Building, PartyPopper, Gift, Heart, MapPin, Play, Pause, Facebook, Instagram, Music, MessageSquare, Sparkles, Check, ArrowRight, X, Calendar, User, Mail, Grid, Code, Palette as PaletteIcon, Share2, Camera as CameraIcon, ArrowLeft, Clock, Users as UsersIcon, Link as LinkIcon, QrCode, Download, Utensils, GlassWater, CakeSlice, Diamond, PlusCircle } from 'lucide-react';
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
import { saveSugerenciaMusical } from '@/app/actions/fiesta/musica.actions';

const formatDate = (dateString?: string, shortMonth = false) => {
  if (!dateString) return "Fecha no especificada";
  try {
    const date = new Date(dateString);
    // This handles both UTC and local dates better
    const year = dateString.includes('T') ? date.getUTCFullYear() : date.getFullYear();
    const month = dateString.includes('T') ? date.getUTCMonth() : date.getMonth();
    const day = dateString.includes('T') ? date.getUTCDate() : date.getDate();

    if (shortMonth) {
      return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
    }
    return new Date(year, month, day).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Fecha inválida';
  }
};


const companyName = "AK Producciones";

const iconMap: Record<string, React.ElementType> = {
  Utensils, GlassWater, Music, CakeSlice, Camera: CameraIcon, Diamond, PartyPopper, Clock,
};

const SectionWrapper: React.FC<{
    seccion: SeccionInvitacion,
    children: React.ReactNode,
    onClick?: () => void,
    isSelected?: boolean,
    className?: string,
    backgroundColor?: string,
}> = ({ seccion, children, onClick, isSelected, className, backgroundColor }) => {
    if (!seccion.data?.visible) return null;

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
            style={{ backgroundColor }}
        >
            {onClick && <div className={cn("absolute inset-0 border-2 transition-all pointer-events-none", isSelected ? 'border-primary' : 'border-transparent group-hover/section:border-primary/50')}></div>}
            {seccion.data.imagenFondoUrl && (
                <>
                    <NextImage src={seccion.data.imagenFondoUrl} alt="" layout="fill" objectFit="cover" className="absolute inset-0 -z-10 opacity-10" />
                    <div className="absolute inset-0 bg-background/80 dark:bg-background/90 -z-10"></div>
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

interface TemplateProps {
  fiesta: FiestaEnPlanificacion;
  invitacionData: InvitacionDigitalData;
  socialConnections: SocialConnection[];
  isPreview?: boolean;
  onSectionClick?: (sectionId: string) => void;
  onUpdate?: (newData: Partial<InvitacionDigitalData>) => void;
  selectedSectionId?: string | null;
  children?: React.ReactNode; 
  onRsvpSubmit?: (submission: {nombreCompleto: string, confirmacion: string, numeroAsistentes: number, mensaje: string, companionNames: string[]}) => Promise<boolean>;
}

const GraziaCabecera: React.FC<{ data: InvitacionDigitalData['cabecera'], fiesta: FiestaEnPlanificacion, paleta: ColorPalette, onUpdate?: (newData: Partial<InvitacionDigitalData>) => void, isPreview?: boolean }> = ({ data, fiesta, paleta, onUpdate, isPreview }) => {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    getInvoiceTemplateSettings().then(settings => {
      setCompanyLogo(settings.logoUrl || null);
    });
  }, []);

  if (!data.visible) return null;

  const handleUpdateProtagonista = (field: 'protagonista1' | 'protagonista2', value: string) => {
    onUpdate?.({ cabecera: { ...data, [field]: value } });
  };
  
  const primaryColor = paleta.primary || 'hsl(var(--primary))';
  const backgroundImage = data.videoFondoUrl ? '' : (data.imagenFondoUrl || 'https://picsum.photos/seed/weddingcouple/1200/800');
  
  return (
    <header
        className="relative py-24 md:py-32 text-center bg-cover bg-center min-h-[70vh] flex items-center justify-center"
        style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundAttachment: 'fixed',
        }}
    >
        {data.videoFondoUrl && (
            <video src={data.videoFondoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover -z-10"/>
        )}
        <div className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-sm -z-10"></div>
        
        {companyLogo && (
          <div className="absolute top-4 left-4 z-20 h-12 w-28 md:h-16 md:w-36">
            <NextImage src={companyLogo} alt="Logo de la Empresa" layout="fill" className="object-contain" data-ai-hint="company logo"/>
          </div>
        )}

        <div className="relative z-10 p-6 max-w-2xl mx-auto text-center">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
                <EditableText
                    initialValue={data.subtitulo?.text || "Nuestra Boda"}
                    style={data.subtitulo?.style}
                    onSave={v => onUpdate?.({ cabecera: { ...data, subtitulo: { ...(data.subtitulo || {style:{}}), text: v } } })}
                    className="font-headline text-2xl"
                    textarea={false}
                />
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="font-headline text-5xl md:text-7xl my-4" style={{color: primaryColor}}>
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
    {...data.ceremoniaReligiosa, icon: Church, key: 'ceremoniaReligiosa'},
    {...data.ceremoniaCivil, icon: Building, key: 'ceremoniaCivil'},
    {...data.celebracion, icon: PartyPopper, key: 'celebracion'}
  ].filter(d => d && d.visible);

  const formatDateDetalle = (dateString?: string) => {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) { return "Fecha inválida"; }
  };
  
  const generateICSContent = (detalle: DetalleEventoEspecifico): string => {
    if (!detalle.fecha) return '';
    const startDate = new Date(detalle.fecha);
    if(detalle.hora) {
        const [hours, minutes] = detalle.hora.split(':').map(Number);
        startDate.setHours(hours, minutes);
    }
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hour duration

    const toUTC = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AKProducciones//App//EN',
        'BEGIN:VEVENT',
        `UID:${detalle.titulo.replace(/\s+/g, '')}@akproducciones.app`,
        `DTSTAMP:${toUTC(new Date())}`,
        `DTSTART:${toUTC(startDate)}`,
        `DTEND:${toUTC(endDate)}`,
        `SUMMARY:${detalle.titulo} - ${fiesta.configuracion.nombreEvento}`,
        `LOCATION:${detalle.nombreLugar}, ${detalle.direccionLugar}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');
    return icsContent;
  };

  const handleAddToCalendar = (detalle: DetalleEventoEspecifico) => {
    const icsContent = generateICSContent(detalle);
    if (icsContent) {
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${detalle.titulo}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const renderDetalle = (detalle: DetalleEventoEspecifico, icon: React.ElementType, key: string) => {
    if (!detalle || !detalle.visible) return null;

    const mapUrl = detalle.mapaUrl || (detalle.nombreLugar ? `https://www.google.com/maps?q=${encodeURIComponent(detalle.nombreLugar)}` : '#');
    const Icon = icon;

    return (
      <div key={key} className="max-w-md mx-auto text-center mb-12 last:mb-0">
        <SectionIcon><Icon className="w-12 h-12 mx-auto mb-4" style={{color: paleta.primary}} /></SectionIcon>
        <h3 className="font-headline text-3xl mb-4" style={{color: paleta.accent}}>{detalle.titulo}</h3>
        {detalle.imagenUrl && (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg mb-6">
            <NextImage src={detalle.imagenUrl} alt={`Foto de ${detalle.nombreLugar}`} layout="fill" objectFit="cover" />
          </div>
        )}
        <div className="text-lg space-y-1">
          {detalle.fecha && <p className="font-semibold">{formatDateDetalle(detalle.fecha)}</p>}
          {detalle.hora && <p className="text-muted-foreground">{detalle.hora} hs.</p>}
          {detalle.nombreLugar && <p className="text-xl font-semibold mt-1">{detalle.nombreLugar}</p>}
          {detalle.direccionLugar && <p className="text-sm text-muted-foreground">{detalle.direccionLugar}</p>}
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-4">
            {(detalle.mapaUrl || detalle.nombreLugar) && (
              <Button asChild variant="link" className="text-lg" style={{color: paleta.primary}}>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="w-5 h-5 mr-2"/> Ver en Mapa
                </a>
              </Button>
            )}
            {detalle.fecha && (
                 <Button variant="link" className="text-lg" style={{color: paleta.primary}} onClick={() => handleAddToCalendar(detalle)}>
                    <Calendar className="w-5 h-5 mr-2"/> Agendar
                 </Button>
            )}
        </div>
      </div>
    );
  };

  return (
    <div>
        {detallesAMostrar.length > 0 ? (
          detallesAMostrar.map(d => renderDetalle(d, d.icon, d.key))
        ) : (
          <p className="text-muted-foreground italic">Los detalles del evento no están configurados.</p>
        )}
    </div>
  );
};

const GraziaRegalos: React.FC<{ data: InvitacionDigitalData['regalos'], fiestaId?: string, paleta: ColorPalette, onUpdate?: (newData: Partial<InvitacionDigitalData>) => void }> = ({ data, fiestaId, paleta, onUpdate }) => {
    const { toast } = useToast();
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
    const [guestName, setGuestName] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [isDatosBancariosOpen, setIsDatosBancariosOpen] = useState(false);
    
    // Suggest Gift Modal State
    const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
    const [newGiftName, setNewGiftName] = useState('');
    const [newGiftDescription, setNewGiftDescription] = useState('');
    const [newGiftImageUrl, setNewGiftImageUrl] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleOpenClaimModal = (gift: GiftItem) => {
        setSelectedGift(gift);
        setIsClaimModalOpen(true);
        setGuestName('');
    };
    
    const handleAddGiftSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGiftName.trim() || !fiestaId) return;
        setIsSuggesting(true);
        try {
            const result = await addGiftToRegistryFiestaActual(fiestaId, {
                name: newGiftName,
                description: newGiftDescription,
                imageUrl: newGiftImageUrl
            });
            if (result.success) {
                toast({ title: "¡Sugerencia Añadida!", description: "Gracias por tu idea, se ha añadido a la lista." });
                setIsSuggestModalOpen(false);
                // We need to trigger a re-fetch in the parent component
                onUpdate?.({ regalos: { ...data, items: [...(data.items || []), { id: `new_${Date.now()}`, name: newGiftName, isClaimed: false }] } });
                setNewGiftName('');
                setNewGiftDescription('');
                setNewGiftImageUrl('');
            } else {
                throw new Error(result.error);
            }
        } catch(err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive"});
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleClaimGift = async () => {
        if (!selectedGift || !guestName.trim() || !fiestaId) return;
        setIsClaiming(true);
        try {
            const result = await claimGiftFiestaActual(fiestaId, selectedGift.id, guestName);
            if (result.success) {
                toast({ title: "¡Gracias por tu regalo!", description: `${guestName}, tu selección de "${selectedGift.name}" ha sido registrada.` });
                setIsClaimModalOpen(false);
                // Trigger a re-render in the parent by calling onUpdate
                const updatedItems = (data.items || []).map(item => item.id === selectedGift.id ? { ...item, isClaimed: true, claimedBy: guestName } : item);
                onUpdate?.({ regalos: { ...data, items: updatedItems }});
            } else {
                throw new Error(result.error || "No se pudo registrar el regalo.");
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsClaiming(false);
        }
    };
    
     const downloadQrBancario = () => {
        const canvas = document.getElementById('qr-datos-bancarios') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `datos-bancarios-regalo.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };


    return (
        <>
            <Dialog open={isClaimModalOpen} onOpenChange={setIsClaimModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirmar Regalo: {selectedGift?.name}</DialogTitle><DialogDescription>¡Gracias por tu generosidad! Por favor, ingresa tu nombre para que sepamos que este regalo ya fue elegido.</DialogDescription></DialogHeader>
                    <div className="py-4 space-y-2"><Label htmlFor="guest-name">Tu nombre</Label><Input id="guest-name" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Nombre y Apellido"/></div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleClaimGift} disabled={!guestName.trim() || isClaiming}>{isClaiming && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Confirmar Regalo</Button></DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isDatosBancariosOpen} onOpenChange={setIsDatosBancariosOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Datos para Regalo Monetario</DialogTitle></DialogHeader>
                     <div className="py-4 space-y-4 text-center">
                        <p className="whitespace-pre-wrap font-mono text-sm">{data.datosBancarios}</p>
                        <div className="inline-block p-2 bg-white border rounded-lg">
                           <QRCodeStylized id="qr-datos-bancarios" value={data.datosBancarios || ''} size={128}/>
                        </div>
                     </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={downloadQrBancario}><Download className="w-4 h-4 mr-2"/>Descargar QR</Button>
                        <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isSuggestModalOpen} onOpenChange={setIsSuggestModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sugerir un Nuevo Regalo</DialogTitle>
                        <DialogDescription>Añade una idea a la lista para que otros invitados puedan verla.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddGiftSubmit} className="space-y-3 py-2">
                        <div className="space-y-1"><Label htmlFor="new-gift-name">Nombre del Regalo</Label><Input id="new-gift-name" value={newGiftName} onChange={e => setNewGiftName(e.target.value)} required/></div>
                        <div className="space-y-1"><Label htmlFor="new-gift-desc">Descripción (Opcional)</Label><Textarea id="new-gift-desc" value={newGiftDescription} onChange={e => setNewGiftDescription(e.target.value)} rows={2}/></div>
                        <div className="space-y-1"><Label htmlFor="new-gift-img">URL de Imagen (Opcional)</Label><Input id="new-gift-img" value={newGiftImageUrl} onChange={e => setNewGiftImageUrl(e.target.value)} /></div>
                        <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button type="submit" disabled={isSuggesting}>{isSuggesting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}Añadir a la Lista</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>


            <SectionIcon><Gift className="w-12 h-12 mx-auto mb-3" style={{color: paleta.primary}}/></SectionIcon>
            <h3 className="font-headline text-3xl mb-3" style={{color: paleta.accent}}>
              <EditableText initialValue={data.titulo.text || "Lista de Regalos"} style={data.titulo.style} onSave={v => onUpdate?.({ regalos: { ...data, titulo: { ...(data.titulo || {style:{}}), text: v } }})} textarea={false}/>
            </h3>
            <div className="text-muted-foreground max-w-md mx-auto mb-6">
              <EditableText initialValue={data.texto.text || "Tu presencia es nuestro mejor regalo. Si aún así deseas obsequiarnos algo, puedes ayudarnos con nuestra luna de miel o elegir una de estas opciones."} style={data.texto.style} onSave={v => onUpdate?.({ regalos: { ...data, texto: { ...(data.texto || {style:{}}), text: v } }})} textarea/>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {data.datosBancarios && (
                    <Button onClick={() => setIsDatosBancariosOpen(true)}><QrCode className="w-4 h-4 mr-2"/> Ver Datos Bancarios</Button>
                )}
                <Button variant="outline" onClick={() => setIsSuggestModalOpen(true)}>
                    <PlusCircle className="w-4 h-4 mr-2"/> Sugerir un Regalo
                </Button>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {(data.items || []).map(item => (
                <div key={item.id} className="border rounded-lg shadow-sm overflow-hidden flex flex-col bg-card">
                  <div className="relative aspect-square bg-muted">
                    {item.imageUrl && <NextImage src={item.imageUrl} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="wedding gift"/>}
                    {item.isClaimed && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-2">
                        <Check className="w-8 h-8 mb-2"/><p className="text-sm font-semibold">¡Ya regalado!</p><p className="text-xs">por {item.claimedBy}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h4 className="font-semibold">{item.name}</h4>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 flex-grow">{item.description}</p>}
                    <Button className="w-full mt-4" style={item.isClaimed ? {} : {backgroundColor: paleta.primary}} disabled={item.isClaimed || isPreview} onClick={() => handleOpenClaimModal(item)}>
                      {item.isClaimed ? "Ya Regalado" : "¡Lo quiero regalar!"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
        </>
    );
};

const GraziaGaleria: React.FC<{ data: InvitacionDigitalData['galeria'], paleta: ColorPalette }> = ({ data, paleta }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const prevSlide = () => {
        if (!data.fotos || data.fotos.length === 0) return;
        setCurrentIndex(prev => (prev === 0 ? data.fotos.length - 1 : prev - 1));
    };
    const nextSlide = useCallback(() => {
        if (!data.fotos || data.fotos.length === 0) return;
        setCurrentIndex(prev => (prev === data.fotos.length - 1 ? 0 : prev + 1));
    }, [data.fotos]);

    useEffect(() => {
        if (data.fotos && data.fotos.length > 1) {
            const timer = setTimeout(() => nextSlide(), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, data.fotos, nextSlide]);


    if (!data.fotos || data.fotos.length === 0) {
        return <p className="text-muted-foreground italic">La galería de fotos está vacía.</p>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <SectionIcon><CameraIcon className="w-12 h-12 mx-auto mb-3" style={{color: paleta.primary}}/></SectionIcon>
            <h3 className="font-headline text-3xl mb-6" style={{color: paleta.accent}}>Nuestra Galería</h3>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-xl">
                 <AnimatePresence initial={false}>
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0"
                    >
                        <NextImage src={data.fotos[currentIndex]} alt={`Foto de la galería ${currentIndex + 1}`} layout="fill" objectFit="cover" data-ai-hint="wedding couple photo"/>
                    </motion.div>
                </AnimatePresence>
                {data.fotos.length > 1 && (
                    <>
                        <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white h-8 w-8"><ArrowLeft className="w-5 h-5"/></Button>
                        <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white h-8 w-8"><ArrowRight className="w-5 h-5"/></Button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {data.fotos.map((_, index) => (
                                <div key={index} onClick={() => setCurrentIndex(index)} className={cn("h-2 w-2 rounded-full cursor-pointer transition-all", index === currentIndex ? 'bg-white scale-125' : 'bg-white/50')}/>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

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
  
  // Music Suggestion State
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [musicSuggestion, setMusicSuggestion] = useState('');
  const [suggesterName, setSuggesterName] = useState('');
  const [isSubmittingMusic, setIsSubmittingMusic] = useState(false);


  useEffect(() => {
    const numCompanions = rsvpGuests > 1 ? rsvpGuests - 1 : 0;
    const currentNames = companionNames; // Use the state directly
    const newCompanionNames = Array(numCompanions).fill('').map((_, i) => currentNames[i] || '');
    setCompanionNames(newCompanionNames);
  }, [rsvpGuests]);


  const togglePlayPause = () => {
    if (isPreview) return; // Disable audio in preview
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleRsvpFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || !onRsvpSubmit) return;
    setIsSubmittingRsvp(true);
    let fullMessage = rsvpMusicSuggestion.trim() ? `Sugerencia musical: ${rsvpMusicSuggestion.trim()}` : '';
    const success = await onRsvpSubmit({
      nombreCompleto: rsvpName,
      confirmacion: 'Confirmado',
      numeroAsistentes: rsvpGuests,
      mensaje: fullMessage,
      companionNames: companionNames
    });
    if (success) {
      setIsRsvpModalOpen(false);
      setRsvpName('');
      setRsvpGuests(1);
      setCompanionNames([]);
      setRsvpMusicSuggestion('');
    }
    setIsSubmittingRsvp(false);
  };

  const handleMusicFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicSuggestion.trim() || !fiesta.id) return;
    setIsSubmittingMusic(true);
    try {
        const fullSuggestion = `${suggesterName.trim() || 'Anónimo'}: ${musicSuggestion.trim()}`;
        const result = await saveSugerenciaMusical(fiesta.id, fullSuggestion);
        if (result.success) {
            toast({ title: "¡Sugerencia Enviada!", description: "Gracias por tu aporte a la fiesta." });
            setIsMusicModalOpen(false);
            setMusicSuggestion('');
            setSuggesterName('');
        } else {
            throw new Error(result.error);
        }
    } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
        setIsSubmittingMusic(false);
    }
  };


  const socialIcons: Record<SocialPlatformName, React.ElementType> = { Facebook, Instagram, Music, TikTok: Music, WhatsApp: MessageSquare };

  const renderSectionComponent = (seccion: SeccionInvitacion) => {
    if (!seccion.data?.visible) return null;
    const props = { data: seccion.data, fiesta, paleta: paletaColores, onUpdate };

    const wrapperProps = onSectionClick ? {
      seccion: seccion,
      onClick: () => onSectionClick(seccion.id),
      isSelected: selectedSectionId === seccion.id,
      backgroundColor: 'transparent',
    } : { seccion, backgroundColor: 'transparent' };

    const sectionIndex = invitacionData.secciones.findIndex(s => s.id === seccion.id);
    if(sectionIndex % 2 !== 0){
        wrapperProps.backgroundColor = 'rgba(0,0,0,0.02)';
    }

    switch (seccion.tipo) {
      case 'bienvenida':
        return <SectionWrapper {...wrapperProps}><SectionIcon><Heart className="w-12 h-12 mx-auto mb-3" style={{color: primaryColor}} /></SectionIcon><h2 className="font-headline text-2xl mb-4"><EditableText initialValue={seccion.data.titulo?.text || ""} style={seccion.data.titulo?.style} onSave={v => onUpdate?.({ bienvenida: { ...seccion.data, titulo: { ...(seccion.data.titulo || {style:{}}), text: v } }})} textarea={false} /></h2><div className="max-w-xl mx-auto text-muted-foreground"><EditableText initialValue={seccion.data.texto?.text || ""} style={seccion.data.texto?.style} onSave={v => onUpdate?.({ bienvenida: { ...seccion.data, texto: { ...(seccion.data.texto || {style:{}}), text: v } }})} textarea/></div></SectionWrapper>;
      case 'cuentaRegresiva':
        return <SectionWrapper {...wrapperProps}><h3 className="font-headline text-2xl mb-4" style={{color: primaryColor}}>Faltan</h3><CountdownTimer targetDate={fiesta.configuracion.fechaEvento} /></SectionWrapper>;
      case 'detallesEvento':
        return <SectionWrapper {...wrapperProps}><GraziaDetalles {...props} /></SectionWrapper>;
      case 'itinerario':
        return (
          <SectionWrapper {...wrapperProps}>
            <SectionIcon>
              <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: paletaColores.primary }} />
            </SectionIcon>
            <h3 className="font-headline text-3xl mb-6" style={{ color: paletaColores.accent }}>Cronograma</h3>
            <ul className="max-w-sm mx-auto space-y-4 text-left">
              {(fiesta.programa || []).map((item) => {
                const Icon = item.icono && iconMap[item.icono] ? iconMap[item.icono] : Clock;
                return (
                  <li key={item.id} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <Icon className="w-6 h-6 text-primary mb-1" />
                      <span className="font-bold text-sm" style={{ color: paletaColores.primary }}>{item.hora}</span>
                    </div>
                    <div>
                      <p className="font-semibold">{item.titulo}</p>
                      {item.descripcion && <p className="text-sm text-muted-foreground">{item.descripcion}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </SectionWrapper>
        );
      case 'galeria':
        return <SectionWrapper {...wrapperProps}><GraziaGaleria {...props} /></SectionWrapper>;
      case 'historia': 
        return <SectionWrapper {...wrapperProps}>
            <SectionIcon><Heart className="w-12 h-12 mx-auto mb-3" style={{color: paletaColores.primary}} /></SectionIcon>
            <h3 className="font-headline text-3xl mb-4" style={{color: paletaColores.accent}}><EditableText initialValue={seccion.data.titulo?.text || 'Nuestra Historia'} style={seccion.data.titulo?.style} onSave={(v) => onUpdate?.({ historia: { ...seccion.data, titulo: { ...(seccion.data.titulo || {style:{}}), text: v } } })} textarea={false}/></h3>
            <p className="max-w-prose mx-auto text-muted-foreground"><EditableText initialValue={seccion.data.texto?.text || 'Un breve relato de cómo llegamos hasta aquí...'} style={seccion.data.texto?.style} onSave={(v) => onUpdate?.({ historia: { ...seccion.data, texto: { ...(seccion.data.texto || {style:{}}), text: v } } })} textarea/></p></SectionWrapper>;
      case 'dressCode':
        return <SectionWrapper {...wrapperProps}>
            <SectionIcon><Sparkles className="w-12 h-12 mx-auto mb-3" style={{color: paletaColores.primary}} /></SectionIcon>
            <h3 className="font-headline text-3xl mb-2" style={{color: paletaColores.accent}}>Código de Vestimenta</h3>
            <div className="text-xl font-semibold"><EditableText initialValue={seccion.data.texto?.text || "Formal"} style={{}} onSave={(v) => onUpdate?.({ dressCode: { ...seccion.data, texto: { ...seccion.data.texto, text: v }} })} textarea={false}/></div>
             {(seccion.data.sugeridos?.length > 0 || seccion.data.evitar?.length > 0) && (
              <div className="mt-6 flex flex-col md:flex-row justify-center items-start gap-8">
                {seccion.data.sugeridos?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Colores Sugeridos:</h4>
                    <div className="flex justify-center gap-2">
                      {seccion.data.sugeridos.map((color: string, i: number) => <div key={`sug-${i}`} className="w-8 h-8 rounded-full border" style={{backgroundColor: color}}></div>)}
                    </div>
                  </div>
                )}
                 {seccion.data.evitar?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Colores a Evitar:</h4>
                    <div className="flex justify-center gap-2">
                      {seccion.data.evitar.map((color: string, i: number) => <div key={`evt-${i}`} className="w-8 h-8 rounded-full border" style={{backgroundColor: color}}></div>)}
                    </div>
                  </div>
                )}
              </div>
            )}
        </SectionWrapper>;
      case 'regalos':
        return <SectionWrapper {...wrapperProps}><GraziaRegalos {...props} fiestaId={fiesta.id}/></SectionWrapper>;
      case 'confirmacion':
        return <SectionWrapper {...wrapperProps}><Button size="lg" style={{backgroundColor: paletaColores.primary}} onClick={() => !isPreview && setIsRsvpModalOpen(true)}>Confirmar Asistencia</Button></SectionWrapper>;
      case 'musica':
        return <SectionWrapper {...wrapperProps}><Button size="lg" variant="outline" style={{borderColor: primaryColor, color: primaryColor}} onClick={() => !isPreview && setIsMusicModalOpen(true)}><Music className="w-5 h-5 mr-2"/>Sugerir una Canción</Button></SectionWrapper>;
      case 'redesSociales':
        return (
          <SectionWrapper {...wrapperProps}>
            <SectionIcon><Share2 className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} /></SectionIcon>
            <h3 className="font-headline text-3xl mb-3" style={{ color: paletaColores.accent }}>
                <EditableText initialValue={seccion.data.texto?.text || '¡Comparte tus momentos!'} style={seccion.data.texto?.style} onSave={v => onUpdate?.({ redesSociales: { ...seccion.data, texto: { ...(seccion.data.texto || {style:{}}), text: v } } })} textarea={false} />
            </h3>
            {seccion.data.hashtag && (
              <p className="text-xl font-bold" style={{ color: primaryColor }}>
                 <EditableText initialValue={seccion.data.hashtag} style={{fontFamily: 'Inter', fontSize: '1.25rem', color: primaryColor}} onSave={v => onUpdate?.({ redesSociales: { ...seccion.data, hashtag: v}})} textarea={false} />
              </p>
            )}
             {fiesta.socialGallerySettings?.enabled && (
                <Button asChild variant="default" className="mt-6" style={{backgroundColor: primaryColor}}>
                    <Link href={`/evento/social/${fiesta.id}`}>
                        <CameraIcon className="w-5 h-5 mr-2" />
                        Ir al Muro Social
                    </Link>
                </Button>
             )}
          </SectionWrapper>
        );
      case 'despedida':
        return <SectionWrapper {...wrapperProps}>
            <h3 className="font-headline text-4xl" style={{fontFamily: 'Dancing_Script', color: paletaColores.accent}}>
              <EditableText initialValue={seccion.data.texto?.text || "¡Te esperamos!"} style={seccion.data.texto?.style} onSave={v => onUpdate?.({ despedida: { ...seccion.data, texto: { ...(seccion.data.texto || {style:{}}), text: v } }})} textarea={false}/>
            </h3>
        </SectionWrapper>;
      case 'footer': return null; // Footer is handled separately
      default: return null;
    }
  }

  return (
    <div className={cn("min-h-screen bg-background font-body", isPreview && "overflow-y-auto h-full")} style={{'--theme-primary': primaryColor} as React.CSSProperties}>
       <div onClick={() => onSectionClick?.('cabecera')} className={cn("relative", isPreview && "cursor-pointer")}>
        {isPreview && <div className={cn("absolute inset-0 border-2 transition-all pointer-events-none", selectedSectionId === 'cabecera' ? 'border-primary' : 'border-transparent')}></div>}
        <GraziaCabecera data={invitacionData.cabecera} fiesta={fiesta} paleta={paletaColores} onUpdate={onUpdate} isPreview={isPreview} />
       </div>

       <main className={!isPreview ? 'max-w-3xl mx-auto p-4 md:p-8' : ''}>
        {invitacionData.secciones.map((seccion, index) => {
           if(seccion.tipo === 'cabecera' || !seccion.data?.visible) return null;
           const component = renderSectionComponent(seccion);
           if (!component) return null;
            const nextVisibleSection = invitacionData.secciones.slice(index + 1).find(s => s.data?.visible);
            return (
                <React.Fragment key={seccion.id}>
                    {component}
                    {nextVisibleSection && nextVisibleSection.tipo !== 'footer' && <FloralSeparator color={primaryColor}/>}
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
       {invitacionData.footer.visible && (
        <footer className="text-center py-8 mt-8 border-t bg-muted/20">
            <h4 className="font-headline text-lg mb-2" style={{color: primaryColor}}>
                 <EditableText initialValue={invitacionData.footer.titulo.text || 'Con cariño, María y Juan'} style={invitacionData.footer.titulo.style} onSave={(v) => onUpdate?.({ footer: { ...invitacionData.footer, titulo: { ...invitacionData.footer.titulo, text: v } } })} textarea={false}/>
            </h4>
             <p className="text-sm text-muted-foreground mb-4">Síguenos en nuestras redes sociales</p>
            <div className="flex justify-center items-center gap-4 mb-4">
                {socialConnections.filter(c => c.isConnected).map(conn => {
                    const Icon = socialIcons[conn.platform as keyof typeof socialIcons] || LinkIcon;
                    return (
                        <a key={conn.platform} href={conn.profileUrl || '#'} target="_blank" rel="noopener noreferrer" aria-label={`Perfil de ${conn.platform}`}>
                            <Button variant="ghost" size="icon">
                                {conn.logoUrl ?
                                    <img src={conn.logoUrl} alt={`${conn.platform} logo`} className="w-6 h-6 object-contain" /> :
                                    <Icon className="w-6 h-6" />
                                }
                            </Button>
                        </a>
                    );
                })}
            </div>
            <p className="text-sm font-headline" style={{color: primaryColor}}>
                <EditableText initialValue={invitacionData.footer.nombreEmpresa?.text || 'AK Producciones'} style={invitacionData.footer.nombreEmpresa?.style} onSave={v => onUpdate?.({ footer: { ...invitacionData.footer, nombreEmpresa: { ...invitacionData.footer.nombreEmpresa, text: v } } })} textarea={false}/>
            </p>
       </footer>
       )}
       {/* RSVP Modal */}
        <Dialog open={isRsvpModalOpen} onOpenChange={setIsRsvpModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Confirmar Asistencia</DialogTitle></DialogHeader>
                <form onSubmit={handleRsvpFormSubmit} className="space-y-4">
                    <div className="space-y-1"><Label htmlFor="rsvp-name">Tu nombre completo</Label><Input id="rsvp-name" value={rsvpName} onChange={e => setRsvpName(e.target.value)} required/></div>
                    <div className="space-y-1"><Label htmlFor="rsvp-guests">Total de asistentes (contándote)</Label><Input id="rsvp-guests" type="number" value={rsvpGuests} onChange={e => setRsvpGuests(Number(e.target.value))} min={1} required/></div>
                    {Array.from({ length: rsvpGuests > 1 ? rsvpGuests - 1 : 0 }).map((_, index) => (
                      <div key={index} className="space-y-1 pl-4 border-l-2">
                        <Label htmlFor={`companion-name-${index}`} className="text-sm">Nombre Acompañante {index + 1}</Label>
                        <Input
                          id={`companion-name-${index}`}
                          value={companionNames[index] || ''}
                          onChange={(e) => {
                            const newNames = [...companionNames];
                            newNames[index] = e.target.value;
                            setCompanionNames(newNames);
                          }}
                          placeholder={`Nombre del acompañante ${index + 1}`}
                        />
                      </div>
                    ))}
                    {invitacionData.musica?.visible && (
                        <div className="space-y-1 pt-2 border-t">
                            <Label htmlFor="rsvp-music-suggestion">¿Qué canción no puede faltar en la fiesta?</Label>
                            <Input id="rsvp-music-suggestion" value={rsvpMusicSuggestion} onChange={e => setRsvpMusicSuggestion(e.target.value)} placeholder={invitacionData.musica.placeholder}/>
                        </div>
                    )}
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button type="submit" disabled={isSubmittingRsvp}>{isSubmittingRsvp ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}Confirmar</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        {/* Music Suggestion Modal */}
        <Dialog open={isMusicModalOpen} onOpenChange={setIsMusicModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Sugerir una Canción</DialogTitle><DialogDescription>¿Qué canción no puede faltar para que la fiesta sea inolvidable?</DialogDescription></DialogHeader>
                <form onSubmit={handleMusicFormSubmit} className="space-y-4">
                    <div className="space-y-1"><Label htmlFor="suggester-name">Tu nombre (Opcional)</Label><Input id="suggester-name" value={suggesterName} onChange={e => setSuggesterName(e.target.value)} /></div>
                    <div className="space-y-1"><Label htmlFor="music-suggestion">Canción y Artista</Label><Input id="music-suggestion" value={musicSuggestion} onChange={e => setMusicSuggestion(e.target.value)} placeholder="Ej: Bohemian Rhapsody - Queen" required/></div>
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button type="submit" disabled={isSubmittingMusic}>{isSubmittingMusic ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}Enviar Sugerencia</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
};
