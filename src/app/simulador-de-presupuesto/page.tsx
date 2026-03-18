
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, Package, ChefHat, FileText, Send, CheckCircle, Gift, User, Phone, MessageSquare, Share2, Printer, Edit, CalendarDays, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateBudgetAndLeadFromSimulator } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getSocialConnections } from '@/app/actions/social-connections';
import { getInvoiceTemplateSettings } from '@/app/actions/settings';
import type { SocialConnection } from '@/types/settings';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import Image from 'next/image';
import type { ItemPresupuestado } from '@/types/presupuesto';
import type { FullMenu, MenuItem } from '@/types/catering';
import { getMenus } from '@/app/actions/menus-catering';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import { cn } from '@/lib/utils';

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (date = new Date()) => {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * MOTOR DE CÁLCULO UNIFICADO PARA EL SIMULADOR
 */
function calcularCostoServicio(servicio: ServicioEmpresa, adultos: number, ninosYAdolescentes: number): number {
  if (!servicio) return 0;
  
  const itemDataForCalc: ItemPresupuestado = {
    idServicioCatalogo: servicio.id,
    nombreServicio: servicio.nombre,
    cantidad: 1,
    precioUnitario: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
    precioUnitarioPresupuesto: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
    costoTotalItem: 0,
    categoriaServicio: servicio.categoria,
    subcategoria: servicio.subcategoria,
    calculationMethod: servicio.calculationMethod,
    precioBase: servicio.precioBase,
    precioPorPersona: servicio.precioPorPersona,
    invitadosPorUnidad: servicio.invitadosPorUnidad,
    tramosDePrecio: servicio.tramosDePrecio,
  };

  return recalcularCostoItem(itemDataForCalc, adultos, 0, ninosYAdolescentes);
}

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
    return {
        id: item.id,
        nombre: item.name,
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: item.type,
        calculationMethod: 'porPersona',
        precioPorPersona: item.precioVenta,
        precioVenta: item.precioVenta,
        precioBase: item.precioVenta,
        valorUnitarioEstimado: item.totalDishCost,
    };
};

type ServicioSeleccionadoValue = {
    cantidad: number;
    precioUnitario: number;
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
    subcategoria?: string;
    esRegalo: boolean;
    calculationMethod?: string;
};

const menuItemToServicioSeleccionado = (item: ServicioEmpresa, invitados: number): ServicioSeleccionadoValue => {
    return {
        cantidad: invitados,
        precioUnitario: item.precioPorPersona || 0,
        nombreServicio: item.nombre,
        unidad: 'personas',
        categoriaServicio: item.categoria,
        subcategoria: item.subcategoria,
        esRegalo: false,
        calculationMethod: 'porPersona',
    };
};

interface ServicioDetallado {
  id: string;
  nombre: string;
  esRegalo: boolean;
  costo: number;
  categoria: string;
}

