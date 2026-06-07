import { AuthGuard } from '../auth-guard';
import { AppShell } from '@/components/app-shell';
import { BudgetShareDock } from '@/components/presupuestos/budget-share-dock';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
      <BudgetShareDock />
    </AuthGuard>
  );
}
