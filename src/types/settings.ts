
export interface BudgetDisplaySettings {
  showClientData: boolean;
  showEventTypeAndDate: boolean;
  showPaymentMethodNotes: boolean; // Controls "Notas y Condiciones" visibility
  showPriceBreakdown: boolean; // Controls itemized list vs. just total
  showCompanyLogo: boolean;
  annualAdjustmentPercentage?: number; // Nuevo campo para ajuste anual
  // Placeholder para futura implementación de descuentos
  promotionalDiscounts?: Array<{ 
    name: string; 
    type: 'percentage' | 'fixed'; 
    value: number; 
    isActive: boolean 
  }>;
}

export const defaultBudgetDisplaySettings: BudgetDisplaySettings = {
  showClientData: true,
  showEventTypeAndDate: true,
  showPaymentMethodNotes: true,
  showPriceBreakdown: true,
  showCompanyLogo: true,
  annualAdjustmentPercentage: 0, // Por defecto 0%
  promotionalDiscounts: [],
};
