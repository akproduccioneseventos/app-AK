
'use client';

import type { PresupuestoFormData } from '@/types/presupuesto';
import type { ServicioEmpresa, CategoriaServicio, UnidadServicio } from '@/types/empresa';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Tag, Search, PackageSearch, Gift, PlusCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import React, { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveServicioEmpresa } from '@/app/actions/servicios-empresa';
import { ALL_CATEGORIAS_SERVICIO, ALL_UNIDADES_SERVICIO } from '@/types/empresa';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';


interface Paso2ServiciosProps {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
  setServiciosCatalogo: Dispatch<SetStateAction<ServicioEmpresa[]>>; // To update the catalog state
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

// New Service Modal Component
const NewServiceModal = ({ onServiceCreated }: { onServiceCreated: (newService: ServicioEmpresa) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newServiceData, setNewServiceData] = useState<Partial<Omit<ServicioEmpresa, 'id'>>>({
        tipoItem: 'Servicio',
        nombre: '',
        categoria: 'Otros servicios',
        unidad: 'Por evento',
        precioVenta: 0,
        notas: '',
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
            } else {
                throw new Error(result.error || "No se pudo crear el servicio.");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary"><PlusCircle className="w-4 h-4 mr-2"/>Crear Nuevo Servicio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Crear Nuevo Servicio en Catálogo</DialogTitle><DialogDescription>Este servicio se guardará y se añadirá a este presupuesto.</DialogDescription></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3 py-2">
                    <div className="space-y-1"><Label htmlFor="new-serv-name">Nombre del Servicio *</Label><Input id="new-serv-name" value={newServiceData.nombre} onChange={e => setNewServiceData(p => ({...p, nombre: e.target.value}))} required/></div>
                    <div className="space-y-1"><Label htmlFor="new-serv-cat">Categoría *</Label><Select value={newServiceData.categoria} onValueChange={(val) => setNewServiceData(p => ({...p, categoria: val as CategoriaServicio}))}><SelectTrigger id="new-serv-cat"><SelectValue/></SelectTrigger><SelectContent>{ALL_CATEGORIAS_SERVICIO.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label htmlFor="new-serv-unidad">Unidad *</Label><Select value={newServiceData.unidad} onValueChange={val => setNewServiceData(p => ({...p, unidad: val as UnidadServicio}))}><SelectTrigger id="new-serv-unidad"><SelectValue/></SelectTrigger><SelectContent>{ALL_UNIDADES_SERVICIO.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1"><Label htmlFor="new-serv-price">Precio Venta *</Label><Input id="new-serv-price" type="number" value={newServiceData.precioVenta || ''} onChange={e => setNewServiceData(p => ({...p, precioVenta: parseFloat(e.target.value) || 0}))} required/></div>
                    </div>
                     <div className="space-y-1"><Label htmlFor="new-serv-notes">Descripción (Opcional)</Label><Textarea id="new-serv-notes" value={newServiceData.notas} onChange={e => setNewServiceData(p => ({...p, notas: e.target.value}))} rows={2}/></div>
                    <DialogFooter><DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose><Button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Crear y Añadir'}</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export default function Paso2Servicios({ formData, setFormData, serviciosCatalogo, setServiciosCatalogo }: Paso2ServiciosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoriaServicio>>(new Set());

  const handleServicioToggle = (servicio: ServicioEmpresa) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      if (newSelected.has(servicio.id)) {
        newSelected.delete(servicio.id);
      } else {
        newSelected.set(servicio.id, {
          cantidad: 1, 
          precioUnitarioOriginal: servicio.precioVenta || 0,
          precioUnitarioPresupuesto: servicio.precioVenta || 0,
          nombreServicio: servicio.nombre,
          unidad: servicio.unidad,
          categoriaServicio: servicio.categoria,
          esRegalo: false,
        });
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };

  const handleServiceCreated = (newService: ServicioEmpresa) => {
    // Add to general catalog in the UI
    setServiciosCatalogo(prev => [newService, ...prev]);
    // Add to the selected services for this budget
    handleServicioToggle(newService);
  };


  const handleServicioDetailChange = (
    servicioId: string,
    field: 'cantidad' | 'precioUnitarioPresupuesto' | 'esRegalo',
    value: string | number | boolean
  ) => {
    setFormData(prev => {
      const newSelected = new Map(prev.serviciosSeleccionados);
      const currentServicio = newSelected.get(servicioId);
      if (currentServicio) {
        if (field === 'esRegalo') {
            const esRegalo = !!value;
            newSelected.set(servicioId, {
              ...currentServicio,
              esRegalo,
              precioUnitarioPresupuesto: esRegalo ? 0 : currentServicio.precioUnitarioOriginal,
            });
        } else {
            let numericValue = Number(value);
            if (field === 'cantidad') {
                numericValue = Math.max(1, Math.floor(numericValue));
            } else if (field === 'precioUnitarioPresupuesto') {
                numericValue = Math.max(0, numericValue);
            }
            newSelected.set(servicioId, {
              ...currentServicio,
              [field]: isNaN(numericValue) ? (field === 'cantidad' ? 1 : 0) : numericValue,
               esRegalo: false, 
            });
        }
      }
      return { ...prev, serviciosSeleccionados: newSelected };
    });
  };
  
  const handleCategoryFilterToggle = (category: CategoriaServicio) => {
    setSelectedCategories(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(category)) newSelected.delete(category);
      else newSelected.add(category);
      return newSelected;
    });
  };

  const filteredServicios = useMemo(() => {
    return serviciosCatalogo.filter(s => {
      const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.subcategoria && s.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(s.categoria);
      return matchesSearch && matchesCategory && s.precioVenta !== undefined && s.precioVenta > 0;
    });
  }, [serviciosCatalogo, searchTerm, selectedCategories]);
  
  const serviciosAgrupados = useMemo(() => {
    return filteredServicios.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        const subcategoria = servicio.subcategoria || 'General';
        
        if (!acc[categoria]) {
            acc[categoria] = {};
        }
        if (!acc[categoria][subcategoria]) {
            acc[categoria][subcategoria] = [];
        }
        acc[categoria][subcategoria].push(servicio);
        return acc;
    }, {} as Record<string, Record<string, ServicioEmpresa[]>>);
  }, [filteredServicios]);

  const categoriasOrdenadas = useMemo(() => {
    return Object.keys(serviciosAgrupados).sort();
  }, [serviciosAgrupados]);


  const costoTotalServiciosSeleccionados = useMemo(() => {
    let total = 0;
    formData.serviciosSeleccionados.forEach(item => {
      total += item.cantidad * item.precioUnitarioPresupuesto;
    });
    return total;
  }, [formData.serviciosSeleccionados]);
  
  const uniqueCategoriesFromCatalog = useMemo(() => {
    const cats = new Set(serviciosCatalogo.filter(s => s.precioVenta !== undefined && s.precioVenta > 0).map(s => s.categoria));
    return Array.from(cats).sort();
  }, [serviciosCatalogo]);


  if (!serviciosCatalogo || serviciosCatalogo.length === 0) {
    return (
      <div className="text-center py-10">
        <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground text-lg">No hay servicios definidos en el catálogo.</p>
        <div className="mt-4">
            <NewServiceModal onServiceCreated={handleServiceCreated} />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-grow space-y-2">
                <Label htmlFor="search-servicios" className="text-base">Buscar Servicio</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="search-servicios" type="text" placeholder="Nombre, categoría o subcategoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 text-base p-3"/>
                </div>
            </div>
             <NewServiceModal onServiceCreated={handleServiceCreated} />
        </div>
        <Separator/>
        <p className="text-sm text-muted-foreground">Selecciona servicios del catálogo. Puedes ajustar cantidad y precio para este presupuesto.</p>
      
      <ScrollArea className="h-[450px] pr-1">
        {categoriasOrdenadas.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-2" defaultValue={categoriasOrdenadas}>
            {categoriasOrdenadas.map(categoria => (
              <AccordionItem key={categoria} value={categoria} className="border rounded-md shadow-sm bg-card overflow-hidden">
                <AccordionTrigger className="px-4 py-3 text-md font-medium text-primary hover:bg-muted/30 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary/80" />
                    {categoria}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pt-0 pb-3">
                  <div className="space-y-2 pt-2">
                    {Object.keys(serviciosAgrupados[categoria]).sort().map(subcategoria => (
                      <div key={subcategoria} className="ml-2 pl-3 border-l-2">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">{subcategoria}</h4>
                        <ul className="space-y-3">
                          {serviciosAgrupados[categoria][subcategoria].map(servicio => {
                            const isSelected = formData.serviciosSeleccionados.has(servicio.id);
                            const selectedInfo = formData.serviciosSeleccionados.get(servicio.id);
                            return (
                              <li key={servicio.id} className={`p-3 border rounded-md transition-all ${isSelected ? 'bg-primary/10 ring-1 ring-primary/50' : 'bg-muted/20 hover:bg-muted/40'}`}>
                                <div className="flex items-start gap-3">
                                  <Checkbox id={`s-${servicio.id}`} checked={isSelected} onCheckedChange={() => handleServicioToggle(servicio)} className="mt-1 w-5 h-5 shrink-0"/>
                                  <div className="flex-grow">
                                    <Label htmlFor={`s-${servicio.id}`} className="font-medium text-sm cursor-pointer">{servicio.nombre}</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Catálogo: {formatCurrency(servicio.precioVenta)} {servicio.unidad ? `/ ${servicio.unidad.toLowerCase()}` : ''}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && selectedInfo && (
                                  <div className="mt-2 pt-2 border-t border-dashed space-y-2 pl-8">
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                      <div className="space-y-0.5">
                                        <Label htmlFor={`qty-${servicio.id}`} className="text-xs">Cant.</Label>
                                        <Input id={`qty-${servicio.id}`} type="number" value={selectedInfo.cantidad} onChange={(e) => handleServicioDetailChange(servicio.id, 'cantidad', e.target.value)} min="1" className="h-8 text-sm" required />
                                      </div>
                                      <div className="space-y-0.5">
                                        <Label htmlFor={`price-${servicio.id}`} className="text-xs">P.Unit. (Presup.)</Label>
                                        <Input id={`price-${servicio.id}`} type="number" value={selectedInfo.precioUnitarioPresupuesto} onChange={(e) => handleServicioDetailChange(servicio.id, 'precioUnitarioPresupuesto', e.target.value)} min="0" step="any" className="h-8 text-sm" disabled={selectedInfo.esRegalo}/>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id={`gift-${servicio.id}`} checked={selectedInfo.esRegalo} onCheckedChange={(checked) => handleServicioDetailChange(servicio.id, 'esRegalo', !!checked)}/>
                                        <Label htmlFor={`gift-${servicio.id}`} className="text-xs font-normal flex items-center gap-1 text-primary"><Gift className="w-3 h-3"/>Marcar como Regalo (Precio = $0)</Label>
                                    </div>
                                    <p className="text-xs font-medium text-right pt-1">Subtotal Servicio: {formatCurrency(selectedInfo.cantidad * selectedInfo.precioUnitarioPresupuesto)}</p>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10 text-muted-foreground"><Search className="w-12 h-12 mx-auto mb-3 opacity-50"/>No hay servicios que coincidan o con precio de venta para mostrar.</div>
        )}
      </ScrollArea>
      <div className="mt-6 pt-4 border-t">
        <p className="text-xl font-semibold text-right">Costo Total de Servicios Seleccionados: {formatCurrency(costoTotalServiciosSeleccionados)}</p>
      </div>
    </div>
  );
}
