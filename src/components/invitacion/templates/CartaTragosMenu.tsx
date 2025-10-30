
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
  
  const textStyle: React.CSSProperties = {
    fontFamily: "'Belleza', serif",
    textShadow: '2px 2px 2px #000, -2px 2px 2px #000, 2px -2px 2px #000, -2px -2px 2px #000, 0 0 10px #000',
    color: carta.paletaColores?.secondary || '#f0e68c',
    fontWeight: 'bold',
    letterSpacing: '0.05em'
  };
  
  const drinkNameStyle: React.CSSProperties = {
    fontFamily: 'var(--font-inter)',
    fontWeight: '900',
    color: 'black',
    textTransform: 'uppercase',
    fontSize: '0.5rem',
    textAlign: 'center',
    lineHeight: '1.1'
  };

  return (
    <div className={cn("w-full h-full p-0 relative overflow-hidden flex flex-col items-center")} style={{ backgroundColor: '#FBF8F0' }}>
       {carta.backgroundImageUrl && <NextImage src={carta.backgroundImageUrl} alt="Fondo" layout="fill" objectFit="cover" className="absolute inset-0 opacity-40 z-0" data-ai-hint="paper texture"/>}
        <Wave className="top-0 z-10" color={carta.paletaColores?.primary || '#a855f7'} />

        <header className="w-full pt-6 px-4 flex justify-between items-center relative z-20">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 -ml-4 mt-8 flex-shrink-0">
            <NextImage src={carta.protagonistaFotoUrl || "https://picsum.photos/seed/quinceanera/300/300"} alt="Protagonista" width={128} height={128} className="object-cover w-full h-full" data-ai-hint="protagonist photo"/>
          </div>
          <div className="flex-grow text-center pl-2">
            <h2 className="text-xl" style={{...textStyle, color: carta.paletaColores?.secondary}}>CARTA DE TRAGOS</h2>
            <div className="text-4xl mt-1" style={{...textStyle, color: carta.paletaColores?.secondary, fontFamily: "'Dancing Script', cursive"}}>
               {isPreview && onUpdate ? 
                  <EditableText initialValue={carta.protagonistaNombre || "Protagonista"} onSave={(v) => onUpdate({protagonistaNombre: v})} textarea={false} /> 
                  : carta.protagonistaNombre}
            </div>
            <div className="text-3xl mt-1" style={{...textStyle, color: carta.paletaColores?.secondary, fontFamily: "'Dancing Script', cursive"}}>
               {isPreview && onUpdate ?
                  <EditableText initialValue={carta.numeroPrincipal || "Mis XV"} onSave={(v) => onUpdate({numeroPrincipal: v})} textarea={false} />
                  : carta.numeroPrincipal}
            </div>
          </div>
        </header>

        <main className="relative z-10 flex-grow grid grid-cols-5 gap-1 px-2 mt-4 w-full">
            {carta.items.map((trago) => (
                <div key={trago.id} className="text-center">
                    <p style={drinkNameStyle} className="h-6 flex items-center justify-center">{trago.nombre}</p>
                    <div className="mt-1 aspect-square rounded-lg shadow-md overflow-hidden border-2 border-white">
                        <NextImage src={trago.imageUrl} alt={trago.nombre} width={80} height={80} className="w-full h-full object-cover" data-ai-hint={trago.aiHint}/>
                    </div>
                </div>
            ))}
        </main>
        
        <BottomWave className="bottom-0 z-10" color={carta.paletaColores?.primary || '#a855f7'} />
        
        <footer className="relative z-20 w-full flex justify-between items-center pb-2 px-4 text-white">
            {logoUrl && (
                <div className="w-16 h-12 relative">
                  <NextImage src={logoUrl} alt="Logo Empresa" layout="fill" className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
            <div className="text-right">
              {carta.empresaNombre && <p className="text-xs font-bold" style={{textShadow: '1px 1px 2px #000'}}>{carta.empresaNombre}</p>}
              {carta.empresaContacto && <p className="text-[10px] font-medium" style={{textShadow: '1px 1px 2px #000'}}>{carta.empresaContacto}</p>}
            </div>
        </footer>
       
        <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
        `}</style>
    </div>
  );
};
