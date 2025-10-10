
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertTriangle, Image as ImageIcon, Palette, Type, Share2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// TODO: En el futuro, esto podría venir de una plantilla o de la base de datos.
const InvitationPreview: React.FC<{ fiesta?: FiestaEnPlanificacion | null }> = ({ fiesta }) => {
    if (!fiesta) return null;

    const { configuracion } = fiesta;
    const nombres = [configuracion.protagonista1Nombre, configuracion.protagonista2Nombre].filter(Boolean).join(' y ');

    return (
        <div className="w-full max-w-sm mx-auto aspect-[9/16] bg-white rounded-xl shadow-2xl p-6 flex flex-col text-center border-4 border-pink-200">
            <p className="text-sm text-pink-400 font-serif">¡Estás invitado/a a nuestra celebración!</p>
            <div className="flex-grow flex flex-col items-center justify-center">
                <h2 className="text-4xl font-serif text-pink-800">{nombres || configuracion.nombreEvento}</h2>
                <p className="text-xl text-pink-500 mt-1">{configuracion.tipoCelebracion}</p>
                <Separator className="my-4 bg-pink-200" />
                <p className="text-lg font-semibold text-pink-700">{new Date(configuracion.fechaEvento || '').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                <p className="text-md text-pink-600">a las {configuracion.horaInicio} hs.</p>
                <p className="text-md font-semibold mt-2 text-pink-700">{configuracion.nombreLugar}</p>
            </div>
            <p className="text-xs text-pink-400">RSVP antes del 1 de Noviembre</p>
        </div>
    );
};


export default function DisenoInvitacionPage() {
    const { toast } = useToast();
    const [fiesta, setFiesta] = useState<FiestaEnPlanificacion | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFiestaData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getFiestaActual();
            setFiesta(data);
        } catch (err: any) {
            setError("No se pudo cargar la información del evento.");
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadFiestaData();
    }, [loadFiestaData]);
    
    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div>;
    }
    if (error) {
        return <div className="text-center text-destructive p-4"><AlertTriangle className="mx-auto w-8 h-8 mb-2"/>{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ImageIcon className="w-8 h-8 text-primary"/>
                    <h1 className="text-3xl font-bold tracking-tight font-headline">
                        Diseño de Invitación Digital
                    </h1>
                </div>
                <Link href={`/fiestas/nueva?fiestaId=${fiesta?.id}`} passHref>
                  <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Planificador</Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><Palette/> Apariencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground">La selección de plantillas y personalización de colores estará disponible en futuras actualizaciones.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><Type/> Textos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           <div className="space-y-1">
                                <Label htmlFor="inv-title" className="text-xs">Título Principal</Label>
                                <Input id="inv-title" defaultValue={[fiesta?.configuracion.protagonista1Nombre, fiesta?.configuracion.protagonista2Nombre].filter(Boolean).join(' y ') || fiesta?.configuracion.nombreEvento}/>
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="inv-subtitle" className="text-xs">Subtítulo</Label>
                                <Input id="inv-subtitle" defaultValue={fiesta?.configuracion.tipoCelebracion}/>
                           </div>
                           <div className="space-y-1">
                                <Label htmlFor="inv-footer" className="text-xs">Texto de Pie</Label>
                                <Textarea id="inv-footer" defaultValue="RSVP antes del 1 de Noviembre" rows={2}/>
                           </div>
                        </CardContent>
                         <CardFooter>
                            <Button disabled><Save className="w-4 h-4 mr-2"/>Guardar Textos</Button>
                         </CardFooter>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg"><Share2/> Compartir</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Button className="w-full" disabled>Descargar como Imagen</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Vista Previa de la Invitación</CardTitle>
                            <CardDescription>Así es como se verá la imagen que compartas.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center items-center p-4 bg-gray-200 dark:bg-gray-800 rounded-b-lg">
                           <InvitationPreview fiesta={fiesta} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
