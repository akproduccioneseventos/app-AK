
export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  cost: number;
}

export interface MenuItem { // Representa un Plato
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | ''; // Categoría del plato
  ingredients: Ingredient[];
  totalDishCost: number; // Costo total de ingredientes para las porciones base
  basePortions?: number; // Cantidad de porciones base que rinde la receta
  costPerPortion?: number; // Calculado: totalDishCost / basePortions (opcional, puede ser calculado en UI)
  allergens?: string; // Texto simple para alérgenos, separados por coma
  notes?: string; // Para información adicional como precio sugerido, observaciones, etc.
}

export interface FullMenu { // Representa un Menú completo guardado
  id: string; // ej: 'menu_12345', 'menu_67890'
  name: string; // ej: 'Menú Clásico Casamiento'
  description: string; // Descripción general del menú
  items: MenuItem[]; // Lista de platos
  templateType?: 'Económico' | 'Premium' | 'Infantil' | 'Personalizado'; // Tipo de plantilla
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Para el formulario, antes de tener un ID de FullMenu
export type NewMenuFormData = Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>;
