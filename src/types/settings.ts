export interface PromotionalDiscount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface BudgetDisplaySettings {
  showClientData: boolean;
  showEventTypeAndDate: boolean;
  showPaymentMethodNotes: boolean;
  showCompanyLogo: boolean;
  showPriceBreakdown: boolean;
  annualAdjustmentPercentage?: number;
  promotionalDiscounts?: PromotionalDiscount[];
  // Campos Estratégicos de Venta
  successMessage?: string; // El mensaje persuasivo después de "Presupuesto Listo"
  bookingTerms?: string; // El texto de la seña/reserva
  whatsappMessageTemplate?: string; // Lo que se envía por WA
  valuePropositions?: string[]; // Beneficios tipo "Por qué elegirnos"
}

export const defaultBudgetDisplaySettings: BudgetDisplaySettings = {
  showClientData: true,
  showEventTypeAndDate: true,
  showPaymentMethodNotes: true,
  showCompanyLogo: true,
  showPriceBreakdown: true,
  annualAdjustmentPercentage: 15,
  promotionalDiscounts: [],
  successMessage: "Ahora podés coordinar una reunión con nuestro equipo para revisar todos los detalles, despejar dudas y asegurar tu fecha.",
  bookingTerms: "Para confirmar la promoción y reservar todos los servicios, se requiere una seña de $5.000. El presupuesto es válido por 30 días.",
  whatsappMessageTemplate: "Hola, ya generé un presupuesto para mi evento y me gustaría coordinar una reunión para revisar detalles, despejar dudas y confirmar disponibilidad.",
  valuePropositions: [
    "Equipamiento profesional de alta gama",
    "Personal capacitado y con amplia experiencia",
    "Flexibilidad absoluta en la planificación",
    "Garantía de satisfacción y puntualidad"
  ]
};

export interface InvoiceTemplateSettings {
  logoUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  logoPosition: 'left' | 'center' | 'right';
}

export const defaultInvoiceTemplateSettings: InvoiceTemplateSettings = {
  logoUrl: "https://placehold.co/150x60.png?text=Mi+Logo",
  primaryColor: "#EF4444",
  accentColor: "#F97316",
  logoPosition: 'left',
};

export type SocialPlatformName = 'Facebook' | 'Instagram' | 'TikTok' | 'WhatsApp';

export interface SocialConnection {
  platform: SocialPlatformName;
  isConnected: boolean;
  username?: string;
  profileUrl?: string;
  logoUrl?: string;
  connectedAt?: string;
  phoneNumber?: string;
}

export interface CompanyInfo {
    companyName: string;
    companyAddress: string;
    companyTaxId: string;
    companyContact: string;
    defaultDocumentNotes: string;
    invoiceCustomFooter: string;
    signatureUrl?: string | null;
}

export const defaultCompanyInfo: CompanyInfo = {
    companyName: "AK Producciones",
    companyAddress: "Salto, Uruguay",
    companyTaxId: "RUT Ejemplo 123456789012",
    companyContact: "akproduccionessalto@gmail.com",
    defaultDocumentNotes: "El presupuesto es válido por 30 días. Para asegurar el presupuesto debe abonar el 20% del total como seña.",
    invoiceCustomFooter: "Información de pago: Banco X, Cuenta Y, Titular Z.\nConsulte por otros métodos de pago.",
    signatureUrl: null,
};
