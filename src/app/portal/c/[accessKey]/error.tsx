'use client';

import { AlertTriangle, RotateCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Si falla la LECTURA del portal (no que el enlace no exista) se dice eso: el cliente
 * no tiene que creer que su enlace expiró cuando lo que pasó fue un corte momentáneo.
 */
export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-muted/40">
      <Card className="max-w-sm w-full text-center shadow-lg rounded-3xl border-0">
        <CardHeader className="pb-2">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-2" />
          <CardTitle className="text-xl">No pudimos cargar tu portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            No pudimos cargar tu portal en este momento. Probá de nuevo en unos minutos.
          </p>
          <Button onClick={() => reset()} className="w-full rounded-xl">
            <RotateCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
