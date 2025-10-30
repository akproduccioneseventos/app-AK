
'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData } from '@/types/fiesta';
import { cn } from '@/lib/utils';
import { EditableText } from '../edit/EditableText';

interface MenuComponentProps {
    fiesta: FiestaEnPlanificacion;
    carta: CartaTragosData;
    logoUrl: string | null;
    onUpdate?: (newData: Partial<CartaTragosData>) => void;
    isPreview?: boolean;
}

// Inline SVG for the wave shape to easily change color
const Wave = ({ className, color }: { className: string; color: string }) => (
    <svg className={cn("absolute left-0 w-full", className)} viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
        <path fill={color} fillOpacity="1" d="M0,160L60,181.3C120,203,240,245,360,250.7C480,256,600,224,720,186.7C840,149,960,107,1080,117.3C1200,128,1320,192,1380,224L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
    </svg>
);


export const MenuComponent: React.FC<MenuComponentProps> = ({ fiesta, carta, logoUrl, onUpdate, isPreview }) => {
    
  const protagonistaNombre = carta.protagonistaNombre || 'SILVIA';
  const eventoNombre = carta.numeroPrincipal || '70'; 

  const textStyle: React.CSSProperties = {
    fontFamily: "'Belleza', serif",
    textShadow: '2px 2px 2px #000, -2px 2px 2px #000, 2px -2px 2px #000, -2px -2px 2px #000, 0 0 10px #000',
    color: '#f0e68c', // Khaki color for text fill
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
    <div className="w-full h-full p-0 relative overflow-hidden bg-[#E9D5FF] flex flex-col items-center">
        {/* Top Wave */}
        <Wave className="top-0 z-0" color="#a855f7" />

        {/* Header Section */}
        <div className="w-full pt-6 px-4 flex justify-between items-center relative z-10">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200 -ml-4 mt-8 flex-shrink-0">
            <NextImage src={carta.protagonistaFotoUrl || "https://picsum.photos/seed/quinceanera-main/300/300"} alt={`Foto de ${protagonistaNombre}`} width={128} height={128} className="object-cover w-full h-full" data-ai-hint="protagonist photo"/>
          </div>
          <div className="flex-grow text-center pl-2">
            <h2 className="text-xl" style={textStyle}>CARTA DE TRAGOS</h2>
            <div className="text-4xl mt-1" style={textStyle}>{protagonistaNombre}</div>
            <div className="text-3xl mt-1" style={textStyle}>{eventoNombre}</div>
          </div>
        </div>

        {/* Main Content: Drinks */}
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
        
        {/* Bottom Wave */}
        <Wave className="bottom-0 z-0 transform rotate-180" color="#a855f7" />

        {/* Footer with Logo */}
        <footer className="relative z-10 w-full flex justify-center pb-2 pt-12">
          {logoUrl && (
                <div className="w-16 h-16">
                  <NextImage src={logoUrl} alt="AK Producciones Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo"/>
                </div>
            )}
        </footer>
       
        <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Belleza&family=Dancing+Script:wght@700&display=swap');
        `}</style>
    </div>
  );
};
