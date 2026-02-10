

'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, Package, ChefHat, FileText, Send, CheckCircle, Gift, User, Phone, MessageSquare, Share2, Printer } from 'lucide-react';
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
import type { FullMenu, MenuItem } from '@/types/catering'; // Import MenuItem
import { getMenus } from '@/app/actions/menus-catering'; // Import getMenus
import { DatePickerDemo } from '@/components/date-picker-demo';
import { getPresupuestoById } from '@/app/actions/presupuestos';

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatNumber = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


const formatDate = (date = new Date()) => {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// CONSTANTS FROM PDF
const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.";


// Helper function to decide which guest count to use for an item
function getGuestCountForItem(servicio: { categoriaServicio?: string; subcategoria?: string }, adultos: number, ninosYAdolescentes: number): number {
  const categoria = (servicio.categoriaServicio || '').toLowerCase();
  const subcategoria = (servicio.subcategoria || '').toLowerCase();
  
  if (categoria.includes('infantil') || categoria.includes('adolescente') || subcategoria.includes('infantil') || subcategoria.includes('adolescente')) {
    return ninosYAdolescentes;
  }
  
  if (categoria.includes('plato principal') || subcategoria.includes('plato principal')) {
    return adultos;
  }
  
  return adultos + ninosYAdolescentes;
};

function calcularCostoServicio(servicio: ServicioEmpresa, adultos: number, ninosYAdolescentes: number): number {
  if (!servicio) return 0;
  
  const cantidadInvitados = getGuestCountForItem(servicio, adultos, ninosYAdolescentes);
  const totalInvitados = adultos + ninosYAdolescentes;
  
  if (cantidadInvitados === 0 && (servicio.calculationMethod === 'porPersona' || servicio.calculationMethod === 'ratio')) {
    return 0;
  }
  
  let itemTotal = 0;

  switch (servicio.calculationMethod) {
    case 'fijo': 
      itemTotal = servicio.precioVenta ?? servicio.precioBase ?? 0; 
      break;
    case 'porPersona': 
      itemTotal = (servicio.precioPorPersona ?? 0) * cantidadInvitados; 
      break;
    case 'ratio':
      const invitadosPorUnidadNum = Number(servicio.invitadosPorUnidad);
      if (invitadosPorUnidadNum > 0) {
        itemTotal = Math.ceil(cantidadInvitados / invitadosPorUnidadNum) * (servicio.precioBase ?? 0);
      } else {
        itemTotal = servicio.precioBase ?? 0; // Fallback
      }
      break;
    case 'tramos':
      const tramo = servicio.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
      itemTotal = tramo?.precio || 0;
      break;
    default: 
      itemTotal = servicio.precioVenta ?? 0;
  }
  return itemTotal;
}

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
    const precioVenta = item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100));
    return {
        id: item.id,
        nombre: item.name,
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: item.type,
        calculationMethod: 'porPersona',
        precioPorPersona: precioVenta,
        precioVenta: precioVenta,
        precioBase: precioVenta,
        valorUnitarioEstimado: item.totalDishCost,
    };
};

