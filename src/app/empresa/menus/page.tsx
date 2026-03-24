
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ChefHat, PlusCircle, Copy, Edit, Trash2, Loader2, DollarSign, Info, Percent, GlassWater, Package, Save, Calculator, Search, BookOpen, CakeSlice, Candy, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMenus, deleteMenu, duplicateMenu, adjustAllDishMargins } from '@/app/actions/menus-catering';
import { getBebidasMasterTemplate, saveBebidasMasterTemplate } from '@/app/actions/bebidas.actions';
import { getReposteriaMasterTemplate, saveReposteriaMasterTemplate } from '@/app/actions/reposteria.actions';
import { getInsumos } from '@/app/actions/insumos';
import type { FullMenu, MenuItem } from '@/types/catering';
import type { BebidasData, ReposteriaData, BebidaItem, ReposteriaItem } from '@/types/fiesta';
import type { ServicioEmpresa } from '@/types/empresa';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export default function GestionMenusPage() {
  const { toast } = useToast();
  
  // Menus State
  const [menus, setMenus] = useState<FullMenu[]>([]);
  
  // New Services State
  const [bebidasMaster, setBebidasMaster] = useState<BebidasData | null>(null);
  const [reposteriaMaster, setReposteriaMaster] = useState<ReposteriaData | null>(null);
  const [insumos, setInsumos] = useState<ServicioEmpresa[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(10);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Dialog State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [targetCategory, setTargetCategory] = useState<{ type: 'bebida' | 'reposteria', catId: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [menuData, bebidasData, reposteriaData, insumosData] = await Promise.all([
        getMenus(),
        getBebidasMasterTemplate(),
        getReposteriaMasterTemplate(),
        getInsumos()
      ]);
      setMenus(menuData);
      setBebidasMaster(bebidasData);
      setReposteriaMaster(reposteriaData);
      setInsumos(insumosData);
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos maestros.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- MENU ACTIONS ---
  const handleDeleteMenu = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await deleteMenu(id);
      if (result.success) {
        toast({ title: 'Menú Eliminado', description: `Se eliminó "${name}".` });
        fetchData();
      } else throw new Error(result.error);
    } catch (err: any) {
      toast({ title: 'Error al Eliminar', description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleDuplicateMenu = async (id: string, name: string) => {
    setProcessingId(id);
    try {
      const result = await duplicateMenu(id);
      if (result.success) {
        toast({ title: 'Menú Duplicado', description: `Se creó una copia de "${name}".` });
        fetchData();
      } else throw new Error(result.error);
    } catch (err: any) {
      toast({ title: 'Error al Duplicar', description: err.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdjustMargins = async () => {
    setIsAdjusting(true);
    try {
      const result = await adjustAllDishMargins(adjustmentPercentage);
      if (result.success) {
        toast({ title: "Márgenes ajustados" });
        await fetchData();
      } else throw new Error(result.error);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsAdjusting(false);
    }
  };

  // --- NEW SERVICE ACTIONS ---
  const handleSaveBebidas = async () => {
    if (!bebidasMaster) return;
    setIsSaving(true);
    try {
      const res = await saveBebidasMasterTemplate(bebidasMaster);
      if (res.success) toast({ title: "Plantilla de Bebidas guardada" });
    } catch (e) {
      toast({ title: "Error al guardar bebidas", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReposteria = async () => {
    if (!reposteriaMaster) return;
    setIsSaving(true);
    try {
      const res = await saveReposteriaMasterTemplate(reposteriaMaster);
      if (res.success) toast({ title: "Plantilla de Repostería guardada" });
    } catch (e) {
      toast({ title: "Error al guardar repostería", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBarraItemChange = (itemId: string, field: keyof BebidaItem, value: any) => {
    if (!bebidasMaster) return;
    const updated = {
      ...bebidasMaster,
      categorias: bebidasMaster.categorias.map(cat => {
        if (cat.id !== 'barra_tragos') return cat;
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id !== itemId) return item;
            const updatedItem = { ...item, [field]: value };
            if (field === 'cantidadNecesaria' || field === 'costoUnitario') {
              updatedItem.costoTotal = (updatedItem.cantidadNecesaria || 0) * (updatedItem.costoUnitario || 0);
            }
            return updatedItem;
          })
        };
      })
    };
    setBebidasMaster(updated);
  };

  const handleReposteriaItemChange = (catId: string, itemId: string, field: keyof ReposteriaItem, value: any) => {
    if (!reposteriaMaster) return;
    const updated = {
      ...reposteriaMaster,
      categorias: reposteriaMaster.categorias.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, [field]: value };
          })
        };
      })
    };
    setReposteriaMaster(updated);
  };

  const openCatalog = (type: 'bebida' | 'reposteria', catId: string) => {
    setTargetCategory({ type, catId });
    setCatalogSearchTerm('');
    setIsCatalogModalOpen(true);
  };

  const handleAddFromCatalog = (insumo: ServicioEmpresa) => {
    if (!targetCategory) return;

    if (targetCategory.type === 'bebida') {
      const newItem: BebidaItem = {
        id: `beb_${Date.now()}_${insumo.id}`,
        nombre: insumo.nombre,
        cantidadNecesaria: 0.02,
        unidadCantidad: insumo.unidad || 'Litros',
        costoUnitario: insumo.valorUnitarioEstimado || 0,
        costoTotal: (insumo.valorUnitarioEstimado || 0) * 0.02,
        origenId: insumo.id
      };
      setBebidasMaster(prev => {
        if (!prev) return null;
        return {
          ...prev,
          categorias: prev.categorias.map(c => c.id === targetCategory.catId ? { ...c, items: [...c.items, newItem] } : c)
        };
      });
    } else {
      const newItem: ReposteriaItem = {
        id: `rep_${Date.now()}_${insumo.id}`,
        nombre: insumo.nombre,
        cantidad: 1,
        unidad: insumo.unidad || 'Unidad',
        costoEstimado: insumo.valorUnitarioEstimado || 0,
        origenId: insumo.id
      };
      setReposteriaMaster(prev => {
        if (!prev) return null;
        return {
          ...prev,
          categorias: prev.categorias.map(c => c.id === targetCategory.catId ? { ...c, items: [...c.items, newItem] } : c)
        };
      });
    }
    setIsCatalogModalOpen(false);
    toast({ title: "Insumo añadido" });
  };

  const removeItem = (type: 'bebida' | 'reposteria', catId: string, itemId: string) => {
    if (type === 'bebida') {
      setBebidasMaster(prev => {
        if (!prev) return null;
        return {
          ...prev,
          categorias: prev.categorias.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
        };
      });
    } else {
      setReposteriaMaster(prev => {
        if (!prev) return null;
        return {
          ...prev,
          categorias: prev.categorias.map(c => c.id === catId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c)
        };
      });
    }
  };

  const filteredInsumos = useMemo(() => {
    const term = catalogSearchTerm.toLowerCase();
    return insumos.filter(i => i.nombre.toLowerCase().includes(term) || i.categoria?.toLowerCase().includes(term));
  }, [insumos, catalogSearchTerm]);

  const barraTragosItems = useMemo(() => bebidasMaster?.categorias.find(c => c.id === 'barra_tragos')?.items || [], [bebidasMaster]);
  const costoPPBarra = useMemo(() => barraTragosItems.reduce((s, i) => s + (i.costoTotal || 0), 0), [barraTragosItems]);

  const mesaDulceItems = useMemo(() => reposteriaMaster?.categorias.find(c => c.id === 'mesa_postres')?.items || [], [reposteriaMaster]);
  const candyBarItems = useMemo(() => reposteriaMaster?.categorias.find(c => c.id === 'candy_bar')?.items || [], [reposteriaMaster]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary w-12 h-12"/></div>;

  return (
    <div className="space-y-10 pb-20">
      <Dialog open={isCatalogModalOpen} onOpenChange={setIsCatalogModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Catálogo de Insumos</DialogTitle></DialogHeader>
          <div className="py-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
              <Input placeholder="Buscar insumo..." value={catalogSearchTerm} onChange={e => setCatalogSearchTerm(e.target.value)} className="pl-9"/>
            </div>
            <ScrollArea className="h-64 border rounded-md p-2">
              <div className="space-y-1">
                {filteredInsumos.map(i => (
                  <Button key={i.id} variant="ghost" className="w-full justify-start h-auto py-2 text-left" onClick={() => handleAddFromCatalog(i)}>
                    <div>
                      <p className="font-bold text-sm">{i.nombre}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{i.categoria} • {formatCurrency(i.valorUnitarioEstimado)}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-black tracking-tighter uppercase font-headline">Planificador Gastronómico Maestro</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
            <Link href="/empresa/menus/catalogo" passHref><Button variant="secondary" className="rounded-xl font-bold">Catálogo de Platos</Button></Link>
            <Link href="/empresa/menus/nuevo" passHref><Button className="rounded-xl font-bold"><PlusCircle className="w-4 h-4 mr-2"/>Crear Menú</Button></Link>
            <Link href="/empresa" passHref><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button></Link>
        </div>
      </div>

      {/* AVISO DE INTEGRIDAD DEL CATÁLOGO */}
      <Alert className="bg-blue-50 border-blue-200 text-blue-800 rounded-[1.5rem] shadow-sm">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <div>
          <AlertTitle className="font-black uppercase text-xs tracking-widest">Aviso de Seguridad del Sistema</AlertTitle>
          <AlertDescription className="text-sm font-medium opacity-90">
            La gestión de recetas y costos en esta página **no elimina** los servicios de tu catálogo principal. 
            Puedes seguir cobrando los postres y bebidas individualmente en los presupuestos; aquí solo definimos cuánto te cuesta producirlos y qué ingredientes necesitas comprar.
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 gap-8">
        {/* BARRA DE TRAGOS */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
              <div className="flex justify-between items-start">
                  <div className="space-y-1">
                      <CardTitle className="font-headline text-3xl flex items-center gap-3 text-primary">
                          <GlassWater className="w-8 h-8" /> BARRA DE TRAGOS MAESTRA
                      </CardTitle>
                      <CardDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest">Configuración base para el simulador y eventos</CardDescription>
                  </div>
                  <Button onClick={handleSaveBebidas} disabled={isSaving} className="rounded-2xl h-12 px-8 font-black shadow-lg shadow-primary/20">
                    {isSaving ? <Loader2 className="animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>} GUARDAR RECETA
                  </Button>
              </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Costo p/Persona</p><p className="text-3xl font-black text-primary">{formatCurrency(costoPPBarra)}</p></div>
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100"><p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Rentabilidad</p><p className="text-3xl font-black text-emerald-700">100%</p></div>
                  <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 shadow-inner"><p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Precio de Venta</p><p className="text-3xl font-black text-primary">{formatCurrency(costoPPBarra * 2)}</p></div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center items-center"><Button variant="outline" onClick={() => openCatalog('bebida', 'barra_tragos')} className="rounded-xl border-dashed border-primary/30 text-primary font-bold"><PlusCircle className="w-4 h-4 mr-2"/> Añadir Insumo</Button></div>
              </div>

              <div className="rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                  <Table>
                      <TableHeader className="bg-slate-50">
                          <TableRow className="border-slate-100">
                              <TableHead className="text-[10px] font-black uppercase pl-8">Producto / Licores</TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase">Cant p/p</TableHead>
                              <TableHead className="text-[10px] font-black uppercase">Unidad</TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase">Costo Unit</TableHead>
                              <TableHead className="text-right text-[10px] font-black uppercase pr-8">Total (100 inv)</TableHead>
                              <TableHead className="w-10"></TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {barraTragosItems.map(row => (
                              <TableRow key={row.id} className="border-slate-50 hover:bg-slate-50/50">
                                  <TableCell className="pl-8 py-4"><Input value={row.nombre} onChange={e => handleBarraItemChange(row.id, 'nombre', e.target.value)} className="h-8 border-none font-bold p-0 focus-visible:ring-0"/></TableCell>
                                  <TableCell className="text-right"><Input type="number" step="0.01" value={row.cantidadNecesaria} onChange={e => handleBarraItemChange(row.id, 'cantidadNecesaria', parseFloat(e.target.value))} className="h-8 w-20 text-right font-mono ml-auto"/></TableCell>
                                  <TableCell className="text-[10px] font-black text-slate-400 uppercase">{row.unidadCantidad}</TableCell>
                                  <TableCell className="text-right"><Input type="number" value={row.costoUnitario} onChange={e => handleBarraItemChange(row.id, 'costoUnitario', parseFloat(e.target.value))} className="h-8 w-24 text-right font-mono ml-auto"/></TableCell>
                                  <TableCell className="text-right pr-8 font-black text-primary">{formatCurrency((row.costoTotal || 0) * 100)}</TableCell>
                                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeItem('bebida', 'barra_tragos', row.id)} className="text-slate-300 hover:text-destructive"><Trash2 className="w-4 h-4"/></Button></TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MESA DULCE Y FUENTE */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-orange-50/50 p-6 border-b border-orange-100">
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-2xl flex items-center gap-3 text-orange-600">
                            <CakeSlice className="w-6 h-6" /> MESA DULCE Y FUENTE
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={handleSaveReposteria} disabled={isSaving} className="text-orange-600 hover:bg-orange-100 rounded-xl"><Save className="w-5 h-5"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => openCatalog('reposteria', 'mesa_postres')} className="rounded-xl text-[10px] font-black uppercase"><PlusCircle className="w-3 h-3 mr-2"/>Añadir Postre</Button></div>
                    <div className="space-y-2">
                        {mesaDulceItems.map(item => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group border border-transparent hover:border-orange-200 transition-all">
                                <div className="min-w-0 flex-grow">
                                    <Input value={item.nombre} onChange={e => handleReposteriaItemChange('mesa_postres', item.id, 'nombre', e.target.value)} className="h-7 border-none font-bold p-0 focus-visible:ring-0 text-sm"/>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Costo Est: {formatCurrency(item.costoEstimado)}</p>
                                        <Badge variant="outline" className="text-[8px] bg-white border-slate-200 text-slate-400 font-bold h-4">SINCRO CATÁLOGO</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input type="number" value={item.cantidad} onChange={e => handleReposteriaItemChange('mesa_postres', item.id, 'cantidad', parseInt(e.target.value))} className="w-14 h-8 text-center rounded-lg border-slate-200" />
                                    <Button variant="ghost" size="icon" onClick={() => removeItem('reposteria', 'mesa_postres', item.id)} className="text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* CANDY BAR MAESTRO */}
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-pink-50/50 p-6 border-b border-pink-100">
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-2xl flex items-center gap-3 text-pink-600">
                            <Candy className="w-6 h-6" /> CANDY BAR TEMÁTICO
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={handleSaveReposteria} disabled={isSaving} className="text-pink-600 hover:bg-pink-100 rounded-xl"><Save className="w-5 h-5"/></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => openCatalog('reposteria', 'candy_bar')} className="rounded-xl text-[10px] font-black uppercase"><PlusCircle className="w-3 h-3 mr-2"/>Añadir Elemento</Button></div>
                    <div className="space-y-2">
                        {candyBarItems.map(item => (
                            <div key={item.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center group border border-transparent hover:border-pink-200 transition-all">
                                <div className="min-w-0 flex-grow">
                                    <Input value={item.nombre} onChange={e => handleReposteriaItemChange('candy_bar', item.id, 'nombre', e.target.value)} className="h-7 border-none font-bold p-0 focus-visible:ring-0 text-sm"/>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Costo Est: {formatCurrency(item.costoEstimado)}</p>
                                        <Badge variant="outline" className="text-[8px] bg-white border-slate-200 text-slate-400 font-bold h-4">SINCRO CATÁLOGO</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input type="number" value={item.cantidad} onChange={e => handleReposteriaItemChange('candy_bar', item.id, 'cantidad', parseInt(e.target.value))} className="w-14 h-8 text-center rounded-lg border-slate-200" />
                                    <Button variant="ghost" size="icon" onClick={() => removeItem('reposteria', 'candy_bar', item.id)} className="text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* AJUSTE DE MARGENES */}
        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white">
            <CardHeader className="p-8">
                <CardTitle className="font-headline text-2xl flex items-center gap-3">
                    <Percent className="w-6 h-6 text-primary" /> AJUSTE DE MÁRGENES GLOBAL (MENÚS)
                </CardTitle>
                <CardDescription className="text-slate-400">Aumenta o disminuye el margen de ganancia de todos los platos del catálogo.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 flex flex-col sm:flex-row gap-6 items-end">
                <div className="space-y-2 flex-grow">
                    <Label htmlFor="percentage-adjust" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Puntos Porcentuales</Label>
                    <Input id="percentage-adjust" type="number" value={adjustmentPercentage} onChange={(e) => setAdjustmentPercentage(Number(e.target.value))} className="rounded-xl h-12 bg-white/10 border-none text-white font-bold" />
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button disabled={isAdjusting || adjustmentPercentage === 0} className="rounded-xl h-12 px-10 font-bold bg-primary hover:bg-primary/90">
                        {isAdjusting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Percent className="w-4 h-4 mr-2"/>} APLICAR A TODOS
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                    <AlertDialogHeader><AlertDialogTitle className="font-headline text-2xl">¿Estás seguro?</AlertDialogTitle><AlertDialogDescription className="font-medium text-sm">Esta acción modificará los márgenes de todos los platos en un {adjustmentPercentage}%. El cambio es irreversible.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter className="gap-2"><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleAdjustMargins} className="rounded-xl bg-primary">Confirmar Ajuste</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>

        {/* MENUS GUARDADOS */}
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <ChefHat className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-tighter">MENÚS BASE GUARDADOS</CardTitle>
                        <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Gestión de plantillas gastronómicas principales</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
            {isLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-primary/30"/></div>
            ) : (menus && menus.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map(menu => (
                <Card key={menu.id} className="flex flex-col border-none shadow-lg hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden bg-white group hover:translate-y-[-4px]">
                    <CardHeader className="pb-4">
                    <CardTitle className="font-headline text-xl text-slate-800">{menu.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 h-8 font-medium">{menu.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4 pt-0">
                    <div className="flex items-center justify-between"><Badge variant="secondary" className="rounded-full bg-slate-100 text-slate-500 border-none px-3 font-bold text-[10px]">{menu.items.length} PLATOS</Badge></div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t border-slate-50 bg-slate-50/50 p-4">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:bg-white" onClick={() => handleDuplicateMenu(menu.id, menu.name)} disabled={!!processingId}>
                        {processingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Link href={`/empresa/menus/${menu.id}/editar`} passHref>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-primary hover:bg-white"><Edit className="w-4 h-4"/></Button>
                    </Link>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:bg-red-50" disabled={!!processingId}>
                            {processingId === menu.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                            <AlertDialogHeader><AlertDialogTitle className="font-headline text-2xl">¿Eliminar Menú?</AlertDialogTitle><AlertDialogDescription className="font-medium text-sm">Se eliminará "{menu.name}" de forma permanente.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter className="gap-2"><AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteMenu(menu.id, menu.name)} className="rounded-xl bg-destructive">Eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    </CardFooter>
                </Card>
                ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <ChefHat className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No hay menús base creados aún.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
