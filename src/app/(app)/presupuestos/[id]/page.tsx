
import { redirect } from 'next/navigation';

export default async function DeprecatedPresupuestoIdPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    redirect(`/presupuestos/${params.id}/ver`);
}

    