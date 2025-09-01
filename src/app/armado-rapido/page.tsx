
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Wand2, Users, FileText, ChefHat, Package, Check, ArrowRight, MinusCircle, PlusCircle, User, UserSquare2, Phone, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
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
    
    // Paso 1 State
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteCelular, setClienteCelular] = useState('');

    // Paso 2 State
    const [numAdultos, setNumAdultos] = useState(50);
    const [numJovenes, setNumJovenes] = useState(0);

    // Paso 3 State
    const [menuBaseId, setMenuBaseId] = useState<string>('');
    const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<Set<string>>(new Set());
    const [platosPrincipales, setPlatosPrincipales] = useState<CantidadPlato[]>([]);
    const [menusInfantiles, setMenusInfantiles] = useState<CantidadPlato[]>([]);

    // Paso 4 State
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

    const totalAdultos = numAdultos;
    const totalJovenes = numJovenes;
    const totalInvitados = totalAdultos + totalJovenes;
    
    const menuActual = useMemo(() => config?.menus.find(m => m.id === menuBaseId), [config, menuBaseId]);
    const paqueteActual = useMemo(() => config?.paquetes.find(p => p.id === paqueteServiciosId), [config, paqueteServiciosId]);
    
    const costoEntradas = useMemo(() => {
        if (!menuActual) return 0;
        let total = 0;
        entradasSeleccionadas.forEach(id => {
            const servicio = menuActual.serviciosIncluidos.find(s => s.id === id);
            if (servicio) total += servicio.precioFijo * totalAdultos;
        });
        return total;
    }, [menuActual, entradasSeleccionadas, totalAdultos]);

    const costoPlatosPrincipales = useMemo(() => platosPrincipales.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0), [platosPrincipales]);
    const costoMenusInfantiles = useMemo(() => menusInfantiles.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0), [menusInfantiles]);
    
    const costoPaqueteServicios = useMemo(() => {
        if (!paqueteActual) return 0;
        return paqueteActual.serviciosIncluidos.reduce((total, servicio) => {
            let costoServicio = 0;
            switch(servicio.calculationMethod) {
                case 'fijo':
                    costoServicio = servicio.precioBase || 0;
                    break;
                case 'porPersona':
                    costoServicio = (servicio.precioPorPersona || 0) * totalInvitados;
                    break;
                case 'ratio':
                    if (servicio.invitadosPorUnidad && servicio.invitadosPorUnidad > 0) {
                        const unidadesNecesarias = Math.ceil(totalInvitados / servicio.invitadosPorUnidad);
                        costoServicio = unidadesNecesarias * (servicio.precioBase || 0);
                    }
                    break;
                case 'tramos':
                     const tramoAplicable = servicio.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
                     if (tramoAplicable) {
                         costoServicio = tramoAplicable.precio;
                     }
                    break;
                default:
                    costoServicio = servicio.precioFijo || servicio.precioBase || 0;
            }
            return total + costoServicio;
        }, 0);
    }, [paqueteActual, totalInvitados]);
    
    const costoTotal = costoEntradas + costoPlatosPrincipales + costoMenusInfantiles + costoPaqueteServicios;
    const montoDescuento = config?.descuentoGeneral ? (costoTotal * config.descuentoGeneral) / 100 : 0;
    const costoConDescuento = costoTotal - montoDescuento;

    const handleGenerarPresupuesto = async () => {
        setIsGeneratingLead(true);
        toast({ title: "Generando tu presupuesto...", description: "Espera un momento." });
        
        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual?.nombre || 'Sin paquete',
            nombreMenu: menuActual?.nombre || 'Sin menú base',
            tipoEvento: 'Evento desde Armado Rápido',
            cantidadInvitados: totalInvitados,
            costoEstimado: costoConDescuento,
            clienteNombre: clienteNombre || 'Prospecto Web',
            salon: 'A confirmar'
        });
        setIsGeneratingLead(false);
        if (result.success) {
            toast({ title: "¡Presupuesto Generado!", description: `Un asesor se contactará contigo. ID de seguimiento: ${result.leadId?.substring(0, 8)}`, duration: 9000 });
            setPaso(5);
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };
    
    const renderPaso = () => {
        switch(paso) {
            case 1: // Datos del Cliente
                return (
                  <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 1: Tus Datos</CardTitle><CardDescription>Ingresa tu nombre y celular para contactarte.</CardDescription></CardHeader>
                     <CardContent className="space-y-4">
                          <div><Label htmlFor="cliente-nombre" className="flex items-center gap-1"><User/> Nombre Completo</Label><Input id="cliente-nombre" type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Ej: Maria Gonzalez"/></div>
                          <div><Label htmlFor="cliente-celular" className="flex items-center gap-1"><Phone/> Celular</Label><Input id="cliente-celular" type="tel" value={clienteCelular} onChange={(e) => setClienteCelular(e.target.value)} placeholder="Ej: 099123456"/></div>
                     </CardContent>
                     <CardFooter><Button onClick={() => setPaso(2)} disabled={!clienteNombre || !clienteCelular} className="w-full">Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 2: // Cantidad de Invitados
                return (
                  <motion.div key="paso2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 2: Cantidad de Invitados</CardTitle><CardDescription>¿Cuántos adultos y cuántos jóvenes (adolescentes/niños) asistirán?</CardDescription></CardHeader>
                     <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="adultos" className="flex items-center gap-1"><User/> Adultos</Label><Input id="adultos" type="number" value={numAdultos} onChange={(e) => setNumAdultos(Number(e.target.value) || 0)} min="0"/></div>
                            <div><Label htmlFor="jovenes" className="flex items-center gap-1"><UserSquare2/> Adolescentes y Niños</Label><Input id="jovenes" type="number" value={numJovenes} onChange={(e) => setNumJovenes(Number(e.target.value) || 0)} min="0"/></div>
                          </div>
                     </CardContent>
                     <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(1)}>Anterior</Button><Button onClick={() => setPaso(3)} disabled={(numAdultos + numJovenes) <= 0}>Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 3: // Selección de Menú
                 return (
                    <motion.div key="paso3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 3: Arma tu Menú</CardTitle><CardDescription>Elige las opciones para tu evento.</CardDescription></CardHeader>
                       <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="font-semibold text-lg">1. Elige un Menú Base</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {config?.menus.map(menu => (
                                    <Card key={menu.id} onClick={() => setMenuBaseId(menu.id)} className={`cursor-pointer transition-all ${menuBaseId === menu.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                                        <CardHeader className="flex-row items-center gap-4 space-y-0 p-3"><ChefHat className="w-6 h-6 text-primary"/><div className="flex-grow"><CardTitle className="text-base">{menu.nombre}</CardTitle></div>{menuBaseId === menu.id && <Check className="w-5 h-5 text-primary ml-auto"/>}</CardHeader>
                                    </Card>
                                ))}
                                </div>
                            </div>
                            {menuBaseId && menuActual && (
                            <AnimatePresence>
                                <motion.div key="menu-details" initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-4 pt-4 border-t">
                                    <div className="space-y-2">
                                    <Label className="font-semibold text-lg">2. Entradas (selecciona las que desees)</Label>
                                    <p className="text-sm text-muted-foreground">Cada opción seleccionada se calculará por el total de adultos ({totalAdultos}).</p>
                                    {menuActual.serviciosIncluidos.filter(s=>s.categoria === 'Entrada').map(s=>(
                                        <div key={s.id} className="flex items-center gap-3 p-2 border rounded-md">
                                            <Checkbox id={`e-${s.id}`} checked={entradasSeleccionadas.has(s.id)} onCheckedChange={()=>{setEntradasSeleccionadas(p=>{const n=new Set(p); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); return n;})}}/>
                                            <Label htmlFor={`e-${s.id}`} className="flex-grow font-normal">{s.nombre}</Label>
                                            <span className="text-sm font-medium">{formatCurrency(s.precioFijo)} c/u</span>
                                        </div>
                                    ))}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="font-semibold text-lg">3. Platos Principales (asigna las {totalAdultos} porciones)</Label>
                                        {menuActual.serviciosIncluidos.filter(s=>s.categoria === 'Plato Principal').map(s=>{ const item=platosPrincipales.find(p=>p.servicioId===s.id); return (
                                            <div key={s.id} className="flex items-center gap-2 p-2 border rounded-md">
                                                <Label className="flex-grow">{s.nombre} - {formatCurrency(s.precioFijo)}</Label>
                                                <Input type="number" min="0" value={item?.cantidad || ''} onChange={e=>{const v=Number(e.target.value)||0; setPlatosPrincipales(p=>{const n=p.filter(i=>i.servicioId!==s.id); if(v>0) n.push({servicioId:s.id, nombre:s.nombre, cantidad:v, precioUnitario:s.precioFijo}); return n;})}} className="w-24 h-8" placeholder="0"/>
                                            </div>
                                        )})}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-semibold text-lg">4. Menú Niños/Adolescentes (asigna las {totalJovenes} porciones)</Label>
                                        {menuActual.serviciosIncluidos.filter(s=>s.categoria === 'Menú Adolescente / Niño').map(s=>{ const item=menusInfantiles.find(p=>p.servicioId===s.id); return (
                                            <div key={s.id} className="flex items-center gap-2 p-2 border rounded-md">
                                                <Label className="flex-grow">{s.nombre} - {formatCurrency(s.precioFijo)}</Label>
                                                <Input type="number" min="0" value={item?.cantidad || ''} onChange={e=>{const v=Number(e.target.value)||0; setMenusInfantiles(p=>{const n=p.filter(i=>i.servicioId!==s.id); if(v>0) n.push({servicioId:s.id, nombre:s.nombre, cantidad:v, precioUnitario:s.precioFijo}); return n;})}} className="w-24 h-8" placeholder="0"/>
                                            </div>
                                        )})}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                            )}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(2)}>Anterior</Button><Button onClick={() => setPaso(4)} disabled={!menuBaseId}>Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                    </motion.div>
                );
            case 4: // Paquete de Servicios
                return (
                    <motion.div key="paso4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 4: Elige tu Combo de Servicios</CardTitle><CardDescription>Selecciona un combo de servicios adicionales (DJ, foto, etc.).</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            {config?.paquetes.map(pkg => (
                                <Card key={pkg.id} onClick={() => setPaqueteServiciosId(pkg.id)} className={`cursor-pointer transition-all ${paqueteServiciosId === pkg.id ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}>
                                    <CardHeader className="flex-row items-center gap-4 space-y-0 p-3"><Package className="w-8 h-8 text-primary"/><div><CardTitle className="text-base">{pkg.nombre}</CardTitle><CardDescription className="text-sm">{pkg.descripcion}</CardDescription></div>{paqueteServiciosId === pkg.id && <Check className="w-6 h-6 text-primary ml-auto"/>}</CardHeader>
                                </Card>
                            ))}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(3)}>Anterior</Button><Button onClick={handleGenerarPresupuesto} disabled={!paqueteServiciosId || isGeneratingLead}>
                           {isGeneratingLead ? <Loader2 className="animate-spin mr-2"/> : null} 
                           {isGeneratingLead ? 'Generando...' : 'Finalizar y Solicitar Presupuesto'}
                        </Button></CardFooter>
                    </motion.div>
                );
            case 5: // Finalizado
                return (
                    <motion.div key="paso5" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                        <CardHeader className="text-center">
                            <FileText className="w-16 h-16 mx-auto text-primary" />
                            <CardTitle className="font-headline text-2xl mt-4">¡Listo! Tu Presupuesto está en Camino</CardTitle>
                            <CardDescription>Hemos recibido tu solicitud. Un asesor de AK Producciones se pondrá en contacto contigo a la brevedad para confirmar los detalles y enviarte el presupuesto formal.</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-2">
                           <Button onClick={() => window.location.reload()} className="w-full">Generar un Nuevo Presupuesto</Button>
                        </CardFooter>
                    </motion.div>
                );
        }
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-center text-destructive">{error}</div>;

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 print:bg-white print:p-0">
             <header className="absolute top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm print:hidden">
                <div className="flex justify-between items-center max-w-5xl mx-auto">
                    <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary"/><h1 className="text-2xl font-bold font-headline">Armado Rápido de Presupuesto</h1></div>
                     <Link href="/" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al inicio</Button></Link>
                </div>
            </header>
            
            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl pt-24 print:grid-cols-1 print:pt-4">
                <Card className="shadow-xl print:shadow-none print:border-none"><AnimatePresence mode="wait">{renderPaso()}</AnimatePresence></Card>
                <Card className="shadow-xl border-t-4 border-primary">
                    <CardHeader><CardTitle className="font-headline text-2xl text-primary">Resumen de tu Selección</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-lg"><span>Invitados:</span><span className="font-bold">{totalAdultos} Adultos / {totalJovenes} Jóvenes</span></div>
                        <Separator/>
                        <div className="space-y-2 text-sm">
                           <h4 className="font-semibold">Catering:</h4>
                           <div className="flex justify-between"><span>Entradas seleccionadas</span><span>{formatCurrency(costoEntradas)}</span></div>
                           <div className="flex justify-between"><span>Platos principales</span><span>{formatCurrency(costoPlatosPrincipales)}</span></div>
                           <div className="flex justify-between"><span>Menú niños/adolescentes</span><span>{formatCurrency(costoMenusInfantiles)}</span></div>
                           <h4 className="font-semibold mt-2">Paquete de Servicios:</h4>
                           <div className="flex justify-between"><span>{paqueteActual?.nombre || 'No seleccionado'}</span><span>{formatCurrency(costoPaqueteServicios)}</span></div>
                        </div>
                        <Separator/>
                        <div className="space-y-2 pt-2">
                            {config?.descuentoGeneral && config.descuentoGeneral > 0 && montoDescuento > 0 && <div className="flex justify-between items-center text-destructive"><span className="flex items-center gap-1">Descuento ({config?.descuentoGeneral}%)</span> <span className="font-semibold">-{formatCurrency(montoDescuento)}</span></div>}
                            <div className="flex justify-between items-center text-2xl font-bold pt-2 border-t text-primary"><span>TOTAL ESTIMADO:</span><span>{formatCurrency(costoConDescuento)}</span></div>
                        </div>
                    </CardContent>
                    <CardFooter><p className="text-xs text-muted-foreground">Este es un costo estimado. Un asesor confirmará el precio final.</p></CardFooter>
                </Card>
            </main>
        </div>
    );
}
