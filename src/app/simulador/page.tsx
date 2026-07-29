import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Building2,
  Calculator,
  CheckCircle2,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  appendCommercialAttribution,
  commercialAttributionFromRecord,
  describeCommercialSource,
} from '@/lib/commercial/acquisition';

type SimulatorHubProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const options = [
  {
    id: 'visual',
    title: 'Armado Rapido de Propuesta',
    badge: 'Popular & Instantaneo',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black',
    description: 'Compara menus, paquetes de servicios y tecnologia mientras ves como cambia el presupuesto en tiempo real.',
    href: '/simulador-de-presupuesto',
    icon: Calculator,
    accent: 'bg-red-700 hover:bg-red-800',
    border: 'border-amber-400/50 shadow-xl shadow-amber-500/10',
    features: ['Seleccion visual de platos y bebidas', 'Precios congelados y garantia de calidad', 'Incluye Salón Club Uruguay 50% OFF y Tecnologia VIP'],
  },
  {
    id: 'assistant',
    title: 'Conversar con Sofia IA',
    badge: 'Asistencia Guiada',
    badgeColor: 'bg-purple-600 text-white font-bold',
    description: 'Sofia te hace preguntas sencillas y te arma la mejor propuesta segun la cantidad de invitados y tu presupuesto.',
    href: '/simulador-ak',
    icon: Bot,
    accent: 'bg-purple-700 hover:bg-purple-800',
    border: 'border-slate-200 hover:border-purple-300',
    features: ['Conversacion guiada en lenguaje natural', 'Ideal si no sabes por donde empezar', 'Presupuesto completo y descargable en PDF'],
  },
] as const;

export default async function SimulatorHubPage(props: SimulatorHubProps) {
  const searchParams = await props.searchParams;
  const attribution = commercialAttributionFromRecord(searchParams, 'direct');
  const sourceLabel = describeCommercialSource(attribution);
  const whatsappText = [
    'Hola AK Producciones, quiero cotizar y planificar mi evento con ustedes.',
    `Llegue desde: ${sourceLabel}.`,
  ].join('\n');
  const whatsappHref = `https://wa.me/59898355530?text=${encodeURIComponent(whatsappText)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-red-700 selection:text-white">
      {/* Hero Header section with Nano Banana PRO image */}
      <section className="relative min-h-[55vh] overflow-hidden border-b border-slate-800">
        <Image
          src="/media/catalogo-servicios/simulador_hero_pro.jpg"
          alt="Fiesta inolvidable AK Producciones"
          fill
          priority
          unoptimized
          className="object-cover object-center opacity-45 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="relative mx-auto flex min-h-[55vh] max-w-7xl flex-col justify-end px-4 py-16 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-300 backdrop-blur-md self-start mb-4">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Simulador Oficial AK Producciones · Salto, Uruguay
          </div>
          <h1 className="max-w-4xl font-headline text-3xl font-black leading-tight text-white sm:text-6xl tracking-tight">
            La fiesta de tus sueños, planificada con garantía total de excelencia
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-slate-200 sm:text-xl">
            Sin sorpresas ni presupuestos incompletos. Elegí cómo preferís armar tu cotización instantánea y descubrí los beneficios exclusivos de contratar con AK Producciones.
          </p>

          {/* Quick Value Badges */}
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 border border-slate-700">
              <PartyPopper className="h-4 w-4 text-red-500" /> Producción Integral AK
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 border border-slate-700">
              <Building2 className="h-4 w-4 text-amber-400" /> Salón Club Uruguay 50% OFF
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 border border-slate-700">
              <Zap className="h-4 w-4 text-emerald-400" /> Precios Congelados
            </span>
          </div>
        </div>
      </section>

      {/* Main Options Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">Elegí la experiencia para cotizar tu fiesta</h2>
          <p className="text-sm font-semibold text-slate-400">Ambas herramientas cuentan con el catálogo oficial, menúes y precios reales de AK Producciones.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            const href = appendCommercialAttribution(option.href, {
              ...attribution,
              entryPath: '/simulador',
              simulatorMode: option.id,
            });
            return (
              <article key={option.id} className={`relative flex flex-col rounded-3xl border bg-slate-900/90 p-8 backdrop-blur-xl transition duration-300 hover:border-red-500/60 hover:shadow-2xl ${option.border}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/10">
                    <Icon className="h-7 w-7 text-amber-400" />
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                </div>
                <h3 className="mt-6 text-2xl font-black text-white">{option.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">{option.description}</p>
                <ul className="mt-6 space-y-3 border-t border-slate-800 pt-6">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-xs font-bold text-slate-200">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={`mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg active:scale-95 ${option.accent}`}
                >
                  Iniciar Cotización <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}

          {/* Direct WhatsApp Consultation Card */}
          <article className="flex flex-col rounded-3xl border border-emerald-500/40 bg-emerald-950/30 p-8 backdrop-blur-xl transition duration-300 hover:border-emerald-400 hover:shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <MessageCircle className="h-7 w-7" />
              </span>
              <span className="rounded-full bg-emerald-500 text-slate-950 font-black px-3 py-1 text-[10px] uppercase tracking-wider">
                Atención Personalizada
              </span>
            </div>
            <h3 className="mt-6 text-2xl font-black text-white">Hablar con un Asesor AK</h3>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">
              Para eventos corporativos, casamientos a medida o si preferís coordinar directamente con nuestro equipo de productores.
            </p>
            <div className="mt-6 flex gap-3 border-y border-emerald-500/30 py-5 text-xs font-bold text-emerald-200">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
              Revisamos disponibilidad de fecha, menú, salón y tecnología sin costo.
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-500 shadow-lg active:scale-95"
            >
              Consultar por WhatsApp <ArrowRight className="h-4 w-4" />
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
