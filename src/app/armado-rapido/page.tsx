
'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePickerDemo } from '@/components/date-picker-demo';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Wand2, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { crearPresupuestoDesdeArmadoRapido } from '@/app/actions/armado-rapido';
import { getOcupiedDates } from '@/app/actions/agenda';
import { ALL_TIPOS_EVENTO, type TipoEvento } from '@/types/presupuesto';

// We need to fetch the packages config client-side as it's a JSON file.
// In a real app, this might be an API call. For this structure, a static import is fine.
import armadoRapidoConfig from '@/data/armado-rapido-config.json';
import { cn } from '@/lib/utils';


export default function ArmadoRapidoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [clienteNombre, setClienteNombre] = useState('');
    const [eventoTipo, setEventoTipo] = useState<TipoEvento | string>('');
    const [invitadosCantidad, setInvitadosCantidad] = useState(50);
    const [salonFiestas, setSalonFiestas] = useState('');
    const [eventoFecha, setEventoFecha] = useState<Date | undefined>(undefined);
    const [paqueteId, setPaqueteId] = useState<string>('intermedio'); // Default to 'intermedio'
    const [fechaPorConfirmar, setFechaPorConfirmar] = useState(false);
    
    // Agenda state
    const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
    const [isLoadingAgenda, setIsLoadingAgenda] = useState(true);

    const fetchOccupiedDates = useCallback(async () => {
        setIsLoadingAgenda(true);
        try {
          const dateStrings = await getOcupiedDates();
          const dates = dateStrings.map(ds => new Date(ds));
          setOccupiedDates(dates);
        } catch (err: any) {
          toast({ title: "Error", description: "No se pudieron cargar las fechas ocupadas.", variant: "destructive" });
        } finally {
          setIsLoadingAgenda(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOccupiedDates();
    }, [fetchOccupiedDates]);


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
                toast({ title: "¡Presupuesto Generado!", description: "Un asesor se pondrá en contacto contigo a la brevedad." });
                router.push(`/asistente-ak/solicitud-enviada?id=${result.presupuestoId}`);
            } else {
                throw new Error(result.error || "No se pudo generar el presupuesto.");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const { paquetes } = armadoRapidoConfig;

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-2xl">
                <CardHeader className="text-center">
                    <Wand2 className="w-16 h-16 mx-auto text-primary mb-4" />
                    <CardTitle className="font-headline text-3xl">Armado Rápido de Presupuesto</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Completa tus datos y elige un paquete para obtener una cotización inicial al instante.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Paquetes */}
                        <div className="space-y-2">
                            <Label className="text-base font-semibold">1. Elige tu Paquete</Label>
                             <RadioGroup value={paqueteId} onValueChange={setPaqueteId} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {paquetes.map(pkg => (
                                    <Label key={pkg.id} htmlFor={pkg.id} className={cn(
                                        "p-4 border rounded-lg cursor-pointer transition-all",
                                        paqueteId === pkg.id ? "border-primary ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                                    )}>
                                        <RadioGroupItem value={pkg.id} id={pkg.id} className="sr-only"/>
                                        <h4 className="font-bold text-foreground">{pkg.nombre}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{pkg.descripcion}</p>
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                        {/* Datos del Evento */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">2. Cuéntanos sobre tu Evento</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1"><Label htmlFor="clienteNombre">Tu Nombre Completo *</Label><Input id="clienteNombre" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="salonFiestas">Salón de Fiestas *</Label><Input id="salonFiestas" value={salonFiestas} onChange={(e) => setSalonFiestas(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="eventoTipo">Tipo de Evento *</Label><Input id="eventoTipo" value={eventoTipo} onChange={(e) => setEventoTipo(e.target.value)} required /></div>
                                <div className="space-y-1"><Label htmlFor="invitadosCantidad">Cantidad de Invitados *</Label><Input id="invitadosCantidad" type="number" value={invitadosCantidad} onChange={(e) => setInvitadosCantidad(Number(e.target.value))} required /></div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label className="font-semibold">Fecha del Evento *</Label>
                                <DatePickerDemo selectedDate={eventoFecha} onDateChange={setEventoFecha} disabled={fechaPorConfirmar || isLoadingAgenda} />
                                {isLoadingAgenda && <p className="text-xs text-muted-foreground">Cargando disponibilidad...</p>}
                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox id="fecha-confirmar" checked={fechaPorConfirmar} onCheckedChange={(checked) => setFechaPorConfirmar(!!checked)} />
                                    <Label htmlFor="fecha-confirmar" className="text-sm font-normal">Aún no he decidido la fecha</Label>
                                </div>
                            </div>
                        </div>
                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                            {isSubmitting ? 'Generando...' : 'Obtener Presupuesto Inicial'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

