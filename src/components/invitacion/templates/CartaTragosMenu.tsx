
'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData } from '@/types/fiesta';
import { cn } from '@/lib/utils';
import { EditableText } from '../edit/EditableText';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

interface MenuComponentProps {
    fiesta?: FiestaEnPlanificacion;
    carta: CartaTragosData;
    onUpdate?: (newData: Partial<CartaTragosData>) => void;
    isPreview?: boolean;
}

export const MenuComponent: React.FC<MenuComponentProps> = ({ fiesta, carta, onUpdate, isPreview }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    getInvoiceTemplateSettings().then(settings => setLogoUrl(settings.logoUrl));
  }, []);
  
  const textTitleStyle: React.CSSProperties = {
    fontFamily: "'Belleza', serif",
    color: carta.paletaColores?.secondary || '#363636',
    fontWeight: 'bold',
  };

   const textNameStyle: React.CSSProperties = {
    fontFamily: "'Belleza', serif",
    color: carta.paletaColores?.primary || '#9333ea',
    textShadow: '1px 1px 3px rgba(0,0,0,0.2)',
    fontWeight: 'bold',
  };
  
  const drinkNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontWeight: '800',
    color: '#4A4A4A',
    textTransform: 'uppercase',
    fontSize: '0.4rem',
    textAlign: 'center',
    lineHeight: '1.1',
    letterSpacing: '0.05em'
  };

  const handleUpdate = (field: keyof CartaTragosData, value: string) => {
    if (onUpdate) {
        onUpdate({ [field]: value });
    }
  };

  return (
    <div className={cn("w-full h-full p-0 relative overflow-hidden flex flex-col items-center")} style={{ backgroundColor: carta.backgroundColor || '#FBF8F0' }}>
       {carta.backgroundImageUrl && <NextImage src={carta.backgroundImageUrl} alt="Fondo" layout="fill" objectFit="cover" className="absolute inset-0 opacity-40 z-0" data-ai-hint="paper texture"/>}
        
        <div className="absolute top-0 left-0 right-0 h-[100px] z-0">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,10 Q25,20 50,10 T100,10 V0 H0 Z" fill={carta.paletaColores?.primary || '#9333ea'} fillOpacity="0.8"/>
          </svg>
        </div>
        
        <header className="w-full pt-6 px-4 flex flex-col items-center justify-center relative z-20">
          <div className="relative w-24 h-24 mt-2 rounded-full overflow-hidden border-4 border-white shadow-lg">
            {carta.protagonistaFotoUrl ? (
                <NextImage src={carta.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" data-ai-hint="protagonist photo"/>
            ) : <div className="w-full h-full bg-gray-200"></div>}
          </div>

          <div className="text-center mt-1">
            <div className="text-4xl" style={textNameStyle}>
               {isPreview && onUpdate ? 
                  <EditableText initialValue={carta.protagonistaNombre || "Protagonista"} onSave={(v) => handleUpdate('protagonistaNombre', v)} /> 
                  : carta.protagonistaNombre}
            </div>
             <h3 className="text-xl mt-2" style={textTitleStyle}>
                 {isPreview && onUpdate ? 
                  <EditableText initialValue={carta.numeroPrincipal || 'Mis XV'} onSave={(v) => handleUpdate('numeroPrincipal', v)} /> 
                  : carta.numeroPrincipal}
            </h3>
          </div>
        </header>

        <main className="relative z-10 flex-grow grid grid-cols-5 gap-x-1 gap-y-1 px-2 mt-4 w-full">
            {carta.items.map((trago) => (
                <div key={trago.id} className="text-center flex flex-col">
                    <div className="aspect-square rounded-lg shadow-md overflow-hidden border-2 border-white">
                        <NextImage src={trago.imageUrl} alt={trago.nombre} width={80} height={80} className="w-full h-full object-cover" data-ai-hint={trago.aiHint}/>
                    </div>
                     <p style={drinkNameStyle} className="mt-1 h-6 flex items-start justify-center">{trago.nombre}</p>
                </div>
            ))}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 h-[100px] z-0 transform rotate-180">
           <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,10 Q25,20 50,10 T100,10 V0 H0 Z" fill={carta.paletaColores?.primary || '#9333ea'} fillOpacity="0.8"/>
          </svg>
        </div>
       
        <footer className="relative z-10 mt-auto flex justify-between items-center w-full px-4 pb-4">
            <div className="text-left">
                <p className="text-sm font-bold" style={{color: carta.paletaColores?.secondary}}>{isPreview && onUpdate ? <EditableText initialValue={carta.empresaNombre || 'AK PRODUCCIONES'} onSave={(v) => handleUpdate('empresaNombre', v)} /> : carta.empresaNombre}</p>
                <p className="text-xs" style={{color: carta.paletaColores?.secondary}}>{isPreview && onUpdate ? <EditableText initialValue={carta.empresaContacto || '098355530'} onSave={(v) => handleUpdate('empresaContacto', v)} /> : carta.empresaContacto}</p>
            </div>
            {logoUrl && (
                <div className="w-16 h-16">
                  <NextImage src={logoUrl} alt="Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
        </footer>
    </div>
  );
};
