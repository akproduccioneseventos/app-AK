import NextImage from 'next/image';
import { Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClubUruguaySection() {
  const fotos = [
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530103862676-de8892bc952f?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1000&auto=format&fit=crop',
  ];

  return (
    <section className="py-12">
      <div className="bg-gradient-to-br from-amber-900/40 to-black border border-amber-500/20 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold">
              <Building2 className="w-4 h-4" /> Locación Exclusiva
            </div>
            <h2 className="text-4xl font-black text-white">Salón Club Uruguay</h2>
            <p className="text-slate-300">
              Ubicado en el corazón de Salto, el Club Uruguay es uno de los salones más prestigiosos y amplios de la ciudad. 
              En AK Producciones trabajamos directamente con ellos para ofrecerte una experiencia integral llave en mano.
            </p>
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <MapPin className="w-4 h-4 text-amber-500" /> Uruguay 754, Salto
            </div>
            <div className="pt-4">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-8 h-12">
                Consultar Disponibilidad
              </Button>
            </div>
          </div>
          
          <div className="flex-1 w-full grid grid-cols-2 gap-3">
            <div className="col-span-2 relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <NextImage src={fotos[0]} alt="Club Uruguay" fill className="object-cover" unoptimized />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <NextImage src={fotos[1]} alt="Club Uruguay" fill className="object-cover" unoptimized />
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10">
              <NextImage src={fotos[2]} alt="Club Uruguay" fill className="object-cover" unoptimized />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
