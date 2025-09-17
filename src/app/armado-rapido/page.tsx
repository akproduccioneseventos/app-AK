
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, Package, ChefHat, FileText, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Progress } from '@/components/ui/progress';

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);

function calcularCostoServicio(servicio: ServicioEmpresa, cantidadInvitados: number): number {
  if (!servicio || cantidadInvitados <= 0) return 0;
  
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

export default function ArmadoRapidoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
    
    // Form state
    const [cantidadInvitados, setCantidadInvitados] = useState<number>(50);
    const [clienteNombre, setClienteNombre] = useState('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    const [selectedMenuId, setSelectedMenuId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [armadoConfig, serviciosData] = await Promise.all([
                    getArmadoRapidoConfig(),
                    getServiciosEmpresa(),
                ]);
                setConfig(armadoConfig);
                setServicios(serviciosData);
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar las configuraciones del simulador.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [toast]);
    
    const costoEstimado = useMemo(() => {
        if (!config || !servicios.length || cantidadInvitados <= 0) return 0;
        
        let costoTotal = 0;
        const paqueteSeleccionado = config.paquetes.find(p => p.id === selectedPaqueteId);
        const menuSeleccionado = config.menus.find(m => m.id === selectedMenuId);

        const allServiciosIds = new Set<string>();
        const serviciosRegaloIds = new Set<string>();

        if (paqueteSeleccionado) {
            paqueteSeleccionado.serviciosIncluidos.forEach(s => {
                allServiciosIds.add(s.id);
                if (s.esRegalo) serviciosRegaloIds.add(s.id);
            });
        }
        if (menuSeleccionado) {
             menuSeleccionado.serviciosIncluidos.forEach(s => {
                allServiciosIds.add(s.id);
                if (s.esRegalo) serviciosRegaloIds.add(s.id);
            });
        }

        allServiciosIds.forEach(servicioId => {
            if (serviciosRegaloIds.has(servicioId)) return;
            const servicio = servicios.find(s => s.id === servicioId);
            if (servicio) {
                costoTotal += calcularCostoServicio(servicio, cantidadInvitados);
            }
        });
        
        if (config.descuentoGeneral && config.descuentoGeneral > 0) {
            costoTotal *= (1 - (config.descuentoGeneral / 100));
        }

        return costoTotal;
    }, [config, servicios, selectedPaqueteId, selectedMenuId, cantidadInvitados]);
    
    const handleGenerateLead = async () => {
        if (!clienteNombre.trim()) {
            toast({ title: "Falta tu nombre", variant: "destructive"});
            return;
        }
        setIsGeneratingLead(true);
        const paquete = config?.paquetes.find(p => p.id === selectedPaqueteId);
        const menu = config?.menus.find(m => m.id === selectedMenuId);

        const data = {
            clienteNombre,
            cantidadInvitados,
            nombrePaquete: paquete?.nombre,
            nombreMenu: menu?.nombre,
            costoEstimado,
            tipoEvento: 'Evento desde Simulador de Presupuesto',
            salonFiestas: 'A confirmar'
        };

        try {
            const result = await generateLeadFromQuickBudget(data);
            if(result.success) {
                setStep(4); // Show success step
            } else {
                throw new Error(result.error);
            }
        } catch(e: any) {
             toast({ title: "Error al enviar", description: e.message, variant: "destructive" });
        } finally {
            setIsGeneratingLead(false);
        }
    }
    
    const nextStep = () => setStep(s => s < 3 ? s + 1 : s);
    const prevStep = () => setStep(s => s > 1 ? s - 1 : s);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    }

    if (step === 4) {
      return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg text-center shadow-xl p-6">
                <CardHeader>
                    <PartyPopper className="w-16 h-16 mx-auto text-green-500 mb-4"/>
                    <CardTitle className="font-headline text-3xl text-green-600">¡Presupuesto Enviado!</CardTitle>
                    <CardDescription className="text-lg">Gracias por tu interés. Un representante se pondrá en contacto contigo a la brevedad para afinar los detalles.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button className="w-full" onClick={() => { setStep(1); setClienteNombre(''); setSelectedMenuId(''); setSelectedPaqueteId(''); }}>Volver a Simular</Button>
                </CardFooter>
            </Card>
        </div>
      )
    }

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center">
                    <Wand2 className="w-12 h-12 mx-auto text-primary mb-2"/>
                    <CardTitle className="font-headline text-3xl">Simulador de Presupuesto</CardTitle>
                    <CardDescription className="text-lg">Sigue los pasos para obtener una cotización estimada para tu evento.</CardDescription>
                    <Progress value={(step / 3) * 100} className="w-full h-2 mt-4" />
                </CardHeader>
                
                <CardContent className="min-h-[300px] py-6 px-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Users className="text-primary w-5 h-5"/>Paso 1: Tu Evento</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cliente-nombre">Tu Nombre Completo *</Label>
                                    <Input id="cliente-nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ingresa tu nombre y apellido" required/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cantidad-invitados">Cantidad de Invitados *</Label>
                                    <Input id="cantidad-invitados" type="number" value={cantidadInvitados} onChange={e => setCantidadInvitados(Number(e.target.value) || 0)} min="1" required/>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="text-primary w-5 h-5"/>Paso 2: Elige tu Paquete</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paquete-select">Paquete de Servicios</Label>
                                    <Select value={selectedPaqueteId} onValueChange={setSelectedPaqueteId}>
                                        <SelectTrigger id="paquete-select"><SelectValue placeholder="Selecciona un paquete..."/></SelectTrigger>
                                        <SelectContent>{config?.paquetes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="menu-select" className="flex items-center gap-1"><ChefHat className="w-4 h-4"/>Opción de Catering</Label>
                                    <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                                        <SelectTrigger id="menu-select"><SelectValue placeholder="Selecciona un menú..."/></SelectTrigger>
                                        <SelectContent>{config?.menus.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6 text-center animate-in fade-in-20">
                             <h3 className="font-semibold text-lg flex items-center justify-center gap-2"><FileText className="text-primary w-5 h-5"/>Paso 3: Tu Presupuesto Estimado</h3>
                             {(costoEstimado > 0 && config?.mostrarPrecios) ? (
                                <div className="p-6 bg-primary/5 rounded-lg">
                                    <p className="text-lg text-muted-foreground">Costo Total Estimado</p>
                                    <p className="text-5xl font-bold text-primary tracking-tight my-2">{formatCurrency(costoEstimado)}</p>
                                    {config?.descuentoGeneral && <p className="text-sm text-muted-foreground">Incluye un {config.descuentoGeneral}% de descuento promocional.</p>}
                                </div>
                            ) : (
                                <p className="text-muted-foreground py-8">Selecciona un paquete y un menú para ver la estimación.</p>
                            )}
                            <p className="text-xs text-muted-foreground">Este es un precio estimado y puede variar. Para continuar, haz clic en "Solicitar Presupuesto".</p>
                        </div>
                    )}
                </CardContent>
                 
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                        <ArrowLeft className="w-4 h-4 mr-2"/>Anterior
                    </Button>
                    {step < 3 ? (
                        <Button onClick={nextStep} disabled={(step === 1 && (!clienteNombre.trim() || cantidadInvitados <= 0)) || (step === 2 && !selectedPaqueteId && !selectedMenuId)}>
                            Siguiente<ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    ) : (
                        <Button onClick={handleGenerateLead} disabled={isGeneratingLead || !costoEstimado}>
                            {isGeneratingLead ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                            Solicitar Presupuesto
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
