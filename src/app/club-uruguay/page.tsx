import React from 'react';
import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building2, Sparkles, Calendar, MessageCircle, MapPin, Users, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'El Salón en Club Uruguay | AK Producciones Salto',
  description: 'El salón más elegante e histórico de Salto, Uruguay, con la producción integral y tecnología interactiva exclusiva de AK Producciones.',
};

export default function ClubUruguayPage() {
  const whatsapp = '59898355530';

  // Fotos reales tomadas en el Club Uruguay del catálogo optimizado
  const clubPhotos = [
    { src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg', alt: 'Montaje de salón y discoteca en Club Uruguay', desc: 'Vista completa del salón principal con equipamiento AK.' },
    { src: '/media/catalogo-servicios/boda-decoracion-dorada-01.jpeg', alt: 'Decoración de boda premium en Club Uruguay', desc: 'Decoración de mesa principal en tonos dorados y blancos.' },
    { src: '/media/catalogo-servicios/xv-pista-iluminada-01.jpeg', alt: 'Pista de baile iluminada LED en Club Uruguay', desc: 'Tecnología interactiva en pista de baile.' },
    { src: '/media/catalogo-servicios/candy-bar-completo-ak-02.jpeg', alt: 'Candy Bar completo en Club Uruguay', desc: 'Mesa de dulces y chocolates personalizada.' },
    { src: '/media/catalogo-servicios/decoracion-xv-luces-01.jpeg', alt: 'Fondo de luces y ambientación en Club Uruguay', desc: 'Luz cálida y ambientación romántica.' },
    { src: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg', alt: 'Catering y presentación gastronómica', desc: 'Servicio de catering real para eventos.' }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-600 selection:text-white">
      <LandingNav whatsappNumber={whatsapp} />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/media/catalogo-servicios/salon-discoteca-ak-01.jpeg" 
            alt="Club Uruguay" 
            className="w-full h-full object-cover object-center opacity-40 scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
            Locación Destacada en Salto
          </span>
          <h1 className="font-headline text-5xl sm:text-7xl font-black tracking-tight text-white leading-tight">
            El Salón en <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Club Uruguay</span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            El espacio más distinguido e histórico de Salto se fusiona con la tecnología, producción y catering premium de **AK Producciones**.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 px-8 py-6">
              <Link href="/simulador-de-presupuesto?salon=club">
                <Calendar className="w-4 h-4 mr-2" />
                Cotizar tu Fiesta Aquí
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/10 hover:bg-white/5 text-white font-bold rounded-2xl px-8 py-6">
              <a href={`https://wa.me/${whatsapp}?text=Hola%20AK%20Producciones!%20Me%20interesa%20saber%20más%20sobre%20el%20salón%20en%20el%20Club%20Uruguay.`} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4 mr-2 text-emerald-400" />
                Consultar por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Características Clave */}
      <section className="py-24 border-t border-white/5 bg-zinc-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Ubicación Inmejorable</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Ubicado en el casco histórico de la ciudad de Salto, frente a la plaza principal, ofreciendo un acceso inigualable y estacionamiento cómodo para tus invitados.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 hover:border-purple-50/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Gran Capacidad</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Espacios adaptables con capacidad desde 100 hasta 450 personas sentadas, ideales para bodas de gala, cumpleaños de 15 soñados y banquetes empresariales.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 hover:border-pink-500/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-headline">Producción Exclusiva</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Equipamiento de última generación instalado permanentemente: sonido line array, pantallas gigantes de LED, iluminación móvil robótica y un catering de primer nivel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Galería Real */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-2">
            <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Portafolio Visual</span>
            <h2 className="font-headline text-3xl sm:text-5xl font-black">Fotos Reales del Salón</h2>
            <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
              Explorá montajes auténticos realizados por nuestro equipo en el Club Uruguay. Sin renders, sin fotos falsas de stock.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubPhotos.map((photo, index) => (
              <div 
                key={index} 
                className="group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 aspect-[4/3] hover:border-indigo-500/40 transition-all duration-300"
              >
                <img 
                  src={photo.src} 
                  alt={photo.alt} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
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
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
          <h2 className="font-headline text-3xl sm:text-5xl font-black">¿Listo para festejar en el Club Uruguay?</h2>
          <p className="text-zinc-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Hacé tu cotización personalizada al instante con nuestro simulador inteligente. Podés calcular costos de salón, catering, discoteca y ambientación en tiempo real.
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
