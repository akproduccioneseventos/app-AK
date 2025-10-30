
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Loader2, AlertTriangle, Square, Circle, Users, GripVertical, Trash2, Edit, RotateCw, PlusCircle, LayoutDashboard, Disc, Clapperboard, Sofa, Camera as CameraIcon, Search, Printer, Settings2, FolderDown, FolderUp, Maximize, ZoomIn, ZoomOut, Upload, Map, ChevronsUp, ChevronsDown, X, Armchair, PartyPopper, Ticket } from 'lucide-react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion, LayoutElement, Invitado, DecoracionData, LayoutElementType } from '@/types/fiesta';
import { updateInvitadoFiestaActual } from '@/app/actions/fiesta-actual';
import { getFiestaById, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import NextImage from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { saveSalonLayoutTemplate, getSalonLayoutTemplates, type SalonLayoutTemplate, deleteSalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GUEST_ITEM_TYPE = 'guest';
const PIXELS_PER_METER_DEFAULT = 40;
const grid = 10;

interface GuestDragItem {
  id: string;
}

interface GuestCardProps {
  guest: Invitado;
}

const GuestCard: React.FC<GuestCardProps> = ({ guest }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: GUEST_ITEM_TYPE,
    item: { id: guest.id } as GuestDragItem,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn(
        "p-2 border rounded-md bg-background shadow-sm cursor-grab",
        isDragging && "opacity-50"
      )}
    >
      <p className="font-medium text-sm truncate">{guest.nombre}</p>
      <p className="text-xs text-muted-foreground">{guest.partySize || 1} persona(s)</p>
    </div>
  );
};

interface TableDropZoneProps {
    element: LayoutElement;
    onDrop: (guestId: string, tableName: string) => void;
    children: React.ReactNode;
}

const TableDropZone: React.FC<TableDropZoneProps> = ({ element, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: GUEST_ITEM_TYPE,
    drop: (item: GuestDragItem) => onDrop(item.id, element.name),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div ref={drop} className={cn("absolute", isOver && "ring-2 ring-offset-2 ring-primary rounded-md")}>
        {children}
    </div>
  );
};

const ElementIcon: React.FC<{ category?: string, type?: LayoutElementType }> = ({ category, type }) => {
    if (type === 'area') return <Map className="w-4 h-4 text-muted-foreground"/>;
    switch (category) {
        case 'Mesa Redonda': return <Circle className="w-4 h-4 text-muted-foreground"/>;
        case 'Mesa Rectangular': return <Square className="w-4 h-4 text-muted-foreground"/>;
        case 'Pista de Baile': return <Disc className="w-4 h-4 text-muted-foreground"/>;
        case 'Escenario': return <Clapperboard className="w-4 h-4 text-muted-foreground"/>;
        case 'Living': return <Sofa className="w-4 h-4 text-muted-foreground"/>;
        case 'Área de Fotos': return <CameraIcon className="w-4 h-4 text-muted-foreground"/>;
        default: return <LayoutDashboard className="w-4 h-4 text-muted-foreground"/>;
    }
};

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
  const guestId = searchParams.get('guestId');
  const fiestaId = searchParams.get('fiestaId');

  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!guestId || !fiestaId) {
        setError("No se proporcionó ID de invitado o de fiesta.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const fiestaData = await getFiestaById(fiestaId);
        if(!fiestaData) throw new Error("Evento no encontrado.");
        setFiesta(fiestaData);
        
        const foundInvitado = fiestaData.invitados?.find(inv => inv.id === guestId);
        
        if (foundInvitado) {
          setInvitado(foundInvitado);
        } else {
          setError("Invitación no encontrada. Por favor, verifica el código QR o contacta al organizador.");
        }
      } catch (err: any) {
        setError("Error al cargar la información del evento. Intenta de nuevo más tarde.");
        console.error("Error fetching data for table lookup:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [guestId, fiestaId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Buscando tu mesa...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center bg-destructive/10">
          <AlertTriangle className="w-16 h-16 mx-auto text-destructive mb-3" />
          <CardTitle className="text-xl font-semibold text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 py-6">
          <p className="text-muted-foreground">{error}</p>
          <Link href={`/evento/actual?fiestaId=${fiesta?.id || ''}`} passHref>
            <Button variant="outline">Volver a la Página del Evento</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!invitado || !fiesta) {
    return (
       <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold">Información No Disponible</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 py-6">
          <p className="text-muted-foreground">No se pudo cargar la información necesaria.</p>
        </CardContent>
      </Card>
    );
  }
  
  const pagePrimaryColor = fiesta.decoracion?.paletaColores?.primary || 'hsl(var(--primary))';


  return (
    <Card className="w-full max-w-md shadow-xl border-t-4" style={{ borderColor: pagePrimaryColor }}>
      <CardHeader className="text-center pb-4">
         <PartyPopper className="w-12 h-12 mx-auto mb-3" style={{ color: pagePrimaryColor }} />
        <CardTitle className="text-2xl font-bold font-headline" style={{ color: pagePrimaryColor }}>
          {fiesta.configuracion.nombreEvento}
        </CardTitle>
        <CardDescription className="text-md">¡Bienvenido/a, {invitado.nombre}!</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-6 py-8">
        {invitado.tableNumber ? (
          <>
            <p className="text-lg text-muted-foreground">Tu mesa asignada es la número:</p>
            <div 
                className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full border-4 text-4xl md:text-5xl font-bold shadow-inner"
                style={{ borderColor: pagePrimaryColor, color: pagePrimaryColor, backgroundColor: `${pagePrimaryColor}1A` }}
            >
              {invitado.tableNumber}
            </div>
            <p className="text-sm text-muted-foreground pt-2">¡Disfruta de la fiesta!</p>
          </>
        ) : (
          <>
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground/70 mb-2" />
            <p className="text-lg font-medium">Tu mesa aún no ha sido asignada.</p>
            <p className="text-muted-foreground">Por favor, consulta con el personal del evento al llegar o revisa esta pantalla más tarde.</p>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-center py-4">
         <Link href={`/evento/actual?fiestaId=${fiesta?.id || ''}`} passHref>
            <Button variant="outline" size="sm">Volver a la Página del Evento</Button>
          </Link>
      </CardFooter>
    </Card>
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


