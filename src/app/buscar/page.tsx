'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, BookOpen, Sparkles, Home } from 'lucide-react';
import { buscarEnElSitio, type ResultadoBusqueda } from '@/lib/buscador/buscar-sitio';

export default function BuscarPage() {
  const [consulta, setConsulta] = useState('');

  const resultados: ResultadoBusqueda[] = useMemo(() => {
    return buscarEnElSitio(consulta);
  }, [consulta]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-amber-500 selection:text-black">
      {/* Cabecera */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur sticky top-0 z-10 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-semibold">
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </Link>
          <span className="text-xs font-black uppercase tracking-widest text-amber-500">Buscador del Sitio</span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            ¿Qué estás buscando?
          </h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Buscá servicios para tu fiesta, ideas en nuestro blog o información de presupuestos.
          </p>

          {/* Input de Búsqueda */}
          <div className="relative max-w-xl mx-auto mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Ej: 15 años, bodas, fotocabina, catering..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {consulta.trim() && (
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">
              {resultados.length} {resultados.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </p>
          )}

          {resultados.map((item, idx) => (
            <Link
              key={idx}
              href={item.url}
              className="block p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-amber-500/50 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      item.tipo === 'servicio' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {item.etiqueta || item.tipo}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {item.resumen}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}

          {consulta.trim() && resultados.length === 0 && (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
              <p className="text-sm text-zinc-400 font-medium">No encontramos resultados para tu búsqueda.</p>
              <p className="text-xs text-zinc-600 mt-1">Probá con palabras clave como &quot;boda&quot;, &quot;15&quot; o &quot;música&quot;.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
