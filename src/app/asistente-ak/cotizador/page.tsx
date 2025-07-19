
'use client';

import React, { useState, type FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Bot, ArrowRight, Loader2, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { addCrmLead } from '@/app/actions/crm';
import { useRouter } from 'next/navigation';
import { TipoFiestaSelector } from '@/components/asistente-ak/cotizador/TipoFiestaSelector';
import { AsistentePasoOpcion } from '@/types/fiesta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CotizadorAsistidoPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [paso, setPaso] = useState(1);
    const [selectedFiesta, setSelectedFiesta] = useState<AsistentePasoOpcion | null>(null);
    const [guestCount, setGuestCount] = useState<number>(50);

    const handleNext = () => {
        if (paso === 1 && !selectedFiesta) {
            toast({ title: "Selección requerida", description: "Por favor, elige un tipo de fiesta.", variant: "destructive" });
            return;
        }
        if (paso < 2) {
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
        if (!selectedFiesta) return;

        setIsSaving(true);
        const costoPorPersona = 350; // Ejemplo
        const presupuestoEstimado = (selectedFiesta.costoBase || 0) + (guestCount * costoPorPersona);

        try {
            const result = await addCrmLead({
                name: `Prospecto de ${selectedFiesta.nombre}`,
                currentStageId: 's1', // ID de la etapa "Consultó"
                notes: `Generado desde Cotizador Asistido.\nTipo: ${selectedFiesta.nombre}\nInvitados: ${guestCount}\nPresupuesto Estimado: $${presupuestoEstimado.toLocaleString()}`
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

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
                <Card className="max-w-xl text-center shadow-2xl">
                    <CardHeader>
                        <Wand2 className="w-16 h-16 mx-auto text-primary mb-4"/>
                        <CardTitle className="font-headline text-3xl">¡Gracias!</CardTitle>
                        <CardDescription className="text-lg text-muted-foreground mt-2">
                            Hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo a la brevedad.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-2xl text-center shadow-2xl">
                <CardHeader>
                    <Bot className="w-12 h-12 mx-auto text-primary mb-2" />
                    <CardTitle className="font-headline text-3xl">Cotizador Asistido</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Responde unas pocas preguntas para obtener un presupuesto inicial.
                    </CardDescription>
                    <Progress value={(paso / 2) * 100} className="mt-4 w-1/2 mx-auto" />
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
                            <div className="w-full max-w-sm mx-auto space-y-4">
                               <Label htmlFor="guest-count" className="text-xl">¿Cuántos invitados esperas?</Label>
                               <Input 
                                 id="guest-count"
                                 type="number"
                                 value={guestCount}
                                 onChange={(e) => setGuestCount(Number(e.target.value) || 0)}
                                 className="text-center text-2xl p-6"
                                 min="1"
                               />
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-6">
                        <Button type="button" variant="outline" onClick={handlePrev} disabled={paso === 1 || isSaving}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                        </Button>
                        {paso < 2 ? (
                            <Button type="button" onClick={handleNext} disabled={isSaving}>
                                Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Send className="w-4 h-4 mr-2"/>}
                                {isSaving ? 'Enviando...' : 'Enviar y Cotizar'}
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
