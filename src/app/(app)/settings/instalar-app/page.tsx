import { CheckCircle2, Download, Laptop, ShieldCheck, Smartphone, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PwaInstallButton } from '@/components/pwa-install-button';

const installSteps = [
  {
    title: 'Android',
    icon: Smartphone,
    steps: ['Abrir la app desde Chrome.', 'Tocar Instalar si aparece.', 'Si no aparece: menu de Chrome y Agregar a pantalla principal.'],
  },
  {
    title: 'PC / Windows',
    icon: Laptop,
    steps: ['Abrir desde Chrome o Edge.', 'Tocar el icono de instalacion en la barra.', 'Tambien sirve el menu del navegador y la opcion Instalar esta aplicacion.'],
  },
];

const readiness = [
  'Manifest listo con iconos PNG y SVG.',
  'Service worker activo para abrir como app instalada.',
  'Accesos rapidos para fiesta nueva, instalacion y presentacion LED.',
  'Sesion protegida con cookie firmada; sin secreto privado expira en 24 horas.',
];

export default function InstalarAppPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(215,25,32,0.08),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-xl shadow-red-900/5 sm:p-8">
          <Badge className="bg-red-600 text-white">App instalable</Badge>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                AK Producciones en Android y PC
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-600 sm:text-base">
                Se puede usar como una app instalada, sin Play Store y sin cambiar Firebase. La aplicacion sigue siendo online, pero queda con icono propio, pantalla completa y acceso mas rapido.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
              <PwaInstallButton />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {installSteps.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-[1.5rem] border-slate-100 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                    <Icon className="h-5 w-5 text-red-600" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  {item.steps.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-black text-red-600">
                        {index + 1}
                      </span>
                      <p className="pt-0.5 font-medium">{step}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card className="rounded-[1.5rem] border-slate-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Lo que queda cubierto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm font-medium leading-6 text-slate-600 sm:grid-cols-2">
              {readiness.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-[1.5rem] border-red-100 bg-white shadow-sm">
              <CardContent className="flex gap-3 p-5 text-sm font-medium leading-6 text-slate-700">
                <Wifi className="mt-1 h-5 w-5 shrink-0 text-red-600" />
                <p>
                  Para guardar datos, sincronizar fiestas y usar Firebase se necesita internet. La instalacion mejora el acceso, no convierte toda la app en offline.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-slate-100 bg-white shadow-sm">
              <CardContent className="flex gap-3 p-5 text-sm font-medium leading-6 text-slate-700">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-red-600" />
                <p>
                  Sin secreto privado la app igual funciona. Para no depender de configuraciones dificiles, la sesion firmada baja su duracion a 24 horas.
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-slate-100 bg-white shadow-sm">
              <CardContent className="flex gap-3 p-5 text-sm font-medium leading-6 text-slate-700">
                <Download className="mt-1 h-5 w-5 shrink-0 text-red-600" />
                <p>
                  Si el navegador no muestra el boton automatico, se instala desde el menu. Eso es normal y depende de Chrome, Edge o el celular.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
