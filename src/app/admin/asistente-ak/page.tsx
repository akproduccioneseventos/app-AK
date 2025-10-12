
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot } from "lucide-react";

export default function AsistenteAkPage() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Asistente de Marketing con IA</h1>
        </div>
        <Link href="/" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
        </Link>
      </div>
      <Card className="shadow-lg border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/30">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-yellow-800 dark:text-yellow-200">Función Desactivada Temporalmente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 dark:text-yellow-300">
            El asistente de marketing con inteligencia artificial está actualmente en mantenimiento para mejorar su estabilidad y rendimiento.
            Disculpa las molestias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
