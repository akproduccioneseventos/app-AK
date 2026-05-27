
import { notFound } from 'next/navigation';
import { getFiestaByAccessKey } from '@/app/actions/fiesta/portal.actions';
import { getCompanyInfo } from '@/app/actions/settings';
import { getPresupuestoById } from '@/app/actions/presupuestos';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import type { Presupuesto } from '@/types/presupuesto';
import PublicPortalClientExperience from './PublicPortalClientExperience';

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

  const [presupuesto, catalogServices] = await Promise.all([
    fiesta.presupuestoId ? getPresupuestoById(fiesta.presupuestoId) : Promise.resolve(null as Presupuesto | null),
    getServiciosEmpresa().then(servicios => servicios
      .filter(servicio => Number(servicio.precioVenta ?? servicio.precioBase ?? servicio.precioPorPersona ?? 0) > 0)
      .slice(0, 80)
      .map(servicio => ({
        id: servicio.id,
        nombre: servicio.nombre,
        categoria: servicio.categoria,
        subcategoria: servicio.subcategoria,
        precioVenta: servicio.precioVenta,
        calculationMethod: servicio.calculationMethod,
        precioBase: servicio.precioBase,
        precioPorPersona: servicio.precioPorPersona,
        invitadosPorUnidad: servicio.invitadosPorUnidad,
        tramosDePrecio: servicio.tramosDePrecio,
        unidad: servicio.unidad,
      }))).catch(() => []),
  ]);

  return (
    <PublicPortalClientExperience
      fiesta={fiesta}
      companyContact={companyInfo.companyContact}
      companyName={companyInfo.companyName}
      presupuesto={presupuesto}
      catalogServices={catalogServices}
    />
  );
}
