
import { notFound } from 'next/navigation';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import { getCompanyInfo } from '@/app/actions/settings';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import type { Presupuesto } from '@/types/presupuesto';
import PublicPortalView from './PublicPortalView';

interface PageProps {
  params: { accessKey: string };
}

export default async function PublicPortalPage({ params }: PageProps) {
  const { accessKey } = params;

  const [fiesta, companyInfo] = await Promise.all([
    getFiestaByAccessKey(accessKey),
    getCompanyInfo(),
  ]);

  if (!fiesta || !fiesta.clientPortalSettings?.enabled) {
    notFound();
  }

  let presupuesto: Presupuesto | null = null;
  if (fiesta.presupuestoId) {
    presupuesto = await getPresupuestoById(fiesta.presupuestoId);
  }

  return (
    <PublicPortalView
      fiesta={fiesta}
      companyContact={companyInfo.companyContact}
      companyName={companyInfo.companyName}
      presupuesto={presupuesto}
    />
  );
}
