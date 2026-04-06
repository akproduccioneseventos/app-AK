
'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import { cn } from '@/lib/utils';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import { Phone } from 'lucide-react';

interface CartaTragosMenuProps {
    fiesta: FiestaEnPlanificacion;
    carta: CartaTragosData;
    onUpdate?: (newData: Partial<CartaTragosData>) => void;
    isPreview?: boolean;
    openEditModal?: (item: Trago) => void;
}

const Ornament: React.FC<{ position: string; color: string }> = ({ position, color }) => {
    const baseClasses = "absolute w-6 h-6 border-2";
    const positionClasses = {
        'top-left': 'top-1.5 left-1.5 border-t-0 border-r-0',
        'top-right': 'top-1.5 right-1.5 border-t-0 border-l-0',
        'bottom-left': 'bottom-1.5 left-1.5 border-b-0 border-r-0',
        'bottom-right': 'bottom-1.5 right-1.5 border-b-0 border-l-0',
    };
    const innerClasses = "absolute w-3 h-3 border-2";
    const innerPositionClasses = {
        'top-left': 'top-[-2px] left-[-2px] border-t-0 border-r-0',
        'top-right': 'top-[-2px] right-[-2px] border-t-0 border-l-0',
        'bottom-left': 'bottom-[-2px] left-[-2px] border-b-0 border-r-0',
        'bottom-right': 'bottom-[-2px] right-[-2px] border-b-0 border-l-0',
    }

    return (
        <div className={cn(baseClasses, positionClasses[position as keyof typeof positionClasses])} style={{ borderColor: color }}>
            <div className={cn(innerClasses, innerPositionClasses[position])} style={{ borderColor: color }} />
        </div>
    );
};

export const CartaTragosMenu: React.FC<CartaTragosMenuProps> = ({ fiesta, carta, onUpdate, isPreview, openEditModal }) => {
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        getInvoiceTemplateSettings().then(settings => {
            setLogoUrl(settings.logoUrl || null);
        }).catch(err => console.error("Failed to fetch logo for drink menu", err));
    }, []);
    
    const paleta = carta.paletaColores || { primary: '#9333ea', secondary: '#363636', accent: '#ffffff' };
    
    const handleUpdate = (field: keyof CartaTragosData, value: string) => {
        if (onUpdate && isPreview) {
            onUpdate({ [field]: value });
        }
    };
    
    const handleEmpresaUpdate = (field: keyof CartaTragosData['empresa'], value: string) => {
        if (onUpdate && isPreview) {
            onUpdate({ empresa: { ...(carta.empresa), [field]: value } });
        }
    }

    return (
        <div
            className={cn("w-full h-full p-3 relative overflow-hidden flex flex-col border-[3px]")}
            style={{ backgroundColor: carta.backgroundColor, borderColor: paleta.primary }}
        >
             <Ornament position="top-left" color={paleta.primary} />
             <Ornament position="top-right" color={paleta.primary} />
             <Ornament position="bottom-left" color={paleta.primary} />
             <Ornament position="bottom-right" color={paleta.primary} />
            
            {/* Background Image */}
            {carta.backgroundImageUrl && (
                <NextImage src={carta.backgroundImageUrl} layout="fill" objectFit="cover" className="absolute inset-0 opacity-25 -z-10" alt="" data-ai-hint="floral background texture" />
            )}

            <div className="grid grid-cols-12 gap-3 w-full h-full">
                {/* Left Column (Photo) */}
                <div className="col-span-4 flex items-center justify-center">
                     <div className="relative w-full aspect-square rounded-full overflow-hidden border-4 bg-white/50" style={{borderColor: paleta.primary}}>
                        {carta.protagonistaFotoUrl ? (
                             <NextImage src={carta.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" data-ai-hint="portrait photo"/>
                        ) : <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">Sin Foto</div>}
                    </div>
                </div>

                {/* Right Column (Info) */}
                <div className="col-span-8 flex flex-col justify-between">
                    <header className="text-center pt-1">
                        <h2 className="font-dancing text-4xl leading-tight" style={{color: paleta.secondary}}>
                            <EditableText initialValue={carta.protagonistaNombre || "Luciana"} onSave={val => handleUpdate('protagonistaNombre', val)} textarea={false} style={{ fontFamily: 'Dancing_Script' }}/>
                        </h2>
                        <h3 className="font-headline text-lg -mt-1 tracking-widest uppercase opacity-80" style={{color: paleta.secondary}}>
                             <EditableText initialValue={carta.numeroPrincipal || "Mis XV"} onSave={val => handleUpdate('numeroPrincipal', val)} textarea={false} style={{ fontFamily: 'Belleza' }}/>
                        </h3>
                         <h1 className="font-headline text-2xl uppercase tracking-tighter mt-1 font-bold" style={{color: paleta.primary}}>
                            <EditableText initialValue={carta.titulo || 'CARTA DE TRAGOS'} onSave={val => handleUpdate('titulo', val)} textarea={false} style={{ fontFamily: 'Belleza' }} />
                        </h1>
                    </header>

                    <main className="grid grid-cols-5 gap-1.5 my-2">
                        {carta.items.slice(0, 10).map(item => (
                            <div key={item.id} className="text-center group flex flex-col items-center" onClick={() => isPreview && openEditModal?.(item)}>
                                 <div className="relative w-full aspect-[3/4] rounded-sm overflow-hidden border-[1.5px] group-hover:border-primary bg-white/80 shadow-sm" style={{borderColor: paleta.accent}}>
                                    {item.imageUrl ? (
                                        <NextImage src={item.imageUrl} alt={item.nombre} layout="fill" objectFit="cover" data-ai-hint={item.aiHint || 'cocktail drink'} />
                                    ) : <div className="w-full h-full bg-gray-100"></div>}
                                </div>
                                <p className="text-[7px] font-bold uppercase mt-1 leading-[1.1] h-4 overflow-hidden" style={{color: paleta.secondary}}>{item.nombre}</p>
                            </div>
                        ))}
                    </main>

                     <footer className="w-full border-t border-dashed border-gray-400/50 pt-1 pb-1">
                        <div className="text-center space-y-0" style={{ color: paleta.secondary }}>
                             <p className="font-headline font-bold text-xs leading-tight tracking-wider" style={{color: paleta.primary}}>
                               <EditableText initialValue={carta.empresa.linea1 || 'AK PRODUCCIONES'} onSave={(val) => handleEmpresaUpdate('linea1', val)} textarea={false} style={{fontFamily: 'Belleza'}}/>
                            </p>
                            <p className="text-[7px] leading-tight opacity-80 italic">
                                <EditableText initialValue={carta.empresa.linea2 || 'Servicio de fiestas integral'} onSave={(val) => handleEmpresaUpdate('linea2', val)} textarea={false} style={{fontFamily: 'Inter'}}/>
                            </p>
                             <div className="flex items-center justify-center gap-1 mt-0.5">
                                <Phone className="w-2 h-2"/>
                                <p className="text-[9px] font-bold">
                                   <EditableText initialValue={carta.empresa.contacto || '098 355 530'} onSave={(val) => handleEmpresaUpdate('contacto', val)} textarea={false} style={{fontFamily: 'Inter'}}/>
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
            {logoUrl && (
                <div className="absolute left-2.5 bottom-2.5 w-10 h-10 z-20">
                    <NextImage src={logoUrl} alt="Logo" layout="fill" className="object-contain" data-ai-hint="logo"/>
                </div>
            )}
        </div>
    );
};
