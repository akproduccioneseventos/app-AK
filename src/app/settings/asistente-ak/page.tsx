
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Edit, PartyPopper, User, CalendarDays, Users, Save, Loader2 } from 'lucide-react';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';
import { useToast } from '@/hooks/use-toast';
import { getAssistantConfig, saveAssistantConfig, type DialogConfig } from '@/app/actions/assistant-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


type DialogStepKey = keyof DialogConfig['pasos'];

export default function AsistenteAkConfigPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<DialogConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<{ id: DialogStepKey; title: string } | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedConfig = await getAssistantConfig();
            setConfig(fetchedConfig);
        } catch (e: any) {
            toast({ title: "Error", description: "No se pudo cargar la configuración del asistente.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const openEditModal = (stepId: DialogStepKey, title: string) => {
        if (!config) return;
        setCurrentStep({ id: stepId, title });
        setCurrentQuestion(config.pasos[stepId].pregunta);
        setIsModalOpen(true);
    };

    const handleSaveStep = async () => {
        if (!currentStep || !currentQuestion.trim() || !config) return;
        
        const newConfig = { ...config };
        newConfig.pasos[currentStep.id].pregunta = currentQuestion;

        setIsSaving(true);
        try {
            await saveAssistantConfig(newConfig);
            setConfig(newConfig);
            toast({ title: "¡Guardado!", description: `La pregunta para "${currentStep.title}" ha sido actualizada.` });
            setIsModalOpen(false);
        } catch(e: any) {
             toast({ title: "Error al Guardar", description: e.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const steps = useMemo(() => {
        if (!config) return [];
        return [
            { id: 'tipoFiesta' as DialogStepKey, title: 'Paso 1: Tipo de Fiesta', question: config.pasos.tipoFiesta.pregunta, icon: PartyPopper },
            { id: 'cantidadInvitados' as DialogStepKey, title: 'Paso 2: Cantidad de Invitados', question: config.pasos.cantidadInvitados.pregunta, icon: Users },
            { id: 'nombreCliente' as DialogStepKey, title: 'Paso 3: Nombre del Cliente', question: config.pasos.nombreCliente.pregunta, icon: User },
            { id: 'fechaEvento' as DialogStepKey, title: 'Paso 4: Fecha del Evento', question: config.pasos.fechaEvento.pregunta, icon: CalendarDays },
        ];
    }, [config]);


    if (isLoading) {
        return (
             <div className="max-w-4xl mx-auto space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><BrainCircuit className="w-10 h-10 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1></div>
                    <Skeleton className="h-10 w-24" />
                </div>
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full"/></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card>
            </div>
        )
    }
     if (!config) return <p>Error al cargar la configuración.</p>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Pregunta: {currentStep?.title}</DialogTitle>
                        <DialogDescription>Modifica el texto que el asistente usará en este paso.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="question-text">Texto de la Pregunta</Label>
                        <Textarea id="question-text" value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} rows={4} className="mt-2"/>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveStep} disabled={isSaving}>
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                            Guardar Pregunta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-10 h-10 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1>
                </div>
                <Link href="/settings" passHref>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2" /> Volver a Configuración
                    </Button>
                </Link>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Flujo del Diálogo</CardTitle>
                            <CardDescription>
                                Edita las preguntas y opciones que el asistente usará para conversar con los clientes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {steps.map(step => (
                                <Card key={step.id} className="shadow-sm bg-muted/30">
                                    <CardHeader className="p-4">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-3">
                                                 <div className="p-2 bg-background rounded-md border">
                                                    <step.icon className="w-5 h-5 text-primary"/>
                                                 </div>
                                                 <div>
                                                    <CardTitle className="text-lg">{step.title}</CardTitle>
                                                    <CardDescription className="text-xs">Pregunta del Asistente:</CardDescription>
                                                 </div>
                                            </div>
                                             <Button variant="ghost" size="sm" onClick={() => openEditModal(step.id, step.title)}><Edit className="w-4 h-4 mr-2"/>Editar</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="p-3 bg-background rounded-md border text-sm italic">"{step.question}"</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-1">
                     <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">Simulador de Chat</CardTitle>
                             <CardDescription>
                                Prueba el flujo de conversación en tiempo real.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <div className="h-[450px] w-full">
                             <AkAssistant isPage />
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
