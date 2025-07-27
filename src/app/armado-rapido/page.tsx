'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Wand2, Send, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { crearPresupuestoDesdeArmadoRapido } from '@/app/actions/armado-rapido';
import type { TipoEvento } from '@/types/presupuesto';
import armadoRapidoConfig from '@/data/armado-rapido-config.json';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function ArmadoRapidoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [clienteNombre, setClienteNombre] = useState('');
    const [eventoTipo, setEventoTipo] = useState<TipoEvento | string>('');
    const [invitadosCantidad, setInvitadosCantidad] = useState(50);
    const [salonFiestas, setSalonFiestas] = useState('');
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
    const [paqueteId, setPaqueteId] = useState<string>('');
    const [fechaPorConfirmar, setFechaPorConfirmar] = useState(false);
    
    const { paquetes } = armadoRapidoConfig;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!paqueteId) {
            setError("Por favor, selecciona un paquete.");
            return;
        }
        if (!fechaPorConfirmar && !eventoFecha) {
            setError("Por favor, selecciona una fecha para el evento o marca la casilla para confirmar después.");
            return;
        }
        if (!clienteNombre.trim() || !eventoTipo.trim() || !salonFiestas.trim() || invitadosCantidad <= 0) {
            setError("Por favor, completa todos los datos del evento (nombre, tipo, salón e invitados).");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await crearPresupuestoDesdeArmadoRapido({
                clienteNombre,
                eventoTipo: eventoTipo as TipoEvento,
                invitadosCantidad,
                salonFiestas,
                paqueteId,
                eventoFecha: fechaPorConfirmar ? undefined : eventoFecha?.toISOString()
            });
            if (result.success && result.presupuestoId) {
                toast({ title: "¡Presupuesto Generado!", description: "Serás redirigido para ver los detalles." });
                router.push(`/presupuestos/${result.presupuestoId}/ver`);
            } else {
                throw new Error(result.error || "No se pudo generar el presupuesto.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-3xl shadow-2xl">
                <CardHeader className="text-center">
                    <Wand2 className="w-16 h-16 mx-auto text-primary mb-4" />
                    <CardTitle className="font-headline text-3xl">Armado Rápido de Presupuesto</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Elige un paquete y completa tus datos para obtener una cotización inicial al instante.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-center font-headline">1. Elige tu Paquete Ideal</h3>
                             <RadioGroup value={paqueteId} onValueChange={setPaqueteId} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {paquetes.map(pkg => (
                                    <Label key={pkg.id} htmlFor={pkg.id} className={cn(
                                        "p-4 border-2 rounded-lg cursor-pointer transition-all flex flex-col justify-between",
                                        paqueteId === pkg.id ? "border-primary ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                                    )}>
                                        <RadioGroupItem value={pkg.id} id={pkg.id} className="sr-only"/>
                                        <div>
                                            <h4 className="font-bold text-lg text-foreground">{pkg.nombre}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{pkg.descripcion}</p>
                                        </div>
                                         <ul className="text-xs text-muted-foreground mt-3 space-y-1 list-disc list-inside">
                                          {pkg.serviciosIncluidos.map(s => <li key={s}>{s}</li>)}
                                        </ul>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                        
                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-center font-headline">2. Cuéntanos sobre tu Evento</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><Label htmlFor="clienteNombre">Tu Nombre Completo *</Label><Input id="clienteNombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="salonFiestas">Salón de Fiestas *</Label><Input id="salonFiestas" value={salonFiestas} onChange={(e) => setSalonFiestas(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="eventoTipo">Tipo de Evento *</Label><Input id="eventoTipo" value={eventoTipo} onChange={(e) => setEventoTipo(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="invitadosCantidad">Cantidad de Invitados *</Label><Input id="invitadosCantidad" type="number" value={invitadosCantidad} onChange={(e) => setInvitadosCantidad(Number(e.target.value))} required min="1"/></div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label className="font-semibold">Fecha del Evento *</Label>
                                <DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} disabled={fechaPorConfirmar} />
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="fecha-confirmar" checked={fechaPorConfirmar} onCheckedChange={(checked) => setFechaPorConfirmar(!!checked)} />
                                    <Label htmlFor="fecha-confirmar" className="text-sm font-normal">Aún no he decidido la fecha</Label>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || !paqueteId}>
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Generando Presupuesto...' : 'Ver Mi Presupuesto Detallado'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
