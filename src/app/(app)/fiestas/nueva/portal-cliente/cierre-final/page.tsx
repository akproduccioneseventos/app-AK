import Link from 'next/link';
import { ArrowLeft, CalendarDays, CheckCircle2, CreditCard, Image as ImageIcon, MessageCircle, Smartphone, Users } from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildClientFinalReadiness, getClientFinalScore } from '@/lib/client-portal/client-final-readiness';
import type { ClientFinalAreaId } from '@/lib/client-portal/client-final-readiness';

const iconByArea: Record<ClientFinalAreaId, typeof Smartphone> = {
  portada: ImageIcon,
  organizacion: CalendarDays,
  contable: CreditCard,
  invitados: Users,
  contacto: MessageCircle,
  post_evento: CheckCircle2,
};

type PageProps = { searchParams?: Promise<{ fiestaId?: string }> };

function withFiesta(route: string, fiestaId: string): string {
  return `${route}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

function portalPublicHref(accessKey?: string): string | undefined {
  return accessKey ? `/portal/c/${encodeURIComponent(accessKey)}` : undefined;
}

export default async function ClienteCierreFinalPage(props: PageProps) {
  const params = (await props.searchParams) ?? {};
  const fiestaId = params.fiestaId;

  if (!fiestaId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader><CardTitle>Falta elegir un evento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Para revisar el cierre del modulo cliente hay que entrar desde una fiesta concreta.</p>
            <Button asChild><Link href="/eventos">Volver a eventos</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const fiesta = await getFiestaById(fiestaId);
  const areas = buildClientFinalReadiness(fiesta);
  const score = getClientFinalScore(fiesta);
  const eventName = fiesta?.clientePortalExperience?.eventDisplayName || fiesta?.configuracion?.nombreEvento || 'Portal del cliente';
  const publicHref = portalPublicHref(fiesta?.clientPortalSettings?.accessKey);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href={withFiesta('/fiestas/nueva/portal-cliente', fiestaId)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al portal
            </Link>
          </Button>
          <Badge className={score >= 85 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
            {score}% listo para cliente
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                <Smartphone className="h-4 w-4 text-blue-700" />
                Cierre cliente celular
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{eventName}</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla revisa si el modulo cliente ya esta listo para una persona que solo usa celular: portada clara, organizacion, contable, invitados, contacto unico y post-evento.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={withFiesta('/fiestas/nueva/portal-cliente', fiestaId)}>Configurar portal</Link>
                </Button>
                {publicHref && (
                  <Button asChild variant="outline">
                    <Link href={publicHref}>Ver como cliente</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Regla de uso</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">Poca informacion de golpe</p>
                <p className="mt-1">Todo tiene que abrirse y cerrarse por secciones.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">Botones grandes</p>
                <p className="mt-1">El cliente debe poder tocar sin saber informatica.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">Un solo contacto</p>
                <p className="mt-1">Las dudas se mandan desde un punto claro, no repetido.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const Icon = iconByArea[area.id];
            return (
              <Card key={area.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline">{area.completedChecks}/{area.totalChecks}</Badge>
                  </div>
                  <CardTitle className="text-lg">{area.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{area.simpleGoal}</p>
                  <div className={area.ready ? 'rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800' : 'rounded-lg bg-amber-50 p-3 text-sm text-amber-900'}>
                    {area.ready ? 'Listo para mostrar' : 'Falta activar o completar'}
                  </div>
                  <p className="text-xs text-muted-foreground">{area.clientWords}</p>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={withFiesta(area.href, fiestaId)}>Abrir bloque</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4">
              <p className="font-semibold text-slate-950">Cliente entiende</p>
              <p className="mt-1 text-sm text-muted-foreground">Ve su evento, sus pagos, sus invitados y lo que tiene que hacer.</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="font-semibold text-slate-950">AK controla</p>
              <p className="mt-1 text-sm text-muted-foreground">La empresa decide que se muestra y que el cliente puede cambiar.</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="font-semibold text-slate-950">Menos mensajes sueltos</p>
              <p className="mt-1 text-sm text-muted-foreground">La informacion importante queda dentro del portal.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
