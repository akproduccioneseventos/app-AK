'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Wand2, Users, ChefHat, Package, Check, ArrowRight, User, Phone, List, DollarSign, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import { AnimatePresence, motion } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import type { ServicioEmpresa } from '@/types/empresa';


const formatCurrency = (amount?: number) => {
  if (amount === undefined || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};


export default function SimuladorDePresupuestoPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
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
            const [fetchedConfig, fetchedServices] = await Promise.all([
              getArmadoRapidoConfig(),
              getServiciosEmpresa()
            ]);
            setConfig(fetchedConfig);
            setServiciosCatalogo(fetchedServices);
        } catch (err: any) {
            setError('No se pudo cargar la configuración de presupuestos rápidos.');
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);
    
    const opcionesMenu = useMemo(() => {
        if (!config?.menus) return undefined;
        const cateringMenu = config.menus.find(m => m.id === 'menu_catering');
        if (!cateringMenu) return undefined;
        return {
            ...cateringMenu,
            serviciosIncluidos: (cateringMenu.serviciosIncluidos || []).sort((a, b) => (a.precioFijo ?? 0) - (b.precioFijo ?? 0))
        };
    }, [config]);

    const paqueteActual = useMemo(() => config?.paquetes.find(p => p.id === paqueteServiciosId), [config, paqueteServiciosId]);
    
    const calcularCostoCatering = useCallback(() => {
        let costo = 0;
        const entradas = Array.from(entradasSeleccionadas).map(id => opcionesMenu?.serviciosIncluidos.find(s => s.id === id));
        const platoPrincipal = opcionesMenu?.serviciosIncluidos.find(s => s.id === platoPrincipalId);
        const menuInfantil = opcionesMenu?.serviciosIncluidos.find(s => s.id === menuInfantilId);

        entradas.forEach(item => { if(item) costo += (item.precioFijo ?? 0) * numAdultos; });
        if (platoPrincipal) costo += (platoPrincipal.precioFijo ?? 0) * numAdultos;
        if (menuInfantil && numJovenesYNinos > 0) costo += (menuInfantil.precioFijo ?? 0) * numJovenesYNinos;
        
        return costo;
    }, [entradasSeleccionadas, opcionesMenu, platoPrincipalId, menuInfantilId, numAdultos, numJovenesYNinos]);

    const calcularCostoPaquete = useCallback((pkg: PaqueteArmadoRapido) => {
        let costo = 0;
        const totalInvitados = numAdultos + numJovenesYNinos;

        pkg.serviciosIncluidos.forEach(servicioEnPaquete => {
            if (servicioEnPaquete.esRegalo) return;

            const servicioDelCatalogo = serviciosCatalogo.find(s => s.id === servicioEnPaquete.id);
            if (!servicioDelCatalogo) return; 

            let costoServicio = 0;
            const method = servicioDelCatalogo.calculationMethod || 'fijo';
            
            switch(method) {
                case 'fijo': 
                    costoServicio = servicioDelCatalogo.precioVenta ?? 0;
                    break;
                case 'porPersona': 
                    costoServicio = (servicioDelCatalogo.precioPorPersona ?? 0) * totalInvitados; 
                    break;
                case 'ratio': 
                    const invitadosPorUnidadNum = Number(servicioDelCatalogo.invitadosPorUnidad);
                    if (invitadosPorUnidadNum > 0) {
                        const basePrice = servicioDelCatalogo.precioBase ?? servicioDelCatalogo.precioVenta ?? 0;
                        costoServicio = Math.ceil(totalInvitados / invitadosPorUnidadNum) * basePrice;
                    }
                    break;
                case 'tramos':
                    const tramos = servicioDelCatalogo.tramosDePrecio;
                    const tramo = tramos?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
                    costoServicio = tramo?.precio || 0;
                    break;
                default:
                    costoServicio = servicioDelCatalogo.precioVenta ?? 0;
            }
            costo += costoServicio;
        });
        return costo;
    }, [numAdultos, numJovenesYNinos, serviciosCatalogo]);

    const calcularDetallesPresupuesto = useCallback(() => {
        let costoCatering = 0;
        let subtotalServicios = 0;
        let costoRegalos = 0;
        const totalInvitados = numAdultos + numJovenesYNinos;
        
        const resumenData: any = {
            cliente: clienteNombre,
            invitados: `${numAdultos} Adultos${numJovenesYNinos > 0 ? `, ${numJovenesYNinos} Jóvenes/Niños` : ''}`,
            items: [],
            regalos: [],
            totalServicios: 0,
            totalRegalos: 0,
            descuentoGeneral: config?.descuentoGeneral || 0,
            montoDescuento: 0,
            ahorroTotal: 0,
            totalFinal: 0,
        };
        
        const entradas = Array.from(entradasSeleccionadas).map(id => opcionesMenu?.serviciosIncluidos.find(s => s.id === id));
        const platoPrincipal = opcionesMenu?.serviciosIncluidos.find(s => s.id === platoPrincipalId);
        const menuInfantil = opcionesMenu?.serviciosIncluidos.find(s => s.id === menuInfantilId);

        entradas.forEach(item => {
            if (!item) return;
            const costoItem = (item.precioFijo ?? 0) * numAdultos;
            costoCatering += costoItem;
            resumenData.items.push({ desc: `Entrada: ${item.nombre}`, precioUnitario: item.precioFijo, cantidad: numAdultos, total: costoItem });
        });
        if (platoPrincipal) {
            const costoItem = (platoPrincipal.precioFijo ?? 0) * numAdultos;
            costoCatering += costoItem;
            resumenData.items.push({ desc: `Plato Principal: ${platoPrincipal.nombre}`, precioUnitario: platoPrincipal.precioFijo, cantidad: numAdultos, total: costoItem });
        }
        if (menuInfantil && numJovenesYNinos > 0) {
             const costoItem = (menuInfantil.precioFijo ?? 0) * numJovenesYNinos;
            costoCatering += costoItem;
            resumenData.items.push({ desc: `Menú Infantil: ${menuInfantil.nombre}`, precioUnitario: menuInfantil.precioFijo, cantidad: numJovenesYNinos, total: costoItem });
        }
        
        subtotalServicios += costoCatering;

        if (paqueteActual) {
            paqueteActual.serviciosIncluidos.forEach(servicioEnPaquete => {
                const catalogService = serviciosCatalogo.find(s => s.id === servicioEnPaquete.id);
                if (!catalogService) return;

                if (servicioEnPaquete.esRegalo) {
                    const valorRegalo = catalogService.precioVenta ?? 0;
                    costoRegalos += valorRegalo; 
                    resumenData.regalos.push({ desc: servicioEnPaquete.nombre, total: valorRegalo });
                    return;
                }
                
                let costoServicio = 0;
                let descServicio = servicioEnPaquete.nombre;
                let cantidad = 1;
                let precioUnitario = 0;
                const method = catalogService.calculationMethod || 'fijo';

                switch(method) {
                    case 'fijo': 
                        precioUnitario = catalogService.precioVenta ?? 0;
                        costoServicio = precioUnitario;
                        break;
                    case 'porPersona': 
                        precioUnitario = catalogService.precioPorPersona ?? 0;
                        cantidad = totalInvitados;
                        costoServicio = precioUnitario * cantidad;
                        break;
                    case 'ratio': 
                        const invitadosPorUnidadNum = Number(catalogService.invitadosPorUnidad);
                        if (invitadosPorUnidadNum > 0) {
                            cantidad = Math.ceil(totalInvitados / invitadosPorUnidadNum);
                            precioUnitario = catalogService.precioBase ?? catalogService.precioVenta ?? 0;
                            costoServicio = cantidad * precioUnitario;
                            descServicio += ` (1 cada ${catalogService.invitadosPorUnidad} inv.)`;
                        }
                        break;
                    case 'tramos':
                        const tramos = catalogService.tramosDePrecio;
                        const tramo = tramos?.find(t => totalInvitados >= t.desde && totalInvitados <= t.hasta);
                        costoServicio = tramo?.precio || 0;
                        precioUnitario = costoServicio;
                        descServicio += ` (para ${totalInvitados} inv.)`;
                        break;
                    default: 
                        precioUnitario = catalogService.precioVenta ?? 0;
                        costoServicio = precioUnitario;
                }
                subtotalServicios += costoServicio;
                resumenData.items.push({ desc: descServicio, cantidad, precioUnitario, total: costoServicio });
            });
        }
        
        const montoDescuento = (subtotalServicios * (config?.descuentoGeneral || 0)) / 100;
        const ahorroTotal = costoRegalos + montoDescuento;
        const costoFinal = subtotalServicios - montoDescuento;

        resumenData.totalServicios = subtotalServicios;
        resumenData.totalRegalos = costoRegalos;
        resumenData.montoDescuento = montoDescuento;
        resumenData.ahorroTotal = ahorroTotal;
        resumenData.totalFinal = costoFinal;
        
        return { resumenData, costoFinal };
    }, [numAdultos, numJovenesYNinos, entradasSeleccionadas, platoPrincipalId, menuInfantilId, paqueteActual, opcionesMenu, clienteNombre, config, serviciosCatalogo]);

    
    const handleGenerarPresupuesto = async () => {
        setIsGeneratingLead(true);
        toast({ title: "Generando tu presupuesto...", description: "Espera un momento." });

        const { resumenData, costoFinal } = calcularDetallesPresupuesto();
        
        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual?.nombre || 'Sin paquete',
            nombreMenu: 'Catering Personalizado',
            tipoEvento: 'Evento desde Simulador de Presupuesto',
            cantidadInvitados: numAdultos + numJovenesYNinos,
            costoEstimado: costoFinal,
            clienteNombre: clienteNombre || 'Prospecto Web',
            salon: 'A confirmar'
        });

        if (!result.success) {
            toast({ title: "Error", description: result.error || "No se pudo generar el prospecto.", variant: "destructive" });
            setIsGeneratingLead(false);
            return;
        }
        
        const queryParams = new URLSearchParams({ data: JSON.stringify(resumenData) });
        router.push(`/simulador-de-presupuesto/resumen?${queryParams.toString()}`);
    };

    const renderPaso = () => {
        switch(paso) {
            case 1:
                return (
                  <motion.div key="paso1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 1: Tus Datos</CardTitle><CardDescription>Ingresa tu nombre y celular para contactarte.</CardDescription></CardHeader>
                     <CardContent className="space-y-4">
                          <div><Label htmlFor="cliente-nombre" className="flex items-center gap-1"><User/>Nombre Completo</Label><Input id="cliente-nombre" type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Ej: Maria Gonzalez"/></div>
                          <div><Label htmlFor="cliente-celular" className="flex items-center gap-1"><Phone/>Celular</Label><Input id="cliente-celular" type="tel" value={clienteCelular} onChange={(e) => setClienteCelular(e.target.value)} placeholder="Ej: 099123456"/></div>
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
                                <Label className="font-semibold text-lg">1. Entradas (elige 2)</Label>
                                {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Entrada').map(s=>(
                                    <div key={s.id} className="flex items-center gap-3 p-2 border rounded-md">
                                        <Checkbox id={`e-${s.id}`} checked={entradasSeleccionadas.has(s.id)} onCheckedChange={()=>{setEntradasSeleccionadas(p=>{const n=new Set(p); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); while(n.size > 2) { n.delete(n.values().next().value); } return n;})}}/>
                                        <Label htmlFor={`e-${s.id}`} className="flex-grow font-normal">{s.nombre}</Label>
                                        {config?.mostrarPrecios && <Badge variant="outline">{formatCurrency(s.precioFijo)} p/p</Badge>}
                                    </div>
                                ))}
                           </div>
                           
                            <div className="space-y-2">
                                <Label className="font-semibold text-lg">2. Platos Principales (elige 1)</Label>
                                <RadioGroup value={platoPrincipalId} onValueChange={setPlatoPrincipalId}>
                                  {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Plato Principal').map(s=> (
                                      <Label key={s.id} htmlFor={`pp-${s.id}`} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                          <RadioGroupItem value={s.id} id={`pp-${s.id}`} />
                                          <span className="flex-grow font-normal">{s.nombre}</span>
                                          {config?.mostrarPrecios && <Badge variant="outline">{formatCurrency(s.precioFijo)} p/p</Badge>}
                                      </Label>
                                  ))}
                                </RadioGroup>
                            </div>
                           {numJovenesYNinos > 0 && (
                             <div className="space-y-2">
                                <Label className="font-semibold text-lg">3. Menú Adolescentes y Niños (elige 1)</Label>
                                 <RadioGroup value={menuInfantilId} onValueChange={setMenuInfantilId}>
                                    {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Menú Adolescente / Niño').map(s=> (
                                        <Label key={s.id} htmlFor={`pi-${s.id}`} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                            <RadioGroupItem value={s.id} id={`pi-${s.id}`} />
                                            <span className="flex-grow font-normal">{s.nombre}</span>
                                            {config?.mostrarPrecios && <Badge variant="outline">{formatCurrency(s.precioFijo)} p/p</Badge>}
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
                const getGroupedAndSortedPackageServices = (pkg: PaqueteArmadoRapido) => {
                    const regularServices = pkg.serviciosIncluidos.filter(s => !s.esRegalo);
                    const giftServices = pkg.serviciosIncluidos.filter(s => s.esRegalo);
                    
                    const groupedRegular = regularServices.reduce((acc, service) => {
                        const catalogService = serviciosCatalogo.find(vs => vs.id === service.id);
                        const category = catalogService?.categoria || 'Otros servicios';
                        if (!acc[category]) {
                            acc[category] = [];
                        }
                        acc[category].push(service);
                        return acc;
                    }, {} as Record<string, ServicioIncluidoArmadoRapido[]>);
                    
                    const sortedCategories = Object.keys(groupedRegular).sort((a,b) => a.localeCompare(b));
                    
                    return { groupedRegular, giftServices, sortedCategories };
                  };

                return (
                    <motion.div key="paso4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 4: Elige tu Combo de Servicios</CardTitle><CardDescription>Selecciona un combo de servicios adicionales (DJ, foto, etc.).</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <RadioGroup value={paqueteServiciosId} onValueChange={setPaqueteServiciosId}>
                                {config?.paquetes.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(pkg => {
                                    const costoCatering = calcularCostoCatering();
                                    const costoPaquete = calcularCostoPaquete(pkg);
                                    const subtotal = costoCatering + costoPaquete;
                                    const totalConDescuento = subtotal * (1 - (config.descuentoGeneral || 0) / 100);
                                    const { groupedRegular, giftServices, sortedCategories } = getGroupedAndSortedPackageServices(pkg);

                                    return (
                                        <Accordion type="single" collapsible key={pkg.id}>
                                            <AccordionItem value={pkg.id} className="border-none">
                                                <Label htmlFor={`pkg-${pkg.id}`} className={cn("flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary", paqueteServiciosId === pkg.id && 'bg-primary/10 border-primary')}>
                                                    <RadioGroupItem value={pkg.id} id={`pkg-${pkg.id}`} />
                                                    <Package className="w-8 h-8 text-primary"/>
                                                    <div className="flex-grow">
                                                        <p className="text-base font-semibold">{pkg.nombre}</p>
                                                        {config?.mostrarPrecios && <p className="text-sm font-bold text-primary">{formatCurrency(totalConDescuento)}</p>}
                                                    </div>
                                                    <AccordionTrigger className="p-2 hover:no-underline [&[data-state=open]>svg]:text-primary" />
                                                </Label>
                                                <AccordionContent className="p-3 text-sm">
                                                    <div className="space-y-2">
                                                        {sortedCategories.map(category => (
                                                            <div key={category}>
                                                                <h4 className="font-semibold text-xs uppercase text-muted-foreground">{category}</h4>
                                                                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                                                    {groupedRegular[category].map(s => <li key={s.id}>{s.nombre}</li>)}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                        {giftServices.length > 0 && (
                                                             <div>
                                                                <h4 className="font-semibold text-xs uppercase text-primary">Regalos Incluidos</h4>
                                                                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                                                                    {giftServices.map(s => <li key={s.id}>{s.nombre}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )
                                })}
                            </RadioGroup>
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

    return (
        <div id="main-content" className="non-printable">
          <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
              <header className="fixed top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm z-10">
                  <div className="flex justify-between items-center max-w-5xl mx-auto">
                      <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary"/><h1 className="text-2xl font-bold font-headline">Simulador de Presupuesto</h1></div>
                  </div>
              </header>
              
              <main className="w-full max-w-lg pt-24">
                  <Card className="shadow-xl"><AnimatePresence mode="wait">{renderPaso()}</AnimatePresence></Card>
              </main>
          </div>
        </div>
    );
}
