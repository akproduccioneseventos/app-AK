/**
 * MercadoPago Integration
 * 
 * Permite crear preferencias de pago (links de pago) al instante
 * para cobrar señas de fiestas o recibir regalos de invitados.
 */

export interface PaymentItem {
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

export interface PaymentPreference {
  items: PaymentItem[];
  external_reference?: string;
  payer_email?: string;
}

export async function createPaymentPreference(preference: PaymentPreference): Promise<{ success: boolean; init_point?: string; error?: string }> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('[MercadoPago] No hay MERCADOPAGO_ACCESS_TOKEN configurado. Devolviendo link de prueba.');
    // Simulador para desarrollo
    return { 
      success: true, 
      init_point: 'https://sandbox.mercadopago.com.uy/checkout/v1/redirect?pref_id=demo' 
    };
  }

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: preference.items.map(item => ({
          ...item,
          currency_id: 'UYU' // Forzar pesos uruguayos por defecto
        })),
        payer: {
          email: preference.payer_email || 'invitado@akproducciones.com'
        },
        external_reference: preference.external_reference,
        back_urls: {
          success: 'https://akproducciones.uy/pago-exitoso',
          failure: 'https://akproducciones.uy/pago-fallido',
          pending: 'https://akproducciones.uy/pago-pendiente'
        },
        auto_return: 'approved'
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[MercadoPago] Error al crear preferencia:', errText);
      return { success: false, error: 'Error en la pasarela de pagos' };
    }

    const data = await res.json();
    return { success: true, init_point: data.init_point };

  } catch (err) {
    console.error('[MercadoPago] Excepción interna:', err);
    return { success: false, error: 'Excepción de red al contactar a MercadoPago' };
  }
}
