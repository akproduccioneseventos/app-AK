import { redirect } from 'next/navigation';

// Si falta el identificador, Elegí una fiesta o servicio desde el catálogo.
export default async function EditarServicioRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  if (resolvedParams?.id) {
    redirect(`/empresa/servicios/editar/${resolvedParams.id}`);
  }
  redirect('/empresa/servicios');
}
