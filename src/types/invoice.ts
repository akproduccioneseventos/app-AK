import type { Customer } from './customer';

export type InvoiceStatus = 'Draft' | 'Sent' | 'Viewed' | 'Paid' | 'Overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
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
  vendorName?: string; // Extracted from receipt
  receiptImageUrl?: string; // Optional URL of the uploaded receipt
}
