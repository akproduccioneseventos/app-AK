
import { redirect } from 'next/navigation';

export default function DeprecatedPresupuestoIdPage({ params }: { params: { id: string } }) {
    redirect(`/presupuestos/${params.id}/ver`);
}

    