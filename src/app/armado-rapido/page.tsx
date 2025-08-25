
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Wand2, Users, FileText, MessageSquare, Tag, ChefHat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu } from '@/types/catering';

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
    const [catalogoServicios, setCatalogoServicios] = useState<ServicioEmpresa[]>([]);
    const [menusDisponibles, setMenusDisponibles] = useState<FullMenu[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [cantidadInvitados, setCantidadInvitados] = useState<number>(50);
    const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string>('');
    const [menuSeleccionadoId, setMenuSeleccionadoId] = useState<string>('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [fetchedConfig, fetchedServicios, fetchedMenus] = await Promise.all([
                getArmadoRapidoConfig(),
                getServiciosEmpresa(),
                getMenus(),
            ]);
            setConfig(fetchedConfig);
            setCatalogoServicios(fetchedServicios);
            setMenusDisponibles(fetchedMenus);

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
        loadData();
    }, [loadData]);

    const paqueteActual = useMemo((): PaqueteArmadoRapido | undefined => {
        return config?.paquetes.find(p => p.id === paqueteSeleccionadoId);
    }, [config, paqueteSeleccionadoId]);
    
    // Reset menu selection when package changes
    useEffect(() => {
        setMenuSeleccionadoId('');
    }, [paqueteSeleccionadoId]);

    const calculos = useMemo(() => {
        if (!paqueteActual || cantidadInvitados <= 0) {
            return { costoTotal: 0, costoConDescuento: 0, montoDescuento: 0, desglose: [] };
        }
        
        let costoServicios = 0;
        let desglose: {nombre: string, costo: number}[] = [];

        paqueteActual.serviciosIncluidos.forEach(servicio => {
            let costoServicio = 0;
            switch(servicio.calculationMethod) {
                case 'fijo':
                    costoServicio = servicio.costoFijo || 0;
                    break;
                case 'por_persona':
                    costoServicio = (servicio.costoPorPersona || 0) * cantidadInvitados;
                    break;
                case 'ratio':
                    const servicioCompleto = catalogoServicios.find(s => s.id === servicio.id);
                    const costoPorUnidad = servicioCompleto?.precioVenta || 0;
                    if (servicio.invitadosPorUnidad && costoPorUnidad && servicio.invitadosPorUnidad > 0) {
                        const unidadesNecesarias = Math.ceil(cantidadInvitados / servicio.invitadosPorUnidad);
                        costoServicio = unidadesNecesarias * costoPorUnidad;
                    }
                    break;
                case 'escalonado':
                    if(servicio.tramosDePrecio && servicio.tramosDePrecio.length > 0) {
                        const tramosOrdenados = [...servicio.tramosDePrecio].sort((a,b) => a.hasta - b.hasta);
                        let tramoAplicado = tramosOrdenados.find(t => cantidadInvitados <= t.hasta);
                        if (!tramoAplicado) tramoAplicado = tramosOrdenados[tramosOrdenados.length - 1];
                        costoServicio = tramoAplicado.precio || 0;
                    }
                    break;
            }
            costoServicios += costoServicio;
            desglose.push({nombre: servicio.nombre, costo: costoServicio});
        });

        let costoMenu = 0;
        if (paqueteActual.incluyeSeleccionMenu && menuSeleccionadoId) {
            const menu = menusDisponibles.find(m => m.id === menuSeleccionadoId);
            if (menu) {
                const costoPorPersona = menu.items.reduce((sum, item) => sum + (item.totalDishCost || 0), 0);
                costoMenu = costoPorPersona * cantidadInvitados;
                desglose.push({nombre: `Menú: ${menu.name}`, costo: costoMenu});
            }
        }

        const costoTotalPaquete = costoServicios + costoMenu;

        let montoDescuento = 0;
        if (config?.descuentoGeneral && config.descuentoGeneral > 0) {
            montoDescuento = (costoTotalPaquete * config.descuentoGeneral) / 100;
        }
        const costoConDescuento = costoTotalPaquete - montoDescuento;

        return { costoTotal: costoTotalPaquete, costoConDescuento, montoDescuento, desglose };
    }, [paqueteActual, cantidadInvitados, menuSeleccionadoId, config?.descuentoGeneral, catalogoServicios, menusDisponibles]);

    const handleGenerarPresupuesto = async () => {
        if (!paqueteActual) return;
        const menuSeleccionado = menusDisponibles.find(m => m.id === menuSeleccionadoId);
        
        toast({
            title: "Generando tu presupuesto...",
            description: "Espera un momento mientras preparamos tu cotización."
        });

        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual.nombre,
            nombreMenu: menuSeleccionado?.name,
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
                        <CardTitle className="font-headline text-2xl">Arma tu presupuesto al instante</CardTitle>
                        <CardDescription>Ajusta los invitados, elige un paquete y selecciona un menú para ver una cotización.</CardDescription>
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
                                onChange={(e) => setCantidadInvitados(Number(e.target.value) || 0)} 
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
                         {paqueteActual?.incluyeSeleccionMenu && (
                            <div className="space-y-2">
                                <Label htmlFor="menu" className="text-lg flex items-center gap-2">
                                    <ChefHat className="text-primary"/> 3. Selecciona un Menú
                                </Label>
                                <Select value={menuSeleccionadoId} onValueChange={setMenuSeleccionadoId}>
                                    <SelectTrigger className="h-12 text-xl"><SelectValue placeholder="Elige un menú..." /></SelectTrigger>
                                    <SelectContent>
                                        {menusDisponibles.map(menu => (
                                            <SelectItem key={menu.id} value={menu.id} className="text-lg">{menu.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                         )}
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
                                <h4 className="font-semibold mb-2">Desglose del Costo:</h4>
                                <ul className="text-muted-foreground space-y-1 text-sm">
                                    {calculos.desglose.map((item, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>{item.nombre}</span>
                                            <span>{formatCurrency(item.costo)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                {calculos.montoDescuento > 0 && <div className="flex justify-between items-center text-destructive"><span className="flex items-center gap-1"><Tag className="w-4 h-4"/> Descuento ({config?.descuentoGeneral}%)</span> <span className="font-semibold">-{formatCurrency(calculos.montoDescuento)}</span></div>}
                                <div className="flex justify-between items-center text-2xl font-bold pt-2 border-t text-primary"><span >TOTAL ESTIMADO:</span> <span>{formatCurrency(calculos.costoConDescuento)}</span></div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button size="lg" className="w-full" onClick={handleGenerarPresupuesto} disabled={!!(paqueteActual.incluyeSeleccionMenu && !menuSeleccionadoId)}>
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

    