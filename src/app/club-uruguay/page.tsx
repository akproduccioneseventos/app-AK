import React from 'react';
import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Sparkles, Calendar, MessageCircle, MapPin, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Servicio Integral en el Salón del Club Uruguay | AK Producciones',
  description: 'Organización integral, catering premium, discoteca y ambientación personalizada en el histórico Salón del Club Uruguay de Salto.',
};

export default function ClubUruguayPage() {
  const whatsapp = '59898355530';

  // Fotos reales tomadas en el Club Uruguay por AK Producciones
  const clubPhotos = [
    { src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg', alt: 'Pista y Discoteca en Club Uruguay', desc: 'Montaje de discoteca y sonido profesional en el salón clásico.' },
    { src: '/media/catalogo-servicios/discoteca-salon-ak-02.jpeg', alt: 'Pantallas y Sonido de Vanguardia', desc: 'Decoración e iluminación robótica integrada en el evento.' },
    { src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', alt: 'Pista de Luces LED Activa', desc: 'Pista LED interactiva, un diferencial único de nuestras fiestas.' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-600 selection:text-white">
      <LandingNav whatsappNumber={whatsapp} />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/media/catalogo-servicios/salon-discoteca-ak-01.jpeg"
            alt="Salón Club Uruguay"
            className="w-full h-full object-cover object-center opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
            Servicio de Fiesta Completo
          </span>
          <h1 className="font-headline text-5xl sm:text-7xl font-black tracking-tight text-white leading-tight">
            El Salón en <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Club Uruguay</span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
            El salón más elegante e histórico de Salto, con la producción integral, catering premium y tecnología exclusiva de **AK Producciones**.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 px-8 py-6">
              <Link href="/simulador-de-presupuesto?salon=club">
                <Calendar className="w-4 h-4 mr-2" />
                Cotizá tu Fiesta en Minutos
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold rounded-2xl px-8 py-6">
              <a href={`https://wa.me/${whatsapp}?text=Hola%20AK%20Producciones!%20Me%20interesa%20saber%20más%20sobre%20el%20servicio%20integral%20en%20el%20Club%20Uruguay.`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                Coordinar Entrevista por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Características del Salón */}
      <section className="py-24 border-t border-white/5 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Propuesta de Valor</span>
            <h2 className="font-headline text-3xl sm:text-5xl font-black">Servicio Integral en el Salón</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
              Planificación integral con AK Producciones: decoración, catering, música, foto, video y coordinación en un solo lugar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <span className="text-indigo-400 font-black text-xs uppercase tracking-wider">Ubicación</span>
              <h3 className="text-xl font-bold font-headline">Centro de Salto</h3>
              <p className="text-zinc-400 leading-relaxed text-xs">
                Ubicado en calle Uruguay al 700, frente a la plaza principal. Un salón histórico de fácil acceso para todos tus invitados.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <span className="text-indigo-400 font-black text-xs uppercase tracking-wider">Capacidad</span>
              <h3 className="text-xl font-bold font-headline">Hasta 200 Personas</h3>
              <p className="text-zinc-400 leading-relaxed text-xs">
                Capacidad referencial ideal para bodas y fiestas de XV años íntimas y elegantes, con distribución optimizada de mesas.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <span className="text-indigo-400 font-black text-xs uppercase tracking-wider">Tecnología</span>
              <h3 className="text-xl font-bold font-headline">Diseño 2D / 3D</h3>
              <p className="text-zinc-400 leading-relaxed text-xs">
                Diseñamos el plano de tu fiesta a color en 2D y 3D para que imagines la distribución de mesas, pista LED y discoteca antes del evento.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <span className="text-indigo-400 font-black text-xs uppercase tracking-wider">Atención</span>
              <h3 className="text-xl font-bold font-headline">Entrevista Sin Costo</h3>
              <p className="text-zinc-400 leading-relaxed text-xs">
                Coordiná tu reunión para resolver todo de una sola vez. Disfrutá de tu fiesta como un invitado más sin el estrés de organizar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Galería Real */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Registros de Fiestas</span>
            <h2 className="font-headline text-3xl sm:text-5xl font-black">Fotos Reales de Nuestros Eventos</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
              Fotos y montajes de eventos reales organizados de principio a fin por AK Producciones en el Salón del Club Uruguay de Salto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {clubPhotos.map((photo, index) => (
              <div
                key={index}
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 aspect-[4/3]"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent p-6 flex flex-col justify-end" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                  <p className="font-headline font-bold text-lg text-white">{photo.alt}</p>
                  <p className="text-xs text-zinc-300 mt-1">{photo.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Sección */}
      <section className="py-24 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
          <h2 className="font-headline text-3xl sm:text-5xl font-black">¿Querés que organicemos tu fiesta?</h2>
          <p className="text-zinc-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Hacé tu cotización personalizada al instante con nuestro simulador. Podés calcular costos del salón en Club Uruguay, catering, discoteca y ambientación en tiempo real.
          </p>
          <div className="pt-4">
            <Button asChild size="lg" className="bg-white hover:bg-zinc-100 text-zinc-950 font-black rounded-2xl px-10 py-6 text-base shadow-lg shadow-white/10 active:scale-[0.98] transition-all">
              <Link href="/simulador-de-presupuesto?salon=club">
                Cotizar Fiesta en Club Uruguay
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter variant="dark" />
    </div>
  );
}
