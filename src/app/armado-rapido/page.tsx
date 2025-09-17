
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Wand2, Loader2, PartyPopper, Users, Package, ChefHat, FileText, Send, CheckCircle, Gift, User, Phone, Drumstick, Soup, Share2, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getArmadoRapidoConfig, generateLeadFromQuickBudget } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { ArmadoRapidoConfig, PaqueteArmadoRapido, MenuArmadoRapido } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formatCurrency = (amount: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);

function calcularCostoServicio(servicio: ServicioEmpresa, cantidadInvitados: number): number {
  if (!servicio || cantidadInvitados <= 0) return 0;
  
  switch (servicio.calculationMethod) {
    case 'porPersona':
      return (servicio.precioPorPersona || 0) * cantidadInvitados;
    case 'ratio':
      if (servicio.invitadosPorUnidad && servicio.invitadosPorUnidad > 0 && servicio.precioBase) {
        return Math.ceil(cantidadInvitados / servicio.invitadosPorUnidad) * servicio.precioBase;
      }
      return servicio.precioBase || 0;
    case 'tramos':
      const tramo = servicio.tramosDePrecio?.find(t => cantidadInvitados >= t.desde && cantidadInvitados <= t.hasta);
      return tramo?.precio || 0;
    case 'fijo':
    default:
      return servicio.precioVenta || servicio.precioBase || 0;
  }
}

