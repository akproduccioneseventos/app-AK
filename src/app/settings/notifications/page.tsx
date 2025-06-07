
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction, BellRing } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Configuración de Notificaciones
        </h1>
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
            <BellRing className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            La gestión de notificaciones estará disponible próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas personalizar tus alertas y avisos.
          </p>
          <img 
            src="https://placehold.co/600x300.png" 
            alt="Configuración de notificaciones en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="notification settings construction"
          />
          <p className="text-sm text-muted-foreground pt-4">
            Podrás definir cuándo y cómo ser notificado sobre eventos importantes, facturas vencidas, y más.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
