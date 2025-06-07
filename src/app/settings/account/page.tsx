
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserCog, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AccountSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Seguridad y Cuenta
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
            <UserCog className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Página en Construcción</CardTitle>
          <CardDescription className="text-lg">
            Las opciones de seguridad y gestión de cuenta estarán disponibles próximamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Estamos trabajando para que puedas gestionar tu contraseña, datos de perfil y más opciones de seguridad.
          </p>
          <div className="flex justify-center">
            <ShieldAlert className="w-24 h-24 text-primary/70 my-6" />
          </div>
           <img 
            src="https://placehold.co/600x300.png" 
            alt="Seguridad de cuenta en construcción" 
            className="mt-6 rounded-md shadow-md mx-auto"
            data-ai-hint="account security construction"
          />
          <p className="text-sm text-muted-foreground pt-4">
            Pronto podrás cambiar tu email, contraseña y configurar la autenticación de dos factores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
