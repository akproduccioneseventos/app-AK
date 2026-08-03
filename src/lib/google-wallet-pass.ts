/**
 * Google Wallet VIP Event Pass â€” placeholder module.
 *
 * IMPORTANT: Google Wallet passes require a JWT signed with a Google Cloud
 * Service Account private key (RSA-SHA256). This module builds the pass payload
 * and returns a placeholder URL. Full production integration requires:
 *   1. A Google Cloud project with the Wallet API enabled
 *   2. A Service Account key (GOOGLE_WALLET_PRIVATE_KEY env var)
 *   3. Creating the EventTicketClass via the REST API first
 *
 * For now, this generates the pass data structure ready to be signed.
 */

export interface GoogleWalletPassData {
  guestName: string;
  eventName: string;
  eventDate: string;
  tableNumber?: string;
  qrCodeValue: string;
}

export interface GoogleWalletPayload {
  ticketHolderName: string;
  ticketNumber: string;
  eventName: string;
  eventDate: string;
  barcode: {
    type: 'QR_CODE';
    value: string;
  };
}

/**
 * Builds the Google Wallet pass payload (unsigned).
 * Returns the structured data â€” signing must be done server-side with
 * the Service Account private key before generating a save URL.
 */
export function buildGoogleWalletPassPayload(data: GoogleWalletPassData): GoogleWalletPayload {
  return {
    ticketHolderName: data.guestName,
    ticketNumber: data.tableNumber ? `Mesa ${data.tableNumber}` : 'Pase VIP',
    eventName: data.eventName,
    eventDate: data.eventDate,
    barcode: {
      type: 'QR_CODE',
      value: data.qrCodeValue,
    },
  };
}
