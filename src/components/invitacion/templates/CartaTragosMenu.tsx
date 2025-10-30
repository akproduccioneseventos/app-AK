
'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import { cn } from '@/lib/utils';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

interface CartaTragosMenuProps {
    fiesta: FiestaEnPlanificacion;
    carta: CartaTragosData;
    onUpdate?: (newData: Partial<CartaTragosData>) => void;
    isPreview?: boolean;
    openEditModal?: (item: Trago) => void;
}

const WavyBorder: React.FC<{ position: 'top' | 'bottom'; color: string }> = ({ position, color }) => {
    const path = "M0,50 Q12.5,0 25,50 T50,50 T75,50 T100,50";
    const transform = position === 'bottom' ? 'scale(1, -1) translate(0, -100)' : '';
    return (
        <div className={cn("absolute left-0 w-full h-12", position === 'top' ? '-top-1' : '-bottom-1')}>
            <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                <path d={path} fill={color} transform={transform} />
            </svg>
        </div>
    );
};


export const CartaTragosMenu: React.FC<CartaTragosMenuProps> = ({ fiesta, carta, onUpdate, isPreview, openEditModal }) => {
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function fetchLogo() {
            try {
                const settings = await getInvoiceTemplateSettings();
                setLogoUrl(settings.logoUrl);
            } catch (error) {
                console.error("Failed to fetch company logo", error);
            }
        }
        fetchLogo();
    }, []);
    
    const paleta = carta.paletaColores;
    
    const handleUpdate = (field: keyof Omit<CartaTragosData, 'paletaColores' | 'protagonistaFotoUrl' | 'empresa'>, value: string) => {
        if (onUpdate && isPreview) {
            onUpdate({ [field]: value });
        }
    };

    return (
        <div
            className={cn("w-full h-full relative overflow-hidden flex flex-col font-sans")}
            style={{ backgroundColor: carta.backgroundColor }}
        >
            <WavyBorder position="top" color={paleta?.primary || '#8b5cf6'} />
            
            <header className="relative z-10 p-4 pt-10">
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="relative aspect-square w-full max-w-[120px] mx-auto">
                        <div className="relative w-full h-full rounded-full overflow-hidden border-4" style={{borderColor: paleta?.accent}}>
                            {carta.protagonistaFotoUrl ? (
                                <NextImage src={carta.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" data-ai-hint="quinceanera portrait"/>
                            ) : <div className="w-full h-full bg-gray-200"></div>}
                        </div>
                    </div>

                    <div className="text-center space-y-0.5">
                        <h2 className="font-extrabold text-white text-xl uppercase tracking-wider" style={{ WebkitTextStroke: `1px ${paleta?.secondary}`}}>
                            CARTA DE TRAGOS
                        </h2>
                        <h1 className="font-['Dancing_Script',_cursive] text-4xl font-bold" style={{color: paleta?.primary}}>
                            {isPreview ? <EditableText initialValue={carta.protagonistaNombre || "Luciana"} onSave={val => handleUpdate('protagonistaNombre', val)} textarea={false}/> : (carta.protagonistaNombre || "Luciana")}
                        </h1>
                         <h3 className="font-['Dancing_Script',_cursive] text-3xl font-bold" style={{color: paleta?.primary}}>
                            {isPreview ? <EditableText initialValue={carta.numeroPrincipal || "Mis XV"} onSave={val => handleUpdate('numeroPrincipal', val)} textarea={false}/> : (carta.numeroPrincipal || "Mis XV")}
                        </h3>
                    </div>
                </div>
            </header>

             <main className="w-full px-2 mt-4 space-y-3 text-center flex-grow">
                <div className="grid grid-cols-5 gap-2">
                    {carta.items.slice(0, 5).map(item => (
                        <div key={item.id} className="text-center">
                             <div className="relative aspect-[3/4] rounded-md overflow-hidden border" onClick={() => openEditModal?.(item)} style={{borderColor: paleta?.accent}}>
                                {item.imageUrl ? (
                                    <NextImage src={item.imageUrl} alt={item.nombre} layout="fill" objectFit="cover" data-ai-hint={item.aiHint || 'cocktail drink'} />
                                ) : <div className="w-full h-full bg-gray-100"></div>}
                            </div>
                            <p className="text-[7px] font-bold uppercase mt-1" style={{color: paleta?.secondary}}>{item.nombre}</p>
                        </div>
                    ))}
                </div>
                 <div className="grid grid-cols-5 gap-2">
                    {carta.items.slice(5, 10).map(item => (
                        <div key={item.id} className="text-center">
                             <div className="relative aspect-[3/4] rounded-md overflow-hidden border" onClick={() => openEditModal?.(item)} style={{borderColor: paleta?.accent}}>
                                {item.imageUrl ? (
                                    <NextImage src={item.imageUrl} alt={item.nombre} layout="fill" objectFit="cover" data-ai-hint={item.aiHint || 'cocktail drink'} />
                                ) : <div className="w-full h-full bg-gray-100"></div>}
                            </div>
                            <p className="text-[7px] font-bold uppercase mt-1" style={{color: paleta?.secondary}}>{item.nombre}</p>
                        </div>
                    ))}
                </div>
             </main>
            
            <footer className="relative z-10 w-full mt-auto">
                <WavyBorder position="bottom" color={paleta?.primary || '#8b5cf6'} />
                 {logoUrl && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-10 h-10 z-20">
                        <NextImage src={logoUrl} alt="Logo" layout="fill" className="object-contain" data-ai-hint="company logo"/>
                    </div>
                )}
            </footer>
        </div>
    );
};
