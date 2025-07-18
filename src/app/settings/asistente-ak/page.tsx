// This file is now obsolete and will be removed.
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

export default function AsistenteConfigObsoletoPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
            <Card className="max-w-xl text-center">
                <CardHeader>
                    <Info className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle className="font-headline text-2xl mt-4">Página Descontinuada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        La configuración del antiguo asistente ha sido descontinuada. La nueva IA se gestiona a través de sus flujos de herramientas internas.
                    </p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/settings" passHref>
                        <Button>
                            <ArrowLeft className="mr-2" /> Volver a Configuración
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
