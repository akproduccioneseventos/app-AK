import { Cpu, Music, Sparkles, Tv, Users, Wine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const beneficios = [
  {
    icon: <Sparkles className="w-8 h-8 text-amber-500" />,
    title: 'Organización Premium',
    desc: 'Nos encargamos de todo. Catering, barras, DJ, fotografía y video. Todo en un solo lugar con la mejor calidad.',
  },
  {
    icon: <Cpu className="w-8 h-8 text-blue-500" />,
    title: 'Portal de Invitados',
    desc: 'Tus invitados reciben una invitación digital interactiva, pueden confirmar asistencia y sugerir canciones.',
  },
  {
    icon: <Tv className="w-8 h-8 text-rose-500" />,
    title: 'Muro Social en Vivo',
    desc: 'Una pantalla gigante que muestra las fotos que tus invitados suben en tiempo real durante la fiesta.',
  },
  {
    icon: <Wine className="w-8 h-8 text-emerald-500" />,
    title: 'Barra Interactiva',
    desc: 'Pide tragos desde pantallas táctiles o desde el celular. Olvídate de hacer filas largas.',
  },
  {
    icon: <Music className="w-8 h-8 text-purple-500" />,
    title: 'Buzón de Recuerdos',
    desc: 'Tus invitados te dejan mensajes de voz y videos que atesorarás para toda la vida.',
  },
  {
    icon: <Users className="w-8 h-8 text-cyan-500" />,
    title: 'Gestión Inteligente',
    desc: 'Cuentas con un simulador en tiempo real para armar tu presupuesto sin presiones y a tu medida.',
  },
];

export function BeneficiosSection() {
  return (
    <section className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white mb-2">¿Por qué elegir AK Producciones?</h2>
        <p className="text-slate-400">Transformamos tu evento en una experiencia interactiva inolvidable.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {beneficios.map((b, i) => (
          <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-black/50 flex items-center justify-center mb-4 border border-white/5">
                {b.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{b.title}</h3>
              <p className="text-sm text-slate-400">{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
