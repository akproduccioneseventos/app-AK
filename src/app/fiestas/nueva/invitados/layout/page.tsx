
'use client';

import React, { useState, useEffect, useCallback, useRef, type ChangeEvent, use } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, AlertTriangle, PlusCircle, Settings2, LayoutDashboard, Printer, Trash2, Pointer, Move, Users, Save, RectangleHorizontal, Circle, Music, Sofa, User, Info, Building, Expand, Minimize, Sprout, Tent, Sparkles as SparklesIcon, FolderOpen, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaActual, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { FiestaEnPlanificacion, DecoracionData, LayoutElement, Invitado } from '@/types/fiesta';
import { defaultDecoracion } from '@/lib/fiesta-defaults';
import { getSalonLayoutTemplates, saveSalonLayoutTemplate, deleteSalonLayoutTemplate, type SalonLayoutTemplate } from '@/app/actions/salon-layout-templates';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import * as AccordionPrimitive from "@radix-ui/react-accordion";

export const ALL_LAYOUT_ELEMENT_CATEGORIES = [
  'Mesa Redonda', 'Mesa Rectangular', 'Mesa Principal', 'Mobiliario (Sillón)', 'Pista de Baile', 'Cabina de DJ', 'Barra de Tragos', 'Estructura (Toldo/Truss)', 'Planta/Arreglo Floral', 'Elemento Decorativo', 'Otro'
];

export const PALETTE_ITEMS: { category: string; label: string; icon: React.ElementType, default: Partial<LayoutElement> }[] = [
    { category: 'Mesa Redonda', label: 'Mesa Redonda', icon: Circle, default: { width: 80, height: 80, seats: 8 } },
    { category: 'Mesa Rectangular', label: 'Mesa Rectangular', icon: RectangleHorizontal, default: { width: 160, height: 80, seats: 10 } },
    { category: 'Mesa Principal', label: 'Mesa Principal', icon: RectangleHorizontal, default: { width: 200, height: 80, seats: 2 } },
    { category: 'Pista de Baile', label: 'Pista de Baile', icon: Music, default: { width: 150, height: 150 } },
    { category: 'Cabina de DJ', label: 'Cabina de DJ', icon: Music, default: { width: 100, height: 50 } },
    { category: 'Barra de Tragos', label: 'Barra de Tragos', icon: RectangleHorizontal, default: { width: 180, height: 60 } },
    { category: 'Mobiliario (Sillón)', label: 'Sillón / Living', icon: Sofa, default: { width: 120, height: 60 } },
    { category: 'Estructura (Toldo/Truss)', label: 'Estructura', icon: Tent, default: { width: 200, height: 200 } },
    { category: 'Planta/Arreglo Floral', label: 'Planta', icon: Sprout, default: { width: 40, height: 40 } },
    { category: 'Elemento Decorativo', label: 'Decoración', icon: SparklesIcon, default: { width: 30, height: 30 } },
];


function TableGenerationCard({ onGenerate, guestCount, setGuestCount, seatsPerTable, setSeatsPerTable, disabled, setConfirmOpen }: {
  onGenerate: () => void;
  guestCount: number;
  setGuestCount: (value: number) => void;
  seatsPerTable: number;
  setSeatsPerTable: (value: number) => void;
  disabled: boolean;
  setConfirmOpen: (open: boolean) => void;
}) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Generación Automática de Mesas</CardTitle>
        <CardDescription>Crea un plano de mesas basado en la cantidad de invitados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="generate-guest-count">Nº Invitados</Label>
            <Input id="generate-guest-count" type="number" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value) || 0)} min="0" disabled={disabled}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seats-per-table">Asientos por Mesa</Label>
            <Input id="seats-per-table" type="number" value={seatsPerTable} onChange={(e) => setSeatsPerTable(Number(e.target.value) || 1)} min="1" disabled={disabled}/>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => setConfirmOpen(true)} disabled={disabled || guestCount <= 0 || seatsPerTable <= 0} className="w-full">
          Generar y Distribuir Mesas
        </Button>
      </CardFooter>
    </Card>
  );
}

const nameToColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    const color = `hsl(${hash % 360}, 70%, 80%)`;
    return color;
};

