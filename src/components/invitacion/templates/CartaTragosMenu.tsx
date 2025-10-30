
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
        <div className={cn(baseClasses, positionClasses[position])} style={{ borderColor: color }}>
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
    
    const paleta = carta.paletaColores;
    
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
            className={cn("w-full h-full p-2 relative overflow-hidden flex flex-col border-2")}
            style={{ backgroundColor: carta.backgroundColor, borderColor: paleta.primary }}
        >
             <Ornament position="top-left" color={paleta.primary} />
             <Ornament position="top-right" color={paleta.primary} />
             <Ornament position="bottom-left" color={paleta.primary} />
             <Ornament position="bottom-right" color={paleta.primary} />
            
            <header className="relative z-10 p-2 text-center">
                <h1 className="font-['Dancing_Script',_cursive] text-4xl font-bold" style={{color: paleta.primary}}>
                    <EditableText initialValue={carta.protagonistaNombre || "Luciana"} onSave={val => handleUpdate('protagonistaNombre', val)} textarea={false} style={{ fontFamily: 'Dancing_Script' }}/>
                </h1>
                <h3 className="font-['Belleza',_serif] text-xl" style={{color: paleta.secondary}}>
                    <EditableText initialValue={carta.numeroPrincipal || "Mis XV"} onSave={val => handleUpdate('numeroPrincipal', val)} textarea={false} style={{ fontFamily: 'Belleza' }}/>
                </h3>
            </header>

             <main className="w-full px-2 mt-2 space-y-2 text-center flex-grow">
                 <h2 className="font-headline text-lg uppercase tracking-wider" style={{color: paleta.primary}}>
                    <EditableText initialValue={carta.titulo || 'CARTA DE TRAGOS'} onSave={val => handleUpdate('titulo', val)} textarea={false} style={{ fontFamily: 'Belleza' }} />
                </h2>
                <div className="grid grid-cols-5 gap-1.5">
                    {carta.items.map(item => (
                        <div key={item.id} className="text-center group" onClick={() => isPreview && openEditModal?.(item)}>
                             <div className="relative aspect-[3/4] rounded-md overflow-hidden border-2 group-hover:border-primary" style={{borderColor: paleta.accent}}>
                                {item.imageUrl ? (
                                    <NextImage src={item.imageUrl} alt={item.nombre} layout="fill" objectFit="cover" data-ai-hint={item.aiHint || 'cocktail drink'} />
                                ) : <div className="w-full h-full bg-gray-100"></div>}
                            </div>
                            <p className="text-[7px] font-bold uppercase mt-1 leading-tight" style={{color: paleta.secondary}}>{item.nombre}</p>
                        </div>
                    ))}
                </div>
             </main>
            
            <footer className="relative z-10 w-full mt-auto pb-2 pt-4 text-center">
                <div className="text-center text-xs space-y-0" style={{ color: paleta.secondary }}>
                     <p className="font-headline font-semibold text-sm leading-tight" style={{color: paleta.primary}}>
                       <EditableText initialValue={carta.empresa.linea1 || 'AK PRODUCCIONES'} onSave={(val) => handleEmpresaUpdate('linea1', val)} textarea={false} style={{fontFamily: 'Belleza'}}/>
                    </p>
                    <p className="leading-tight">
                        <EditableText initialValue={carta.empresa.linea2 || 'Servicio de fiestas integral'} onSave={(val) => handleEmpresaUpdate('linea2', val)} textarea={false} style={{fontFamily: 'Inter'}}/>
                    </p>
                     <div className="flex items-center justify-center gap-1.5 pt-1">
                        <Phone className="w-3 h-3"/>
                        <p className="font-semibold text-sm">
                           <EditableText initialValue={carta.empresa.contacto || '098 355 530'} onSave={(val) => handleEmpresaUpdate('contacto', val)} textarea={false} style={{fontFamily: 'Inter'}}/>
                        </p>
                    </div>
                </div>
                {logoUrl && (
                    <div className="absolute right-2 bottom-2 w-8 h-8 z-20">
                        <NextImage src={logoUrl} alt="Logo" layout="fill" className="object-contain" data-ai-hint="company logo"/>
                    </div>
                )}
            </footer>
        </div>
    );
};
