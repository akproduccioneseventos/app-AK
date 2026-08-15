'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BUDGET_VIEW_REGEX, isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';
import { cn } from '@/lib/utils';

export function ModuleNavigationDock() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  const isIsolatedRoute =
    pathname.startsWith('/evento/') ||
    pathname.startsWith('/presentacion-led') ||
    pathname.startsWith('/portal-cliente') ||
    pathname.startsWith('/invitacion');

  if (pathname === '/' || pathname === '/login' || isIsolatedRoute) return null;

  const isPublicPath = PUBLIC_EXACT_PATHS.has(pathname) || isPublicPathPrefix(pathname);
  const showDashboardButton = !isPublicPath || BUDGET_VIEW_REGEX.test(pathname);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(showDashboardButton ? '/' : '/landing');
  };

  return (
    <nav
      className={cn(
        'fixed left-3 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white/92 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur print:hidden',
        // Abajo, y en escritorio corrido para pasar la barra lateral.
        //
        // Arriba se montaba encima del contenido: en el celular tapaba el
        // título de la pantalla, y en escritorio quedaba sobre el recuadro del
        // logo. Bajarlo no alcanzaba: abajo a la izquierda tapaba "Alertas" en
        // el menú. La barra lateral mide 16rem y aparece a partir de 768px
        // (`md`), así que desde ahí el botón arranca en 17rem y queda dentro
        // del área de contenido, sin pisar nada. El botón del asistente vive
        // abajo a la derecha, así que tampoco se chocan.
        //
        // En las pantallas públicas no hay barra lateral y arriba funciona
        // bien: ahí se deja como estaba.
        isPublicPath ? 'top-3' : 'bottom-4 md:left-[17rem]',
      )}
      aria-label="Navegacion del modulo"
    >
      <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={handleBack} title="Volver">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      {showDashboardButton && (
        <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={() => router.push('/')} title="Ir al panel principal">
          <LayoutDashboard className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
