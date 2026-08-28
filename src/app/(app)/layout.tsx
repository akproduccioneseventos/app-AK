import { AuthGuard } from '../auth-guard';
import { AppShell } from '@/components/app-shell';
import { BudgetShareDock } from '@/components/presupuestos/budget-share-dock';
import { ContextualAssistantIndicator } from '@/components/assistant/contextual-assistant-indicator';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
      <BudgetShareDock />
      <ContextualAssistantIndicator />
    </AuthGuard>
  );
}
