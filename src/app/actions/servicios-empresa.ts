
'use server';

import type { ServicioEmpresa } from '@/types/empresa';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'src', 'data');
const serviciosFilePath = path.join(dataDirectory, 'servicios-empresa.json');

const initialServicios: ServicioEmpresa[] = [
  {
    id: 'serv_acc_film',
    nombre: 'Accesorios de filmación',
    categoria: 'Audiovisual',
    precioEstimado: 500,
    unidad: 'Por evento',
    descripcion: 'Diversos accesorios para rodaje.',
  },
  {
    id: 'serv_acred',
    nombre: 'Acreditaciones',
    categoria: 'Logística',
    precioEstimado: 20,
    unidad: 'Por persona',
    descripcion: 'Diseño e impresión de acreditaciones.',
  },
  {
    id: 'serv_alq_audio',
    nombre: 'Alquiler Audiovisual General',
    categoria: 'Audiovisual',
    precioEstimado: 2500,
    unidad: 'Por evento',
    descripcion: 'Paquete básico de alquiler de equipos audiovisuales.',
  },
  {
    id: 'serv_alq_carpas',
    nombre: 'Alquiler de Carpas',
    categoria: 'Estructuras',
    precioEstimado: 20000,
    unidad: 'Por evento',
    descripcion: 'Alquiler e instalación de carpas para eventos.',
  },
  {
    id: 'serv_alq_sonido',
    nombre: 'Alquiler de Equipos de Sonido',
    categoria: 'Audiovisual',
    precioEstimado: 1500,
    unidad: 'Por evento',
    descripcion: 'Sistemas de sonido adaptados al tamaño del evento.',
  },
  {
    id: 'serv_alq_ilum',
    nombre: 'Alquiler de Iluminación',
    categoria: 'Iluminación',
    precioEstimado: 1500,
    unidad: 'Por evento',
    descripcion: 'Equipos de iluminación básica y decorativa.',
  },
  {
    id: 'serv_animacion',
    nombre: 'Animación de Eventos',
    categoria: 'Entretenimiento',
    precioEstimado: 2500,
    unidad: 'Por evento',
    descripcion: 'Servicios de animación y entretenimiento.',
  },
  {
    id: 'serv_asist_pers',
    nombre: 'Asistente Personal de Evento',
    categoria: 'Personal',
    precioEstimado: 150,
    unidad: 'Por hora',
    descripcion: 'Asistencia personalizada durante el evento.',
  },
  {
    id: 'serv_backline',
    nombre: 'Backline para Músicos',
    categoria: 'Equipamiento',
    precioEstimado: 3000,
    unidad: 'Por evento',
    descripcion: 'Alquiler de instrumentos y equipamiento para bandas.',
  },
  {
    id: 'serv_barra_tragos',
    nombre: 'Barra de Tragos',
    categoria: 'Catering',
    precioEstimado: 25000,
    unidad: 'Por evento',
    descripcion: 'Servicio de barra de tragos con o sin alcohol.',
  },
  {
    id: 'serv_cat_almu_cena_form',
    nombre: 'Catering (Almuerzo o Cena Formal)',
    categoria: 'Catering',
    precioEstimado: 1800,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_brunch',
    nombre: 'Catering (Brunch)',
    categoria: 'Catering',
    precioEstimado: 1200,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_cocktail',
    nombre: 'Catering (Cocktail)',
    categoria: 'Catering',
    precioEstimado: 1500,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_coffee',
    nombre: 'Catering (Coffee Break)',
    categoria: 'Catering',
    precioEstimado: 600,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_finger',
    nombre: 'Catering (Finger Food)',
    categoria: 'Catering',
    precioEstimado: 1000,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_menu_inf',
    nombre: 'Catering (Menú Infantil)',
    categoria: 'Catering',
    precioEstimado: 800,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_mesa_dulce',
    nombre: 'Catering (Mesa de Dulces)',
    categoria: 'Catering',
    precioEstimado: 8000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_cat_pernil',
    nombre: 'Catering (Pernil de Cerdo para 20 personas)',
    categoria: 'Catering',
    precioEstimado: 12000,
    unidad: 'Global',
  },
  {
    id: 'serv_cat_pizza',
    nombre: 'Catering (Pizza Party)',
    categoria: 'Catering',
    precioEstimado: 1000,
    unidad: 'Por persona',
  },
  {
    id: 'serv_cat_torta_aleg',
    nombre: 'Catering (Torta Alegórica)',
    categoria: 'Catering',
    precioEstimado: 7000,
    unidad: 'Global',
  },
  {
    id: 'serv_cat_torta_cump',
    nombre: 'Catering (Torta de Cumpleaños)',
    categoria: 'Catering',
    precioEstimado: 5000,
    unidad: 'Global',
  },
  {
    id: 'serv_consult_coord',
    nombre: 'Consultoría / Coordinación de Evento',
    categoria: 'Planificación',
    precioEstimado: 2500,
    unidad: 'Por evento',
  },
  {
    id: 'serv_decoracion',
    nombre: 'Decoración General de Evento',
    categoria: 'Decoración',
    precioEstimado: 20000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_dj',
    nombre: 'Disc Jockey (DJ)',
    categoria: 'Música',
    precioEstimado: 25000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_dis_graf',
    nombre: 'Diseño Gráfico',
    categoria: 'Diseño',
    precioEstimado: 1500,
    unidad: 'Por proyecto',
  },
  {
    id: 'serv_dis_web_land',
    nombre: 'Diseño Web (Landing Page)',
    categoria: 'Diseño',
    precioEstimado: 10000,
    unidad: 'Por proyecto',
  },
  {
    id: 'serv_drone',
    nombre: 'Servicio de Drone (Filmación y Fotografía)',
    categoria: 'Audiovisual',
    precioEstimado: 8000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_edit_video',
    nombre: 'Edición de Video',
    categoria: 'Audiovisual',
    precioEstimado: 3000,
    unidad: 'Por proyecto',
  },
  {
    id: 'serv_efect_esp',
    nombre: 'Efectos Especiales (Humo, Chispas, etc.)',
    categoria: 'Efectos Especiales',
    precioEstimado: 5000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_fotocab_esp',
    nombre: 'Fotocabina / Espejo Mágico',
    categoria: 'Entretenimiento',
    precioEstimado: 15000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_fotografia',
    nombre: 'Fotografía de Evento',
    categoria: 'Fotografía',
    precioEstimado: 20000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_film_video',
    nombre: 'Filmación y Video de Evento',
    categoria: 'Audiovisual',
    precioEstimado: 25000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_film_inst',
    nombre: 'Filmación Institucional',
    categoria: 'Audiovisual',
    precioEstimado: 30000,
    unidad: 'Por proyecto',
  },
  {
    id: 'serv_loc_pres',
    nombre: 'Locutor / Presentador',
    categoria: 'Personal',
    precioEstimado: 5000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_mobil',
    nombre: 'Mobiliario (sillas, mesas, etc.)',
    categoria: 'Mobiliario',
    precioEstimado: 10000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_mozos',
    nombre: 'Mozos',
    categoria: 'Personal',
    precioEstimado: 250,
    unidad: 'Por hora',
  },
  {
    id: 'serv_pant_led',
    nombre: 'Pantalla LED',
    categoria: 'Audiovisual',
    precioEstimado: 15000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_pers_limp',
    nombre: 'Personal de Limpieza',
    categoria: 'Personal',
    precioEstimado: 150,
    unidad: 'Por hora',
  },
  {
    id: 'serv_pers_seg',
    nombre: 'Personal de Seguridad',
    categoria: 'Personal',
    precioEstimado: 200,
    unidad: 'Por hora',
  },
  {
    id: 'serv_plat_360',
    nombre: 'Plataforma 360',
    categoria: 'Entretenimiento',
    precioEstimado: 18000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_proy_pant',
    nombre: 'Proyector y Pantalla',
    categoria: 'Audiovisual',
    precioEstimado: 5000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_shows_esp',
    nombre: 'Shows / Espectáculos',
    categoria: 'Entretenimiento',
    precioEstimado: 10000,
    unidad: 'Por show',
  },
  {
    id: 'serv_streaming',
    nombre: 'Streaming de Evento',
    categoria: 'Audiovisual',
    precioEstimado: 12000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_tec_audio',
    nombre: 'Técnico Audiovisual',
    categoria: 'Personal',
    precioEstimado: 200,
    unidad: 'Por hora',
  },
  {
    id: 'serv_trans_flete',
    nombre: 'Transporte / Flete',
    categoria: 'Logística',
    precioEstimado: 3000,
    unidad: 'Por viaje',
  },
  {
    id: 'serv_trad_interp',
    nombre: 'Traducción e Interpretación',
    categoria: 'Personal',
    precioEstimado: 250,
    unidad: 'Por hora',
  },
  {
    id: 'serv_vest_maq',
    nombre: 'Vestuario / Maquillaje Profesional',
    categoria: 'Estilismo',
    precioEstimado: 4000,
    unidad: 'Por persona/evento',
  },
  {
    id: 'serv_gen_elec',
    nombre: 'Generador Eléctrico',
    categoria: 'Equipamiento',
    precioEstimado: 6000,
    unidad: 'Por día/evento',
  },
  {
    id: 'serv_internet_ded',
    nombre: 'Servicio de Internet Dedicado',
    categoria: 'Equipamiento',
    precioEstimado: 8000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_impresiones',
    nombre: 'Impresiones (Banners, Folletos)',
    categoria: 'Impresión',
    precioEstimado: 5000,
    unidad: 'Por lote',
  },
  {
    id: 'serv_regalos_souv',
    nombre: 'Regalos Empresariales / Souvenirs',
    categoria: 'Merchandising',
    precioEstimado: 100,
    unidad: 'Por unidad (variable)',
  },
  {
    id: 'serv_control_acc',
    nombre: 'Acreditaciones y Control de Acceso (Sistema)',
    categoria: 'Logística',
    precioEstimado: 3000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_limpieza_post',
    nombre: 'Servicios de Limpieza Post-Evento',
    categoria: 'Limpieza',
    precioEstimado: 4000,
    unidad: 'Por evento',
  },
  {
    id: 'serv_seguro_rc',
    nombre: 'Seguro de Responsabilidad Civil para Evento',
    categoria: 'Otros',
    precioEstimado: 1500,
    unidad: 'Por evento',
  },
  {
    id: 'serv_perm_habil',
    nombre: 'Permisos y Habilitaciones',
    categoria: 'Otros',
    precioEstimado: 1000,
    unidad: 'Por gestión (variable)',
  },
  {
    id: 'serv_stand_feria',
    nombre: 'Stand para Ferias y Exposiciones',
    categoria: 'Estructuras',
    precioEstimado: 25000,
    unidad: 'Por evento/stand',
  },
  {
    id: 'serv_alq_vehic_clas',
    nombre: 'Alquiler de Vehículos (ej. auto clásico)',
    categoria: 'Transporte',
    precioEstimado: 10000,
    unidad: 'Por día/evento'
  }
];

