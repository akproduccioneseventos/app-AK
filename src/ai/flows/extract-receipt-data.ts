'use server';

export interface ExtractReceiptDataInput {
  receiptDataUri: string;
}

export interface ExtractReceiptDataOutput {
  vendor: string;
  date: string;
  amount: number;
}

export async function extractReceiptData(
  _input: ExtractReceiptDataInput
): Promise<ExtractReceiptDataOutput> {
  throw new Error('El módulo de extracción de recibos está temporalmente deshabilitado.');
}
