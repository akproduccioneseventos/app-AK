
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PortalNotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/40">
      <Card className="max-w-sm w-full text-center shadow-lg rounded-3xl border-0">
        <CardHeader className="pb-2">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-2" />
          <CardTitle className="text-destructive text-xl">Portal no encontrado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            El enlace al portal no es válido, ha expirado o el portal no está habilitado. Por favor,
            solicitá un nuevo enlace a tu organizador.
          </p>
          <Link href="/">
            <Button variant="outline" className="w-full rounded-xl">
              Volver al inicio
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
