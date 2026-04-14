'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen } from 'lucide-react';
import { EVENT_TYPES } from '@/data/presentacion';

export default function CatalogoPage() {
  return (
    <div className="space-y-8 pb-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900">
            Catálogos de Servicios
          </h1>
        </div>
        <p className="text-slate-500 text-sm font-medium pl-1">
          Seleccioná el tipo de fiesta para ver el catálogo completo y armar tu presupuesto.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EVENT_TYPES.map((tipo) => (
          <Link key={tipo.id} href={`/catalogo/${tipo.id}`} className="group block">
            <Card className="h-full border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className={`${tipo.color} p-6 flex items-center gap-4`}>
                  <span className="text-4xl">{tipo.emoji}</span>
                  <div>
                    <p className={`font-black text-xl ${tipo.textColor}`}>{tipo.label}</p>
                    <p className={`text-xs font-medium ${tipo.textColor} opacity-80`}>
                      Ver catálogo completo
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 flex items-center justify-between bg-white">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Ver presentación
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
