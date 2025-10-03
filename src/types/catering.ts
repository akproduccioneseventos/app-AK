
export interface Ingredient {
  id: string;
  name: string;
  quantityPerPerson: string; // Cantidad por persona para esta receta (ej: "100", "0.5")
  unit: string; // Unidad de la cantidad (ej: gr, ml, ud)
  cost: number; // Costo de ESA quantityPerPerson para ESTA receta
  proveedor?: string; // Nombre del proveedor (manual por ahora)
  marca?: string;
  fecha_actualizacion?: string; // ISO date string
  // preferredSupplierId?: string; // For future linking to a supplier entity
  // supplierNotes?: string; // Notes specific to sourcing this ingredient
}

export interface MenuItem { // Representa un Plato
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | 'Menú para niños y adolescentes' | ''; // Categoría del plato
  ingredients: Ingredient[];
  // totalDishCost is the cost of this dish FOR ONE PERSON, calculated from sum of its ingredient costs (which are per person)
  totalDishCost: number; 
  allergens?: string; // Texto simple para alérgenos, separados por coma
  notes?: string; // Para información adicional
  profitMargin?: number; // Porcentaje de ganancia (ej: 100 para 100%)
  suggestedSellingPrice?: number; // Precio de venta calculado
}

export interface FullMenu { // Representa un Menú completo guardado
  id: string; // ej: 'menu_12345', 'menu_67890'
  name: string; // ej: 'Menú Clásico Casamiento'
  description: string; // Descripción general del menú
  items: MenuItem[]; // Lista de platos
  templateType?: 'Personalizado' | 'Menú de Entradas' | 'Menú de Platos Principales' | 'Menú para Adolescente' | 'Menú para Niños' | 'Menu del personal'; // Tipo de plantilla/menu
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Para el formulario, antes de tener un ID de FullMenu
export type NewMenuFormData = Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>;



