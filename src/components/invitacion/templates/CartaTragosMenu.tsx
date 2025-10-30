'use client';

import React from 'react';
import NextImage from 'next/image';
import type { FiestaEnPlanificacion, CartaTragosData } from '@/types/fiesta';

interface MenuComponentProps {
    fiesta: FiestaEnPlanificacion;
    carta: CartaTragosData;
    logoUrl: string | null;
}

export const MenuComponent: React.FC<MenuComponentProps> = ({ fiesta, carta, logoUrl }) => {
    const protagonistaNombre = carta.protagonistaNombre || 'SILVIA';
    const numeroPrincipal = carta.numeroPrincipal || '70';

    return (
        <div className="w-full h-full p-4 relative overflow-hidden bg-white text-center" style={{ backgroundColor: '#FBF8F0' }}>
            {carta.backgroundImageUrl && (
                <NextImage
                    src={carta.backgroundImageUrl}
                    alt="Fondo de la carta"
                    layout="fill"
                    objectFit="cover"
                    className="absolute inset-0 z-0 opacity-80"
                    data-ai-hint="elegant texture background"
                />
            )}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('https://i.imgur.com/kR1Z1zF.png')" }}></div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[120%] h-32 bg-contain bg-no-repeat" style={{ backgroundImage: "url('https://i.imgur.com/8aVp6G6.png')" }}></div>

            <div className="relative z-10 flex flex-col h-full items-center">
                {logoUrl && (
                    <div className="absolute top-2 right-2 w-16 h-16">
                        <NextImage src={logoUrl} alt="AK Producciones Logo" width={64} height={64} className="object-contain" data-ai-hint="company logo" />
                    </div>
                )}

                <header className="pt-12 text-center">
                    {carta.headerImageUrl && (
                        <div className="relative w-28 h-20 mx-auto mb-1">
                            <NextImage src={carta.headerImageUrl} alt="Header image" layout="fill" objectFit="contain" data-ai-hint="gold number balloons" />
                        </div>
                    )}
                    <h1 className="text-5xl font-bold" style={{ fontFamily: 'Belleza, serif', color: '#363636' }}>{protagonistaNombre}</h1>
                    <h2 className="text-xl tracking-widest mt-1" style={{ fontFamily: 'Belleza, serif', color: '#B99D75' }}>CARTA DE TRAGOS</h2>
                </header>

                <main className="flex-grow grid grid-cols-5 gap-2 px-2 mt-4 w-full">
                    {carta.items.map((trago) => (
                        <div key={trago.id} className="text-center">
                            <p className="text-[0.4rem] font-bold uppercase" style={{ color: '#B99D75' }}>{trago.nombre}</p>
                            <div className="aspect-square relative rounded-full overflow-hidden border-2 border-white shadow-lg mx-auto w-12 h-12 mt-1">
                                <NextImage src={trago.imageUrl} alt={trago.nombre} layout="fill" objectFit="cover" data-ai-hint="cocktail photo" />
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};
