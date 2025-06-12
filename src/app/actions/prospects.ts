
'use server';

import type { Prospecto, NewProspectoData, ProspectSalesFunnelStage } from '@/types/prospect';
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
        tipoFiesta: p.tipoFiesta || undefined,
        salonDeseado: p.salonDeseado || undefined,
        cantidadInvitados: p.cantidadInvitados === null ? undefined : (Number(p.cantidadInvitados) || undefined),
        salesFunnelStage: p.salesFunnelStage || 'Prospecto', // Asegurar etapa por defecto
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

export async function getProspects(): Promise<Prospecto[]> {
  const prospects = await readProspectsFile();
  // Filtrar los que ya fueron convertidos ('Contratado') o descartados ('No Contratado') para el embudo principal
  return prospects
    .filter(p => p.salesFunnelStage !== 'Contratado' && p.salesFunnelStage !== 'No Contratado')
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
    tipoFiesta: prospect.tipoFiesta || undefined,
    salonDeseado: prospect.salonDeseado || undefined,
    cantidadInvitados: prospect.cantidadInvitados === null ? undefined : (Number(prospect.cantidadInvitados) || undefined),
    salesFunnelStage: prospect.salesFunnelStage || 'Prospecto',
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
    if (index !== -1) {
      const originalProspect = prospects[index];
      prospects[index] = { 
        ...originalProspect, 
        ...prospectData,
        updatedAt: now,
        createdAt: originalProspect.createdAt || now, 
        cantidadInvitados: prospectData.cantidadInvitados === null ? undefined : (Number(prospectData.cantidadInvitados) || undefined),
      };
      
      // Lógica de conversión a Cliente
      if (prospectData.salesFunnelStage === 'Contratado') {
        const customerDataFromProspect: Omit<Customer, 'id' | 'estadoCliente'> = {
          name: prospectData.name,
          companyName: prospectData.companyName,
          email: prospectData.email,
          phone: prospectData.phone,
          taxId: prospectData.taxId,
          address: prospectData.address,
        };
        
        const customerResult = await saveCustomer(customerDataFromProspect);
        if (customerResult.success && customerResult.id) {
          prospects[index].salesFunnelStage = 'Contratado'; 
          await writeProspectsFile(prospects);
          return { success: true, id: prospectData.id, prospect: prospects[index], customerId: customerResult.id };
        } else {
          // Aún así guardamos el prospecto como 'Contratado'
          await writeProspectsFile(prospects);
          return { success: true, id: prospectData.id, prospect: prospects[index], error: `Prospecto actualizado a 'Contratado' pero hubo un problema al crear/actualizar el cliente: ${customerResult.error}` };
        }
      }

      await writeProspectsFile(prospects);
      return { success: true, id: prospectData.id, prospect: prospects[index] };
    } else {
      return { success: false, error: `Prospecto con ID ${prospectData.id} no encontrado.` };
    }
  } else {
    // Create new prospect
    const newProspect: Prospecto = {
      ...(prospectData as NewProspectoData),
      id: `prospect_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      salesFunnelStage: prospectData.salesFunnelStage || 'Prospecto', // Default stage
      createdAt: now,
      updatedAt: now,
      cantidadInvitados: prospectData.cantidadInvitados === null ? undefined : (Number(prospectData.cantidadInvitados) || undefined),
    };
    prospects.push(newProspect);
    await writeProspectsFile(prospects);
    return { success: true, id: newProspect.id, prospect: newProspect };
  }
}

export async function deleteProspect(id: string): Promise<{ success: boolean; error?: string }> {
  let prospects = await readProspectsFile();
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
            if (!p.createdAt) {
                p.createdAt = new Date(0).toISOString(); 
                prospectModified = true;
            }
            if (!p.updatedAt) {
                p.updatedAt = new Date().toISOString();
                prospectModified = true;
            }
            if (p.cantidadInvitados === null) { 
                p.cantidadInvitados = undefined;
                prospectModified = true;
            }
            if (!p.salesFunnelStage) { // Default a etapa si no existe
                p.salesFunnelStage = 'Prospecto';
                prospectModified = true;
            }
            if (prospectModified) wasModified = true;
            return p;
        });
        if (wasModified) {
            await writeProspectsFile(updatedProspects);
        }

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo prospects.json no encontrado, creando archivo vacío...');
            await writeProspectsFile([]);
        }
    }
}
initializeProspectData();
