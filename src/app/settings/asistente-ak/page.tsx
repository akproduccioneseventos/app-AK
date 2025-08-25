
'use client';

import React, { useState, useEffect, useCallback, type FormEvent, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Bot, Edit, PartyPopper, User, CalendarDays, Users, Save, Loader2, Trash2, PlusCircle, X, GripVertical, BookOpen, Sparkles as SparklesIcon, Info, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AsistenteAkConfigPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // This is now a static informational page.
    
    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><BrainCircuit className="w-10 h-10 text-primary" /><h1 className="text-3xl font-bold tracking-tight font-headline">Configuración del Asistente AK</h1></div>
                <Link href="/settings" passHref><Button variant="outline"><ArrowLeft className="mr-2" /> Volver</Button></Link>
            </div>
             <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <div className="p-2 bg-background rounded-md border border-blue-200"><Info className="w-6 h-6 text-blue-600"/></div>
                    <div>
                        <CardTitle className="font-headline text-lg text-blue-800">El Asistente Ahora es Más Inteligente</CardTitle>
                        <CardDescription className="text-blue-700/80">La configuración del flujo de diálogo ha sido reemplazada por una IA más flexible y conversacional.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-sm text-blue-700 space-y-2">
                    <p>En lugar de configurar pasos rígidos, el asistente ahora entiende su objetivo (crear un presupuesto) y guía al usuario de forma natural. Su comportamiento se define directamente en su "prompt" de sistema.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl">¿Cómo funciona ahora?</CardTitle>
                    <CardDescription>El asistente sigue un flujo de conversación interno guiado por IA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                   <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                        <li>
                            <span className="font-semibold text-foreground">Saludo y Objetivo:</span> Se presenta y explica que ayudará a crear un presupuesto.
                        </li>
                         <li>
                            <span className="font-semibold text-foreground">Recopilación de Datos:</span> Hace una pregunta a la vez para obtener el nombre, tipo de evento y cantidad de invitados.
                        </li>
                         <li>
                            <span className="font-semibold text-foreground">Creación del Presupuesto:</span> Una vez que tiene la información mínima, utiliza la herramienta `createQuote` para generar el presupuesto en el sistema.
                        </li>
                         <li>
                            <span className="font-semibold text-foreground">Respuesta Final:</span> Informa al usuario que el presupuesto fue creado y que un asesor se pondrá en contacto.
                        </li>
                   </ol>
                   <p className="text-xs text-muted-foreground pt-2">Esta lógica se encuentra en el archivo `src/ai/flows/assistant-flow.ts`.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl flex items-center gap-2"><Wand2 className="text-primary"/>Herramientas de Cotización</CardTitle>
                    <CardDescription>El asistente es una de las varias formas de crear presupuestos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                         <Link href="/presupuestos/nuevo" passHref className="flex-1">
                            <Button variant="secondary" className="w-full h-full text-wrap py-3">
                                Crear un Presupuesto Manualmente
                            </Button>
                        </Link>
                         <Link href="/armado-rapido" passHref className="flex-1">
                            <Button variant="secondary" className="w-full h-full text-wrap py-3">
                                Usar el Armado Rápido para Clientes
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

