
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
  
  const textNameStyle: React.CSSProperties = {
    fontFamily: "'Belleza', serif",
    color: carta.paletaColores?.primary || '#FFFFFF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    fontWeight: 'bold',
  };
  
  const textTitleStyle: React.CSSProperties = {
    fontFamily: "'Belleza', serif",
    color: carta.paletaColores?.primary || '#FFFFFF',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    fontWeight: 'bold',
    letterSpacing: '0.05em'
  };

  const drinkNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    fontSize: '0.5rem',
    textAlign: 'center',
    lineHeight: '1.1',
    letterSpacing: '0.05em'
  };

  const handleUpdate = (field: keyof CartaTragosData, value: string) => {
    if (onUpdate && isPreview) {
        onUpdate({ [field]: value });
    }
  };
  
  const handleUpdateEmpresa = (field: 'empresaNombre' | 'empresaContacto', value: string) => {
      if (onUpdate && isPreview) {
          onUpdate({ [field]: value });
      }
  }


  return (
    <div 
        className={cn("w-full h-full p-4 relative overflow-hidden flex flex-col items-center")} 
        style={{ background: carta.backgroundColor || 'linear-gradient(to bottom right, #e9d5ff, #d8b4fe)' }}
    >
       <div className="absolute top-0 left-0 right-0 h-[120px] z-0">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,10 C20,25 40,0 50,10 S80,-5 100,10 V0 H0 Z" fill={carta.paletaColores?.primary || '#9333ea'} fillOpacity="0.9"/>
          </svg>
       </div>

        <header className="w-full flex-shrink-0 flex items-start justify-between relative z-10 px-4 pt-4">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-2">
                {carta.protagonistaFotoUrl ? (
                    <NextImage src={carta.protagonistaFotoUrl} alt="Protagonista" layout="fill" objectFit="cover" data-ai-hint="protagonist photo"/>
                ) : <div className="w-full h-full bg-gray-200"></div>}
            </div>
             <div className="text-center flex-grow -ml-8 mt-2">
                 <h2 className="text-3xl" style={textTitleStyle}>
                    {isPreview ? <EditableText initialValue={carta.titulo || 'CARTA DE TRAGOS'} onSave={(v) => handleUpdate('titulo', v)} /> : (carta.titulo || 'CARTA DE TRAGOS')}
                </h2>
                <h1 className="text-5xl mt-1" style={textNameStyle}>
                    {isPreview ? <EditableText initialValue={carta.protagonistaNombre || 'Luciana'} onSave={(v) => handleUpdate('protagonistaNombre', v)} /> : carta.protagonistaNombre}
                </h1>
                <h3 className="text-4xl mt-0" style={textNameStyle}>
                    {isPreview ? <EditableText initialValue={carta.numeroPrincipal || 'Mis XV'} onSave={(v) => handleUpdate('numeroPrincipal', v)} /> : carta.numeroPrincipal}
                </h3>
            </div>
        </header>

        <main className="relative z-10 flex-grow grid grid-cols-5 gap-x-1 gap-y-2 px-2 mt-4 w-full">
            {carta.items.map((trago) => (
                <div key={trago.id} className="text-center flex flex-col">
                    <p style={drinkNameStyle} className="h-6 flex items-end justify-center leading-none">{trago.nombre.split(' ').join('\n')}</p>
                    <div className="mt-1 aspect-[3/4] rounded-lg shadow-md overflow-hidden border-2 border-white">
                        <NextImage src={trago.imageUrl} alt={trago.nombre} width={100} height={150} className="w-full h-full object-cover" data-ai-hint={trago.aiHint}/>
                    </div>
                </div>
            ))}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 h-[100px] z-0 transform rotate-180">
           <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,10 C20,25 40,0 50,10 S80,-5 100,10 V0 H0 Z" fill={carta.paletaColores?.primary || '#9333ea'} fillOpacity="0.9"/>
          </svg>
        </div>
       
         <footer className="relative z-10 mt-auto w-full px-4 pb-2 flex justify-between items-center">
            <div className="w-16 h-10 relative">
                 {logoUrl && (
                    <NextImage src={logoUrl} alt="AK Producciones Logo" layout="fill" className="object-contain" data-ai-hint="company logo"/>
                )}
            </div>
            <div className="text-right">
                <p className="font-semibold text-xs leading-tight" style={{color: carta.paletaColores?.secondary}}>
                   {isPreview ? <EditableText initialValue={carta.empresaNombre || 'AK PRODUCCIONES'} onSave={(v) => handleUpdateEmpresa('empresaNombre', v)} /> : carta.empresaNombre}
                </p>
                <p className="text-xs" style={{color: carta.paletaColores?.secondary}}>
                   {isPreview ? <EditableText initialValue={carta.empresaContacto || '098355530'} onSave={(v) => handleUpdateEmpresa('empresaContacto', v)} /> : carta.empresaContacto}
                </p>
            </div>
        </footer>
    </div>
  );
};
