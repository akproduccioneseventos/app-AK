
export interface Ingredient {
  id: string;
  origenId?: string; // Link to the 'ServicioEmpresa' item ID in the main catalog
  name: string;
  quantityPerPerson: string; // Cantidad por persona para esta receta (ej: "100", "0.5")
  unit: string; // Unidad de la cantidad (ej: g, ml, ud)
  // COSTO BASE DEL INSUMO
  costoUnitario: number; // Costo por la unidad de compra (ej: $180 por KG, $500 por LT)
  // COSTO CALCULADO PARA LA RECETA
  costoTotalReceta: number; // Costo de ESA quantityPerPerson para ESTA receta (ej: (40g/1000) * $180/kg = $7.2)
  proveedor?: string;
  marca?: string;
  fecha_actualizacion?: string; // ISO date string
}

export interface MenuItem { // Representa un Plato
  id: string;
  name: string;
  type: 'Entrada' | 'Plato Principal' | 'Postre' | 'Bebida' | 'Menú Infantil' | 'Menú Infantil/Adolescente' | ''; // Categoría del plato
  ingredients: Ingredient[];
  // totalDishCost es el costo de este plato PARA UNA PERSONA, calculado de la suma de costoTotalReceta de sus ingredientes
  totalDishCost: number; 
  allergens?: string;
  notes?: string;
  profitMargin?: number; // Porcentaje de ganancia (ej: 100 para 100%)
  suggestedSellingPrice?: number; // Precio de venta calculado
}

export interface FullMenu { // Representa un Menú completo guardado
  id: string; // ej: 'menu_12345', 'menu_67890'
  name: string; // ej: 'Menú Clásico Casamiento'
  description: string; // Descripción general del menú
  items: MenuItem[]; // Lista de platos
  templateType?: 'Personalizado' | 'Menú de Entradas' | 'Menú de Platos Principales' | 'Menú para Adolescente' | 'Menú Infantil' | 'Menú del personal'; // Tipo de plantilla/menu
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Para el formulario, antes de tener un ID de FullMenu
export type NewMenuFormData = Omit<FullMenu, 'id' | 'createdAt' | 'updatedAt'>;


