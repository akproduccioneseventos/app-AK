'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { BUDGET_VIEW_REGEX, isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';
import { cn } from '@/lib/utils';

export function ModuleNavigationDock() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  if (pathname === '/' || pathname === '/login') return null;

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
        isPublicPath ? 'top-3' : 'top-20',
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
