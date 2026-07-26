import { AlertTriangle, Loader2 } from 'lucide-react';

type PublicEntertainmentEventStatusProps = {
  isLoading: boolean;
  error?: string | null;
};

export function PublicEntertainmentEventStatus({
  isLoading,
  error,
}: PublicEntertainmentEventStatusProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-white">
      <div className="max-w-sm space-y-4" role="status" aria-live="polite">
        {isLoading ? (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-400 motion-reduce:animate-none" />
        ) : (
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        )}
        <h1 className="text-xl font-black">
          {isLoading ? 'Validando el evento' : 'Experiencia no disponible'}
        </h1>
        <p className="text-sm leading-6 text-zinc-400">
          {isLoading
            ? 'Estamos comprobando la configuracion de esta fiesta.'
            : error || 'Revisa el enlace o solicita un nuevo acceso al equipo de AK Producciones.'}
        </p>
      </div>
    </main>
  );
}
