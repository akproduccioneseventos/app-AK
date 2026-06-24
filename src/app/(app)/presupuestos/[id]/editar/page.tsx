import { redirect } from 'next/navigation';

export default async function EditarPresupuestoAliasPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/presupuestos/${params.id}/edit`);
}
