
'use client';

import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
import type { ServicioEmpresa } from '@/types/empresa';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import Image from 'next/image';
import type { ItemPresupuestado } from '@/types/presupuesto';
import type { FullMenu, MenuItem } from '@/types/catering'; // Import MenuItem
import { getMenus } from '@/app/actions/menus-catering'; // Import getMenus

const formatCurrency = (amount: number, includeSymbol = true) => {
    if (isNaN(amount)) return 'N/A';
    const options = { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 };
    const formatted = new Intl.NumberFormat('es-UY', options).format(amount);
    return includeSymbol ? `$ ${formatted}` : formatted;
};

const formatDate = (date = new Date()) => {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// CONSTANTS FROM PDF - To be moved to a settings file eventually
const COMPANY_MAIN_TITLE = "Presupuesto para fiestas o eventos - AK PRODUCCIONES";
const COMPANY_NAME_BRAND = "AK PRODUCCIONES";
const COMPANY_CONTACT_PERSON = "SR. Alexander Knuth";
const COMPANY_ADDRESS_LINE1_PDF = "Salto";
const COMPANY_ADDRESS_LINE2_PDF = "50000 Salto";
const COMPANY_CONTACT_EMAIL_PDF = "akproduccionessalto@gmail.com";
const COMPANY_WEBSITE_PDF = "www.akproduccioneseventos.com";
const BUDGET_VALIDITY_DAYS_PDF = 30;
const BUDGET_DEPOSIT_NOTE_PDF = "Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.";


function calcularCostoServicio(servicio: ServicioEmpresa, cantidadInvitados: number): number {
  if (!servicio || cantidadInvitados < 0) return 0;
  
  if (servicio.precioVenta !== undefined && servicio.calculationMethod === 'fijo') {
      return servicio.precioVenta;
  }
   if (servicio.precioPorPersona !== undefined && servicio.calculationMethod === 'porPersona') {
      return servicio.precioPorPersona * cantidadInvitados;
  }


  switch (servicio.calculationMethod) {
    case 'porPersona':
      return (servicio.precioPorPersona || 0) * cantidadInvitados;
    case 'ratio':
      if (servicio.invitadosPorUnidad && servicio.invitadosPorUnidad > 0 && servicio.precioBase) {
        return Math.ceil(cantidadInvitados / servicio.invitadosPorUnidad) * servicio.precioBase;
      }
      return servicio.precioBase || 0;
    case 'tramos':
      const tramo = servicio.tramosDePrecio?.find(t => cantidadInvitados >= t.desde && cantidadInvitados <= t.hasta);
      return tramo?.precio || 0;
    case 'fijo':
    default:
      return servicio.precioVenta || servicio.precioBase || 0;
  }
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


interface ServicioDetallado {
  id: string;
  nombre: string;
  esRegalo: boolean;
  costo: number;
  categoria: string;
  precioUnitario: number;
  cantidad: number;
  unidad: string;
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
    const [ninos, setNinos] = useState<number>(0);
    const [duracionHoras, setDuracionHoras] = useState<number>(5);
    const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
    const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
    const [selectedMenuNino, setSelectedMenuNino] = useState<string>('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    
    const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
        if (!config || !allMenus.length) {
            return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
        }
        
        const isPlatoVisible = (platoId: string) => {
            const setting = config.platosVisibles?.find(p => p.id === platoId);
            return setting !== undefined ? setting.visible : true;
        };

        const allDishes = allMenus.flatMap(m => m.items);
        const visibleDishes = allDishes.filter(d => isPlatoVisible(d.id));
        
        const sortByPrice = (a: { precioPorPersona?: number }, b: { precioPorPersona?: number }) => (a.precioPorPersona || 0) - (b.precioPorPersona || 0);

        const enhanceWithPrice = (item: MenuItem): MenuItem & { precioVenta: number } => ({
          ...item,
          nombre: item.name,
          precioVenta: item.suggestedSellingPrice ?? ((item.totalDishCost || 0) * (1 + (item.profitMargin ?? 120) / 100)),
        });
    
        return { 
            entradasDisponibles: visibleDishes.filter(s => s.type === 'Entrada').map(menuItemToServicioEmpresa).sort(sortByPrice), 
            principalesDisponibles: visibleDishes.filter(s => s.type === 'Plato Principal').map(menuItemToServicioEmpresa).sort(sortByPrice), 
            menusNinoDisponibles: visibleDishes.filter(s => s.type === 'Menú Infantil/Adolescente').map(menuItemToServicioEmpresa).sort(sortByPrice)
        };
    }, [config, allMenus]);
    
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
        if (checked) {
            if (selectedEntradas.length >= maxEntradas) {
                toast({ title: "Límite alcanzado", description: `Puedes seleccionar hasta ${maxEntradas} entrada(s).`, variant: "default" });
                return; // Do not update state
            }
            setSelectedEntradas(prev => [...prev, servicioId]);
        } else {
            setSelectedEntradas(prev => prev.filter(id => id !== servicioId));
        }
    };
    
    const { costoTotal, subtotal, descuento, serviciosDetallados, totalRegalos } = useMemo(() => {
        if (!config || !serviciosCatalogo.length) return { costoTotal: 0, subtotal: 0, descuento: 0, serviciosDetallados: [], totalRegalos: 0 };
        
        let calculatedSubtotal = 0;
        let calculatedTotalRegalos = 0;
        const totalInvitados = adultos + ninos;
        const includedServicesList: ServicioDetallado[] = [];

        const allSimuladorServices = [...entradasDisponibles, ...principalesDisponibles, ...menusNinoDisponibles, ...serviciosCatalogo];

        const addServicio = (servicio: ServicioEmpresa | undefined, esRegalo: boolean, nota?: string, cantidadEspecifica?: number) => {
            if (!servicio) return;
            const cantidadParaCalculo = cantidadEspecifica ?? (servicio.calculationMethod === 'porPersona' || servicio.calculationMethod === 'ratio' ? totalInvitados : 1);
            const costoItem = calcularCostoServicio(servicio, cantidadParaCalculo);
            
            if (!esRegalo) {
                calculatedSubtotal += costoItem;
            } else {
                calculatedTotalRegalos += costoItem;
            }
            
            let unidadDisplay = 'evento';
            if (servicio.calculationMethod === 'porPersona') {
                unidadDisplay = 'personas';
            } else if (servicio.calculationMethod === 'ratio' && servicio.unidad) {
                unidadDisplay = servicio.unidad;
            }

            includedServicesList.push({ 
                id: servicio.id,
                nombre: servicio.nombre + (nota ? ` ${nota}` : ''), 
                esRegalo, 
                costo: costoItem,
                categoria: servicio.categoria || 'Varios',
                precioUnitario: servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0,
                cantidad: cantidadParaCalculo,
                unidad: unidadDisplay
            });
        };
        
        selectedEntradas.forEach(id => {
            addServicio(allSimuladorServices.find(s => s.id === id), false);
        });

        if (selectedPrincipal) {
            addServicio(allSimuladorServices.find(s => s.id === selectedPrincipal), false);
        }
        if (selectedMenuNino && ninos > 0) {
            addServicio(allSimuladorServices.find(s => s.id === selectedMenuNino), false, '(Niños/Adol.)', ninos);
        }

        const paqueteSeleccionado = config.paquetes.find(p => p.id === selectedPaqueteId);
        if (paqueteSeleccionado) {
            paqueteSeleccionado.serviciosIncluidos.forEach(servicioInfo => {
                addServicio(serviciosCatalogo.find(s => s.id === servicioInfo.id), servicioInfo.esRegalo || false);
            });
        }
        
        let calculatedDescuento = 0;
        if (config.descuentoGeneral && config.descuentoGeneral > 0) {
            calculatedDescuento = calculatedSubtotal * (config.descuentoGeneral / 100);
        }

        const calculatedCostoTotal = calculatedSubtotal - calculatedDescuento;

        return { costoTotal: calculatedCostoTotal, subtotal: calculatedSubtotal, descuento: calculatedDescuento, serviciosDetallados: includedServicesList, totalRegalos: calculatedTotalRegalos };
    }, [config, serviciosCatalogo, entradasDisponibles, principalesDisponibles, menusNinoDisponibles, adultos, ninos, selectedEntradas, selectedPrincipal, selectedMenuNino, selectedPaqueteId]);

    const serviciosAgrupados = useMemo(() => {
        const serviciosSinRegalo = serviciosDetallados.filter(s => !s.esRegalo);
        return serviciosSinRegalo.reduce((acc, servicio) => {
            const categoria = servicio.categoria || 'Otros Servicios';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(servicio);
            return acc;
        }, {} as Record<string, ServicioDetallado[]>);
    }, [serviciosDetallados]);

    const regalosAgrupados = useMemo(() => {
        const serviciosDeRegalo = serviciosDetallados.filter(s => s.esRegalo);
        return serviciosDeRegalo.reduce((acc, servicio) => {
            const categoria = servicio.categoria || 'Otros Servicios';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(servicio);
            return acc;
        }, {} as Record<string, ServicioDetallado[]>);
    }, [serviciosDetallados]);

     const generarTextoWhatsApp = useCallback(() => {
        let message = `🎉 *¡Presupuesto Estimado - AK Producciones!* 🎉\n\n`;
        message += `Estimado/a *${clienteNombre || 'Cliente'}*,\n\n`;
        message += `Gracias por tu interés. Aquí tienes el enlace a tu simulación:\n\n`;
        message += window.location.href;
        message += `\n\nPara confirmar y obtener más detalles, ¡no dudes en contactarnos!\n*El equipo de AK Producciones*`;
        return message;
    }, [clienteNombre]);

    const handleShareWhatsApp = () => {
        if (typeof window === 'undefined') return;
        const message = generarTextoWhatsApp();
        const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsAppUrl, '_blank');
    };

    const handleContactWhatsApp = () => {
        if (!whatsappNumber) {
            toast({title: "Número no configurado", description: "El número de WhatsApp no ha sido configurado en los ajustes.", variant: "destructive"});
            return;
        }
        const message = `Hola, he generado un presupuesto estimado a través del simulador y quisiera más información.`;
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }

    const handleDownloadPdf = () => {
        window.print();
    };

    const handleGenerateLead = useCallback(async () => {
        if (!clienteNombre.trim() || !clienteContacto.trim()) {
            // Fail silently in this automatic flow, the user can still proceed.
            console.warn("Datos de contacto incompletos, no se creará el prospecto en CRM.");
            return;
        }
        setIsGeneratingLead(true);
        const data = {
            clienteNombre,
            clienteContacto,
            adultos,
            ninos,
            costoEstimado: costoTotal,
            paqueteNombre: config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre,
            items: serviciosDetallados.map(s => ({
                idServicioCatalogo: s.id,
                nombreServicio: s.nombre,
                cantidad: s.cantidad,
                unidad: s.unidad,
                precioUnitario: s.precioUnitario,
                precioUnitarioPresupuesto: s.precioUnitario,
                esRegalo: s.esRegalo,
                categoriaServicio: s.categoria
            })) as Omit<ItemPresupuestado, 'costoTotalItem'>[]
        };

        try {
            const result = await generateBudgetAndLeadFromSimulator(data);
            if(!result.success) { 
                throw new Error(result.error); 
            } else {
                 toast({ title: "Prospecto Creado", description: "Se ha registrado un nuevo prospecto en el CRM.", variant: 'default' });
            }
        } catch(e: any) {
             toast({ title: "Error al registrar prospecto", description: e.message, variant: "destructive" });
        } finally {
            setIsGeneratingLead(false);
        }
    }, [clienteNombre, clienteContacto, adultos, ninos, costoTotal, config?.paquetes, selectedPaqueteId, serviciosDetallados, toast]);
    
    const isStepTwoInvalid = useMemo(() => {
        const requiredEntradas = duracionHoras > 4 ? 2 : 1;
        return !selectedPrincipal || selectedEntradas.length !== requiredEntradas;
    }, [duracionHoras, selectedPrincipal, selectedEntradas]);

    const nextStep = () => {
        if (step === 1 && (!clienteNombre.trim() || !/^\d{9}$/.test(clienteContacto.trim()) || adultos <= 0)) {
            toast({ title: "Datos incompletos", description: "Por favor, ingresa un nombre, un celular válido de 9 dígitos y la cantidad de adultos.", variant: "destructive" });
            return;
        }
        if (step === 2 && isStepTwoInvalid) {
            const requiredEntradas = duracionHoras > 4 ? 2 : 1;
            toast({ title: "Selección de Menú Incompleta", description: `Debes elegir un plato principal y exactamente ${requiredEntradas} entrada(s).`, variant: "destructive" });
            return;
        }
        if (step === 3 && !selectedPaqueteId) {
            toast({ title: "Paquete Requerido", description: "Por favor, elige un paquete de servicios para continuar.", variant: "destructive" });
            return;
        }
        
        if (step < 4) {
            if (step === 3) { // Moving from step 3 to 4
                handleGenerateLead();
            }
            setStep(s => s + 1);
        }
    };


    const prevStep = () => setStep(s => s > 1 ? s - 1 : s);
    
    const maxEntradas = duracionHoras > 4 ? 2 : 1;
    const entradasFaltantes = maxEntradas - selectedEntradas.length;

    if (isLoading) { return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>; }

    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(today.getDate() + 30);

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
                    .print-text-xs { font-size: 0.75rem; }
                    .print-text-sm { font-size: 0.875rem; }
                    .print-text-base { font-size: 1rem; }
                    .print-p-2 { padding: 0.5rem; }
                    .print-bg-transparent { background-color: transparent !important; }
                    .print-mb-4 { margin-bottom: 1rem; }
                    .print-border-b { border-bottom-width: 1px; }
                    .print-pb-2 { padding-bottom: 0.5rem; }
                    .print-max-w-none { max-width: none !important; }
                    .print-space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
                    .print-mt-2 { margin-top: 0.5rem; }
                    .print-py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                    .print-px-1-5 { padding-left: 0.375rem; padding-right: 0.375rem; }
                    .print-border-gray-400 { border-color: #9ca3af; }
                    .print-bg-gray-50 { background-color: #f9fafb; }
                    .print-text-black { color: #000; }
                }
            `}</style>
            <Card className="w-full max-w-3xl shadow-xl print:shadow-none print:border-none">
                <CardHeader className="text-center print:hidden">
                    <Wand2 className="w-12 h-12 mx-auto text-primary mb-2"/>
                    <CardTitle className="font-headline text-3xl">Simulador de Presupuesto</CardTitle>
                    {step < 4 && (
                        <>
                            <CardDescription className="text-lg">Paso {step} de 4: {['Tus Datos', 'Menú Gastronómico', 'Paquete de Servicios', 'Resumen'][step-1]}</CardDescription>
                            <Progress value={(step / 4) * 100} className="w-full h-2 mt-4" />
                        </>
                    )}
                </CardHeader>
                <CardContent className="min-h-[350px] py-6 px-4 sm:px-8 print:p-2">
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2"><Label htmlFor="num-adultos">Cantidad de Adultos *</Label><Input id="num-adultos" type="number" value={adultos} onChange={e => setAdultos(Number(e.target.value) || 0)} min="1" required/></div>
                                <div className="space-y-2"><Label htmlFor="num-ninos">Cantidad de Niños/Adolescentes</Label><Input id="num-ninos" type="number" value={ninos} onChange={e => setNinos(Number(e.target.value) || 0)} min="0"/></div>
                                <div className="space-y-2"><Label htmlFor="duracion-horas">Duración (hs)</Label><Input id="duracion-horas" type="number" value={duracionHoras} onChange={(e) => setDuracionHoras(Number(e.target.value) || 1)} min="1"/></div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><ChefHat className="text-primary w-5 h-5"/>Elige tu menú gastronómico</h3>
                            <div className="space-y-4">
                                <Label>Debes elegir {maxEntradas} entrada{maxEntradas > 1 ? 's' : ''} ({duracionHoras > 4 ? 'Fiesta larga' : 'Fiesta corta'})</Label>
                                {entradasFaltantes > 0 && <p className="text-sm text-amber-600">Te falta seleccionar {entradasFaltantes} entrada{entradasFaltantes > 1 ? 's' : ''}.</p>}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{entradasDisponibles.map(s => (<div key={s.id} className="flex items-center space-x-2 p-2 border rounded-md"><Checkbox id={`e-${s.id}`} checked={selectedEntradas.includes(s.id)} onCheckedChange={(checked) => handleEntradaChange(s.id, !!checked)}/><Label htmlFor={`e-${s.id}`} className="text-sm font-normal">{s.nombre} <span className="text-xs text-muted-foreground">({formatCurrency(s.precioPorPersona || 0, true)})</span></Label></div>))}</div>
                            </div>
                            <div className="space-y-4"><Label>Plato Principal (elige 1)</Label>
                                <RadioGroup value={selectedPrincipal} onValueChange={setSelectedPrincipal} className="grid grid-cols-1 md:grid-cols-2 gap-2">{principalesDisponibles.map(s => <div key={s.id} className="flex items-center space-x-2 p-2 border rounded-md"><RadioGroupItem value={s.id} id={`p-${s.id}`}/><Label htmlFor={`p-${s.id}`} className="text-sm font-normal">{s.nombre} ({formatCurrency(s.precioPorPersona || 0, true)})</Label></div>)}</RadioGroup>
                            </div>
                            <div className="space-y-2"><Label>Menú Niños/Adolescentes (elige 1)</Label><Select value={selectedMenuNino} onValueChange={setSelectedMenuNino} disabled={ninos === 0}><SelectTrigger><SelectValue placeholder={ninos > 0 ? "Selecciona un menú..." : "Añade niños en Paso 1"}/></SelectTrigger><SelectContent>{menusNinoDisponibles.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre} ({formatCurrency(s.precioPorPersona || 0, true)})</SelectItem>)}</SelectContent></Select></div>
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
                                    <Label key={p.id} htmlFor={`pkg-${p.id}`} className="p-4 border rounded-lg cursor-pointer hover:border-primary has-[:checked]:border-primary/5 flex flex-col">
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
                                                        {regalos.map(s => { const serv = serviciosCatalogo.find(sc => sc.id === s.id); return serv && <li key={s.id} className="font-medium flex items-center gap-1.5 text-red-600"><Gift className="w-3 h-3"/>{serv.nombre} (REGALO)</li> })}
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
                    {step === 4 && (
                        <div className="animate-in fade-in-20" id="budget-summary-printable">
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
                            
                            <h3 className="font-headline text-2xl text-center mb-4">Resumen de tu Presupuesto</h3>
                            <p className="text-center text-muted-foreground mb-6">Esta es una estimación basada en tus selecciones. Un asesor se pondrá en contacto para confirmar todos los detalles y ajustar el presupuesto a tus necesidades.</p>
                            
                             <div className="md:hidden space-y-3">
                                {Object.entries(serviciosAgrupados).map(([categoria, items]) =>(
                                    <div key={categoria}>
                                        <h4 className="font-bold text-primary border-b pb-1 mb-2">{categoria}</h4>
                                        {items.map(item => (
                                            <div key={item.id} className="p-2 border-b text-sm">
                                                <div className="flex justify-between font-medium">
                                                    <span>{item.nombre}</span>
                                                    <span>{formatCurrency(item.costo)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {Object.keys(regalosAgrupados).length > 0 && (
                                  <div>
                                    <h4 className="font-bold text-red-600 border-b border-red-300 pb-1 mb-2 flex items-center gap-1.5"><Gift className="w-4 h-4"/> Regalos Incluidos</h4>
                                    {Object.entries(regalosAgrupados).map(([categoria, items]) => items.map(item => (
                                      <div key={item.id} className="p-2 border-b text-sm text-red-600">
                                        <div className="flex justify-between font-medium">
                                          <span>{item.nombre}</span>
                                          <span className="line-through">{formatCurrency(item.costo)}</span>
                                        </div>
                                      </div>
                                    )))}
                                  </div>
                                )}
                             </div>

                             <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Artículo</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(serviciosAgrupados).map(([categoria, items]) => (
                                            <React.Fragment key={categoria}>
                                                <TableRow className="bg-muted/30 print:bg-gray-50">
                                                    <TableCell colSpan={2} className="font-bold text-primary">{categoria}</TableCell>
                                                </TableRow>
                                                {items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.nombre}</TableCell>
                                                        <TableCell className="text-right font-semibold">{formatCurrency(item.costo)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                        {Object.keys(regalosAgrupados).length > 0 && (
                                            <React.Fragment>
                                                <TableRow className="bg-red-50 print:bg-red-100/50">
                                                    <TableCell colSpan={2} className="font-bold text-red-600 flex items-center gap-1.5"><Gift className="w-4 h-4"/>Regalos Incluidos</TableCell>
                                                </TableRow>
                                                {Object.entries(regalosAgrupados).map(([_, items]) => items.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium text-red-600">{item.nombre}</TableCell>
                                                        <TableCell className="text-right font-semibold text-red-600 line-through">{formatCurrency(item.costo)}</TableCell>
                                                    </TableRow>
                                                )))}
                                            </React.Fragment>
                                        )}
                                    </TableBody>
                                </Table>
                             </div>

                            <Separator className="my-4"/>
                            <div className="w-full md:max-w-xs ml-auto space-y-1 text-sm">
                                {descuento > 0 && <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>}
                                {totalRegalos > 0 && <div className="flex justify-between text-green-600"><span>Ahorro en Regalos:</span><span>{formatCurrency(totalRegalos)}</span></div>}
                                {descuento > 0 && <div className="flex justify-between text-destructive"><span>Descuento ({config?.descuentoGeneral}%):</span><span>-${formatCurrency(descuento)}</span></div>}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span className="text-primary">Importe total</span><span className="text-primary">{formatCurrency(costoTotal)}</span></div>
                            </div>
                             <footer className="mt-6 pt-3 border-t border-gray-300 print:mt-2 print:pt-1.5 print:border-gray-400 text-xs print:text-[8pt] text-gray-600 print:text-black">
                              <p className="text-red-600 font-bold text-lg">{BUDGET_DEPOSIT_NOTE_PDF}</p>
                            </footer>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 print:hidden">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1 || isGeneratingLead}>
                        <ArrowLeft className="w-4 h-4 mr-2"/>Anterior
                    </Button>
                    {step < 4 ? (
                        <Button onClick={nextStep} disabled={ (step === 1 && (!clienteNombre.trim() || !/^\d{9}$/.test(clienteContacto.trim()) || adultos <= 0)) || (step === 2 && isStepTwoInvalid) || (step === 3 && !selectedPaqueteId) }>
                            {step === 3 ? "Ver Resumen" : "Siguiente"}
                            {step < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button type="button" onClick={handleContactWhatsApp} className="bg-green-500 hover:bg-green-600">
                                <MessageSquare className="w-4 h-4 mr-2"/>Contactar Asesor por WhatsApp
                             </Button>
                             <Button type="button" onClick={handleDownloadPdf} variant="secondary"><Printer className="w-4 h-4 mr-2"/>Guardar o Imprimir</Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
