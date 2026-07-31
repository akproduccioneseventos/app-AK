export interface GoogleWalletPassData {
  guestName: string;
  eventName: string;
  eventDate: string;
  tableNumber?: string;
  qrCodeValue: string;
}

/**
 * Builds a Google Wallet pass link payload for saving VIP event pass to Google Wallet.
 */
export function buildGoogleWalletPassUrl(data: GoogleWalletPassData): string {
  const payload = {
    iss: 'ak-producciones@appspot.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    payload: {
      eventTicketObjects: [
        {
          id: `ak_ticket_${Date.now()}`,
          classId: 'ak_producciones_event_vip',
          state: 'ACTIVE',
          ticketHolderName: data.guestName,
          ticketNumber: data.tableNumber ? `Mesa ${data.tableNumber}` : 'Pase VIP',
          barcode: {
            type: 'QR_CODE',
            value: data.qrCodeValue,
          },
        },
      ],
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(payload));
  return `https://pay.google.com/gp/v/save/${encoded}`;
}
