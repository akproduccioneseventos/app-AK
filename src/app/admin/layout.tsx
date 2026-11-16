import { AuthGuard } from '../auth-guard';
import { verifySession } from '@/lib/auth/session-token';

export default async function AdminLayout({
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
      {children}
    </AuthGuard>
  );
}
