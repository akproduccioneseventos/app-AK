import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, CheckCircle2, ExternalLink, ImagePlus, MonitorPlay, Sparkles, UsersRound } from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDate(date?: string) {
  if (!date) return 'Fecha a definir';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'full' }).format(parsed);
}

function countReady(items: Array<boolean>) {
  return items.filter(Boolean).length;
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PortfolioFiestaPage(props: PageProps) {
  const params = await props.params;
  const fiesta = await getFiestaById(params.id);
  if (!fiesta) notFound();

  const config = fiesta.configuracion;
  const totalGuests = fiesta.invitados?.length ?? config.invitadosEstimados ?? 0;
  const confirmedGuests = fiesta.invitados?.filter((guest) => guest.rsvp === 'Confirmado').length ?? 0;
  const tasks = fiesta.tareas ?? [];
  const completedTasks = tasks.filter((task) => task.completada).length;
  const eventName = config.nombreEvento || config.tipoCelebracion || 'Fiesta AK';
  const protagonist = config.protagonista1Nombre || config.nombreAgasajado || config.clienteNombre || eventName;
  const heroImage = fiesta.clientePortalExperience?.heroImageUrl || config.protagonistaFotoUrl;
  const readinessItems = [
    Boolean(config.fechaEvento),
    Boolean(config.nombreLugar),
    Boolean(fiesta.clientPortalSettings || fiesta.clientePortalExperience),
    Boolean(fiesta.guestPortalSettings || fiesta.guestExperienceSettings),
    Boolean(fiesta.socialGallerySettings || fiesta.eventoEnVivo),
    Boolean(fiesta.reuniones?.length),
    Boolean(fiesta.personalAsignado?.length),
    Boolean(fiesta.programa?.length),
  ];
  const readyCount = countReady(readinessItems);
  const readiness = Math.round((readyCount / readinessItems.length) * 100);

  const techCards = [
    {
      title: 'Portal cliente',
      description: 'Pagos, documentos, tareas, reuniones y seguimiento de la fiesta.',
      href: `/fiestas/nueva/portal-cliente/experiencia-mundial?fiestaId=${encodeURIComponent(params.id)}`,
      ready: Boolean(fiesta.clientPortalSettings || fiesta.clientePortalExperience),
    },
    {
      title: 'Invitacion y portal invitado',
      description: 'Confirmacion, datos de la fiesta, calendario y experiencia movil.',
      href: `/fiestas/nueva/modulo-invitado?fiestaId=${encodeURIComponent(params.id)}`,
      ready: Boolean(fiesta.guestPortalSettings || fiesta.guestExperienceSettings || fiesta.invitacionDigital),
    },
    {
      title: 'Muro social y pantalla',
      description: 'Fotos, mensajes, participacion y contenido para proyectar en vivo.',
      href: `/fiestas/nueva/muro-social?fiestaId=${encodeURIComponent(params.id)}`,
      ready: Boolean(fiesta.socialGallerySettings || fiesta.eventoEnVivo || fiesta.socialScreenConfig),
    },
    {
      title: 'Comando total',
      description: 'Estado completo de la fiesta, faltantes, equipo y sincronizaciones.',
      href: `/fiestas/${encodeURIComponent(params.id)}/comando-total`,
      ready: true,
    },
  ];

  const previewSections = [
    'Recepcion del cliente con nombre, fecha, lugar y estilo propio.',
    'Invitados con confirmacion simple desde celular.',
    'Muro social para que la tecnologia se vea durante la fiesta.',
    'Equipo interno con tareas, responsables y datos necesarios.',
    'Google Calendar y Gmail como recordatorios externos cuando esten configurados.',
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#f8fafc_48%,#fff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
          <div className="grid min-h-[520px] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div>
                <Badge className="border-red-200 bg-red-50 text-red-700">Portfolio real de fiesta</Badge>
                <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">{eventName}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                  Vista preparada para mostrarle al cliente como se ve su experiencia AK: portal, invitacion, invitados, muro social, pantalla LED y comando de organizacion.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CalendarDays className="h-5 w-5 text-red-600" />
                  <p className="mt-3 text-sm text-slate-500">Fecha</p>
                  <p className="font-bold text-slate-950">{formatDate(config.fechaEvento)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <UsersRound className="h-5 w-5 text-red-600" />
                  <p className="mt-3 text-sm text-slate-500">Invitados</p>
                  <p className="font-bold text-slate-950">{confirmedGuests}/{totalGuests} confirmados</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-red-600" />
                  <p className="mt-3 text-sm text-slate-500">Tareas</p>
                  <p className="font-bold text-slate-950">{completedTasks}/{tasks.length} listas</p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[420px] overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
              {heroImage ? (
                <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url(${heroImage})` }} />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.45),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,#111827,#450a0a)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
              <div className="relative flex h-full flex-col justify-end">
                <p className="text-sm uppercase tracking-[0.28em] text-red-100">Experiencia de {protagonist}</p>
                <h2 className="mt-3 text-4xl font-black sm:text-6xl">{readiness}%</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-200">
                  Preparacion visual estimada segun datos cargados: lugar, fecha, cliente, invitados, social, agenda, equipo y programa.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild className="rounded-full bg-white text-slate-950 hover:bg-red-50">
                    <Link href={`/fiestas/${encodeURIComponent(params.id)}/comando-total`}>
                      <MonitorPlay className="mr-2 h-4 w-4" />
                      Comando total
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20">
                    <Link href="/presentacion-led/portafolio">
                      Portfolio general
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-4">
          {techCards.map((card) => (
            <Card key={card.href} className="border-slate-200 bg-white shadow-lg shadow-slate-950/5">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <ImagePlus className="h-6 w-6 text-red-600" />
                  <Badge variant="outline" className={card.ready ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'}>
                    {card.ready ? 'Activo' : 'Completar'}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-black text-slate-950">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-[72px] text-sm leading-6 text-slate-600">{card.description}</p>
                <Button asChild variant="outline" className="mt-4 w-full rounded-full border-red-200 text-red-700 hover:bg-red-50">
                  <Link href={card.href}>Abrir</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/10 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge className="bg-white text-slate-950">Guion para vender</Badge>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">Como se le muestra al prospecto</h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Esta vista sirve como bosquejo real: primero se muestra la fiesta personalizada, despues los modulos que va a usar el cliente y finalmente lo que ven invitados y pantalla LED.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {previewSections.map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Sparkles className="h-5 w-5 text-red-200" />
                  <p className="mt-3 text-sm font-bold text-white">{index + 1}. {item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
