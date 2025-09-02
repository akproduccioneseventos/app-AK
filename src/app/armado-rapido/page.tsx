
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Wand2, Users, ChefHat, Package, Check, ArrowRight, User, Phone, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';


export default function ArmadoRapidoPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [paso, setPaso] = useState(1);
    
    // Paso 1 State
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteCelular, setClienteCelular] = useState('');

    // Paso 2 State
    const [numAdultos, setNumAdultos] = useState(50);
    const [numJovenesYNinos, setNumJovenesYNinos] = useState(0);

    // Paso 3 State
    const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<Set<string>>(new Set());
    const [platoPrincipalId, setPlatoPrincipalId] = useState<string | undefined>(undefined);
    const [menuInfantilId, setMenuInfantilId] = useState<string | undefined>(undefined);

    // Paso 4 State
    const [paqueteServiciosId, setPaqueteServiciosId] = useState<string>('');
    
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    
    const isPaso1Valid = useMemo(() => {
        const nombreValido = clienteNombre.trim().length >= 3;
        const celularValido = /^\d{8,15}$/.test(clienteCelular.replace(/\s/g, ''));
        return nombreValido && celularValido;
    }, [clienteNombre, clienteCelular]);
    
    const isPaso3Valid = useMemo(() => {
        const entradasOk = entradasSeleccionadas.size === 2;
        const platoPrincipalOk = !!platoPrincipalId;
        const menuInfantilOk = numJovenesYNinos > 0 ? !!menuInfantilId : true;
        return entradasOk && platoPrincipalOk && menuInfantilOk;
    }, [entradasSeleccionadas.size, platoPrincipalId, menuInfantilId, numJovenesYNinos]);

    const handlePaso3Next = () => {
        if (!isPaso3Valid) {
            let errorMsg = "Por favor, completa la selección: ";
            const errors = [];
            if (entradasSeleccionadas.size !== 2) errors.push("debes elegir exactamente 2 entradas");
            if (!platoPrincipalId) errors.push("debes elegir 1 plato principal");
            if (numJovenesYNinos > 0 && !menuInfantilId) errors.push("debes elegir 1 menú infantil");
            
            toast({
                title: "Selección Incompleta",
                description: errorMsg + errors.join(', ') + ".",
                variant: "destructive"
            });
            return;
        }
        setPaso(4);
    };

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
    
    const opcionesMenu = useMemo(() => config?.menus?.[0], [config]);
    const paqueteActual = useMemo(() => config?.paquetes.find(p => p.id === paqueteServiciosId), [config, paqueteServiciosId]);
    
    const handleGenerarPresupuesto = async () => {
        setIsGeneratingLead(true);
        toast({ title: "Generando tu presupuesto...", description: "Espera un momento." });

        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual?.nombre || 'Sin paquete',
            nombreMenu: 'Catering Personalizado',
            tipoEvento: 'Evento desde Presupuesto al Instante',
            cantidadInvitados: numAdultos + numJovenesYNinos,
            costoEstimado: 0, // Placeholder
            clienteNombre: clienteNombre || 'Prospecto Web',
            salon: 'A confirmar'
        });

        if (!result.success) {
            toast({ title: "Error", description: result.error || "No se pudo generar el prospecto.", variant: "destructive" });
            setIsGeneratingLead(false);
            return;
        }
        
        // Prepare data for the summary page
        const resumenData: any = {
            cliente: clienteNombre,
            invitados: `${numAdultos} Adultos, ${numJovenesYNinos} Jóvenes/Niños`,
            items: [],
            total: 0,
            regalos: [],
            descuento: config?.descuentoGeneral || 0,
        };

        const entradas = Array.from(entradasSeleccionadas).map(id => opcionesMenu?.serviciosIncluidos.find(s => s.id === id));
        const platoPrincipal = opcionesMenu?.serviciosIncluidos.find(s => s.id === platoPrincipalId);
        const menuInfantil = opcionesMenu?.serviciosIncluidos.find(s => s.id === menuInfantilId);

        let subtotal = 0;
        
        entradas.forEach(item => {
            if (!item) return;
            const itemTotal = item.precioFijo * numAdultos;
            resumenData.items.push({ desc: `Entrada: ${item.nombre}` });
            subtotal += itemTotal;
        });

        if (platoPrincipal) {
            const itemTotal = platoPrincipal.precioFijo * numAdultos;
            resumenData.items.push({ desc: `Plato Principal: ${platoPrincipal.nombre}` });
            subtotal += itemTotal;
        }
        if (menuInfantil && numJovenesYNinos > 0) {
            const itemTotal = menuInfantil.precioFijo * numJovenesYNinos;
            resumenData.items.push({ desc: `Menú Infantil: ${menuInfantil.nombre}` });
            subtotal += itemTotal;
        }

        if (paqueteActual) {
            const totalInvitados = numAdultos + numJovenesYNinos;
            paqueteActual.serviciosIncluidos.forEach(servicio => {
                let costoServicio = 0;
                switch(servicio.calculationMethod) {
                    case 'fijo': costoServicio = servicio.precioBase || 0; break;
                    case 'porPersona': costoServicio = (servicio.precioPorPersona || 0) * totalInvitados; break;
                    case 'ratio': 
                        if (servicio.invitadosPorUnidad && servicio.invitadosPorUnidad > 0) {
                            const unidades = Math.ceil(totalInvitados / servicio.invitadosPorUnidad);
                            costoServicio = unidades * (servicio.precioBase || 0);
                        }
                        break;
                    case 'tramos':
                        const tramo = servicio.tramosDePrecio?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
                        if(tramo) costoServicio = tramo.precio;
                        break;
                    default: costoServicio = servicio.precioFijo || servicio.precioBase || 0;
                }

                if (servicio.esRegalo) {
                    resumenData.regalos.push({ desc: servicio.nombre, total: formatCurrency(costoServicio) });
                } else {
                    resumenData.items.push({ desc: servicio.nombre });
                    subtotal += costoServicio;
                }
            });
        }
        
        resumenData.total = subtotal;

        const queryParams = new URLSearchParams({ data: JSON.stringify(resumenData) });
        router.push(`/armado-rapido/resumen?${queryParams.toString()}`);
    };

    const renderPaso = () => {
        switch(paso) {
            case 1:
                return (
                  <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 1: Tus Datos</CardTitle><CardDescription>Ingresa tu nombre y celular para contactarte.</CardDescription></CardHeader>
                     <CardContent className="space-y-4">
                          <div><Label htmlFor="cliente-nombre" className="flex items-center gap-1"><User/> Nombre Completo (mín. 3 letras)</Label><Input id="cliente-nombre" type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Ej: Maria Gonzalez"/></div>
                          <div><Label htmlFor="cliente-celular" className="flex items-center gap-1"><Phone/> Celular (solo números, 8-15 dígitos)</Label><Input id="cliente-celular" type="tel" value={clienteCelular} onChange={(e) => setClienteCelular(e.target.value)} placeholder="Ej: 099123456"/></div>
                     </CardContent>
                     <CardFooter><Button onClick={() => setPaso(2)} disabled={!isPaso1Valid} className="w-full">Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 2:
                return (
                  <motion.div key="paso2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 2: Cantidad de Invitados</CardTitle><CardDescription>¿Cuántos adultos y cuántos adolescentes/niños asistirán?</CardDescription></CardHeader>
                     <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="adultos" className="flex items-center gap-1"><User/> Adultos</Label><Input id="adultos" type="number" value={numAdultos} onChange={(e) => setNumAdultos(Number(e.target.value) || 0)} min="0"/></div>
                            <div><Label htmlFor="jovenes_ninos" className="flex items-center gap-1"><Users/> Adolescentes y Niños</Label><Input id="jovenes_ninos" type="number" value={numJovenesYNinos} onChange={(e) => setNumJovenesYNinos(Number(e.target.value) || 0)} min="0"/></div>
                          </div>
                     </CardContent>
                     <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(1)}>Anterior</Button><Button onClick={() => setPaso(3)} disabled={(numAdultos + numJovenesYNinos) <= 0}>Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 3:
                 return (
                    <motion.div key="paso3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 3: Arma tu Menú</CardTitle><CardDescription>Elige las opciones para tu evento.</CardDescription></CardHeader>
                       <CardContent className="space-y-6">
                           <div className="space-y-2">
                                <Label className="font-semibold text-lg">1. Entradas (selecciona exactamente 2 opciones)</Label>
                                {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Entrada').map(s=>(
                                    <div key={s.id} className="flex items-center gap-3 p-2 border rounded-md">
                                        <Checkbox id={`e-${s.id}`} checked={entradasSeleccionadas.has(s.id)} onCheckedChange={()=>{setEntradasSeleccionadas(p=>{const n=new Set(p); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); while(n.size > 2) { n.delete(n.values().next().value); } return n;})}}/>
                                        <Label htmlFor={`e-${s.id}`} className="flex-grow font-normal">{s.nombre}</Label>
                                    </div>
                                ))}
                           </div>
                           
                            <div className="space-y-2">
                                <Label className="font-semibold text-lg">2. Platos Principales (para {numAdultos} adultos, elige 1)</Label>
                                <RadioGroup value={platoPrincipalId} onValueChange={setPlatoPrincipalId}>
                                  {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Plato Principal').map(s=> (
                                      <Label key={s.id} htmlFor={`pp-${s.id}`} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                          <RadioGroupItem value={s.id} id={`pp-${s.id}`} />
                                          <span className="flex-grow font-normal">{s.nombre}</span>
                                      </Label>
                                  ))}
                                </RadioGroup>
                            </div>
                           {numJovenesYNinos > 0 && (
                             <div className="space-y-2">
                                <Label className="font-semibold text-lg">3. Menú Adolescentes y Niños (para {numJovenesYNinos}, elige 1)</Label>
                                 <RadioGroup value={menuInfantilId} onValueChange={setMenuInfantilId}>
                                    {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Menú Adolescente / Niño').map(s=> (
                                        <Label key={s.id} htmlFor={`pi-${s.id}`} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                            <RadioGroupItem value={s.id} id={`pi-${s.id}`} />
                                            <span className="flex-grow font-normal">{s.nombre}</span>
                                        </Label>
                                    ))}
                                 </RadioGroup>
                            </div>
                           )}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(2)}>Anterior</Button><Button onClick={handlePaso3Next} >Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div key="paso4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 4: Elige tu Combo de Servicios</CardTitle><CardDescription>Selecciona un combo de servicios adicionales (DJ, foto, etc.).</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                             <Accordion type="single" collapsible value={paqueteServiciosId} onValueChange={setPaqueteServiciosId}>
                                {config?.paquetes.map(pkg => (
                                    <AccordionItem value={pkg.id} key={pkg.id}>
                                        <AccordionTrigger className={cn("p-3 rounded-md hover:no-underline hover:bg-muted/50", paqueteServiciosId === pkg.id && 'bg-primary/10 border border-primary')}>
                                            <div className="flex items-center gap-4">
                                                <Package className="w-8 h-8 text-primary"/>
                                                <div>
                                                    <p className="text-base font-semibold text-left">{pkg.nombre}</p>
                                                </div>
                                                {paqueteServiciosId === pkg.id && <Check className="w-6 h-6 text-primary ml-auto"/>}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-3">
                                            <p className="font-semibold text-sm mb-2">Incluye:</p>
                                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                {pkg.serviciosIncluidos.map(s => <li key={s.id}>{s.nombre}</li>)}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(3)}>Anterior</Button><Button onClick={handleGenerarPresupuesto} disabled={!paqueteServiciosId || isGeneratingLead}>
                           {isGeneratingLead ? <Loader2 className="animate-spin mr-2"/> : null} 
                           {isGeneratingLead ? 'Generando...' : 'Finalizar y Ver Presupuesto'}
                        </Button></CardFooter>
                    </motion.div>
                );
        }
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-center text-destructive">{error}</div>;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div id="main-content" className="non-printable">
          <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
              <header className="fixed top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm z-10">
                  <div className="flex justify-between items-center max-w-5xl mx-auto">
                      <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary"/><h1 className="text-2xl font-bold font-headline">Mi Presupuesto al Instante</h1></div>
                      <Link href="/" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al inicio</Button></Link>
                  </div>
              </header>
              
              <main className="w-full max-w-lg pt-24">
                  <Card className="shadow-xl"><AnimatePresence mode="wait">{renderPaso()}</AnimatePresence></Card>
              </main>
          </div>
        </div>
    );
}
