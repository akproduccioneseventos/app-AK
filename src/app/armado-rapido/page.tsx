
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Wand2, Users, FileText, MessageSquare, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function ArmadoRapidoPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [cantidadInvitados, setCantidadInvitados] = useState<number>(50);
    const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string>('');

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedConfig = await getArmadoRapidoConfig();
            setConfig(fetchedConfig);
            if (fetchedConfig.paquetes.length > 0) {
                setPaqueteSeleccionadoId(fetchedConfig.paquetes[0].id);
            }
        } catch (err: any) {
            setError('No se pudo cargar la configuración de presupuestos rápidos.');
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const paqueteActual = useMemo(() => {
        return config?.paquetes.find(p => p.id === paqueteSeleccionadoId);
    }, [config, paqueteSeleccionadoId]);

    const calculos = useMemo(() => {
        if (!paqueteActual || cantidadInvitados <= 0) {
            return { costoTotal: 0, costoConDescuento: 0, montoDescuento: 0 };
        }
        
        let costoTotalPaquete = 0;
        paqueteActual.serviciosIncluidos.forEach(servicio => {
            switch(servicio.calculationMethod) {
                case 'fijo':
                    costoTotalPaquete += servicio.costoFijo || 0;
                    break;
                case 'por_persona':
                    costoTotalPaquete += (servicio.costoPorPersona || 0) * cantidadInvitados;
                    break;
                case 'ratio':
                    if (servicio.invitadosPorUnidad && servicio.costoPorUnidad && servicio.invitadosPorUnidad > 0) {
                        const unidadesNecesarias = Math.ceil(cantidadInvitados / servicio.invitadosPorUnidad);
                        costoTotalPaquete += unidadesNecesarias * servicio.costoPorUnidad;
                    }
                    break;
                case 'escalonado':
                    if(servicio.tramosDePrecio && servicio.tramosDePrecio.length > 0) {
                        const tramosOrdenados = [...servicio.tramosDePrecio].sort((a,b) => a.hasta - b.hasta);
                        let tramoAplicado = tramosOrdenados.find(t => cantidadInvitados <= t.hasta);
                        if (!tramoAplicado) {
                           tramoAplicado = tramosOrdenados[tramosOrdenados.length - 1];
                        }
                        costoTotalPaquete += tramoAplicado.precio || 0;
                    }
                    break;
                default:
                    // Fallback for old model
                    costoTotalPaquete += (servicio.precioBase || 0);
                    costoTotalPaquete += (servicio.precioPorPersona || 0) * cantidadInvitados;
                    break;
            }
        });

        let montoDescuento = 0;
        if (config?.descuentoGeneral && config.descuentoGeneral > 0) {
            montoDescuento = (costoTotalPaquete * config.descuentoGeneral) / 100;
        }
        const costoConDescuento = costoTotalPaquete - montoDescuento;

        return { costoTotal: costoTotalPaquete, costoConDescuento, montoDescuento };
    }, [paqueteActual, cantidadInvitados, config?.descuentoGeneral]);

    const handleGenerarPresupuesto = async () => {
        if (!paqueteActual) return;
        
        toast({
            title: "Generando tu presupuesto...",
            description: "Espera un momento mientras preparamos tu cotización."
        });

        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual.nombre,
            tipoEvento: 'Evento desde Armado Rápido',
            cantidadInvitados: cantidadInvitados,
            costoEstimado: calculos.costoConDescuento,
            clienteNombre: `Prospecto de ${paqueteActual.nombre}`,
            salon: 'A confirmar'
        });

        if (result.success) {
            toast({
                title: "¡Presupuesto Generado!",
                description: `Un asesor se contactará contigo. ID de seguimiento: ${result.leadId?.substring(0, 8)}`,
                duration: 9000,
            });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };


    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }
    
    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-center text-destructive">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
             <header className="absolute top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Wand2 className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-bold font-headline">Armado Rápido de Presupuesto</h1>
                    </div>
                     <Link href="/" passHref>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
                        </Button>
                    </Link>
                </div>
            </header>
            
            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl pt-24">
                {/* Columna de Configuración */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Armá tu presupuesto en 2 pasos</CardTitle>
                        <CardDescription>Ajusta los invitados y elige un paquete para ver una cotización al instante.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="invitados" className="text-lg flex items-center gap-2">
                                <Users className="text-primary"/> 1. Cantidad de Invitados
                            </Label>
                            <Input 
                                id="invitados" 
                                type="number" 
                                value={cantidadInvitados} 
                                onChange={(e) => setCantidadInvitados(Number(e.target.value))} 
                                placeholder="Ej: 50" 
                                className="h-12 text-xl text-center"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paquete" className="text-lg flex items-center gap-2">
                                <FileText className="text-primary"/> 2. Elige tu Paquete
                            </Label>
                            <Select value={paqueteSeleccionadoId} onValueChange={setPaqueteSeleccionadoId}>
                                <SelectTrigger className="h-12 text-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {config?.paquetes.map(pkg => (
                                        <SelectItem key={pkg.id} value={pkg.id} className="text-lg">{pkg.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Columna de Resultados */}
                {paqueteActual ? (
                    <Card className="shadow-xl border-t-4 border-primary">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl text-primary">{paqueteActual.nombre}</CardTitle>
                            <CardDescription>Este es el resumen de tu selección.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Servicios Incluidos:</h4>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                    {paqueteActual.serviciosIncluidos.map(s => <li key={s.id}>{s.nombre}</li>)}
                                </ul>
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                {calculos.montoDescuento > 0 && <div className="flex justify-between items-center text-destructive"><span className="flex items-center gap-1"><Tag className="w-4 h-4"/> Descuento ({config?.descuentoGeneral}%)</span> <span className="font-semibold">-{formatCurrency(calculos.montoDescuento)}</span></div>}
                                <div className="flex justify-between items-center text-2xl font-bold pt-2 border-t text-primary"><span >TOTAL ESTIMADO:</span> <span>{formatCurrency(calculos.costoConDescuento)}</span></div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button size="lg" className="w-full" onClick={handleGenerarPresupuesto}>
                                <MessageSquare className="mr-2"/>¡Contactar a un Asesor!
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card className="flex items-center justify-center text-muted-foreground h-full">
                        <p>Selecciona un paquete para ver los detalles.</p>
                    </Card>
                )}
            </main>
        </div>
    );
}
