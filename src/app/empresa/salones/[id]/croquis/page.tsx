'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Draggable, { type DraggableData } from 'react-draggable';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Beer,
  Box,
  ChevronsDown,
  ChevronsUp,
  Circle,
  Clapperboard,
  Disc,
  Layers,
  LayoutDashboard,
  Loader2,
  Monitor,
  PlusCircle,
  RotateCw,
  Save,
  Settings2,
  Sofa,
  Square,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DecoracionData, LayoutElement, LayoutElementType } from '@/types/fiesta';
import { getSalones, saveSalon } from '@/app/actions/salones';
import type { Salon } from '@/types/salon';
import { cn } from '@/lib/utils';

const SalonScene = dynamic(() => import('@/components/salon-3d/SalonScene'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-slate-900 rounded-[1.5rem]">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Cargando Vista 3D...</p>
    </div>
  ),
});

const PIXELS_PER_METER = 40;
const GRID = 10;

const defaultLayout: DecoracionData = {
  salonElements: [],
  salonWidth: 15,
  salonHeight: 15,
  pixelsPerMeter: PIXELS_PER_METER,
};

// ─── Simple Draggable Element ─────────────────────────────────────────────────

const SimpleDraggableElement: React.FC<{
  el: LayoutElement;
  isSelected: boolean;
  onSelect: () => void;
  onStop: (e: any, data: DraggableData) => void;
  onEdit: () => void;
  onRotate: () => void;
  onDelete: () => void;
  onLayer: (dir: 'up' | 'down') => void;
}> = ({ el, isSelected, onSelect, onStop, onEdit, onRotate, onDelete, onLayer }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isRound = el.shape === 'circle';
  const isArea = el.type === 'area';

  return (
    <Draggable
      nodeRef={nodeRef}
      bounds="parent"
      grid={[GRID, GRID]}
      position={{ x: el.x, y: el.y }}
      onStop={onStop}
    >
      <div
        ref={nodeRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn('absolute cursor-grab active:cursor-grabbing', isSelected ? 'z-50' : 'z-10')}
        style={{ width: el.width, height: el.height }}
      >
        <div className="w-full h-full relative" style={{ transform: `rotate(${el.rotation}deg)` }}>
          <div
            className={cn(
              'w-full h-full border-2 flex flex-col p-1 overflow-hidden transition-all duration-200',
              isRound && 'rounded-full',
              isSelected ? 'border-primary shadow-2xl' : 'border-slate-400 shadow-sm',
            )}
            style={{ backgroundColor: el.backgroundColor || (isArea ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.9)') }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <p className={cn('text-[10px] font-black text-center truncate uppercase tracking-tighter', isArea ? 'text-blue-800' : 'text-slate-800')}>
                {el.name}
              </p>
              {!isArea && el.seats && (
                <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{el.seats} asientos</p>
              )}
            </div>
          </div>
        </div>

        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl p-1.5 rounded-2xl z-[100]"
            style={{ transform: `translateX(-50%) rotate(-${el.rotation}deg)` }}
          >
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Editar">
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); onRotate(); }} title="Rotar 45°">
              <RotateCw className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-100" title="Capas">
                  <Layers className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="rounded-xl">
                <DropdownMenuItem onClick={() => onLayer('up')}><ChevronsUp className="w-4 h-4 mr-2" /> Traer al Frente</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLayer('down')}><ChevronsDown className="w-4 h-4 mr-2" /> Enviar al Fondo</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </Draggable>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

function CroquisContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const salonId = params?.id as string;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [layout, setLayout] = useState<DecoracionData>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view3d, setView3d] = useState(false);
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editingEl, setEditingEl] = useState<LayoutElement | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customEl, setCustomEl] = useState({ name: '', width: 2, height: 1, seats: 8, shape: 'circle' as 'circle' | 'rectangle', type: 'element' as 'element' | 'area' });

  const [isDimensionsOpen, setIsDimensionsOpen] = useState(false);
  const [dimForm, setDimForm] = useState({ width: 15, height: 15 });

  const salonSceneRef = useRef<{ captureScreenshot: () => string | null } | null>(null);

  const loadData = useCallback(async () => {
    if (!salonId) return;
    setIsLoading(true);
    try {
      const salones = await getSalones();
      const s = salones.find((x) => x.id === salonId);
      if (!s) throw new Error('Salón no encontrado.');
      setSalon(s);
      if (s.salonLayout) {
        const l = s.salonLayout as DecoracionData;
        if (!Array.isArray(l.salonElements)) l.salonElements = [];
        l.salonElements = l.salonElements.filter(
          (el: LayoutElement) => el && el.id && typeof el.x === 'number' && typeof el.y === 'number'
        );
        setLayout({
          ...defaultLayout,
          ...l,
          pixelsPerMeter: l.pixelsPerMeter || PIXELS_PER_METER,
          salonWidth: l.salonWidth || 15,
          salonHeight: l.salonHeight || 15,
        });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      router.replace('/empresa/salones');
    } finally {
      setIsLoading(false);
    }
  }, [salonId, toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!salon) return;
    setIsSaving(true);
    try {
      const result = await saveSalon({ ...salon, salonLayout: layout });
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Diseño guardado', description: 'El diseño del salón fue guardado correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStop = (e: any, data: DraggableData, id: string) => {
    setLayout((prev) => ({
      ...prev,
      salonElements: (prev.salonElements || []).map((el) =>
        el.id === id ? { ...el, x: Math.round(data.x / GRID) * GRID, y: Math.round(data.y / GRID) * GRID } : el
      ),
    }));
  };

  const addElement = (category: string, customProps?: Partial<LayoutElement>, type: LayoutElementType = 'element') => {
    const ppm = layout.pixelsPerMeter || PIXELS_PER_METER;
    let defaults: Partial<LayoutElement> = { width: 2 * ppm, height: 2 * ppm, seats: 8, shape: 'circle' };
    if (category === 'Mesa Rectangular') { defaults = { width: 3 * ppm, height: 1.5 * ppm, seats: 8, shape: 'rectangle' }; }
    else if (category === 'Pista de Baile') { defaults = { width: 6 * ppm, height: 5 * ppm, seats: undefined, backgroundColor: 'rgba(56, 189, 248, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Escenario') { defaults = { width: 5 * ppm, height: 3 * ppm, seats: undefined, backgroundColor: 'rgba(139, 92, 246, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Barra') { defaults = { width: 4 * ppm, height: 1.5 * ppm, seats: undefined, backgroundColor: 'rgba(16, 185, 129, 0.2)', shape: 'rectangle' }; }
    else if (category === 'Living') { defaults = { width: 4 * ppm, height: 4 * ppm, seats: undefined, backgroundColor: 'rgba(234, 179, 8, 0.2)', shape: 'rectangle' }; }

    const newEl: LayoutElement = {
      id: `el_${Date.now()}`,
      name: customProps?.name || `${category} ${(layout.salonElements?.filter((e) => e.category === category).length || 0) + 1}`,
      x: 40, y: 40, rotation: 0,
      zIndex: type === 'area' ? 0 : (layout.salonElements?.length || 0) + 1,
      ...defaults,
      ...customProps,
      category,
      type,
    };

    setLayout((prev) => ({ ...prev, salonElements: [...(prev.salonElements || []), newEl] }));
  };

  const handleAddCustom = () => {
    if (!customEl.name.trim()) {
      toast({ title: 'Nombre requerido', variant: 'destructive' });
      return;
    }
    const ppm = layout.pixelsPerMeter || PIXELS_PER_METER;
    addElement(
      customEl.type === 'area' ? 'Área' : 'Varios',
      {
        name: customEl.name,
        width: customEl.width * ppm,
        height: customEl.height * ppm,
        seats: customEl.shape === 'circle' ? customEl.seats : undefined,
        shape: customEl.shape,
        backgroundColor: customEl.type === 'area' ? 'rgba(59, 130, 246, 0.2)' : undefined,
      },
      customEl.type
    );
    setIsCustomOpen(false);
    setCustomEl({ name: '', width: 2, height: 1, seats: 8, shape: 'circle', type: 'element' });
  };

  const handleRotate = (id: string) => {
    setLayout((prev) => ({
      ...prev,
      salonElements: (prev.salonElements || []).map((el) =>
        el.id === id ? { ...el, rotation: (el.rotation + 45) % 360 } : el
      ),
    }));
  };

  const handleDelete = (id: string) => {
    setLayout((prev) => ({
      ...prev,
      salonElements: (prev.salonElements || []).filter((el) => el.id !== id),
    }));
    setSelectedId(null);
  };

  const handleLayer = (id: string, dir: 'up' | 'down') => {
    setLayout((prev) => ({
      ...prev,
      salonElements: (prev.salonElements || []).map((el) =>
        el.id === id ? { ...el, zIndex: (el.zIndex || 0) + (dir === 'up' ? 1 : -1) } : el
      ),
    }));
  };

  const handleUpdateEl = () => {
    if (!editingEl) return;
    setLayout((prev) => ({
      ...prev,
      salonElements: (prev.salonElements || []).map((el) => (el.id === editingEl.id ? editingEl : el)),
    }));
    setIsEditOpen(false);
    setEditingEl(null);
  };

  const pixelsPerMeter = layout.pixelsPerMeter || PIXELS_PER_METER;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter font-headline uppercase">
              Diseño del Salón
            </h1>
            {salon && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{salon.nombre}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Guardando...' : 'Guardar Diseño'}
          </Button>
          <Link href="/empresa/salones">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-white border rounded-2xl px-4 py-2 shadow-sm">
        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.2, s / 1.2))}>
            <ZoomOut className="w-4 h-4 text-slate-400" />
          </Button>
          <span className="text-[10px] font-black w-10 text-center text-slate-400">{Math.round(scale * 100)}%</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setScale((s) => Math.min(3, s * 1.2))}>
            <ZoomIn className="w-4 h-4 text-slate-400" />
          </Button>
        </div>

        {/* 2D / 3D Toggle */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl">
          <Button size="sm" variant={!view3d ? 'default' : 'ghost'} className="rounded-lg h-8 px-3 text-[10px] font-black uppercase" onClick={() => setView3d(false)}>
            <Monitor className="w-3.5 h-3.5 mr-1.5" />2D
          </Button>
          <Button size="sm" variant={view3d ? 'default' : 'ghost'} className="rounded-lg h-8 px-3 text-[10px] font-black uppercase" onClick={() => setView3d(true)}>
            <Box className="w-3.5 h-3.5 mr-1.5" />3D
          </Button>
        </div>

        {/* Add element */}
        {!view3d && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="rounded-xl h-9 px-5 font-bold shadow-lg shadow-primary/20">
                <PlusCircle className="w-4 h-4 mr-2" />Añadir Elemento
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-2">
              <DropdownMenuGroup>
                <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Mesa Redonda')}><Circle className="w-4 h-4 mr-2 text-primary" /> Mesa Redonda</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Mesa Rectangular')}><Square className="w-4 h-4 mr-2 text-primary" /> Mesa Rectangular</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Living')}><Sofa className="w-4 h-4 mr-2 text-primary" /> Living / Relax</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Pista de Baile', undefined, 'area')}><Disc className="w-4 h-4 mr-2 text-indigo-500" /> Pista de Baile</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Escenario', undefined, 'area')}><Clapperboard className="w-4 h-4 mr-2 text-indigo-500" /> Escenario</DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl" onClick={() => addElement('Barra', undefined, 'area')}><Beer className="w-4 h-4 mr-2 text-emerald-500" /> Barra de Tragos</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="rounded-xl font-bold text-primary" onClick={() => setIsCustomOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Crear Personalizado...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Canvas */}
      <Card className="flex-1 overflow-hidden shadow-lg">
        <CardContent
          className={cn('h-full p-0 overflow-auto', view3d ? 'bg-slate-900' : 'bg-slate-50/30 canvas-grid-background')}
          onClick={() => setSelectedId(null)}
        >
          {view3d ? (
            <div className="w-full h-full min-h-[500px]">
              <SalonScene captureRef={salonSceneRef} decoracion={layout} />
            </div>
          ) : (
            <div
              className="relative canvas-grid-background"
              style={{
                width: `${(layout.salonWidth || 15) * pixelsPerMeter}px`,
                height: `${(layout.salonHeight || 15) * pixelsPerMeter}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {(layout.salonElements || [])
                .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                .map((el) => (
                  <SimpleDraggableElement
                    key={el.id}
                    el={el}
                    isSelected={selectedId === el.id}
                    onSelect={() => setSelectedId(el.id)}
                    onStop={(e, data) => handleDragStop(e, data, el.id)}
                    onEdit={() => { setEditingEl({ ...el }); setIsEditOpen(true); }}
                    onRotate={() => handleRotate(el.id)}
                    onDelete={() => handleDelete(el.id)}
                    onLayer={(dir) => handleLayer(el.id, dir)}
                  />
                ))}
              {(layout.salonElements || []).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-slate-300 font-bold text-sm">Usá el botón &quot;Añadir Elemento&quot; para empezar a diseñar el salón</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salon dimensions info */}
      <div className="flex gap-4 text-xs text-slate-400 font-medium items-center">
        <span>Ancho: {layout.salonWidth || 15}m</span>
        <span>Alto: {layout.salonHeight || 15}m</span>
        <span>{layout.salonElements?.length || 0} elementos</span>
        <Button
          variant="link"
          size="sm"
          className="text-xs h-auto p-0 text-slate-400"
          onClick={() => {
            setDimForm({ width: layout.salonWidth || 15, height: layout.salonHeight || 15 });
            setIsDimensionsOpen(true);
          }}
        >
          Cambiar dimensiones
        </Button>
      </div>

      {/* Dimensions Dialog */}
      <Dialog open={isDimensionsOpen} onOpenChange={setIsDimensionsOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Dimensiones del Salón</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ancho (metros)</Label>
              <Input type="number" min="1" max="100" value={dimForm.width} onChange={(e) => setDimForm((p) => ({ ...p, width: parseInt(e.target.value) || 15 }))} />
            </div>
            <div className="space-y-1">
              <Label>Alto (metros)</Label>
              <Input type="number" min="1" max="100" value={dimForm.height} onChange={(e) => setDimForm((p) => ({ ...p, height: parseInt(e.target.value) || 15 }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={() => {
              setLayout((prev) => ({ ...prev, salonWidth: dimForm.width, salonHeight: dimForm.height }));
              setIsDimensionsOpen(false);
            }}><Save className="w-4 h-4 mr-2" />Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Element Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Elemento</DialogTitle>
          </DialogHeader>
          {editingEl && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input value={editingEl.name} onChange={(e) => setEditingEl({ ...editingEl, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Ancho (px)</Label>
                  <Input type="number" value={editingEl.width ?? ''} onChange={(e) => setEditingEl({ ...editingEl, width: parseInt(e.target.value) || 80 })} />
                </div>
                <div className="space-y-1">
                  <Label>Alto (px)</Label>
                  <Input type="number" value={editingEl.height ?? ''} onChange={(e) => setEditingEl({ ...editingEl, height: parseInt(e.target.value) || 80 })} />
                </div>
              </div>
              {editingEl.type !== 'area' && (
                <div className="space-y-1">
                  <Label>Asientos</Label>
                  <Input type="number" value={editingEl.seats ?? ''} onChange={(e) => setEditingEl({ ...editingEl, seats: parseInt(e.target.value) || 0 })} />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdateEl}><Save className="w-4 h-4 mr-2" />Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Element Dialog */}
      <Dialog open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Crear Elemento Personalizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={customEl.name} onChange={(e) => setCustomEl({ ...customEl, name: e.target.value })} placeholder="Ej: Barra de bebidas" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ancho (m)</Label>
                <Input type="number" value={customEl.width} onChange={(e) => setCustomEl({ ...customEl, width: parseFloat(e.target.value) || 2 })} />
              </div>
              <div className="space-y-1">
                <Label>Alto (m)</Label>
                <Input type="number" value={customEl.height} onChange={(e) => setCustomEl({ ...customEl, height: parseFloat(e.target.value) || 1 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleAddCustom}><PlusCircle className="w-4 h-4 mr-2" />Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SalonCroquisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-primary/40" /></div>}>
      <CroquisContent />
    </Suspense>
  );
}
