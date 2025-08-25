
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Wand2, Users, FileText, MessageSquare, Tag, ChefHat, Package, Check, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

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

    const [paso, setPaso] = useState(1);
    const [cantidadInvitados, setCantidadInvitados] = useState<number>(50);
    const [menuSeleccionadoId, setMenuSeleccionadoId] = useState<string>('');
    const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string>('');
    
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedConfig = await getArmadoRapidoConfig();
            setConfig(fetchedConfig);
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
    
    const menuActual = useMemo((): MenuArmadoRapido | undefined => {
      if (!config || !config.menus) return undefined;
      return config.menus.find(m => m.id === menuSeleccionadoId);
    }, [config, menuSeleccionadoId]);
    
    const paqueteActual = useMemo((): PaqueteArmadoRapido | undefined => {
      if (!config || !config.paquetes) return undefined;
      return config.paquetes.find(p => p.id === paqueteSeleccionadoId);
    }, [config, paqueteSeleccionadoId]);

    const costoMenuPorPersona = useMemo(() => {
        if (!menuActual) return 0;
        return menuActual.serviciosIncluidos.reduce((sum, s) => sum + (s.precioFijo || 0), 0);
    }, [menuActual]);

    const calculos = useMemo(() => {
      const costoTotalMenu = costoMenuPorPersona * cantidadInvitados;
      const costoTotalPaquete = paqueteActual?.serviciosIncluidos.reduce((sum, s) => sum + (s.precioFijo || 0), 0) || 0;
      const costoTotal = costoTotalMenu + costoTotalPaquete;
      const montoDescuento = config?.descuentoGeneral ? (costoTotal * config.descuentoGeneral) / 100 : 0;
      const costoConDescuento = costoTotal - montoDescuento;

      return { costoTotalMenu, costoTotalPaquete, costoTotal, montoDescuento, costoConDescuento };
    }, [menuActual, paqueteActual, cantidadInvitados, config?.descuentoGeneral, costoMenuPorPersona]);

    const handleGenerarPresupuesto = async () => {
        if (!paqueteActual) return;
        setIsGeneratingLead(true);
        toast({ title: "Generando tu presupuesto...", description: "Espera un momento." });
        
        const nombreMenuSeleccionado = menuActual ? menuActual.nombre : "Sin menú de catering";

        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual.nombre,
            nombreMenu: nombreMenuSeleccionado,
            tipoEvento: 'Evento desde Armado Rápido',
            cantidadInvitados: cantidadInvitados,
            costoEstimado: calculos.costoConDescuento,
            clienteNombre: `Prospecto de ${paqueteActual.nombre}`,
            salon: 'A confirmar'
        });
        setIsGeneratingLead(false);
        if (result.success) {
            toast({ title: "¡Presupuesto Generado!", description: `Un asesor se contactará contigo. ID de seguimiento: ${result.leadId?.substring(0, 8)}`, duration: 9000 });
            setPaso(4); // Go to success step
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    const renderPaso = () => {
        switch(paso) {
            case 1:
                return (
                  <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 1: Cantidad de Invitados</CardTitle><CardDescription>¿Para cuántas personas es el evento?</CardDescription></CardHeader>
                     <CardContent className="space-y-2">
                          <Label htmlFor="invitados" className="text-lg flex items-center gap-2"><Users className="text-primary"/> Ingresa el número de invitados</Label>
                          <Input id="invitados" type="number" value={cantidadInvitados} onChange={(e) => setCantidadInvitados(Number(e.target.value) || 0)} placeholder="Ej: 50" className="h-12 text-xl text-center"/>
                     </CardContent>
                     <CardFooter><Button onClick={() => setPaso(2)} disabled={cantidadInvitados <= 0} className="w-full">Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 2:
                 return (
                    <motion.div key="paso2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 2: Elige tu Paquete de Servicios</CardTitle><CardDescription>Selecciona un combo de servicios básicos.</CardDescription></CardHeader>
                       <CardContent className="space-y-4">
                            {config?.paquetes?.map(pkg => (
                                <Card key={pkg.id} onClick={() => setPaqueteSeleccionadoId(pkg.id)} className={`cursor-pointer transition-all ${paqueteSeleccionadoId === pkg.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                                        <Package className="w-8 h-8 text-primary"/>
                                        <div><CardTitle>{pkg.nombre}</CardTitle><CardDescription>{(pkg.serviciosIncluidos || []).map(s => s.nombre).join(', ')}</CardDescription></div>
                                        {paqueteSeleccionadoId === pkg.id && <Check className="w-6 h-6 text-primary ml-auto"/>}
                                    </CardHeader>
                                </Card>
                            ))}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(1)}>Anterior</Button><Button onClick={() => setPaso(3)} disabled={!paqueteSeleccionadoId}>Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key="paso3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 3: Elige tu Menú</CardTitle><CardDescription>Selecciona una opción gastronómica.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            {config?.menus?.map(menu => (
                                <Card key={menu.id} onClick={() => setMenuSeleccionadoId(menu.id)} className={`cursor-pointer transition-all ${menuSeleccionadoId === menu.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                                        <ChefHat className="w-8 h-8 text-primary"/>
                                        <div>
                                            <CardTitle>{menu.nombre}</CardTitle>
                                            <CardDescription>{(menu.serviciosIncluidos || []).map(s => s.nombre).join(', ')}</CardDescription>
                                        </div>
                                        {menuSeleccionadoId === menu.id && <Check className="w-6 h-6 text-primary ml-auto"/>}
                                    </CardHeader>
                                </Card>
                            ))}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(2)}>Anterior</Button><Button onClick={handleGenerarPresupuesto} disabled={!menuSeleccionadoId || isGeneratingLead}>{isGeneratingLead ? <Loader2 className="animate-spin mr-2"/> : null} Finalizar y Cotizar</Button></CardFooter>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div key="paso4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <CardHeader className="text-center"><Check className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full p-2"/><CardTitle className="font-headline text-2xl mt-4">¡Listo!</CardTitle><CardDescription>Hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo a la brevedad.</CardDescription></CardHeader>
                        <CardContent><Button onClick={() => {setPaso(1); setMenuSeleccionadoId(''); setPaqueteSeleccionadoId('');}} className="w-full">Crear otro presupuesto</Button></CardContent>
                    </motion.div>
                )
        }
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-center text-destructive">{error}</div>;

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
             <header className="absolute top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary"/><h1 className="text-2xl font-bold font-headline">Armado Rápido de Presupuesto</h1></div>
                     <Link href="/" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al inicio</Button></Link>
                </div>
            </header>
            
            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl pt-24">
                <Card className="shadow-xl"><AnimatePresence mode="wait">{renderPaso()}</AnimatePresence></Card>
                <Card className="shadow-xl border-t-4 border-primary">
                    <CardHeader><CardTitle className="font-headline text-2xl text-primary">Resumen de tu Selección</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-lg"><span>Invitados:</span><span className="font-bold">{cantidadInvitados}</span></div>
                        <Separator/>
                        <div className="space-y-2">
                           <h4 className="font-semibold">Paquete de Servicios:</h4>
                           {paqueteActual ? <div className="flex justify-between items-center"><span>{paqueteActual.nombre}</span><span>{formatCurrency(calculos.costoTotalPaquete)}</span></div> : <p className="text-sm text-muted-foreground">Selecciona un paquete...</p>}

                           <h4 className="font-semibold mt-2">Menú de Catering:</h4>
                           {menuActual ? <div className="flex justify-between items-center"><span>{menuActual.nombre} <span className="text-xs text-muted-foreground">({formatCurrency(costoMenuPorPersona)} p/p)</span></span><span>{formatCurrency(calculos.costoTotalMenu)}</span></div> : <p className="text-sm text-muted-foreground">Selecciona un menú...</p>}
                        </div>
                        <Separator/>
                        <div className="space-y-2 pt-2">
                            {calculos.montoDescuento > 0 && <div className="flex justify-between items-center text-destructive"><span className="flex items-center gap-1"><Tag className="w-4 h-4"/> Descuento ({config?.descuentoGeneral}%)</span> <span className="font-semibold">-{formatCurrency(calculos.montoDescuento)}</span></div>}
                            <div className="flex justify-between items-center text-2xl font-bold pt-2 border-t text-primary"><span>TOTAL ESTIMADO:</span><span>{formatCurrency(calculos.costoConDescuento)}</span></div>
                        </div>
                    </CardContent>
                    <CardFooter><p className="text-xs text-muted-foreground">Este es un costo estimado. Un asesor confirmará el precio final.</p></CardFooter>
                </Card>
            </main>
        </div>
    );
}

