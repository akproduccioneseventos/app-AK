
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Palette, Save, Loader2, Image as ImageIconLucide, Trash2, PlusCircle, Wand2, StickyNote, FileText, RefreshCw, Heart, Paintbrush, CheckSquare, DollarSign, MapPin, Star, Package, RefreshCcw, Layers, LayoutDashboard, ChevronsUp, ChevronsDown, Grid, ChevronRight, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFiestaById, updateDecoracionFiestaActual } from '@/app/actions/fiesta-actual';
import type { DecoracionData, ColorPalette, DecoItem, DecoChecklistItem, ZonaDiseno, ElementoDecorativo } from '@/types/fiesta';
import { defaultDecoracion, defaultZonasContratadas } from '@/lib/fiesta-defaults';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { UploadButton } from '@/components/invitacion/edit/UploadButton';
import { addMoodboardItem, deleteMoodboardItem, syncDecoGastosToModule } from '@/app/actions/fiesta/decoracion.actions';
import VistaDecorativaEditor from '@/components/decoracion/VistaDecorativaEditor';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import DecoCanvas from '@/components/decoracion/DecoCanvas';
import DecoElementLibrary from '@/components/decoracion/DecoElementLibrary';
import DecoMuestrario from '@/components/decoracion/DecoMuestrario';
import DecoZonaPanel from '@/components/decoracion/DecoZonaPanel';
import DecoColorPicker from '@/components/decoracion/DecoColorPicker';
import type { LibraryElement } from '@/components/decoracion/DecoElementLibrary';


const ALL_DECORATION_ITEM_CATEGORIES = [
  'Detalle Entrada', 'Centro de Mesa', 'Detalle Zona Regalos', 'Detalle Cuadro Firmas', 'Mobiliario', 'Flores y Plantas', 'Iluminación', 'Textiles', 'Vajilla y Cristalería', 'Señalética', 'Globos', 'Otro'
];

// --- CREATOR PARTY CONSTANTS ---

const ESTILOS_DECORACION = [
  { id: 'elegante', label: 'Elegante Clásico', emoji: '✨', colors: { primary: '#c9a96e', secondary: '#f5f0e8', accent: '#2c2c2c' }, description: 'Sofisticado y atemporal con dorados y blancos' },
  { id: 'rustico', label: 'Rústico / Boho', emoji: '🌿', colors: { primary: '#8b6a3e', secondary: '#d4c5a9', accent: '#5c7a4e' }, description: 'Natural, madera, flores silvestres y tonos tierra' },
  { id: 'moderno', label: 'Moderno Minimalista', emoji: '🖤', colors: { primary: '#1a1a2e', secondary: '#e8e8e8', accent: '#4a90d9' }, description: 'Líneas limpias, colores neutros, espacios despejados' },
  { id: 'infantil', label: 'Infantil Colorido', emoji: '🎠', colors: { primary: '#ff6b9d', secondary: '#ffd93d', accent: '#6bcb77' }, description: 'Alegre, colorido, con personajes y juegos' },
  { id: 'tropical', label: 'Tropical', emoji: '🌺', colors: { primary: '#ff6b35', secondary: '#ffd700', accent: '#2ecc71' }, description: 'Vibrante, palmas, flores tropicales y colores vivos' },
  { id: 'romantico', label: 'Romántico', emoji: '🌹', colors: { primary: '#e91e8c', secondary: '#fce4ec', accent: '#9c27b0' }, description: 'Rosas, velas, tonos rosados y detalles delicados' },
  { id: 'industrial', label: 'Industrial', emoji: '🏭', colors: { primary: '#607d8b', secondary: '#455a64', accent: '#ff9800' }, description: 'Acero, ladrillo expuesto, madera oscura y luces colgantes' },
];

const CATALOGO_ITEMS: { categoria: string; emoji: string; items: string[] }[] = [
  { categoria: 'Centros de Mesa', emoji: '🌸', items: ['Flores naturales', 'Flores artificiales', 'Velas flotantes', 'Jarrones con ramas', 'Terrarios', 'Fanales con flores', 'Candelabros', 'Arreglo tropical'] },
  { categoria: 'Globos', emoji: '🎈', items: ['Arco de globos', 'Columna de globos', 'Bouquet de globos', 'Globos con confetti', 'Globos metálicos', 'Globos personalizados', 'Guirnalda de globos'] },
  { categoria: 'Guirnaldas', emoji: '✨', items: ['Fairy lights', 'Banderines de tela', 'Banderines de papel', 'Flores colgantes', 'Guirnalda de hojas', 'Luces LED', 'Tul colgante'] },
  { categoria: 'Fundas y Lazos', emoji: '🪑', items: ['Fundas de silla blancas', 'Fundas de silla de color', 'Lazos de organza', 'Lazos de raso', 'Fajas para silla', 'Telas para mesas'] },
  { categoria: 'Iluminación', emoji: '🕯️', items: ['Velas LED de mesa', 'Spots de color', 'Gobos personalizados', 'Luces de uplighting', 'Iluminación de piso', 'Disco ball', 'Lámpara araña'] },
  { categoria: 'Flores y Plantas', emoji: '🌿', items: ['Arreglo de entrada', 'Centro altar', 'Corona floral', 'Guirnalda de flores', 'Planta decorativa', 'Ramo para mesa principal', 'Pétalos en piso'] },
  { categoria: 'Mantelería', emoji: '🎀', items: ['Manteles blancos', 'Manteles de color', 'Caminos de mesa', 'Servilletas de tela', 'Cubrecaminos', 'Telas de organza', 'Hule de mesa'] },
  { categoria: 'Candy Bar', emoji: '🍬', items: ['Mesa de dulces', 'Torta principal', 'Cupcakes', 'Mesa de macarons', 'Souvenirs', 'Piruletas personalizadas', 'Alfajores', 'Chocolates'] },
  { categoria: 'Photobooth', emoji: '📸', items: ['Backdrop impreso', 'Marco de fotos', 'Props temáticos', 'Letras LED', 'Arco floral photobooth', 'Pizarra de nombres', 'Polaroid props'] },
  { categoria: 'Entrada / Recepción', emoji: '🚪', items: ['Cartel de bienvenida', 'Mesa de regalos', 'Libro de firmas', 'Seating chart', 'Señalética de mesas', 'Paragüero de sobres', 'Ambientación de acceso'] },
];

const ZONAS_DEFAULT_IDS = [
  { id: 'zona_entrada', nombre: 'Entrada' },
  { id: 'zona_mesas', nombre: 'Mesas' },
  { id: 'zona_principal', nombre: 'Mesa Principal' },
  { id: 'zona_pista', nombre: 'Pista de Baile' },
  { id: 'zona_candy', nombre: 'Candy Bar' },
  { id: 'zona_photobooth', nombre: 'Photobooth' },
];

const DEFAULT_ZONA_DISENO: ZonaDiseno = {
  id: 'zona_principal',
  nombre: 'Zona Principal',
  vistaDecorativa: { elementos: [] },
};

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Returns the internal cost of a DecoItem, preferring costoUnitario over the legacy precioUnitario */
function getItemCosto(item: DecoItem): number {
  return item.costoUnitario ?? item.precioUnitario ?? 0;
}

/** Returns the display name for a zone ID, looking up in both design zones and default IDs */
function getZonaDisplayName(zonaId: string | undefined, zonasDiseno: ZonaDiseno[]): string {
  if (!zonaId) return '—';
  return (
    zonasDiseno.find(z => z.id === zonaId)?.nombre ||
    ZONAS_DEFAULT_IDS.find(z => z.id === zonaId)?.nombre ||
    zonaId
  );
}