type ServicioSeleccionadoValue = {
    cantidad: number;
    precioUnitario: number;
    nombreServicio: string;
    unidad?: string;
    categoriaServicio?: string;
    esRegalo: boolean;
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
    
    // Form state
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
                return; // Do not update state
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
        
        // Define which items to clear based on the type of change
        let itemsToClear: ServicioEmpresa[] = [];
        if (type === 'entradas') {
            // For multi-select, we only remove items that are no longer in `selectedIds`
            const currentEntradas = Array.from(newSelected.keys()).filter(id => entradasDisponibles.some(e => e.id === id));
            const removedEntradas = currentEntradas.filter(id => !selectedIds.includes(id));
            removedEntradas.forEach(id => newSelected.delete(id));
        } else if (type === 'principal') {
            itemsToClear = principalesDisponibles || [];
            itemsToClear.forEach(item => newSelected.delete(item.id));
        } else if (type === 'infantil') {
            itemsToClear = menusNinoDisponibles || [];
            itemsToClear.forEach(item => newSelected.delete(item.id));
        }
        
        const idsToAdd = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
        
        idsToAdd.forEach(id => {
            const dishToAdd = allDishes.find(d => d.id === id);
            if (dishToAdd) {
                const invitados = getGuestCountForItem(dishToAdd, adultos, ninosYAdolescentes);
                newSelected.set(dishToAdd.id, menuItemToServicioSeleccionado(dishToAdd, invitados));
            }
        });
        
        return { ...prev, serviciosSeleccionados: newSelected };
      });
    };
    
    const allSimuladorServices = useMemo(() => {
        return [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles, ...serviciosCatalogo];
    }, [entradasDisponibles, principalesDisponibles, menusNinoDisponibles, serviciosCatalogo]);

    const { subtotal, serviciosDetallados, serviciosAgrupados, totalRegalos, costoTotal, descuento } = useMemo(() => {
        if (!config || !allSimuladorServices.length) {
            return { subtotal: 0, serviciosDetallados: [], serviciosAgrupados: {}, totalRegalos: 0, costoTotal: 0, descuento: 0 };
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

        let subtotalBrutoReal = 0;
        let costoTotalRegalosReal = 0;
        const includedServicesList: ServicioDetallado[] = [];
        
        allSelectedServicesMap.forEach(({ servicio, esRegalo }) => {
            const costoRealItem = calcularCostoServicio(servicio, adultos, ninosYAdolescentes);
            if (!esRegalo) {
                subtotalBrutoReal += costoRealItem;
            } else {
                costoTotalRegalosReal += costoRealItem;
            }
            includedServicesList.push({ id: servicio.id, nombre: servicio.nombre, esRegalo, costo: costoRealItem, categoria: servicio.categoria || 'Varios' });
        });
        
        const descuentoPorcentajeFicticio = config.descuentoGeneral || 0;
        const totalFinalAPagar = subtotalBrutoReal;
        
        const subtotalInflado = (descuentoPorcentajeFicticio > 0 && descuentoPorcentajeFicticio < 100) 
            ? subtotalBrutoReal / (1 - (descuentoPorcentajeFicticio / 100))
            : subtotalBrutoReal;
        
        const descuentoPromocional = subtotalInflado - subtotalBrutoReal;
        const valorTotalServiciosMostrado = subtotalInflado + costoTotalRegalosReal;
        const ahorroTotalMostrado = descuentoPromocional + costoTotalRegalosReal;

        const agrupados = includedServicesList.reduce((acc, item) => {
            const categoria = item.esRegalo ? 'Regalos Incluidos' : (item.categoria || 'Varios');
            if (!acc[categoria]) acc[categoria] = [];
            acc[categoria].push(item);
            return acc;
        }, {} as Record<string, ServicioDetallado[]>);

        return { 
            subtotal: valorTotalServiciosMostrado,
            serviciosDetallados: includedServicesList,
            serviciosAgrupados: agrupados, 
            totalRegalos: costoTotalRegalosReal,
            descuento: ahorroTotalMostrado, 
            costoTotal: totalFinalAPagar,
        };
    }, [config, allSimuladorServices, adultos, ninosYAdolescentes, selectedPaqueteId, formData.serviciosSeleccionados]);
    
    const generarTextoWhatsApp = useCallback(() => {
        let texto = `*Resumen de Presupuesto Simulado*\n`;
        texto += `-----------------\n`;
        texto += `*Cliente:* ${clienteNombre}\n`;
        texto += `*Invitados:* ${adultos + ninosYAdolescentes} (Adultos: ${adultos}, Niños/Adolescentes: ${ninosYAdolescentes})\n`;
        if(eventoFecha) texto += `*Fecha:* ${formatDate(eventoFecha)}\n`;
        texto += `-----------------\n`;
        
        texto += `*Servicios Seleccionados:*\n`;

        Object.entries(serviciosAgrupados).sort(([catA], [catB]) => catA === 'Regalos Incluidos' ? 1 : catB === 'Regalos Incluidos' ? -1 : catA.localeCompare(catB)).forEach(([categoria, items]) => {
          if (items.length === 0) return;
          texto += `\n*${categoria}*\n`;
          items.forEach(item => {
            texto += `- ${item.nombre}`;
            if (item.esRegalo) {
              texto += ` (REGALO - valor ${formatCurrency(item.costo)})\n`;
            } else {
              texto += ` = ${formatCurrency(item.costo)}\n`;
            }
          });
        });

        texto += `-----------------\n`;
        texto += `*Valor de servicios:* ${formatCurrency(subtotal)}\n`;
        if (descuento > 0) {
            texto += `*Ahorro Total (Descuento + Regalos):* -${formatCurrency(descuento)}\n`;
        }
        texto += `*TOTAL A PAGAR:* *${formatCurrency(costoTotal)}*\n`;
        texto += `-----------------\n`;
        texto += `Este presupuesto es una estimación y no incluye todos los posibles adicionales. Válido por 30 días.\n\n`;
        texto += `¡Gracias por tu interés! Un asesor se comunicará contigo a la brevedad.`;
        
        return texto;
    }, [clienteNombre, adultos, ninosYAdolescentes, eventoFecha, serviciosAgrupados, subtotal, descuento, costoTotal]);


    const handleShareWhatsApp = () => {
        if (!whatsappNumber) {
            toast({title: "Número no configurado", description: "El número de WhatsApp no ha sido configurado en los ajustes.", variant: "destructive"});
            return;
        }
        const message = generarTextoWhatsApp();
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleDownloadPdf = () => {
        window.print();
    };

    const nextStep = async () => {
        if (step === 1 && (!clienteNombre.trim() || !/^\d{9}$/.test(clienteContacto.trim()) || adultos <= 0)) {
            toast({ title: "Datos incompletos", description: "Por favor, ingresa un nombre, un celular válido de 9 dígitos y la cantidad de adultos.", variant: "destructive" });
            return;
        }
        const requiredEntradas = duracionHoras > 4 ? 2 : 1;
        if (step === 2 && (!selectedPrincipal || selectedEntradas.length !== requiredEntradas)) {
            toast({ title: "Selección de Menú Incompleta", description: `Debes elegir un plato principal y exactamente ${requiredEntradas} entrada(s).`, variant: "destructive" });
            return;
        }
        if (step === 3 && !selectedPaqueteId) {
            toast({ title: "Paquete Requerido", description: "Por favor, elige un paquete de servicios para continuar.", variant: "destructive" });
            return;
        }

        if (step === 3) {
            if (!clienteNombre.trim() || !clienteContacto.trim()) {
                toast({ title: "Datos de contacto requeridos para continuar", variant: "destructive" });
                return;
            }
            setIsGeneratingLead(true);
            
            const data = {
                clienteNombre,
                clienteContacto,
                eventoFecha: eventoFecha ? eventoFecha.toISOString() : undefined,
                adultos,
                ninos: ninosYAdolescentes,
                adolescentes: 0,
                subtotal: subtotal,
                costoEstimado: costoTotal,
                descuentoGeneral: config?.descuentoGeneral,
                serviciosIncluidos: serviciosDetallados.map(s => s.id),
                paqueteNombre: config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre,
                items: serviciosDetallados.map(s => {
                    const originalServicio = allSimuladorServices.find(os => os.id === s.id);
                    return {
                        idServicioCatalogo: s.id,
                        nombreServicio: s.nombre,
                        cantidad: 1, // Simplified for now
                        unidad: originalServicio?.unidad,
                        precioUnitario: s.costo,
                        precioUnitarioPresupuesto: s.costo,
                        esRegalo: s.esRegalo,
                        categoriaServicio: s.categoria,
                        subcategoria: originalServicio?.subcategoria,
                        calculationMethod: originalServicio?.calculationMethod,
                        precioBase: originalServicio?.precioBase,
                        precioPorPersona: originalServicio?.precioPorPersona,
                        invitadosPorUnidad: originalServicio?.invitadosPorUnidad,
                        tramosDePrecio: originalServicio?.tramosDePrecio,
                    };
                }) as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[]
            };
            
            try {
                const result = await generateBudgetAndLeadFromSimulator(data);
                if (result.success && result.presupuestoId) {
                    setGeneratedPresupuestoId(result.presupuestoId);
                    toast({ title: "¡Solicitud Enviada!", description: "Gracias por tu interés. Se generó un resumen de tu selección.", variant: 'default' });
                    setStep(s => s + 1);
                } else {
                    throw new Error(result.error || "No se recibió un ID para el presupuesto generado.");
                }
            } catch (e: any) {
                toast({ title: "Error al registrar", description: e.message, variant: "destructive" });
            } finally {
                setIsGeneratingLead(false);
            }
        } else {
            setStep(s => s + 1);
        }
    };


    const prevStep = () => setStep(s => s > 1 ? s - 1 : s);
    
    const maxEntradas = duracionHoras > 4 ? 2 : 1;
    const entradasFaltantes = maxEntradas - selectedEntradas.length;

    const isStepTwoInvalid = useMemo(() => {
        const requiredEntradas = duracionHoras > 4 ? 2 : 1;
        return !selectedPrincipal || selectedEntradas.length !== requiredEntradas;
    }, [duracionHoras, selectedPrincipal, selectedEntradas]);

    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(today.getDate() + 30);
    
    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    }
    
    if (step === 4 && generatedPresupuestoId) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 print:bg-white print:p-0 print:items-start">
                <style jsx global>{`
                    @media print {
                        body { background-color: white !important; }
                        .print-hidden { display: none !important; }
                        .print-visible { display: block !important; }
                        .print-p-0 { padding: 0 !important; }
                        .print-shadow-none { box-shadow: none !important; }
                        .print-border-none { border: none !important; }
                    }
                `}</style>
                <Card className="w-full max-w-3xl shadow-xl print:shadow-none print:border-none">
                    <CardHeader className="text-center">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                        <CardTitle className="font-headline text-3xl">¡Resumen Generado!</CardTitle>
                        <CardDescription className="text-lg print:hidden">Gracias por tu interés. Un asesor se comunicará contigo a la brevedad.</CardDescription>
                    </CardHeader>
                    <CardContent className="print:p-2" id="budget-summary-printable">
                         <header className="mb-6 print:mb-4 hidden print:block">
                            <div className="flex justify-between items-start">
                                <h1 className="text-xl font-bold text-left mb-4 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h1>
                                {logoUrl && (
                                    <div className="w-24 h-20 print:w-20 print:h-16 flex-shrink-0">
                                        <Image src={logoUrl} alt={`${COMPANY_NAME_BRAND} Logo`} width={100} height={80} className="object-contain" data-ai-hint="company logo"/>
                                    </div>
                                )}
                            </div>
                            <div className="text-xs print:text-[8pt] gap-2 text-left">
                                <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
                                <p>{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
                                <p>{COMPANY_CONTACT_EMAIL_PDF} | {COMPANY_WEBSITE_PDF}</p>
                            </div>
                            <Separator className="my-3"/>
                            <section className="text-sm print:text-[9pt] text-left">
                            <p><span className="font-semibold">Cliente:</span> {clienteNombre}</p>
                            </section>
                        </header>
                         <h3 className="font-headline text-2xl text-center mb-4 print:hidden">Resumen de tu Presupuesto</h3>
                         <Table>
                             <TableHeader>
                                 <TableRow>
                                     <TableHead>Artículo</TableHead>
                                     <TableHead className="text-right font-semibold">Importe</TableHead>
                                 </TableRow>
                             </TableHeader>
                             <TableBody>
                                {Object.entries(serviciosAgrupados).sort(([catA], [catB]) => catA === 'Regalos Incluidos' ? 1 : catB === 'Regalos Incluidos' ? -1 : catA.localeCompare(catB)).map(([categoria, items]) => (
                                    <React.Fragment key={categoria}>
                                        <TableRow className="bg-muted/30 print:bg-gray-50">
                                            <TableCell colSpan={2} className={`font-bold ${categoria === 'Regalos Incluidos' ? 'text-destructive' : 'text-primary'}`}>
                                                {categoria === 'Regalos Incluidos' ? <div className='flex items-center gap-2'><Gift className="inline-block w-4 h-4"/>{categoria}</div> : categoria}
                                            </TableCell>
                                        </TableRow>
                                        {items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.nombre}</TableCell>
                                                <TableCell className={`text-right font-semibold ${item.esRegalo ? 'text-muted-foreground line-through' : ''}`}>{formatCurrency(item.costo)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))}
                             </TableBody>
                         </Table>
                         <Separator className="my-4"/>
                         <div className="w-full md:max-w-xs ml-auto space-y-1 text-sm">
                           <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor de servicios:</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            {descuento > 0 && (
                              <div className="flex justify-between text-destructive">
                                  <span>Descuento Promocional + Regalos:</span>
                                  <span className="font-medium">-{formatCurrency(descuento)}</span>
                              </div>
                            )}
                            <Separator className="my-2"/>
                            <div className="flex justify-between font-bold text-lg pt-1">
                                <span className="text-primary">TOTAL A PAGAR:</span>
                                <span className="text-primary">{formatCurrency(costoTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-2 pt-6 print:hidden">
                        <Button type="button" onClick={handleShareWhatsApp} variant="secondary" className="w-full bg-green-500 hover:bg-green-600">
                            <Share2 className="w-4 h-4 mr-2"/>Contactar por WhatsApp
                        </Button>
                        <Button type="button" onClick={handleDownloadPdf} className="w-full">
                            <Printer className="w-4 h-4 mr-2"/>Guardar o Imprimir PDF
                        </Button>
                        <Button type="button" onClick={() => setStep(1)} variant="outline" className="w-full">
                            <Edit className="w-4 h-4 mr-2"/>Editar Selección
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-3xl shadow-xl print:hidden">
            <CardHeader className="text-center">
                <Wand2 className="w-12 h-12 mx-auto text-primary mb-2"/>
                <CardTitle className="font-headline text-3xl">Simulador de Presupuesto</CardTitle>
                {step < 4 ? (
                    <>
                        <CardDescription className="text-lg">Paso {step} de 3: {['Tus Datos', 'Menú Gastronómico', 'Paquete de Servicios'][step-1]}</CardDescription>
                        <Progress value={(step / 3) * 100} className="w-full h-2 mt-4" />
                    </>
                ) : null}
            </CardHeader>
            <CardContent className="min-h-[350px] py-6 px-4 sm:px-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in-20">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><User className="text-primary w-5 h-5"/>Define tu evento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="cliente-nombre">Tu Nombre Completo *</Label><Input id="cliente-nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ingresa tu nombre" required/></div>
                            <div className="space-y-2">
                                <Label htmlFor="cliente-contacto">Tu Celular *</Label>
                                <Input id="cliente-contacto" type="tel" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="Ej: 098355530" required/>
                                <p className="text-xs text-muted-foreground">Debe tener 9 dígitos. Sin espacios ni guiones.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="num-adultos">Cantidad de Adultos *</Label><Input id="num-adultos" type="number" value={adultos} onChange={e => setAdultos(Number(e.target.value) || 0)} min="1" required/></div>
                            <div className="space-y-2"><Label htmlFor="num-ninos">Nº Niños y Adolescentes</Label><Input id="num-ninos" type="number" value={ninosYAdolescentes} onChange={e => setNinosYAdolescentes(Number(e.target.value) || 0)} min="0"/></div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="duracion-horas">Duración (hs)</Label><Input id="duracion-horas" type="number" value={duracionHoras} onChange={(e) => setDuracionHoras(Number(e.target.value) || 1)} min="1"/></div>
                            <div className="space-y-2"><Label htmlFor="evento-fecha">Fecha Estimada del Evento</Label><DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} /></div>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in-20">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><ChefHat className="text-primary w-5 h-5"/>Elige tu menú gastronómico</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar plato..."
                                value={gastronomiaSearchTerm}
                                onChange={e => setGastronomiaSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="space-y-4">
                            <Label>Debes elegir {maxEntradas} entrada{maxEntradas > 1 ? 's' : ''} ({duracionHoras > 4 ? 'Fiesta larga' : 'Fiesta corta'})</Label>
                            {entradasFaltantes > 0 && <p className="text-sm text-amber-600">Te falta seleccionar {entradasFaltantes} entrada{entradasFaltantes > 1 ? 's' : ''}.</p>}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {entradasDisponibles.length > 0 ? (
                                entradasDisponibles.map(s => (<div key={s.id} className="flex items-center space-x-2 p-2 border rounded-md"><Checkbox id={`e-${s.id}`} checked={selectedEntradas.includes(s.id)} onCheckedChange={(checked) => handleEntradaChange(s.id, !!checked)}/><Label htmlFor={`e-${s.id}`} className="text-xs font-normal">{s.nombre} ({formatCurrency(s.precioPorPersona)})</Label></div>))
                              ) : (
                                <p className="col-span-full text-center text-sm text-muted-foreground py-4">No se encontraron entradas.</p>
                              )}
                            </div>
                        </div>
                        <div className="space-y-4"><Label>Plato Principal (elige 1)</Label>
                            <RadioGroup value={selectedPrincipal} onValueChange={(value) => { setSelectedPrincipal(value); handleGastronomicSelectionChange('principal', value); }} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {principalesDisponibles.length > 0 ? (
                                principalesDisponibles.map(s => <div key={s.id} className="flex items-center space-x-2 p-2 border rounded-md"><RadioGroupItem value={s.id} id={`p-${s.id}`}/><Label htmlFor={`p-${s.id}`} className="text-sm font-normal">{s.nombre} ({formatCurrency(s.precioPorPersona)})</Label></div>)
                              ) : (
                                <p className="md:col-span-2 text-center text-sm text-muted-foreground py-4">No se encontraron platos principales.</p>
                              )}
                            </RadioGroup>
                        </div>
                        <div className="space-y-4">
                            <Label>Menú Niños/Adolescentes (elige 1)</Label>
                             <RadioGroup value={selectedInfantil} onValueChange={(value) => { setSelectedInfantil(value); handleGastronomicSelectionChange('infantil', value); }} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {(ninosYAdolescentes > 0) ? (
                                    menusNinoDisponibles.length > 0 ? (
                                        menusNinoDisponibles.map(s => (
                                            <div key={s.id} className="flex items-center space-x-2 p-2 border rounded-md">
                                                <RadioGroupItem value={s.id} id={`nino-${s.id}`} />
                                                <Label htmlFor={`nino-${s.id}`} className="text-sm font-normal">{s.nombre} ({formatCurrency(s.precioPorPersona)})</Label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="md:col-span-2 text-center text-sm text-muted-foreground py-4">No se encontraron menús infantiles/adolescentes.</p>
                                    )
                                ) : (
                                    <p className="md:col-span-2 text-center text-sm text-muted-foreground py-4">Añade niños/adolescentes en el Paso 1 para ver las opciones.</p>
                                )}
                            </RadioGroup>
                        </div>
                    </div>
                )}
                 {step === 3 && (
                    <div className="space-y-6 animate-in fade-in-20">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="text-primary w-5 h-5"/>Elige tu Paquete de Servicios</h3>
                        <RadioGroup value={selectedPaqueteId} onValueChange={setSelectedPaqueteId} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {config?.paquetes.map(p => {
                                const servicios = p.serviciosIncluidos.filter(s => !s.esRegalo);
                                const regalos = p.serviciosIncluidos.filter(s => s.esRegalo);
                                return (
                                <Label key={p.id} htmlFor={`pkg-${p.id}`} className="p-4 border rounded-lg cursor-pointer hover:border-primary has-[:checked]:border-primary/50 has-[:checked]:ring-2 has-[:checked]:ring-primary flex flex-col">
                                    <div className="flex items-start gap-4">
                                        <RadioGroupItem value={p.id} id={`pkg-${p.id}`} className="mt-1"/>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{p.nombre}</p>
                                            <ul className="text-xs text-muted-foreground list-disc pl-4 mt-2 space-y-1">
                                                {servicios.map(s => { const serv = serviciosCatalogo.find(sc => sc.id === s.id); return serv && <li key={s.id}>{serv.nombre}</li> })}
                                            </ul>
                                            {regalos.length > 0 && (
                                                <>
                                                    <Separator className="my-2"/>
                                                    <ul className="text-xs list-disc pl-4 space-y-1">
                                                    {regalos.map(s => { const serv = serviciosCatalogo.find(sc => sc.id === s.id); return serv && <li key={s.id} className="font-medium flex items-center gap-1.5 text-red-600"><Gift className="w-3.5 h-3.5"/>{serv.nombre} (REGALO)</li> })}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Label>
                            )})}
                        </RadioGroup>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4 print:hidden">
                <Button variant="outline" onClick={prevStep} disabled={step === 1 || isGeneratingLead}>
                    <ArrowLeft className="w-4 h-4 mr-2"/>Anterior
                </Button>
                {step < 4 ? (
                    <Button onClick={nextStep} disabled={isGeneratingLead || (step === 2 && isStepTwoInvalid) || (step === 3 && !selectedPaqueteId) }>
                        {step === 3 ? (isGeneratingLead ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Generando...</> : "Ver Resumen y Enviar") : "Siguiente"}
                        {step < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                ) : null}
            </CardFooter>
        </Card>
    );
}
```
- src/types/invitado.ts:
```ts


export type RsvpStatus = 'Pendiente' | 'Confirmado' | 'Rechazado' | 'Tal vez';

export interface Invitado {
  id: string;
  nombre: string;
  contacto?: string; // Email o teléfono
  rsvp: RsvpStatus;
  partySize?: number; // Cuántas personas vienen con esta invitación (incluyendo el principal)
  tableNumber?: string; // Número de mesa asignado
  notes?: string; // Notas adicionales (alergias, comentarios)
  companionNames?: string[]; // Nombres de los acompañantes
}

// Para el formulario de añadir nuevo invitado, antes de tener ID
export type NuevoInvitadoData = Omit<Invitado, 'id'>;

```
- tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "src/types/invitado.ts"],
  "exclude": ["node_modules"]
}

```Entendido, quieres que el **descuento sea "ficticio"**, una estrategia de marketing para mostrar un precio de lista más alto y luego un descuento atractivo, donde el total a pagar sea el precio real de tu catálogo. Me aseguraré de que esta lógica funcione de manera consistente y correcta.

He realizado los siguientes ajustes para implementar esta estrategia de "precio ancla" en toda la aplicación:

1.  **Ajuste en la Configuración del Simulador:** Modifiqué la página de configuración del simulador (`src/app/settings/budget-display/page.tsx`) para que el campo de descuento sea claro sobre su propósito. Ahora se llama **"Porcentaje de Descuento Ficticio (Ancla)"** y explica cómo se usará para calcular el precio de lista "inflado".

2.  **Cálculo Transparente en el Simulador:** Actualicé la lógica en el simulador (`src/app/simulador-de-presupuesto/page.tsx`) para que:
    *   Calcule un "Valor de servicios" más alto basado en el precio real y el porcentaje de descuento ficticio.
    *   Muestre un "Descuento Promocional + Regalos" que refleje el ahorro total para el cliente.
    *   El **TOTAL A PAGAR** sea siempre el precio correcto y real de tus servicios.

Con estos cambios, la percepción de valor para tus clientes será más atractiva y consistente, tanto en el simulador como en los presupuestos finales, sin afectar tus ingresos reales.

<changes>
  <description>Se ajustó la lógica de precios en el simulador y su configuración para implementar una estrategia de "descuento ficticio" o "precio ancla". Esto muestra un precio de lista inflado y un descuento atractivo, mientras que el total a pagar refleja el costo real de los servicios, mejorando la percepción de valor para el cliente. También se corrigió un tipo de dato en 'invitado.ts' y se añadió al tsconfig.</description>
  <change>
    <file>src/app/settings/budget-display/page.tsx</file>
    <content><![CDATA[

'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, AlertTriangle, Percent, Info, Tag, Package, Bot, Sparkles, Code2, Wand2, PlusCircle, Trash2, ChevronDown, Edit, Gift, Search, ChefHat, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido, PlatoVisible, PromotionalDiscount, ServiceDependency } from '@/types/armado-rapido';
import { getArmadoRapidoConfig, saveArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa, saveServicioEmpresa as saveServicioEmpresaAction } from '@/app/actions/servicios-empresa';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { ServicioEmpresa, CategoriaServicio } from '@/types/empresa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { getMenus } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';
import { MultiSelect } from '@/components/ui/multi-select'; 
import { saveBudgetDisplaySettings, getBudgetDisplaySettings } from '@/app/actions/settings';
import type { BudgetDisplaySettings } from '@/types/settings';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

const getCalculationMethodLabel = (method?: string): string => {
    switch (method) {
        case 'fijo': return 'Precio Fijo';
        case 'porPersona': return 'Por Persona';
        case 'ratio': return 'Por Ratio de Invitados';
        case 'tramos': return 'Por Tramos de Invitados';
        default: return 'No definido';
    }
};

// Sub-component for editing a single service, to be used inside the Sheet
const EditServicioForm: React.FC<{ servicioId: string | null; onUpdate: () => void, onClose: () => void }> = ({ servicioId, onUpdate, onClose }) => {
    const { toast } = useToast();
    const [servicio, setServicio] = useState<Partial<ServicioEmpresa> | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (servicioId) {
            getServiciosEmpresa().then(servicios => {
                const s = servicios.find(s => s.id === servicioId);
                if (s) setServicio(s);
            });
        } else {
            setServicio(null);
        }
    }, [servicioId]);
    
    const handleSaveServicio = async (e: FormEvent) => {
        e.preventDefault();
        if (!servicio) return;
        setIsSaving(true);
        try {
            const result = await saveServicioEmpresaAction(servicio as ServicioEmpresa);
            if (result.success) {
                toast({ title: "Servicio actualizado" });
                onUpdate(); // This should trigger a refresh in the parent
                onClose();
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!servicio) return <div className="p-4"><Loader2 className="w-5 h-5 animate-spin"/></div>;

    return (
        <form onSubmit={handleSaveServicio} className="py-4 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-servicio-nombre">Nombre</Label>
              <Input id="edit-servicio-nombre" value={servicio.nombre || ''} onChange={e => setServicio(s => s ? {...s, nombre: e.target.value} : null)}/>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-servicio-precio">Precio de Venta (Fijo/Por Persona/Base)</Label>
              <Input id="edit-servicio-precio" type="number" value={servicio.precioVenta ?? servicio.precioPorPersona ?? servicio.precioBase ?? ''} onChange={e => {
                  const val = Number(e.target.value);
                  setServicio(s => s ? { ...s, precioVenta: val, precioPorPersona: val, precioBase: val } : null);
              }}/>
            </div>
             <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar Servicio'}</Button>
        </form>
    );
};

const menuItemToServicioEmpresa = (item: MenuItem & { precioVenta: number }): ServicioEmpresa => {
    const precioVenta = item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100));
    return {
        id: item.id,
        nombre: item.name,
        tipoItem: 'Servicio',
        categoria: 'Servicio de catering',
        subcategoria: item.type,
        calculationMethod: 'porPersona',
        precioPorPersona: precioVenta,
        precioVenta: precioVenta,
        precioBase: precioVenta,
        valorUnitarioEstimado: item.totalDishCost,
    };
};

const renderServiciosList = (servicios: ServicioIncluidoArmadoRapido[], catalogo: ServicioEmpresa[]) => {
    if (servicios.length === 0) {
      return <p className="text-xs text-muted-foreground italic">No hay servicios base en este paquete.</p>;
    }
    return (
      <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
        {servicios.map(servicio => {
          const fullServicio = catalogo.find(s => s.id === servicio.id);
          return <li key={servicio.id}>{fullServicio?.nombre || `ID: ${servicio.id} (no encontrado)`}</li>;
        })}
      </ul>
    );
};


export default function BudgetDisplaySettingsPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<BudgetDisplaySettings | null>(null);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'paquete' | 'menu'>('paquete');
  const [currentItem, setCurrentItem] = useState<Partial<PaqueteArmadoRapido | MenuArmadoRapido> | null>(null);
  
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false);
  const [editingServicioId, setEditingServicioId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [servicioSearchTerm, setServicioSearchTerm] = useState('');
  const [allMenus, setAllMenus] = useState<FullMenu[]>([]);

  const [newDependency, setNewDependency] = useState({ triggerServiceId: '', requiredServiceId: '' });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [armadoConfig, budgetSettingsData, serviciosData, menuData] = await Promise.all([
        getArmadoRapidoConfig(),
        getBudgetDisplaySettings(),
        getServiciosEmpresa(),
        getMenus()
      ]);
      setConfig(armadoConfig);
      setBudgetSettings(budgetSettingsData);
      setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
      setAllMenus(menuData);
    } catch(e: any) {
      setError("No se pudieron cargar los datos de configuración.");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
    const handleAddDependency = async () => {
    if (!newDependency.triggerServiceId || !newDependency.requiredServiceId || !config) return;
    
    const newDep: ServiceDependency = {
      id: `dep_${Date.now()}`,
      ...newDependency
    };
    
    const newConfig: ArmadoRapidoConfig = {
      ...config,
      serviceDependencies: [...(config.serviceDependencies || []), newDep]
    };
    
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: "Dependencia añadida" });
        setNewDependency({ triggerServiceId: '', requiredServiceId: '' });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDependency = async (dependencyId: string) => {
    if (!config) return;

    const newConfig: ArmadoRapidoConfig = {
      ...config,
      serviceDependencies: (config.serviceDependencies || []).filter(d => d.id !== dependencyId)
    };

    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: "Dependencia eliminada" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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
}, [config, allMenus]);
  

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleOpenModal = (type: 'paquete' | 'menu', item?: PaqueteArmadoRapido | MenuArmadoRapido) => {
    setModalType(type);
    setCurrentItem(item ? {...item, serviciosIncluidos: item.serviciosIncluidos || []} : { nombre: '', serviciosIncluidos: [] });
    setServicioSearchTerm(''); // Reset search on modal open
    setIsModalOpen(true);
  };
  
  const handleSaveItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentItem || !currentItem.nombre || !config) return;
    setIsSaving(true);
    
    let updatedList;
    const newItem = {
      ...currentItem,
      id: currentItem.id || `new_${modalType}_${Date.now()}`
    } as PaqueteArmadoRapido | MenuArmadoRapido;

    if (modalType === 'paquete') {
        updatedList = [...config.paquetes];
    } else {
        updatedList = [...config.menus];
    }

    const itemIndex = updatedList.findIndex(p => p.id === newItem.id);
    if(itemIndex > -1) {
        updatedList[itemIndex] = newItem;
    } else {
        updatedList.push(newItem);
    }
    
    const newConfig: ArmadoRapidoConfig = {
      ...config,
      [modalType === 'paquete' ? 'paquetes' : 'menus']: updatedList
    };

    try {
        const result = await saveArmadoRapidoConfig(newConfig);
        if (result.success) {
            toast({ title: `${modalType === 'paquete' ? 'Paquete' : 'Menú'} guardado` });
            setIsModalOpen(false);
            await loadData();
        } else {
            throw new Error(result.error);
        }
    } catch (err: any) {
      toast({ title: `Error al guardar ${modalType}`, description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteItem = async (type: 'paquete' | 'menu', itemId: string) => {
    if (!config) return;
    setIsSaving(true);
    let updatedList;
    if (type === 'paquete') {
      updatedList = config.paquetes.filter(p => p.id !== itemId);
    } else {
      updatedList = config.menus.filter(m => m.id !== itemId);
    }
    const newConfig = { ...config, [type === 'paquete' ? 'paquetes' : 'menus']: updatedList };
    try {
      const result = await saveArmadoRapidoConfig(newConfig);
      if (result.success) {
        toast({ title: `${type === 'paquete' ? 'Paquete' : 'Menú'} Eliminado`, variant: "destructive" });
        await loadData();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ title: `Error al eliminar ${type}`, description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleServicioChange = (servicioId: string, checked: boolean) => {
    setCurrentItem(prev => {
      if(!prev) return null;
      const servicios = prev.serviciosIncluidos || [];
      if(checked) {
        if(!servicios.some(s => s.id === servicioId)) {
          return { ...prev, serviciosIncluidos: [...servicios, { id: servicioId, esRegalo: false }] };
        }
      } else {
        return { ...prev, serviciosIncluidos: servicios.filter(s => s.id !== servicioId) };
      }
      return prev;
    });
  };

  const handleRegaloChange = (servicioId: string, esRegalo: boolean) => {
     setCurrentItem(prev => {
      if(!prev) return null;
      return { ...prev, serviciosIncluidos: (prev.serviciosIncluidos || []).map(s => s.id === servicioId ? {...s, esRegalo} : s) };
    });
  };

  const handlePlatoVisibilityChange = async (platoId: string, visible: boolean) => {
    if (!config) return;

    const newPlatosVisibles = [...(config.platosVisibles || [])];
    const existingIndex = newPlatosVisibles.findIndex(p => p.id === platoId);

    if (existingIndex > -1) {
        newPlatosVisibles[existingIndex] = { id: platoId, visible };
    } else {
        newPlatosVisibles.push({ id: platoId, visible });
    }

    const newConfig = { ...config, platosVisibles: newPlatosVisibles };
    
    // Optimistic UI update
    setConfig(newConfig);

    try {
        await saveArmadoRapidoConfig(newConfig);
    } catch (err: any) {
        toast({ title: "Error", description: "No se pudo guardar el cambio de visibilidad.", variant: "destructive" });
        loadData(); // Revert on error
    }
  };

  const isPlatoVisible = (platoId: string) => {
    const setting = config?.platosVisibles?.find(p => p.id === platoId);
    return setting ? setting.visible : true; // Default to visible if not set
  };

  const getVisibleDishes = (dishList: (ServicioEmpresa)[]) => {
    return dishList; // Show all dishes, visibility is handled by the switch
  };
  
  const serviciosFiltrados = useMemo(() => {
    if (!servicioSearchTerm) return serviciosCatalogo;
    const lowerCaseSearch = servicioSearchTerm.toLowerCase();
    return serviciosCatalogo.filter(s =>
      s.nombre.toLowerCase().includes(lowerCaseSearch) ||
      s.categoria?.toLowerCase().includes(lowerCaseSearch) ||
      s.subcategoria?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [servicioSearchTerm, serviciosCatalogo]);

  const serviciosAgrupadosParaPaquetes = useMemo(() => {
    return serviciosFiltrados.reduce((acc, servicio) => {
        const categoria = servicio.categoria || 'Otros';
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(servicio);
        return acc;
    }, {} as Record<string, ServicioEmpresa[]>);
  }, [serviciosFiltrados]);

  const categoriasOrdenadasParaPaquetes = useMemo(() => Object.keys(serviciosAgrupadosParaPaquetes).sort(), [serviciosAgrupadosParaPaquetes]);

  const handleConfigSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setIsSaving(true);
    try {
      const result = await saveArmadoRapidoConfig(config);
      if (result.success) {
        toast({ title: "Configuración guardada" });
        await loadData();
      } else throw new Error(result.error);
    } catch(err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleBudgetSettingsSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!budgetSettings) return;
    setIsSaving(true);
    try {
      const result = await saveBudgetDisplaySettings(budgetSettings);
      if (result.success) {
        toast({ title: "Configuración de Presupuestos guardada" });
        setBudgetSettings(result.settings || null);
      } else throw new Error(result.error);
    } catch(err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscountChange = (index: number, field: keyof PromotionalDiscount, value: any) => {
    if (!budgetSettings) return;
    const updatedDiscounts = [...(budgetSettings.promotionalDiscounts || [])];
    updatedDiscounts[index] = { ...updatedDiscounts[index], [field]: value };
    setBudgetSettings({ ...budgetSettings, promotionalDiscounts: updatedDiscounts });
  };
  
  const addDiscount = () => {
    if (!budgetSettings) return;
    const newDiscount: PromotionalDiscount = { id: `promo_${Date.now()}`, name: '', type: 'percentage', value: 0 };
    setBudgetSettings({ ...budgetSettings, promotionalDiscounts: [...(budgetSettings.promotionalDiscounts || []), newDiscount] });
  };
  
  const removeDiscount = (index: number) => {
    if (!budgetSettings) return;
    const updatedDiscounts = (budgetSettings.promotionalDiscounts || []).filter((_, i) => i !== index);
    setBudgetSettings({ ...budgetSettings, promotionalDiscounts: updatedDiscounts });
  };

  if (isLoading || !config || !budgetSettings) {
    return <div className="flex items-center justify-center min-h-[300px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="ml-3 text-lg">Cargando...</p></div>;
  }
  if (error) {
    return <div className="text-center text-destructive py-10"><AlertTriangle className="w-12 h-12 mx-auto mb-3" /><p className="font-semibold text-lg">{error}</p><Button onClick={loadData} className="mt-4" variant="outline">Reintentar</Button></div>;
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
           <DialogHeader>
                <DialogTitle className="font-headline">{currentItem?.id ? 'Editar' : 'Nuevo'} {modalType === 'paquete' ? 'Paquete' : 'Menú'}</DialogTitle>
                <DialogDescription>
                    {modalType === 'paquete' ? 'Define el nombre y los servicios que se incluirán en este paquete.' : 'Define un nombre y selecciona los platos que conformarán este menú para el simulador.'}
                </DialogDescription>
            </DialogHeader>
                <Sheet open={!!editingServicioId} onOpenChange={(open) => !open && setEditingServicioId(null)}>
                <SheetContent className="w-full max-w-none sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle>Editar Servicio</SheetTitle>
                    <SheetDescription>
                      Realiza cambios en el catálogo maestro. Esto afectará a futuros presupuestos.
                    </SheetDescription>
                  </SheetHeader>
                    {editingServicioId && (
                        <EditServicioForm 
                          servicioId={editingServicioId}
                          onUpdate={async () => {
                              await loadData(); // Refresh all data in parent
                          }}
                          onClose={() => setEditingServicioId(null)}
                        />
                    )}
                </SheetContent>
                
                {currentItem && (
                    <form onSubmit={handleSaveItem}>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 py-4">
                        <div className="space-y-1"><Label htmlFor="item-name">Nombre del {modalType === 'paquete' ? 'Paquete' : 'Menú'}</Label><Input id="item-name" value={currentItem.nombre || ''} onChange={e => setCurrentItem(p => p ? {...p, nombre: e.target.value} : null)} required/></div>
                        <Separator/>
                        <Label>Servicios Incluidos</Label>
                        
                        {modalType === 'paquete' && (
                            <>
                                { (currentItem.serviciosIncluidos || []).length > 0 && (
                                    <div className="p-3 border rounded-md space-y-3">
                                        <h4 className="text-sm font-medium">Servicios en este paquete</h4>
                                        { (currentItem.serviciosIncluidos || []).map(servicioInfo => {
                                            const servicio = serviciosCatalogo.find(s => s.id === servicioInfo.id);
                                            if (!servicio) return null;
                                            return (
                                                <div key={servicio.id} className="flex items-center justify-between text-sm p-2 border-b last:border-b-0">
                                                    <div>
                                                        <p className="font-medium">{servicio.nombre}</p>
                                                        <p className="text-xs text-muted-foreground">{servicio.categoria}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5"><Checkbox id={`gift-${servicio.id}`} checked={servicioInfo.esRegalo} onCheckedChange={(checked) => handleRegaloChange(servicio.id, !!checked)} /><Label htmlFor={`gift-${servicio.id}`} className="text-xs">Regalo</Label></div>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleServicioChange(servicio.id, false)}><Trash2 className="w-3.5 h-3.5"/></Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Añadir servicios desde el catálogo</h4>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                                        <Input 
                                            placeholder="Buscar servicios..."
                                            value={servicioSearchTerm}
                                            onChange={(e) => setServicioSearchTerm(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <ScrollArea className="h-64 border rounded-md p-2">
                                        <div className="space-y-2">
                                            {categoriasOrdenadasParaPaquetes.map(categoria => {
                                                const itemsToShow = serviciosAgrupadosParaPaquetes[categoria];
                                                if (!itemsToShow || itemsToShow.length === 0) return null;
                                                return (
                                                    <div key={categoria} className="space-y-1">
                                                        <h5 className="font-semibold text-xs uppercase text-muted-foreground">{categoria}</h5>
                                                        {itemsToShow.map(servicio => {
                                                            const isInItem = currentItem.serviciosIncluidos?.some(s => s.id === servicio.id);
                                                            return (
                                                                <div key={servicio.id} className="flex items-center space-x-2 py-1">
                                                                    <Checkbox id={`serv-${servicio.id}`} checked={isInItem} onCheckedChange={(checked) => handleServicioChange(servicio.id, !!checked)} />
                                                                    <Label htmlFor={`serv-${servicio.id}`} className="text-sm font-normal flex-grow cursor-pointer">{servicio.nombre}</Label>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null} Guardar</Button>
                    </DialogFooter>
                    </form>
                )}
              </Sheet>
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Simulador</h1></div>
        <Link href="/empresa/contabilidad" passHref><Button variant="outline" disabled={isSaving}><ArrowLeft className="w-4 h-4 mr-2" />Volver al Panel Contable</Button></Link>
      </div>

       <form onSubmit={handleConfigSave}>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Ajustes Generales del Simulador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="descuento-general" className="flex items-center gap-2"><Percent className="w-4 h-4"/>Porcentaje de Descuento Ficticio (Ancla) (%)</Label>
                    <Input
                        id="descuento-general"
                        type="number"
                        value={config?.descuentoGeneral ?? ''}
                        onChange={e => setConfig(c => c ? {...c, descuentoGeneral: Number(e.target.value)} : null)}
                        placeholder="Ej: 15"
                    />
                    <p className="text-xs text-muted-foreground">Este es el porcentaje que se mostrará como 'descuento' en el simulador. El sistema aumentará el 'Valor de servicios' para que, tras aplicar este descuento, el total a pagar sea el precio real del catálogo.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="mostrar-precios"
                        checked={config?.mostrarPrecios ?? true}
                        onCheckedChange={checked => setConfig(c => c ? { ...c, mostrarPrecios: checked } : null)}
                    />
                    <Label htmlFor="mostrar-precios">Mostrar precios individuales en la selección de gastronomía</Label>
                </div>
            </CardContent>
             <CardFooter>
                 <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Guardar Ajustes Generales</Button>
            </CardFooter>
        </Card>
      </form>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Dependencias de Servicios</CardTitle>
          <CardDescription>
            Configura reglas para que al seleccionar un plato, otro servicio (ej. "Asado" → "Asador") se añada automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/40 space-y-3">
                <h4 className="font-medium">Añadir Nueva Dependencia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                        <Label htmlFor="trigger-service">Cuando se elija el plato...</Label>
                        <Select value={newDependency.triggerServiceId} onValueChange={(val) => setNewDependency(p => ({ ...p, triggerServiceId: val }))}>
                            <SelectTrigger id="trigger-service"><SelectValue placeholder="Seleccionar plato..." /></SelectTrigger>
                            <SelectContent>
                                {allMenus.map(menu => (
                                    <SelectGroup key={menu.id}>
                                        <SelectLabel>{menu.name}</SelectLabel>
                                        {menu.items.map(item => (
                                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="required-service">Añadir automáticamente el servicio...</Label>
                        <Select value={newDependency.requiredServiceId} onValueChange={(val) => setNewDependency(p => ({ ...p, requiredServiceId: val }))}>
                            <SelectTrigger id="required-service"><SelectValue placeholder="Seleccionar servicio..." /></SelectTrigger>
                            <SelectContent>
                                {serviciosCatalogo.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleAddDependency} disabled={!newDependency.triggerServiceId || !newDependency.requiredServiceId || isSaving}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Añadir Dependencia
                </Button>
            </div>
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Reglas Actuales:</h4>
                {config?.serviceDependencies?.length > 0 ? (
                    config.serviceDependencies.map(dep => {
                        const trigger = allMenus.flatMap(m => m.items).find(i => i.id === dep.triggerServiceId);
                        const required = serviciosCatalogo.find(s => s.id === dep.requiredServiceId);
                        return (
                            <div key={dep.id} className="flex items-center justify-between p-2 border rounded-md text-sm">
                                <div className="flex items-center gap-2">
                                    <span>
                                        <span className="font-semibold">{trigger?.name || <span className='text-destructive'>Plato no encontrado</span>}</span> activa a <span className="font-semibold">{required?.name || <span className='text-destructive'>Servicio no encontrado</span>}</span>
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteDependency(dep.id)} disabled={isSaving}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    })
                ) : (
                    <p className="text-xs text-center text-muted-foreground py-2">No hay dependencias configuradas.</p>
                )}
            </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Gestión Gastronómica del Simulador</CardTitle>
          <CardDescription>
            Activa o desactiva los platos que estarán disponibles en el simulador. Los platos se gestionan en el <Link href="/empresa/menus" className="text-primary underline hover:text-primary/80">Planificador Gastronómico Maestro</Link>.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Accordion type="multiple" defaultValue={['visibility']} className="w-full space-y-4">
              <AccordionItem value="visibility" className="border rounded-md shadow-sm">
                  <AccordionTrigger className="px-3 text-md font-medium hover:no-underline">Visibilidad de Platos</AccordionTrigger>
                  <AccordionContent className="p-3 border-t">
                       <Accordion type="multiple" defaultValue={['entradas']} className="w-full space-y-2">
                        <AccordionItem value="entradas" className="border rounded-md"><AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">Entradas</AccordionTrigger><AccordionContent className="p-3 border-t"><div className="grid grid-cols-2 gap-x-4 gap-y-2">{getVisibleDishes(entradasDisponibles).map(plato => (<div key={plato.id} className="flex items-center space-x-2"><Switch id={`vis-${plato.id}`} checked={isPlatoVisible(plato.id)} onCheckedChange={(v) => handlePlatoVisibilityChange(plato.id, v)}/><Label htmlFor={`vis-${plato.id}`} className="text-xs">{plato.nombre} ({formatCurrency(plato.precioPorPersona || 0)})</Label></div>))}</div></AccordionContent></AccordionItem>
                        <AccordionItem value="principales" className="border rounded-md"><AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">Platos Principales</AccordionTrigger><AccordionContent className="p-3 border-t"><div className="grid grid-cols-2 gap-x-4 gap-y-2">{getVisibleDishes(principalesDisponibles).map(plato => (<div key={plato.id} className="flex items-center space-x-2"><Switch id={`vis-${plato.id}`} checked={isPlatoVisible(plato.id)} onCheckedChange={(v) => handlePlatoVisibilityChange(plato.id, v)}/><Label htmlFor={`vis-${plato.id}`} className="text-xs">{plato.nombre} ({formatCurrency(plato.precioPorPersona || 0)})</Label></div>))}</div></AccordionContent></AccordionItem>
                        <AccordionItem value="infantiles" className="border rounded-md"><AccordionTrigger className="px-3 text-sm font-medium hover:no-underline">Menús Infantiles/Adolescentes</AccordionTrigger><AccordionContent className="p-3 border-t"><div className="grid grid-cols-2 gap-x-4 gap-y-2">{getVisibleDishes(menusNinoDisponibles).map(plato => (<div key={plato.id} className="flex items-center space-x-2"><Switch id={`vis-${plato.id}`} checked={isPlatoVisible(plato.id)} onCheckedChange={(v) => handlePlatoVisibilityChange(plato.id, v)}/><Label htmlFor={`vis-${plato.id}`} className="text-xs">{plato.nombre} ({formatCurrency(plato.precioPorPersona || 0)})</Label></div>))}</div></AccordionContent></AccordionItem>
                      </Accordion>
                  </AccordionContent>
              </AccordionItem>
           </Accordion>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center gap-2"><Package className="text-primary"/>Paquetes de Servicios para Simulador</CardTitle>
            <CardDescription>Crea y gestiona paquetes de servicios predefinidos (discoteca, decoración, etc.) para el simulador de clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => handleOpenModal('paquete')}><PlusCircle className="w-4 h-4 mr-2"/>Crear Paquete</Button>
            <Separator/>
            <Accordion type="multiple" className="w-full space-y-3">
              {config.paquetes.map(pkg => {
                const serviciosNormales = (pkg.serviciosIncluidos || []).filter(s => !s.esRegalo);
                const serviciosRegalo = (pkg.serviciosIncluidos || []).filter(s => s.esRegalo);
                return (
                <AccordionItem key={pkg.id} value={pkg.id} className="border rounded-md shadow-sm">
                    <div className="flex items-center p-3">
                        <AccordionTrigger className="hover:no-underline flex-1 text-left font-semibold text-sm">{pkg.nombre}</AccordionTrigger>
                        <div className="flex gap-2 pl-2">
                           <Button variant="outline" size="sm" onClick={() => handleOpenModal('paquete', pkg)}>Editar</Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDeleteItem('paquete', pkg.id)} disabled={isSaving}>Eliminar</Button>
                        </div>
                    </div>
                    <AccordionContent className="p-3 border-t">
                      {renderServiciosList(serviciosNormales, serviciosCatalogo)}
                      {serviciosRegalo.length > 0 && (
                        <>
                          <Separator className="my-2"/>
                          <h5 className="font-semibold text-xs uppercase text-green-600 flex items-center gap-1.5"><Gift className="w-3.5 h-3.5"/>Regalos</h5>
                          {renderServiciosList(serviciosRegalo, serviciosCatalogo)}
                        </>
                      )}
                    </AccordionContent>
                </AccordionItem>
                )
              })}
            </Accordion>
          </CardContent>
      </Card>
    </div>
  );
}
