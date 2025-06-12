
'use server';

import type { Prospecto, NewProspectoData, ProspectSalesFunnelStage } from '@/types/prospect';
import fs from 'fs/promises';
import path from 'path';
import { saveCustomer } from '@/app/actions/customers'; // Para la conversión
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
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await writeProspectsFile([]); // Crear archivo si no existe
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
  // Filtrar los que ya fueron convertidos o descartados para el embudo principal
  return prospects
    .filter(p => p.salesFunnelStage !== 'Contrato Firmado' && p.salesFunnelStage !== 'Descartado')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getAllProspectsIncludingClosed(): Promise<Prospecto[]> {
  // Para vistas de historial o si se necesita ver todo
  const prospects = await readProspectsFile();
  return prospects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}


export async function getProspectById(id: string): Promise<Prospecto | null> {
  const prospects = await readProspectsFile();
  return prospects.find(p => p.id === id) || null;
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
      prospects[index] = { 
        ...prospects[index], 
        ...prospectData,
        updatedAt: now,
      };
      
      // Lógica de conversión a Cliente
      if (prospectData.salesFunnelStage === 'Contrato Firmado') {
        const customerDataFromProspect: Omit<Customer, 'id' | 'salesFunnelStage' | 'estadoCliente'> = {
          name: prospectData.name,
          companyName: prospectData.companyName,
          email: prospectData.email,
          phone: prospectData.phone,
          taxId: prospectData.taxId,
          address: prospectData.address,
        };
        // Aquí podrías buscar un cliente existente antes de crear uno nuevo
        const customerResult = await saveCustomer(customerDataFromProspect);
        if (customerResult.success && customerResult.id) {
          // Podrías querer eliminar el prospecto o marcarlo como 'Convertido'
          // Por ahora, solo actualizamos su estado.
          prospects[index].salesFunnelStage = 'Contrato Firmado'; // Aseguramos el estado
          await writeProspectsFile(prospects);
          return { success: true, id: prospectData.id, prospect: prospects[index], customerId: customerResult.id };
        } else {
          return { success: false, error: `Error al convertir prospecto a cliente: ${customerResult.error}` };
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
      salesFunnelStage: prospectData.salesFunnelStage || 'Lead', // Default stage
      createdAt: now,
      updatedAt: now,
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

// Initialize prospects.json if it doesn't exist
async function initializeProspectData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(prospectsFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo prospects.json no encontrado, creando archivo vacío...');
            await writeProspectsFile([]);
        }
    }
}
initializeProspectData();
