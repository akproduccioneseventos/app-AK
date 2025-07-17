
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle, PartyPopper, Home } from 'lucide-react';

export default function SolicitudEnviadaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center shadow-2xl p-6 md:p-8">
        <CardHeader>
          <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold font-headline text-primary">
            ¡Solicitud Enviada!
          </CardTitle>
          <CardDescription className="text-lg mt-2 text-muted-foreground">
            Gracias por planificar tu evento con nosotros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">
            Hemos recibido tu selección. Un organizador de nuestro equipo se pondrá en contacto contigo a la brevedad para afinar los detalles, confirmar el presupuesto final y dar los próximos pasos.
          </p>
          <p className="text-sm text-muted-foreground">
            ¡Estamos muy emocionados de ser parte de tu celebración!
          </p>
          <div className="flex justify-center items-center gap-3 pt-4">
             <PartyPopper className="w-8 h-8 text-primary/70"/>
             <span className="font-semibold text-xl">AK Producciones</span>
          </div>
        </CardContent>
        <CardContent>
            <Link href="/" passHref>
                <Button className="w-full max-w-xs mx-auto">
                    <Home className="mr-2"/> Volver al Inicio
                </Button>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
