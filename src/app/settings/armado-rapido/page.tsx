
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Wand2, PlusCircle, Save, Loader2, Package, Trash2, Settings, GripVertical, Check, Utensils, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa, CategoriaServicio as CategoriaServicioEmpresa, UnidadServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ServicioCategoriaArmadoRapido } from '@/types/armado-rapido';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};


const NewServiceModal = ({ onServiceCreated }: { onServiceCreated: (newService: ServicioEmpresa) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newServiceData, setNewServiceData] = useState<Partial<Omit<ServicioEmpresa, 'id'>>>({
        tipoItem: 'Servicio', nombre: '', categoria: 'Otros servicios', unidad: 'Por evento', precioVenta: 0, notas: ''
    });
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServiceData.nombre || !newServiceData.categoria || !newServiceData.unidad || (newServiceData.precioVenta ?? -1) < 0) {
            toast({ title: "Datos incompletos", description: "Nombre, categoría, unidad y precio son requeridos.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        try {
            const result = await saveServicioEmpresa(newServiceData as Omit<ServicioEmpresa, 'id'>);
            if (result.success && result.servicio) {
                toast({ title: "Servicio Creado", description: `"${result.servicio.nombre}" ha sido añadido al catálogo.` });
                onServiceCreated(result.servicio);
                setIsOpen(false);
                setNewServiceData({ tipoItem: 'Servicio', nombre: '', categoria: 'Otros servicios', unidad: 'Por evento', precioVenta: 0, notas: '' });
            } else { throw new Error(result.error || "No se pudo crear el servicio."); }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally { setIsSaving(false); }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary"><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Servicio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Crear Nuevo Servicio en Catálogo</DialogTitle><DialogDescription>Este servicio se guardará y estará disponible para añadir a cualquier paquete.</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 py-2">
                    <div className="space-y-1"><Label htmlFor="new-serv-name">Nombre del Servicio *</Label><Input id="new-serv-name" value={newServiceData.nombre} onChange={e => setNewServiceData(p => ({...p, nombre: e.target.value}))} required/></div>
                    <div className="space-y-1"><Label htmlFor="new-serv-cat">Categoría *</Label><Select value={newServiceData.categoria} onValueChange={(val) => setNewServiceData(p => ({...p, categoria: val as CategoriaServicioEmpresa}))}><SelectTrigger id="new-serv-cat"><SelectValue/></SelectTrigger><SelectContent>{['Servicio de catering', 'Servicio de filmación', 'Servicio de fotografía', 'Servicio de decoración', 'Servicio de entretenimiento', 'Servicio de bebidas', 'Servicio de discoteca', 'Servicio de repostería', 'Regalo exclusivo', 'Personal', 'Otros servicios'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label htmlFor="new-serv-unidad">Unidad *</Label><Select value={newServiceData.unidad} onValueChange={val => setNewServiceData(p => ({...p, unidad: val as UnidadServicio}))}><SelectTrigger id="new-serv-unidad"><SelectValue/></SelectTrigger><SelectContent>{['Unidad', 'Set', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Docena', 'Por persona', 'Por evento', 'Gramos', 'Cc', 'Pack'].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label htmlFor="new-serv-price">Precio Venta *</Label><Input id="new-serv-price" type="number" value={newServiceData.precioVenta || ''} onChange={e => setNewServiceData(p => ({...p, precioVenta: parseFloat(e.target.value) || 0}))} required/></div>
                    </div>
                     <div className="space-y-1"><Label htmlFor="new-serv-notes">Descripción (Opcional)</Label><Input id="new-serv-notes" value={newServiceData.notas} onChange={e => setNewServiceData(p => ({...p, notas: e.target.value}))}/></div>
                    <DialogFooter><DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Crear y Añadir'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const CATEGORIAS_PRESUPUESTO: { value: ServicioCategoriaArmadoRapido, label: string }[] = [
    { value: 'Entrada', label: 'Entrada' },
    { value: 'Plato Principal', label: 'Plato Principal' },
    { value: 'Menú Adolescente', label: 'Menú Adolescente' },
    { value: 'Menú Niño', label: 'Menú Niño' },
    { value: 'Servicio Adicional', label: 'Servicio Adicional' },
];

export default function ArmadoRapidoSettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [vendibleServices, setVendibleServices] = useState<ServicioEmpresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sensors = useSensors(useSensor(PointerSensor));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedConfig, fetchedServices] = await Promise.all([ getArmadoRapidoConfig(), getServiciosEmpresa() ]);
      setConfig(fetchedConfig);
      setVendibleServices(fetchedServices.filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined));
    } catch (err: any) {
      setError("No se pudo cargar la configuración.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);
  
  const handleConfigChange = (field: keyof ArmadoRapidoConfig, value: any) => {
    setConfig(prev => (prev ? { ...prev, [field]: value } : null));
  };
  
  const handleSaveChanges = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "¡Configuración Guardada!", description: "Tus paquetes de armado rápido han sido actualizados." });
        loadData();
      } else {
        throw new Error(result.error || "No se pudo guardar la configuración.");
      }
    } catch (err: any) {
      toast({ title: "Error al Guardar", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOrEditPackage = (pkg?: PaqueteArmadoRapido) => {
    // Logic for adding/editing a package will go here
  };
  
  const handleToggleService = (packageId: string, service: ServicioEmpresa) => {
    // Logic to add/remove a service from a package
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !config) return <div className="text-center text-destructive p-4">Error al cargar datos.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración de Armado Rápido</h1></div>
        <Link href="/settings/budget-display" passHref><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button></Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Descuento General</CardTitle>
          <CardDescription>Aplica un descuento porcentual a todas las cotizaciones generadas con esta herramienta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-1">
             <Label htmlFor="descuento-general">Descuento General (%)</Label>
             <Input id="descuento-general" type="number" value={config.descuentoGeneral || ''} onChange={e => handleConfigChange('descuentoGeneral', Number(e.target.value) || undefined)} placeholder="Ej: 10 para 10%"/>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Configurar Paquetes</CardTitle>
          <CardDescription>Crea y edita los paquetes de servicios que tus clientes podrán elegir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button onClick={() => handleAddOrEditPackage()}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete Nuevo</Button>
            <Separator />
            <div className="space-y-3">
              {(config.paquetes || []).map(pkg => (
                <Card key={pkg.id} className="bg-muted/30">
                  <CardHeader className="flex-row items-center justify-between p-3">
                      <div>
                          <CardTitle className="text-lg">{pkg.nombre}</CardTitle>
                          <CardDescription className="text-xs">{pkg.descripcion}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleAddOrEditPackage(pkg)}><Settings className="w-4 h-4"/></Button>
                  </CardHeader>
                  <CardContent className="p-3 border-t">
                      {pkg.serviciosIncluidos.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                              {pkg.serviciosIncluidos.map(s => <li key={s.id} className="flex justify-between"><span>{s.nombre} <Badge variant="outline" className="text-xs">{s.categoria}</Badge></span> <span>{formatCurrency(s.precioFijo)}</span></li>)}
                          </ul>
                      ) : <p className="text-sm text-muted-foreground">Este paquete no tiene servicios.</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
        </CardContent>
      </Card>
      
      <CardFooter className="border-t pt-6">
        <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2"/>}
            {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </CardFooter>
    </div>
  );
}
