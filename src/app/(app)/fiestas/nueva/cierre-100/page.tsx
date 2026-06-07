import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, CheckCircle2, DatabaseBackup, Eye, Monitor, Rocket, Smartphone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FINAL_RELEASE_BLOCKS } from '@/lib/cierre-100/final-release-plan';
import type { FinalReleaseBlockId } from '@/lib/cierre-100/final-release-plan';

type PageProps = { searchParams?: { fiestaId?: string } | Promise<{ fiestaId?: string }> };

const iconByBlock: Record<FinalReleaseBlockId, LucideIcon> = {
  accesos: Eye,
  guardado: DatabaseBackup,
  cliente: Smartphone,
  social: Monitor,
  lanzamiento: Rocket,
};

function withFiesta(route: string, fiestaId?: string): string {
  if (!fiestaId || !route.startsWith('/fiestas/nueva')) return route;
  return `${route}?fiestaId=${encodeURIComponent(fiestaId)}`;
}

export default async function Cierre100Page({ searchParams }: PageProps) {
  const params = await Promise.resolve(searchParams ?? {});
  const fiestaId = params.fiestaId;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href={fiestaId ? `/fiestas/nueva?fiestaId=${encodeURIComponent(fiestaId)}` : '/eventos'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Cierre 100%</Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="space-y-5 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
                <Rocket className="h-4 w-4 text-slate-900" />
                AK Producciones lista para uso real
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Revision final de producto</h1>
              <p className="max-w-3xl text-base text-muted-foreground">
                Esta pantalla ordena las 5 PR de cierre para que la app no quede solo con codigo creado. El objetivo es que todo se pueda abrir, entender, guardar y probar como lo usaria AK y como lo usaria un cliente desde el celular.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={withFiesta('/fiestas/nueva/portal-cliente/cierre-final', fiestaId)}>Revisar cliente</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={withFiesta('/fiestas/nueva/social-fiesta-pro/cierre-final', fiestaId)}>Revisar fiesta en vivo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Regla de cierre</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">No cuenta como listo si esta escondido</p>
                <p className="mt-1">Tiene que verse con boton o enlace claro.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">No cuenta como listo si no guarda</p>
                <p className="mt-1">Los datos importantes tienen que entrar en backup.</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="font-semibold text-slate-950">No cuenta como listo si el cliente se pierde</p>
                <p className="mt-1">La experiencia se mide desde celular.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {FINAL_RELEASE_BLOCKS.map((block) => {
            const Icon = iconByBlock[block.id];
            return (
              <Card key={block.id}>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">{block.order}</div>
                    <div className="rounded-lg bg-white p-3 text-slate-900 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{block.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{block.plainGoal}</p>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href={withFiesta(block.route, fiestaId)}>Abrir</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="space-y-4">
          {FINAL_RELEASE_BLOCKS.map((block) => (
            <Card key={block.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{block.order}/5 {block.title}</CardTitle>
                  <Badge variant="outline">Fusionar en orden</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {block.doneMeans.map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg bg-white p-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            Despues de fusionar estas 5 PR, la revision correcta es abrir un evento real desde celular y recorrer: planificador, backup, cliente, fiesta en vivo y cierre 100%.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