export default function ArmadoRapidoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    const [config, setConfig] = useState<ArmadoRapidoConfig | null>(null);
    const [serviciosCatalogo, setServiciosCatalogo] = useState<ServicioEmpresa[]>([]);
    
    // Form state
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteContacto, setClienteContacto] = useState('');
    const [adultos, setAdultos] = useState<number>(50);
    const [ninos, setNinos] = useState<number>(0);
    const [selectedEntradas, setSelectedEntradas] = useState<string[]>([]);
    const [selectedPrincipal, setSelectedPrincipal] = useState<string>('');
    const [selectedMenuNino, setSelectedMenuNino] = useState<string>('');
    const [selectedPaqueteId, setSelectedPaqueteId] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingLead, setIsGeneratingLead] = useState(false);
    
    const { entradasDisponibles, principalesDisponibles, menusNinoDisponibles } = useMemo(() => {
        const entradas = serviciosCatalogo.filter(s => s.subcategoria === 'Entrada');
        const principales = serviciosCatalogo.filter(s => s.subcategoria === 'Plato Principal');
        const menusNino = serviciosCatalogo.filter(s => s.subcategoria === 'Menú Adolescente / Niño');
        return { entradasDisponibles: entradas, principalesDisponibles: principales, menusNinoDisponibles: menusNino };
    }, [serviciosCatalogo]);
    
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [armadoConfig, serviciosData] = await Promise.all([
                    getArmadoRapidoConfig(),
                    getServiciosEmpresa(),
                ]);
                setConfig(armadoConfig);
                setServiciosCatalogo(serviciosData.filter(s => s.tipoItem === 'Servicio'));
            } catch (error) {
                toast({ title: "Error", description: "No se pudieron cargar las configuraciones.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [toast]);
    
    const { costoEstimado, serviciosIncluidos } = useMemo(() => {
        if (!config || !serviciosCatalogo.length) return { costoEstimado: 0, serviciosIncluidos: [] };
        
        let costoTotal = 0;
        const totalInvitados = adultos + ninos;
        const includedServicesList: { nombre: string, esRegalo: boolean }[] = [];

        // Gastronomía
        selectedEntradas.forEach(id => {
            const servicio = serviciosCatalogo.find(s => s.id === id);
            if(servicio) {
                costoTotal += calcularCostoServicio(servicio, totalInvitados);
                includedServicesList.push({ nombre: servicio.nombre, esRegalo: false });
            }
        });
        if(selectedPrincipal) {
            const servicio = serviciosCatalogo.find(s => s.id === selectedPrincipal);
            if(servicio) {
                costoTotal += calcularCostoServicio(servicio, adultos); // Principal solo para adultos
                includedServicesList.push({ nombre: servicio.nombre, esRegalo: false });
            }
        }
        if(selectedMenuNino && ninos > 0) {
            const servicio = serviciosCatalogo.find(s => s.id === selectedMenuNino);
            if(servicio) {
                costoTotal += calcularCostoServicio(servicio, ninos); // Menú niños
                includedServicesList.push({ nombre: servicio.nombre, esRegalo: false });
            }
        }

        // Paquete de Servicios
        const paqueteSeleccionado = config.paquetes.find(p => p.id === selectedPaqueteId);
        if (paqueteSeleccionado) {
            paqueteSeleccionado.serviciosIncluidos.forEach(servicioInfo => {
                const servicio = serviciosCatalogo.find(s => s.id === servicioInfo.id);
                if (servicio) {
                    includedServicesList.push({ nombre: servicio.nombre, esRegalo: servicioInfo.esRegalo || false });
                    if (!servicioInfo.esRegalo) {
                        costoTotal += calcularCostoServicio(servicio, totalInvitados);
                    }
                }
            });
        }
        
        if (config.descuentoGeneral && config.descuentoGeneral > 0) {
            costoTotal *= (1 - (config.descuentoGeneral / 100));
        }

        return { costoEstimado: costoTotal, serviciosIncluidos: includedServicesList };
    }, [config, serviciosCatalogo, adultos, ninos, selectedEntradas, selectedPrincipal, selectedMenuNino, selectedPaqueteId]);
    
     const generateWhatsAppMessage = useCallback(() => {
        const paquete = config?.paquetes.find(p => p.id === selectedPaqueteId);
        let message = `🎉 *¡Presupuesto Estimado - AK Producciones!* 🎉\n\n`;
        message += `Hola *${clienteNombre}*,\n\n`;
        message += `Gracias por tu interés. Aquí tienes un resumen de tu simulación:\n\n`;
        message += `*Invitados:* ${adultos} Adultos, ${ninos} Niños/Adolescentes\n`;
        message += `*Servicios Incluidos:*\n`;
        serviciosIncluidos.forEach(s => {
            message += s.esRegalo ? `  🎁 ${s.nombre} (REGALO)\n` : `  • ${s.nombre}\n`;
        });
        if (paquete) message += `\n*Paquete:* ${paquete.nombre}\n`;
        message += `\n------------------------------------\n`;
        message += `💰 *COSTO TOTAL ESTIMADO:* ${formatCurrency(costoEstimado)}\n`;
        if (config?.descuentoGeneral) message += `_(Incluye ${config.descuentoGeneral}% de descuento promocional)_\n`;
        message += `------------------------------------\n\n`;
        message += `Este es un costo aproximado. ¡Nos pondremos en contacto contigo para afinar los detalles!\n\n`;
        message += `*El equipo de AK Producciones*`;
        return message;
    }, [clienteNombre, adultos, ninos, serviciosIncluidos, costoEstimado, config, selectedPaqueteId]);

    const handleShareWhatsApp = () => {
        const message = generateWhatsAppMessage();
        const whatsAppUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsAppUrl, '_blank');
    };

    const handleCopyToClipboard = () => {
        const textToCopy = generateWhatsAppMessage();
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "¡Copiado!", description: "El resumen del presupuesto ha sido copiado." });
    };

    const handleGenerateLead = async () => {
        if (!clienteNombre.trim() || !clienteContacto.trim()) {
            toast({ title: "Datos incompletos", description: "Por favor, completa tu nombre y contacto para solicitar el presupuesto.", variant: "destructive" });
            return;
        }
        setIsGeneratingLead(true);
        const data = {
            clienteNombre,
            clienteContacto,
            adultos,
            ninos,
            costoEstimado,
            serviciosIncluidos: serviciosIncluidos.map(s => `${s.nombre}${s.esRegalo ? ' (REGALO)' : ''}`),
            paqueteNombre: config?.paquetes.find(p => p.id === selectedPaqueteId)?.nombre,
        };

        try {
            const result = await generateLeadFromQuickBudget(data);
            if(result.success) {
                setStep(5); // Show success step
            } else { throw new Error(result.error); }
        } catch(e: any) {
             toast({ title: "Error al enviar", description: e.message, variant: "destructive" });
        } finally {
            setIsGeneratingLead(false);
        }
    }
    
    const nextStep = () => setStep(s => s < 4 ? s + 1 : s);
    const prevStep = () => setStep(s => s > 1 ? s - 1 : s);
    
    if (isLoading) { return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>; }
    if (step === 5) {
      return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg text-center shadow-xl p-6">
                <CardHeader><PartyPopper className="w-16 h-16 mx-auto text-green-500 mb-4"/><CardTitle className="font-headline text-3xl text-green-600">¡Presupuesto Solicitado!</CardTitle><CardDescription className="text-lg">Gracias por tu interés. Un representante se pondrá en contacto contigo a la brevedad.</CardDescription></CardHeader>
                <CardFooter><Button className="w-full" onClick={() => { setStep(1); setClienteNombre(''); setClienteContacto(''); setSelectedEntradas([]); setSelectedPrincipal(''); setSelectedMenuNino(''); setSelectedPaqueteId(''); }}>Volver a Simular</Button></CardFooter>
            </Card>
        </div>
      )
    }

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-3xl shadow-xl">
                <CardHeader className="text-center">
                    <Wand2 className="w-12 h-12 mx-auto text-primary mb-2"/>
                    <CardTitle className="font-headline text-3xl">Simulador de Presupuesto</CardTitle>
                    <CardDescription className="text-lg">Paso {step} de 4: {['Tus Datos', 'Gastronomía', 'Paquete de Servicios', 'Resumen'][step-1]}</CardDescription>
                    <Progress value={(step / 4) * 100} className="w-full h-2 mt-4" />
                </CardHeader>
                <CardContent className="min-h-[350px] py-6 px-8">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><User className="text-primary w-5 h-5"/>Define tu evento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="cliente-nombre">Tu Nombre Completo *</Label><Input id="cliente-nombre" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Ingresa tu nombre" required/></div>
                                <div className="space-y-2"><Label htmlFor="cliente-contacto">Tu Celular *</Label><Input id="cliente-contacto" type="tel" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} placeholder="Ej: 099123456" required/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="num-adultos">Cantidad de Adultos *</Label><Input id="num-adultos" type="number" value={adultos} onChange={e => setAdultos(Number(e.target.value) || 0)} min="1" required/></div>
                                <div className="space-y-2"><Label htmlFor="num-ninos">Cantidad de Niños/Adolescentes</Label><Input id="num-ninos" type="number" value={ninos} onChange={e => setNinos(Number(e.target.value) || 0)} min="0"/></div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><ChefHat className="text-primary w-5 h-5"/>Elige tu Gastronomía</h3>
                            <div className="space-y-4"><Label>Entradas (puedes elegir varias)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{entradasDisponibles.map(s => (<div key={s.id} className="flex items-center space-x-2 p-2 border rounded-md"><Checkbox id={`e-${s.id}`} checked={selectedEntradas.includes(s.id)} onCheckedChange={(checked) => setSelectedEntradas(p => checked ? [...p, s.id] : p.filter(id => id !== s.id))}/><Label htmlFor={`e-${s.id}`} className="text-sm font-normal">{s.nombre}</Label></div>))}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Plato Principal (Adultos)</Label><Select value={selectedPrincipal} onValueChange={setSelectedPrincipal}><SelectTrigger><SelectValue placeholder="Selecciona un plato..."/></SelectTrigger><SelectContent>{principalesDisponibles.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
                                <div className="space-y-2"><Label>Menú Niños/Adolescentes</Label><Select value={selectedMenuNino} onValueChange={setSelectedMenuNino} disabled={ninos === 0}><SelectTrigger><SelectValue placeholder={ninos > 0 ? "Selecciona un menú..." : "Añade niños en Paso 1"}/></SelectTrigger><SelectContent>{menusNinoDisponibles.map(s=><SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in-20">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><Package className="text-primary w-5 h-5"/>Elige tu Paquete de Servicios</h3>
                            <RadioGroup value={selectedPaqueteId} onValueChange={setSelectedPaqueteId} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {config?.paquetes.map(p => (
                                    <Label key={p.id} htmlFor={`pkg-${p.id}`} className="p-4 border rounded-lg cursor-pointer hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                        <div className="flex items-start gap-4">
                                            <RadioGroupItem value={p.id} id={`pkg-${p.id}`} className="mt-1"/>
                                            <div>
                                                <p className="font-semibold">{p.nombre}</p>
                                                <ul className="text-xs text-muted-foreground list-disc pl-4 mt-2">
                                                    {p.serviciosIncluidos.map(s => {
                                                        const serv = serviciosCatalogo.find(sc => sc.id === s.id);
                                                        return serv && <li key={s.id} className={s.esRegalo ? 'text-green-600 font-medium' : ''}>{serv.nombre}{s.esRegalo && ' (REGALO)'}</li>
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in-20">
                             <h3 className="font-semibold text-lg flex items-center justify-center gap-2"><FileText className="text-primary w-5 h-5"/>Tu Presupuesto Estimado</h3>
                             {costoEstimado > 0 ? (
                                <>
                                <div className="p-4 bg-primary/5 rounded-lg text-center"><p className="text-lg text-muted-foreground">Costo Total Estimado</p><p className="text-5xl font-bold text-primary tracking-tight my-2">{formatCurrency(costoEstimado)}</p>{config?.descuentoGeneral && <p className="text-sm text-muted-foreground">Incluye un {config.descuentoGeneral}% de descuento promocional.</p>}</div>
                                <div className="space-y-2 text-sm max-h-40 overflow-y-auto"><h4 className="font-medium">Servicios Incluidos:</h4><ul className="list-disc pl-5 text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">{serviciosIncluidos.map((s, i) => (<li key={i} className={s.esRegalo ? 'text-green-600 font-medium' : ''}>{s.esRegalo && <Gift className="inline-block w-4 h-4 mr-1.5"/>}{s.nombre}</li>))}</ul></div>
                                </>
                            ) : (<p className="text-muted-foreground py-8 text-center">Completa los pasos anteriores para ver la estimación.</p>)}
                            <p className="text-xs text-muted-foreground text-center pt-2">Este es un precio estimado. Para solicitar un presupuesto detallado y que nos pongamos en contacto, haz clic en el botón.</p>
                             <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
                                <Button type="button" onClick={handleShareWhatsApp} variant="secondary" className="bg-green-500 hover:bg-green-600 text-white"><Send className="w-4 h-4 mr-2"/>Compartir por WhatsApp</Button>
                                <Button type="button" onClick={handleCopyToClipboard} variant="outline"><ClipboardCopy className="w-4 h-4 mr-2"/>Copiar Resumen</Button>
                             </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                        <ArrowLeft className="w-4 h-4 mr-2"/>Anterior
                    </Button>
                    {step < 4 ? (
                        <Button onClick={nextStep} disabled={(step === 1 && (!clienteNombre.trim() || !clienteContacto.trim() || adultos <= 0)) || (step === 2 && !selectedPrincipal)}>
                            Siguiente<ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    ) : (
                        <Button onClick={handleGenerateLead} disabled={isGeneratingLead || !costoEstimado}>
                            {isGeneratingLead ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                            Solicitar Presupuesto Detallado
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
  
