import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  HeartHandshake,
  MessageCircle,
  MonitorPlay,
  Music,
  PartyPopper,
  QrCode,
  Sparkles,
  Tv,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandingNav } from '@/components/landing/LandingNav';
import { PublicFooter } from '@/components/public-footer';
import { LocalBusinessJsonLd } from '@/components/seo/LocalBusinessJsonLd';
import { AK_WHATSAPP_NUMBER, buildAkWhatsAppUrl } from '@/lib/public-contact';

export const metadata: Metadata = {
  metadataBase: new URL('https://akproducciones.uy'),
  title: 'La Experiencia AK | Fiestas y Eventos en Salto | AK Producciones Eventos',
  description:
    'Viví una fiesta única en Salto con tecnología interactiva, discoteca, pantallas LED, fotocabina 360, muro en vivo y gastronomía gourmet coordinada por un solo equipo.',
  alternates: {
    canonical: '/experiencia-ak',
  },
  openGraph: {
    title: 'La Experiencia AK | Fiestas y Eventos en Salto | AK Producciones Eventos',
    description:
      'Tecnología interactiva, discoteca, pantallas LED, fotocabina y comida gourmet para tu fiesta en Salto, Uruguay.',
    type: 'website',
    url: 'https://akproducciones.uy/experiencia-ak',
    siteName: 'AK Producciones Eventos',
    locale: 'es_UY',
    images: [
      {
        url: '/media/catalogo-servicios/quinceanera_hero.png',
        width: 1200,
        height: 630,
        alt: 'Experiencia interactiva en fiestas de AK Producciones',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Experiencia AK | Fiestas y Eventos en Salto | AK Producciones Eventos',
    description: 'Discoteca, pantallas LED, fotocabina y comida gourmet en Salto.',
    images: ['/media/catalogo-servicios/quinceanera_hero.png'],
  },
};

const EXPERIENCIAS = [
  {
    icon: Music,
    badge: 'La Pista',
    title: 'Discoteca y Show de Luces Sincronizado',
    description:
      'Sonido de alta definición, efectos de iluminación robótica y momentos musicales diseñados para que la pista esté llena toda la noche.',
  },
  {
    icon: Tv,
    badge: 'Visuales',
    title: 'Muro Social en Pantalla Gigante',
    description:
      'Tus invitados sacan fotos con su celular y aparecen al instante en la pantalla grande del salón con dedicatorias en vivo.',
  },
  {
    icon: Camera,
    badge: 'Recuerdos',
    title: 'Estaciones de Captura y Plataforma 360',
    description:
      'Fotocabina con tiras impresas de recuerdo y plataforma 360 con entrega inmediata por código QR al teléfono de cada invitado.',
  },
  {
    icon: UtensilsCrossed,
    badge: 'Gastronomía',
    title: 'Comida Gourmet y Barra de Tragos',
    description:
      'Recepción con islas de degustación, plato principal gourmet, mesa dulce artesanal y coctelería personalizada para agasajar a todos.',
  },
];

export default function ExperienciaAkPage() {
  const whatsappUrl = buildAkWhatsAppUrl(
    'Hola AK Producciones. Estuve viendo la Experiencia AK y quiero consultar para mi fiesta en Salto.'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-red-700">
      <LocalBusinessJsonLd url="https://akproducciones.uy/experiencia-ak" />
      <LandingNav />

      <main className="pt-24 pb-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <Badge className="border-red-500/40 bg-red-950/60 text-red-300 px-4 py-1 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                Innovación y Emoción en Salto
              </Badge>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
                Una fiesta que se siente distinta de principio a fin
              </h1>
              <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-medium">
                Unimos discoteca profesional, pantallas LED interactivas, estaciones de fotos y servicio gastronómico completo para que vos y tus invitados disfruten cada segundo.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="w-full sm:w-auto rounded-xl bg-red-600 hover:bg-red-700 font-bold px-8 h-12 shadow-lg shadow-red-900/30">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Consultar por mi Fiesta
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto rounded-xl border-white/20 text-white hover:bg-white/10 font-bold px-8 h-12">
                  <Link href="/simulador-de-presupuesto">
                    Calcular Presupuesto Online
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pilares de la Experiencia */}
        <section className="py-20 border-b border-white/10 bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Cuatro momentos que hacen la diferencia
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                Todo coordinado por un mismo equipo para que no tengas que preocuparte por nada durante la noche.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EXPERIENCIAS.map((exp) => {
                const Icon = exp.icon;
                return (
                  <Card key={exp.title} className="bg-slate-900/80 border-white/10 rounded-2xl p-6 hover:border-red-500/40 transition-all">
                    <CardHeader className="p-0 space-y-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="p-3 bg-red-950/80 border border-red-500/30 rounded-xl text-red-400">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider text-red-300 border-red-500/30 bg-red-950/40">
                          {exp.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-white">
                        {exp.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {exp.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Banner de Cierre */}
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Empezá a planificar tu fecha hoy
            </h2>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
              Contanos qué tipo de evento estás preparando y armamos una propuesta a medida con todos los detalles claros.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" className="rounded-xl bg-red-600 hover:bg-red-700 font-bold px-8 h-12">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Escribirnos por WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
