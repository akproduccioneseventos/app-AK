import { ArrowUpRight, ExternalLink, Newspaper } from 'lucide-react';
import type { NotaExternaBlog } from '@/lib/blog/ultimas-notas';

interface UltimasNotasExternasProps {
  notas: NotaExternaBlog[];
  variant?: 'light' | 'dark';
}

function formatearFechaNota(fecha: string): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function UltimasNotasExternas({ notas, variant = 'light' }: UltimasNotasExternasProps) {
  if (!notas || notas.length === 0) {
    return null;
  }

  const esDark = variant === 'dark';
  const notasVisibles = notas.slice(0, 3);

  return (
    <section
      className={
        esDark
          ? 'border-y border-white/10 bg-slate-950 px-4 py-14 text-white'
          : 'border-y border-slate-200 bg-slate-50 px-4 py-14 text-slate-900'
      }
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-red-600">
              <Newspaper className="h-3.5 w-3.5" />
              Blogs oficiales
            </p>
            <h2
              className={`mt-2 text-3xl font-black ${
                esDark ? 'text-white' : 'text-slate-950'
              }`}
            >
              Últimas notas en nuestros blogs
            </h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {notasVisibles.map((nota) => {
            const fechaFormateada = formatearFechaNota(nota.fecha);
            return (
              <a
                key={nota.id}
                href={nota.url}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  esDark
                    ? 'group flex flex-col overflow-hidden rounded-lg border border-white/15 bg-slate-900 transition hover:-translate-y-1 hover:border-red-500/50 hover:shadow-xl'
                    : 'group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl'
                }
              >
                {nota.imagen && (
                  <div
                    className={`aspect-[16/10] w-full overflow-hidden ${
                      esDark ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={nota.imagen}
                      alt={nota.titulo}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-wider">
                      <span
                        className={
                          nota.fuente === 'Blogger'
                            ? 'rounded bg-orange-500/15 px-2 py-0.5 text-orange-600'
                            : 'rounded bg-sky-500/15 px-2 py-0.5 text-sky-600'
                        }
                      >
                        {nota.fuente}
                      </span>
                      {fechaFormateada && (
                        <span className={esDark ? 'text-slate-400' : 'text-slate-500'}>
                          {fechaFormateada}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-lg font-black leading-snug transition-colors group-hover:text-red-600 ${
                        esDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {nota.titulo}
                    </h3>
                  </div>

                  <div
                    className={`flex items-center justify-between border-t pt-3 text-xs font-black uppercase tracking-wider ${
                      esDark
                        ? 'border-white/10 text-red-400'
                        : 'border-slate-100 text-red-700'
                    }`}
                  >
                    <span>Leer nota completa</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <p className={`text-sm font-medium ${esDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Seguinos también en nuestro blog de{' '}
          <a
            href="https://akproduccionessalto.blogspot.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-bold underline underline-offset-4 ${
              esDark ? 'text-white hover:text-red-400' : 'text-slate-950 hover:text-red-700'
            }`}
          >
            Blogger
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          y en el de{' '}
          <a
            href="https://akproduccionessalto.wordpress.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-bold underline underline-offset-4 ${
              esDark ? 'text-white hover:text-red-400' : 'text-slate-950 hover:text-red-700'
            }`}
          >
            WordPress
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </section>
  );
}
