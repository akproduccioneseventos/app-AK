
export interface ServicioEmpresa {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria?: string; // Ej: Audiovisual, Decoración, Catering Interno
  precioEstimado?: number; // Puede ser un precio base o por hora/unidad
  unidad?: string; // Ej: por evento, por hora, por persona
  notas?: string;
}
