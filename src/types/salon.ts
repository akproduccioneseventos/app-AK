import type { DecoracionData } from '@/types/fiesta';

export type SalonMetodoPago = 'Efectivo' | 'Transferencia' | 'Cheque' | 'Débito' | 'Otro';

export const SALON_METODOS_PAGO: SalonMetodoPago[] = [
  'Efectivo',
  'Transferencia',
  'Cheque',
  'Débito',
  'Otro',
];

export interface SalonPago {
  id: string;
  fecha: string;          // ISO date string
  monto: number;
  metodoPago: SalonMetodoPago;
  referencia?: string;    // Nro. de transferencia, nota, etc.
  comprobanteUrl?: string; // base64 or Storage URL of payment screenshot
  notas?: string;
  fiestaId?: string;      // optional link to a fiesta
  fiestaDesc?: string;    // display label for the fiesta
}

export interface SalonGerente {
  nombre?: string;
  whatsapp?: string;      // e.g. "+59899999999" (with country code)
  email?: string;
}

export interface Salon {
  id: string;
  nombre: string;
  direccion: string;
  googleMapsUrl: string;
  capacidad: number;
  descripcion?: string;
  fotos?: string[];
  salonLayout?: DecoracionData;
  esClubUruguay?: boolean;
  gerente?: SalonGerente;
  pagos?: SalonPago[];
}
