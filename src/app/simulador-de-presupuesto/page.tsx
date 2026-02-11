
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, Package, ChefHat, FileText, Send, CheckCircle, Gift, User, Phone, MessageSquare, Share2, Printer, Search } from 'lucide-react';
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
        calculationMethod: 'porPersona',
        precioPorPersona: item.precioPorPersona || 0,
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

    