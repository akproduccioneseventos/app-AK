
export interface BudgetDisplaySettings {
  showClientData: boolean;
  showEventTypeAndDate: boolean;
  showPaymentMethodNotes: boolean; // Controls "Notas y Condiciones" visibility
  showPriceBreakdown: boolean; // Controls itemized list vs. just total
  showCompanyLogo: boolean;
  annualAdjustmentPercentage?: number; // Porcentaje de ajuste anual
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
  connectedAt?: string; // ISO Date String of when the connection was established
  phoneNumber?: string; // Specifically for WhatsApp
}