export default function ArmadoRapidoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    const [allMenus, setAllMenus] = useState<FullMenu[]>([]);
    const [whatsappNumber, setWhatsappNumber] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteContacto, setClienteContacto] = useState('');
    const [adultos, setAdultos] = useState<number>(50);
    const [ninosYAdolescentes, setNinosYAdolescentes] = useState<number>(0);
    const [duracionHoras, setDuracionHoras] = useState<number>(5);
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
    const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
    const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
    const [selectedInfantil, setSelectedInfantil] = useState<string>('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    
    const [gastronomiaSearchTerm, setGastronomiaSearchTerm] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    const [generatedPresupuestoId, setGeneratedPresupuestoId] = useState<string | null>(null);

    const [formData, setFormData] = useState<{serviciosSeleccionados: Map<string, ServicioSeleccionadoValue>}>({serviciosSeleccionados: new Map()});
    
    const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
        if (!config || !allMenus.length) {
            return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
        }
        
        const isPlatoVisible = (platoId: string) => {
            const setting = config.platosVisibles?.find(p => p.id === platoId);
            return setting !== undefined ? setting.visible : true;
        };
        
        const sortByPrice = (a: { precioVenta: number }, b: { precioVenta: number }) => a.precioVenta - b.precioVenta;
    
        const allDishes = Array.from(
            allMenus.flatMap(m => m.items)
            .reduce((map, dish) => {
                if (!map.has(dish.id)) {
                    map.set(dish.id, dish);
                }
                return map;
            }, new Map<string, MenuItem>())
            .values()
        );
        
        const visibleDishes = allDishes.filter(d => isPlatoVisible(d.id));

        const lowerCaseSearch = gastronomiaSearchTerm.toLowerCase();
        const filteredDishes = gastronomiaSearchTerm.trim() === ''
            ? visibleDishes 
            : visibleDishes.filter(d => d.name.toLowerCase().includes(lowerCaseSearch));
        
        const enhancedDishes = filteredDishes.map(item => ({
            ...item,
            precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
        }));

        return { 
            entradasDisponibles: enhancedDishes.filter(item => item.type === 'Entrada').map(menuItemToServicioEmpresa).sort(sortByPrice), 
            principalesDisponibles: enhancedDishes.filter(item => item.type === 'Plato Principal').map(menuItemToServicioEmpresa).sort(sortByPrice), 
            menusNinoDisponibles: enhancedDishes.filter(item => item.type === 'Menú Infantil/Adolescente').map(menuItemToServicioEmpresa).sort(sortByPrice)
        };
    }, [config, allMenus, gastronomiaSearchTerm]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [armadoConfig, serviciosData, socialConnections, templateSettings, menuData] = await Promise.all([
                    getArmadoRapidoConfig(),
                    getServiciosEmpresa(),
                    getSocialConnections(),
                    getInvoiceTemplateSettings(),
                    getMenus(),
                ]);
                setConfig(armadoConfig);
                setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
                setAllMenus(menuData);
                const whatsappConnection = socialConnections.find(c => c.platform === 'WhatsApp' && c.isConnected);
                if (whatsappConnection?.phoneNumber) {
                    setWhatsappNumber(whatsappConnection.phoneNumber);
                }
                setLogoUrl(templateSettings.logoUrl || null);
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar las configuraciones.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [toast]);
    
    const handleEntradaChange = (servicioId: string, checked: boolean) => {
        const maxEntradas = duracionHoras > 4 ? 2 : 1;
        
        let newSelectedEntradas;
        if (checked) {
            if (selectedEntradas.length >= maxEntradas) {
                toast({ title: "Límite alcanzado", description: `Puedes seleccionar hasta ${maxEntradas} entrada(s).`, variant: "default" });
                return;
            }
            newSelectedEntradas = [...selectedEntradas, servicioId];
        } else {
            newSelectedEntradas = selectedEntradas.filter(id => id !== servicioId);
        }
        setSelectedEntradas(newSelectedEntradas);
        handleGastronomicSelectionChange('entradas', newSelectedEntradas);
    };

    const handleGastronomicSelectionChange = (type: 'entradas' | 'principal' | 'infantil', selectedIds: string | string[]) => {
      setFormData(prev => {
        const newSelected = new Map(prev.serviciosSeleccionados);
        const allDishes = [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles];
        
        if (type === 'entradas') {
            const currentEntradas = Array.from(newSelected.keys()).filter(id => entradasDisponibles.some(e => e.id === id));
            const removedEntradas = currentEntradas.filter(id => !selectedIds.includes(id));
            removedEntradas.forEach(id => newSelected.delete(id));
        } else if (type === 'principal') {
            principalesDisponibles.forEach(item => newSelected.delete(item.id));
        } else if (type === 'infantil') {
            menusNinoDisponibles.forEach(item => newSelected.delete(item.id));
        }
        
        const idsToAdd = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        idsToAdd.forEach(id => {
            const dishToAdd = allDishes.find(d => d.id === id);
            if (dishToAdd) {
                const invitados = getGuestCountForItem({ nombreServicio: dishToAdd.nombre, categoriaServicio: dishToAdd.categoria, subcategoria: dishToAdd.subcategoria }, adultos, 0, ninosYAdolescentes);
                newSelected.set(dishToAdd.id, menuItemToServicioSeleccionado(dishToAdd, invitados));
            }
        });
        return { ...prev, serviciosSeleccionados: newSelected };
      });
    };
    
    const allSimuladorServices = useMemo(() => {
        return [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles, ...serviciosCatalogo];
    }, [entradasDisponibles, principalesDisponibles, menusNinoDisponibles, serviciosCatalogo]);

    const { valorServiciosAntesDeDescuento, descuentoPromocional, costoTotalRegalos, totalAPagar, serviciosAgrupados, serviciosDetallados } = useMemo(() => {
        if (!config || !allSimuladorServices.length) {
            return { valorServiciosAntesDeDescuento: 0, descuentoPromocional: 0, costoTotalRegalos: 0, totalAPagar: 0, serviciosAgrupados: {}, serviciosDetallados: [] };
        }

        const allSelectedServicesMap = new Map<string, { servicio: ServicioEmpresa, esRegalo: boolean }>();
        const paqueteSeleccionado = config.paquetes.find(p => p.id === selectedPaqueteId);
        if (paqueteSeleccionado) {
            paqueteSeleccionado.serviciosIncluidos.forEach(s => {
                const serv = allSimuladorServices.find(cat => cat.id === s.id);
                if (serv) allSelectedServicesMap.set(serv.id, { servicio: serv, esRegalo: s.esRegalo || false });
            });
        }
        formData.serviciosSeleccionados.forEach((data, id) => {
            const serv = allSimuladorServices.find(cat => cat.id === id);
            if (serv) allSelectedServicesMap.set(serv.id, { servicio: serv, esRegalo: data.esRegalo });
        });
        if (config.serviceDependencies) {
            config.serviceDependencies.forEach(dep => {
                if (allSelectedServicesMap.has(dep.triggerServiceId) && !allSelectedServicesMap.has(dep.requiredServiceId)) {
                    const serv = allSimuladorServices.find(s => s.id === dep.requiredServiceId);
                    if (serv) allSelectedServicesMap.set(serv.id, { servicio: serv, esRegalo: false });
                }
            });
        }

        let totalReal = 0;
        let costoRegalosCalc = 0;
        const includedServicesList: ServicioDetallado[] = [];
        
        allSelectedServicesMap.forEach(({ servicio, esRegalo }) => {
            const costoRealItem = calcularCostoServicio(servicio, adultos, ninosYAdolescentes);
            if (!esRegalo) {
                totalReal += costoRealItem;
            } else {
                costoRegalosCalc += costoRealItem;
            }
            includedServicesList.push({ id: servicio.id, nombre: servicio.nombre, esRegalo, costo: costoRealItem, categoria: servicio.categoria || 'Varios' });
        });
        
        const descuentoPorcentaje = (config.descuentoGeneral || 0) / 100;
        let valorServiciosCalc = totalReal;
        if (descuentoPorcentaje > 0 && descuentoPorcentaje < 1) {
            valorServiciosCalc = totalReal / (1 - descuentoPorcentaje);
        }
        const descuentoCalculado = valorServiciosCalc - totalReal;

        const agrupados = includedServicesList.reduce((acc, item) => {
            const categoria = item.esRegalo ? 'Regalos Incluidos' : (item.categoria || 'Varios');
            if (!acc[categoria]) acc[categoria] = [];
            acc[categoria].push(item);
            return acc;
        }, {} as Record<string, ServicioDetallado[]>);

        return { 
            valorServiciosAntesDeDescuento: Math.round(valorServiciosCalc),
            descuentoPromocional: Math.round(descuentoCalculado),
            costoTotalRegalos: Math.round(costoRegalosCalc),
            totalAPagar: Math.round(totalReal),
            serviciosAgrupados: agrupados,
            serviciosDetallados: includedServicesList
        };
    }, [config, allSimuladorServices, adultos, ninosYAdolescentes, selectedPaqueteId, formData.serviciosSeleccionados]);
    
    const nextStep = async () => {
        if (step === 1 && (!clienteNombre.trim() || !/^\d{9}$/.test(clienteContacto.trim()) || adultos <= 0)) {
            toast({ title: "Datos incompletos", description: "Ingresa nombre, celular de 9 dígitos y adultos.", variant: "destructive" });
            return;
        }
        const maxEntradas = duracionHoras > 4 ? 2 : 1;
        if (step === 2 && (!selectedPrincipal || selectedEntradas.length !== maxEntradas)) {
            toast({ title: "Selección incompleta", description: `Elige plato principal y exactamente ${maxEntradas} entrada(s).`, variant: "destructive" });
            return;
        }
        if (step === 3 && !selectedPaqueteId) {
            toast({ title: "Paquete requerido", description: "Elige un paquete de servicios.", variant: "destructive" });
            return;
        }

        if (step === 3) {
            setIsGeneratingLead(true);
            const data = {
                clienteNombre,
                clienteContacto,
                eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
                adultos,
                ninos: ninosYAdolescentes,
                subtotal: valorServiciosAntesDeDescuento,
                costoEstimado: totalAPagar,
                descuentoGeneral: config?.descuentoGeneral,
                serviciosIncluidos: serviciosDetallados.map(s => s.id),
                paqueteNombre: config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre,
                items: serviciosDetallados.map(s => {
                    const original = allSimuladorServices.find(os => os.id === s.id);
                    return {
                        idServicioCatalogo: s.id,
                        nombreServicio: s.nombre,
                        cantidad: 1,
                        unidad: original?.unidad,
                        precioUnitario: s.costo,
                        precioUnitarioPresupuesto: s.costo,
                        esRegalo: s.esRegalo,
                        categoriaServicio: s.categoria,
                        subcategoria: original?.subcategoria,
                        calculationMethod: original?.calculationMethod,
                        precioBase: original?.precioBase,
                        precioPorPersona: original?.precioPorPersona,
                        invitadosPorUnidad: original?.invitadosPorUnidad,
                        tramosDePrecio: original?.tramosDePrecio,
                    };
                }) as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[]
            };
            try {
                const result = await generateBudgetAndLeadFromSimulator(data);
                if (result.success && result.presupuestoId) {
                    setGeneratedPresupuestoId(result.presupuestoId);
                    setStep(4);
                } else throw new Error(result.error || "Error al generar.");
            } catch (e: any) {
                toast({ title: "Error", description: e.message, variant: "destructive" });
            } finally {
                setIsGeneratingLead(false);
            }
        } else setStep(s => s + 1);
    };

    const prevStep = () => { if (step > 1) setStep(s => s - 1); };

    const handleShareWhatsApp = () => {
        if (!whatsappNumber) return;
        let texto = `*Resumen de Presupuesto Simulado*\n`;
        texto += `-----------------\n*Cliente:* ${clienteNombre}\n*Invitados:* ${adultos + ninosYAdolescentes}\n-----------------\n`;
        texto += `*TOTAL A PAGAR:* *${formatCurrency(totalAPagar)}*\n`;
        texto += `Ver detalle en: ${window.location.origin}/presupuestos/${generatedPresupuestoId}/ver`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(texto)}`, '_blank');
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    
    if (step === 4 && generatedPresupuestoId) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 print:bg-white print:p-0">
                <Card className="w-full max-w-3xl shadow-xl print:shadow-none border-none">
                    <CardHeader className="text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <CardTitle className="font-headline text-3xl">¡Presupuesto Generado!</CardTitle>
                        <CardDescription className="text-lg">Gracias por tu interés. Un asesor te contactará pronto.</CardDescription>
                    </CardHeader>
                    <CardContent className="print:p-2">
                         <div className="space-y-4">
                            <h3 className="font-headline text-2xl text-center">Resumen de Selección</h3>
                            <Table>
                                <TableHeader><TableRow><TableHead>Artículo</TableHead><TableHead className="text-right">Importe</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {Object.entries(serviciosAgrupados).map(([categoria, items]) => (
                                        <React.Fragment key={categoria}>
                                            <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-bold text-primary">{categoria}</TableCell></TableRow>
                                            {items.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.nombre}</TableCell>
                                                    <TableCell className="text-right">{item.esRegalo ? 'REGALO' : formatCurrency(item.costo)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                            <Separator />
                            <div className="w-full max-w-xs ml-auto space-y-1 text-sm font-medium">
                                <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(valorServiciosAntesDeDescuento)}</span></div>
                                {descuentoPromocional > 0 && <div className="flex justify-between text-destructive"><span>Bonificación:</span><span>-{formatCurrency(descuentoPromocional)}</span></div>}
                                <div className="flex justify-between text-lg font-black pt-2 border-t text-primary"><span>TOTAL:</span><span>{formatCurrency(totalAPagar)}</span></div>
                            </div>
                         </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-2 pt-6 print:hidden">
                        <Button onClick={handleShareWhatsApp} variant="secondary" className="w-full bg-green-500 hover:bg-green-600 text-white"><Share2 className="w-4 h-4 mr-2"/>WhatsApp</Button>
                        <Button onClick={() => window.print()} className="w-full"><Printer className="w-4 h-4 mr-2"/>Imprimir</Button>
                        <Button onClick={() => setStep(1)} variant="outline" className="w-full">Volver al inicio</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const maxEntradas = duracionHoras > 4 ? 2 : 1;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl shadow-2xl rounded-[2.5rem] overflow-hidden border-none">
                <CardHeader className="text-center bg-primary/5 p-8 border-b border-primary/10">
                    <Wand2 className="w-12 h-12 mx-auto text-primary mb-4"/>
                    <CardTitle className="font-headline text-4xl font-black uppercase tracking-tighter">Simulador de Evento</CardTitle>
                    <CardDescription className="text-lg">Paso {step} de 3: {['Tus Datos', 'Menú', 'Paquete'][step-1]}</CardDescription>
                    <Progress value={(step / 3) * 100} className="w-full h-2 mt-6" />
                </CardHeader>
                <CardContent className="p-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label>Nombre Completo</Label><Input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ej: Ana García" className="h-12 rounded-xl"/></div>
                                <div className="space-y-2"><Label>Celular (9 dígitos)</Label><Input type="tel" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="098355530" className="h-12 rounded-xl"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label>Cantidad de Adultos</Label><Input type="number" value={adultos} onChange={e => setAdultos(Number(e.target.value))} className="h-12 rounded-xl font-bold"/></div>
                                <div className="space-y-2"><Label>Niños y Adolescentes</Label><Input type="number" value={ninosYAdolescentes} onChange={e => setNinosYAdolescentes(Number(e.target.value))} className="h-12 rounded-xl font-bold"/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2"><Label>Duración (Horas)</Label><Input type="number" value={duracionHoras} onChange={e => setDuracionHoras(Number(e.target.value))} className="h-12 rounded-xl font-bold"/></div>
                                <div className="space-y-2"><Label>Fecha Tentativa</Label><DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} /></div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><Input placeholder="Buscar plato..." value={gastronomiaSearchTerm} onChange={e => setGastronomiaSearchTerm(e.target.value)} className="pl-10 h-12 rounded-xl border-slate-200"/></div>
                            <div className="space-y-4">
                                <Label className="text-sm font-black uppercase tracking-widest text-primary">Entradas ({selectedEntradas.length} de {maxEntradas})</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {entradasDisponibles.map(s => (
                                        <label key={s.id} className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3", selectedEntradas.includes(s.id) ? "border-primary bg-primary/5" : "border-slate-100 hover:border-primary/20")}>
                                            <Checkbox checked={selectedEntradas.includes(s.id)} onCheckedChange={v => handleEntradaChange(s.id, !!v)} />
                                            <span className="text-sm font-bold">{s.nombre}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-sm font-black uppercase tracking-widest text-primary">Plato Principal</Label>
                                <RadioGroup value={selectedPrincipal} onValueChange={v => { setSelectedPrincipal(v); handleGastronomicSelectionChange('principal', v); }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {principalesDisponibles.map(s => (
                                        <label key={s.id} className={cn("p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3", selectedPrincipal === s.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-primary/20")}>
                                            <RadioGroupItem value={s.id} />
                                            <span className="text-sm font-bold">{s.nombre}</span>
                                        </label>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h3 className="font-bold text-lg text-slate-800">Selecciona el paquete de servicios</h3>
                            <RadioGroup value={selectedPaqueteId} onValueChange={setSelectedPaqueteId} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {config?.paquetes.map(p => (
                                    <label key={p.id} className={cn("p-6 border-2 rounded-3xl cursor-pointer transition-all flex flex-col gap-4", selectedPaqueteId === p.id ? "border-primary bg-primary/5 shadow-lg" : "border-slate-100 hover:border-primary/20")}>
                                        <div className="flex items-start justify-between">
                                            <p className="font-black uppercase tracking-tight text-lg">{p.nombre}</p>
                                            <RadioGroupItem value={p.id} />
                                        </div>
                                        <ul className="text-xs space-y-1.5 text-slate-500 font-medium">
                                            {p.serviciosIncluidos.map(s => {
                                                const serv = allSimuladorServices.find(os => os.id === s.id);
                                                return serv && <li key={s.id} className={cn("flex items-center gap-2", s.esRegalo && "text-rose-600 font-bold")}><Check className="w-3 h-3"/> {serv.nombre} {s.esRegalo && "(REGALO)"}</li>
                                            })}
                                        </ul>
                                    </label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="p-8 border-t bg-slate-50 flex justify-between">
                    <Button variant="ghost" onClick={prevStep} disabled={step === 1} className="rounded-xl h-12 px-8 font-bold"><ArrowLeft className="mr-2 w-4 h-4"/>Anterior</Button>
                    <Button onClick={nextStep} disabled={isGeneratingLead} className="rounded-2xl h-14 px-12 font-black text-base shadow-xl shadow-primary/30">
                        {isGeneratingLead ? <Loader2 className="animate-spin mr-2"/> : null}
                        {step === 3 ? "GENERAR PRESUPUESTO" : "SIGUIENTE"}
                        {step < 3 && <ArrowRight className="ml-2 w-5 h-5"/>}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
