
export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  cost: string; // Se parseará a float para cálculos
}

export interface MenuItem { // Representa un Plato
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | '';
  ingredients: Ingredient[];
  totalDishCost: number;
}

export interface FullMenu { // Representa un Menú completo guardado
  id: string; // ej: 'menu_12345', 'menu_67890'
  name: string; // ej: 'Menú Clásico Casamiento'
  description: string; // Descripción general del menú
  items: MenuItem[]; // Lista de platos
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Para el formulario, antes de tener un ID de FullMenu
export type NewMenuFormData = Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>;
