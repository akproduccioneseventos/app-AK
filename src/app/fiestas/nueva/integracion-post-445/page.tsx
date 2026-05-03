import Link from 'next/link';
import { ArrowLeft, CheckCircle2, DatabaseBackup, ExternalLink, GitPullRequest, Layers3, Monitor, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POST445_RELEASE_GROUPS, POST445_RELEASE_PRS, countPost445PrsByGroup, getPost445PrsByGroup } from '@/lib/post445/post445-release-map';

type PageProps = { searchParams?: { fiestaId?: string } | Promise<{ fiestaId?: string }> };

function withFiesta(route: string | undefined, fiestaId?: string): string | undefined {
  if (!route) return undefined;
  if (!route.startsWith('/fiestas/nueva')) return route;
  return fiestaId ? `${route}?fiestaId=${encodeURIComponent(fiestaId)}` : route;
}

function stateLabel(state: string): string {
  if (state === 'arreglo') return 'Arreglo';
  if (state === 'pantalla') return 'Pantalla';
  if (state === 'integracion') return 'Integracion';
  return 'Motor base';
}

export default async function Post445IntegrationPage({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams ?? {});
  const fiestaId = params.fiestaId;
  const total = POST445_RELEASE_PRS.length;
  const motorCount = POST445_RELEASE_PRS.filter(pr => pr.originalState === 'motor_base').length;
  const fixCount = POST445_RELEASE_PRS.filter(pr => pr.originalState === 'arreglo').length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost"><Link href={fiestaId ? `/fiestas/nueva?fiestaId=${encodeURIComponent(fiestaId)}` : '/eventos'}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Link></Button>
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Post #445</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card><CardContent className="space-y-5 p-6 sm:p-8"><div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm"><GitPullRequest className="h-4 w-4 text-slate-900" />37 PR revisadas y ordenadas en 5 bloques</div><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Integracion real de lo hecho despues de la #445</h1><p className="max-w-3xl text-base text-muted-foreground">Esta pantalla muestra el camino completo: que PRs fueron arreglos, cuales fueron motores base y donde quedan visibles ahora.</p><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg bg-white p-4"><p className="text-sm text-muted-foreground">PRs revisadas</p><p className="text-3xl font-bold text-slate-950">{total}</p></div><div className="rounded-lg bg-white p-4"><p className="text-sm text-muted-foreground">Motores base</p><p className="text-3xl font-bold text-slate-950">{motorCount}</p></div><div className="rounded-lg bg-white p-4"><p className="text-sm text-muted-foreground">Arreglos CI/deploy</p><p className="text-3xl font-bold text-slate-950">{fixCount}</p></div></div></CardContent></Card>

          <Card><CardHeader><CardTitle>Los 5 PR actuales</CardTitle></CardHeader><CardContent className="space-y-3">{[
            ['1', 'Guardado y backup', 'Corrige guardado manual, automatico, backup y restauracion.'],
            ['2', 'Social e invitacion', 'Hace visible red social, juegos, RSVP, moderacion y pantalla.'],
            ['3', 'Cliente y estetica', 'Ordena la experiencia del cliente para celular.'],
            ['4', 'Comercial y LED', 'Hace visible simulador, CRM, galeria y Portal LED.'],
            ['5', 'Integracion final', 'Muestra el mapa completo y agrega accesos visibles.'],
          ].map(([number, title, description]) => <div key={number} className="flex gap-3 rounded-lg bg-white p-4"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{number}</div><div><p className="font-semibold text-slate-950">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div></div>)}</CardContent></Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {POST445_RELEASE_GROUPS.map(group => {
            const route = withFiesta(group.route, fiestaId);
            return <Card key={group.id}><CardHeader className="space-y-3"><div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm">{group.id === 'guardado_backup' ? <DatabaseBackup className="h-5 w-5" /> : group.id === 'comercial_led' ? <Monitor className="h-5 w-5" /> : <Layers3 className="h-5 w-5" />}</div><CardTitle className="text-lg">{group.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{group.simpleGoal}</p><Badge variant="outline">{countPost445PrsByGroup(group.id)} PRs</Badge>{route && <Button asChild variant="outline" className="w-full justify-start"><Link href={route}>Abrir<ExternalLink className="ml-2 h-4 w-4" /></Link></Button>}</CardContent></Card>;
          })}
        </section>

        <section className="space-y-6">
          {POST445_RELEASE_GROUPS.map(group => {
            const prs = getPost445PrsByGroup(group.id);
            return <Card key={group.id}><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{group.title}</CardTitle><Badge variant="outline">{prs.length} PRs</Badge></div></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{prs.map(pr => <div key={pr.number} className="rounded-lg border bg-white p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><Link href={`https://github.com/akproduccioneseventos/app-AK/pull/${pr.number}`} className="font-semibold text-slate-950 hover:underline">#{pr.number} {pr.title}</Link><Badge variant="outline">{stateLabel(pr.originalState)}</Badge></div><p className="text-sm text-muted-foreground">{pr.visibleResult}</p></div>)}</CardContent></Card>;
          })}
        </section>

        <Card><CardContent className="grid gap-4 p-5 md:grid-cols-3"><div className="rounded-lg bg-white p-4"><ShieldCheck className="mb-3 h-5 w-5 text-emerald-700" /><p className="font-semibold text-slate-950">Sin conflicto intencional</p><p className="mt-1 text-sm text-muted-foreground">Cada PR grande toca zonas separadas.</p></div><div className="rounded-lg bg-white p-4"><CheckCircle2 className="mb-3 h-5 w-5 text-blue-700" /><p className="font-semibold text-slate-950">Motores con puerta visible</p><p className="mt-1 text-sm text-muted-foreground">Social, cliente y comercial dejan de quedar solo como codigo interno.</p></div><div className="rounded-lg bg-white p-4"><DatabaseBackup className="mb-3 h-5 w-5 text-amber-700" /><p className="font-semibold text-slate-950">Guardado primero</p><p className="mt-1 text-sm text-muted-foreground">Antes de sumar pantallas, se asegura backup y guardado.</p></div></CardContent></Card>
      </div>
    </main>
  );
}
