'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, PlusCircle, Trash2, Tag, Percent, RotateCcw, Package, Search, Gift, Edit } from 'lucide-react';
import type { PresupuestoFormData, ItemPresupuestado, TipoEvento, Presupuesto } from '@/types/presupuesto';
import type { ServicioEmpresa, CategoriaServicio, TramoDePrecio } from '@/types/empresa';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import type { PaqueteArmadoRapido } from '@/types/armado-rapido';

const SESSION_STORAGE_KEY = 'presupuestoEnProgreso_v2';

const initialFormData: PresupuestoFormData = {
  clienteNombre: '',
  eventoTipo: '',
  eventoFecha: undefined,
  invitadosCantidad: 50,
  salonFiestas: '',
  protagonista1Nombre: '',
  protagonista2Nombre: '',
  nombreEmpresa: '',
  serviciosSeleccionados: new Map(),
  nombrePromocion: '',
  descuentoTipo: undefined,
  descuentoValor: '',
  vigenciaPromocion: '',
  notas: '',
};

function formStateInitializer(initialState: PresupuestoFormData): PresupuestoFormData {
    if (typeof window === 'undefined') return initialState;
    try {
        const storedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (storedState) {
            const parsed = JSON.parse(storedState);
            parsed.serviciosSeleccionados = new Map(parsed.serviciosSeleccionados);
            parsed.eventoFecha = parsed.eventoFecha ? new Date(parsed.eventoFecha) : undefined;
            return parsed;
        }
    } catch (error) { console.error("Failed to parse form state", error); }
    return initialState;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

// --- Sub-components for better organization ---

const Paso1DatosEvento: React.FC<{ formData: PresupuestoFormData; setFormData: React.Dispatch<React.SetStateAction<PresupuestoFormData>> }> = ({ formData, setFormData }) => {
    const handleChange = (field: keyof PresupuestoFormData, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    const finalEventType = formData.eventoTipo.trim();
    const showCustomTipoInput = !ALL_TIPOS_EVENTO.includes(finalEventType as TipoEvento) && finalEventType !== '';

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="clienteNombre">Nombre Cliente*</Label><Input id="clienteNombre" value={formData.clienteNombre} onChange={(e) => handleChange('clienteNombre', e.target.value)} required/></div>
                <div className="space-y-1"><Label htmlFor="salonFiestas">Salón de Fiestas*</Label><Input id="salonFiestas" value={formData.salonFiestas} onChange={(e) => handleChange('salonFiestas', e.target.value)} required/></div>
            </div>
            <div className="space-y-1"><Label htmlFor="eventoTipoSelect">Tipo de Evento*</Label>
                <Select value={ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento) ? formData.eventoTipo : 'Otro'} onValueChange={value => handleChange('eventoTipo', value === 'Otro' ? '' : value)} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>{ALL_TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                {showCustomTipoInput && <Input value={finalEventType} onChange={e => handleChange('eventoTipo', e.target.value)} placeholder="Especificar tipo" className="mt-2"/>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="eventoFecha">Fecha del Evento*</Label><DatePickerDemo selectedDate={formData.eventoFecha} onDateChange={date => handleChange('eventoFecha', date)} /></div>
                <div className="space-y-1"><Label htmlFor="invitadosCantidad">Nº Invitados*</Label><Input id="invitadosCantidad" type="number" value={formData.invitadosCantidad ?? ''} onChange={(e) => handleChange('invitadosCantidad', e.target.value ? parseInt(e.target.value) : 0)} min="1" required/></div>
            </div>
        </div>
    );
};

const Paso2Servicios: React.FC<{ 
  formData: PresupuestoFormData; 
  setFormData: React.Dispatch<React.SetStateAction<PresupuestoFormData>>;
  serviciosCatalogo: ServicioEmpresa[];
  paquetesBase: PaqueteArmadoRapido[];
}> = ({ formData, setFormData, serviciosCatalogo, paquetesBase }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const handlePackageSelect = (pkg: PaqueteArmadoRapido) => {
        const newSelected = new Map<string, PresupuestoFormData['serviciosSeleccionados']['']>();
        pkg.serviciosIncluidos.forEach(servInPkg => {
            const servicio = serviciosCatalogo.find(s => s.id === servInPkg.id);
            if (servicio) {
                newSelected.set(servicio.id, {
                    cantidad: 1,
                    precioUnitarioOriginal: servicio.precioVenta || 0,
                    precioUnitarioPresupuesto: servInPkg.esRegalo ? 0 : servicio.precioVenta || 0,
                    nombreServicio: servicio.nombre,
                    unidad: servicio.unidad,
                    categoriaServicio: servicio.categoria,
                    esRegalo: servInPkg.esRegalo || false,
                    calculationMethod: servicio.calculationMethod,
                    precioBase: servicio.precioBase,
                    precioPorPersona: servicio.precioPorPersona,
                    invitadosPorUnidad: servicio.invitadosPorUnidad,
                    tramosDePrecio: servicio.tramosDePrecio,
                });
            }
        });
        setFormData(prev => ({ ...prev, serviciosSeleccionados: newSelected }));
        toast({ title: "Paquete Cargado", description: `Se cargaron ${newSelected.size} servicios del paquete "${pkg.nombre}".` });
    };
    
    const handleServicioToggle = (servicio: ServicioEmpresa, isChecked: boolean) => {
        setFormData(prev => {
            const newSelected = new Map(prev.serviciosSeleccionados);
            if (isChecked) {
                newSelected.set(servicio.id, {
                    cantidad: 1,
                    precioUnitarioOriginal: servicio.precioVenta || 0,
                    precioUnitarioPresupuesto: servicio.precioVenta || 0,
                    nombreServicio: servicio.nombre,
                    unidad: servicio.unidad,
                    categoriaServicio: servicio.categoria,
                    esRegalo: false,
                    calculationMethod: servicio.calculationMethod,
                    precioBase: servicio.precioBase,
                    precioPorPersona: servicio.precioPorPersona,
                    invitadosPorUnidad: servicio.invitadosPorUnidad,
                    tramosDePrecio: servicio.tramosDePrecio,
                });
            } else {
                newSelected.delete(servicio.id);
            }
            return { ...prev, serviciosSeleccionados: newSelected };
        });
    };
    
    const filteredServicios = useMemo(() => serviciosCatalogo.filter(s => 
        s.tipoItem === 'Servicio' && s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    ), [serviciosCatalogo, searchTerm]);
    
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Cargar Paquete Base (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {paquetesBase.map(pkg => (
                    <Button key={pkg.id} variant="outline" onClick={() => handlePackageSelect(pkg)} className="h-auto py-2 flex flex-col items-start text-left">
                        <span className="font-semibold flex items-center gap-1"><Package className="w-4 h-4"/> {pkg.nombre}</span>
                        <span className="text-xs text-muted-foreground">{pkg.serviciosIncluidos.length} servicios</span>
                    </Button>
                ))}
            </div>
            <Separator/>
            <h3 className="font-semibold text-lg">Añadir Servicios Individuales</h3>
            <Input placeholder="Buscar servicio por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <ScrollArea className="h-64 border rounded-md p-2">
                {filteredServicios.map(servicio => (
                    <div key={servicio.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                        <Checkbox 
                            id={`serv-${servicio.id}`} 
                            checked={formData.serviciosSeleccionados.has(servicio.id)}
                            onCheckedChange={checked => handleServicioToggle(servicio, !!checked)}
                        />
                        <Label htmlFor={`serv-${servicio.id}`} className="flex-grow cursor-pointer">{servicio.nombre}</Label>
                        <Badge variant="secondary">{formatCurrency(servicio.precioVenta)}</Badge>
                    </div>
                ))}
            </ScrollArea>
        </div>
    );
};

const Paso3Resumen: React.FC<{ 
  formData: PresupuestoFormData; 
  setFormData: React.Dispatch<React.SetStateAction<PresupuestoFormData>>;
  totalCalculado: number;
}> = ({ formData, setFormData, totalCalculado }) => {
    
    const handleDiscountChange = (field: keyof PresupuestoFormData, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleItemChange = (itemId: string, field: 'precioUnitarioPresupuesto' | 'esRegalo', value: string | boolean) => {
        setFormData(prev => {
            const newSelected = new Map(prev.serviciosSeleccionados);
            const item = newSelected.get(itemId);
            if (item) {
                if (field === 'esRegalo') {
                    item.esRegalo = !!value;
                    item.precioUnitarioPresupuesto = item.esRegalo ? 0 : item.precioUnitarioOriginal;
                } else {
                    item.precioUnitarioPresupuesto = Number(value) || 0;
                    item.esRegalo = false; // Editing price removes gift status
                }
                newSelected.set(itemId, item);
            }
            return { ...prev, serviciosSeleccionados: newSelected };
        });
    };

    const descuentoValorNum = parseFloat(formData.descuentoValor || '0');
    let descuentoAplicado = 0;
    if (formData.descuentoTipo && descuentoValorNum > 0) {
      descuentoAplicado = formData.descuentoTipo === 'porcentaje'
        ? (totalCalculado * descuentoValorNum) / 100
        : descuentoValorNum;
    }
    const totalFinal = totalCalculado - descuentoAplicado;
    
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Resumen y Personalización Final</h3>
            <Accordion type="multiple" className="w-full" defaultValue={['services-summary']}>
                <AccordionItem value="services-summary">
                    <AccordionTrigger>Servicios Seleccionados ({formData.serviciosSeleccionados.size})</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                        {Array.from(formData.serviciosSeleccionados.entries()).map(([id, serv]) => (
                            <div key={id} className="p-2 border rounded-md space-y-2">
                                <p className="font-medium text-sm">{serv.nombreServicio}</p>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                    <div className="space-y-1">
                                        <Label htmlFor={`price-${id}`} className="text-xs">Precio Unitario</Label>
                                        <Input id={`price-${id}`} type="number" value={serv.precioUnitarioPresupuesto} onChange={e => handleItemChange(id, 'precioUnitarioPresupuesto', e.target.value)} className="h-8 text-sm" disabled={serv.esRegalo}/>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-5">
                                        <Checkbox id={`gift-${id}`} checked={serv.esRegalo} onCheckedChange={checked => handleItemChange(id, 'esRegalo', !!checked)}/>
                                        <Label htmlFor={`gift-${id}`} className="text-xs font-normal flex items-center gap-1 text-primary"><Gift className="w-3 h-3"/>Marcar como Regalo</Label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1"><Label htmlFor="promo-nombre">Nombre Promoción</Label><Input id="promo-nombre" value={formData.nombrePromocion || ''} onChange={e => handleDiscountChange('nombrePromocion', e.target.value)} /></div>
                <div className="space-y-1"><Label htmlFor="promo-vigencia">Vigencia</Label><Input id="promo-vigencia" value={formData.vigenciaPromocion || ''} onChange={e => handleDiscountChange('vigenciaPromocion', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1">
                  <Label htmlFor="descuento-tipo">Tipo Descuento</Label>
                  <Select value={formData.descuentoTipo || ''} onValueChange={val => handleDiscountChange('descuentoTipo', val as PresupuestoFormData['descuentoTipo'])}><SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger><SelectContent><SelectItem value="porcentaje">Porcentaje (%)</SelectItem><SelectItem value="fijo">Monto Fijo ($)</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="descuento-valor">Valor Descuento</Label>
                  <Input id="descuento-valor" type="number" value={formData.descuentoValor || ''} onChange={e => handleDiscountChange('descuentoValor', e.target.value)} min="0" step="any" disabled={!formData.descuentoTipo}/>
                </div>
            </div>
             <div className="space-y-1"><Label htmlFor="notas">Notas Adicionales</Label><Textarea id="notas" value={formData.notas} onChange={(e) => handleChange('notas', e.target.value)} rows={3}/></div>
            <Separator/>
            <div className="text-right space-y-1">
                <p>Subtotal Servicios: {formatCurrency(totalCalculado)}</p>
                {descuentoAplicado > 0 && <p className="text-destructive">Descuento: -{formatCurrency(descuentoAplicado)}</p>}
                <p className="text-xl font-bold text-primary">Total Final: {formatCurrency(totalFinal)}</p>
            </div>
        </div>
    );
};

function NuevoPresupuestoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [paquetesBase, setPaquetesBase] = useState<PaqueteArmadoRapido[]>([]);
    const [paso, setPaso] = useState(1);
    
    const [formData, setFormData] = useState<PresupuestoFormData>(() => formStateInitializer(initialFormData));

    useEffect(() => {
        try {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                ...formData,
                serviciosSeleccionados: Array.from(formData.serviciosSeleccionados.entries())
            }));
        } catch (error) { console.warn("Could not save form state", error); }
    }, [formData]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            try {
                const [services, armadoConfig] = await Promise.all([getServiciosEmpresa(), getArmadoRapidoConfig()]);
                setServiciosCatalogo(services.filter(s => s.tipoItem === 'Servicio'));
                setPaquetesBase(armadoConfig.paquetes || []);
                const leadName = searchParams.get('leadName');
                if (leadName && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                    setFormData(prev => ({ ...prev, clienteNombre: leadName }));
                }
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar datos iniciales.", variant: "destructive" });
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        fetchInitialData();
    }, [searchParams, toast]);

    const handleNext = () => {
        if (paso === 1) {
             if (!formData.clienteNombre.trim() || !formData.eventoTipo.trim() || !formData.salonFiestas.trim() || !formData.eventoFecha || (formData.invitadosCantidad || 0) <= 0) {
                 toast({ title: "Requerido", description: "Por favor, completa todos los campos marcados con *.", variant: "destructive" });
                 return;
             }
        }
        setPaso(p => p < 3 ? p + 1 : p);
    };
    
    const totalCalculado = useMemo(() => {
        let total = 0;
        formData.serviciosSeleccionados.forEach(item => {
          if (item.esRegalo) return;
          const guests = formData.invitadosCantidad || 0;
          switch (item.calculationMethod) {
            case 'fijo': total += item.precioBase ?? item.precioUnitarioPresupuesto; break;
            case 'porPersona': total += (item.precioPorPersona ?? item.precioUnitarioPresupuesto) * guests; break;
            case 'ratio':
              const porUnidad = Number(item.invitadosPorUnidad);
              if (porUnidad > 0) total += Math.ceil(guests / porUnidad) * (item.precioBase ?? item.precioUnitarioPresupuesto);
              break;
            case 'tramos':
              const tramo = item.tramosDePrecio?.find(t => guests >= t.desde && guests <= t.hasta);
              total += tramo?.precio || 0;
              break;
            default: total += item.cantidad * item.precioUnitarioPresupuesto;
          }
        });
        return total;
    }, [formData.serviciosSeleccionados, formData.invitadosCantidad]);

    const handleSave = async () => {
        const presupuestoAGuardar = {
            clienteNombre: formData.clienteNombre,
            eventoTipo: formData.eventoTipo,
            eventoFecha: formData.eventoFecha?.toISOString() || '',
            invitadosCantidad: formData.invitadosCantidad || 0,
            salonFiestas: formData.salonFiestas,
            protagonista1Nombre: formData.protagonista1Nombre,
            protagonista2Nombre: formData.protagonista2Nombre,
            nombreEmpresa: formData.nombreEmpresa,
            itemsPresupuestados: Array.from(formData.serviciosSeleccionados.values()).map((serv, i) => {
                const guests = formData.invitadosCantidad || 0;
                let costoTotalItem = 0;
                if (!serv.esRegalo) {
                    switch (serv.calculationMethod) {
                        case 'fijo': costoTotalItem = serv.precioBase ?? serv.precioUnitarioPresupuesto; break;
                        case 'porPersona': costoTotalItem = (serv.precioPorPersona ?? serv.precioUnitarioPresupuesto) * guests; break;
                        case 'ratio': 
                            const porUnidad = Number(serv.invitadosPorUnidad);
                            if (porUnidad > 0) costoTotalItem = Math.ceil(guests / porUnidad) * (serv.precioBase ?? serv.precioUnitarioPresupuesto);
                            break;
                        case 'tramos':
                             const tramo = serv.tramosDePrecio?.find(t => guests >= t.desde && guests <= t.hasta);
                             costoTotalItem = tramo?.precio || 0;
                             break;
                        default: costoTotalItem = serv.cantidad * serv.precioUnitarioPresupuesto;
                    }
                }
                return { ...serv, idServicioCatalogo: Array.from(formData.serviciosSeleccionados.keys())[i], costoTotalItem };
            }),
            costoTotalEstimado: totalCalculado,
            nombrePromocion: formData.nombrePromocion,
            descuentoTipo: formData.descuentoTipo,
            descuentoValor: parseFloat(formData.descuentoValor || '0') || undefined,
            vigenciaPromocion: formData.vigenciaPromocion,
            timestamp: new Date().toISOString(),
            notas: formData.notas
        };
        
        setIsSaving(true);
        try {
          const result = await savePresupuesto(presupuestoAGuardar);
          if (result.success && result.id) {
            toast({ title: "¡Presupuesto Guardado!", description: `Se ha creado el presupuesto para ${presupuestoAGuardar.clienteNombre}.` });
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            router.push('/presupuestos');
          } else { throw new Error(result.error || "Error al guardar"); }
        } catch (error: any) {
          toast({ title: "Error al Guardar", description: error.message, variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-2xl">Nuevo Presupuesto</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => { sessionStorage.removeItem(SESSION_STORAGE_KEY); setFormData(initialFormData); toast({ description: "Formulario reiniciado." }); }}>
                            <RotateCcw className="w-4 h-4 mr-2"/> Reiniciar
                        </Button>
                    </div>
                     <Progress value={(paso / 3) * 100} className="w-full h-2 mt-2" />
                </CardHeader>
                <CardContent>
                    {isLoadingInitialData ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
                        <>
                            {paso === 1 && <Paso1DatosEvento formData={formData} setFormData={setFormData} />}
                            {paso === 2 && <Paso2Servicios formData={formData} setFormData={setFormData} serviciosCatalogo={serviciosCatalogo} paquetesBase={paquetesBase} />}
                            {paso === 3 && <Paso3Resumen formData={formData} setFormData={setFormData} totalCalculado={totalCalculado} />}
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={() => setPaso(p => p - 1)} disabled={paso === 1 || isSaving}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    {paso < 3 ? (
                        <Button onClick={handleNext} disabled={isSaving}>
                            Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Presupuesto
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function NuevoPresupuestoPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>}>
            <NuevoPresupuestoContent />
        </Suspense>
    )
}
