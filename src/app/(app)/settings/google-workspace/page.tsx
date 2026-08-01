'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BellRing,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileSignature,
  Mail,
  PartyPopper,
  RefreshCw,
  Settings2,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getGoogleWorkspaceDashboard, syncAllFiestasToGoogleWorkspace, syncFiestaAndNotifyStaff } from '@/app/actions/google-workspace';
import { notifyGuestsWithCalendarLinks } from '@/app/actions/google-workspace-extended';
import type { GoogleWorkspaceDashboard } from '@/types/google-workspace';

function formatDate(value?: string) {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('es-UY', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Montevideo',
  }).format(new Date(value));
}

const automationFlows = [
  {
    title: 'Fiestas y personal',
    description: 'Sincroniza la fiesta con el calendario general de AK y con el calendario personal del equipo asignado.',
    icon: Users,
  },
  {
    title: 'Reuniones con clientes',
    description: 'Cuando se crea o cambia una reunion con fecha, queda lista para Google Calendar y puede avisar por Gmail al cliente.',
    icon: CalendarCheck,
  },
  {
    title: 'Pagos',
    description: 'El motor extendido prepara mails para pago informado, aprobado o rechazado, con aviso al cliente y a AK.',
    icon: CreditCard,
  },
  {
    title: 'Contrato firmado',
    description: 'Al confirmar contrato, el cliente puede recibir mail de evento confirmado con link para agregar la fecha a Calendar.',
    icon: FileSignature,
  },
  {
    title: 'Invitados',
    description: 'Los invitados con email pueden recibir la fecha del evento y un link para agregarla a su calendario.',
    icon: PartyPopper,
  },
  {
    title: 'Recordatorios',
    description: 'La estructura ya distingue reuniones, pagos, contratos, clientes, invitados y recordatorios para crecer sin mezclar todo.',
    icon: BellRing,
  },
];

