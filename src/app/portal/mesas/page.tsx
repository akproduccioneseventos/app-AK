
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload, Map, ChevronsUp, ChevronsDown, X, Armchair, PartyPopper, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData, LayoutElementType } from '@/types/fiesta';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import NextImage from 'next/image';
import { cn } from "@/lib/utils";

const PIXELS_PER_METER_DEFAULT = 40;

const Seat: React.FC<{ angle?: number; distance?: number; isOccupied: boolean; isRound: boolean; width: number; height: number; index: number; total: number; }> = ({ angle, distance, isOccupied, isRound, width, height, index, total }) => {
    let style: React.CSSProperties = {};
    if (isRound) {
        const calculatedAngle = angle ?? (index * (360 / total));
        const calculatedDistance = distance ?? (Math.min(width, height) / 2 + 15);
         style = {
            transform: `rotate(${calculatedAngle}deg) translate(${calculatedDistance}px) rotate(-${calculatedAngle}deg)`,
        };
    } else {
        const perimeter = 2 * (width + height);
        const seatSpacing = perimeter / total;
        let currentPosition = index * seatSpacing;
        let x=0, y=0;

        if (currentPosition < width) { // Top edge
            x = currentPosition;
            y = -10;
        } else if (currentPosition < width + height) { // Right edge
            x = width + 10;
            y = currentPosition - width;
        } else if (currentPosition < 2 * width + height) { // Bottom edge
            x = width - (currentPosition - (width + height));
            y = height + 10;
        } else { // Left edge
            x = -10;
            y = height - (currentPosition - (2 * width + height));
        }
        
        style = {
            left: `${x}px`,
            top: `${y}px`,
            transform: 'translate(-50%, -50%)',
        };
    }

    return (
        <div className={cn(
            "absolute w-4 h-4 rounded-full border-2",
            isOccupied ? "bg-primary border-primary-foreground" : "border-primary",
             !isRound && "absolute"
        )} style={style}>
        </div>
    );
};

function AsignacionMesasContent() {
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [decoracion, setDecoracion] = useState<DecoracionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);


  const loadData = useCallback(async () => {
    if (!fiestaId) {
      setError("No se proporcionó ID de evento.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if(!fiestaData) throw new Error("Evento no encontrado.");
      setFiesta(fiestaData);
      setDecoracion(fiestaData.decoracion || { salonElements: [], pixelsPerMeter: PIXELS_PER_METER_DEFAULT, salonWidth: 15, salonHeight: 15 });
    } catch (err: any) {
      setError("Error al cargar la información del evento.");
      console.error("Error fetching data for table lookup:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fiestaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  if (isLoading || !fiesta) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando diseñador de mesas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-destructive/10"><AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" /><CardTitle className="text-xl font-semibold text-destructive">Error</CardTitle></CardHeader>
        <CardContent className="text-center space-y-4 py-6"><p className="text-muted-foreground">{error}</p></CardContent>
      </Card>
    );
  }
  
  if (!decoracion) return null;
  const pixelsPerMeter = decoracion.pixelsPerMeter || PIXELS_PER_METER_DEFAULT;

  return (
    <>
      <Card className="max-w-6xl w-full mx-auto shadow-xl">
          <CardHeader className="text-center">
              <PartyPopper className="w-10 h-10 mx-auto text-primary" />
              <CardTitle className="font-headline text-3xl">Organiza tus Mesas</CardTitle>
              <CardDescription>Arrastra los invitados a las mesas para asignar sus lugares.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="w-full h-[calc(100vh-350px)] min-h-[500px] overflow-auto border rounded-lg bg-card p-2">
                 <div className="relative canvas-grid-background" style={{ width: `${(decoracion.salonWidth || 15) * pixelsPerMeter}px`, height: `${(decoracion.salonHeight || 15) * pixelsPerMeter}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    {decoracion.salonPlanBackgroundImageUrl && (<NextImage src={decoracion.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" className="opacity-50"/>)}
                    {(decoracion.salonElements || []).map(el => {
                        const assignedGuests = (fiesta?.invitados || []).filter(inv => inv.tableNumber === el.name);
                        const assignedSeatsCount = assignedGuests.reduce((sum, g) => sum + (g.partySize || 1), 0);
                        const isRound = el.shape === 'circle';

                        return (
                            <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation}deg)` }}>
                                {el.seats && Array.from({ length: el.seats }).map((_, i) => (
                                    <Seat key={i} index={i} total={el.seats!} isOccupied={i < assignedSeatsCount} isRound={isRound} width={el.width} height={el.height} />
                                ))}
                                <div className={cn('w-full h-full border flex flex-col p-1 border-gray-500', isRound && 'rounded-full')}
                                    style={{ backgroundColor: el.backgroundColor || 'rgba(255, 255, 255, 0.7)' }}>
                                    <p className="text-xs font-bold text-center truncate">{el.name}</p>
                                    <p className="text-[10px] text-center text-muted-foreground">{assignedSeatsCount}/{el.seats || 'N/A'}</p>
                                    <div className="text-[9px] space-y-0.5 overflow-y-auto flex-grow mt-1 text-center">
                                        {assignedGuests.map(g => (
                                            <div key={g.id} className="flex items-center justify-center gap-1 group relative">
                                                <span className="truncate">{g.nombre} ({g.partySize})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          </CardContent>
      </Card>
    </>
  );
}


export default function MesaPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex flex-col items-center justify-center p-4">
            <Suspense fallback={
                 <div className="flex flex-col items-center justify-center text-center p-8">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p className="text-lg text-muted-foreground">Cargando...</p>
                </div>
            }>
                <AsignacionMesasContent />
            </Suspense>
        </div>
    );
}
