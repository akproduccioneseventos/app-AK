
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wand2, Bot } from 'lucide-react';
import Image from 'next/image';

export default function CotizadorAsistidoPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center shadow-2xl">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
                        <Wand2 className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl">Cotizador Asistido por IA</CardTitle>
                    <CardDescription className="text-lg text-muted-foreground mt-2">
                        Próximamente: Una nueva forma de crear presupuestos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        Estamos desarrollando una experiencia conversacional donde el Asistente AK te guiará
                        para crear un presupuesto completo en minutos, haciéndote las preguntas correctas.
                    </p>
                    <div className="p-4 bg-background rounded-md border border-dashed">
                        <Bot className="w-10 h-10 mx-auto text-muted-foreground mb-2"/>
                        <p className="font-mono text-sm text-left">
                            <span className="font-semibold text-primary">Asistente:</span> ¡Hola! ¿Qué tipo de evento estás planeando?<br/>
                            <span className="font-semibold text-foreground">Tú:</span> Una boda para 100 personas.<br/>
                            <span className="font-semibold text-primary">Asistente:</span> ¡Genial! ¿Ya tienes un menú en mente o prefieres ver opciones?
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Mientras tanto, puedes seguir utilizando el creador de presupuestos tradicional.
                    </p>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                     <Link href="/presupuestos/nuevo" passHref>
                        <Button size="lg">Ir al Creador de Presupuestos</Button>
                    </Link>
                    <Link href="/" passHref>
                        <Button variant="ghost">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
