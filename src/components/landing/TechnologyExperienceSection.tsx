import Link from 'next/link';
import { Bot, CalendarDays, Calculator, Smartphone, ArrowRight, LayoutDashboard, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TechnologyExperienceSectionProps {
  whatsappNumber?: string;
}

const techFeatures = [
  {
    icon: <Smartphone className="w-8 h-8 text-emerald-400" />,
    title: 'Portal de Cliente PRO',
    description: 'Firmá contratos digitalmente, pagá en cuotas, y armá el plano de mesas arrastrando invitados desde tu teléfono o tablet.',
    cta: 'Demo del Portal',
    href: '/portal-cliente/demo',
  },
  {
    icon: <Calculator className="w-8 h-8 text-amber-400" />,
    title: 'Simulador Instantáneo',
    description: 'Armá tu fiesta ideal y conocé el presupuesto en el momento. Jugá con opciones sin pedir cotizaciones lentas.',
    cta: 'Probar Simulador',
    href: '/simulador-ak',
  },
  {
    icon: <Bot className="w-8 h-8 text-indigo-400" />,
    title: 'Bot IA por WhatsApp',
    description: 'Nuestro asistente inteligente responde tus dudas 24/7 y se encarga de confirmar la asistencia de todos tus invitados.',
  },
  {
    icon: <CalendarDays className="w-8 h-8 text-blue-400" />,
    title: 'Google Calendar Sync',
    description: 'Las reuniones de planificación, degustaciones y el día del evento se sincronizan automáticamente en tu agenda.',
  },
  {
    icon: <Ticket className="w-8 h-8 text-pink-400" />,
    title: 'Invitaciones Digitales Inteligentes',
    description: 'Enviá invitaciones con código QR, cronograma interactivo, dress code y cuenta regresiva integrados.',
  },
  {
    icon: <LayoutDashboard className="w-8 h-8 text-slate-400" />,
    title: 'Panel del Organizador (Live)',
    description: 'Nuestros coordinadores controlan tu fiesta con una tablet, monitoreando tiempos, mesas y personal en vivo.',
  }
];

export default function TechnologyExperienceSection({
  whatsappNumber = '59898355530',
}: TechnologyExperienceSectionProps) {
  const waHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hola! Me interesa saber más sobre la tecnología incluida en las fiestas.'
  )}`;

  return (
    <section id="tecnologia" className="bg-slate-950 text-white py-24 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400 mb-6">
            <Bot className="w-4 h-4" /> La revolución del evento inteligente
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6 font-headline">
            AK no es solo fiesta, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">es tecnología para vos.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg leading-relaxed">
            Eliminamos el estrés de organizar. Tu evento incluye un ecosistema de software premium que conecta a tus invitados, organizadores y a vos en un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {techFeatures.map((feature, i) => (
            <div key={i} className="group rounded-3xl border border-slate-800 bg-slate-900/50 p-8 hover:bg-slate-800/80 transition-all duration-300">
              <div className="mb-6 p-4 rounded-2xl bg-slate-950 inline-block border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{feature.description}</p>
              
              {feature.href && (
                <Link href={feature.href} className="inline-flex items-center text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                  {feature.cta} <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80')] opacity-5 bg-cover bg-center mix-blend-overlay"></div>
          
          <div className="max-w-xl relative z-10 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tighter">Todo esto, incluido en tu contrato.</h3>
            <p className="text-slate-400 text-lg">
              No pagás licencias extra ni descargás apps raras. Te entregamos tu evento 100% digitalizado desde el día 1.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto relative z-10 shrink-0">
            <Button asChild size="lg" className="w-full h-14 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-[0_0_20px_rgba(16,185,129,0.3)]"><Link href="/simulador-ak" className="w-full sm:w-auto">
                Probar Simulador
              </Link></Button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 px-8 rounded-2xl border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white font-bold text-base backdrop-blur-md">
                Consultar ahora
              </Button>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
