
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Wand2, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);

export default function ArmadoRapidoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [servicios, setServicios] = useState<ServicioEmpresa[]>([]);
    
    // Form state
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    const [selectedMenuId, setSelectedMenuId] = useState<string>('');
    const [cantidadInvitados, setCantidadInvitados] = useState<number>(50);
    const [clienteNombre, setClienteNombre] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    const [costoEstimado, setCostoEstimado] = useState<number | null>(null);
    
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
    
    const calcularCosto = useCallback(() => {
        if (!config || !servicios.length) return 0;
        
        let costoTotal = 0;
        const paqueteSeleccionado = config.paquetes.find(p => p.id === selectedPaqueteId);
        const menuSeleccionado = config.menus.find(m => m.id === selectedMenuId);

        const allServiciosIds = new Set<string>();

        if (paqueteSeleccionado) {
            paqueteSeleccionado.serviciosIncluidos.forEach(s => {
                if (!s.esRegalo) allServiciosIds.add(s.id);
            });
        }
        if (menuSeleccionado) {
             menuSeleccionado.serviciosIncluidos.forEach(s => {
                if (!s.esRegalo) allServiciosIds.add(s.id);
            });
        }

        allServiciosIds.forEach(servicioId => {
            const servicio = servicios.find(s => s.id === servicioId);
            if (servicio) {
                if (servicio.calculationMethod === 'porPersona' && servicio.precioPorPersona) {
                    costoTotal += servicio.precioPorPersona * cantidadInvitados;
                } else {
                    costoTotal += servicio.precioVenta || servicio.precioBase || 0;
                }
            }
        });
        
        // Apply general discount if it exists
        if (config.descuentoGeneral && config.descuentoGeneral > 0) {
            costoTotal *= (1 - (config.descuentoGeneral / 100));
        }

        return costoTotal;
    }, [config, servicios, selectedPaqueteId, selectedMenuId, cantidadInvitados]);
    
    useEffect(() => {
        if (!isLoading) {
            const costo = calcularCosto();
            setCostoEstimado(costo);
        }
    }, [isLoading, calcularCosto]);
    
    const handleGenerateLead = async () => {
        if (!clienteNombre.trim()) {
            toast({ title: "Falta tu nombre", variant: "destructive"});
            return;
        }
        if (!costoEstimado) {
            toast({ title: "Costo no calculado", variant: "destructive"});
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
                toast({title: "¡Presupuesto Enviado!", description: "Gracias por tu interés. Un representante se pondrá en contacto contigo a la brevedad."});
                // Reset form or redirect
                setClienteNombre('');
                setSelectedPaqueteId('');
                setSelectedMenuId('');
            } else {
                throw new Error(result.error);
            }
        } catch(e: any) {
             toast({ title: "Error al enviar", description: e.message, variant: "destructive" });
        } finally {
            setIsGeneratingLead(false);
        }
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    }
    
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center">
                    <Wand2 className="w-12 h-12 mx-auto text-primary mb-2"/>
                    <CardTitle className="font-headline text-3xl">Simulador de Presupuesto al Instante</CardTitle>
                    <CardDescription className="text-lg">Selecciona un paquete de servicios y un menú para obtener una cotización estimada.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="paquete-select">Paquete de Servicios</Label>
                            <Select value={selectedPaqueteId} onValueChange={setSelectedPaqueteId}>
                                <SelectTrigger id="paquete-select"><SelectValue placeholder="Selecciona un paquete..."/></SelectTrigger>
                                <SelectContent>{config?.paquetes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="menu-select">Opción de Catering</Label>
                            <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                                <SelectTrigger id="menu-select"><SelectValue placeholder="Selecciona un menú..."/></SelectTrigger>
                                <SelectContent>{config?.menus.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="cantidad-invitados">Cantidad de Invitados</Label>
                        <Input id="cantidad-invitados" type="number" value={cantidadInvitados} onChange={e => setCantidadInvitados(Number(e.target.value) || 0)} min="1"/>
                    </div>

                    {costoEstimado !== null && config?.mostrarPrecios && (
                        <Card className="text-center p-4 bg-primary/5">
                            <CardDescription>Costo Total Estimado</CardDescription>
                            <p className="text-4xl font-bold text-primary">{formatCurrency(costoEstimado)}</p>
                            {config.descuentoGeneral && <CardDescription>Incluye un {config.descuentoGeneral}% de descuento general.</CardDescription>}
                        </Card>
                    )}
                </CardContent>
                 <CardFooter className="flex-col items-stretch gap-4 pt-6 border-t">
                     <div className="space-y-2">
                        <Label htmlFor="cliente-nombre">Tu Nombre</Label>
                        <Input id="cliente-nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ingresa tu nombre completo"/>
                    </div>
                    <Button onClick={handleGenerateLead} disabled={isGeneratingLead || !clienteNombre.trim() || !costoEstimado}>
                        {isGeneratingLead ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : null}
                        Solicitar Presupuesto Detallado
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
