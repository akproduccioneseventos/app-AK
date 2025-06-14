
export interface BudgetDisplaySettings {
  showClientData: boolean;
  showEventTypeAndDate: boolean;
  showPaymentMethodNotes: boolean; // Controls "Notas y Condiciones" visibility
  showPriceBreakdown: boolean; // Controls itemized list vs. just total
  showCompanyLogo: boolean;
}

export const defaultBudgetDisplaySettings: BudgetDisplaySettings = {
  showClientData: true,
  showEventTypeAndDate: true,
  showPaymentMethodNotes: true,
  showPriceBreakdown: true,
  showCompanyLogo: true,
};
