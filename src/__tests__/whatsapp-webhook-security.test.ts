import crypto from 'node:crypto';
import {
  verifyMetaWebhookSignature,
  verifyTwilioWebhookSignature,
} from '@/lib/whatsapp/webhook-security';

describe('WhatsApp webhook signatures', () => {
  it('accepts only a valid Meta HMAC signature', () => {
    const body = JSON.stringify({ object: 'whatsapp_business_account' });
    const secret = 'meta-app-secret';
    const signature = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

    expect(verifyMetaWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyMetaWebhookSignature(`${body}x`, signature, secret)).toBe(false);
  });

  it('validates Twilio form parameters independently of insertion order', () => {
    const authToken = 'twilio-auth-token';
    const url = 'https://akproducciones.uy/api/whatsapp/webhook';
    const params = new URLSearchParams({ Body: 'Hola', From: 'whatsapp:+59899111222' });
    const payload = `${url}BodyHolaFromwhatsapp:+59899111222`;
    const signature = crypto.createHmac('sha1', authToken).update(payload).digest('base64');

    expect(verifyTwilioWebhookSignature({ authToken, signature, url, params })).toBe(true);
    params.set('Body', 'Alterado');
    expect(verifyTwilioWebhookSignature({ authToken, signature, url, params })).toBe(false);
  });
});
