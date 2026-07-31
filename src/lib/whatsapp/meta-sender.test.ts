import { sendMetaWhatsAppMessage } from './meta-sender';

describe('Meta WhatsApp sender', () => {
  const originalFetch = global.fetch;
  const originalVersion = process.env.META_GRAPH_API_VERSION;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalVersion === undefined) {
      delete process.env.META_GRAPH_API_VERSION;
    } else {
      process.env.META_GRAPH_API_VERSION = originalVersion;
    }
    jest.restoreAllMocks();
  });

  it('normalizes the recipient and returns the provider message id', async () => {
    process.env.META_GRAPH_API_VERSION = 'v99.0';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: 'wamid.123' }] }),
    }) as jest.Mock;

    const result = await sendMetaWhatsAppMessage({
      to: '+598 99 123 456',
      text: ' Hola ',
      apiToken: 'token',
      phoneNumberId: '123 456',
    });

    expect(result).toEqual({ success: true, messageId: 'wamid.123' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://graph.facebook.com/v99.0/123456/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: '59899123456',
          type: 'text',
          text: { body: 'Hola', preview_url: false },
        }),
      }),
    );
  });

  it('reports Meta rejection instead of claiming delivery', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid parameter' } }),
    }) as jest.Mock;

    await expect(sendMetaWhatsAppMessage({
      to: '59899123456',
      text: 'Hola',
      apiToken: 'token',
      phoneNumberId: '123456',
    })).resolves.toEqual({
      success: false,
      error: 'Meta rechazó el mensaje: Invalid parameter',
    });
  });

  it('rejects incomplete credentials and invalid recipients before fetching', async () => {
    global.fetch = jest.fn() as jest.Mock;

    await expect(sendMetaWhatsAppMessage({
      to: '123',
      text: 'Hola',
      apiToken: '',
      phoneNumberId: '',
    })).resolves.toEqual({
      success: false,
      error: 'Faltan el token de Meta o el Phone Number ID.',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
