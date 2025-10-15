
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot } from "lucide-react";
import { AkAssistant } from '@/components/asistente-ak/AkAssistant';

export default function AsistenteAkPage() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Asistente de Marketing con IA</h1>
        </div>
        <Link href="/empresa/redes-sociales" passHref>
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2"/>Volver</Button>
        </Link>
      </div>
      <AkAssistant/>
    </div>
  );
}
