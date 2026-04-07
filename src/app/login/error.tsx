'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LoginError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[login] Error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Error al cargar</CardTitle>
          <CardDescription>
            Ocurrió un problema al cargar la página de login. Por favor, intentá de nuevo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Si el problema persiste, podés ingresar directamente con:</p>
          <p className="mt-2 font-medium">Correo: akproduccionessalto@gmail.com</p>
          <p className="font-medium">Contraseña: AKproducciones2024</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
