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
  title: 'XV Años en Uruguay — AK Producciones Eventos',
  description:
    'Los XV años más especiales empiezan con la planificación perfecta. Vals, decoración, video de vida, DJ y más. ¡Cotizá hoy!',
  openGraph: {
    title: 'La Fiesta de Sus Sueños — AK Producciones',
    description: 'Producción integral de XV años en Uruguay. ¡Cotizá hoy!',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=85&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'XV Años AK Producciones',
      },
    ],
  },
};

const WHATSAPP_NUMBER = '59899123456';

const services = [
  { icon: '👑', title: 'Vals y Coreografía', desc: 'Profesores y coreografía personalizada.' },
  { icon: '🎨', title: 'Decoración Temática', desc: 'Ambientación completamente personalizada.' },
  { icon: '📸', title: 'Foto y Video de Vida', desc: 'Video especial con fotos desde bebé.' },
  { icon: '🍰', title: 'Mesa Dulce + Torta', desc: 'Mesa dulce y torta diseñada a medida.' },
  { icon: '🎵', title: 'DJ Toda la Noche', desc: 'Música y efectos especiales profesionales.' },
  { icon: '✉️', title: 'Invitaciones Digitales', desc: 'Invitaciones premium con RSVP online.' },
  { icon: '🎁', title: 'Sorpresa de Medianoche', desc: 'Un momento mágico que nadie va a olvidar.' },
  { icon: '👗', title: 'Asesoría de Vestuario', desc: 'Orientación para el vestido y looks.' },
];

export default async function XVAnosLanding() {
  const promo = await getPromoActiva();

  return (
    <div className="min-h-screen bg-white">
      {promo && <PromoWidget promo={promo} />}
      <LandingNav whatsappNumber={WHATSAPP_NUMBER} />

      {/* Hero */}
      <HeroSection
        whatsappNumber={WHATSAPP_NUMBER}
        headline={"La Fiesta de\nSus Sueños"}
        subheadline="Los XV años más especiales empiezan con la planificación perfecta."
        backgroundImageUrl="https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1920&q=85&auto=format&fit=crop"
      />

      {/* Servicios */}
      <section className="py-24 bg-slate-50" id="servicios">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest mb-6">
              👑 Servicios para XV Años
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              Cada Detalle, Perfecto
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Hacemos de los XV años el evento que siempre soñaste
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

      {/* Video de Vida */}
      <section className="py-20 bg-gradient-to-br from-fuchsia-50 to-purple-50 border-y border-purple-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
            El Video de Vida
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-6">
            Una de nuestras especialidades: un video emocionante con fotos y momentos de la quinceañera
            desde bebé hasta hoy. Un regalo que guarda para siempre.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-bold">
            🎥 Incluido en los paquetes Premium
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

      {/* Formulario */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-widest mb-6">
                🎉 ¡Reservá tu Fecha!
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                Empezá a<br />Planificar Hoy
              </h2>
              <p className="text-slate-500 mb-6">
                Completá el formulario y en menos de 24 horas te contactamos con todas las opciones para los XV de tus sueños.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '✅', text: 'Sin compromiso inicial' },
                  { icon: '✅', text: 'Presupuesto personalizado' },
                  { icon: '✅', text: 'Asesoramiento gratuito' },
                  { icon: '✅', text: 'Reserva de fecha con mínima seña' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="text-slate-700 font-semibold text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <LeadCaptureForm
                fuente="landing-xv"
                whatsappNumber={WHATSAPP_NUMBER}
                tipoEventoDefault="XV Años"
                title="Cotizá los XV"
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
