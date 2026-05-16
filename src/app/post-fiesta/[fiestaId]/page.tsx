import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Camera, Heart, MessageCircle, PartyPopper, Share2, Sparkles, Star } from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { buildUltimateEventSystem } from '@/lib/experience-ak/ultimate-event-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type PageProps = {
  params: {
    fiestaId: string;
  };
};

export default async function PostFiestaPage({ params }: PageProps) {
  const fiesta = await getFiestaById(params.fiestaId);
  if (!fiesta) notFound();

  const report = buildUltimateEventSystem(fiesta);
  const eventName = fiesta.configuracion?.nombreEvento || 'Fiesta AK';
  const galleryUrl = fiesta.galeriaUrl || `/evento/social/${encodeURIComponent(fiesta.id)}`;
  const feedbackUrl = `/feedback/${encodeURIComponent(fiesta.id)}`;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-14 text-white sm:px-8">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,#ef4444_0%,transparent_28%),radial-gradient(circle_at_80%_0%,#ffffff_0%,transparent_20%)]" />
        <div className="relative mx-auto max-w-6xl">
          <Badge className="bg-white text-slate-950">Recuerdos AK</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">{eventName}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
            Gracias por ser parte. Esta pagina junta recuerdos, fotos, mensajes y el cierre de la experiencia digital.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-2xl bg-red-600 font-black hover:bg-red-700">
              <Link href={galleryUrl}>
                <Camera className="mr-2 h-4 w-4" /> Ver galeria social
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl border-white/25 bg-white/10 font-black text-white hover:bg-white hover:text-slate-950">
              <Link href={feedbackUrl}>
                <Star className="mr-2 h-4 w-4" /> Dejar testimonio
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-8 md:grid-cols-3">
        {[
          { icon: Heart, title: 'Mejores momentos', text: 'Fotos, mensajes y recuerdos que pueden alimentar redes y album final.' },
          { icon: MessageCircle, title: 'Testimonio simple', text: 'Una forma clara de pedir opinion al cliente sin hacerlo pesado.' },
          { icon: Share2, title: 'Referidos', text: 'Cierre pensado para que la fiesta venda la siguiente fiesta.' },
        ].map((item) => (
          <Card key={item.title} className="rounded-[1.5rem] border-slate-200 bg-white shadow-lg shadow-slate-950/5">
            <CardContent className="p-5">
              <item.icon className="h-7 w-7 text-red-600" />
              <h2 className="mt-4 text-xl font-black">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
        <Card className="rounded-[2rem] border-slate-200 bg-slate-50">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-red-600">
                  <Sparkles className="h-5 w-5" />
                  <p className="text-xs font-black uppercase tracking-widest">Plan post-fiesta automatico</p>
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Cierre listo para aprender y vender mejor</h2>
              </div>
              <Button asChild variant="outline" className="rounded-2xl bg-white font-black">
                <Link href={`/q/${encodeURIComponent(fiesta.id)}`}>
                  QR unico <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {report.postEventPlan.map((item, index) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-red-600">Paso {index + 1}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        <PartyPopper className="mx-auto mb-2 h-5 w-5 text-red-600" />
        Experiencia digital creada por AK Producciones.
      </footer>
    </main>
  );
}
