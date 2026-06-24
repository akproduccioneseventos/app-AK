import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Camera, CheckCircle2, Gamepad2, Monitor, QrCode, ShieldCheck, Sparkles, Users } from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildSocialFinalReadiness, getSocialFinalScore } from '@/lib/social-fiesta/social-final-readiness';
import type { SocialFinalAreaId } from '@/lib/social-fiesta/social-final-readiness';

const iconByArea: Record<SocialFinalAreaId, LucideIcon> = {
  invitacion: QrCode,
  rsvp: Users,
  muro: Camera,
  moderacion: ShieldCheck,
  pantalla: Monitor,
  juegos: Gamepad2,
  post_evento: CheckCircle2,
};

type PageProps = { searchParams?: Promise<{ fiestaId?: string }> };

function withFiesta(route: string, fiestaId: string): string {
  return `${route}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

export default async function SocialFiestaCierreFinalPage(props: PageProps) {
  const params = (await props.searchParams) ?? {};
  const fiestaId = params.fiestaId;

  if (!fiestaId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader><CardTitle>Falta elegir un evento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Para revisar la fiesta en vivo hay que entrar desde un evento concreto.</p>
            <Button asChild><Link href="/eventos">Volver a eventos</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const fiesta = await getFiestaById(fiestaId);
  const areas = buildSocialFinalReadiness(fiesta);
  const score = getSocialFinalScore(fiesta);
  const eventName = fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.tipoCelebracion || 'Fiesta AK';

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href={withFiesta('/fiestas/nueva/social-fiesta-pro', fiestaId)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Social Fiesta
            </Link>
          </Button>
          <Badge className={score >= 85 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
            {score}% listo para fiesta
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                <Sparkles className="h-4 w-4 text-violet-700" />
                Fiesta visible para invitados
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{eventName}</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta revision final junta invitacion, QR, confirmaciones, muro social, moderacion, pantalla gigante, juegos y recuerdos posteriores. Es lo que la gente va a ver y tocar el dia del evento.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link href={withFiesta('/fiestas/nueva/muro-social', fiestaId)}>Abrir muro social</Link></Button>
                <Button asChild variant="outline"><Link href={withFiesta('/fiestas/nueva/en-vivo', fiestaId)}>Abrir pantalla en vivo</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Antes de abrir puertas</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">Probar QR</p>
                <p className="mt-1">Un invitado debe entrar desde el celular sin ayuda.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">Probar pantalla</p>
                <p className="mt-1">El monitor debe verse limpio y sin textos cortados.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">Definir operador</p>
                <p className="mt-1">Alguien de AK controla que se muestra y que se oculta.</p>
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
                    {area.ready ? 'Listo para probar' : 'Falta completar antes del evento'}
                  </div>
                  <p className="text-xs text-muted-foreground">{area.operatorCheck}</p>
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
              <p className="font-semibold text-slate-950">Invitado simple</p>
              <p className="mt-1 text-sm text-muted-foreground">Escanea, confirma, sube fotos y participa sin instalar nada.</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="font-semibold text-slate-950">Operador tranquilo</p>
              <p className="mt-1 text-sm text-muted-foreground">AK decide que se muestra en pantalla y cuando.</p>
            </div>
            <div className="rounded-lg bg-white p-4">
              <p className="font-semibold text-slate-950">Recuerdo final</p>
              <p className="mt-1 text-sm text-muted-foreground">La experiencia sigue despues con fotos, video y album.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
