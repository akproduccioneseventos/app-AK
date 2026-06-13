import { redirect } from 'next/navigation';

export default function EditarPresupuestoAliasPage({ params }: { params: { id: string } }) {
  redirect(`/presupuestos/${params.id}/edit`);
}
