import { DUMMY_RECAP } from '@/lib/recap/recap-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function MorningRecapPage({ params }: { params: { fiestaId: string } }) {
  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2c2c2c] font-serif p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12 border-b-4 border-double border-gray-800 pb-8">
          <p className="uppercase tracking-widest text-sm font-bold text-gray-500 mb-4">
            Edición Especial • La Mañana Siguiente
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
            El Eco de la Fiesta
          </h1>
          <p className="text-xl italic text-gray-600">
            Toda la verdad sobre lo que pasó anoche, sin censura.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-12">
             <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold uppercase border-b-2 border-black inline-block pb-2">
                  {DUMMY_RECAP.title}
                </h2>
             </div>
             
             {DUMMY_RECAP.sections.map((section, index) => (
                <article key={index} className="mb-10">
                  <h3 className="text-3xl font-bold font-serif mb-6 leading-tight">
                    {section.title}
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-800 text-justify columns-1 md:columns-2 gap-8">
                    <span className="text-5xl float-left mr-2 font-bold leading-none uppercase">
                      {section.content.charAt(0)}
                    </span>
                    {section.content.slice(1)}
                  </p>
                  {index < DUMMY_RECAP.sections.length - 1 && (
                    <div className="flex justify-center my-10">
                      <span className="text-3xl text-gray-400">❧</span>
                    </div>
                  )}
                </article>
             ))}
             
             <div className="text-center italic text-gray-600 text-xl mt-16 font-semibold">
               {DUMMY_RECAP.footer}
             </div>
          </div>

          {/* Sidebar / Additional Info */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-transparent border-2 border-gray-800 shadow-none rounded-none">
              <CardHeader className="bg-gray-800 text-white p-4 rounded-none">
                <CardTitle className="text-lg uppercase tracking-widest text-center">
                  Destacados
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-xl mb-2 font-serif">El Look de la Noche</h3>
                  <p className="text-sm text-gray-700 leading-relaxed text-justify">
                    Todavía seguimos analizando los increíbles outfits que desfilaron anoche. ¡Un derroche de glamour que dejó a todos boquiabiertos!
                  </p>
                </div>
                <Separator className="bg-gray-400" />
                <div>
                  <h3 className="font-bold text-xl mb-2 font-serif">Momento Emotivo</h3>
                  <p className="text-sm text-gray-700 leading-relaxed text-justify">
                    No quedó un ojo seco en el salón durante el brindis principal. Las palabras llegaron directo al corazón de todos los presentes.
                  </p>
                </div>
                <Separator className="bg-gray-400" />
                <div>
                  <h3 className="font-bold text-xl mb-2 font-serif">El Hit Inesperado</h3>
                  <p className="text-sm text-gray-700 leading-relaxed text-justify">
                    Esa canción que nadie esperaba y que terminó cantando todo el salón a los gritos, abrazados en la pista.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="border-t-4 border-b-4 border-double border-gray-800 py-6 text-center">
              <p className="font-bold uppercase tracking-widest text-sm">
                Volumen I • Número 1
              </p>
              <p className="text-xs text-gray-500 mt-2 uppercase">
                Impreso con alegría
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
