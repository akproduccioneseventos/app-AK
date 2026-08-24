'use server';

import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';
import { getFiestas } from './fiesta/fiesta.actions';
import { getPresupuestos } from './presupuestos';
import { detectarErroresHumanos, type AlertaErrorHumano, type DescarteAlerta } from '@/lib/alertas/errores-humanos';

const DESCARTES_FILE = 'alertas-descartadas.json';

export async function getAlertasErroresHumanos(): Promise<AlertaErrorHumano[]> {
  await requireAppSession();
  try {
    const [fiestas, presupuestos, descartes] = await Promise.all([
      getFiestas(false),
      getPresupuestos(true),
      readData<DescarteAlerta[]>(DESCARTES_FILE, []),
    ]);

    return detectarErroresHumanos(fiestas, presupuestos, descartes);
  } catch (error) {
    console.error('Error al detectar errores humanos:', error);
    return [];
  }
}

export async function descartarAlertaErrorHumano(
  alertaId: string,
  motivo: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAppSession();
  if (!alertaId || !motivo.trim()) {
    return { success: false, error: 'El motivo del descarte es obligatorio para evitar falsas alarmas.' };
  }

  try {
    const descartes = await readData<DescarteAlerta[]>(DESCARTES_FILE, []);
    const nuevo: DescarteAlerta = {
      alertaId,
      motivo: motivo.trim(),
      descartadaEn: new Date().toISOString(),
      descartadaPor: (session as any)?.user?.nombre || (session as any)?.user?.email || 'admin',
    };

    const filtrados = descartes.filter((d) => d.alertaId !== alertaId);
    filtrados.push(nuevo);
    await writeData(DESCARTES_FILE, filtrados);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al descartar la alerta.' };
  }
}

