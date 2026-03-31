'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Error capturado por error boundary:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-lg border-none shadow-2xl rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto p-4 bg-destructive/10 rounded-2xl w-fit mb-4">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900 font-headline">
            ¡Ups! Algo salió mal
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-2">
            Ocurrió un error inesperado. No te preocupes, tus datos están seguros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-8 px-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="rounded-xl h-12 px-6 font-bold"
            >
              <Home className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mx-auto transition-colors"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}
            </button>
            {showDetails && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-mono text-slate-500 break-all">
                  {error.message || 'Error desconocido'}
                </p>
                {error.digest && (
                  <p className="text-[10px] font-mono text-slate-400 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
