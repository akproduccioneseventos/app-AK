import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/LandingNav';
import { HeroSection } from '@/components/landing/HeroSection';
import { LeadCaptureForm } from '@/components/landing/LeadCaptureForm';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PublicFooter } from '@/components/public-footer';
import { getPromoActiva } from '@/app/actions/promos';
import { PromoWidget } from '@/components/promo/PromoWidget';
import { PromoCountdown } from '@/components/promo/PromoCountdown';
import { MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bodas en Uruguay — AK Producciones Eventos',
  description:
    'Organizamos la boda de tus sueños. Ceremonia, decoración, fotografía 4K, catering gourmet, DJ y más. ¡Cotizá hoy!',
  openGraph: {
    title: 'Tu Boda Soñada Empieza Aquí — AK Producciones',
    description: 'Producción integral de bodas en Uruguay. ¡Cotizá hoy!',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Bodas AK Producciones',
      },
    ],
  },
};

const WHATSAPP_NUMBER = '59899123456';

const services = [
  { icon: '💒', title: 'Ceremonia Completa', desc: 'Civil o religiosa, organizamos cada detalle.' },
  { icon: '🎨', title: 'Decoración Floral', desc: 'Ambientación y decoración floral a medida.' },
  { icon: '📸', title: 'Fotografía y Video 4K', desc: 'Capturamos cada momento para la eternidad.' },
  { icon: '🍽️', title: 'Catering Gourmet', desc: 'Menús personalizados para todos los gustos.' },
  { icon: '🎵', title: 'DJ y Animación', desc: 'Música y animación profesional toda la noche.' },
  { icon: '🎂', title: 'Torta + Mesa Dulce', desc: 'Torta nupcial y mesa dulce personalizada.' },
  { icon: '🚗', title: 'Traslado de Novios', desc: 'Vehículo de lujo para los protagonistas.' },
  { icon: '💐', title: 'Bouquet de Novia', desc: 'Ramos y arreglos florales únicos.' },
];

export default async function BodasLanding() {
  const promo = await getPromoActiva();
  const waMsg = encodeURIComponent(
    '¡Hola AK Producciones! Vi su landing de Bodas y me gustaría cotizar mi boda.'
  );

  return (
    <div className="min-h-screen bg-white">
      {promo && <PromoWidget promo={promo} />}
      <LandingNav whatsappNumber={WHATSAPP_NUMBER} />

      {/* Hero */}
      <HeroSection
        whatsappNumber={WHATSAPP_NUMBER}
        headline={"Tu Boda Soñada\nEmpieza Aquí"}
        subheadline="Organizamos cada detalle de tu gran día. Desde la ceremonia hasta el último baile."
        backgroundImageUrl="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85&auto=format&fit=crop"
      />

      {/* Servicios */}
      <section className="py-24 bg-slate-50" id="servicios">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-700 text-xs font-black uppercase tracking-widest mb-6">
              💍 Servicios para tu Boda
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              Todo para tu Gran Día
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Nos encargamos de absolutamente todo para que solo tengas que disfrutar
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100"
              >
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-black text-slate-900 mb-1">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <TestimonialsSection />

      {/* Urgencia + Promo */}
      {promo && (
        <section className="py-16 bg-gradient-to-br from-purple-900 via-fuchsia-900 to-indigo-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-black uppercase tracking-widest mb-6">
              🔥 Oferta Especial
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">{promo.titulo}</h2>
            {promo.regalo && (
              <p className="text-yellow-300 font-black text-xl mb-6">🎁 {promo.regalo}</p>
            )}
            {promo.mostrarCountdown && (
              <div className="mb-8">
                <p className="text-white/60 text-sm uppercase tracking-widest mb-3">⏱ La oferta termina en:</p>
                <div className="flex justify-center">
                  <PromoCountdown fechaFin={promo.fechaFin} />
                </div>
              </div>
            )}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(promo.whatsappMensaje)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-base uppercase tracking-widest shadow-2xl transition-all hover:scale-105"
            >
              <MessageSquare className="w-5 h-5" />
              {promo.ctaTexto}
            </a>
          </div>
        </section>
      )}

      {/* Cupos disponibles */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-amber-800 font-black text-lg">
            🔥 Solo quedan <span className="text-2xl text-amber-600">8 cupos</span> disponibles para bodas en 2026
          </p>
          <p className="text-amber-600 text-sm mt-1">¡Asegurá tu fecha antes de que sea tarde!</p>
        </div>
      </section>

      {/* Calculadora rápida */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest mb-6">
                🧮 Estimador Rápido
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                ¿Cuánto Cuesta<br />tu Boda?
              </h2>
              <p className="text-slate-500 mb-6">
                Cada boda es única. El costo depende de la cantidad de invitados, los servicios y el nivel de personalización.
              </p>
              <div className="space-y-3">
                {[
                  { rango: 'Hasta 50 personas', desde: 'Desde $45.000' },
                  { rango: '50 a 100 personas', desde: 'Desde $75.000' },
                  { rango: '100 a 200 personas', desde: 'Desde $120.000' },
                  { rango: 'Más de 200 personas', desde: 'Presupuesto a medida' },
                ].map((item) => (
                  <div
                    key={item.rango}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <span className="text-sm font-semibold text-slate-700">{item.rango}</span>
                    <span className="text-sm font-black text-purple-600">{item.desde}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-3">* Precios orientativos en pesos uruguayos. Consultá por tu presupuesto personalizado.</p>
            </div>
            <div>
              <LeadCaptureForm
                fuente="landing-bodas"
                whatsappNumber={WHATSAPP_NUMBER}
                tipoEventoDefault="Boda"
                title="Cotizá tu Boda"
                subtitle="Recibí un presupuesto personalizado en menos de 24 horas"
              />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter variant="dark" />
    </div>
  );
}
