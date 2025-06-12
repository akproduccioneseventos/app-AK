
export interface ServicioEmpresa {
  id: string;
  nombre: string;
  categoria: 'Catering' | 'Bebidas' | 'Decoración' | 'Audiovisual' | 'Música' | 'Entretenimiento' | 'Estructuras' | 'Personal' | 'Logística' | 'Fotografía' | 'Filmación' | 'Repostería' | 'Iluminación' | 'Equipamiento' | 'Estilismo' | 'Impresión' | 'Merchandising' | 'Otros';
  descripcion?: string;
  precioEstimado?: number;
  unidad?: 'Por persona' | 'Por evento' | 'Por hora' | 'Global' | 'Por proyecto' | 'Por día/evento' | 'Por viaje' | 'Por unidad (variable)' | 'Por lote';
}
