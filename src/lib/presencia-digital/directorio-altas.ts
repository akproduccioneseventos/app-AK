import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import type { DirectorioItem, DirectorioAltasResumen } from '@/types/directorio-altas';

const DIRECTORIO_FILE = 'directorio-altas.json';

export const DIRECTORIOS_CANONICOS: Omit<DirectorioItem, 'completado' | 'completadoAt' | 'notas'>[] = [
  // 10 Gratuitos
  {
    id: 'google_business',
    nombre: 'Google Perfil de Empresa',
    tipo: 'gratis',
    url: 'https://business.google.com/',
    descripcion: 'Pesa 32% del posicionamiento en Salto. Ficha en Google Maps y búsquedas.',
  },
  {
    id: 'casamiento_uy',
    nombre: 'Casamiento.com.uy',
    tipo: 'gratis',
    url: 'https://www.casamiento.com.uy/',
    descripcion: 'Portal líder de bodas y fiestas en Uruguay con directorio de proveedores.',
  },
  {
    id: 'gallito',
    nombre: 'Gallito',
    tipo: 'gratis',
    url: 'https://clasificados.elpais.com.uy/servicios',
    descripcion: 'Clasificados de servicios de eventos y fiestas en El País Gallito Luis.',
  },
  {
    id: 'mercadolibre_servicios',
    nombre: 'Mercado Libre Servicios',
    tipo: 'gratis',
    url: 'https://servicios.mercadolibre.com.uy/fiestas-eventos/',
    descripcion: 'Publicación en el rubro Fiestas y Eventos en Mercado Libre Uruguay.',
  },
  {
    id: 'whatsapp_business_catalogo',
    nombre: 'WhatsApp Business con catálogo',
    tipo: 'gratis',
    url: 'https://business.whatsapp.com/',
    descripcion: 'Perfil de empresa con catálogo de servicios y paquetes cargados en el celular.',
  },
  {
    id: 'waze',
    nombre: 'Waze',
    tipo: 'gratis',
    url: 'https://www.waze.com/es-419/business',
    descripcion: 'Lugar de referencia y navegación en mapas de Waze para Salto.',
  },
  {
    id: 'foursquare',
    nombre: 'Foursquare',
    tipo: 'gratis',
    url: 'https://foursquare.com/',
    descripcion: 'Base de datos de lugares utilizada por Apple Maps, Uber y redes sociales.',
  },
  {
    id: 'guia_comercial_uy',
    nombre: 'Guía Comercial UY',
    tipo: 'gratis',
    url: 'https://www.guiacomercial.com.uy/',
    descripcion: 'Directorio nacional de comercios y profesionales en Uruguay.',
  },
  {
    id: 'evisos_salto',
    nombre: 'Evisos Salto',
    tipo: 'gratis',
    url: 'https://salto.evisos.com.uy/servicios/',
    descripcion: 'Directorio de avisos y servicios locales en el departamento de Salto.',
  },
  {
    id: 'yelu_uruguay',
    nombre: 'Yelu Uruguay',
    tipo: 'gratis',
    url: 'https://www.yelu.uy/',
    descripcion: 'Directorio de empresas y servicios profesionales de Uruguay.',
  },
  // 6 Pagos o con cuota
  {
    id: 'ccis_salto',
    nombre: 'Centro Comercial e Industrial de Salto',
    tipo: 'pago',
    url: 'https://ccisalto.com.uy/',
    descripcion: 'Gremial empresarial de Salto. Respaldo institucional y networking local.',
  },
  {
    id: 'camara_eventos_uy',
    nombre: 'Cámara de Eventos del Uruguay',
    tipo: 'pago',
    url: 'https://www.camaradeeventos.com.uy/',
    descripcion: 'Cámara oficial de proveedores y organizadores de eventos de Uruguay.',
  },
  {
    id: 'tufiesta',
    nombre: 'TuFiesta',
    tipo: 'pago',
    url: 'https://www.tufiesta.com.uy/',
    descripcion: 'Guía y catálogo online de salones, DJs y servicios de fiestas en Uruguay.',
  },
  {
    id: 'guia_movil_1122',
    nombre: 'Guía Móvil 1122',
    tipo: 'pago',
    url: 'https://www.1122.com.uy/',
    descripcion: 'Directorio telefónico y digital de empresas y servicios en todo el país.',
  },
  {
    id: 'revista_bodas_uy',
    nombre: 'Revista Bodas Uruguay',
    tipo: 'pago',
    url: 'https://www.bodas.com.uy/',
    descripcion: 'Publicación especializada y catálogo de bodas y 15 años en Uruguay.',
  },
  {
    id: 'salto_al_mundo',
    nombre: 'Salto Al Mundo',
    tipo: 'pago',
    url: 'https://www.saltoalmundo.com/',
    descripcion: 'Portal de noticias, comercio y empresas del departamento de Salto.',
  },
];

/**
 * Obtiene el listado completo de los 16 directorios con su estado guardado.
 */
export async function getDirectorioAltas(): Promise<DirectorioAltasResumen> {
  const guardados = await readData<DirectorioItem[]>(DIRECTORIO_FILE, []);
  const mapGuardados = new Map(guardados.map((g) => [g.id, g]));

  const items: DirectorioItem[] = DIRECTORIOS_CANONICOS.map((canonico) => {
    const actual = mapGuardados.get(canonico.id);
    return {
      ...canonico,
      completado: actual?.completado ?? false,
      completadoAt: actual?.completadoAt,
      notas: actual?.notas,
    };
  });

  const completados = items.filter((i) => i.completado).length;
  const total = items.length;
  const pendientes = total - completados;
  const porcentaje = Math.round((completados / total) * 100);

  return {
    items,
    total,
    completados,
    pendientes,
    porcentaje,
  };
}

/**
 * Actualiza el estado (completado/pendiente) de un directorio.
 */
export async function toggleDirectorioItemInternal(
  id: string,
  completado: boolean,
  notas?: string
): Promise<DirectorioAltasResumen> {
  const resumen = await getDirectorioAltas();
  const items = resumen.items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        completado,
        completadoAt: completado ? new Date().toISOString() : undefined,
        notas: notas !== undefined ? notas : item.notas,
      };
    }
    return item;
  });

  await writeData(DIRECTORIO_FILE, items);
  return getDirectorioAltas();
}
