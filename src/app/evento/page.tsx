import { redirect } from 'next/navigation';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';

/**
 * /evento/ — Redirect to the nearest upcoming (or most recent) active event's public page.
 * If no events exist, show a friendly message.
 */
export default async function EventoRedirectPage() {
  const fiestas = await getFiestas(false).catch(() => []);

  if (fiestas.length > 0) {
    // Sort by date ascending and pick the nearest upcoming event; fall back to the most recent one.
    const now = Date.now();
    const sorted = [...fiestas].sort(
      (a, b) =>
        new Date(a.configuracion.fechaEvento || 0).getTime() -
        new Date(b.configuracion.fechaEvento || 0).getTime()
    );
    const upcoming = sorted.find(
      (f) => new Date(f.configuracion.fechaEvento || 0).getTime() >= now
    );
    const target = upcoming ?? sorted[sorted.length - 1];

    redirect(`/evento/actual?fiestaId=${target.id}`);
  }

  // No events found — render a friendly message
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-black text-slate-900">Próximamente</h1>
        <p className="text-slate-500 font-medium">
          No hay eventos publicados por el momento. ¡Volvé pronto!
        </p>
      </div>
    </div>
  );
}
