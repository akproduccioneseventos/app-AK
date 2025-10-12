
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import Link from 'next/link';

export default function AnalisisCodebasePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-10 h-10 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Análisis de Aplicación con IA
          </h1>
        </div>
        <Link href="/" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú Principal
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/30">
        <CardHeader>
          <CardTitle className="font-headline text-xl text-yellow-800 dark:text-yellow-200">Función Desactivada Temporalmente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700 dark:text-yellow-300">
            El módulo de análisis con inteligencia artificial está actualmente en mantenimiento para mejorar su estabilidad y rendimiento.
            Disculpa las molestias.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
