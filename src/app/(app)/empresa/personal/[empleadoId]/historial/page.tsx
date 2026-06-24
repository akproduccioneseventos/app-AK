import { redirect } from 'next/navigation';

export default async function EmpresaPersonalHistorialRedirectPage(props: { params: Promise<{ empleadoId: string }> }) {
  const params = await props.params;
  redirect(`/empleados/${params.empleadoId}/historial`);
}
