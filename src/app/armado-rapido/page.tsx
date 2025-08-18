
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertTriangle, ArrowRight, ArrowLeft, CheckCircle, PartyPopper } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

import type { ArmadoRapidoConfig, Paquete } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';

import { getArmadoRapidoConfig, generateQuickBudget } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import Link from 'next/link';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { ALL_TIPOS_EVENTO, type TipoEvento } from '@/types/presupuesto';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const formatCurrency = (amount?: number) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

function ArmadoRapidoContent() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [services, setServices] = useState<ServicioEmpresa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // User Selections
    const [selectedPackage, setSelectedPackage] = useState<Paquete | null>(null);
    const [extraServices, setExtraServices] = useState<Set<string>>(new Set());
    const [guestCount, setGuestCount] = useState<number>(50);
    const [clientName, setClientName] = useState('');
    const [eventType, setEventType] = useState<TipoEvento | string>('');
    const [eventDate, setEventDate] = useState<Date | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultData, setResultData] = useState<{ presupuestoId?: string; leadId?: string } | null>(null);


    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [configData, servicesData] = await Promise.all([
                getArmadoRapidoConfig(),
                getServiciosEmpresa()
            ]);
            setConfig(configData);
            setServices(servicesData.filter(s => s.tipoItem === 'Servicio'));
        } catch (e: any) {
            setError(e.message || "No se pudo cargar la configuración para el armado rápido.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handlePackageSelect = (pkg: Paquete) => {
        setSelectedPackage(pkg);
        // Pre-select services included in the package
        const includedServices = new Set<string>();
        pkg.serviciosIncluidos.forEach(id => includedServices.add(id));
        setExtraServices(includedServices);
        setStep(2);
    };

    const handleExtraServiceToggle = (serviceId: string) => {
        setExtraServices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceId)) {
                // Prevent unselecting services from the base package
                if (!selectedPackage?.serviciosIncluidos.includes(serviceId)) {
                    newSet.delete(serviceId);
                }
            } else {
                newSet.add(serviceId);
            }
            return newSet;
        });
    };

    const handleSubmit = async () => {
        if (!selectedPackage || !clientName.trim() || !eventType.trim()) {
            toast({ title: "Datos Incompletos", description: "Por favor, completa tu nombre y el tipo de evento.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await generateQuickBudget(
                selectedPackage.id,
                Array.from(extraServices),
                guestCount,
                clientName,
                eventType,
                eventDate
            );
            if (result.success) {
                setResultData({ presupuestoId: result.presupuestoId, leadId: result.leadId });
                setStep(4); // Move to success step
            } else {
                throw new Error(result.error || "No se pudo generar el presupuesto.");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const calculateTotal = () => {
        if(!selectedPackage) return 0;

        let total = selectedPackage.costoFijoAdicional || 0;
        
        extraServices.forEach(serviceId => {
            const service = services.find(s => s.id === serviceId);
            if(service && service.precioVenta !== undefined){
                if(service.unidad === 'Por persona') {
                    total += service.precioVenta * guestCount;
                } else {
                    total += service.precioVenta;
                }
            }
        });
        
        return total;
    }
    
    const totalEstimado = calculateTotal();
    const progress = ((step -1) / 3) * 100;

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
    }
    
    if (error || !config) {
        return <div className="flex justify-center items-center h-screen text-destructive"><AlertTriangle className="w-8 h-8 mr-2"/> {error || 'Error de configuración.'}</div>;
    }
    
    if(step === 4 && resultData?.presupuestoId) {
        return (
             <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-lg text-center shadow-2xl p-8">
                    <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                    <CardTitle className="text-3xl font-bold font-headline text-green-700">¡Presupuesto Solicitado!</CardTitle>
                    <CardDescription className="text-lg mt-2 text-muted-foreground">Gracias, {clientName}. Hemos recibido tu solicitud.</CardDescription>
                    <CardContent className="mt-4">
                        <p>Un asesor se pondrá en contacto contigo a la brevedad para confirmar los detalles.</p>
                        <p className="text-xs mt-2">Tu número de presupuesto de referencia es: <span className="font-mono bg-muted px-1 rounded">{resultData.presupuestoId.substring(0, 10)}...</span></p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="text-center pt-8">
                <PartyPopper className="w-12 h-12 mx-auto text-primary mb-3"/>
                <h1 className="text-4xl font-bold tracking-tight font-headline">{config.configuracionGeneral.titulo}</h1>
                <p className="text-lg text-muted-foreground mt-2">{config.configuracionGeneral.descripcion}</p>
                 <Progress value={progress} className="w-full h-2 mt-6 max-w-lg mx-auto" />
            </header>
            
            <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                {step === 1 && (
                     <section className="space-y-4">
                        <h2 className="text-2xl font-semibold text-center">Paso 1: Elige tu Paquete Base</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {config.paquetes.map(pkg => (
                               <Card key={pkg.id} className="flex flex-col">
                                   <CardHeader><CardTitle>{pkg.nombre}</CardTitle><CardDescription>{pkg.descripcion}</CardDescription></CardHeader>
                                   <CardContent className="flex-grow"><ul className="list-disc pl-5 text-sm space-y-1">{services.filter(s => pkg.serviciosIncluidos.includes(s.id)).map(s => <li key={s.id}>{s.nombre}</li>)}</ul></CardContent>
                                   <CardFooter><Button className="w-full" onClick={() => handlePackageSelect(pkg)}>Seleccionar</Button></CardFooter>
                               </Card>
                           ))}
                        </div>
                    </section>
                )}
                
                {step === 2 && selectedPackage && (
                     <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-center">Paso 2: Personaliza tu Evento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Card>
                                <CardHeader><CardTitle>Servicios Adicionales</CardTitle><CardDescription>Añade o quita servicios opcionales.</CardDescription></CardHeader>
                                <CardContent><ScrollArea className="h-60 pr-4">{services.map(s => <div key={s.id} className="flex items-center space-x-3 mb-2"><Checkbox id={`service-${s.id}`} checked={extraServices.has(s.id)} onCheckedChange={() => handleExtraServiceToggle(s.id)} disabled={selectedPackage.serviciosIncluidos.includes(s.id)}/><Label htmlFor={`service-${s.id}`} className="flex-grow">{s.nombre} ({formatCurrency(s.precioVenta)})</Label></div>)}</ScrollArea></CardContent>
                             </Card>
                             <Card>
                                <CardHeader><CardTitle>Detalles del Evento</CardTitle><CardDescription>Cuéntanos un poco más sobre tu fiesta.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="space-y-1"><Label htmlFor="guest-count">Cantidad de Invitados</Label><Input id="guest-count" type="number" value={guestCount} onChange={e => setGuestCount(Number(e.target.value) || 0)} min="1"/></div>
                                     <div className="space-y-1"><Label htmlFor="event-type">Tipo de Evento</Label><Select value={eventType} onValueChange={(val) => setEventType(val as TipoEvento)}><SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger><SelectContent>{ALL_TIPOS_EVENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                                </CardContent>
                             </Card>
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
                            <Button onClick={() => setStep(3)}>Siguiente<ArrowRight className="w-4 h-4 ml-2"/></Button>
                        </div>
                    </section>
                )}
                
                {step === 3 && selectedPackage && (
                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold text-center">Paso 3: Confirma tus Datos</h2>
                        <Card className="max-w-lg mx-auto">
                            <CardHeader><CardTitle>Resumen y Contacto</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="p-4 bg-muted rounded-md text-center"><p className="text-sm text-muted-foreground">Total Estimado</p><p className="text-3xl font-bold text-primary">{formatCurrency(totalEstimado)}</p></div>
                                 <div className="space-y-1"><Label htmlFor="client-name">Tu Nombre Completo *</Label><Input id="client-name" value={clientName} onChange={e => setClientName(e.target.value)} required/></div>
                                 <div className="space-y-1"><Label htmlFor="event-date">Fecha del Evento (Opcional)</Label><DatePickerDemo selectedDate={eventDate} onDateChange={setEventDate}/></div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Generando...</> : "Solicitar Presupuesto"}</Button>
                            </CardFooter>
                        </Card>
                    </section>
                )}
            </motion.div>
            </AnimatePresence>

        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>}>
            <ArmadoRapidoContent/>
        </Suspense>
    )
}
