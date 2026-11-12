'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BUDGET_VIEW_REGEX, isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';
import { cn } from '@/lib/utils';
import { useEsVistaDelCliente } from '@/hooks/use-es-vista-del-cliente';

export function ModuleNavigationDock() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const esVistaDelCliente = useEsVistaDelCliente(pathname);

  const isIsolatedRoute =
    pathname.startsWith('/evento/') ||
    pathname.startsWith('/presentacion-led') ||
    pathname.startsWith('/portal-cliente') ||
    pathname.startsWith('/invitacion');

  if (pathname === '/' || pathname === '/login' || isIsolatedRoute) return null;

  const isPublicPath = PUBLIC_EXACT_PATHS.has(pathname) || isPublicPathPrefix(pathname);
  // El presupuesto abierto con el enlace del cliente no le ofrece el panel del equipo.
  const showDashboardButton = (!isPublicPath || BUDGET_VIEW_REGEX.test(pathname)) && !esVistaDelCliente;

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(showDashboardButton ? '/admin' : '/landing');
  };

  return (
    <nav
      className={cn(
        'hidden md:flex fixed left-3 z-40 items-center gap-2 rounded-full border border-slate-200 bg-white/92 p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur print:hidden',
        isPublicPath ? 'top-3' : 'bottom-4 md:left-[17rem]',
      )}
      aria-label="Navegacion del modulo"
    >
      <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={handleBack} title="Volver">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      {showDashboardButton && (
        <Button type="button" size="icon" variant="ghost" className="h-10 w-10 rounded-full" onClick={() => router.push('/admin')} title="Ir al panel principal">
          <LayoutDashboard className="h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
