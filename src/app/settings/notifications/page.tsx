
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction, BellRing } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BellRing className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Configuración de Notificaciones
          </h1>
        </div>
        <Link href="/settings" passHref>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Configuración
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full inline-block mb-4">
            <Construction className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La gestión detallada de tus preferencias de notificación estará disponible aquí próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Estamos trabajando para ofrecerte un control granular sobre las alertas y avisos que recibes. 
            Podrás elegir qué tipo de notificaciones deseas (ej. nuevas tareas, recordatorios de eventos, confirmaciones de RSVP, etc.) y cómo quieres recibirlas (ej. email, notificaciones push en la app).
          </p>
          <div className="p-4 border border-dashed rounded-md bg-muted/30">
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Configuración de notificaciones en construcción" 
              width={600}
              height={300}
              className="rounded-md shadow-sm mx-auto"
              data-ai-hint="notification settings construction"
            />
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            ¡Gracias por tu paciencia mientras mejoramos esta sección!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
