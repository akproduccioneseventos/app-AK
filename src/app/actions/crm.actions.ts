'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Prospect, ProspectBudget } from '@/types/crm';

const PROSPECTS_FILE = 'prospects.json';

export async function getProspects(): Promise<Prospect[]> {
  return readData<Prospect[]>(PROSPECTS_FILE, []);
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const prospects = await getProspects();
  return prospects.find((p) => p.id === id) || null;
}

export async function saveProspectBudget(
  prospectId: string,
  budgetData: Omit<ProspectBudget, 'id' | 'createdAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const prospects = await getProspects();
    const index = prospects.findIndex((p) => p.id === prospectId);
    if (index === -1) {
      return { success: false, error: 'Prospecto no encontrado' };
    }

    const budgetId = `pb_${Math.random().toString(36).substring(2, 9)}`;
    const newBudget: ProspectBudget = {
      id: budgetId,
      createdAt: new Date().toISOString(),
      ...budgetData,
    };

    if (!prospects[index].budgets) {
      prospects[index].budgets = [];
    }
    prospects[index].budgets.push(newBudget);
    prospects[index].updatedAt = new Date().toISOString();

    await writeData(PROSPECTS_FILE, prospects);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving prospect budget:', error);
    return { success: false, error: error.message || 'Error al guardar el presupuesto del prospecto.' };
  }
}
