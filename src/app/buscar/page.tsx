'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Sparkles, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { buscarEnElSitio } from '@/lib/buscador/buscar-sitio';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public-footer';

export default function BuscarPage() {
  const [query, setQuery] = useState('');

  const resultados = useMemo(() => {
    return buscarEnElSitio(query);
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5" />
            Buscador del Sitio
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Encontrá servicios, guías y consejos
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Buscá por tipo de evento, ideas de organización, servicios de catering, cabinas de fotos o salones.
          </p>
        </div>

        {/* Input de Búsqueda */}
        <div className="relative max-w-2xl mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí lo que estás buscando (ej: Boda, 15 Años, Fotocabina, Menú...)"
            className="w-full bg-slate-900/80 border border-slate-800 focus:border-amber-500 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-500 outline-none transition shadow-xl"
            autoFocus
          />
        </div>

        {/* Resultados */}
        {query.trim().length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {resultados.length} resultado{resultados.length === 1 ? '' : 's'} encontrado{resultados.length === 1 ? '' : 's'}
            </p>

            {resultados.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
                <p className="text-sm font-bold text-slate-300">No encontramos resultados para &quot;{query}&quot;</p>
                <p className="text-xs text-slate-500">Probá con términos más generales como &quot;Boda&quot;, &quot;Fiesta&quot; o &quot;Servicios&quot;.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {resultados.map((item, idx) => (
                  <Link
                    key={`${item.url}-${idx}`}
                    href={item.url}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-amber-500/40 hover:bg-slate-900/90 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700">
                          {item.tipo === 'articulo' ? <BookOpen className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                          {item.etiqueta}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-amber-400" />
                      </div>
                      <h2 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                        {item.titulo}
                      </h2>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.resumen}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
