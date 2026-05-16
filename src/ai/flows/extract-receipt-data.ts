'use server';

export interface ExtractReceiptDataInput {
  receiptDataUri: string;
}

export interface ExtractReceiptDataOutput {
  vendor: string;
  date: string;
  amount: number;
  confidence: 'alta' | 'media' | 'baja';
  notes: string;
}

function decodePossibleText(dataUri: string) {
  const [, payload = ''] = dataUri.split(',');
  if (!payload) return '';
  try {
    return Buffer.from(payload, dataUri.includes(';base64') ? 'base64' : 'utf8').toString('utf8');
  } catch {
    return '';
  }
}

function parseAmount(text: string) {
  const amountLine = text
    .split(/\r?\n/)
    .find((line) => /(total|importe|monto|saldo)/i.test(line));
  const source = amountLine || text.replace(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g, '');
  const matches = [...source.matchAll(/\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})|[0-9]+(?:[.,][0-9]{2})?)/gi)];
  const values = matches
    .map((match) => Number(match[1].replace(/\./g, '').replace(',', '.')))
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : 0;
}

function parseDate(text: string) {
  const dateMatch = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!dateMatch) return new Date().toISOString().slice(0, 10);
  const [, day, month, yearRaw] = dateMatch;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseVendor(text: string) {
  const firstMeaningfulLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length >= 3 && !/ticket|recibo|factura/i.test(line));
  return firstMeaningfulLine || 'Proveedor sin identificar';
}

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  const text = decodePossibleText(input.receiptDataUri);
  const amount = parseAmount(text);
  const vendor = parseVendor(text);
  const date = parseDate(text);
  const confidence = text && amount > 0 ? 'media' : 'baja';

  return {
    vendor,
    date,
    amount,
    confidence,
    notes:
      confidence === 'media'
        ? 'Extraccion automatica basica realizada. Revisar antes de guardar.'
        : 'No se pudo leer texto confiable del comprobante. Completar o corregir manualmente.',
  };
}
