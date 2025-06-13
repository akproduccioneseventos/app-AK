
// DEBUG-EMBUDO-V7 - Actions (ahora Ventas)
'use server';

import type { Prospecto, NewProspectoData, ProspectSalesFunnelStage } from '@/types/prospect';
import { ALL_PROSPECT_STAGES, ACTIVE_VENTAS_STAGES } from '@/types/prospect'; // Asegurarse de usar ACTIVE_VENTAS_STAGES
import fs from 'fs/promises';
import path from 'path';
import { saveCustomer } from '@/app/actions/customers';
import type { Customer } from '@/types/customer';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const prospectsFilePath = path.join(dataDirectory, 'prospects.json');

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para prospectos:', error);
  }
}

async function readProspectsFile(): Promise<Prospecto[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(prospectsFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return (Array.isArray(data) ? data : []).map(p => ({
      ...p,
      createdAt: p.createdAt || new Date(0).toISOString(),
      updatedAt: p.updatedAt || new Date(0).toISOString(),
      salesFunnelStage: p.salesFunnelStage || 'Consulto',
      tipoFiesta: p.tipoFiesta || undefined,
      salonDeseado: p.salonDeseado || undefined,
      cantidadInvitados: p.cantidadInvitados === null || p.cantidadInvitados === undefined ? undefined : Number(p.cantidadInvitados),
      nextMeetingDate: p.nextMeetingDate || undefined,
      estimatedValue: p.estimatedValue === null || p.estimatedValue === undefined ? undefined : Number(p.estimatedValue),
      contractNotes: p.contractNotes || undefined,
    }));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeProspectsFile([]);
      return [];
    }
    console.error('Error leyendo el archivo de prospectos, devolviendo array vacío:', error);
    return [];
  }
}