const GuestSeat = ({ seatNumber, guest, guestNameStyle, guestIconStyle, style }: {
    seatNumber: number;
    guest?: Invitado;
    style: React.CSSProperties;
    guestNameStyle: 'full' | 'initials' | 'none';
    guestIconStyle: 'color' | 'bw';
}) => {
    let displayName = '';
    if (guest && guestNameStyle !== 'none') {
        if (guestNameStyle === 'full') {
          displayName = guest.nombre;
        } else if (guestNameStyle === 'initials') {
          displayName = guest.nombre.split(' ').map(n => n[0]).join('').toUpperCase();
        }
    }
    
    const iconBaseClass = 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md';
    const initials = guest ? guest.nombre.split(' ').map(n => n[0]).join('').toUpperCase() : '';
    const iconBgColor = guest && guestIconStyle === 'color' ? nameToColor(guest.nombre) : 'bg-gray-200';
    const iconTextColor = guest && guestIconStyle === 'color' ? 'text-gray-700' : 'text-gray-500';

    return (
        <div style={{...style, pointerEvents: 'none', userSelect: 'none'}} className="absolute flex flex-col items-center justify-center w-20 text-center">
            {guest ? (
                <div className={cn(iconBaseClass, iconTextColor)} style={{ backgroundColor: iconBgColor }}>
                    {initials}
                </div>
            ) : (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 font-semibold">
                    {seatNumber}
                </div>
            )}
            {displayName && <span className="text-[9px] font-semibold mt-1 bg-white/80 px-1 rounded shadow truncate max-w-full">{displayName}</span>}
        </div>
    );
};

const DraggableLayoutElement = ({ element, invitados, onDragStop, onDoubleClick, config }: {
  element: LayoutElement;
  invitados: Invitado[];
  onDragStop: (e: DraggableEvent, data: DraggableData, elementId: string) => void;
  onDoubleClick: (element: LayoutElement) => void;
  config: { guestNameStyle: 'full' | 'initials' | 'none', guestIconStyle: 'color' | 'bw', layoutMode: 'libre' | 'asignado' };
}) => {
  const nodeRef = useRef(null);
  
  const isTable = element.category?.toLowerCase().includes('mesa');
  const isRound = element.category === 'Mesa Redonda';

  const assignedGuests = React.useMemo(() => 
    isTable && config.layoutMode === 'asignado' ? invitados.filter(inv => inv.tableNumber === element.name) : [], 
  [invitados, element.name, isTable, config.layoutMode]);

  const renderSeats = () => {
    if (!isTable || config.layoutMode !== 'asignado') return null;

    const seatCount = element.seats || (isRound ? 8 : 10);
    const seats = [];
    
    const seatOccupants: (Invitado | undefined)[] = [...assignedGuests];
    while(seatOccupants.length < seatCount) {
        seatOccupants.push(undefined);
    }

    if (isRound) {
        const radius = (Math.min(element.width, element.height) / 2) + 20; // Increased radius
        for (let i = 0; i < seatCount; i++) {
            const angle = (i / seatCount) * 2 * Math.PI - Math.PI / 2;
            const guest = seatOccupants[i];
            const style: React.CSSProperties = {
                left: `50%`,
                top: `50%`,
                transform: `translate(-50%, -50%) translate(${radius * Math.cos(angle)}px, ${radius * Math.sin(angle)}px)`
            };
            seats.push(<GuestSeat key={i} seatNumber={i + 1} guest={guest} style={style} {...config} />);
        }
    } else { // Rectangular
        const seatsTop = Math.ceil(seatCount / 2);
        const seatsBottom = seatCount - seatsTop;
        
        for(let i = 0; i < seatsTop; i++) {
            const guest = seatOccupants[i];
            const xPosPercent = (100 / (seatsTop + 1)) * (i + 1);
            const style: React.CSSProperties = { left: `${xPosPercent}%`, top: `-45px`, transform: 'translateX(-50%)' };
            seats.push(<GuestSeat key={`top-${i}`} seatNumber={i + 1} guest={guest} style={style} {...config}/>);
        }
        
        for(let i = 0; i < seatsBottom; i++) {
            const guest = seatOccupants[seatsTop + i];
            const xPosPercent = (100 / (seatsBottom + 1)) * (i + 1);
            const style: React.CSSProperties = { left: '50%', top: `${element.height + 5}px`, transform: `translateX(-50%) translateY(${i * 40}px)` };
            seats.push(<GuestSeat key={`bottom-${i}`} seatNumber={seatsTop + i + 1} guest={guest} style={style} {...config} />);
        }
    }
    return <div className="absolute inset-0 pointer-events-none">{seats}</div>;
  };

  const tableStyle = `absolute inset-0 border-4 border-gray-400 bg-white/80 flex items-center justify-center text-gray-700 font-bold text-lg cursor-move shadow-lg ${isRound ? 'rounded-full' : 'rounded-sm'}`;

  return (
    <Draggable nodeRef={nodeRef} bounds="parent" position={{ x: element.x, y: element.y }} onStop={(e, data) => onDragStop(e, data, element.id)} >
      <div ref={nodeRef} style={{ position: 'absolute', width: `${element.width}px`, height: `${element.height}px` }}>
        <div style={{ transform: `rotate(${element.rotation || 0}deg)`, width: '100%', height: '100%'}} onDoubleClick={() => onDoubleClick(element)}>
          <div className={tableStyle}>
            <span>{element.name}</span>
          </div>
        </div>
        {renderSeats()}
      </div>
    </Draggable>
  );
};

