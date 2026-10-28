import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { iniciarVozEnVivo } from '@/lib/asistente/sesion-voz-en-vivo';
import { AsistenteDelCliente } from '@/components/portal/AsistenteDelCliente';

jest.mock('@/app/actions/asistente-virtual', () => ({
  chatConAsistenteCliente: jest.fn(),
}));

class FakeSocket {
  static ultimo: FakeSocket;
  readyState = 1;
  enviados: any[] = [];
  cerrado = false;
  onopen: any;
  onmessage: any;
  onclose: any;
  onerror: any;
  constructor(public url: string) {
    FakeSocket.ultimo = this;
  }
  send(d: string) {
    this.enviados.push(JSON.parse(d));
  }
  close() {
    this.cerrado = true;
    this.readyState = 3;
  }
  async recibir(obj: any) {
    await this.onmessage?.({ data: JSON.stringify(obj) });
  }
}

class FakeAudioContext {
  sampleRate = 48000;
  currentTime = 0;
  destination = {};
  resume = async () => {};
  close = () => {};
  createMediaStreamSource() {
    return { connect() {} };
  }
  createScriptProcessor() {
    return { connect() {}, disconnect() {}, onaudioprocess: null as any };
  }
  createBuffer(_c: number, largo: number, rate: number) {
    return { duration: largo / rate, getChannelData: () => new Float32Array(largo) };
  }
  createBufferSource() {
    return {
      connect() {},
      start() {},
      stop() {},
      onended: null,
    };
  }
}

const microfonoFalso = async () => ({
  getTracks: () => [{ stop: () => {} }],
}) as any;

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Element.prototype.scrollIntoView = jest.fn();
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

