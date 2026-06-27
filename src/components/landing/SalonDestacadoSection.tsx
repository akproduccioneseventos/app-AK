'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Building2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function SalonDestacadoSection() {
  const photos = [
    {
      src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
      alt: 'Salón Club Uruguay decorado',
      title: 'Montaje de Gala',
    },
    {
      src: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg',
      alt: 'Sonido y pantallas gigantes de AK',
      title: 'Discoteca y Escenario',
    },
    {
      src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg',
      alt: 'Pista de baile LED en salón clásico',
      title: 'Pista LED Interactiva',
    },
  ];

  return (
    <section className="py-24 bg-zinc-950 text-white relative overflow-hidden">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Columna Izquierda: Contenido de Venta */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Building2 className="w-3.5 h-3.5" />
              Salón de Fiesta Exclusivo
            </span>

            <h2 className="font-headline text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Viví tu fiesta en el{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Club Uruguay
              </span>
            </h2>

            <p className="text-zinc-400 leading-relaxed font-medium">
              El primer salón de fiestas de Salto, con 150 años de historia. Ubicado en pleno centro frente a la plaza principal, te ofrece elegancia histórica y terraza amplia, junto a la producción integral de **AK Producciones**.
            </p>

            {/* Opciones de Salón - Anclaje de Precios (Neuroventas) */}
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase text-indigo-400">Salón Chico (Hasta 50 invitados)</h3>
                  <span className="text-[10px] font-black uppercase bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded">50% OFF</span>
                </div>
                <p className="text-zinc-400 text-xs mt-1">Ideal para fiestas íntimas. Cuenta con patio grande, terraza, freezer, heladera y servicio de limpieza incluido.</p>
                <p className="text-sm font-black mt-2 text-white">
                  Cotización: <span className="text-zinc-500 line-through text-xs font-semibold">$17.800</span> <span className="text-lg text-emerald-400">$8.900</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase text-indigo-400">Salón Grande (Hasta 200 invitados)</h3>
                  <span className="text-[10px] font-black uppercase bg-emerald-600/20 text-emerald-400 px-2 py-0.5 rounded">50% OFF</span>
                </div>
                <p className="text-zinc-400 text-xs mt-1">Para grandes fiestas de gala. Salón señorial de dos plantas y máxima comodidad.</p>
                <p className="text-sm font-black mt-2 text-white">
                  Cotización: <span className="text-zinc-500 line-through text-xs font-semibold">$33.800</span> <span className="text-lg text-emerald-400">$16.900</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/35 px-8">
                <Link href="/club-uruguay">
                  Ver Detalles del Salón
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white text-zinc-300 font-bold rounded-2xl px-6">
                <Link href="/simulador-de-presupuesto?salon=club">
                  Cotizar en Club Uruguay
                </Link>
              </Button>
            </div>
          </div>

          {/* Columna Derecha: Fotos Reales */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-4 h-full">
            {/* Foto principal grande */}
            <div className="sm:col-span-8 group relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] sm:aspect-square lg:aspect-[4/3] shadow-2xl">
              <Image
                src={photos[0].src}
                alt={photos[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent p-5 flex flex-col justify-end" />
              <div className="absolute bottom-5 left-5 right-5 z-10">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  Ubicación Centro
                </span>
                <h3 className="font-headline font-black text-lg text-white mt-1">
                  {photos[0].title}
                </h3>
              </div>
            </div>

            {/* Dos fotos pequeñas al costado */}
            <div className="sm:col-span-4 flex flex-col gap-4">
              {photos.slice(1).map((photo, i) => (
                <div
                  key={i}
                  className="group relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] sm:flex-1 shadow-xl"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 28vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent p-4 flex flex-col justify-end" />
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <h3 className="font-headline font-bold text-sm text-white">
                      {photo.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
