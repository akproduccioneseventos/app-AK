
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, Package, ChefHat, FileText, Send, CheckCircle, Gift, User, Phone, MessageSquare, Share2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
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
    const [whatsappNumber, setWhatsappNumber] = useState<string>('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    
    // Form state
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteContacto, setClienteContacto] = useState('');
    const [adultos, setAdultos] = useState<number>(50);
    const [ninos, setNinos] = useState<number>(0);
    const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
    const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
    const [selectedMenuNino, setSelectedMenuNino] = useState<string>('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    
    const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
        if (!config || !serviciosCatalogo.length) {
            return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
        }

        const menuCatering = config.menus.find(m => m.id === 'menu_catering');
        if (!menuCatering) {
            return { entradasDisponibles: [], principalesDisponibles: [], menusNinoDisponibles: [] };
        }

        const serviciosDelMenu = menuCatering.serviciosIncluidos.map(s => serviciosCatalogo.find(sc => sc.id === s.id)).filter(Boolean) as ServicioEmpresa[];
        
        const sortByPrice = (a: ServicioEmpresa, b: ServicioEmpresa) => {
            const priceA = a.precioPorPersona || a.precioBase || a.precioVenta || 0;
            const priceB = b.precioPorPersona || b.precioBase || b.precioVenta || 0;
            return priceA - priceB;
        };

        const entradas = serviciosDelMenu.filter(s => s.subcategoria === 'Entrada').sort(sortByPrice);
        const principales = serviciosDelMenu.filter(s => s.subcategoria === 'Plato Principal').sort(sortByPrice);
        const menusNino = serviciosDelMenu.filter(s => s.subcategoria === 'Menú Niños/Adolescentes').sort(sortByPrice);
        
        return { entradasDisponibles: entradas, principalesDisponibles: principales, menusNinoDisponibles: menusNino };
    }, [config, serviciosCatalogo]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [armadoConfig, serviciosData, socialConnections, templateSettings] = await Promise.all([
                    getArmadoRapidoConfig(),
                    getServiciosEmpresa(),
                    getSocialConnections(),
                    getInvoiceTemplateSettings()
                ]);
                setConfig(armadoConfig);
                setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
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
        setSelectedEntradas(prev => {
            if (checked) {
                if (prev.length < 2) {
                    return [...prev, servicioId];
                } else {
                    toast({ title: "Límite alcanzado", description: "Puedes seleccionar hasta 2 entradas.", variant: "default" });
                    return prev;
                }
            } else {
                return prev.filter(id => id !== servicioId);
            }
        });
    };
    
    const { costoTotal, subtotal, descuento, serviciosDetallados, totalRegalos } = useMemo(() => {
        if (!config || !serviciosCatalogo.length) return { costoTotal: 0, subtotal: 0, descuento: 0, serviciosDetallados: [], totalRegalos: 0 };
        
        let calculatedSubtotal = 0;
        let calculatedTotalRegalos = 0;
        const totalInvitados = adultos + ninos;
        const includedServicesList: ServicioDetallado[] = [];

        const addServicio = (servicio: ServicioEmpresa | undefined, esRegalo: boolean, nota?: string) => {
            if (!servicio) return;
            const cantidadParaCalculo = servicio.calculationMethod === 'porPersona' || servicio.calculationMethod === 'ratio' ? totalInvitados : 1;
            const costoItem = calcularCostoServicio(servicio, totalInvitados);
            
            if (!esRegalo) {
                calculatedSubtotal += costoItem;
            } else {
                calculatedTotalRegalos += costoItem;
            }
            
            let unidadDisplay = 'evento';
            if (servicio.calculationMethod === 'porPersona') {
                unidadDisplay = 'persona';
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
            addServicio(serviciosCatalogo.find(s => s.id === id), false);
        });

        if (selectedPrincipal) {
            addServicio(serviciosCatalogo.find(s => s.id === selectedPrincipal), false);
        }
        if (selectedMenuNino && ninos > 0) {
            const menuNinoServicio = serviciosCatalogo.find(s => s.id === selectedMenuNino);
             if (menuNinoServicio) {
                const costoItemNino = calcularCostoServicio(menuNinoServicio, ninos);
                calculatedSubtotal += costoItemNino;
                includedServicesList.push({
                    id: menuNinoServicio.id,
                    nombre: menuNinoServicio.nombre,
                    esRegalo: false,
                    costo: costoItemNino,
                    categoria: menuNinoServicio.categoria || 'Catering',
                    precioUnitario: menuNinoServicio.precioPorPersona || 0,
                    cantidad: ninos,
                    unidad: 'niño/adol.'
                });
             }
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
    }, [config, serviciosCatalogo, adultos, ninos, selectedEntradas, selectedPrincipal, selectedMenuNino, selectedPaqueteId]);

    const serviciosAgrupados = useMemo(() => {
        const agrupar = (servs: ServicioDetallado[]) => servs.reduce((acc, servicio) => {
            const categoria = servicio.categoria || 'Otros Servicios';
            if (!acc[categoria]) {
                acc[categoria] = [];
            }
            acc[categoria].push(servicio);
            return acc;
        }, {} as Record<string, ServicioDetallado[]>);

        return agrupar(serviciosDetallados);
    }, [serviciosDetallados]);

     const generateWhatsAppMessage = useCallback(() => {
        let message = `🎉 *¡Presupuesto Estimado - AK Producciones!* 🎉\n\n`;
        message += `Estimado/a *${clienteNombre || 'Cliente'}*,\n\n`;
        message += `Gracias por tu interés. Aquí tienes un resumen de tu simulación:\n\n`;
        message += `*Invitados:* ${adultos} Adultos, ${ninos} Niños/Adolescentes\n\n`;
        
        Object.entries(serviciosAgrupados).forEach(([categoria, items]) => {
            message += `*${categoria}*\n`;
            items.forEach(s => {
                if (s.esRegalo) {
                    message += `  🎁 • ${s.nombre} (REGALO)\n`;
                } else {
                    message += `  • ${s.nombre}\n`;
                }
            });
            message += `\n`;
        });
        
        message += `------------------------------------\n`;
        if (descuento > 0) {
          message += `SUBTOTAL: ${formatCurrency(subtotal, true)}\n`;
          message += `DESCUENTO (${config?.descuentoGeneral}%): -${formatCurrency(descuento, true)}\n`;
        }
        if (totalRegalos > 0) {
            message += `AHORRO EN REGALOS: ${formatCurrency(totalRegalos, true)}\n`;
        }
        message += `💰 *COSTO TOTAL ESTIMADO: ${formatCurrency(costoTotal, true)}*\n`;
        message += `------------------------------------\n\n`;
        message += `Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.\n\n`;
        message += `¡Nos pondremos en contacto contigo para afinar los detalles!\n\n`;
        message += `*El equipo de AK Producciones*`;
        return message;
    }, [clienteNombre, adultos, ninos, serviciosAgrupados, subtotal, descuento, costoTotal, config?.descuentoGeneral, totalRegalos]);

    const handleShareWhatsApp = () => {
        if (typeof window === 'undefined') return;
        const message = generateWhatsAppMessage();
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

    const handleGenerateLead = async () => {
        if (!clienteNombre.trim() || !clienteContacto.trim()) {
            toast({ title: "Datos incompletos", description: "Por favor, completa tu nombre y contacto para solicitar el presupuesto.", variant: "destructive" });
            return;
        }
        setIsGeneratingLead(true);
        const data = {
            clienteNombre,
            clienteContacto,
            adultos,
            ninos,
            costoEstimado: costoTotal,
            serviciosIncluidos: serviciosDetallados.map(s => `${s.nombre}${s.esRegalo ? ' (REGALO)' : ''}`),
            paqueteNombre: config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre,
        };

        try {
            const result = await generateLeadFromQuickBudget(data);
            if(result.success) {
                setStep(5); // Show success step
            } else { throw new Error(result.error); }
        } catch(e: any) {
             toast({ title: "Error al enviar", description: e.message, variant: "destructive" });
        } finally {
            setIsGeneratingLead(false);
        }
    }
    
    const nextStep = () => setStep(s => s < 4 ? s + 1 : s);
    const prevStep = () => setStep(s => s > 1 ? s - 1 : s);
    
    if (isLoading) { return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>; }
    if (step === 5) {
      return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg text-center shadow-xl p-6">
                <CardHeader><PartyPopper className="w-16 h-16 mx-auto text-green-500 mb-4"/><CardTitle className="font-headline text-3xl text-green-600">¡Presupuesto Solicitado!</CardTitle><CardDescription className="text-lg">Gracias por tu interés. Un representante se pondrá en contacto contigo a la brevedad.</CardDescription></CardHeader>
                <CardFooter><Button className="w-full" onClick={() => { setStep(1); setClienteNombre(''); setClienteContacto(''); setSelectedEntradas([]); setSelectedPrincipal(''); setSelectedMenuNino(''); setSelectedPaqueteId(''); }}>Volver a Simular</Button></CardFooter>
            </Card>
        </div>
      )
    }

    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(today.getDate() + 30);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 print:bg-white print:p-0 print:items-start">
            <Card className="w-full max-w-3xl shadow-xl print:shadow-none print:border-none">
                <CardHeader className="text-center print:hidden">
                    <Wand2 className="w-12 h-12 mx-auto text-primary mb-2"/>
                    <CardTitle className="font-headline text-3xl">Simulador de Presupuesto</CardTitle>
                    <CardDescription className="text-lg">Paso {step} de 4: {['Tus Datos', 'Menú Gastronómico', 'Paquete de Servicios', 'Resumen'][step-1]}</CardDescription>
                    <Progress value={(step / 4) * 100} className="w-full h-2 mt-4" />
                </CardHeader>
                <CardContent className="min-h-[350px] py-6 px-4 sm:px-8 print:p-2">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><User className="text-primary w-5 h-5"/>Define tu evento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="cliente-nombre">Tu Nombre Completo *</Label><Input id="cliente-nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ingresa tu nombre" required/></div>
                                <div className="space-y-2"><Label htmlFor="cliente-contacto">Tu Celular *</Label><Input id="cliente-contacto" type="tel" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="Ej: 099123456" required/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="num-adultos">Cantidad de Adultos *</Label><Input id="num-adultos" type="number" value={adultos} onChange={e => setAdultos(Number(e.target.value) || 0)} min="1" required/></div>
                                <div className="space-y-2"><Label htmlFor="num-ninos">Cantidad de Niños/Adolescentes</Label><Input id="num-ninos" type="number" value={ninos} onChange={e => setNinos(Number(e.target.value) || 0)} min="0"/></div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><ChefHat className="text-primary w-5 h-5"/>Elije tu menú gastronómico</h3>
                            <div className="space-y-4"><Label>Entradas (puedes elegir hasta 2)</Label>
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
                                    <Label key={p.id} htmlFor={`pkg-${p.id}`} className="p-4 border rounded-lg cursor-pointer hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex flex-col">
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
                                                        {regalos.map(s => { const serv = serviciosCatalogo.find(sc => sc.id === s.id); return serv && <li key={s.id} className="text-green-600 font-medium flex items-center gap-1.5"><Gift className="w-3 h-3"/>{serv.nombre}</li> })}
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
                        <div className="space-y-4 animate-in fade-in-20">
                            <header className="mb-6 print:mb-4 text-center border-b pb-3 print:pb-2">
                                <h1 className="text-xl font-bold text-center mb-4 print:text-base leading-tight">{COMPANY_MAIN_TITLE}</h1>
                                <div className="flex flex-col md:flex-row justify-between items-center text-xs print:text-[8pt] gap-2">
                                    <div className="space-y-px text-center md:text-left">
                                        <p className="font-semibold">{COMPANY_CONTACT_PERSON}</p>
                                        <p>{COMPANY_ADDRESS_LINE1_PDF}, {COMPANY_ADDRESS_LINE2_PDF}</p>
                                        <p>{COMPANY_CONTACT_EMAIL_PDF} | {COMPANY_WEBSITE_PDF}</p>
                                    </div>
                                    {logoUrl && (
                                        <div className="w-20 h-20 print:w-16 print:h-16 flex-shrink-0">
                                            <Image src={logoUrl} alt={`${COMPANY_NAME_BRAND} Logo`} width={80} height={80} className="object-contain" data-ai-hint="company logo"/>
                                        </div>
                                    )}
                                </div>
                                <Separator className="my-3"/>
                                <p className="text-left font-semibold text-sm">{clienteNombre}</p>
                            </header>
                            
                             <table className="w-full text-xs print:text-[7pt] border-collapse mb-4">
                                <thead className="print:bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Número de cliente</th>
                                        <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Fecha</th>
                                        <th className="border border-gray-300 print:border-gray-400 px-1.5 py-1 text-left font-medium bg-gray-50">Válido hasta</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">N/A</td>
                                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(today)}</td>
                                        <td className="border border-gray-300 print:border-gray-400 px-1.5 py-1">{formatDate(validUntil)}</td>
                                    </tr>
                                </tbody>
                             </table>
                             
                             <div className="md:hidden space-y-3">
                                {Object.entries(serviciosAgrupados).map(([categoria, items]) =>(
                                    <div key={categoria}>
                                        <h4 className="font-bold text-primary border-b pb-1 mb-2">{categoria}</h4>
                                        {items.map(item => (
                                            <div key={item.id} className="p-2 border-b text-sm">
                                                <div className={`flex justify-between font-medium ${item.esRegalo ? 'text-green-600' : ''}`}>
                                                    <span>{item.esRegalo && <Gift className="inline w-3 h-3 mr-1"/>}{item.nombre}</span>
                                                    <span>{item.esRegalo ? formatCurrency(0) : formatCurrency(item.costo)}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {item.cantidad} {item.unidad} x {formatCurrency(item.precioUnitario)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                             </div>

                             <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Artículo</TableHead>
                                            <TableHead className="text-center">Cantidad</TableHead>
                                            <TableHead className="text-right">P. Unitario</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(serviciosAgrupados).map(([categoria, items]) => (
                                            <React.Fragment key={categoria}>
                                                <TableRow className="bg-muted/30 print:bg-gray-50">
                                                    <TableCell colSpan={4} className="font-bold text-primary">{categoria}</TableCell>
                                                </TableRow>
                                                {items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className={`font-medium ${item.esRegalo ? 'text-green-600' : ''}`}>
                                                            {item.esRegalo && <Gift className="inline w-3 h-3 mr-1"/>}
                                                            {item.nombre}
                                                        </TableCell>
                                                        <TableCell className="text-center">{item.cantidad} {item.unidad}</TableCell>
                                                        <TableCell className="text-right">{item.esRegalo ? <span className="line-through">{formatCurrency(item.precioUnitario)}</span> : formatCurrency(item.precioUnitario)}</TableCell>
                                                        <TableCell className="text-right font-semibold">{item.esRegalo ? formatCurrency(0) : formatCurrency(item.costo)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>

                            <Separator className="my-4"/>
                            <div className="w-full md:max-w-xs ml-auto space-y-1 text-sm">
                                {descuento > 0 && <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>}
                                {totalRegalos > 0 && <div className="flex justify-between text-green-600"><span>Ahorro en Regalos:</span><span>{formatCurrency(totalRegalos)}</span></div>}
                                {descuento > 0 && <div className="flex justify-between text-destructive"><span>Descuento ({config?.descuentoGeneral}%):</span><span>-{formatCurrency(descuento)}</span></div>}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span className="text-primary">Importe total</span><span className="text-primary">{formatCurrency(costoTotal)}</span></div>
                            </div>
                            <footer className="mt-6 pt-4 text-xs text-gray-600 print:text-black">
                              <p>{BUDGET_DEPOSIT_NOTE_PDF}</p>
                            </footer>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4 print:hidden">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                        <ArrowLeft className="w-4 h-4 mr-2"/>Anterior
                    </Button>
                    {step < 4 ? (
                        <Button onClick={nextStep} disabled={(step === 1 && (!clienteNombre.trim() || !clienteContacto.trim() || adultos <= 0)) || (step === 2 && (!selectedPrincipal || selectedEntradas.length !== 2)) || (step === 3 && !selectedPaqueteId)}>
                            Siguiente<ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button type="button" onClick={handleContactWhatsApp} variant="secondary" className="bg-green-500 hover:bg-green-600 text-white"><MessageSquare className="w-4 h-4 mr-2"/>Contactar</Button>
                             <Button type="button" onClick={handleShareWhatsApp} variant="secondary"><Share2 className="w-4 h-4 mr-2"/>Compartir</Button>
                             <Button type="button" onClick={handleDownloadPdf} variant="outline"><Printer className="w-4 h-4 mr-2"/>Descargar</Button>
                             <Button onClick={handleGenerateLead} disabled={isGeneratingLead}>{isGeneratingLead ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}{isGeneratingLead ? 'Enviando...' : 'Solicitar Presupuesto'}</Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

    