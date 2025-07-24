
'use client';

import { Card } from '@/components/ui/card';
import NextImage from 'next/image';
import type { AsistentePasoOpcion } from '@/types/fiesta';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface TipoFiestaSelectorProps {
    opciones: AsistentePasoOpcion[];
    seleccion: string | null;
    onSelect: (id: string) => void;
}

export function TipoFiestaSelector({ opciones, seleccion, onSelect }: TipoFiestaSelectorProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {opciones.map(opcion => (
                <Card 
                    key={opcion.id}
                    className={cn(
                        "p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 relative",
                        seleccion === opcion.id ? 'ring-2 ring-primary shadow-xl' : 'shadow-md'
                    )}
                    onClick={() => onSelect(opcion.id)}
                >
                    {seleccion === opcion.id && (
                        <CheckCircle className="absolute -top-2 -right-2 w-6 h-6 text-white bg-primary rounded-full p-1"/>
                    )}
                    <h3 className="font-semibold">{opcion.nombre}</h3>
                </Card>
            ))}
        </div>
    )
}
