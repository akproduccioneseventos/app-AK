'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enlaceDeInvitadoDeMuestra } from '@/app/actions/fiesta/vista-de-muestra.actions';

interface BotonVerComoInvitadoProps {
  fiestaId: string;
  accion?: typeof enlaceDeInvitadoDeMuestra;
}

export function BotonVerComoInvitado({ fiestaId, accion }: BotonVerComoInvitadoProps) {
  const [cargando, setCargando] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setCargando(true);
    try {
      const res = await (accion ?? enlaceDeInvitadoDeMuestra)(fiestaId);
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        toast({
          title: 'No se pudo abrir la vista de invitado',
          description: res.error || 'Ocurrió un error inesperado.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Error al obtener la vista de invitado.',
        variant: 'destructive',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={cargando}
      className="rounded-xl border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 font-bold"
    >
      {cargando ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
      Ver como un invitado
    </Button>
  );
}
