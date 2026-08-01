/**
 * Email Service Integration (Resend / Brevo)
 * 
 * Permite enviar correos electrónicos transaccionales (RSVP, Presupuestos)
 * de forma 100% gratuita usando la capa gratuita de Resend (hasta 3,000 al mes).
 */

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  fromName?: string;
}

export async function sendTransactionalEmail({ to, subject, html, fromName = 'AK Producciones' }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'info@akproducciones.com';

  if (!apiKey) {
    console.warn('[Email Service] No hay RESEND_API_KEY. Simulando envío de email a:', to);
    // Simular éxito en desarrollo sin credenciales
    return { success: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Email Service] Error de Resend:', errorText);
      return { success: false, error: 'Falló el envío de correo' };
    }

    return { success: true };
  } catch (err) {
    console.error('[Email Service] Error interno:', err);
    return { success: false, error: 'Excepción al conectar con servicio de correos' };
  }
}
