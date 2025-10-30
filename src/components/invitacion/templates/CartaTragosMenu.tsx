
'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData } from '@/types/fiesta';
import { cn } from '@/lib/utils';
import { EditableText } from '../edit/EditableText';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';

interface MenuComponentProps {
    fiesta: FiestaEnPlanificacion;
    carta: CartaTragosData;
    onUpdate?: (newData: Partial<CartaTragosData>) => void;
    isPreview?: boolean;
}

const Wave = ({ className, color }: { className: string; color: string }) => (
    <svg className={cn("absolute left-0 w-full z-0", className)} viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path fill={color} fillOpacity="0.8" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
    </svg>
);

const BottomWave = ({ className, color }: { className: string; color: string }) => (
     <svg className={cn("absolute left-0 w-full z-0", className)} viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path fill={color} fillOpacity="0.8" d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,138.7C960,117,1056,107,1152,117.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
    </svg>
);


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
    fontSize: '0.5rem',
    textAlign: 'center',
    lineHeight: '1.1',
    letterSpacing: '0.05em'
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
          <div className="relative w-24 h-24 mt-2">
            <div className="text-8xl font-bold text-amber-400" style={{fontFamily:"'Belleza', serif", textShadow: '2px 2px 4px rgba(0,0,0,0.3)'}}>
              {isPreview && onUpdate ? 
                <EditableText initialValue={carta.numeroPrincipal || "XV"} onSave={(v) => onUpdate({numeroPrincipal: v})} /> 
                : carta.numeroPrincipal}
            </div>
          </div>

          <div className="text-center mt-1">
            <div className="text-4xl" style={textNameStyle}>
               {isPreview && onUpdate ? 
                  <EditableText initialValue={carta.protagonistaNombre || "Protagonista"} onSave={(v) => onUpdate({protagonistaNombre: v})} /> 
                  : carta.protagonistaNombre}
            </div>
             <h3 className="text-xl mt-2" style={textTitleStyle}>
                CARTA DE TRAGOS
            </h3>
          </div>
        </header>

        <main className="relative z-10 flex-grow grid grid-cols-5 gap-x-1 gap-y-2 px-2 mt-4 w-full">
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
                <p className="text-sm font-bold" style={{color: carta.paletaColores?.secondary}}>{isPreview && onUpdate ? <EditableText initialValue={carta.empresaNombre || 'AK PRODUCCIONES'} onSave={(v) => onUpdate({empresaNombre: v})} /> : carta.empresaNombre}</p>
                <p className="text-xs" style={{color: carta.paletaColores?.secondary}}>{isPreview && onUpdate ? <EditableText initialValue={carta.empresaContacto || '098355530'} onSave={(v) => onUpdate({empresaContacto: v})} /> : carta.empresaContacto}</p>
            </div>
            {logoUrl && (
                <div className="w-16 h-16">
                  <NextImage src={logoUrl} alt="Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
        </footer>
       <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
        `}</style>
    </div>
  );
};
