
'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData, Trago } from '@/types/fiesta';
import { EditableText } from '../edit/EditableText';
import { cn } from '@/lib/utils';
import { Phone } from 'lucide-react';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

interface CartaTragosMenuProps {
    fiesta: FiestaEnPlanificacion;
    carta: CartaTragosData;
    onUpdate?: (newData: Partial<CartaTragosData>) => void;
    isPreview?: boolean;
    openEditModal?: (item: Trago) => void;
}

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
    
    const handleUpdate = (field: keyof Omit<CartaTragosData, 'paletaColores' | 'protagonistaFotoUrl'>, value: string) => {
        if (onUpdate && isPreview) {
            onUpdate({ [field]: value });
        }
    };
    
    const handleEmpresaUpdate = (field: keyof NonNullable<CartaTragosData['empresa']>, value: string) => {
         if (onUpdate && isPreview) {
            onUpdate({ empresa: { ...carta.empresa, [field]: value } });
        }
    }
    
    return (
        <div
            className={cn("w-full h-full p-4 relative overflow-hidden flex flex-col items-center border-4")}
            style={{ backgroundColor: carta.backgroundColor, borderColor: paleta?.primary }}
        >
            <div className="absolute top-0 left-0 w-full h-20" style={{ backgroundColor: paleta?.primary }}>
                <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-auto" style={{ transform: 'translateY(100%)' }}>
                    <path d="M0 0 Q 50 10, 100 0 L 100 10 L 0 10 Z" fill={paleta?.primary}></path>
                </svg>
            </div>

            <header className="w-full text-center mt-6 relative z-10">
                <div className="relative w-28 h-28 mx-auto rounded-full overflow-hidden border-4" style={{borderColor: paleta?.primary}}>
                    {carta.protagonistaFotoUrl ? (
                         <NextImage src={carta.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" data-ai-hint="quinceanera portrait"/>
                    ) : <div className="w-full h-full bg-gray-200"></div>}
                </div>
                <h2 className="font-['Belleza',_serif] text-5xl mt-2" style={{color: paleta?.primary, textShadow: '1px 1px 3px rgba(0,0,0,0.2)'}}>
                     {isPreview ? <EditableText initialValue={carta.numeroPrincipal || "Mis XV"} onSave={val => handleUpdate('numeroPrincipal', val)} textarea={false}/> : (carta.numeroPrincipal || "Mis XV")}
                </h2>
                <h1 className="font-['Dancing_Script',_cursive] text-4xl" style={{color: paleta?.secondary}}>
                     {isPreview ? <EditableText initialValue={carta.protagonistaNombre || "Luciana"} onSave={val => handleUpdate('protagonistaNombre', val)} textarea={false}/> : (carta.protagonistaNombre || "Luciana")}
                </h1>
            </header>

             <main className="w-full px-2 mt-4 space-y-2 text-center flex-grow">
                <h3 className="font-['Belleza',_serif] text-2xl tracking-widest" style={{color: paleta?.primary}}>
                   {isPreview ? <EditableText initialValue={carta.titulo || 'CARTA DE TRAGOS'} onSave={val => handleUpdate('titulo', val)} textarea={false}/> : (carta.titulo || 'CARTA DE TRAGOS')}
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {carta.items.map(item => (
                        <div key={item.id} className="relative aspect-[3/4] rounded-md overflow-hidden border-2" style={{borderColor: paleta?.primary}} onClick={() => openEditModal?.(item)}>
                            {item.imageUrl ? (
                                <NextImage src={item.imageUrl} alt={item.nombre} layout="fill" objectFit="cover" data-ai-hint={item.aiHint || 'cocktail drink'} />
                            ) : <div className="w-full h-full bg-gray-100"></div>}
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-white text-center">
                                <p className="text-[8px] font-bold uppercase truncate">{item.nombre}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </main>
            
            <footer 
                className="relative z-10 w-[110%] -bottom-4 mt-auto rounded-t-[100%] p-4 pt-10 pb-6 text-center text-white" 
                style={{backgroundColor: paleta?.primary}}
            >
                <div className="relative">
                    <div className="flex items-center justify-center gap-4">
                        {logoUrl && (
                             <div className="w-16 h-16 flex-shrink-0">
                                <NextImage src={logoUrl} alt="Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo"/>
                            </div>
                        )}
                        <div className="text-left">
                            <h4 className="font-['Belleza',_serif] font-bold text-lg leading-tight">{isPreview ? <EditableText initialValue={carta.empresa?.linea1 || 'AK PRODUCCIONES'} onSave={val => handleEmpresaUpdate('linea1', val)} textarea={false}/> : (carta.empresa?.linea1 || 'AK PRODUCCIONES')}</h4>
                            <p className="text-xs">{isPreview ? <EditableText initialValue={carta.empresa?.linea2 || 'Servicio de fiestas integral'} onSave={val => handleEmpresaUpdate('linea2', val)} textarea={false}/> : (carta.empresa?.linea2 || 'Servicio de fiestas integral')}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3"/>
                                <p className="text-xs font-semibold">{isPreview ? <EditableText initialValue={carta.empresa?.contacto || '098 355 530'} onSave={val => handleEmpresaUpdate('contacto', val)} textarea={false}/> : (carta.empresa?.contacto || '098 355 530')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
