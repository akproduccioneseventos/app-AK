
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot } from 'lucide-react';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';

export default function AsistentePage() {
    return (
        <div className="flex h-screen w-full flex-col">
            <header className="p-4 border-b">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Bot className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-bold font-headline">Asistente de Presupuestos AK</h1>
                    </div>
                     <Link href="/" passHref>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
                        </Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 flex justify-center items-center p-4 bg-muted/30">
                <div className="w-full max-w-4xl h-full flex flex-col">
                    <AkAssistant isPage />
                </div>
            </main>
        </div>
    );
}
