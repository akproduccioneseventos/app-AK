'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ContratoSalonContent() {
    const searchParams = useSearchParams();
    const fiestaId = searchParams.get('fiestaId');

    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Contrato del Salón</h1>
                <Link href={`/fiestas/nueva/gestion-documental?fiestaId=${fiestaId}`} passHref>
                <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
                </Link>
            </div>
            <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="flex-row items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600"/>
                <CardTitle className="text-amber-800">Página en Construcción</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-amber-700">
                    Este generador de borradores para el contrato del salón aún no ha sido implementado.
                </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ContratoSalonPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ContratoSalonContent />
        </Suspense>
    )
}
