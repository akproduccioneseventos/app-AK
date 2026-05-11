import { Download, Laptop, Smartphone } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa-install-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function InstalarAppPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="rounded-[2rem] border border-red-100 bg-white p-6 shadow-xl shadow-red-900/5">
        <Badge className="bg-red-600 text-white">Instalación</Badge>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Instalar AK Producciones en Android y PC</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
          Esta opción permite usar la plataforma como app instalada desde Chrome o Edge, sin pasar por Play Store y sin cambiar la estructura de la aplicación.
        </p>
        <div className="mt-5">
          <PwaInstallButton />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Smartphone className="h-5 w-5 text-red-600" />
              Android
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-600">
            <p>1. Abrí la app desde Chrome.</p>
            <p>2. Tocá el botón de instalación si aparece.</p>
            <p>3. Si no aparece, menú de Chrome → Agregar a pantalla principal.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Laptop className="h-5 w-5 text-red-600" />
              PC / Windows
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-slate-600">
            <p>1. Abrí la app desde Chrome o Edge.</p>
            <p>2. Tocá el ícono de instalar en la barra del navegador si aparece.</p>
            <p>3. También podés ir al menú del navegador → Instalar esta aplicación.</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl border-red-100 bg-red-50 shadow-sm">
        <CardContent className="flex gap-3 p-5 text-sm font-medium leading-6 text-slate-700">
          <Download className="mt-1 h-5 w-5 shrink-0 text-red-600" />
          <p>
            Esta instalación no reemplaza Firebase ni cambia los datos. Solo hace que la web se comporte como aplicación instalada cuando el navegador lo permite.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
