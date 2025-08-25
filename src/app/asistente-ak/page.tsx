'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, RefreshCcw } from 'lucide-react';
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';


export default function AsistentePage() {
    const [assistantKey, setAssistantKey] = useState(Date.now());

    // This function will now be called to force a re-mount of the assistant component
    const handleRestart = useCallback(() => {
        setAssistantKey(Date.now());
    }, []);

    return (
        <div className="min-h-screen bg-muted/30 flex flex-col p-4 sm:p-6 md:p-8">
            <header className="flex-shrink-0 mb-6">
                <div className="flex justify-between items-center max-w-4xl mx-auto">
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
            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
                <div className="flex-1 h-full flex flex-col">
                    <AkAssistant 
                        isPage 
                        key={assistantKey} // Use key to force re-mount
                    />
                </div>
                 <div className="mt-4">
                    <Button onClick={handleRestart} variant="secondary" className="w-full sm:w-auto">
                       <RefreshCcw className="w-4 h-4 mr-2"/> Reiniciar Conversación
                    </Button>
                </div>
            </main>
        </div>
    );
}
