import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Phone, MapPin, Building2, User, CheckCircle, XCircle } from 'lucide-react';
import { catalogList } from '@/data/event-catalogs';
import { CompanyLogo } from '@/components/company-logo';

export const metadata: Metadata = {
  title: 'Organizá tu Fiesta sin Estrés | AK Producciones Eventos – Salto, Uruguay',
  description:
    'Organizamos tu evento completo para que vos solo disfrutes como un invitado más. Salón, catering, decoración y más. Coordiná tu entrevista sin costo: 098 355 530.',
};

const WHATSAPP_NUMBER = '59898355530';
const WHATSAPP_MESSAGE =
  '👋 Hola! Quiero coordinar una entrevista sin costo para organizar mi evento con AK Producciones.';
const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const CTA_PHONE = '098 355 530';
const CTA_PHONE_HREF = 'tel:+59898355530';

export default function PublicCatalogPage() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CompanyLogo size="sm" />
            <span className="text-sm font-black uppercase tracking-widest text-slate-800 hidden sm:block">
              AK Producciones
            </span>
          </div>
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all duration-200 hover:scale-105 active:scale-95">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">📲 {CTA_PHONE}</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>
          </a>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-purple-700 via-purple-800 to-slate-900 text-white overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-300/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-20 sm:py-28 text-center flex flex-col items-center gap-8">
          <CompanyLogo size="lg" className="drop-shadow-2xl" />
          <div className="space-y-5">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-300">
              Salto · Uruguay
            </p>
            <h1 className="text-3xl sm:text-5xl font-black leading-tight">
              👉 ¿Estás organizando una fiesta y no sabés por dónde empezar…
              <span className="text-purple-200"> o ya te diste cuenta que hacerlo solo es un caos?</span>
            </h1>
            <p className="text-lg sm:text-xl text-purple-100 leading-relaxed max-w-2xl mx-auto">
              Organizamos tu evento <strong>completo</strong> para que vos solo disfrutes 🥂 como un invitado más.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 animate-pulse hover:animate-none motion-reduce:animate-none">
                <MessageSquare className="w-5 h-5 shrink-0" />
                📲 Coordiná tu entrevista sin costo
              </button>
            </a>
            <a href={CTA_PHONE_HREF} className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-black text-sm uppercase tracking-widest transition-all duration-200 hover:scale-105 active:scale-95">
                <Phone className="w-5 h-5 shrink-0" />
                {CTA_PHONE}
              </button>
            </a>
          </div>
          <p className="text-xs text-purple-300 font-medium">Sin compromiso. Primera consulta 100% gratis.</p>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-10">
            ❌ Lo que nadie te dice de organizar una fiesta…
          </h2>
          <div className="space-y-4">
            {[
              'Coordinar salón, catering, DJ, decoración y fotógrafo al mismo tiempo es agotador, y siempre algo se cae.',
              'Los costos "extra" que aparecen al final: servicio, propinas, horas adicionales… Lo que parecía barato termina siendo caro.',
              'Meses de tu tiempo libre los gastás resolviendo problemas en lugar de disfrutar la etapa de preparación.',
              'El día del evento estás tan cansado y estresado que no podés disfrutar tu propia fiesta.',
              '¿Y si algo sale mal? No tenés a quién llamar a las 2am del sábado.',
            ].map((pain) => (
              <div key={pain} className="flex gap-3 items-start p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-slate-700 font-medium">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE SOLUTION ─────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">La solución</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              🏛️ Un solo equipo. Todo resuelto.
            </h2>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Contamos con <strong>El Salón en Club Uruguay</strong>, uno de los espacios más elegantes de Salto, y un servicio integral que une bajo un mismo techo todo lo que tu fiesta necesita.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              { emoji: '🏛️', title: 'El Salón (Club Uruguay)', desc: 'Capacidad para todo tipo de eventos. Ambientación personalizada según tu estilo y presupuesto.' },
              { emoji: '🎶', title: 'DJ Profesional', desc: 'Música en vivo y DJ con años de experiencia en bodas, XV años y fiestas temáticas.' },
              { emoji: '📸', title: 'Fotografía y Video', desc: 'Recuerdos que duran toda la vida. Cobertura completa del evento.' },
              { emoji: '🎀', title: 'Decoración Completa', desc: 'Diseño personalizado según tu tema: flores, globos, ambientación y más.' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-3 p-5 bg-purple-50 rounded-2xl border border-purple-100">
                <span className="text-3xl shrink-0">{emoji}</span>
                <div>
                  <h3 className="font-black text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <button className="mt-4 flex items-center gap-2 mx-auto px-8 py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-sm uppercase tracking-widest shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
              <MessageSquare className="w-5 h-5 shrink-0" />
              Quiero saber más · {CTA_PHONE}
            </button>
          </a>
        </div>
      </section>

      {/* ── CATERING DIFFERENTIATOR ───────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500 mb-3">Nuestro diferencial más comentado</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              🍽️ Comida abundante, de calidad… y sin sorpresas.
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              En AK Producciones el catering no es un gasto escondido ni una promesa vacía.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: '✅', text: 'Menú diseñado con vos, adaptado a tu cantidad de invitados y presupuesto.' },
              { icon: '✅', text: 'Abundante de verdad. Sin esa sensación de que la comida nunca alcanzó.' },
              { icon: '✅', text: 'Calidad garantizada: productos frescos y personal de servicio profesional.' },
              { icon: '⭐', text: 'Lo que sobra, se devuelve. Sin letra chica, sin excusas. Si sobra comida, es tuya.' },
            ].map(({ icon, text }) => (
              <div key={text} className={`flex gap-3 items-start p-4 rounded-2xl border shadow-sm ${icon === '⭐' ? 'bg-amber-100 border-amber-300' : 'bg-white border-amber-100'}`}>
                <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                <p className={`font-medium ${icon === '⭐' ? 'text-amber-900 font-black' : 'text-slate-700'}`}>{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 bg-amber-700 rounded-3xl text-white text-center shadow-xl">
            <p className="text-xl font-black">🔁 "Se devuelve lo que sobra"</p>
            <p className="mt-2 text-amber-100 font-medium">Así de confiados estamos en la cantidad y calidad de nuestra comida. Nuestros clientes lo saben y lo cuentan.</p>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ────────────────────────────────────── */}
      <section className="py-12 px-4 bg-gradient-to-br from-slate-900 to-purple-950 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 text-center mb-10">
            {[
              { icon: '🏆', label: '+10 años de experiencia' },
              { icon: '🎉', label: '+500 eventos realizados' },
              { icon: '⭐', label: '100% clientes satisfechos' },
              { icon: '📍', label: 'Salto, Uruguay' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-3xl">{icon}</span>
                <p className="text-xs font-black uppercase tracking-wider text-slate-300">{label}</p>
              </div>
            ))}
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-black">¿Listo para empezar?</h2>
            <p className="text-purple-200">Primera consulta sin costo. Te orientamos aunque todavía no tengas fecha ni presupuesto definido.</p>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#1eb356] text-white font-black text-sm uppercase tracking-widest shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95">
                <MessageSquare className="w-5 h-5 shrink-0" />
                📲 Coordiná tu entrevista sin costo al {CTA_PHONE}
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── EVENT TYPE CATALOG ───────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-purple-500 mb-3">Catálogo de Servicios</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ¿Qué tipo de evento estás planeando?
            </h2>
            <p className="mt-2 text-slate-500">
              Tocá el tipo de evento para ver todos los detalles, paquetes y precios.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogList.map((catalog) => (
              <Link
                key={catalog.slug}
                href={`/public/${catalog.slug}`}
                className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <span
                  className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300 drop-shadow"
                  role="img"
                  aria-label={catalog.name}
                >
                  {catalog.hero.emoji}
                </span>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors duration-200">
                  {catalog.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {catalog.hero.subheadline}
                </p>
                <span className="mt-4 text-xs font-black uppercase tracking-wider text-purple-500 group-hover:underline">
                  Ver paquetes →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEGAL FOOTER ─────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <CompanyLogo size="sm" className="opacity-60" />
            <span className="text-white font-black text-sm uppercase tracking-widest">AK Producciones Eventos</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <Building2 className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <div>
                  <p><span className="text-slate-300 font-semibold">RUT:</span> 220372680019</p>
                  <p><span className="text-slate-300 font-semibold">Empresa:</span> 0000008898364</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <p>Gaboto 3390, Salto, Uruguay</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <User className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <div>
                  <p><span className="text-slate-300 font-semibold">Representante:</span> Alexander Knuth</p>
                  <p>CI 4.617.350-8</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <Phone className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <a href={CTA_PHONE_HREF} className="hover:text-white transition-colors">{CTA_PHONE}</a>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-slate-600 border-t border-slate-800 pt-4">
            © {new Date().getFullYear()} AK Producciones Eventos · Todos los derechos reservados · Salto, Uruguay
          </p>
        </div>
      </footer>
    </div>
  );
}
