
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Wand2, User, HelpCircle, PartyPopper, Code2, FileJson } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const steps = [
  {
    icon: User,
    title: "1. Tu Petición",
    description: "Cuando escribes en el chat, tu mensaje se envía a la IA como una instrucción clara."
  },
  {
    icon: BrainCircuit,
    title: "2. El Cerebro (Genkit Flow)",
    description: "Tu mensaje llega a un 'flujo' central. Este flujo tiene acceso a un conjunto de herramientas (otras funciones de la app)."
  },
  {
    icon: Wand2,
    title: "3. La Decisión de la IA",
    description: "La IA analiza tu petición y la compara con la descripción de sus herramientas. Si pides 'analiza el evento', la IA sabe que debe usar la herramienta de análisis de eventos."
  },
  {
    icon: Bot,
    title: "4. Ejecución y Respuesta",
    description: "La IA ejecuta la herramienta seleccionada, la cual realiza la tarea (ej: leer los datos del evento). Luego, la IA toma el resultado y te lo presenta en el chat de forma amigable."
  }
];

export default function AsistenteAkInfoPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="w-10 h-10 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Asistente AK (IA)
                    </h1>
                </div>
                <Link href="/settings" passHref>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2" /> Volver a Configuración
                    </Button>
                </Link>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Un Copiloto Inteligente y Configurable</CardTitle>
                    <CardDescription className="text-lg">
                        El Asistente AK puede entender tus peticiones y utilizar herramientas para realizar tareas complejas, como crear presupuestos de forma conversacional.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <h3 className="font-semibold text-lg mb-3">Configura la Conversación del Asistente</h3>
                         <div className="p-4 border rounded-lg bg-muted/40">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <FileJson className="w-5 h-5 text-primary" />
                                </div>
                                <h4 className="font-semibold">Personaliza el Diálogo</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                                Puedes cambiar las preguntas que hace el asistente para recopilar información y crear un presupuesto. Edita directamente el archivo de configuración:
                            </p>
                             <code className="block my-1 p-2 rounded-md bg-gray-200 dark:bg-gray-700 font-mono text-xs">src/data/asistente-ak-config.json</code>
                        </div>
                    </div>
                    <Separator/>
                     <div>
                        <h3 className="font-semibold text-lg mb-3">¿Cómo funciona? El Proceso, Paso a Paso:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {steps.map(step => (
                                <div key={step.title} className="p-4 border rounded-lg bg-muted/40">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <step.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <h4 className="font-semibold">{step.title}</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
