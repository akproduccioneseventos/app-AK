
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Wand2, User, HelpCircle, PartyPopper, Code2 } from 'lucide-react';
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
                    <CardTitle className="font-headline text-2xl">Un Copiloto Inteligente</CardTitle>
                    <CardDescription className="text-lg">
                        El Asistente AK no es solo un chat. Es un agente de IA que puede entender tus peticiones y utilizar herramientas internas para realizar tareas complejas en la aplicación.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-3">Herramientas de Análisis por IA</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Link href="/admin/aaiff-fiesta" passHref>
                                <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
                                    <div className="flex items-center gap-2">
                                        <PartyPopper className="w-5 h-5 text-primary"/>
                                        <span className="font-semibold">Análisis de Evento</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-left">Revisa la completitud y coherencia de tu planificación actual.</p>
                                </Button>
                            </Link>
                            <Link href="/admin/aaiff" passHref>
                                <Button variant="outline" className="h-auto flex-col items-start p-4 gap-2">
                                     <div className="flex items-center gap-2">
                                        <Code2 className="w-5 h-5 text-primary"/>
                                        <span className="font-semibold">Análisis de Código</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground text-left">Permite que la IA analice la app en busca de mejoras y errores.</p>
                                </Button>
                            </Link>
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
                 <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground bg-amber-50 dark:bg-amber-900/30 p-4 border-t">
                    <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
                        <HelpCircle className="w-5 h-5"/>
                        ¿Cómo interactúo?
                    </div>
                    <p>
                        Usa lenguaje natural en el chat del asistente flotante en la esquina inferior derecha. Prueba con frases como:
                    </p>
                    <ul className="list-disc list-inside pl-5 font-mono text-xs">
                        <li>`revisa la planificación de la fiesta`</li>
                        <li>`asigna los invitados`</li>
                        <li>`analiza el código de la app`</li>
                        <li>`crea un presupuesto para una boda de 50 personas el 15/12/2025`</li>
                    </ul>
                </CardFooter>
            </Card>
        </div>
    );
}
