import { redirect } from 'next/navigation';

export default function EmpresaPersonalHistorialRedirectPage({ params }: { params: { empleadoId: string } }) {
  redirect(`/empleados/${params.empleadoId}/historial`);
}
