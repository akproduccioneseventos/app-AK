
import type { Customer } from './customer';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentDate: string; // ISO date string
  amount: number;
  method?: 'Transferencia' | 'Efectivo' | 'Tarjeta' | 'Otro';
  notes?: string;
  receiptImageUrl?: string; // Optional URL of an uploaded receipt image for the payment
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: Customer;
  issueDate: string; // ISO date string
  dueDate: string; // ISO date string
  items: InvoiceItem[];
  subtotal: number;
  taxRate?: number; // Optional tax rate as a percentage (e.g., 21 for 21%)
  taxAmount?: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  currency: string; // e.g., 'USD', 'EUR'
  vendorName: string;
  vendorAddress?: string; // Address of the company issuing the invoice
  vendorTaxId?: string; // Tax ID of the company issuing the invoice
  payments?: Payment[]; // Array of payments made for this invoice
}