describe('La voz del cliente habla de verdad (Orden 238)', () => {
  it('(a) con urlFicha del cliente, el pedido va a /api/asistente/voz-en-vivo/cliente', async () => {
    let urlLlamada = '';
    let cuerpoLlamado = '';
    const fakeFetch = jest.fn(async (url: any, init: any) => {
      urlLlamada = String(url);
      cuerpoLlamado = String(init?.body || '');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          token: 'token-cliente-123',
          model: 'gemini-3.8-live',
          voz: 'Kore',
          segundosMaximos: 60,
        }),
      };
    });

    const piezas = {
      fetchFn: fakeFetch as any,
      WebSocketCtor: FakeSocket,
      AudioContextCtor: FakeAudioContext,
      getUserMedia: microfonoFalso,
      setTimeoutFn: (() => 1) as any,
      clearTimeoutFn: (() => {}) as any,
    };

    await iniciarVozEnVivo({
      urlFicha: '/api/asistente/voz-en-vivo/cliente',
      cuerpoFicha: { fiestaId: 'fiesta-abc' },
      piezas,
    });

    expect(urlLlamada).toBe('/api/asistente/voz-en-vivo/cliente');
    expect(cuerpoLlamado).toBe(JSON.stringify({ fiestaId: 'fiesta-abc' }));
    expect(FakeSocket.ultimo).toBeDefined();
    expect(FakeSocket.ultimo.url).toContain('access_token=token-cliente-123');
  });

  it('(b) con sinHerramientas, un pedido de herramienta del modelo no llama a /accion', async () => {
    const rutasLlamadas: string[] = [];
    const fakeFetch = jest.fn(async (url: any) => {
      rutasLlamadas.push(String(url));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          wsUrl: 'wss://ejemplo.com/socket',
          model: 'gemini-3.8-live',
          voz: 'Kore',
          segundosMaximos: 60,
        }),
      };
    });

    const piezas = {
      fetchFn: fakeFetch as any,
      WebSocketCtor: FakeSocket,
      AudioContextCtor: FakeAudioContext,
      getUserMedia: microfonoFalso,
      setTimeoutFn: (() => 1) as any,
      clearTimeoutFn: (() => {}) as any,
    };

    await iniciarVozEnVivo({
      urlFicha: '/api/asistente/voz-en-vivo/cliente',
      sinHerramientas: true,
      piezas,
    });

    expect(FakeSocket.ultimo).toBeDefined();
    FakeSocket.ultimo.onopen?.();

    await FakeSocket.ultimo.recibir({
      toolCall: {
        functionCalls: [
          {
            id: 'call_456',
            name: 'crear_tarea',
            args: { titulo: 'Tarea de prueba' },
          },
        ],
      },
    });

    // Comprobamos que no se haya llamado a /accion
    expect(rutasLlamadas).not.toContain('/api/asistente/voz-en-vivo/accion');
    const llamadasAccion = rutasLlamadas.filter((r) => r.includes('/accion'));
    expect(llamadasAccion).toHaveLength(0);

    // Y que por el socket se contestó 'no disponible en esta llamada'
    const toolResponses = FakeSocket.ultimo.enviados.filter((m) => m.toolResponse);
    expect(toolResponses).toHaveLength(1);
    expect(toolResponses[0].toolResponse.functionResponses[0]).toEqual({
      id: 'call_456',
      name: 'crear_tarea',
      response: { output: 'no disponible en esta llamada' },
    });
  });

  it('(c) sin opciones, la voz del equipo sigue pidiendo a /api/asistente/voz-en-vivo', async () => {
    const rutasLlamadas: string[] = [];
    const fakeFetch = jest.fn(async (url: any) => {
      rutasLlamadas.push(String(url));
      if (String(url).includes('/accion')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, mensaje: 'Tarea creada' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          wsUrl: 'wss://ejemplo.com/socket-equipo',
          model: 'gemini-3.8-live',
          voz: 'Kore',
          segundosMaximos: 120,
        }),
      };
    });

    const piezas = {
      fetchFn: fakeFetch as any,
      WebSocketCtor: FakeSocket,
      AudioContextCtor: FakeAudioContext,
      getUserMedia: microfonoFalso,
      setTimeoutFn: (() => 1) as any,
      clearTimeoutFn: (() => {}) as any,
    };

    await iniciarVozEnVivo({
      piezas,
    });

    expect(rutasLlamadas[0]).toBe('/api/asistente/voz-en-vivo');
    expect(FakeSocket.ultimo).toBeDefined();
    FakeSocket.ultimo.onopen?.();

    await FakeSocket.ultimo.recibir({
      toolCall: {
        functionCalls: [
          {
            id: 'call_789',
            name: 'crear_tarea',
            args: { titulo: 'Tarea del equipo' },
          },
        ],
      },
    });

    // En la voz del equipo (sin sinHerramientas), sí llama a /accion
    expect(rutasLlamadas).toContain('/api/asistente/voz-en-vivo/accion');
  });

  it('(d) en el componente, "En llamada" no aparece antes del estado conectado, y con la ficha rechazada (429, el tope) se muestra el mensaje del servidor', async () => {
    const mensajeTope = 'Alcanzaste el tope de 5 minutos de voz de hoy para tu fiesta. Podés seguir conversando por el chat escrito.';

    // Mockeamos fetch para simular 429 en el portal
    const fetchOriginal = global.fetch;
    const mockFetch = jest.fn(async (url: any) => {
      if (String(url).includes('/api/asistente/voz-en-vivo/cliente')) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: mensajeTope }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    global.fetch = mockFetch as any;

    // Aseguramos que existan las APIs de navegador en jsdom
    const originalWS = (globalThis as any).WebSocket;
    const originalAC = (globalThis as any).AudioContext;
    (globalThis as any).WebSocket = FakeSocket;
    (globalThis as any).AudioContext = FakeAudioContext;
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: microfonoFalso },
      });
    } else {
      navigator.mediaDevices.getUserMedia = microfonoFalso;
    }

    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    try {
      await act(async () => {
        root.render(React.createElement(AsistenteDelCliente, { fiestaId: 'fiesta-e2e-429', nombreEvento: 'Mi Fiesta' }));
      });

      // 1. Abrimos el asistente
      const botonAbrir = host.querySelector('button[aria-label="Abrir asistente de la fiesta"]') as HTMLButtonElement;
      expect(botonAbrir).toBeTruthy();
      await act(async () => {
        botonAbrir.click();
      });

      // 2. Antes de hablar, "En llamada" no aparece
      expect(host.textContent).not.toContain('En llamada');

      // 3. Tocamos "Hablar"
      const botonHablar = Array.from(host.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Hablar')
      );
      expect(botonHablar).toBeTruthy();

      await act(async () => {
        botonHablar!.click();
      });

      // Esperamos resolución de promesas
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          await Promise.resolve();
        });
      }

      // 4. "En llamada" NUNCA apareció porque fue rechazada con 429
      expect(host.textContent).not.toContain('En llamada');

      // 5. El mensaje del servidor (tope 429) aparece en el chat
      expect(host.textContent).toContain(mensajeTope);
    } finally {
      await act(async () => {
        root.unmount();
      });
      host.remove();
      global.fetch = fetchOriginal;
      (globalThis as any).WebSocket = originalWS;
      (globalThis as any).AudioContext = originalAC;
    }
  });
});

