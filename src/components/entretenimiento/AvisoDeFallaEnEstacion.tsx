'use client';

import { AlertTriangle } from 'lucide-react';

/**
 * Le muestra al operador de AK el ultimo problema que tuvo un invitado parado
 * frente a la estacion.
 *
 * Existe porque el operador trabajaba a ciegas. Si al invitado no le abria la
 * camara, o le fallaba la subida al muro, lo veia el en su pantalla y el equipo
 * no se enteraba de nada: se enteraban cuando alguien se acercaba a quejarse, y
 * para entonces ya se habian ido varios sin su foto.
 *
 * El aviso se limpia solo cuando la estacion vuelve a funcionar.
 */
export function AvisoDeFallaEnEstacion({
  mensaje,
  cuando,
}: {
  mensaje?: string | null;
  cuando?: string | null;
}) {
  if (!mensaje) return null;

  let hora = '';
  if (cuando) {
    const fecha = new Date(cuando);
    if (!Number.isNaN(fecha.getTime())) {
      hora = fecha.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    }
  }

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
      <div>
        <p className="text-sm font-black text-rose-300">
          Un invitado tuvo un problema{hora ? ` a las ${hora}` : ''}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-rose-100/80">{mensaje}</p>
        <p className="mt-2 text-xs leading-relaxed text-rose-100/60">
          Acercate a la estacion y probala. El aviso se borra solo cuando vuelve a
          funcionar.
        </p>
      </div>
    </div>
  );
}