const predefinedPalettes: { name: string; colors: ColorPalette }[] = [
  { name: 'Sueño Lavanda', colors: { primary: '#D9B8FF', secondary: '#E6BFB2', accent: '#DCDCDC' } },
  { name: 'Atardecer Cálido', colors: { primary: '#FCD3DE', secondary: '#F0E6CC', accent: '#F1C40F' } },
  { name: 'Oasis Sereno', colors: { primary: '#A2D2B0', secondary: '#DCDCDC', accent: '#F0E6CC' } },
];



function DecoracionYDisenoEventoContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const fiestaId = searchParams.get('fiestaId');

  const [decoracionData, setDecoracionData] = useState<DecoracionData>(defaultDecoracion);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zone management
  const [zonasDiseno, setZonasDiseno] = useState<ZonaDiseno[]>([DEFAULT_ZONA_DISENO]);
  const [selectedZonaId, setSelectedZonaId] = useState<string>('zona_principal');
  const [isNuevaZonaOpen, setIsNuevaZonaOpen] = useState(false);
  const [nuevaZonaNombre, setNuevaZonaNombre] = useState('');
  const [showCatalog, setShowCatalog] = useState(true);

  // Deco item modal
  const [isDecoItemModalOpen, setIsDecoItemModalOpen] = useState(false);
  const [newDecoItemName, setNewDecoItemName] = useState('');
  const [newDecoItemCat, setNewDecoItemCat] = useState('');
  const [newDecoItemQty, setNewDecoItemQty] = useState(1);
  const [newDecoItemCosto, setNewDecoItemCosto] = useState<number | undefined>(undefined);
  const [newDecoItemZona, setNewDecoItemZona] = useState('');
  const [newDecoItemImageUrl, setNewDecoItemImageUrl] = useState<string | undefined>(undefined);

  // ── New canvas state ──────────────────────────────────────────────────────
  const [canvasElementos, setCanvasElementos] = useState<ElementoDecorativo[]>([]);
  const [selectedCanvasId, setSelectedCanvasId] = useState<string | null>(null);
  const [canvasHiddenZones, setCanvasHiddenZones] = useState<string[]>([]);
  const [showGrid, setShowGrid] = useState(false);
  const [canvasFondoColor, setCanvasFondoColor] = useState('#F8F9FA');
  const [canvasFondoImagenUrl, setCanvasFondoImagenUrl] = useState('');
  const [canvasHasChanges, setCanvasHasChanges] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [plantillaNombre, setPlantillaNombre] = useState('');
  const [isPlantillaModalOpen, setIsPlantillaModalOpen] = useState(false);
  const [isLoadPlantillaModalOpen, setIsLoadPlantillaModalOpen] = useState(false);
  const [isMuestrarioOpen, setIsMuestrarioOpen] = useState(false);
  const [pickerOpenIdx, setPickerOpenIdx] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const loadDecoracionData = useCallback(async (showLoading = true) => {
    if (!fiestaId) {
      setError("No se especificó ID de fiesta");
      setIsLoading(false);
      return;
    }
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const fiestaData = await getFiestaById(fiestaId);
      if (!fiestaData) throw new Error("Fiesta no encontrada");

      const loadedDecoracion = fiestaData.decoracion || defaultDecoracion;

      const mergedZonas = (defaultZonasContratadas || []).map(defaultZona => {
        const savedZona = loadedDecoracion.zonasContratadas?.find(sz => sz.id === defaultZona.id);
        return savedZona ? { ...defaultZona, ...savedZona } : { ...defaultZona };
      });

      setDecoracionData({
        ...defaultDecoracion,
        ...loadedDecoracion,
        items: loadedDecoracion.items || [],
        moodboardItems: loadedDecoracion.moodboardItems || [],
        zonasContratadas: mergedZonas,
        salonElements: loadedDecoracion.salonElements || [],
        paletaColores: {
          ...defaultDecoracion.paletaColores,
          ...(loadedDecoracion.paletaColores || {})
        } as ColorPalette,
      });

      // Load design zones
      if (loadedDecoracion.zonasDiseno && loadedDecoracion.zonasDiseno.length > 0) {
        setZonasDiseno(loadedDecoracion.zonasDiseno);
        setSelectedZonaId(loadedDecoracion.zonasDiseno[0].id);
      } else {
        const defaultZonas: ZonaDiseno[] = [{
          id: 'zona_principal',
          nombre: 'Zona Principal',
          vistaDecorativa: loadedDecoracion.vistaDecorativa ?? { elementos: [] },
        }];
        setZonasDiseno(defaultZonas);
        setSelectedZonaId('zona_principal');
      }

      // Load global canvas elements
      const globalElementos = loadedDecoracion.vistaDecorativa?.elementos ?? [];
      setCanvasElementos(globalElementos);
      setCanvasFondoColor(loadedDecoracion.vistaDecorativa?.fondoColor ?? '#F8F9FA');
      setCanvasFondoImagenUrl(loadedDecoracion.vistaDecorativa?.fondoImagenUrl ?? '');

    } catch (err: any) {
      console.error("Error loading decoration data:", err);
      setError("No se pudo cargar la configuración de decoración.");
      toast({ title: "Error al Cargar", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, fiestaId]);

  useEffect(() => {
    loadDecoracionData();
  }, [loadDecoracionData]);

  const handleInputChange = <K extends keyof DecoracionData>(field: K, value: DecoracionData[K]) => {
    setDecoracionData(prev => ({ ...prev, [field]: value } as DecoracionData));
  };

  const handleColorChange = (colorType: keyof ColorPalette, value: string) => {
    setDecoracionData(prev => ({
      ...prev,
      paletaColores: {
        ...(prev.paletaColores || defaultDecoracion.paletaColores),
        [colorType]: value,
      } as ColorPalette,
    } as DecoracionData));
  };
  
  const handleSelectPalette = (palette: ColorPalette) => {
    setDecoracionData(prev => ({ ...prev, paletaColores: palette }));
    toast({ title: 'Paleta Aplicada' });
  };

  const handleSelectEstilo = (estiloId: string) => {
    const estilo = ESTILOS_DECORACION.find(e => e.id === estiloId);
    if (!estilo) return;
    setDecoracionData(prev => ({
      ...prev,
      estiloDecoracion: estiloId as DecoracionData['estiloDecoracion'],
      paletaColores: estilo.colors,
      colorPalette: estilo.colors,
      tema: prev.tema || estilo.label,
    }));
    toast({ title: `Estilo aplicado: ${estilo.label}` });
  };

  const handleUpdateDecoItemEstado = (itemId: string, estado: DecoItem['estado']) => {
    setDecoracionData(prev => ({
      ...prev,
      itemsDecoracion: (prev.itemsDecoracion || []).map(it => it.id === itemId ? { ...it, estado } : it),
    }));
  };

  const handleDeleteDecoItem = (itemId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      itemsDecoracion: (prev.itemsDecoracion || []).filter(it => it.id !== itemId),
    }));
  };

  const handleToggleChecklist = (itemId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      checklistDecoracion: (prev.checklistDecoracion || []).map(ci =>
        ci.id === itemId ? { ...ci, completado: !ci.completado } : ci
      ),
    }));
  };

  const handleAddChecklistItem = (item: string, zona: string) => {
    const newCi: DecoChecklistItem = { id: `ci_${Date.now()}`, item, zona, completado: false };
    setDecoracionData(prev => ({
      ...prev,
      checklistDecoracion: [...(prev.checklistDecoracion || []), newCi],
    }));
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    setDecoracionData(prev => ({
      ...prev,
      checklistDecoracion: (prev.checklistDecoracion || []).filter(ci => ci.id !== itemId),
    }));
  };

  const handleAddMoodboardPhoto = async (url: string) => {
    if (!fiestaId) return;
    const res = await addMoodboardItem(fiestaId, url);
    if (res.success) { toast({ title: "Foto de inspiración añadida" }); loadDecoracionData(false); }
    else toast({ title: "Error", description: res.error, variant: "destructive" });
  };

  const handleDeleteMoodboardPhoto = async (itemId: string) => {
    if (!fiestaId) return;
    const res = await deleteMoodboardItem(fiestaId, itemId);
    if (res.success) { toast({ title: "Foto eliminada" }); loadDecoracionData(false); }
  };

  const saveDecoracion = useCallback(async (data: DecoracionData) => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await updateDecoracionFiestaActual(fiestaId, data);
      if (result.success && result.updatedData) {
        toast({ title: "¡Guardado!" });
        loadDecoracionData(false);
      } else {
        throw new Error(result.error || "Error desconocido al guardar.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [fiestaId, toast, loadDecoracionData]);

  const handleSaveClick = useCallback(async () => {
    await saveDecoracion({ ...decoracionData, zonasDiseno });
  }, [decoracionData, zonasDiseno, saveDecoracion]);

  const handleSaveZona = useCallback(async (data: ZonaDiseno['vistaDecorativa']) => {
    const updatedZonas = zonasDiseno.map(z =>
      z.id === selectedZonaId ? { ...z, vistaDecorativa: data } : z
    );
    setZonasDiseno(updatedZonas);
    await saveDecoracion({ ...decoracionData, zonasDiseno: updatedZonas, vistaDecorativa: data });
  }, [decoracionData, zonasDiseno, selectedZonaId, saveDecoracion]);

  const handleCreateZona = () => {
    if (!nuevaZonaNombre.trim()) return;
    const newZona: ZonaDiseno = {
      id: `zona_${Date.now()}`,
      nombre: nuevaZonaNombre.trim(),
      vistaDecorativa: { elementos: [] },
    };
    const updatedZonas = [...zonasDiseno, newZona];
    setZonasDiseno(updatedZonas);
    setSelectedZonaId(newZona.id);
    setNuevaZonaNombre('');
    setIsNuevaZonaOpen(false);
    toast({ title: `Zona "${newZona.nombre}" creada` });
  };

  const handleDeleteZona = (zonaId: string) => {
    if (zonasDiseno.length <= 1) {
      toast({ title: "No se puede eliminar", description: "Debe haber al menos una zona.", variant: "destructive" });
      return;
    }
    const updatedZonas = zonasDiseno.filter(z => z.id !== zonaId);
    setZonasDiseno(updatedZonas);
    if (selectedZonaId === zonaId) setSelectedZonaId(updatedZonas[0].id);
  };

  const openDecoItemModal = (categoria: string, nombre: string, zona?: string) => {
    setNewDecoItemName(nombre);
    setNewDecoItemCat(categoria);
    setNewDecoItemQty(1);
    setNewDecoItemCosto(undefined);
    setNewDecoItemImageUrl(undefined);
    setNewDecoItemZona(zona || selectedZonaId);
    setIsDecoItemModalOpen(true);
  };

  const handleSaveDecoItemFromModal = () => {
    if (!newDecoItemName.trim()) return;
    const newItem: DecoItem = {
      id: `di_${Date.now()}`,
      nombre: newDecoItemName,
      categoria: newDecoItemCat,
      cantidad: newDecoItemQty,
      costoUnitario: newDecoItemCosto,
      zona: newDecoItemZona,
      estado: 'pendiente',
      imageUrl: newDecoItemImageUrl,
    };
    setDecoracionData(prev => ({
      ...prev,
      itemsDecoracion: [...(prev.itemsDecoracion || []), newItem],
    }));
    setIsDecoItemModalOpen(false);
    toast({ title: `"${newDecoItemName}" agregado` });
  };

  const handleSyncGastos = async () => {
    if (!fiestaId) return;
    setIsSaving(true);
    try {
      const result = await syncDecoGastosToModule(fiestaId, decoracionData.itemsDecoracion || []);
      if (result.success) {
        toast({ title: "Gastos sincronizados ✓", description: "Los gastos de decoración se actualizaron en el módulo de costos del evento." });
      } else throw new Error(result.error);
    } catch (err: any) {
      toast({ title: "Error al sincronizar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const calcGastosTotal = () =>
    (decoracionData.itemsDecoracion || []).reduce((sum, it) => {
      return sum + (getItemCosto(it) * it.cantidad);
    }, 0);

  const currentZona = zonasDiseno.find(z => z.id === selectedZonaId) ?? zonasDiseno[0];
  const allZonasForSelect = [
    ...zonasDiseno,
    ...ZONAS_DEFAULT_IDS.filter(z => !zonasDiseno.find(zd => zd.id === z.id)),
  ];

  const selectedCanvasEl = canvasElementos.find(el => el.id === selectedCanvasId) ?? null;
  const paletaColoresArray = decoracionData.paletaColores
    ? [decoracionData.paletaColores.primary, decoracionData.paletaColores.secondary, decoracionData.paletaColores.accent]
    : [];

  const handleCanvasElementsChange = useCallback((els: ElementoDecorativo[]) => {
    setCanvasElementos(els);
    setCanvasHasChanges(true);
  }, []);

  const handleAddLibraryElement = useCallback((libEl: LibraryElement) => {
    const newEl: ElementoDecorativo = {
      id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tipo: libEl.tipo,
      x: 450,
      y: 275,
      escala: 1,
      colores: paletaColoresArray.slice(0, libEl.maxColores || 1),
      rotacion: 0,
      zIndex: canvasElementos.length + 1,
      ...(libEl.imageDataUri ? { imageDataUri: libEl.imageDataUri, isCustom: true } : {}),
    };
    handleCanvasElementsChange([...canvasElementos, newEl]);
    setSelectedCanvasId(newEl.id);
  }, [canvasElementos, paletaColoresArray, handleCanvasElementsChange]);

  const handleUploadCustomElement = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      const nombre = file.name.replace(/\.[^/.]+$/, '');
      const newCustomEl = { id: `custom_${Date.now()}`, nombre, imageDataUri: dataUri };
      const updatedCustomElements = [...(decoracionData.customElements ?? []), newCustomEl];
      setDecoracionData(prev => ({ ...prev, customElements: updatedCustomElements }));
      const newEl: ElementoDecorativo = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tipo: newCustomEl.id,
        x: 450, y: 275, escala: 1, colores: [], rotacion: 0,
        imageDataUri: dataUri, isCustom: true,
        zIndex: canvasElementos.length + 1,
      };
      handleCanvasElementsChange([...canvasElementos, newEl]);
      setSelectedCanvasId(newEl.id);
    };
    reader.readAsDataURL(file);
  }, [decoracionData, canvasElementos, handleCanvasElementsChange]);

  const handleUpdateSelectedElColor = useCallback((colorIndex: number, color: string) => {
    if (!selectedCanvasId) return;
    setCanvasElementos(prev => prev.map(el => {
      if (el.id !== selectedCanvasId) return el;
      const newColores = [...el.colores];
      newColores[colorIndex] = color;
      return { ...el, colores: newColores };
    }));
    setCanvasHasChanges(true);
  }, [selectedCanvasId]);

  const handleUpdateSelectedElZona = useCallback((zona: string) => {
    if (!selectedCanvasId) return;
    setCanvasElementos(prev => prev.map(el => el.id === selectedCanvasId ? { ...el, zona } : el));
    setCanvasHasChanges(true);
  }, [selectedCanvasId]);

  const handleUpdateSelectedElProp = useCallback(<K extends keyof ElementoDecorativo>(key: K, value: ElementoDecorativo[K]) => {
    if (!selectedCanvasId) return;
    setCanvasElementos(prev => prev.map(el => el.id === selectedCanvasId ? { ...el, [key]: value } : el));
    setCanvasHasChanges(true);
  }, [selectedCanvasId]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedCanvasId) return;
    setCanvasElementos(prev => prev.filter(el => el.id !== selectedCanvasId));
    setSelectedCanvasId(null);
    setCanvasHasChanges(true);
  }, [selectedCanvasId]);

  const handleZoneToggle = useCallback((zonaId: string) => {
    setCanvasHiddenZones(prev => prev.includes(zonaId) ? prev.filter(z => z !== zonaId) : [...prev, zonaId]);
  }, []);

  const handleBringToFront = useCallback(() => {
    if (!selectedCanvasId) return;
    const maxZ = Math.max(...canvasElementos.map(el => el.zIndex ?? 1), 0);
    setCanvasElementos(prev => prev.map(el => el.id === selectedCanvasId ? { ...el, zIndex: maxZ + 1 } : el));
    setCanvasHasChanges(true);
  }, [selectedCanvasId, canvasElementos]);

  const handleSendToBack = useCallback(() => {
    if (!selectedCanvasId) return;
    const minZ = Math.min(...canvasElementos.map(el => el.zIndex ?? 1), 2);
    setCanvasElementos(prev => prev.map(el => el.id === selectedCanvasId ? { ...el, zIndex: Math.max(0, minZ - 1) } : el));
    setCanvasHasChanges(true);
  }, [selectedCanvasId, canvasElementos]);

  const handleExportPng = useCallback(() => {
    toast({ title: 'Exportar PNG', description: 'Usá la captura de pantalla de tu dispositivo para guardar el diseño.' });
  }, [toast]);

  const saveCanvas = useCallback(async (silent = false) => {
    if (!fiestaId) return;
    if (!silent) setIsSavingCanvas(true);
    else setIsAutoSaving(true);
    try {
      const updatedDecoracion = {
        ...decoracionData,
        zonasDiseno,
        vistaDecorativa: {
          elementos: canvasElementos,
          fondoColor: canvasFondoColor,
          fondoImagenUrl: canvasFondoImagenUrl,
        },
      };
      const result = await updateDecoracionFiestaActual(fiestaId, updatedDecoracion);
      if (result.success) {
        setCanvasHasChanges(false);
        if (!silent) toast({ title: '¡Canvas guardado! ✓' });
      } else throw new Error(result.error);
    } catch (err: any) {
      if (!silent) toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    } finally {
      if (!silent) setIsSavingCanvas(false);
      else setIsAutoSaving(false);
    }
  }, [fiestaId, decoracionData, zonasDiseno, canvasElementos, canvasFondoColor, canvasFondoImagenUrl, toast]);

  const handleGuardarPlantilla = useCallback(async () => {
    if (!plantillaNombre.trim()) return;
    const nuevaPlantilla = {
      id: `plantilla_${Date.now()}`,
      nombre: plantillaNombre.trim(),
      elementos: canvasElementos,
      creadaEn: new Date().toISOString(),
    };
    const updatedDecoracion = {
      ...decoracionData,
      zonasDiseno,
      plantillasGuardadas: [...(decoracionData.plantillasGuardadas ?? []), nuevaPlantilla],
    };
    if (fiestaId) {
      await updateDecoracionFiestaActual(fiestaId, updatedDecoracion);
      setDecoracionData(updatedDecoracion);
      toast({ title: `Plantilla "${plantillaNombre}" guardada ✓` });
    }
    setPlantillaNombre('');
    setIsPlantillaModalOpen(false);
  }, [plantillaNombre, canvasElementos, decoracionData, zonasDiseno, fiestaId, toast]);

  const handleLoadPlantilla = useCallback((elementos: ElementoDecorativo[]) => {
    setCanvasElementos(elementos);
    setCanvasHasChanges(true);
    setIsLoadPlantillaModalOpen(false);
    toast({ title: 'Plantilla cargada ✓' });
  }, [toast]);

  const handleLoadMuestrario = useCallback((elementos: ElementoDecorativo[]) => {
    setCanvasElementos(elementos);
    setCanvasHasChanges(true);
    setIsMuestrarioOpen(false);
    toast({ title: 'Decoración cargada ✓', description: 'Podés cambiar los colores y posiciones.' });
  }, [toast]);

  // Auto-save 2 seconds after the last canvas change
  useEffect(() => {
    if (!canvasHasChanges) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveCanvas(true);
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [canvasHasChanges, saveCanvas]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando decoración...</p></div>;
  }

  return (
    <div data-testid="decoracion-page" className="space-y-6">

      {/* Deco Item Modal */}
      <Dialog open={isDecoItemModalOpen} onOpenChange={setIsDecoItemModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Agregar al Catálogo</DialogTitle>
            <DialogDescription>
              <span className="font-bold text-primary">{newDecoItemName}</span>
              {newDecoItemCat ? ` — ${newDecoItemCat}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Nombre</Label>
              <Input value={newDecoItemName} onChange={e => setNewDecoItemName(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Cantidad</Label>
                <Input type="number" min={1} value={newDecoItemQty} onChange={e => setNewDecoItemQty(Number(e.target.value))} className="rounded-xl h-12 bg-slate-50 border-none" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Costo Interno ($)</Label>
                <Input
                  type="number" min={0} step="0.01"
                  value={newDecoItemCosto ?? ''}
                  onChange={e => setNewDecoItemCosto(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Opcional"
                  className="rounded-xl h-12 bg-slate-50 border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Zona</Label>
              <Select value={newDecoItemZona} onValueChange={setNewDecoItemZona}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none">
                  <SelectValue placeholder="Seleccionar zona..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {allZonasForSelect.map(z => <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black tracking-widest text-slate-400">Imagen de referencia (opcional)</Label>
              <UploadButton
                currentUrl={newDecoItemImageUrl}
                onUrlChange={url => setNewDecoItemImageUrl(url)}
                fiestaId={fiestaId || undefined}
                accept="image/*"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsDecoItemModalOpen(false)} className="flex-1 rounded-xl h-12">Cancelar</Button>
            <Button onClick={handleSaveDecoItemFromModal} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20" disabled={!newDecoItemName.trim()}>
              <PlusCircle className="w-4 h-4 mr-2" /> Agregar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nueva Zona Modal */}
      <Dialog open={isNuevaZonaOpen} onOpenChange={setIsNuevaZonaOpen}>
        <DialogContent className="sm:max-w-sm rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Nueva Zona de Diseño</DialogTitle>
            <DialogDescription>Podés crear zonas como: Recepción, Mesa de Honor, Pista, Candy Bar, etc.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={nuevaZonaNombre}
              onChange={e => setNuevaZonaNombre(e.target.value)}
              placeholder="Ej: Recepción, Mesa Principal, Pista..."
              className="rounded-xl h-12 bg-slate-50 border-none"
              onKeyDown={e => { if (e.key === 'Enter') handleCreateZona(); }}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsNuevaZonaOpen(false)} className="flex-1 rounded-xl h-12">Cancelar</Button>
            <Button onClick={handleCreateZona} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20" disabled={!nuevaZonaNombre.trim()}>
              <PlusCircle className="w-4 h-4 mr-2" /> Crear Zona
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Palette className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">Decoración y Diseño</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => loadDecoracionData(true)}>
            <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
          </Button>
          <Link href={`/fiestas/nueva/decoracion/pdf?fiestaId=${fiestaId}`}>
            <Button variant="outline" disabled={isSaving}><FileText className="w-4 h-4 mr-2" />Ver PDF</Button>
          </Link>
          <Link href={`/fiestas/nueva?fiestaId=${fiestaId}`}>
            <Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vista">
        <TabsList className="mb-4 flex flex-wrap h-auto gap-1 bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="vista" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <Paintbrush className="w-4 h-4" /> Vista de Diseño
          </TabsTrigger>
          <TabsTrigger value="estilo" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <Star className="w-4 h-4" /> Estilo
          </TabsTrigger>
          <TabsTrigger value="gastos" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <DollarSign className="w-4 h-4" /> Gastos Internos
          </TabsTrigger>
          <TabsTrigger value="checklist" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <CheckSquare className="w-4 h-4" /> Checklist
          </TabsTrigger>
          <TabsTrigger value="inspiracion" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <ImageIconLucide className="w-4 h-4" /> Inspiración
          </TabsTrigger>
          <TabsTrigger value="canvas" className="gap-2 rounded-xl data-[state=active]:shadow-sm">
            <LayoutDashboard className="w-4 h-4" /> Canvas
          </TabsTrigger>
        </TabsList>

        {/* TAB: VISTA DE DISEÑO */}
        <TabsContent value="vista" className="space-y-4">
          {/* Zone management bar */}
          <Card className="border-none shadow-sm rounded-2xl bg-white/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-400 mr-2">
                  <Layers className="w-4 h-4" /> Zonas:
                </div>
                {zonasDiseno.map(zona => (
                  <div key={zona.id} className="flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant={selectedZonaId === zona.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedZonaId(zona.id)}
                      className={cn("rounded-xl gap-1.5 transition-all", selectedZonaId === zona.id ? "shadow-lg shadow-primary/20" : "")}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      {zona.nombre}
                      {(decoracionData.itemsDecoracion || []).filter(i => i.zona === zona.id).length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 rounded-full">
                          {(decoracionData.itemsDecoracion || []).filter(i => i.zona === zona.id).length}
                        </Badge>
                      )}
                    </Button>
                    {zonasDiseno.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-300 hover:text-destructive ml-0.5" onClick={() => handleDeleteZona(zona.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNuevaZonaOpen(true)} className="rounded-xl gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5">
                  <PlusCircle className="w-3.5 h-3.5" /> Nueva Zona
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Canvas + Catalog */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0 space-y-4">
              <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white"><Paintbrush className="w-5 h-5" /></div>
                      <div>
                        <CardTitle className="font-headline text-lg">Lienzo — {currentZona?.nombre}</CardTitle>
                        <CardDescription className="text-xs">Usá las herramientas para agregar elementos. Subí una foto del salón como fondo.</CardDescription>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowCatalog(v => !v)} className="rounded-xl gap-1.5">
                      <Package className="w-4 h-4" />
                      {showCatalog ? 'Ocultar catálogo' : 'Mostrar catálogo'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {currentZona && (
                    <VistaDecorativaEditor
                      key={selectedZonaId}
                      vistaDecorativa={currentZona.vistaDecorativa}
                      paletaColores={decoracionData.paletaColores ?? { primary: '#D9B8FF', secondary: '#E6BFB2', accent: '#DCDCDC' }}
                      fiestaId={fiestaId ?? ''}
                      onSave={handleSaveZona}
                      isSaving={isSaving}
                    />
                  )}
                </CardContent>
              </Card>

              {(decoracionData.itemsDecoracion || []).filter(i => i.zona === currentZona?.id).length > 0 && (
                <Card className="border-none shadow-sm rounded-2xl bg-white/80">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-primary" />
                      Elementos del catálogo en {currentZona?.nombre}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {(decoracionData.itemsDecoracion || []).filter(i => i.zona === currentZona?.id).map(item => (
                        <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          {item.imageUrl && <NextImage src={item.imageUrl} alt={item.nombre} width={20} height={20} className="rounded-sm object-cover shrink-0" />}
                          <span className="font-semibold text-slate-700">{item.nombre}</span>
                          <span className="text-slate-400">x{item.cantidad}</span>
                          {getItemCosto(item) > 0 ? <span className="text-emerald-600 font-medium">${(getItemCosto(item) * item.cantidad).toLocaleString()}</span> : null}
                          <button type="button" onClick={() => handleDeleteDecoItem(item.id)} className="text-slate-300 hover:text-destructive transition-colors ml-1"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Catalog sidebar */}
            {showCatalog && (
              <div className="w-72 flex-shrink-0">
                <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md sticky top-4">
                  <CardHeader className="bg-gradient-to-r from-violet-500/10 to-violet-500/5 p-5 rounded-t-[2rem]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-violet-500 rounded-2xl shadow-xl shadow-violet-500/20 text-white"><Package className="w-5 h-5" /></div>
                      <div>
                        <CardTitle className="font-headline text-base">Catálogo</CardTitle>
                        <CardDescription className="text-xs">Agregá elementos a la zona actual</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <ScrollArea className="h-[600px]">
                    <CardContent className="p-4 space-y-4">
                      <div className="p-3 rounded-2xl border border-dashed border-violet-300 bg-violet-50/50">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Elemento personalizado</p>
                        <Button type="button" variant="outline" size="sm" className="w-full rounded-xl gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50 text-xs" onClick={() => openDecoItemModal('Personalizado', '', currentZona?.id)}>
                          <PlusCircle className="w-3.5 h-3.5" /> Agregar elemento propio
                        </Button>
                      </div>
                      <Separator />
                      {CATALOGO_ITEMS.map(cat => {
                        const countInZone = (decoracionData.itemsDecoracion || []).filter(di => di.categoria === cat.categoria && di.zona === currentZona?.id).length;
                        return (
                          <div key={cat.categoria} className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{cat.emoji}</span>
                              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-600 flex-1">{cat.categoria}</h4>
                              {countInZone > 0 && <Badge variant="default" className="text-[9px] h-4 px-1.5 rounded-full shrink-0">{countInZone}</Badge>}
                            </div>
                            <div className="space-y-1">
                              {cat.items.map(itemNombre => {
                                const ya = (decoracionData.itemsDecoracion || []).some(di => di.nombre === itemNombre && di.zona === currentZona?.id);
                                return (
                                  <button
                                    key={itemNombre}
                                    type="button"
                                    onClick={() => !ya && openDecoItemModal(cat.categoria, itemNombre, currentZona?.id)}
                                    className={cn(
                                      "w-full p-2 rounded-xl text-left text-xs font-medium transition-all duration-150 flex items-center gap-2",
                                      ya ? "bg-violet-50 text-violet-700 cursor-default border border-violet-200" : "bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700 cursor-pointer border border-transparent hover:border-violet-200"
                                    )}
                                  >
                                    {ya ? <CheckSquare className="w-3.5 h-3.5 shrink-0 text-violet-500" /> : <PlusCircle className="w-3.5 h-3.5 shrink-0 text-slate-300" />}
                                    <span className="truncate">{itemNombre}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </ScrollArea>
                  <CardFooter className="border-t p-4">
                    <Button onClick={handleSaveClick} size="sm" className="w-full rounded-xl shadow-lg shadow-primary/20" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Guardar zona
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB: ESTILO */}
        <TabsContent value="estilo" className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-2xl shadow-xl shadow-primary/20 text-white"><Star className="w-6 h-6" /></div>
                <div>
                  <CardTitle className="font-headline text-xl">Estilo del Evento</CardTitle>
                  <CardDescription>Elegí el estilo y se aplicará la paleta de colores automáticamente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ESTILOS_DECORACION.map(estilo => (
                  <button
                    key={estilo.id}
                    type="button"
                    data-testid={`estilo-card-${estilo.id}`}
                    data-selected={decoracionData.estiloDecoracion === estilo.id ? 'true' : 'false'}
                    onClick={() => handleSelectEstilo(estilo.id)}
                    className={cn(
                      "relative p-4 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                      decoracionData.estiloDecoracion === estilo.id ? "border-primary shadow-xl shadow-primary/20 bg-primary/5" : "border-slate-200 bg-white hover:border-primary/50"
                    )}
                  >
                    {decoracionData.estiloDecoracion === estilo.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <CheckSquare className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-3xl mb-2">{estilo.emoji}</div>
                    <div className="font-bold text-sm text-slate-800">{estilo.label}</div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{estilo.description}</div>
                    <div className="flex gap-1 mt-3">
                      {Object.values(estilo.colors).map((c, i) => (
                        <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <Separator />
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paleta de Colores</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(['primary', 'secondary', 'accent'] as const).map(key => (
                    <div key={key} className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key === 'primary' ? 'Principal' : key === 'secondary' ? 'Secundario' : 'Acento'}</Label>
                      <div className="flex gap-3 items-center">
                        <input type="color" value={decoracionData.paletaColores?.[key] || '#ffffff'} onChange={e => handleColorChange(key, e.target.value)} className="w-14 h-14 rounded-2xl border-none cursor-pointer p-1 shadow-lg" />
                        <Input type="text" value={decoracionData.paletaColores?.[key] || ''} onChange={e => handleColorChange(key, e.target.value)} placeholder="#RRGGBB" className="rounded-xl h-10 bg-slate-50 border-none font-mono text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {predefinedPalettes.map(palette => (
                    <Button key={palette.name} type="button" variant="outline" className="h-auto p-3 text-left flex flex-col items-start gap-2 rounded-2xl hover:border-primary/50" onClick={() => handleSelectPalette(palette.colors)}>
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.colors.primary }} />
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.colors.secondary }} />
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: palette.colors.accent }} />
                      </div>
                      <span className="text-sm font-semibold">{palette.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tema del Evento</Label>
                  <Input value={decoracionData.tema || ''} onChange={e => handleInputChange('tema', e.target.value)} placeholder="Ej: Rústico Chic, Tropical, Años 80" className="rounded-xl h-12 bg-slate-50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Color Cubremantel</Label>
                  <Input value={decoracionData.colorCubremantel || ''} onChange={e => handleInputChange('colorCubremantel', e.target.value)} placeholder="Ej: Blanco, Azul Marino" className="rounded-xl h-12 bg-slate-50 border-none" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Estilo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB: GASTOS INTERNOS */}
        <TabsContent value="gastos">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 text-white"><DollarSign className="w-6 h-6" /></div>
                  <div>
                    <CardTitle className="font-headline text-xl">Gastos Internos de Decoración</CardTitle>
                    <CardDescription>Control de costos operativos. La decoración tiene precio fijo para el cliente — estos gastos son para tu seguimiento interno.</CardDescription>
                  </div>
                </div>
                <Button type="button" onClick={handleSyncGastos} disabled={isSaving || (decoracionData.itemsDecoracion || []).length === 0} className="rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                  Sincronizar con Gastos del Evento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {(decoracionData.itemsDecoracion || []).length === 0 ? (
                <div className="text-center py-16 opacity-40">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="font-bold text-slate-500">Agregá items desde la Vista de Diseño</p>
                  <p className="text-xs text-slate-400 mt-1">Los gastos de decoración aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm text-emerald-800">
                    <strong>ℹ️ Sobre estos costos:</strong> Son gastos internos de tu empresa, no se suman al precio que le cotizás al cliente. Usá el botón de sincronización para que aparezcan en el módulo de Gestión de Costos del evento.
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Item</th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cat.</th>
                          <th className="text-left p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Zona</th>
                          <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Cant.</th>
                          <th className="text-right p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Costo Unit.</th>
                          <th className="text-right p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Total</th>
                          <th className="text-center p-4 font-black text-[10px] uppercase tracking-widest text-slate-400">Estado</th>
                          <th className="p-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(decoracionData.itemsDecoracion || []).map((item, i) => {
                          const costo = getItemCosto(item);
                          const zonaName = getZonaDisplayName(item.zona, zonasDiseno);
                          return (
                            <tr key={item.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50", i % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                              <td className="p-4 font-semibold text-slate-800">{item.nombre}</td>
                              <td className="p-4 text-slate-500 text-xs">{item.categoria}</td>
                              <td className="p-4 text-xs"><Badge variant="outline" className="rounded-full text-[10px]">{zonaName}</Badge></td>
                              <td className="p-4 text-center font-bold text-slate-700">{item.cantidad}</td>
                              <td className="p-4 text-right text-slate-500">{costo > 0 ? `$${costo.toLocaleString()}` : '—'}</td>
                              <td className="p-4 text-right font-bold text-slate-800">{costo > 0 ? `$${(costo * item.cantidad).toLocaleString()}` : '—'}</td>
                              <td className="p-4 text-center">
                                <Badge
                                  className={cn("text-[10px] rounded-full cursor-pointer select-none",
                                    item.estado === 'instalado' ? 'bg-green-100 text-green-700 border-green-200' :
                                    item.estado === 'comprado' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    'bg-amber-100 text-amber-700 border-amber-200')}
                                  onClick={() => {
                                    const next = item.estado === 'pendiente' ? 'comprado' : item.estado === 'comprado' ? 'instalado' : 'pendiente';
                                    handleUpdateDecoItemEstado(item.id, next);
                                  }}
                                >
                                  {item.estado === 'instalado' ? '✓ Instalado' : item.estado === 'comprado' ? '🛒 Comprado' : '⏳ Pendiente'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteDecoItem(item.id)} className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                          <td colSpan={5} className="p-4 font-black text-right text-emerald-700 uppercase tracking-widest text-sm">TOTAL GASTOS ESTIMADOS</td>
                          <td className="p-4 text-right font-black text-xl text-emerald-700">${calcGastosTotal().toLocaleString()}</td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-xs text-slate-400 italic text-center">* Costos internos. No se reflejan en el precio cobrado al cliente.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t p-6 flex gap-3 flex-wrap">
              <Button onClick={handleSaveClick} size="lg" className="rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar
              </Button>
              <Button type="button" onClick={handleSyncGastos} size="lg" variant="outline" className="rounded-2xl gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50" disabled={isSaving || (decoracionData.itemsDecoracion || []).length === 0}>
                <RefreshCcw className="w-5 h-5" /> Sincronizar con Módulo de Gastos
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB: CHECKLIST */}
        <TabsContent value="checklist">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-sky-500/10 to-sky-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-sky-500 rounded-2xl shadow-xl shadow-sky-500/20 text-white"><CheckSquare className="w-6 h-6" /></div>
                <div>
                  <CardTitle className="font-headline text-xl">Checklist de Instalación</CardTitle>
                  <CardDescription>Para el día del evento: marcá cada item mientras lo instalás</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {(decoracionData.itemsDecoracion || []).length > 0 && (decoracionData.checklistDecoracion || []).length === 0 && (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sky-700 text-sm">Generar checklist automático</p>
                    <p className="text-xs text-sky-600">Creá una lista basada en los items del catálogo</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { (decoracionData.itemsDecoracion || []).forEach(item => { handleAddChecklistItem(`${item.nombre} (x${item.cantidad})`, item.zona || zonasDiseno[0]?.id || 'zona_principal'); }); }} className="rounded-xl border-sky-300 text-sky-700 hover:bg-sky-100">
                    <Wand2 className="w-4 h-4 mr-2" /> Auto-generar
                  </Button>
                </div>
              )}
              {allZonasForSelect.map(zona => {
                const zonaItems = (decoracionData.checklistDecoracion || []).filter(ci => ci.zona === zona.id);
                if (zonaItems.length === 0) return null;
                const completados = zonaItems.filter(ci => ci.completado).length;
                return (
                  <div key={zona.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />{zona.nombre}
                      </h4>
                      <Badge variant={completados === zonaItems.length ? "default" : "secondary"} className="rounded-full">{completados}/{zonaItems.length}</Badge>
                    </div>
                    <div className="space-y-2 pl-6">
                      {zonaItems.map(ci => (
                        <div key={ci.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={ci.completado} onCheckedChange={() => handleToggleChecklist(ci.id)} className="rounded-md" />
                            <span className={cn("text-sm font-medium", ci.completado && "line-through text-slate-400")}>{ci.item}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteChecklistItem(ci.id)} className="h-7 w-7 text-slate-400 hover:text-destructive rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </div>
                );
              })}
              {(decoracionData.checklistDecoracion || []).length === 0 && (
                <div className="text-center py-16 opacity-40">
                  <CheckSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="font-bold text-slate-500">El checklist está vacío</p>
                  <p className="text-xs text-slate-400 mt-1">Agrega items desde la Vista de Diseño o usá auto-generar</p>
                </div>
              )}
              <div className="pt-4 border-t border-slate-100">
                <ChecklistAddForm onAdd={handleAddChecklistItem} zonas={allZonasForSelect} />
              </div>
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar Checklist
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB: INSPIRACIÓN */}
        <TabsContent value="inspiracion" className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="bg-gradient-to-r from-rose-500/10 to-rose-500/5 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500 rounded-2xl shadow-xl shadow-rose-500/20 text-white"><ImageIconLucide className="w-6 h-6" /></div>
                <div>
                  <CardTitle className="font-headline text-xl">Tablero de Inspiración</CardTitle>
                  <CardDescription>Subí fotos de referencia. El cliente puede darles "like" desde su portal.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="p-6 border-2 border-dashed rounded-2xl bg-muted/20 flex flex-col items-center justify-center text-center">
                <ImageIconLucide className="w-10 h-10 text-muted-foreground/40 mb-2" />
                <Label className="mb-4">Añadir foto de inspiración</Label>
                <UploadButton onUrlChange={handleAddMoodboardPhoto} fiestaId={fiestaId || undefined} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(decoracionData.moodboardItems || []).map(item => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border group shadow-sm bg-white">
                    <NextImage src={item.url} alt="inspiración" layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteMoodboardPhoto(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {item.likedByClient && (
                        <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg flex items-center justify-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-500 fill-current" />
                          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">¡Favorito!</span>
                        </div>
                      )}
                    </div>
                    {item.likedByClient && <div className="absolute top-2 left-2 bg-rose-500 text-white p-1 rounded-full shadow-lg"><Heart className="w-3 h-3 fill-current" /></div>}
                  </div>
                ))}
              </div>
              {(!decoracionData.moodboardItems || decoracionData.moodboardItems.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-10 italic">Aún no hay fotos en el tablero de inspiración.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md">
            <CardHeader className="p-6">
              <CardTitle className="font-headline text-xl flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" /> Notas Generales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Textarea value={decoracionData.generalNotesDecoracion || ''} onChange={e => handleInputChange('generalNotesDecoracion', e.target.value)} rows={4} placeholder="Ideas, conceptos, elementos clave, notas para el equipo..." className="rounded-xl bg-slate-50 border-none resize-none" />
            </CardContent>
            <CardFooter className="border-t p-6">
              <Button onClick={handleSaveClick} size="lg" className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* TAB: CANVAS INTERACTIVO */}
        <TabsContent value="canvas">
          {/* Guardar Plantilla Modal */}
          <Dialog open={isPlantillaModalOpen} onOpenChange={setIsPlantillaModalOpen}>
            <DialogContent className="sm:max-w-sm rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Guardar como Plantilla</DialogTitle>
                <DialogDescription>Dale un nombre a esta configuración del canvas para reutilizarla.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  value={plantillaNombre}
                  onChange={e => setPlantillaNombre(e.target.value)}
                  placeholder="Ej: Decoración Romántica, Mesa Principal..."
                  className="rounded-xl h-12 bg-slate-50 border-none"
                  onKeyDown={e => { if (e.key === 'Enter') handleGuardarPlantilla(); }}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsPlantillaModalOpen(false)} className="flex-1 rounded-xl h-12">Cancelar</Button>
                <Button onClick={handleGuardarPlantilla} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20" disabled={!plantillaNombre.trim()}>
                  <Save className="w-4 h-4 mr-2" /> Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cargar Plantilla Modal */}
          <Dialog open={isLoadPlantillaModalOpen} onOpenChange={setIsLoadPlantillaModalOpen}>
            <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Cargar Plantilla</DialogTitle>
                <DialogDescription>Seleccioná una plantilla guardada para cargarla en el canvas.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 max-h-80 overflow-y-auto">
                {(decoracionData.plantillasGuardadas ?? []).length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">No hay plantillas guardadas todavía.</p>
                ) : (
                  (decoracionData.plantillasGuardadas ?? []).map(pt => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => handleLoadPlantilla(pt.elementos)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-primary/5 border border-transparent hover:border-primary/20 text-left transition-all"
                    >
                      <div>
                        <p className="font-semibold text-sm text-slate-700">{pt.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{pt.elementos.length} elementos · {new Date(pt.creadaEn).toLocaleDateString('es-AR')}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </button>
                  ))
                )}
              </div>
              <Button variant="outline" onClick={() => setIsLoadPlantillaModalOpen(false)} className="w-full rounded-xl h-11">Cerrar</Button>
            </DialogContent>
          </Dialog>

          {/* Muestrario Modal */}
          <Dialog open={isMuestrarioOpen} onOpenChange={setIsMuestrarioOpen}>
            <DialogContent className="sm:max-w-lg rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-headline text-2xl">Muestrario de Decoraciones</DialogTitle>
                <DialogDescription>Decoraciones de eventos anteriores para usar como base.</DialogDescription>
              </DialogHeader>
              <DecoMuestrario onLoadDecoracion={handleLoadMuestrario} />
            </DialogContent>
          </Dialog>

          <div className="flex gap-4 items-start min-h-[600px]">
            {/* LEFT: Library panel */}
            <div className="w-64 flex-shrink-0">
              <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md sticky top-4 h-[700px] flex flex-col">
                <CardHeader className="bg-gradient-to-r from-violet-500/10 to-violet-500/5 p-4 rounded-t-[2rem] flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-violet-500 rounded-xl shadow-lg text-white"><Package className="w-4 h-4" /></div>
                    <CardTitle className="font-headline text-sm">Biblioteca</CardTitle>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsMuestrarioOpen(true)} className="flex-1 rounded-xl text-xs h-8 gap-1">
                      <LayoutDashboard className="w-3 h-3" /> Muestrario
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-3 overflow-hidden flex flex-col">
                  {fiestaId ? (
                    <DecoElementLibrary
                      fiestaId={fiestaId}
                      onAddElement={handleAddLibraryElement}
                      customElements={decoracionData.customElements}
                      onUploadCustom={handleUploadCustomElement}
                    />
                  ) : (
                    <div className="text-center text-slate-400 text-xs py-8">Cargando...</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* CENTER: Canvas + properties */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="showGridCheck"
                    checked={showGrid}
                    onChange={e => setShowGrid(e.target.checked)}
                    className="accent-primary"
                  />
                  <label htmlFor="showGridCheck" className="text-xs font-medium text-slate-600 cursor-pointer select-none flex items-center gap-1">
                    <Grid className="w-3.5 h-3.5" /> Cuadrícula
                  </label>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <label className="text-xs font-medium text-slate-600">Fondo:</label>
                  <input
                    type="color"
                    value={canvasFondoColor}
                    onChange={e => { setCanvasFondoColor(e.target.value); setCanvasHasChanges(true); }}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                    title="Color de fondo"
                  />
                </div>
                {/* Background image upload */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Fondo foto:</label>
                  <input
                    type="file"
                    id="canvasFondoFileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCanvasFondoImagenUrl(ev.target?.result as string);
                        setCanvasHasChanges(true);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-8 text-xs gap-1"
                    onClick={() => document.getElementById('canvasFondoFileInput')?.click()}
                  >
                    <ImageIconLucide className="w-3 h-3" />
                    {canvasFondoImagenUrl ? 'Cambiar foto' : 'Subir foto salón'}
                  </Button>
                  {canvasFondoImagenUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl h-8 text-xs text-red-400 hover:text-red-600"
                      onClick={() => { setCanvasFondoImagenUrl(''); setCanvasHasChanges(true); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {isAutoSaving && <span className="text-[10px] text-slate-400 animate-pulse">Guardando...</span>}
                  {canvasHasChanges && !isAutoSaving && <span className="text-[10px] text-amber-500">● Sin guardar</span>}
                  <Button type="button" variant="outline" size="sm" onClick={handleExportPng} className="rounded-xl h-8 text-xs gap-1">
                    <Download className="w-3 h-3" /> Exportar PNG
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsPlantillaModalOpen(true)} className="rounded-xl h-8 text-xs gap-1">
                    <Save className="w-3 h-3" /> Guardar plantilla
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsLoadPlantillaModalOpen(true)} className="rounded-xl h-8 text-xs gap-1">
                    <RefreshCcw className="w-3 h-3" /> Cargar plantilla
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => saveCanvas(false)}
                    disabled={isSavingCanvas}
                    className="rounded-xl h-8 shadow-lg shadow-primary/20 text-xs gap-1"
                  >
                    {isSavingCanvas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md overflow-hidden">
                <CardContent className="p-4">
                  <DecoCanvas
                    elementos={canvasElementos}
                    onChange={handleCanvasElementsChange}
                    selectedId={selectedCanvasId}
                    onSelectId={setSelectedCanvasId}
                    hiddenZones={canvasHiddenZones}
                    fondoColor={canvasFondoColor}
                    fondoImagenUrl={canvasFondoImagenUrl || undefined}
                    showGrid={showGrid}
                  />
                </CardContent>
              </Card>

              {/* Properties bar for selected element */}
              {selectedCanvasEl && (
                <Card className="border-none shadow-sm rounded-2xl bg-white/90">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap overflow-x-auto">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">Elemento seleccionado:</span>
                      <Badge variant="secondary" className="rounded-full capitalize">{selectedCanvasEl.tipo}</Badge>

                      {/* Color pickers using DecoColorPicker */}
                      {Array.from({ length: Math.max(1, selectedCanvasEl.colores.length || 1) }).map((_, idx) => (
                        <div key={idx} className="relative">
                          <button
                            type="button"
                            className="w-9 h-9 rounded-xl border-2 border-slate-200 shadow cursor-pointer transition-transform hover:scale-110"
                            style={{ background: selectedCanvasEl.colores[idx] ?? '#888888' }}
                            onClick={() => setPickerOpenIdx(pickerOpenIdx === idx ? null : idx)}
                            title={idx === 0 ? 'Color principal' : idx === 1 ? 'Color secundario' : 'Color 3'}
                          />
                          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 whitespace-nowrap">
                            {idx === 0 ? 'C1' : idx === 1 ? 'C2' : 'C3'}
                          </span>
                          {pickerOpenIdx === idx && (
                            <div className="absolute top-10 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-72">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-slate-500">Color {idx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => setPickerOpenIdx(null)}
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <DecoColorPicker
                                value={selectedCanvasEl.colores[idx] ?? '#888888'}
                                onChange={(color) => {
                                  handleUpdateSelectedElColor(idx, color);
                                }}
                                paletteColors={paletaColoresArray.filter(Boolean)}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Scale */}
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500">Escala</label>
                        <input
                          type="range" min={0.2} max={5} step={0.1}
                          value={selectedCanvasEl.escala}
                          onChange={e => handleUpdateSelectedElProp('escala', Number(e.target.value))}
                          className="w-24 h-2 accent-primary"
                        />
                        <span className="text-xs font-mono text-slate-600 w-10">{selectedCanvasEl.escala.toFixed(1)}x</span>
                      </div>

                      {/* Rotation */}
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500">Rotación</label>
                        <input
                          type="range" min={0} max={360} step={1}
                          value={selectedCanvasEl.rotacion ?? 0}
                          onChange={e => handleUpdateSelectedElProp('rotacion', Number(e.target.value))}
                          className="w-24 h-2 accent-primary"
                        />
                        <span className="text-xs font-mono text-slate-600 w-10">{Math.round(selectedCanvasEl.rotacion ?? 0)}°</span>
                      </div>

                      {/* Opacity */}
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500">Opacidad</label>
                        <input
                          type="range" min={0.1} max={1} step={0.05}
                          value={selectedCanvasEl.opacity ?? 1}
                          onChange={e => handleUpdateSelectedElProp('opacity', Number(e.target.value))}
                          className="w-20 h-2 accent-primary"
                        />
                        <span className="text-xs font-mono text-slate-600 w-10">{Math.round((selectedCanvasEl.opacity ?? 1) * 100)}%</span>
                      </div>

                      {/* Z-index */}
                      <Button type="button" variant="outline" size="sm" onClick={handleBringToFront} className="rounded-xl h-7 text-xs gap-1" title="Traer al frente">
                        <ChevronsUp className="w-3.5 h-3.5" /> Al frente
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleSendToBack} className="rounded-xl h-7 text-xs gap-1" title="Enviar atrás">
                        <ChevronsDown className="w-3.5 h-3.5" /> Atrás
                      </Button>

                      {/* Delete */}
                      <Button type="button" variant="destructive" size="sm" onClick={handleDeleteSelected} className="rounded-xl h-7 text-xs gap-1 ml-auto">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT: Zone panel */}
            <div className="w-52 flex-shrink-0">
              <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-md sticky top-4">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="font-headline text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" /> Zonas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <DecoZonaPanel
                    selectedElement={selectedCanvasEl}
                    onChangeZona={handleUpdateSelectedElZona}
                    hiddenZones={canvasHiddenZones}
                    onToggleZoneVisibility={handleZoneToggle}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChecklistAddForm({ onAdd, zonas }: { onAdd: (item: string, zona: string) => void; zonas: { id: string; nombre: string }[] }) {
  const [item, setItem] = React.useState('');
  const [zona, setZona] = React.useState(zonas[0]?.id || 'zona_principal');
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Input value={item} onChange={e => setItem(e.target.value)} placeholder="Nuevo item del checklist..." className="rounded-xl h-11 bg-slate-50 border-none flex-1"
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (item.trim()) { onAdd(item, zona); setItem(''); } } }} />
      <Select value={zona} onValueChange={setZona}>
        <SelectTrigger className="rounded-xl h-11 bg-slate-50 border-none w-full sm:w-44"><SelectValue /></SelectTrigger>
        <SelectContent className="rounded-2xl border-none shadow-2xl">
          {zonas.map(z => <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button type="button" onClick={() => { if (item.trim()) { onAdd(item, zona); setItem(''); } }} disabled={!item.trim()} className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
        <PlusCircle className="w-4 h-4 mr-2" /> Añadir
      </Button>
    </div>
  );
}

export default function DecoracionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <DecoracionYDisenoEventoContent />
    </Suspense>
  );
}
