
import type { Customer } from './customer';

// Kept current statuses as they relate more to payment/interaction lifecycle
// 'Emitida', 'Impresa' are harder to track systemically for now.
export type InvoiceStatus = 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue';

export interface InvoiceItem {
  id: string; // Will be generated on save for new items
  description: string;
  quantity: number;
  unitPrice: number;
  total: number; // quantity * unitPrice
}

export interface Payment {
  id: string;
  paymentDate: string; // ISO date string
  amount: number;
  method?: 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Otro';
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer; // Embeds the full customer object
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number; // e.g., 21 for 21%
  taxAmount?: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  currency: string; // e.g., 'UYU', 'USD'
  vendorName: string;
  vendorAddress?: string;
  vendorTaxId?: string;
  payments?: Payment[];
}

