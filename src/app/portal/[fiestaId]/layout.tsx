import type { ReactNode } from 'react';
import { elPortalPideSesion } from '@/lib/portal/el-portal-pide-sesion';

export default async function PortalDeLaFiestaLayout(props: { children: ReactNode; params: Promise<{ fiestaId: string }> }) {
  const { fiestaId } = await props.params;
  await elPortalPideSesion(fiestaId);
  return <>{props.children}</>;
}
