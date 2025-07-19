
// This file is now obsolete and will be removed.
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Globe } from 'lucide-react';

export default function PaginaWebObsoletoPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Info className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="font-headline text-2xl mt-4">Página Reubicada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        La configuración de la página pública del evento ahora se gestiona desde el nuevo módulo "Página Pública y Portal".
                    </p>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Link href="/fiestas/nueva/portal-cliente" passHref>
                        <Button>
                            <ArrowLeft className="mr-2" /> Ir a la Nueva Página de Configuración
                        </Button>
                    </Link>
                     <Link href="/evento/actual" passHref>
                        <Button variant="secondary">
                            <Globe className="mr-2" /> Ver Página Pública del Evento
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