const DesignConfigSidebar = ({ decoracionData, onConfigChange, onInputChange, disabled, onSaveTemplate, onLoadTemplate }: {
    decoracionData: DecoracionData,
    onConfigChange: (key: keyof DecoracionData, value: string) => void,
    onInputChange: (key: keyof DecoracionData, value: string) => void,
    disabled: boolean,
    onSaveTemplate: () => void,
    onLoadTemplate: () => void,
}) => {
  return (
    <Card className="w-full md:w-80 flex-shrink-0 shadow-lg">
      <CardHeader><CardTitle>Configuración del Diseño</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="font-semibold">Nombre del Diseño</Label>
          <Input 
            value={decoracionData.layoutTemplateName || ''} 
            onChange={(e) => onInputChange('layoutTemplateName', e.target.value)} 
            placeholder="Ej: Boda Salón Principal"
            className="mt-2"
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-2">
            <Button onClick={onSaveTemplate} variant="secondary" disabled={disabled}><Save className="w-4 h-4 mr-2"/>Guardar Plantilla</Button>
            <Button onClick={onLoadTemplate} variant="outline" disabled={disabled}><FolderOpen className="w-4 h-4 mr-2"/>Cargar Plantilla</Button>
        </div>
        <Separator/>
        <div>
          <Label className="font-semibold">Cómo mostrar los nombres</Label>
          <RadioGroup value={decoracionData.guestNameStyle} onValueChange={(v) => onConfigChange('guestNameStyle', v)} className="mt-2 space-y-2">
            <div className="flex items-center space-x-2"><RadioGroupItem value="full" id="name-full" /><Label htmlFor="name-full">Nombre completo</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="initials" id="name-initials" /><Label htmlFor="name-initials">Iniciales</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="name-none" /><Label htmlFor="name-none">No mostrar nombres</Label></div>
          </RadioGroup>
        </div>
        <Separator/>
        <div>
          <Label className="font-semibold">Estilo de los iconos</Label>
           <RadioGroup value={decoracionData.guestIconStyle} onValueChange={(v) => onConfigChange('guestIconStyle', v)} className="mt-2 space-y-2">
            <div className="flex items-center space-x-2"><RadioGroupItem value="color" id="icon-color" /><Label htmlFor="icon-color">Iconos coloreados</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="bw" id="icon-bw" /><Label htmlFor="icon-bw">Iconos en blanco y negro</Label></div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};


export default function SalonLayoutPage() {
  const params = use(params);
  const { toast } = useToast();
  const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
  const [decoracionData, setDecoracionData] = useState<DecoracionData>(defaultDecoracion);
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isElementSheetOpen, setIsElementSheetOpen] = useState(false);
  const [currentLayoutElement, setCurrentLayoutElement] = useState<Partial<LayoutElement> | null>(null);

  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  // Table Generation State
  const [generateGuestCount, setGenerateGuestCount] = useState<number>(0);
  const [seatsPerTable, setSeatsPerTable] = useState<number>(8);
  const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);
  
  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Template State
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<SalonLayoutTemplate[]>([]);
  const [isTemplateProcessing, setIsTemplateProcessing] = useState(false);
  const [processingPointName, setProcessingPointName] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFailedImageUrls({});
    try {
      const fiestaData = await getFiestaActual();
      setFiesta(fiestaData);
      setDecoracionData(fiestaData.decoracion || defaultDecoracion);
      setInvitados(fiestaData.invitados || []);
      setGenerateGuestCount(Number(fiestaData.configuracion.invitadosEstimados) || 0);
    } catch (err: any) {
      setError("No se pudo cargar la configuración de diseño del salón.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleInputChange = (
    field: keyof DecoracionData,
    value: DecoracionData[keyof DecoracionData]
  ) => {
    setDecoracionData(prev => ({ ...prev, [field]: value }));
    if (field === 'salonPlanBackgroundImageUrl') {
        setFailedImageUrls(prevFailed => ({...prevFailed, salonPlanBackgroundImageUrl: false}));
    }
  };
  
  const handleConfigChange = (
    field: 'guestNameStyle' | 'guestIconStyle' | 'layoutMode',
    value: string
  ) => {
    setDecoracionData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(decoracionData);
      if (result.success) {
        toast({ title: "¡Diseño Guardado!", description: "La disposición del salón se ha actualizado." });
        if (result.updatedData) {
            setDecoracionData(prev => ({...prev, ...result.updatedData}));
        }
      } else {
        throw new Error(result.error || "Error desconocido al guardar el diseño.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openElementSheet = (element?: LayoutElement) => {
    setCurrentLayoutElement(element || { name: '', width: 50, height: 50, x: 50, y: 50, rotation: 0, seats: 8, quantity: 1, type: 'custom', category: 'Otro' });
    setIsElementSheetOpen(true);
  };
  
  const addElementFromPalette = (category: string, defaults: Partial<LayoutElement>) => {
    const newElement: LayoutElement = {
      id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${category} ${decoracionData.salonElements?.filter(e => e.category === category).length + 1}`,
      x: 100,
      y: 100,
      rotation: 0,
      quantity: 1,
      category: category,
      type: 'predefined',
      ...defaults,
    };
    setDecoracionData(prev => ({
        ...prev,
        salonElements: [...(prev.salonElements || []), newElement]
    }));
  };

  const handleGenerateTables = () => {
    const numGuests = generateGuestCount;
    const numSeats = seatsPerTable;
    if (numGuests <= 0 || numSeats <= 0) return;

    const numberOfTables = Math.ceil(numGuests / numSeats);
    const tablesPerRow = 4;
    const tableWidth = 100;
    const tableHeight = 100;
    const gap = 50;

    const newTables = Array.from({ length: numberOfTables }).map((_, i) => {
        const row = Math.floor(i / tablesPerRow);
        const col = i % tablesPerRow;
        const newTable: LayoutElement = {
            id: `auto_table_${Date.now()}_${i}`,
            name: `Mesa ${i + 1}`,
            category: 'Mesa Redonda',
            type: 'predefined',
            x: 50 + col * (tableWidth + gap),
            y: 50 + row * (tableHeight + gap),
            width: tableWidth,
            height: tableHeight,
            rotation: 0,
            seats: numSeats,
            quantity: 1,
        };
        return newTable;
    });

    setDecoracionData(prev => ({
        ...prev,
        salonElements: (prev.salonElements?.filter(el => !el.id.startsWith('auto_table_')) || []).concat(newTables)
    }));
    setConfirmGenerateOpen(false);
    toast({ title: "Mesas Generadas", description: `${numberOfTables} mesas han sido añadidas al plano.` });
  };


  const handleLayoutElementChange = (field: keyof LayoutElement, value: string | number) => {
    setCurrentLayoutElement(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleSaveLayoutElement = () => {
    if (!currentLayoutElement || !currentLayoutElement.name?.trim()) {
      toast({ title: "Nombre Requerido", variant: "destructive" });
      return;
    }
    const finalElement = { ...currentLayoutElement, id: currentLayoutElement.id || `layout_${Date.now()}` } as LayoutElement;
    setDecoracionData(prev => {
        const salonElements = prev.salonElements || [];
        const index = salonElements.findIndex(el => el.id === finalElement.id);
        if (index > -1) {
            salonElements[index] = finalElement;
            return { ...prev, salonElements: [...salonElements] };
        }
        return { ...prev, salonElements: [...salonElements, finalElement] };
    });
    setIsElementSheetOpen(false);
  };

  const handleDeleteLayoutElement = (elementId: string) => {
    setDecoracionData(prev => ({
        ...prev,
        salonElements: (prev.salonElements || []).filter(el => el.id !== elementId)
    }));
  };

  const handleDragStop = (e: DraggableEvent, data: DraggableData, elementId: string) => {
    setDecoracionData(prev => {
        const salonElements = (prev.salonElements || []).map(el =>
            el.id === elementId ? { ...el, x: data.x, y: data.y } : el
        );
        return { ...prev, salonElements };
    });
  };

  const handleOpenLoadTemplateModal = async () => {
    setIsTemplateProcessing(true);
    try {
        const tpls = await getSalonLayoutTemplates();
        setTemplates(tpls);
    } catch(e) {
        toast({title: "Error", description: "No se pudieron cargar las plantillas."});
    } finally {
        setIsTemplateProcessing(false);
        setIsLoadTemplateModalOpen(true);
    }
  };

  const handleSaveTemplate = async () => {
    const layoutNameToSave = decoracionData.layoutTemplateName?.trim();
    if (!layoutNameToSave) {
        toast({ title: "Falta Nombre", description: "Asigna un nombre al diseño para guardarlo como plantilla.", variant: "destructive" });
        return;
    }
    setIsTemplateProcessing(true);
    try {
        const result = await saveSalonLayoutTemplate(layoutNameToSave, decoracionData);
        if (result.success) {
            toast({ title: "Plantilla Guardada", description: `Se ha guardado "${layoutNameToSave}".` });
            setIsSaveTemplateModalOpen(false);
        } else {
            throw new Error(result.error);
        }
    } catch(e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
        setIsTemplateProcessing(false);
    }
  };

  const handleLoadTemplate = (template: SalonLayoutTemplate) => {
    setDecoracionData(prev => ({
        ...prev,
        ...template.layoutData
    }));
    toast({ title: "Plantilla Cargada", description: `Se ha cargado el diseño "${template.name}".`});
    setIsLoadTemplateModalOpen(false);
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    setProcessingPointName(templateId);
    try {
        const result = await deleteSalonLayoutTemplate(templateId);
        if(result.success) {
            toast({ title: "Plantilla Eliminada" });
            const tpls = await getSalonLayoutTemplates();
            setTemplates(tpls);
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ title: "Error al Eliminar", description: e.message, variant: "destructive" });
    } finally {
        setProcessingPointName(null);
    }
  };

  const DesignerCanvas = ({ isFullscreen }: { isFullscreen: boolean }) => (
    <div
      className={cn(
        "relative flex-1 w-full border-2 border-dashed rounded-lg bg-muted/30 overflow-hidden canvas-grid-background",
        isFullscreen ? "h-full" : "h-[600px]"
      )}
      style={{
        width: isFullscreen ? '100%' : `${decoracionData.salonWidth || 800}px`,
        height: isFullscreen ? '100%' : `${decoracionData.salonHeight || 600}px`,
      }}
    >
      {decoracionData.salonPlanBackgroundImageUrl && !failedImageUrls['salonPlanBackgroundImageUrl'] && (
        <NextImage src={decoracionData.salonPlanBackgroundImageUrl} alt="Plano del Salón" layout="fill" objectFit="contain" onError={() => setFailedImageUrls(p => ({...p, salonPlanBackgroundImageUrl: true}))} data-ai-hint="event floor plan"/>
      )}
      {(decoracionData.salonElements || []).map(element => (
        <DraggableLayoutElement key={element.id} element={{...element}} invitados={invitados} onDragStop={handleDragStop} onDoubleClick={openElementSheet}
            config={{
                guestNameStyle: decoracionData.guestNameStyle || 'full',
                guestIconStyle: decoracionData.guestIconStyle || 'color',
                layoutMode: decoracionData.layoutMode || 'libre'
            }}
        />
      ))}
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando diseñador...</p></div>;
  if (error) return <div className="py-10 text-center text-red-600"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold">{error}</p><Button onClick={loadData} className="mt-4">Reintentar</Button></div>;

  return (
    <div className="space-y-6">
        <AlertDialog open={confirmGenerateOpen} onOpenChange={setConfirmGenerateOpen}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>¿Confirmar Generación?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará las mesas generadas previamente y creará una nueva distribución. ¿Deseas continuar?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleGenerateTables}>Sí, Generar</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen}>
            <DialogContent><DialogHeader><DialogTitle>Guardar Diseño como Plantilla</DialogTitle></DialogHeader>
                <div className="py-2 space-y-2"><Label htmlFor="template-name-save">Nombre de la Plantilla</Label><Input id="template-name-save" value={decoracionData.layoutTemplateName || ''} onChange={e => handleInputChange('layoutTemplateName', e.target.value)} placeholder="Ej: Salón Club Uruguay"/></div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button onClick={handleSaveTemplate} disabled={isTemplateProcessing}>{isTemplateProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar</Button></DialogFooter>
        </Dialog>
        
        <Dialog open={isLoadTemplateModalOpen} onOpenChange={setIsLoadTemplateModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Cargar Diseño desde Plantilla</DialogTitle></DialogHeader>
                {isTemplateProcessing ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin"/></div> : templates.length > 0 ? (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {templates.map(t => (
                        <li key={t.name} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{t.name}</span>
                        <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleLoadTemplate(t)}>Cargar</Button>
                            <Button size="icon" variant="destructive" onClick={() => handleDeleteTemplate(t.id)} disabled={processingPointName===t.id}>{processingPointName===t.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}</Button>
                        </div>
                        </li>
                    ))}
                    </ul>
                ) : <p className="p-4 text-center text-muted-foreground">No hay plantillas guardadas.</p>}
                <DialogFooter><DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>

        <Sheet open={isElementSheetOpen} onOpenChange={setIsElementSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-headline text-lg">{currentLayoutElement?.id ? 'Editar' : 'Añadir'} Elemento</SheetTitle>
          </SheetHeader>
          {currentLayoutElement && (
            <div className="py-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="layout-el-name">Nombre (Ej: "Mesa 5", "Pista") *</Label>
                <Input id="layout-el-name" value={currentLayoutElement.name || ''} onChange={(e) => handleLayoutElementChange('name', e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="layout-el-cat">Categoría</Label>
                <Select value={currentLayoutElement.category || 'Otro'} onValueChange={(val) => handleLayoutElementChange('category', val)}><SelectTrigger><SelectValue placeholder="Seleccionar categoría..."/></SelectTrigger><SelectContent>{ALL_LAYOUT_ELEMENT_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select>
              </div>
              {currentLayoutElement.category?.toLowerCase().includes('mesa') && (
                <div className="space-y-1">
                  <Label htmlFor="layout-el-seats">Asientos</Label>
                  <Input id="layout-el-seats" type="number" value={currentLayoutElement.seats || 0} onChange={(e) => handleLayoutElementChange('seats', Number(e.target.value) || 0)} min="0"/>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1"><Label htmlFor="layout-el-w">Ancho (px)</Label><Input id="layout-el-w" type="number" value={currentLayoutElement.width || 50} onChange={(e) => handleLayoutElementChange('width', Number(e.target.value) || 50)}/></div>
                 <div className="space-y-1"><Label htmlFor="layout-el-h">Alto (px)</Label><Input id="layout-el-h" type="number" value={currentLayoutElement.height || 50} onChange={(e) => handleLayoutElementChange('height', Number(e.target.value) || 50)}/></div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="layout-el-rotation">Rotación ({currentLayoutElement.rotation || 0}°)</Label>
                <Slider id="layout-el-rotation" min={0} max={360} step={1} value={[currentLayoutElement.rotation || 0]} onValueChange={(val) => handleLayoutElementChange('rotation', val[0])}/>
              </div>
            </div>
          )}
          <SheetFooter className="gap-2">
            {currentLayoutElement?.id && <Button variant="destructive" size="sm" onClick={() => {handleDeleteLayoutElement(currentLayoutElement!.id!); setIsElementSheetOpen(false);}}><Trash2 className="w-4 h-4 mr-2"/>Eliminar del Plano</Button>}
            <Button variant="outline" onClick={() => setIsElementSheetOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveLayoutElement}>Guardar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <div className={cn("space-y-6", isFullscreen && "hidden")}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight font-headline">Diseño del Salón y Mesas</h1>
                  {fiesta?.configuracion.nombreLugar && <p className="text-muted-foreground flex items-center gap-1.5 text-sm"><Building className="w-4 h-4"/>{fiesta.configuracion.nombreLugar}</p>}
                </div>
            </div>
            <Link href="/fiestas/nueva/invitados" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver a Invitados</Button></Link>
        </div>
      
       <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-grow space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><Settings2 className="text-primary"/>Modo de Disposición</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={decoracionData.layoutMode || 'libre'} onValueChange={(value) => handleConfigChange('layoutMode', value as 'libre' | 'asignado')} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Label htmlFor="mode-libre" className={`p-4 border-2 rounded-lg cursor-pointer ${decoracionData.layoutMode === 'libre' ? 'border-primary bg-primary/5' : 'border-border'}`}><div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="libre" id="mode-libre" /><span className="font-semibold text-base">Mesas Libres</span></div><p className="text-sm text-muted-foreground ml-6">Diseña la disposición del salón sin asignar invitados a mesas específicas.</p></Label>
                        <Label htmlFor="mode-asignado" className={`p-4 border-2 rounded-lg cursor-pointer ${decoracionData.layoutMode === 'asignado' ? 'border-primary bg-primary/5' : 'border-border'}`}><div className="flex items-center space-x-2 mb-2"><RadioGroupItem value="asignado" id="mode-asignado" /><span className="font-semibold text-base">Mesas Asignadas</span></div><p className="text-sm text-muted-foreground ml-6">Sincroniza con la lista de invitados para ver quién se sienta en cada mesa.</p></Label>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="font-headline text-xl">Diseñador del Salón</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(true)} title="Pantalla Completa"><Expand className="w-5 h-5"/></Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DesignerCanvas isFullscreen={false} />
                    <div className="flex justify-between items-start pt-2 gap-2 flex-wrap">
                        <Link href="/fiestas/nueva/decoracion/pdf?layout=true" passHref><Button type="button" variant="secondary" size="sm"><Printer className="w-4 h-4 mr-1.5"/>Imprimir Plano con Nombres</Button></Link>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Pointer className="w-3.5 h-3.5"/> Haz doble clic en un elemento para editarlo.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="w-full md:w-80 space-y-6">
            <TableGenerationCard 
              guestCount={generateGuestCount}
              setGuestCount={setGenerateGuestCount}
              seatsPerTable={seatsPerTable}
              setSeatsPerTable={setSeatsPerTable}
              onGenerate={handleGenerateTables}
              disabled={isSaving}
              setConfirmOpen={setConfirmGenerateOpen}
            />
            <DesignConfigSidebar 
                decoracionData={decoracionData}
                onConfigChange={handleConfigChange}
                onInputChange={(key, val) => handleInputChange(key, val as string)}
                disabled={isSaving}
                onSaveTemplate={() => setIsSaveTemplateModalOpen(true)}
                onLoadTemplate={handleOpenLoadTemplateModal}
            />
             <Card className="shadow-lg">
                <CardHeader><CardTitle className="font-headline">Añadir Elementos</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    {PALETTE_ITEMS.map(item => (
                        <Button key={item.category} variant="outline" className="h-auto flex-col p-2 gap-1" onClick={() => addElementFromPalette(item.category, item.default)}><item.icon className="w-5 h-5"/><span className="text-xs text-center">{item.label}</span></Button>
                    ))}
                    <Button variant="outline" className="h-auto flex-col p-2 gap-1 border-dashed" onClick={() => openElementSheet()}>
                        <PlusCircle className="w-5 h-5"/>
                        <span className="text-xs text-center">+ Otro</span>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
       <div className={cn("flex justify-end pt-6 border-t", isFullscreen && "hidden")}>
        <Button onClick={handleSaveLayout} disabled={isSaving || isLoading} size="lg">
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {isSaving ? 'Guardando Diseño...' : 'Guardar Diseño del Salón'}
        </Button>
      </div>
      </div>

       {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold">Modo Pantalla Completa</h2>
                <Button variant="outline" size="icon" onClick={() => setIsFullscreen(false)} title="Salir de pantalla completa">
                    <Minimize className="w-5 h-5"/>
                </Button>
            </div>
            <div className="flex-grow relative">
                 <DesignerCanvas isFullscreen={true} />
            </div>
        </div>
      )}
    </div>
  );
}

    