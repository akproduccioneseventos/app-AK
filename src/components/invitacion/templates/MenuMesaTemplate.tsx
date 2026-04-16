
'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, MenuMesaData } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';

interface MenuMesaTemplateProps {
    fiesta: FiestaEnPlanificacion;
    data: MenuMesaData;
    logoUrl: string | null;
    onUpdate?: (newData: Partial<MenuMesaData>) => void;
    isPreview?: boolean;
}

const Ornament: React.FC<{ position: string; color: string }> = ({ position, color }) => {
    const baseClasses = "absolute w-8 h-8 border-2";
    const positionClasses = {
        'top-left': 'top-2 left-2 border-t-0 border-r-0',
        'top-right': 'top-2 right-2 border-t-0 border-l-0',
        'bottom-left': 'bottom-2 left-2 border-b-0 border-r-0',
        'bottom-right': 'bottom-2 right-2 border-b-0 border-l-0',
    };
    const innerClasses = "absolute w-4 h-4 border-2";
    const innerPositionClasses = {
        'top-left': 'top-[-2px] left-[-2px] border-t-0 border-r-0',
        'top-right': 'top-[-2px] right-[-2px] border-t-0 border-l-0',
        'bottom-left': 'bottom-[-2px] left-[-2px] border-b-0 border-r-0',
        'bottom-right': 'bottom-[-2px] right-[-2px] border-b-0 border-l-0',
    }

    return (
        <div className={cn(baseClasses, positionClasses[position as keyof typeof positionClasses])} style={{ borderColor: color }}>
            <div className={cn(innerClasses, innerPositionClasses[position as keyof typeof innerPositionClasses])} style={{ borderColor: color }} />
        </div>
    );
};

const SectionSeparator: React.FC<{ color: string }> = ({ color }) => (
    <div className="flex items-center justify-center my-1">
        <div className="flex-grow h-px bg-gray-300"></div>
        <div className="w-2.5 h-2.5 mx-2 transform rotate-45" style={{ backgroundColor: color }}></div>
        <div className="flex-grow h-px bg-gray-300"></div>
    </div>
);


export const MenuMesaTemplate: React.FC<MenuMesaTemplateProps> = ({ fiesta, data, logoUrl, onUpdate, isPreview }) => {
    
    const paleta = data.paletaColores;
    
    const handleUpdate = (field: keyof MenuMesaData, value: string) => {
        if (onUpdate && isPreview) {
            onUpdate({ [field]: value });
        }
    };
    
    const renderTextWithLineBreaks = (text: string) => {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <div
            className={cn("w-full h-full p-3 relative overflow-hidden flex flex-col border-2")}
            style={{ backgroundColor: paleta.background, borderColor: paleta.primary }}
        >
             <Ornament position="top-left" color={paleta.primary} />
             <Ornament position="top-right" color={paleta.primary} />
             <Ornament position="bottom-left" color={paleta.primary} />
             <Ornament position="bottom-right" color={paleta.primary} />
            
            <header className="w-full text-center relative pt-4">
                <div className="absolute top-4 left-4 w-28 h-28">
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4" style={{borderColor: paleta.primary}}>
                        {data.protagonistaFotoUrl ? (
                             <NextImage src={data.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" data-ai-hint="quinceanera portrait"/>
                        ) : <div className="w-full h-full bg-gray-200"></div>}
                    </div>
                </div>

                <div className="pl-32">
                    <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold leading-none" style={{color: paleta.primary, textShadow: '2px 2px 4px rgba(0,0,0,0.2)'}}>
                       MENÚ
                     </h1>
                      <h2 className="font-['Dancing_Script',_cursive] text-2xl sm:text-3xl md:text-4xl -mt-1 sm:-mt-2" style={{color: paleta.secondary}}>
                         {isPreview ? <EditableText initialValue={fiesta.configuracion.protagonista1Nombre || 'Luciana'} onSave={(val) => onUpdate?.({ protagonista1Nombre: val } as any)} textarea={false}/> : (fiesta.configuracion.protagonista1Nombre || 'Luciana')}
                     </h2>
                </div>
            </header>

            <main className="w-full px-2 mt-4 space-y-2 text-center flex-grow">
                 <div>
                    <h3 className="font-headline text-xl" style={{color: paleta.primary}}>ENTRADA</h3>
                    <div className="font-playfair text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.entrada} onSave={val => handleUpdate('entrada', val)} textarea/> : renderTextWithLineBreaks(data.entrada)}</div>
                </div>
                <SectionSeparator color={paleta.accent} />
                <div>
                    <h3 className="font-headline text-xl" style={{color: paleta.primary}}>PLATO PRINCIPAL</h3>
                    <div className="font-playfair text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.platoPrincipal} onSave={val => handleUpdate('platoPrincipal', val)} textarea/> : renderTextWithLineBreaks(data.platoPrincipal)}</div>
                </div>
                <SectionSeparator color={paleta.accent} />
                <div>
                    <h3 className="font-headline text-xl" style={{color: paleta.primary}}>ADOLESCENTES Y NIÑOS</h3>
                    <div className="font-playfair text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.adolescentes} onSave={val => handleUpdate('adolescentes', val)} textarea/> : renderTextWithLineBreaks(data.adolescentes)}</div>
                </div>
                <SectionSeparator color={paleta.accent} />
                <div>
                    <h3 className="font-headline text-xl" style={{color: paleta.primary}}>POSTRES</h3>
                    <div className="font-playfair text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.postres} onSave={val => handleUpdate('postres', val)} textarea/> : renderTextWithLineBreaks(data.postres)}</div>
                </div>
                 <SectionSeparator color={paleta.accent} />
                <div>
                    <h3 className="font-headline text-xl" style={{color: paleta.primary}}>BEBIDAS</h3>
                    <div className="font-playfair text-sm whitespace-pre-line" style={{color: paleta.secondary}}>{isPreview ? <EditableText initialValue={data.bebidas} onSave={val => handleUpdate('bebidas', val)} textarea/> : renderTextWithLineBreaks(data.bebidas)}</div>
                </div>
            </main>
            
            <footer className="relative w-full mt-auto pb-2 pt-10">
                <svg viewBox="0 0 300 60" className="absolute bottom-0 left-0 w-full h-auto" preserveAspectRatio="none">
                    <path d="M0,60 C50,0 250,0 300,60 L300,60 L0,60 Z" style={{fill: paleta.primary}} />
                </svg>
                <div className="relative z-10 text-center text-white space-y-0.5">
                    <h4 className="font-headline font-bold text-lg leading-tight">{data.empresa.linea1}</h4>
                    <p className="text-xs">{data.empresa.linea2}</p>
                     <div className="flex items-center justify-center gap-1.5 pt-1">
                        <Phone className="w-3.5 h-3.5"/>
                        <p className="text-sm font-semibold">{data.empresa.contacto}</p>
                    </div>
                </div>
                {logoUrl && (
                    <div className="absolute right-4 bottom-4 w-14 h-14 z-20">
                        <NextImage src={logoUrl} alt="Logo" layout="fill" className="object-contain" data-ai-hint="company logo"/>
                    </div>
                )}
            </footer>
        </div>
    );
};
