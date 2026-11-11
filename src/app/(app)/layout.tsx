import { AuthGuard } from '../auth-guard';
import { AppShell } from '@/components/app-shell';
import { BudgetShareDock } from '@/components/presupuestos/budget-share-dock';
import { ContextualAssistantIndicator } from '@/components/assistant/contextual-assistant-indicator';
import { verifySession } from '@/lib/auth/session-token';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession().catch(() => ({ success: false, user: undefined }));
  const esAuditor = session.success && session.user?.perfil === 'auditor';

  return (
    <AuthGuard>
      {esAuditor && (
        <div
          data-testid="franja-auditor"
          className="sticky top-0 z-[100] w-full bg-amber-500 text-slate-950 px-4 py-2 text-center text-sm font-black shadow-md flex items-center justify-center tracking-wide"
        >
          Acceso de auditor · sólo mirar
        </div>
      )}
      <AppShell>{children}</AppShell>
      <BudgetShareDock />
      <ContextualAssistantIndicator />
    </AuthGuard>
  );
}