export default function GoogleWorkspaceSettingsPage() {
  const [fiestaId, setFiestaId] = useState('');
  const [dashboard, setDashboard] = useState<GoogleWorkspaceDashboard | null>(null);
  const [message, setMessage] = useState<string>('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const employeeCoverage = useMemo(() => {
    if (!dashboard?.employeeCount) return 0;
    return Math.round((dashboard.connectedEmployees.length / dashboard.employeeCount) * 100);
  }, [dashboard]);

  const loadDashboard = () => {
    startTransition(async () => {
      const data = await getGoogleWorkspaceDashboard();
      setDashboard(data);
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFiestaId(new URLSearchParams(window.location.search).get('fiestaId') || '');
    }
    loadDashboard();
  }, []);

  const handleSyncAll = () => {
    setMessage('');
    setWarnings([]);
    startTransition(async () => {
      const result = await syncAllFiestasToGoogleWorkspace();
      setMessage(`Se revisaron ${result.total} fiestas con fecha y se sincronizaron ${result.synced}.`);
      setWarnings(result.warnings || []);
      const data = await getGoogleWorkspaceDashboard();
      setDashboard(data);
    });
  };

  const handleNotifyGuests = () => {
    if (!fiestaId) {
      setMessage('Entra desde una fiesta para enviar calendario a sus invitados.');
      return;
    }
    setMessage('');
    setWarnings([]);
    startTransition(async () => {
      const result = await notifyGuestsWithCalendarLinks(fiestaId);
      if (!result.success) {
        setMessage(result.error || 'No se pudo enviar calendario a invitados.');
        return;
      }
      setMessage(`Se enviaron ${result.sent} mail(s) de calendario a invitados con email cargado.`);
      setWarnings(result.warnings || []);
      const data = await getGoogleWorkspaceDashboard();
      setDashboard(data);
    });
  };

  const handleSyncCurrentFiesta = () => {
    if (!fiestaId) {
      setMessage('Entra desde una fiesta para sincronizar esa fiesta con el equipo.');
      return;
    }
    setMessage('');
    setWarnings([]);
    startTransition(async () => {
      const result = await syncFiestaAndNotifyStaff(fiestaId);
      if (!result.success) {
        setMessage(result.error || 'No se pudo sincronizar esta fiesta.');
        return;
      }
      setMessage('Fiesta sincronizada con calendario general, personal asignado y avisos al equipo.');
      setWarnings(result.warnings || []);
      const data = await getGoogleWorkspaceDashboard();
      setDashboard(data);
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
              <Settings2 className="h-4 w-4" />
              Google Workspace
            </div>
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight text-slate-950">Calendario, Gmail, clientes, invitados y personal</h1>
              <p className="max-w-3xl text-sm text-slate-600">
                Conecta la cuenta de AK para que fechas, reuniones, mails y recordatorios trabajen desde un solo lugar: empresa, equipo, clientes e invitados.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-red-700 hover:bg-red-800">
              <Link href="/api/google/oauth/start?kind=company">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Conectar AK
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSyncAll} disabled={isPending || !dashboard?.companyAccount}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              Sincronizar fiestas
            </Button>
            <Button variant="outline" onClick={handleSyncCurrentFiesta} disabled={isPending || !dashboard?.companyAccount || !fiestaId}>
              <Users className="mr-2 h-4 w-4" />
              Avisar equipo
            </Button>
            <Button variant="outline" onClick={handleNotifyGuests} disabled={isPending || !dashboard?.companyAccount || !fiestaId}>
              <Mail className="mr-2 h-4 w-4" />
              Avisar invitados
            </Button>
          </div>
        </div>
      </div>

      {dashboard && !dashboard.configured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Falta configurar Google antes de conectar.</p>
              <p>Variables pendientes: {dashboard.missingConfig.join(', ')}.</p>
              <p className="mt-1">URL que debe ir en Google Cloud como redirect: {dashboard.redirectUri || 'se completa con la URL publica de la app'}.</p>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          {message}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-white p-4 text-sm text-amber-900">
          <p className="mb-2 font-semibold">Avisos de sincronizacion</p>
          <ul className="list-disc space-y-1 pl-5">
            {warnings.slice(0, 8).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cuenta de AK</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              {dashboard?.companyAccount ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              {dashboard?.companyAccount ? 'Conectada' : 'Pendiente'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{dashboard?.companyAccount?.email || 'Conecta la cuenta que enviara mails y administrara el calendario general.'}</p>
            {dashboard?.companyAccount && (
              <p className={`mt-2 font-medium ${dashboard.contactsEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                {dashboard.contactsEnabled
                  ? 'Contactos de prospectos habilitados.'
                  : 'Vuelve a conectar la cuenta para habilitar Contactos.'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Personal conectado</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-red-700" />
              {dashboard ? `${dashboard.connectedEmployees.length}/${dashboard.employeeCount}` : '...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {employeeCoverage}% del equipo tiene su calendario personal conectado.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fiestas sincronizadas</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarCheck className="h-5 w-5 text-red-700" />
              {dashboard ? dashboard.syncedFiestas : '...'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Pendientes con fecha: {dashboard?.pendingFiestas ?? 0}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ultimo movimiento</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-red-700" />
              {formatDate(dashboard?.lastSyncedAt)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La sincronizacion masiva no reenvia mails para evitar ruido.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flujos que quedan conectados</CardTitle>
          <CardDescription>La cuenta de AK es la salida central para Calendar y Gmail.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {automationFlows.map((flow) => {
            const Icon = flow.icon;
            return (
              <div key={flow.title} className="rounded-xl border bg-white p-4 text-sm shadow-sm">
                <Icon className="mb-3 h-5 w-5 text-red-700" />
                <p className="font-semibold text-slate-950">{flow.title}</p>
                <p className="mt-1 leading-6 text-muted-foreground">{flow.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como se usa en la diaria</CardTitle>
          <CardDescription>Una vez conectado, el trabajo normal de la app dispara Google automaticamente donde ya hay datos suficientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-red-50/50 p-4">
              <p className="font-semibold text-red-800">1. Cambias una fecha</p>
              <p className="mt-1 text-muted-foreground">La fiesta se actualiza en el calendario general de AK.</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="font-semibold">2. Asignas personal o reunion</p>
              <p className="mt-1 text-muted-foreground">El personal recibe su detalle y las reuniones quedan listas para mail y Calendar.</p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold">3. Cliente e invitados</p>
              <p className="mt-1 text-muted-foreground">Pagos, contrato e invitados pueden usar Gmail y links de Google Calendar sin duplicar canales.</p>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/empleados">
                <Users className="mr-2 h-4 w-4" />
                Ver empleados
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/fiestas/nueva/reuniones">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Ver reuniones
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <a href="https://developers.google.com/workspace/calendar/api/guides/create-events" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Guia Google Calendar
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a href="https://developers.google.com/workspace/gmail/api/auth/scopes" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Permisos Gmail
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {dashboard?.connectedEmployees.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Personal ya conectado</CardTitle>
            <CardDescription>Cuentas que ya pueden recibir eventos directamente en su Google Calendar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.connectedEmployees.map((account) => (
              <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{account.email || 'Cuenta sin email visible'}</p>
                  <p className="text-xs text-muted-foreground">Conectado: {formatDate(account.connectedAt)}</p>
                </div>
                <Badge variant={account.status === 'connected' ? 'default' : 'secondary'}>{account.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
