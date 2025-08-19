
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Wand2, User, HelpCircle, PartyPopper, Code2, FileJson, MessageSquare, Edit, List, Settings, Users, CalendarDays } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';
import { useToast } from '@/hooks/use-toast';
// We will need to create an action to get and save this config
// For now, we'll use a placeholder or import it directly if it's simple
import initialConfig from '@/data/asistente-ak-config.json';
import { Skeleton } from '@/components/ui/skeleton';


interface DialogStep {
  pregunta: string;
}

interface DialogConfig {
  pasos: {
    tipoFiesta: DialogStep;
    cantidadInvitados: DialogStep;
    nombreCliente: DialogStep;
    fechaEvento: DialogStep;
  }
}

export default function AsistenteAkConfigPage() {
    const { toast } = useToast();
    const [config, setConfig] = useState<DialogConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        // In the future, this would be an server action call:
        // const fetchedConfig = await getAssistantConfig();
        // For now, we use the imported JSON.
        setConfig(initialConfig);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    if (isLoading || !config) {
        return (
             <div className="max-w-4xl mx-auto space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="w-10 h-10 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1>
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>
                <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full"/></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full"/></CardContent></Card>
            </div>
        )
    }

    const steps = [
        { id: 'tipoFiesta', title: 'Paso 1: Tipo de Fiesta', question: config.pasos.tipoFiesta.pregunta, icon: PartyPopper },
        { id: 'cantidadInvitados', title: 'Paso 2: Cantidad de Invitados', question: config.pasos.cantidadInvitados.pregunta, icon: Users },
        { id: 'nombreCliente', title: 'Paso 3: Nombre del Cliente', question: config.pasos.nombreCliente.pregunta, icon: User },
        { id: 'fechaEvento', title: 'Paso 4: Fecha del Evento', question: config.pasos.fechaEvento.pregunta, icon: CalendarDays },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
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
                {/* Columna de Configuración */}
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
                                             <Button variant="ghost" size="sm" disabled><Edit className="w-4 h-4 mr-2"/>Editar</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        <p className="p-3 bg-background rounded-md border text-sm italic">"{step.question}"</p>
                                        <div className="mt-2 text-xs text-muted-foreground p-2 text-center border-t">
                                            La edición de opciones y lógica de respuesta se habilitará próximamente.
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                        <CardFooter>
                             <Button disabled><Save className="w-4 h-4 mr-2"/>Guardar Flujo</Button>
                        </CardFooter>
                    </Card>
                </div>
                
                {/* Columna de Simulación */}
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
