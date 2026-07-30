import { redirect } from 'next/navigation';

export default async function EditarInsumoRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/empresa/insumos/${id}/editar`);
}
