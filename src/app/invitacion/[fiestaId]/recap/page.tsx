import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';

export default function MorningRecapPage({ params }: { params: { fiestaId: string } }) {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2c2c2c] font-serif p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <header className="mb-8 border-b-4 border-double border-gray-800 pb-8">
          <p className="uppercase tracking-widest text-sm font-bold text-gray-500 mb-4">
            Edición Especial • La Mañana Siguiente
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
            El Eco de la Fiesta
          </h1>
          <p className="text-xl italic text-gray-600">
            Estamos revelando las fotos y procesando los recuerdos de anoche.
          </p>
        </header>

        <main className="space-y-8">
          <Clock className="w-16 h-16 mx-auto text-gray-400 animate-pulse" />
          <h2 className="text-2xl font-bold">¡La crónica oficial estará disponible pronto!</h2>
          <p className="text-lg text-gray-600">
            Vuelve más tarde para leer el resumen exclusivo de los mejores momentos de la fiesta.
          </p>
        </main>
      </div>
    </div>
  );
}
