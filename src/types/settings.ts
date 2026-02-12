

export interface PromotionalDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface BudgetDisplaySettings {
  showClientData: boolean;
  showEventTypeAndDate: boolean;
  showPaymentMethodNotes: boolean; // Controls "Notas y Condiciones" visibility
  showCompanyLogo: boolean;
  showPriceBreakdown: boolean; // Controls detailed item pricing visibility
  annualAdjustmentPercentage?: number;
  promotionalDiscounts?: PromotionalDiscount[];
}

export const defaultBudgetDisplaySettings: BudgetDisplaySettings = {
  showClientData: true,
  showEventTypeAndDate: true,
  showPaymentMethodNotes: true,
  showCompanyLogo: true,
  showPriceBreakdown: true, // Default to true now
  annualAdjustmentPercentage: 15, // Default annual adjustment
  promotionalDiscounts: [],
};

export interface InvoiceTemplateSettings {
  logoUrl?: string | null; // Data URL o URL externa
  primaryColor: string;
  accentColor: string;
  logoPosition: 'left' | 'center' | 'right';
}

export const defaultInvoiceTemplateSettings: InvoiceTemplateSettings = {
  logoUrl: "https://placehold.co/150x60.png?text=Mi+Logo",
  primaryColor: "#EF4444", // App default red
  accentColor: "#F97316", // App default orange/accent
  logoPosition: 'left',
};

// Types for Social Media Connections
export type SocialPlatformName = 'Facebook' | 'Instagram' | 'TikTok' | 'WhatsApp';

export interface SocialConnection {
  platform: SocialPlatformName;
  isConnected: boolean;
  username?: string; // e.g. @yourhandle, or phone number
  profileUrl?: string; // The actual URL to the profile
  logoUrl?: string; // URL for the custom uploaded logo
  connectedAt?: string; // ISO Date String of when the connection was established
  phoneNumber?: string; // Specifically for WhatsApp
}

export interface CompanyInfo {
    companyName: string;
    companyAddress: string;
    companyTaxId: string;
    companyContact: string;
    defaultDocumentNotes: string;
    invoiceCustomFooter: string;
}

export const defaultCompanyInfo: CompanyInfo = {
    companyName: "AK Producciones",
    companyAddress: "Salto, Uruguay",
    companyTaxId: "RUT Ejemplo 123456789012",
    companyContact: "akproduccionessalto@gmail.com",
    defaultDocumentNotes: "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.",
    invoiceCustomFooter: "Información de pago: Banco X, Cuenta Y, Titular Z.\nConsulte por otros métodos de pago.",
};
