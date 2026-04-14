'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { catalogList } from '@/data/event-catalogs';

const ACCENT_COLORS: Record<string, string> = {
  rose: 'from-rose-500 to-pink-500',
  purple: 'from-purple-500 to-fuchsia-500',
  amber: 'from-amber-500 to-orange-500',
  sky: 'from-sky-500 to-blue-500',
  slate: 'from-slate-600 to-gray-700',
  emerald: 'from-emerald-500 to-teal-500',
};

export default function CatalogoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-semibold text-indigo-500 uppercase tracking-widest">Catálogo Digital</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">
              Presentaciones por tipo de fiesta
            </h1>
            <p className="text-slate-500 mt-1">
              Seleccioná el tipo de evento para ver la presentación completa con servicios y presupuesto.
            </p>
          </div>
        </div>

        {/* Catalog grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogList.map((catalog) => {
            const gradientClass = ACCENT_COLORS[catalog.hero.accentColor] ?? 'from-indigo-500 to-purple-500';
            return (
              <Link key={catalog.slug} href={`/catalogo/${catalog.slug}`} className="block group">
                <Card className="h-full border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer overflow-hidden">
                  {/* Color bar */}
                  <div className={`h-2 bg-gradient-to-r ${gradientClass}`} />
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{catalog.hero.emoji}</span>
                      <div>
                        <CardTitle className="text-lg font-black text-slate-800 group-hover:text-indigo-700 transition-colors">
                          {catalog.name}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400 mt-0.5">
                          {catalog.services.length} paquetes · {catalog.process.length} pasos
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {catalog.hero.subheadline}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r ${gradientClass}`}>
                        Ver presentación
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-8">
          Al finalizar la presentación podés convertir la selección en un presupuesto manual real.
        </p>
      </div>
    </div>
  );
}
