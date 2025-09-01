
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Wand2, Users, FileText, ChefHat, Package, Check, ArrowRight, MinusCircle, PlusCircle, User, UserSquare2, Phone, Download, Share2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido, ServicioIncluidoArmadoRapido } from '@/types/armado-rapido';
import { AnimatePresence, motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


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
    const whatsappLink = "https://wa.me/59898355530"; 

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

    const totalAdultos = numAdultos;
    const totalInvitados = totalAdultos + numJovenesYNinos;
    
    const opcionesMenu = useMemo(() => config?.menus?.[0], [config]);
    const paqueteActual = useMemo(() => config?.paquetes.find(p => p.id === paqueteServiciosId), [config, paqueteServiciosId]);
    
    const costoEntradas = useMemo(() => {
        if (!opcionesMenu) return 0;
        let total = 0;
        entradasSeleccionadas.forEach(id => {
            const servicio = opcionesMenu.serviciosIncluidos.find(s => s.id === id);
            if (servicio) total += servicio.precioFijo * totalAdultos;
        });
        return total;
    }, [opcionesMenu, entradasSeleccionadas, totalAdultos]);
    
    const costoPlatoPrincipal = useMemo(() => {
        if (!platoPrincipalId) return 0;
        const plato = opcionesMenu?.serviciosIncluidos.find(s => s.id === platoPrincipalId);
        return plato ? plato.precioFijo * numAdultos : 0;
    }, [platoPrincipalId, opcionesMenu, numAdultos]);

    const costoMenuInfantil = useMemo(() => {
        if (numJovenesYNinos === 0) return 0;
        if (!menuInfantilId) return 0;
        const menu = opcionesMenu?.serviciosIncluidos.find(s => s.id === menuInfantilId);
        return menu ? menu.precioFijo * numJovenesYNinos : 0;
    }, [menuInfantilId, opcionesMenu, numJovenesYNinos]);
    
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
    
    const costoTotal = costoEntradas + costoPlatoPrincipal + costoMenuInfantil + costoPaqueteServicios;
    const montoDescuento = config?.descuentoGeneral ? (costoTotal * config.descuentoGeneral) / 100 : 0;
    const costoConDescuento = costoTotal - montoDescuento;

    const handleGenerarPresupuesto = async () => {
        setIsGeneratingLead(true);
        toast({ title: "Generando tu presupuesto...", description: "Espera un momento." });
        
        const result = await generateLeadFromQuickBudget({
            nombrePaquete: paqueteActual?.nombre || 'Sin paquete',
            nombreMenu: 'Catering Personalizado',
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
    
    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        const resumenText = `Resumen del Presupuesto para ${clienteNombre}:\n- Invitados: ${totalInvitados}\n- Catering: ${formatCurrency(costoEntradas + costoPlatoPrincipal + costoMenuInfantil)}\n- Servicios: ${formatCurrency(costoPaqueteServicios)}\n- Total Estimado: ${formatCurrency(costoConDescuento)}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(resumenText)}`;
        window.open(whatsappUrl, '_blank');
    };

    const renderPaso = () => {
        switch(paso) {
            case 1: // Datos del Cliente
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
            case 2: // Cantidad de Invitados
                return (
                  <motion.div key="paso2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <CardHeader><CardTitle className="font-headline text-2xl">Paso 2: Cantidad de Invitados</CardTitle><CardDescription>¿Cuántos adultos y cuántos adolescentes/niños asistirán?</CardDescription></CardHeader>
                     <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div><Label htmlFor="adultos" className="flex items-center gap-1"><User/> Adultos</Label><Input id="adultos" type="number" value={numAdultos} onChange={(e) => setNumAdultos(Number(e.target.value) || 0)} min="0"/></div>
                            <div><Label htmlFor="jovenes_ninos" className="flex items-center gap-1"><UserSquare2/> Adolescentes y Niños</Label><Input id="jovenes_ninos" type="number" value={numJovenesYNinos} onChange={(e) => setNumJovenesYNinos(Number(e.target.value) || 0)} min="0"/></div>
                          </div>
                     </CardContent>
                     <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(1)}>Anterior</Button><Button onClick={() => setPaso(3)} disabled={(numAdultos + numJovenesYNinos) <= 0}>Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
                  </motion.div>
                );
            case 3: // Selección de Menú
                 return (
                    <motion.div key="paso3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                       <CardHeader><CardTitle className="font-headline text-2xl">Paso 3: Arma tu Menú</CardTitle><CardDescription>Elige las opciones para tu evento.</CardDescription></CardHeader>
                       <CardContent className="space-y-6">
                           <div className="space-y-2">
                                <Label className="font-semibold text-lg">1. Entradas (selecciona exactamente 2 opciones)</Label>
                                <p className="text-sm text-muted-foreground">Cada opción seleccionada se calculará para el total de adultos ({totalAdultos}).</p>
                                {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Entrada').map(s=>(
                                    <div key={s.id} className="flex items-center gap-3 p-2 border rounded-md">
                                        <Checkbox id={`e-${s.id}`} checked={entradasSeleccionadas.has(s.id)} onCheckedChange={()=>{setEntradasSeleccionadas(p=>{const n=new Set(p); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); while(n.size > 2) { n.delete(n.values().next().value); } return n;})}}/>
                                        <Label htmlFor={`e-${s.id}`} className="flex-grow font-normal">{s.nombre}</Label>
                                        <span className="text-sm font-medium">{formatCurrency(s.precioFijo)} c/u</span>
                                    </div>
                                ))}
                           </div>
                           
                            <div className="space-y-2">
                                <Label className="font-semibold text-lg">2. Platos Principales (para {totalAdultos} adultos, elige 1)</Label>
                                <RadioGroup value={platoPrincipalId} onValueChange={setPlatoPrincipalId}>
                                  {opcionesMenu?.serviciosIncluidos.filter(s=>s.categoria === 'Plato Principal').map(s=> (
                                      <Label key={s.id} htmlFor={`pp-${s.id}`} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                          <RadioGroupItem value={s.id} id={`pp-${s.id}`} />
                                          <span className="flex-grow font-normal">{s.nombre}</span>
                                          <span className="text-sm font-medium">{formatCurrency(s.precioFijo)} c/u</span>
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
                                            <span className="text-sm font-medium">{formatCurrency(s.precioFijo)} c/u</span>
                                        </Label>
                                    ))}
                                 </RadioGroup>
                            </div>
                           )}
                       </CardContent>
                       <CardFooter className="flex justify-between"><Button variant="outline" onClick={() => setPaso(2)}>Anterior</Button><Button onClick={handlePaso3Next} >Siguiente <ArrowRight className="ml-2"/></Button></CardFooter>
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
                            <CardDescription className="text-base text-muted-foreground">
                                Hemos recibido tu solicitud. Un asesor de AK Producciones se pondrá en contacto contigo a la brevedad.
                                <br/>
                                <span className="font-semibold mt-2 block">El precio y la promoción de este presupuesto son válidos por 30 días.</span>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-2">
                           <Button onClick={handlePrint} variant="outline" className="w-full"><Download className="mr-2"/>Descargar Presupuesto</Button>
                           <Button onClick={handleShare} variant="outline" className="w-full"><Share2 className="mr-2"/>Compartir Presupuesto</Button>
                           {whatsappLink && (
                             <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full">
                                <Button className="w-full bg-green-500 hover:bg-green-600">
                                    <MessageSquare className="mr-2"/>Comunicarse por WhatsApp
                                </Button>
                             </a>
                           )}
                           <Button onClick={() => window.location.reload()} variant="secondary" className="w-full mt-4">Generar un Nuevo Presupuesto</Button>
                        </CardFooter>
                    </motion.div>
                );
        }
    }

    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-center text-destructive">{error}</div>;

    const PrintableContent = () => (
      <Card className="shadow-xl border-t-4 border-primary">
          <CardHeader><CardTitle className="font-headline text-2xl text-primary">Resumen de tu Selección</CardTitle></CardHeader>
          <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg"><span>Invitados:</span><span className="font-bold">{totalAdultos} A / {numJovenesYNinos} J-N</span></div>
              <Separator/>
              <div className="space-y-2 text-sm">
                 <h4 className="font-semibold">Catering:</h4>
                 <div className="flex justify-between"><span>Entradas seleccionadas</span><span>{formatCurrency(costoEntradas)}</span></div>
                 <div className="flex justify-between"><span>Plato principal</span><span>{formatCurrency(costoPlatoPrincipal)}</span></div>
                 <div className="flex justify-between"><span>Menú niños/adolescentes</span><span>{formatCurrency(costoMenuInfantil)}</span></div>
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
    );

    return (
      <>
        <div className="non-printable">
          <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
              <header className="absolute top-0 left-0 right-0 p-4 border-b bg-background/80 backdrop-blur-sm">
                  <div className="flex justify-between items-center max-w-5xl mx-auto">
                      <div className="flex items-center gap-3"><Wand2 className="w-8 h-8 text-primary"/><h1 className="text-2xl font-bold font-headline">Armado Rápido de Presupuesto</h1></div>
                      <Link href="/" passHref><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al inicio</Button></Link>
                  </div>
              </header>
              
              <main className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl pt-24">
                  <Card className={`shadow-xl ${paso === 5 ? 'hidden md:block' : ''}`}><AnimatePresence mode="wait">{renderPaso()}</AnimatePresence></Card>
                  <div className={`${paso !== 5 ? 'block' : 'hidden md:block'}`}><PrintableContent/></div>
              </main>
          </div>
        </div>
        <div className="printable-content">
            <PrintableContent />
        </div>
         <style jsx global>{`
          @media print {
            .non-printable {
              display: none;
            }
            .printable-content {
              display: block;
            }
          }
          .printable-content {
            display: none;
          }
        `}</style>
      </>
    );
}

