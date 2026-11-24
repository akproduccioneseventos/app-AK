import { Suspense } from 'react';
import { estadoDeLasTareas } from '@/lib/automatico/tareas-automaticas';
import type { EstadoDeTarea } from '@/lib/automatico/resumen-tareas';
import { getGastoDeIA } from '@/app/actions/ai-consumo';
import type { ResumenDeGasto } from '@/lib/ai/consumo';
import { AsistenteHubClient } from './asistente-client';

export const dynamic = 'force-dynamic';

export default async function AsistenteHubPage() {
  let initialTareas: EstadoDeTarea[] = [];
  try {
    initialTareas = await estadoDeLasTareas();
  } catch {
    initialTareas = [];
  }

  let initialGasto: ResumenDeGasto | null = null;
  try {
    initialGasto = await getGastoDeIA();
  } catch {
    initialGasto = null;
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Cargando asistente…</div>}>
      <AsistenteHubClient initialTareas={initialTareas} initialGasto={initialGasto} />
    </Suspense>
  );
}
