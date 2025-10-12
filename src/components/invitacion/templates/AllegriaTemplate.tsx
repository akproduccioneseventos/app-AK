
'use client';

import React from 'react';
import type { FiestaEnPlanificacion, InvitacionDigitalData, ColorPalette, SocialConnection, SeccionInvitacion } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CountdownTimer } from '@/components/countdown-timer';
import { Separator } from '@/components/ui/separator';
import { Church, GlassWater, Gift, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

const Section: React.FC<{ id: string, onClick?: () => void, isSelected?: boolean, className?: string, children: React.ReactNode }> = 
({ id, onClick, isSelected, className, children }) => (
    <section id={id} onClick={onClick} className={cn("relative py-16 px-6 text-center", className, onClick && "cursor-pointer")}>
        {onClick && <div className={cn("absolute inset-0 border-2 transition-all pointer-events-none", isSelected ? 'border-primary' : 'border-transparent')}></div>}
        {children}
    </section>
);


const AllegriaDetalles: React.FC<{ data: InvitacionDigitalData['detallesEvento'], fiesta: FiestaEnPlanificacion, paleta: ColorPalette, onUpdate?: (newData: Partial<InvitacionDigitalData>) => void }> = ({ data, fiesta, paleta, onUpdate }) => {
    const mapQuery = fiesta.configuracion.nombreLugar ? encodeURIComponent(fiesta.configuracion.nombreLugar) : '';
    const mapUrl = `https://www.google.com/maps?q=${mapQuery}`;
    return (
        <div className="max-w-md mx-auto text-center">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg mb-6">
                {data.imagenFondoUrl ? (
                    <NextImage src={data.imagenFondoUrl} alt={`Foto de ${fiesta.configuracion.nombreLugar}`} layout="fill" objectFit="cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">Foto del Salón</span>
                    </div>
                )}
            </div>
            <h3 className="font-headline text-3xl mb-2" style={{color: paleta.primary}}>La Celebración</h3>
            <p className="text-lg text-muted-foreground">{fiesta.configuracion.horaInicio} hs.</p>
            <p className="text-xl font-semibold mt-1" style={{color: paleta.accent}}>{fiesta.configuracion.nombreLugar}</p>
            <Button asChild variant="link" className="mt-4 text-lg" style={{color: paleta.primary}}>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-5 h-5 mr-2"/> Cómo Llegar
                </a>
            </Button>
        </div>
    );
};

export const AllegriaTemplate: React.FC<TemplateProps> = ({ fiesta, invitacionData, onUpdate, onSectionClick, selectedSectionId, isPreview }) => {
    
    const paleta = invitacionData.cabecera.paletaColores;

    const handleUpdateCabecera = (field: keyof InvitacionDigitalData['cabecera'], value: string) => {
        onUpdate?.({ cabecera: { ...invitacionData.cabecera, [field]: value } });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Fecha a confirmar";
        return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className={cn("font-body", isPreview && "h-full overflow-y-auto")}>
            <style jsx global>{`
                :root {
                    --allegria-primary: ${paleta?.primary || '#333333'};
                    --allegria-text: ${paleta?.secondary || '#555555'};
                }
            `}</style>

            {/* Cabecera */}
            <Section id="cabecera" onClick={() => onSectionClick?.('cabecera')} isSelected={selectedSectionId === 'cabecera'} className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-100 p-8">
                 <div className="absolute inset-0">
                    {invitacionData.cabecera.imagenFondoUrl ? (
                         <NextImage src={invitacionData.cabecera.imagenFondoUrl} alt="Fondo de la invitación" layout="fill" objectFit="cover" className="opacity-50" />
                    ): (
                        <div className="w-full h-full bg-gray-200"></div>
                    )}
                 </div>
                 <div className="relative z-10 text-center">
                    <h1 className="font-headline text-5xl md:text-7xl font-bold" style={{color: 'var(--allegria-primary)'}}>
                         <EditableText initialValue={invitacionData.cabecera.protagonista1 || "Protagonista 1"} onSave={(val) => handleUpdateCabecera('protagonista1', val)} textarea={false}/>
                         <span className="mx-2">&</span>
                         <EditableText initialValue={invitacionData.cabecera.protagonista2 || "Protagonista 2"} onSave={(val) => handleUpdateCabecera('protagonista2', val)} textarea={false}/>
                    </h1>
                     <p className="mt-4 text-lg" style={{color: 'var(--allegria-text)'}}>{formatDate(fiesta.configuracion.fechaEvento)}</p>
                 </div>
            </Section>

            {/* Cuenta Regresiva */}
            <Section id="cuentaRegresiva" onClick={() => onSectionClick?.('cuentaRegresiva')} isSelected={selectedSectionId === 'cuentaRegresiva'}>
                <h2 className="font-headline text-3xl mb-6" style={{color: 'var(--allegria-primary)'}}>Faltan</h2>
                <CountdownTimer targetDate={fiesta.configuracion.fechaEvento} />
            </Section>
            
            <Separator />

            {/* Detalles Evento */}
            <Section id="detallesEvento" onClick={() => onSectionClick?.('detallesEvento')} isSelected={selectedSectionId === 'detallesEvento'}>
                 <AllegriaDetalles data={invitacionData.detallesEvento} fiesta={fiesta} paleta={paleta} onUpdate={onUpdate} />
            </Section>

            <Separator />
            
             {/* Regalos */}
            <Section id="regalos" onClick={() => onSectionClick?.('regalos')} isSelected={selectedSectionId === 'regalos'}>
                 <Gift className="mx-auto w-12 h-12 mb-3" style={{color: 'var(--allegria-primary)'}}/>
                 <h2 className="font-headline text-3xl mb-4" style={{color: 'var(--allegria-primary)'}}>Regalos</h2>
                 <p className="max-w-prose mx-auto text-muted-foreground mb-4">
                     {invitacionData.regalos.texto.text}
                 </p>
                 {invitacionData.regalos.datosBancarios && (
                     <div className="p-4 bg-muted/50 rounded-md inline-block">
                         <p className="font-mono text-sm">{invitacionData.regalos.datosBancarios}</p>
                     </div>
                 )}
            </Section>

        </div>
    );
};
