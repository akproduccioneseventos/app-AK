'use client';

import { useTransition } from 'react';
import { CheckCircle2, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { createAk100ClosureTasks } from '@/app/actions/ak-100';

export function Ak100CreateTasksButton({ fiestaId, disabled }: { fiestaId: string; disabled?: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await createAk100ClosureTasks(fiestaId);

      if (!result.success) {
        toast({
          title: 'No se pudieron crear las tareas',
          description: result.error ?? 'Probá de nuevo en unos segundos.',
          variant: 'destructive',
        });
        return;
      }

      if (result.created === 0) {
        toast({
          title: 'No había tareas nuevas',
          description: 'El panel AK 100% no encontró pendientes nuevos para crear.',
        });
        return;
      }

      toast({
        title: 'Tareas AK 100% creadas',
        description: `Se agregaron ${result.created} tarea(s) para cerrar esta fiesta.`,
      });
    });
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      className="rounded-2xl bg-red-600 font-black hover:bg-red-700"
    >
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : disabled ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
      {disabled ? 'Sin pendientes nuevos' : isPending ? 'Creando tareas...' : 'Crear tareas AK 100%'}
    </Button>
  );
}
