import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Calculator,
  MessageCircle,
  Cpu,
  Layers,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicFooter } from '@/components/public-footer';
import { TECNOLOGIAS_AK, GRUPOS_TECNOLOGIA, type GrupoTecnologia } from '@/data/tecnologia-ak';

const WHATSAPP_URL = 'https://wa.me/59898355530?text=Hola%20AK%2C%20estuve%20viendo%20el%20cat%C3%A1logo%20de%20tecnolog%C3%ADas%20y%20quiero%20hacerles%20una%20consulta';

export const metadata = {
  title: 'La tecnología de AK Producciones | Soluciones interactivas para tu fiesta',
  description: 'Conocé todas las tecnologías y herramientas interactivas desarrolladas por AK Producciones para quinceañeras, bodas y eventos.',
};

export default function TecnologiaPage() {
  const totalTecnologias = TECNOLOGIAS_AK.length;
  const grupos = Object.keys(GRUPOS_TECNOLOGIA) as GrupoTecnologia[];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Barra superior institucional */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-wider text-amber-400">AK</span>
            <span className="text-xs uppercase tracking-widest text-slate-400">Eventos</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" asChild className="border-slate-700 text-slate-200 text-xs hidden sm:inline-flex">
              <Link href="/experiencia">
                Ver experiencia
              </Link>
            </Button>
            <Button size="sm" asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs">
              <Link href="/simulador-ak">
                <Calculator className="w-3.5 h-3.5 mr-1" />
                Armar presupuesto
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Cabecera principal con contador real */}
      <section className="py-12 px-4 max-w-4xl mx-auto text-center">
        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3 px-3 py-1">
          +7 años de experiencia · +200 eventos realizados
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Más de <span className="text-amber-400">{totalTecnologias} tecnologías</span> en tu fiesta
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Diseñamos herramientas propias para que tu fiesta sea única: desde invitaciones interactivas hasta pantallas en vivo y álbumes automáticos con reconocimiento facial.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm">
            <Link href="/experiencia">
              Recorrer demostración interactiva
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-700 text-slate-200 text-sm">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-400" />
              Consultar por WhatsApp
            </a>
          </Button>
        </div>
      </section>

      {/* Secciones por grupo de tecnología */}
      <main className="max-w-6xl mx-auto px-4 w-full flex-1 mb-20 space-y-16">
        {grupos.map((grupoKey) => {
          const infoGrupo = GRUPOS_TECNOLOGIA[grupoKey];
          const itemsGrupo = TECNOLOGIAS_AK.filter((item) => item.grupo === grupoKey);

          if (itemsGrupo.length === 0) return null;

          return (
            <section key={grupoKey} className="space-y-6">
              <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                    {infoGrupo.nombre}
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">{infoGrupo.descripcion}</p>
                </div>
                <Badge variant="outline" className="border-slate-800 text-slate-400 text-xs self-start sm:self-auto">
                  {itemsGrupo.length} desarrollos
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemsGrupo.map((item) => (
                  <Card key={item.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <CardTitle className="text-base font-semibold text-white leading-snug">
                          {item.nombre}
                        </CardTitle>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-[10px] shrink-0">
                          Paso {item.pasoDemo}
                        </Badge>
                      </div>
                      <CardDescription className="text-slate-400 text-xs leading-relaxed">
                        {item.descripcionCorta}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.rutaApp}
                        </span>
                        <Button size="sm" variant="ghost" asChild className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 text-xs p-1 h-auto">
                          <Link href={`/experiencia?paso=${item.pasoDemo}`}>
                            Probalo
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <PublicFooter />
    </div>
  );
}
