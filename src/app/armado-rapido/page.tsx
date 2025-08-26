
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Wand2, Users, FileText, MessageSquare, Tag, ChefHat, Package, Check, ArrowRight, MinusCircle, PlusCircle, User, UserSquare2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

interface CantidadPlato {
  servicioId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export default function ArmadoRapidoPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [paso, setPaso] = useState(1);
    const [numAdultos, setNumAdultos] = useState(50);
    const [numJovenes, setNumJovenes] = useState(0); // Adolescentes y Niños combinados

    const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<Set<string>>(new Set());
    const [platosPrincipales, setPlatosPrincipales] = useState<CantidadPlato[]>([]);
    const [menuJovenes, setMenuJovenes] = useState<CantidadPlato[]>([]);
    const [paqueteServiciosId, setPaqueteServiciosId] = useState<string>('');
    
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true); setError(null);
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

    useEffect(() => { loadData(); }, [loadData]);

    const totalInvitados = numAdultos + numJovenes;
    
    // Filtros de servicios
    const entradasDisponibles = useMemo(() => config?.paquetes.flatMap(p => p.serviciosIncluidos).filter(s => s.categoria === 'Entrada') || [], [config]);
    const platosPrincipalesDisponibles = useMemo(() => config?.paquetes.flatMap(p => p.serviciosIncluidos).filter(s => s.categoria === 'Plato Principal') || [], [config]);
    const menusJovenesDisponibles = useMemo(() => config?.paquetes.flatMap(p => p.serviciosIncluidos).filter(s => s.categoria === 'Menú Adolescente' || s.categoria === 'Menú Niño') || [], [config]);
    const paquetesDeServicios = useMemo(() => config?.paquetes.filter(p => p.serviciosIncluidos.some(s => s.categoria === 'Servicio Adicional')) || [], [config]);
    
    const handlePlatoPrincipalChange = (servicio: ServicioIncluidoArmadoRapido, change: number) => {
        setPlatosPrincipales(prev => {
            const existing = prev.find(p => p.servicioId === servicio.id);
            if (existing) {
                const newQty = existing.cantidad + change;
                if (newQty <= 0) return prev.filter(p => p.servicioId !== servicio.id);
                return prev.map(p => p.servicioId === servicio.id ? {...p, cantidad: newQty} : p);
            } else if (change > 0) {
                return [...prev, { servicioId: servicio.id, nombre: servicio.nombre, cantidad: 1, precioUnitario: servicio.precioFijo }];
            }
            return prev;
        });
    };
    
    const handleMenuJovenesChange = (servicio: ServicioIncluidoArmadoRapido, change: number) => {
        setMenuJovenes(prev => {
            const existing = prev.find(p => p.servicioId === servicio.id);
            if (existing) {
                const newQty = existing.cantidad + change;
                if (newQty <= 0) return prev.filter(p => p.servicioId !== servicio.id);
                return prev.map(p => p.servicioId === servicio.id ? {...p, cantidad: newQty} : p);
            } else if (change > 0) {
                return [...prev, { servicioId: servicio.id, nombre: servicio.nombre, cantidad: 1, precioUnitario: servicio.precioFijo }];
            }
            return prev;
        });
    };
    
    // Calculos
    const costoEntradas = useMemo(() => Array.from(entradasSeleccionadas).reduce((sum, id) => sum + (entradasDisponibles.find(e=>e.id===id)?.precioFijo || 0), 0) * totalInvitados, [entradasSeleccionadas, entradasDisponibles, totalInvitados]);
    const costoPlatosPrincipales = useMemo(() => platosPrincipales.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0), [platosPrincipales]);
    const costoMenuJovenes = useMemo(() => menuJovenes.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0), [menuJovenes]);
    const costoPaqueteServicios = useMemo(() => paquetesDeServicios.find(p=>p.id === paqueteServiciosId)?.serviciosIncluidos.reduce((sum, s) => sum + s.precioFijo, 0) || 0, [paqueteServiciosId, paquetesDeServicios]);
    
    const costoTotal = useMemo(() => costoEntradas + costoPlatosPrincipales + costoMenuJovenes + costoPaqueteServicios, [costoEntradas, costoPlatosPrincipales, costoMenuJovenes, costoPaqueteServicios]);
    const montoDescuento = config?.descuentoGeneral ? (costoTotal * config.descuentoGeneral) / 100 : 0;
    const costoConDescuento = costoTotal - montoDescuento;

    const handleGenerarPresupuesto = async () => {
        setIsGeneratingLead(true);
        toast({ title: "Generando tu presupuesto...", description: "Espera un momento." });

        let notes = `Generado desde Armado Rápido.\nInvitados: ${totalInvitados} (A:${numAdultos}, J:${numJovenes})\n`;
        if (entradasSeleccionadas.size > 0) notes += `Entradas: ${Array.from(entradasSeleccionadas).map(id => entradasDisponibles.find(e=>e.id===id)?.nombre).join(', ')}\n`;
        if (platosPrincipales.length > 0) notes += `Platos Principales: ${platosPrincipales.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}\n`;
        if (menuJovenes.length > 0) notes += `Menú Jóvenes: ${menuJovenes.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}\n`;
        if (paqueteServiciosId) notes += `Paquete Servicios: ${paquetesDeServicios.find(p=>p.id===paqueteServiciosId)?.nombre}\n`;
        notes += `Presupuesto Estimado: ${formatCurrency(costoConDescuento)}`;
        
        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paquetesDeServicios.find(p=>p.id===paqueteServiciosId)?.nombre || "Sin paquete",
            nombreMenu: "Menú personalizado",
            tipoEvento: 'Evento desde Armado Rápido',
            cantidadInvitados: totalInvitados,
            costoEstimado: costoConDescuento,
            clienteNombre: `Prospecto de Armado Rápido`,
            salon: 'A confirmar'
        });
        setIsGeneratingLead(false);
        if (result.success) {
            toast({ title: "¡Presupuesto Generado!", description: `Un asesor se contactará contigo. ID de seguimiento: ${result.leadId?.substring(0, 8)}`, duration: 9000 });
            setPaso(4);
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    const renderPaso = () => {
        switch(paso) {
            case 1:
                return (
                  <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 1: Cantidad de Invitados</CardTitle><CardDescription>¿Cuántos adultos y cuántos jóvenes (adolescentes/niños) asistirán?</CardDescription></CardHeader>
                     <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="adultos" className="flex items-center gap-1"><User/> Adultos</Label><Input id="adultos" type="number" value={numAdultos} onChange={(e) => setNumAdultos(Number(e.target.value) || 0)} min="0"/></div>
                            <div><Label htmlFor="jovenes" className="flex items-center gap-1"><UserSquare2/> Adolescentes y Niños</Label><Input id="jovenes" type="number" value={numJovenes} onChange={(e) => setNumJovenes(Number(e.target.value) || 0)} min="0"/></div>
                          </div>
                     </CardContent>
                     <CardFooter><Button onClick={() => setPaso(2)} disabled={totalInvitados <= 0} className="w-full">Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 2:
                 return (
                    <motion.div key="paso2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 2: Arma tu Menú</CardTitle><CardDescription>Selecciona las entradas y los platos principales para los invitados.</CardDescription></CardHeader>
                       <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">Entradas (para todos los invitados)</h4>
                                <div className="space-y-2">
                                    {entradasDisponibles.map(e => (
                                        <div key={e.id} className="flex items-center space-x-2">
                                            <Checkbox id={`entrada-${e.id}`} checked={entradasSeleccionadas.has(e.id)} onCheckedChange={() => setEntradasSeleccionadas(prev => { const n = new Set(prev); if(n.has(e.id)) n.delete(e.id); else n.add(e.id); return n; })} />
                                            <Label htmlFor={`entrada-${e.id}`} className="flex justify-between w-full"><span>{e.nombre}</span><span>{formatCurrency(e.precioFijo)} p/p</span></Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Separator/>
                            <div>
                               <h4 className="font-semibold mb-2">Platos Principales (distribuye entre los {numAdultos} adultos)</h4>
                                <div className="space-y-2">
                                  {platosPrincipalesDisponibles.map(p => {
                                      const cantidad = platosPrincipales.find(pl => pl.servicioId === p.id)?.cantidad || 0;
                                      return (
                                        <div key={p.id} className="flex items-center justify-between">
                                            <Label>{p.nombre} ({formatCurrency(p.precioFijo)})</Label>
                                            <div className="flex items-center gap-1">
                                                <Button type="button" size="icon" variant="outline" className="h-6 w-6" onClick={() => handlePlatoPrincipalChange(p, -1)}><MinusCircle className="w-4 h-4"/></Button>
                                                <Input type="number" value={cantidad} readOnly className="h-6 w-12 text-center p-0"/>
                                                <Button type="button" size="icon" variant="outline" className="h-6 w-6" onClick={() => handlePlatoPrincipalChange(p, 1)}><PlusCircle className="w-4 h-4"/></Button>
                                            </div>
                                        </div>
                                      )
                                  })}
                                </div>
                            </div>
                             {numJovenes > 0 && <Separator/>}
                             {numJovenes > 0 && <div>
                               <h4 className="font-semibold mb-2">Menú Jóvenes (distribuye entre los {numJovenes} adolescentes/niños)</h4>
                                <div className="space-y-2">
                                  {menusJovenesDisponibles.map(p => {
                                      const cantidad = menuJovenes.find(pl => pl.servicioId === p.id)?.cantidad || 0;
                                      return (
                                        <div key={p.id} className="flex items-center justify-between">
                                            <Label>{p.nombre} ({formatCurrency(p.precioFijo)})</Label>
                                            <div className="flex items-center gap-1">
                                                <Button type="button" size="icon" variant="outline" className="h-6 w-6" onClick={() => handleMenuJovenesChange(p, -1)}><MinusCircle className="w-4 h-4"/></Button>
                                                <Input type="number" value={cantidad} readOnly className="h-6 w-12 text-center p-0"/>
                                                <Button type="button" size="icon" variant="outline" className="h-6 w-6" onClick={() => handleMenuJovenesChange(p, 1)}><PlusCircle className="w-4 h-4"/></Button>
                                            </div>
                                        </div>
                                      )
                                  })}
                                </div>
                            </div>}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(1)}>Anterior</Button><Button onClick={() => setPaso(3)}>Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key="paso3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 3: Elige tu Paquete de Servicios Adicionales</CardTitle><CardDescription>Selecciona un combo de servicios como discoteca, decoración, etc.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            {paquetesDeServicios.map(pkg => (
                                <Card key={pkg.id} onClick={() => setPaqueteServiciosId(pkg.id)} className={`cursor-pointer transition-all ${paqueteServiciosId === pkg.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                                    <CardHeader className="flex-row items-center gap-4 space-y-0">
                                        <Package className="w-8 h-8 text-primary"/>
                                        <div><CardTitle>{pkg.nombre}</CardTitle><CardDescription>{pkg.serviciosIncluidos.map(s => s.nombre).join(', ')}</CardDescription></div>
                                        {paqueteServiciosId === pkg.id && <Check className="w-6 h-6 text-primary ml-auto"/>}
                                    </CardHeader>
                                </Card>
                            ))}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(2)}>Anterior</Button><Button onClick={handleGenerarPresupuesto} disabled={!paqueteServiciosId || isGeneratingLead}>{isGeneratingLead ? <Loader2 className="animate-spin mr-2"/> : null} Finalizar y Cotizar</Button></CardFooter>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div key="paso4" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <CardHeader className="text-center"><Check className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full p-2"/><CardTitle className="font-headline text-2xl mt-4">¡Listo!</CardTitle><CardDescription>Hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo a la brevedad.</CardDescription></CardHeader>
                        <CardContent><Button onClick={() => {setPaso(1);}} className="w-full">Crear otro presupuesto</Button></CardContent>
                    </motion.div>
                );
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
                        <div className="flex justify-between items-center text-lg"><span>Invitados:</span><span className="font-bold">{totalInvitados}</span></div>
                        <Separator/>
                        <div className="space-y-2 text-sm">
                           <h4 className="font-semibold">Catering:</h4>
                           <div className="flex justify-between"><span>Entradas</span><span>{formatCurrency(costoEntradas)}</span></div>
                           <div className="flex justify-between"><span>Platos Principales</span><span>{formatCurrency(costoPlatosPrincipales)}</span></div>
                           <div className="flex justify-between"><span>Menú Jóvenes</span><span>{formatCurrency(costoMenuJovenes)}</span></div>
                           <h4 className="font-semibold mt-2">Paquete de Servicios:</h4>
                           <div className="flex justify-between"><span>{paquetesDeServicios.find(p=>p.id===paqueteServiciosId)?.nombre || 'No seleccionado'}</span><span>{formatCurrency(costoPaqueteServicios)}</span></div>
                        </div>
                        <Separator/>
                        <div className="space-y-2 pt-2">
                            {montoDescuento > 0 && <div className="flex justify-between items-center text-destructive"><span className="flex items-center gap-1"><Tag className="w-4 h-4"/> Descuento ({config?.descuentoGeneral}%)</span> <span className="font-semibold">-{formatCurrency(montoDescuento)}</span></div>}
                            <div className="flex justify-between items-center text-2xl font-bold pt-2 border-t text-primary"><span>TOTAL ESTIMADO:</span><span>{formatCurrency(costoConDescuento)}</span></div>
                        </div>
                    </CardContent>
                    <CardFooter><p className="text-xs text-muted-foreground">Este es un costo estimado. Un asesor confirmará el precio final.</p></CardFooter>
                </Card>
            </main>
        </div>
    );
}
