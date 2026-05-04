import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarPlus, CheckCircle2, Clock, MapPin, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployeeWorkspacePortal } from '@/app/actions/google-workspace';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-UY', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montevideo',
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default async function PersonalWorkspacePage({
  params,
  searchParams,
}: {
  params: { empleadoId: string };
  searchParams?: { connected?: string; error?: string };
}) {
  const portal = await getEmployeeWorkspacePortal(params.empleadoId);
  if (!portal.employee) notFound();

  const connected = portal.googleAccount?.status === 'connected';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/empleados">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a empleados
        </Link>
      </Button>

      <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-red-700 via-red-600 to-slate-950 p-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-100">Pagina personal AK</p>
              <h1 className="mt-2 font-headline text-4xl font-bold tracking-tight">{portal.employee.nombre}</h1>
              <p className="mt-2 max-w-2xl text-sm text-red-50">
                Aca ve sus fiestas contratadas, rol, lugar, pago y acceso rapido a Google Calendar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={connected ? 'bg-emerald-600' : 'bg-amber-500'}>
                {connected ? 'Google conectado' : 'Google pendiente'}
              </Badge>
              <Badge variant="secondary">{portal.events.length} fiestas</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Mis proximas fiestas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {portal.events.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  Todavia no hay fiestas asignadas para esta persona.
                </div>
              ) : (
                portal.events.map((event) => (
                  <div key={`${event.fiestaId}-${event.roleName}`} className="rounded-2xl border bg-slate-50/70 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-950">{event.title}</h2>
                          <Badge variant="outline" className="border-red-200 text-red-700">{event.roleName}</Badge>
                        </div>
                        <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-red-700" />
                            {formatDate(event.dateTime)}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-700" />
                            {event.venue || 'Lugar a confirmar'}
                          </span>
                          <span className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-red-700" />
                            {formatMoney(event.salary)}
                          </span>
                          <span>{event.guestCount ? `${event.guestCount} invitados estimados` : 'Invitados a confirmar'}</span>
                        </div>
                        {event.address ? <p className="text-sm text-slate-500">{event.address}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" className="bg-red-700 hover:bg-red-800">
                          <a href={event.calendarTemplateUrl} target="_blank" rel="noreferrer">
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Agregar a Google
                          </a>
                        </Button>
                        {event.mapsUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={event.mapsUrl} target="_blank" rel="noreferrer">
                              <MapPin className="mr-2 h-4 w-4" />
                              Mapa
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Google Calendar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {searchParams?.connected ? (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                    Cuenta conectada correctamente.
                  </div>
                ) : null}
                {searchParams?.error ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                    {searchParams.error}
                  </div>
                ) : null}
                <p className="text-muted-foreground">
                  Si conecta Google, las fiestas asignadas entran solas en su calendario personal.
                </p>
                <Button asChild className="w-full bg-red-700 hover:bg-red-800">
                  <Link href={`/api/google/oauth/start?kind=employee&employeeId=${portal.employee.id}&returnTo=/personal/${portal.employee.id}`}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    {connected ? 'Reconectar Google' : 'Conectar mi Google'}
                  </Link>
                </Button>
                {portal.googleAccount?.email ? (
                  <p className="text-xs text-muted-foreground">Cuenta actual: {portal.googleAccount.email}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Mail: {portal.employee.googleWorkspaceEmail || portal.employee.email || 'Sin mail cargado'}</p>
                <p>Telefono: {portal.employee.telefono || 'Sin telefono cargado'}</p>
                <p className="rounded-xl bg-slate-50 p-3">
                  Para que el aviso por Gmail funcione, este integrante necesita un mail cargado en su ficha de empleado.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