async function ensureDataDirectoryExists(): Promise<void> {
  try {
    await fs.mkdir(dataDirectory, { recursive: true });
  } catch (error) {
    console.error('Error creando el directorio de datos para servicios de empresa:', error);
  }
}

async function writeServiciosFile(data: ServicioEmpresa[]): Promise<void> {
  await ensureDataDirectoryExists();
  try {
    await fs.writeFile(serviciosFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error escribiendo en el archivo de servicios:', error);
    throw new Error('Error al escribir los datos de servicios.'); 
  }
}

async function readServiciosFile(): Promise<ServicioEmpresa[]> {
  await ensureDataDirectoryExists();
  try {
    const fileContent = await fs.readFile(serviciosFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    if (!Array.isArray(data)) {
      console.error('El archivo servicios-empresa.json no contiene un array. Intentando crear con datos iniciales.');
      await writeServiciosFile(initialServicios);
      return [...initialServicios];
    }
    return data;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Archivo servicios-empresa.json no encontrado, intentando crear con datos iniciales...');
      try {
        await writeServiciosFile(initialServicios);
        return [...initialServicios];
      } catch (writeErr) {
        console.error('Error crítico: No se pudo escribir el archivo inicial de servicios:', writeErr);
        throw new Error(`No se pudo crear el archivo de servicios: ${(writeErr as Error).message}`);
      }
    }
    console.error('Error crítico leyendo o parseando el archivo de servicios:', error);
    throw new Error(`Error al leer o parsear el archivo de servicios: ${error.message}`);
  }
}


export async function getServiciosEmpresa(): Promise<ServicioEmpresa[]> {
  const servicios = await readServiciosFile();
  return servicios.sort((a, b) => (a.categoria || '').localeCompare(b.categoria || '') || a.nombre.localeCompare(b.nombre));
}

export async function getServicioEmpresaById(id: string): Promise<ServicioEmpresa | null> {
  const servicios = await readServiciosFile();
  const servicio = servicios.find(s => s.id === id);
  return servicio ? { ...servicio } : null;
}

export async function saveServicioEmpresa(
  servicioData: Omit<ServicioEmpresa, 'id'> | ServicioEmpresa
): Promise<{ success: boolean; id?: string; servicio?: ServicioEmpresa; error?: string }> {
  let servicios = await readServiciosFile();
  
  try {
    if ('id' in servicioData && servicioData.id) {
      // Update existing servicio
      const index = servicios.findIndex(s => s.id === servicioData.id);
      if (index !== -1) {
        servicios[index] = { 
          ...servicios[index], 
          ...servicioData,
          precioEstimado: servicioData.precioEstimado !== undefined ? Number(servicioData.precioEstimado) || undefined : undefined,
        };
        await writeServiciosFile(servicios);
        return { success: true, id: servicioData.id, servicio: { ...servicios[index] } };
      } else {
        return { success: false, error: `Servicio con ID ${servicioData.id} no encontrado para actualizar.` };
      }
    } else {
      // Create new servicio
      const newServicio: ServicioEmpresa = {
        ...(servicioData as Omit<ServicioEmpresa, 'id'>), 
        id: `serv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        precioEstimado: servicioData.precioEstimado !== undefined ? Number(servicioData.precioEstimado) || undefined : undefined,
      };
      servicios.push(newServicio);
      await writeServiciosFile(servicios);
      return { success: true, id: newServicio.id, servicio: { ...newServicio } };
    }
  } catch (e: any) {
    return { success: false, error: e.message || "Ocurrió un error al guardar el servicio." };
  }
}

export async function deleteServicioEmpresa(id: string): Promise<{ success: boolean; error?: string }> {
  let servicios = await readServiciosFile();
  const initialLength = servicios.length;
  servicios = servicios.filter(s => s.id !== id);
  
  if (servicios.length < initialLength) {
    try {
      await writeServiciosFile(servicios);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Ocurrió un error al eliminar el servicio (escritura)." };
    }
  } else {
    return { success: false, error: `Servicio con ID ${id} no encontrado para eliminar.` };
  }
}

async function initializeServiciosData() {
    await ensureDataDirectoryExists();
    try {
        await fs.access(serviciosFilePath);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log('Archivo servicios-empresa.json no encontrado, creando con datos iniciales...');
            try {
                await writeServiciosFile(initialServicios);
            } catch (initWriteError) {
                console.error("Error al crear el archivo de servicios inicial:", initWriteError);
            }
        }
    }
}

initializeServiciosData();

