import type { GaleriaFoto } from '@/types/galeria';

/**
 * Normaliza un texto de servicio quitando espacios extremos, mayúsculas y tildes
 * para poder comparar nombres de servicio de forma consistente.
 */
export function normalizarTextoServicio(valor?: string): string {
  return (valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Ordena las fotos de un servicio dejando primero las destacadas y luego por orden ascendente.
 */
export function ordenarFotosServicio(fotos: GaleriaFoto[]): GaleriaFoto[] {
  return [...fotos].sort(
    (a, b) => (b.destacada ? 1 : 0) - (a.destacada ? 1 : 0) || (a.orden ?? 0) - (b.orden ?? 0),
  );
}

/**
 * Filtra y ordena las fotos correspondientes a un servicio específico.
 * Busca primero por `servicioId` exacto y, si no hay coincidencias, cae al nombre
 * normalizado del campo `servicio`.
 */
export function filtrarFotosDelServicio(
  fotos: GaleriaFoto[],
  servicioId: string,
  servicioNombre?: string,
): GaleriaFoto[] {
  const idBuscado = (servicioId || '').trim();
  if (idBuscado) {
    const porId = fotos.filter((foto) => foto.servicioId === idBuscado);
    if (porId.length > 0) {
      return ordenarFotosServicio(porId);
    }
  }

  const nombreObjetivo = normalizarTextoServicio(servicioNombre);
  if (!nombreObjetivo) {
    return [];
  }

  const porNombre = fotos.filter(
    (foto) => normalizarTextoServicio(foto.servicio) === nombreObjetivo,
  );
  return ordenarFotosServicio(porNombre);
}
