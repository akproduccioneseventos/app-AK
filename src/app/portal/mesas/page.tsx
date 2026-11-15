import { elPortalPideSesion } from '@/lib/portal/el-portal-pide-sesion';
import MesasDelCliente from './mesas-del-cliente';

export default async function MesasPage(props: { searchParams: Promise<{ fiestaId?: string }> }) {
  const { fiestaId } = await props.searchParams;
  await elPortalPideSesion(fiestaId);
  return <MesasDelCliente />;
}