async function writeProspectsFile(data: Prospecto[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(prospectsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de prospectos:', error);
  }
}

export async function getProspectsForVentasBoard(): Promise<Prospecto[]> {
  const prospects = await readProspectsFile();
  // Esta función ahora usa ACTIVE_VENTAS_STAGES, que debe incluir las 5 etapas para que aparezcan.
  return prospects
    .filter(p => ACTIVE_VENTAS_STAGES.includes(p.salesFunnelStage as any)) 
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getAllProspectsIncludingClosed(): Promise<Prospecto[]> {
  const prospects = await readProspectsFile();
  return prospects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getProspectById(id: string): Promise<Prospecto | null> {
  const prospects = await readProspectsFile();
  const prospect = prospects.find(p => p.id === id);
  return prospect ? {
    ...prospect,
    createdAt: prospect.createdAt || new Date(0).toISOString(),
    updatedAt: prospect.updatedAt || new Date().toISOString(),
    salesFunnelStage: prospect.salesFunnelStage || 'Consulto',
    tipoFiesta: prospect.tipoFiesta || undefined,
    salonDeseado: prospect.salonDeseado || undefined,
    cantidadInvitados: prospect.cantidadInvitados === null || prospect.cantidadInvitados === undefined ? undefined : Number(prospect.cantidadInvitados),
    nextMeetingDate: prospect.nextMeetingDate || undefined,
    estimatedValue: prospect.estimatedValue === null || prospect.estimatedValue === undefined ? undefined : Number(prospect.estimatedValue),
    contractNotes: prospect.contractNotes || undefined,
  } : null;
}

export async function saveProspect(
  prospectData: NewProspectoData | Prospecto
): Promise<{ success: boolean; id?: string; prospect?: Prospecto; error?: string; customerId?: string }> {
  let prospects = await readProspectsFile();
  const now = new Date().toISOString();

  if ('id' in prospectData && prospectData.id) {
    // Update existing prospect
    const index = prospects.findIndex(p => p.id === prospectData.id);
    if (index === -1) {
      return { success: false, error: `Prospecto con ID ${prospectData.id} no encontrado.` };
    }
    
    const originalProspect = prospects[index];
    prospects[index] = {
      ...originalProspect,
      ...prospectData,
      updatedAt: now,
      createdAt: originalProspect.createdAt || now, // Mantener fecha de creación original
      cantidadInvitados: prospectData.cantidadInvitados === null || prospectData.cantidadInvitados === undefined ? undefined : Number(prospectData.cantidadInvitados),
      estimatedValue: prospectData.estimatedValue === null || prospectData.estimatedValue === undefined ? undefined : Number(prospectData.estimatedValue),
      nextMeetingDate: prospectData.salesFunnelStage === 'Agendo Entrevista' && prospectData.nextMeetingDate ? prospectData.nextMeetingDate : undefined,
      contractNotes: prospectData.contractNotes || originalProspect.contractNotes,
    };
    
    if (prospects[index].salesFunnelStage === 'Firmo Contrato') {
      const customerDataFromProspect: Omit<Customer, 'id' | 'estadoCliente'> = {
        name: prospects[index].name,
        companyName: prospects[index].companyName,
        email: prospects[index].email,
        phone: prospects[index].phone,
        taxId: prospects[index].taxId,
        address: prospects[index].address,
        // Se podría añadir una nota al cliente desde `contractNotes`
      };
      const customerResult = await saveCustomer(customerDataFromProspect);
      if (customerResult.success && customerResult.id) {
        await writeProspectsFile(prospects);
        return { success: true, id: prospectData.id, prospect: prospects[index], customerId: customerResult.id };
      } else {
        await writeProspectsFile(prospects); 
        return { success: true, id: prospectData.id, prospect: prospects[index], error: `Prospecto actualizado a 'Firmo Contrato' pero hubo un problema al crear/actualizar el cliente: ${customerResult.error}` };
      }
    }

    await writeProspectsFile(prospects);
    return { success: true, id: prospectData.id, prospect: prospects[index] };

  } else {
    // Create new prospect
    const newProspect: Prospecto = {
      ...(prospectData as NewProspectoData), 
      id: `prospect_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      salesFunnelStage: 'Consulto', // Default stage for new prospects
      createdAt: now,
      updatedAt: now,
      tipoFiesta: prospectData.tipoFiesta || undefined,
      salonDeseado: prospectData.salonDeseado || undefined,
      cantidadInvitados: prospectData.cantidadInvitados === null || prospectData.cantidadInvitados === undefined ? undefined : Number(prospectData.cantidadInvitados),
      nextMeetingDate: undefined,
      estimatedValue: prospectData.estimatedValue === null || prospectData.estimatedValue === undefined ? undefined : Number(prospectData.estimatedValue),
      companyName: prospectData.companyName || undefined,
      email: prospectData.email || undefined,
      taxId: prospectData.taxId || undefined,
      address: prospectData.address || undefined,
      source: prospectData.source || undefined,
      notes: prospectData.notes || undefined,
      contractNotes: prospectData.contractNotes || undefined,
    };
    prospects.push(newProspect);
    await writeProspectsFile(prospects);
    return { success: true, id: newProspect.id, prospect: newProspect };
  }
}

export async function deleteProspect(id: string): Promise<{ success: boolean; error?: string }> {
  let prospects = await readProspectsFile();
  const prospectToDelete = prospects.find(p => p.id === id);
  if (prospectToDelete && prospectToDelete.salesFunnelStage === 'Firmo Contrato') {
    return { success: false, error: 'No se puede eliminar un prospecto que ya firmó contrato. Gestionar desde Clientes.' };
  }

  const initialLength = prospects.length;
  prospects = prospects.filter(p => p.id !== id);

  if (prospects.length < initialLength) {
    await writeProspectsFile(prospects);
    return { success: true };
  } else {
    return { success: false, error: `Prospecto con ID ${id} no encontrado.` };
  }
}

async function initializeProspectData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(prospectsFilePath); 
        const currentProspects = await readProspectsFile();
        let wasModified = false;
        const updatedProspects = currentProspects.map(p => {
            let prospectModified = false;
            if (!p.createdAt) { p.createdAt = new Date(0).toISOString(); prospectModified = true; }
            if (!p.updatedAt) { p.updatedAt = new Date().toISOString(); prospectModified = true; }
            if (!p.salesFunnelStage || !ALL_PROSPECT_STAGES.includes(p.salesFunnelStage as any)) {
                p.salesFunnelStage = 'Consulto'; prospectModified = true;
            }
            if (!('tipoFiesta' in p)) { p.tipoFiesta = undefined; prospectModified = true; }
            if (!('salonDeseado' in p)) { p.salonDeseado = undefined; prospectModified = true; }
            if (!('cantidadInvitados' in p) || p.cantidadInvitados === null) { p.cantidadInvitados = undefined; prospectModified = true; }
            if (!('nextMeetingDate' in p)) {p.nextMeetingDate = undefined; prospectModified = true; }
            if (p.salesFunnelStage !== 'Agendo Entrevista' && p.nextMeetingDate) {
                p.nextMeetingDate = undefined; prospectModified = true;
            }
            if (!('estimatedValue' in p) || p.estimatedValue === null) { p.estimatedValue = undefined; prospectModified = true; }
            if (!('contractNotes' in p)) {p.contractNotes = undefined; prospectModified = true; }

            if (prospectModified) wasModified = true;
            return p;
        });
        if (wasModified) {
            await writeProspectsFile(updatedProspects);
            console.log('Prospects data initialized/updated with new stages.');
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo prospects.json no encontrado, creando archivo vacío...');
            await writeProspectsFile([]);
        }
    }
}

initializeProspectData();
