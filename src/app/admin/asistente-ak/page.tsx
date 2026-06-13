'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, AlertTriangle } from "lucide-react";

export default function AsistenteAkPage() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Asistente de Marketing con IA</h1>
        </div>
        <Button asChild variant="outline"><Link href="/empresa/redes-sociales"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Link></Button>
      </div>
      <Card className="text-center">
        <CardHeader>
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500"/>
          <CardTitle>En Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            El Asistente de IA está temporalmente desactivado para resolver conflictos de dependencias.
            Volverá a estar disponible en una futura actualización.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
