import { elPortalPideSesion } from '@/lib/portal/el-portal-pide-sesion';
import { BotonComoFunciona } from '@/components/tutorial/BotonComoFunciona';
import MesasDelCliente from './mesas-del-cliente';

export default async function MesasPage(props: { searchParams: Promise<{ fiestaId?: string }> }) {
  const { fiestaId } = await props.searchParams;
  await elPortalPideSesion(fiestaId);
  return (
    <>
      <div className="bg-muted/30 px-4 pt-3 md:px-8 flex justify-end">
        <div className="max-w-5xl w-full flex justify-end">
          <BotonComoFunciona clave="mesas" />
        </div>
      </div>
      <MesasDelCliente />
    </>
  );
}
