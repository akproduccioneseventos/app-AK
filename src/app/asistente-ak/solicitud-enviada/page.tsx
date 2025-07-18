// This file is now obsolete and will be removed.
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export default function AsistenteObsoletoPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Info className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="font-headline text-2xl mt-4">Página Descontinuada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta página ha sido reemplazada por el nuevo Planificador de Fiestas y el Asistente AK.
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/" passHref>
                        <Button>
                            <ArrowLeft className="mr-2" /> Volver al Inicio
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
