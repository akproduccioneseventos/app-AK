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
  title: 'Eventos & Corporativos — AK Producciones',
  description:
    'Cumpleaños, eventos corporativos, inauguraciones y más. Paquetes para todos los presupuestos. ¡Cotizá hoy!',
  openGraph: {
    title: 'Eventos que Dejan Huella — AK Producciones',
    description: 'Producción integral de eventos en Uruguay. ¡Cotizá hoy!',
    type: 'website',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=85&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Eventos AK Producciones',
      },
    ],
  },
};

const WHATSAPP_NUMBER = '59899123456';

const services = [
  { icon: '🎈', title: 'Cumpleaños', desc: 'Infantiles y adultos, con toda la magia.' },
  { icon: '🏢', title: 'Eventos Corporativos', desc: 'Reuniones, presentaciones y team buildings.' },
  { icon: '🎊', title: 'Inauguraciones', desc: 'Lanzamientos y aperturas con impacto.' },
  { icon: '🎉', title: 'Aniversarios', desc: 'Bodas de plata, oro y celebraciones.' },
  { icon: '🎓', title: 'Graduaciones', desc: 'El broche de oro para un logro importante.' },
  { icon: '🎤', title: 'Shows y Espectáculos', desc: 'Producción de shows y activaciones.' },
  { icon: '📷', title: 'Foto y Video', desc: 'Registro profesional de cada momento.' },
  { icon: '🎵', title: 'DJ y Sonido', desc: 'Equipamiento de última generación.' },
];

const packages = [
  {
    name: 'Básico',
    desc: 'Hasta 50 personas',
    desde: '$35.000',
    features: ['DJ y sonido', 'Decoración básica', 'Fotografía', 'Coordinación'],
    color: 'border-slate-200',
    badge: '',
  },
  {
    name: 'Intermedio',
    desc: 'Hasta 100 personas',
    desde: '$65.000',
    features: ['Todo el básico', 'Video incluido', 'Mesa dulce', 'Animación', 'Iluminación'],
    color: 'border-purple-400',
    badge: '⭐ Más popular',
  },
  {
    name: 'Premium',
    desc: 'Hasta 200 personas',
    desde: '$110.000',
    features: ['Todo el intermedio', 'Producción completa', 'Catering', 'Efectos especiales', 'Coordinador exclusivo'],
    color: 'border-amber-400',
    badge: '👑 Premium',
  },
];

export default async function EventosLanding() {
  const promo = await getPromoActiva();

  return (
    <div className="min-h-screen bg-white">
      {promo && <PromoWidget promo={promo} />}
      <LandingNav whatsappNumber={WHATSAPP_NUMBER} />

      {/* Hero */}
      <HeroSection
        whatsappNumber={WHATSAPP_NUMBER}
        headline={"Eventos que\nDejan Huella"}
        subheadline="Cumpleaños, corporativos, inauguraciones — cada evento tiene su magia."
        backgroundImageUrl="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=85&auto=format&fit=crop"
      />

      {/* Servicios */}
      <section className="py-24 bg-slate-50" id="servicios">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-6">
              🎊 Para Cada Ocasión
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              Qué Hacemos
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Desde cumpleaños íntimos hasta eventos corporativos de gran escala
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

      {/* Paquetes */}
      <section className="py-24 bg-white" id="paquetes">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-widest mb-6">
              💰 Paquetes y Precios
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">
              Elegí tu Paquete
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Opciones para cada presupuesto. Todos incluyen coordinación y soporte completo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`bg-white rounded-3xl p-7 border-2 ${pkg.color} hover:shadow-2xl transition-all duration-300 relative`}
              >
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                      {pkg.badge}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-black text-slate-900 mb-1">Paquete {pkg.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{pkg.desc}</p>
                <div className="text-3xl font-black text-purple-600 mb-6">{pkg.desde}</div>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-green-500 font-black">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola AK Producciones! Me interesa el Paquete ${pkg.name} para mi evento.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-sm uppercase tracking-widest hover:scale-105 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Consultar
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            * Precios orientativos en pesos uruguayos. Sujetos a disponibilidad y personalización.
          </p>
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
      <section className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest mb-6">
                🚀 Empezá Ahora
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                Cotizá tu<br />Evento Hoy
              </h2>
              <p className="text-slate-500 mb-6">
                Completá el formulario y en menos de 24 horas te contactamos con la propuesta perfecta para tu evento.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '✅', text: 'Atención personalizada' },
                  { icon: '✅', text: 'Sin costos ocultos' },
                  { icon: '✅', text: 'Reserva flexible' },
                  { icon: '✅', text: '+500 eventos de experiencia' },
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
                fuente="landing-eventos"
                whatsappNumber={WHATSAPP_NUMBER}
                tipoEventoDefault="Evento"
                title="Cotizá tu Evento"
                subtitle="Te respondemos en menos de 24 horas"
              />
            </div>
          </div>
        </div>
      </section>

      <PublicFooter variant="dark" />
    </div>
  );
}
