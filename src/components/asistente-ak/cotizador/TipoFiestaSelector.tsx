
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AsistentePasoConfig, AsistentePasoOpcion } from '@/types/fiesta';
// We will directly use the JSON data for simplicity in this component
import config from '@/data/asistente-ak-config.json';


interface TipoFiestaSelectorProps {
  selectedId: string | null;
  onSelect: (opcion: AsistentePasoOpcion) => void;
}

export function TipoFiestaSelector({ selectedId, onSelect }: TipoFiestaSelectorProps) {
  const [pasoConfig, setPasoConfig] = useState<AsistentePasoConfig | null>(null);

  useEffect(() => {
    // Directly use the imported config
    setPasoConfig(config.pasos.tipoFiesta);
  }, []);

  if (!pasoConfig) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{pasoConfig.pregunta}</h2>
        <p className="text-muted-foreground">{pasoConfig.descripcion}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {pasoConfig.opciones.map((opcion) => (
            <Card
            key={opcion.id}
            onClick={() => onSelect(opcion)}
            className={cn(
                "cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden",
                selectedId === opcion.id && "ring-2 ring-primary shadow-lg"
            )}
            >
            <CardContent className="p-0">
                <div className="relative aspect-video">
                <Image
                    src={opcion.img || "https://placehold.co/400x300.png"}
                    alt={opcion.nombre}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={opcion.hint}
                />
                {selectedId === opcion.id && (
                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                )}
                </div>
                <div className="p-3 text-center font-medium">{opcion.nombre}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
