import Link from 'next/link';
import type { ElementType } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, CreditCard, FileSignature, Image as ImageIcon, MessageCircle, Music, Palette, Smartphone, Users } from 'lucide-react';

import { getFiestaById } from '@/app/actions/fiesta-actual';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CLIENT_PORTAL_VIP_AREAS } from '@/lib/client-portal-vip-ux';
import { getAkFinalPremiumReadinessByArea } from '@/lib/design/ak-final-premium-readiness';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

type PageProps = { searchParams?: Promise<{ fiestaId?: string }> };

type JourneyItem = {
  title: string;
  description: string;
  icon: ElementType;
  href: string;
  state: 'listo' | 'revisar';
};

function linkFor(path: string, fiestaId: string): string {
  return `${path}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

function eventName(fiesta?: FiestaEnPlanificacion | null): string {
  return fiesta?.clientePortalExperience?.eventDisplayName || fiesta?.configuracion?.nombreEvento || 'Portal del cliente';
}

function publicPortalHref(fiesta?: FiestaEnPlanificacion | null): string | undefined {
  const accessKey = fiesta?.clientPortalSettings?.accessKey?.trim();
  return accessKey ? `/portal/c/${encodeURIComponent(accessKey)}` : undefined;
}

function stateFrom(value?: boolean): 'listo' | 'revisar' {
  return value ? 'listo' : 'revisar';
}

function StatusBadge({ state }: { state: 'listo' | 'revisar' }) {
  return state === 'listo'
    ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Listo</Badge>
    : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Revisar</Badge>;
}

export default async function ClientPortalWorldClassPage(props: PageProps) {
  const params = (await props.searchParams) ?? {};
  const fiestaId = params.fiestaId;

  if (!fiestaId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader><CardTitle>Falta elegir un evento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Para revisar el modulo del cliente hay que abrirlo desde una fiesta concreta.</p>
            <Button asChild><Link href="/eventos">Volver a eventos</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const fiesta = await getFiestaById(fiestaId);
  const settings = fiesta?.clientPortalSettings;
  const experience = fiesta?.clientePortalExperience;
  const publicHref = publicPortalHref(fiesta);

  const journey: JourneyItem[] = [
    { title: 'Portada clara y linda', description: 'Nombre del evento, color, foto de portada y mensaje de bienvenida.', icon: ImageIcon, href: linkFor('/fiestas/nueva/portal-cliente', fiestaId), state: stateFrom(Boolean(experience?.eventDisplayName || fiesta?.configuracion?.nombreEvento) && Boolean(experience?.heroImageUrl || fiesta?.configuracion?.protagonistaFotoUrl)) },
    { title: 'Organizacion sin marear', description: 'Cronograma, musica, reuniones, fotos, menu y decoracion en bloques desplegables.', icon: CalendarDays, href: linkFor('/fiestas/nueva/itinerario', fiestaId), state: stateFrom(settings?.itinerario?.visible || settings?.musica?.visible) },
    { title: 'Contable en un solo lugar', description: 'Contrato, presupuesto, pagos, comprobantes y servicios contratados.', icon: CreditCard, href: linkFor('/fiestas/nueva/plan-pagos', fiestaId), state: stateFrom(settings?.pagos?.visible || settings?.contrato?.visible || settings?.serviciosContratados?.visible) },
    { title: 'Invitados siempre visibles', description: 'Confirmados, pendientes, mesas y simulador para pedir cambios.', icon: Users, href: linkFor('/fiestas/nueva/invitados', fiestaId), state: stateFrom(settings?.invitados?.visible || settings?.simuladorInvitados?.visible) },
    { title: 'Comunicacion unica', description: 'Un solo lugar para escribir a AK, sin botones duplicados por toda la pantalla.', icon: MessageCircle, href: linkFor('/fiestas/nueva/portal-cliente', fiestaId), state: stateFrom(settings?.notasCliente?.visible) },
    { title: 'Post-evento preparado', description: 'Fotos, video, album y entregas para que el cliente encuentre todo despues.', icon: FileSignature, href: linkFor('/fiestas/nueva/post-evento', fiestaId), state: stateFrom(settings?.fotografiaYFilmacion?.visible) },
  ];

  const readiness = getAkFinalPremiumReadinessByArea('portal_cliente');
  const activeCount = journey.filter(item => item.state === 'listo').length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost"><Link href={linkFor('/fiestas/nueva/portal-cliente', fiestaId)}><ArrowLeft className="mr-2 h-4 w-4" />Volver al portal</Link></Button>
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Cliente mundial</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card><CardContent className="space-y-5 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"><Smartphone className="h-4 w-4 text-amber-600" />Pensado para una persona que solo tiene celular</div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{eventName(fiesta)}</h1>
            <p className="max-w-3xl text-base text-muted-foreground">Esta vista convierte el modulo del cliente en un camino simple: portada, organizacion, dinero, invitados, comunicacion y post-evento. Todo debe abrirse, entenderse y cerrarse sin llenar la pantalla de informacion.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild><Link href={linkFor('/fiestas/nueva/portal-cliente', fiestaId)}><Palette className="mr-2 h-4 w-4" />Configurar portal</Link></Button>
              {publicHref && <Button asChild variant="outline"><Link href={publicHref}><Smartphone className="mr-2 h-4 w-4" />Ver como cliente</Link></Button>}
            </div>
          </CardContent></Card>

          <Card><CardHeader><CardTitle>Resumen rapido</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Portal</span><strong>{settings?.enabled ? 'Activo' : 'Revisar'}</strong></div>
            <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Link privado</span><strong>{settings?.accessKey ? 'Listo' : 'Falta'}</strong></div>
            <div className="flex items-center justify-between rounded-md bg-slate-100 p-3"><span>Experiencia</span><strong>{activeCount}/6 bloques</strong></div>
          </CardContent></Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {journey.map(item => <Card key={item.title}><CardHeader className="space-y-3"><div className="flex items-center justify-between gap-3"><div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm"><item.icon className="h-5 w-5" /></div><StatusBadge state={item.state} /></div><CardTitle className="text-lg">{item.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{item.description}</p><Button asChild variant="outline" className="w-full justify-start"><Link href={item.href}>Abrir bloque</Link></Button></CardContent></Card>)}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card><CardHeader><CardTitle>Reglas de experiencia</CardTitle></CardHeader><CardContent className="space-y-3">{CLIENT_PORTAL_VIP_AREAS.map(area => <div key={area.title} className="rounded-lg border bg-white p-4"><p className="font-semibold text-slate-950">{area.title}</p><p className="mt-1 text-sm text-muted-foreground">{area.description}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>Lo minimo para que quede premium</CardTitle></CardHeader><CardContent className="space-y-3">{readiness.map(item => <div key={item.title} className="flex gap-3 rounded-lg bg-white p-4"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-semibold text-slate-950">{item.title}</p><p className="text-sm text-muted-foreground">{item.description}</p></div></div>)}<div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">La regla practica: el cliente debe encontrar todo con botones grandes, bloques desplegables y una sola forma clara de escribirle a AK.</div></CardContent></Card>
        </section>

        <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-3"><div className="rounded-lg bg-white p-4"><Music className="mb-3 h-5 w-5 text-violet-700" /><p className="font-semibold text-slate-950">Participa donde corresponde</p><p className="mt-1 text-sm text-muted-foreground">Musica, reuniones, fotos e invitados son acciones del cliente.</p></div><div className="rounded-lg bg-white p-4"><CreditCard className="mb-3 h-5 w-5 text-emerald-700" /><p className="font-semibold text-slate-950">Ve lo contable sin dudas</p><p className="mt-1 text-sm text-muted-foreground">Contrato, presupuesto, saldo y servicios quedan juntos.</p></div><div className="rounded-lg bg-white p-4"><MessageCircle className="mb-3 h-5 w-5 text-blue-700" /><p className="font-semibold text-slate-950">Escribe una sola vez</p><p className="mt-1 text-sm text-muted-foreground">El contacto con AK queda centralizado para evitar confusion.</p></div></CardContent></Card>
      </div>
    </main>
  );
}
