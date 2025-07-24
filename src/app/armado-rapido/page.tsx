
'use client';

import React, { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, Loader2, Send, ArrowLeft, User, Users, Calendar, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { TipoFiestaSelector } from '@/components/asistente-ak/cotizador/TipoFiestaSelector';
import type { AsistentePasoOpcion } from '@/types/fiesta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePickerDemo } from '@/components/date-picker-demo';

const TOTAL_PASOS = 3;

export default function ArmadoRapidoPage() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [paso, setPaso] = useState(1);
    const [selectedFiesta, setSelectedFiesta] = useState<AsistentePasoOpcion | null>(null);
    const [guestCount, setGuestCount] = useState<number>(50);
    const [clientName, setClientName] = useState('');
    const [eventDate, setEventDate] = useState<Date | undefined>(new Date());

    const costoEstimado = (selectedFiesta?.costoBase || 0) + (guestCount * (selectedFiesta?.costoPorPersona || 350));

    const handleNext = () => {
        if (paso === 1 && !selectedFiesta) {
            toast({ title: "Selección requerida", description: "Por favor, elige un tipo de fiesta.", variant: "destructive" });
            return;
        }
         if (paso === 2 && (!clientName.trim() || guestCount <= 0 || !eventDate)) {
            toast({ title: "Datos requeridos", description: "Por favor, completa tu nombre, el número de invitados y la fecha.", variant: "destructive" });
            return;
        }
        if (paso < TOTAL_PASOS) {
            setPaso(paso + 1);
        }
    };

    const handlePrev = () => {
        if (paso > 1) {
            setPaso(paso - 1);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFiesta || !clientName || !eventDate || guestCount <= 0) return;

        setIsSaving(true);
        
        try {
            const result = await savePresupuesto({
                clienteNombre: clientName,
                eventoTipo: selectedFiesta.nombre,
                invitadosCantidad: guestCount,
                eventoFecha: eventDate.toISOString(),
                salonFiestas: 'A definir en reunión',
                costoTotalEstimado: costoEstimado,
                itemsPresupuestados: [{
                    idServicioCatalogo: `auto_${selectedFiesta.id}`,
                    nombreServicio: `Servicio completo para ${selectedFiesta.nombre}`,
                    cantidad: 1,
                    precioUnitario: costoEstimado,
                    costoTotalItem: costoEstimado,
                    categoriaServicio: 'Paquete evento',
                    unidad: 'evento'
                }],
                notas: `Generado desde Armado Rápido. El cliente está interesado en un evento para ${guestCount} personas con un presupuesto estimado de ${formatCurrency(costoEstimado)}.`,
                timestamp: new Date().toISOString(),
            });

            if (result.success) {
                toast({
                    title: "Solicitud Enviada",
                    description: "Tu presupuesto ha sido registrado. ¡Nos pondremos en contacto pronto!",
                });
                setIsSubmitted(true);
            } else {
                throw new Error(result.error || "No se pudo registrar la solicitud.");
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
                <Card className="max-w-xl text-center shadow-2xl">
                    <CardHeader>
                        <Bot className="w-16 h-16 mx-auto text-primary mb-4"/>
                        <CardTitle className="font-headline text-3xl">¡Gracias!</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-2">
                            Hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo a la brevedad.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    const titulosPasos = ["Tipo de Evento", "Invitados y Contacto", "Resumen y Envío"];
    const descripcionesPasos = [
        "Selecciona el tipo de evento que estás planeando.",
        "Indícanos cuántas personas asistirán y tus datos.",
        "Revisa el presupuesto estimado y envíanos tu solicitud."
    ];


    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl text-center shadow-2xl">
                <CardHeader>
                    <Bot className="w-12 h-12 mx-auto text-primary mb-2" />
                    <CardTitle className="font-headline text-3xl">{titulosPasos[paso - 1]}</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                       {descripcionesPasos[paso - 1]}
                    </CardDescription>
                    <Progress value={(paso / TOTAL_PASOS) * 100} className="mt-4 w-1/2 mx-auto" />
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="min-h-[300px] flex items-center justify-center">
                        {paso === 1 && (
                            <TipoFiestaSelector
                                selectedId={selectedFiesta?.id || null}
                                onSelect={setSelectedFiesta}
                            />
                        )}
                        {paso === 2 && (
                            <div className="w-full max-w-md mx-auto space-y-6 text-left">
                                <div className="space-y-2">
                                    <Label htmlFor="client-name" className="text-base flex items-center gap-2"><User className="w-4 h-4"/> Tu Nombre Completo</Label>
                                    <Input 
                                        id="client-name"
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="text-lg p-4"
                                        placeholder="Ej: María Rodríguez"
                                        required
                                    />
                                </div>
                               <div className="space-y-2">
                                    <Label htmlFor="guest-count" className="text-base flex items-center gap-2"><Users className="w-4 h-4"/> ¿Cuántos invitados esperas?</Label>
                                    <Input 
                                    id="guest-count"
                                    type="number"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(Number(e.target.value) || 0)}
                                    className="text-lg p-4"
                                    min="1"
                                    required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="event-date" className="text-base flex items-center gap-2"><Calendar className="w-4 h-4"/> Fecha aproximada del evento</Label>
                                    <DatePickerDemo selectedDate={eventDate} onDateChange={setEventDate} />
                                </div>
                            </div>
                        )}
                         {paso === 3 && selectedFiesta && (
                            <div className="text-left max-w-md mx-auto space-y-4">
                               <Card className="bg-muted/50 p-4">
                                 <CardHeader className="p-0 pb-3">
                                   <CardTitle className="font-headline text-xl">Resumen de tu Solicitud</CardTitle>
                                 </CardHeader>
                                 <CardContent className="p-0 space-y-2 text-sm">
                                    <p><strong>Tipo de Evento:</strong> {selectedFiesta.nombre}</p>
                                    <p><strong>Nombre:</strong> {clientName}</p>
                                    <p><strong>Nº Invitados:</strong> {guestCount}</p>
                                    <p><strong>Fecha:</strong> {eventDate?.toLocaleDateString('es-ES')}</p>
                                    <Separator className="my-3"/>
                                    <div className="text-right">
                                      <p className="text-muted-foreground">Presupuesto Estimado:</p>
                                      <p className="text-2xl font-bold text-primary">{formatCurrency(costoEstimado)}</p>
                                    </div>
                                 </CardContent>
                               </Card>
                               <Alert>
                                  <Info className="h-4 w-4" />
                                  <AlertTitle>¡Aclaración Importante!</AlertTitle>
                                  <AlertDescription>
                                    Este es un presupuesto inicial y estimado. Un asesor se contactará para ajustar los detalles y brindarte una cotización final.
                                  </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6">
                        <Button type="button" variant="outline" onClick={handlePrev} disabled={paso === 1 || isSaving}>
                           <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>
                        {paso < TOTAL_PASOS ? (
                            <Button type="button" onClick={handleNext} disabled={isSaving}>
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSaving} size="lg">
                                {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Send className="w-5 h-5 mr-2"/>}
                                {isSaving ? 'Enviando...' : 'Enviar y Cotizar'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
