import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GlassWater,
  MonitorPlay,
  PartyPopper,
  QrCode,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { buildSmartQrTargets } from '@/lib/experience-ak/ultimate-event-system';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type PageProps = {
  params: Promise<{
    fiestaId: string;
  }>;
  searchParams?: Promise<{
    modo?: string;
  }>;
};

const audienceIcon = {
  invitado: PartyPopper,
  cliente: UserRound,
  staff: ClipboardList,
  pantalla: MonitorPlay,
  barra: GlassWater,
};

export default async function SmartQrPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const fiesta = await getFiestaById(params.fiestaId);
  if (!fiesta) notFound();

  const targets = buildSmartQrTargets(fiesta);
  const selected = targets.find((target) => target.audience === searchParams?.modo || target.id === searchParams?.modo);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fee2e2_0%,#ffffff_38%,#f8fafc_100%)] px-4 py-6 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/12">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <Badge className="bg-red-600 text-white">QR unico inteligente</Badge>
              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                {fiesta.configuracion?.nombreEvento || 'Fiesta AK'}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Elegi como queres entrar. Este QR sirve para invitados, cliente, equipo AK, pantalla gigante y barra.
              </p>
              {selected && (
                <Card className="mt-6 rounded-3xl border-red-100 bg-red-50">
                  <CardContent className="p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-red-700">Entrada sugerida</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{selected.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{selected.description}</p>
                    <Button asChild className="mt-4 rounded-2xl bg-red-600 font-black hover:bg-red-700">
                      <Link href={selected.href}>Continuar</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="bg-slate-950 p-6 text-white sm:p-8">
              <QrCode className="h-10 w-10 text-red-300" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-red-100">Una entrada</p>
              <p className="mt-2 text-3xl font-black">Toda la experiencia</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" /> Celular primero.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" /> Sin explicar tecnologia.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-emerald-300" /> Todo conectado al evento.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {targets.map((target) => {
            const Icon = audienceIcon[target.audience];
            return (
              <Link
                key={target.id}
                href={target.href}
                className="group rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-2xl bg-red-50 p-3 text-red-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-red-500" />
                </div>
                <h2 className="mt-4 font-black text-slate-950">{target.label}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500">{target.description}</p>
              </Link>
            );
          })}
        </section>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={buildSmartQrTargets(fiesta)[0].href}>
              <Camera className="mr-2 h-4 w-4" /> Entrar como invitado
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl bg-white font-bold">
            <Link href={`/fiestas/nueva/centro-total?fiestaId=${encodeURIComponent(fiesta.id)}`}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Centro total AK
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
