import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AsistenteDelCliente } from '@/components/portal/AsistenteDelCliente';

jest.mock('@/app/actions/asistente-virtual', () => ({ chatConAsistenteCliente: jest.fn() }));

class SocketLocal {
  static ultimo: SocketLocal;
  readyState = 1;
  cerrado = false;
  onopen: any;
  onmessage: any;
  onclose: any;
  onerror: any;
  enviados: any[] = [];
  constructor(public url: string) { SocketLocal.ultimo = this; }
  send(data: string) { this.enviados.push(JSON.parse(data)); }
  close() { this.cerrado = true; this.readyState = 3; }
  async recibir(data: any) { await this.onmessage?.({ data: JSON.stringify(data) }); }
}
class AudioLocal {
  sampleRate = 48000;
  currentTime = 0;
  destination = {};
  resume = async () => {};
  close = jest.fn();
  createMediaStreamSource() { return { connect() {} }; }
  createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null }; }
}

describe('QA712 PR1368: ciclo del componente real con transporte local', () => {
  let host: HTMLDivElement, root: Root;
  let fetchAnterior: any, wsAnterior: any, audioAnterior: any, mediaAnterior: PropertyDescriptor | undefined;
  let pararPista: jest.Mock, pedirMicrofono: jest.Mock;
  const respuesta = { ok: true, json: async () => ({ token: 'qa-local', model: 'qa-model', voz: 'Kore', segundosMaximos: 60 }) };
  const boton = (texto: string) => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === texto)!;
  const click = async (b: HTMLButtonElement) => { expect(b).toBeTruthy(); await act(async () => { b.click(); }); };

  beforeEach(async () => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    Element.prototype.scrollIntoView = jest.fn();
    fetchAnterior = global.fetch;
    wsAnterior = globalThis.WebSocket;
    audioAnterior = (globalThis as any).AudioContext;
    mediaAnterior = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    pararPista = jest.fn();
    pedirMicrofono = jest.fn(async () => ({ getTracks: () => [{ stop: pararPista }] }));
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: pedirMicrofono } });
    (globalThis as any).WebSocket = SocketLocal;
    (globalThis as any).AudioContext = AudioLocal;
    global.fetch = jest.fn(async (url: any) => {
      if (url !== '/api/asistente/voz-en-vivo/cliente') throw new Error('QA: egreso no permitido');
      return respuesta as any;
    });
    host = document.body.appendChild(document.createElement('div'));
    root = createRoot(host);
    await act(async () => { root.render(<AsistenteDelCliente fiestaId="qa712" nombreEvento="QA712" />); });
    await click(host.querySelector('button[aria-label="Abrir asistente de la fiesta"]')!);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    host.remove();
    global.fetch = fetchAnterior;
    (globalThis as any).WebSocket = wsAnterior;
    (globalThis as any).AudioContext = audioAnterior;
    if (mediaAnterior) Object.defineProperty(navigator, 'mediaDevices', mediaAnterior);
    else Reflect.deleteProperty(navigator, 'mediaDevices');
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  it('solo anuncia conexion tras setupComplete; transcribe y Cortar libera la pista/socket', async () => {
    await click(boton('Hablar'));
    expect(host.textContent).toContain('Conectando');
    expect(host.textContent).not.toContain('En llamada');
    await act(async () => { SocketLocal.ultimo.onopen(); });
    expect(host.textContent).not.toContain('En llamada');
    await act(async () => { await SocketLocal.ultimo.recibir({ setupComplete: {} }); });
    expect(host.textContent).toContain('En llamada');
    await act(async () => { await SocketLocal.ultimo.recibir({ serverContent: { inputTranscription: { text: 'Consulta QA712' } } }); });
    expect(host.textContent).toContain('Consulta QA712');
    await click(boton('Cortar'));
    expect(pararPista).toHaveBeenCalledTimes(1);
    expect(SocketLocal.ultimo.cerrado).toBe(true);
    expect(host.textContent).not.toContain('En llamada');
    expect(boton('Hablar')).toBeTruthy();
  });

  it('cerrar el panel cancela ficha pendiente y una respuesta tardia no abre microfono', async () => {
    let resolver: any, signal: AbortSignal;
    global.fetch = jest.fn((_url: any, init: any) => {
      signal = init.signal;
      return new Promise(r => { resolver = r; });
    }) as any;
    await click(boton('Hablar'));
    await click(host.querySelector('button[aria-label="Cerrar asistente"]')!);
    expect(signal!.aborted).toBe(true);
    await act(async () => { resolver(respuesta); });
    expect(pedirMicrofono).not.toHaveBeenCalled();
  });

  it('desmontar durante una llamada activa cierra recursos sin llamadas de herramientas', async () => {
    await click(boton('Hablar'));
    await act(async () => { await SocketLocal.ultimo.recibir({ setupComplete: {} }); });
    await act(async () => {
      await SocketLocal.ultimo.recibir({ toolCall: { functionCalls: [{ id: 'qa-call', name: 'crear_tarea', args: {} }] } });
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await act(async () => { root.render(<div />); });
    expect(pararPista).toHaveBeenCalledTimes(1);
    expect(SocketLocal.ultimo.cerrado).toBe(true);
  });
});
