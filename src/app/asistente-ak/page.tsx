
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, PlusCircle } from 'lucide-react';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';
import type { ServiceInfo } from '@/ai/types/assistant-types';


export default function AsistentePage() {
    const [assistantKey, setAssistantKey] = useState(Date.now());
    const [currentServices, setCurrentServices] = useState<ServiceInfo[]>([]);

    const handleRestart = useCallback(() => {
        setAssistantKey(Date.now());
        setCurrentServices([]);
    }, []);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col p-4 sm:p-6 md:p-8">
            <header className="flex-shrink-0 mb-6">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Bot className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl sm:text-3xl font-bold font-headline">Asistente de Presupuestos AK</h1>
                    </div>
                     <Link href="/" passHref>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio
                        </Button>
                    </Link>
                </div>
            </header>
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
                <div className="lg:col-span-2 h-full flex flex-col">
                    <AkAssistant 
                        isPage 
                        assistantKey={assistantKey}
                        currentServices={currentServices}
                        setCurrentServices={setCurrentServices}
                    />
                </div>
                <div className="h-full flex flex-col space-y-6">
                    <Button onClick={handleRestart} variant="secondary" className="w-full">
                        Reiniciar Conversación y Presupuesto
                    </Button>
                </div>
            </main>
        </div>
    );
}
