/**
 * PREGUNTA 59 (formulario que se vuelve a abrir sucio) y PREGUNTA 60 (nombres largos en celular).
 *
 * Pantallas tocadas: `/aprobaciones` (59 y 60), `/eventos` (59: el dialogo "Crear evento" ya no se
 * cierra ni suelta al cliente si la creacion falla; se comprueba en el codigo porque la pantalla
 * es muy grande para armarla aca), `/empresa/salones`, `/empresa/servicios` y `/pagos-rapidos`
 * (60: titulo que se parte en vez de empujar los botones).
 *
 * Lo unico que jsdom puede ver de la pregunta 60 es que el titulo lleve las clases de contencion
 * (`break-words`, `[overflow-wrap:anywhere]`) y su contenedor `min-w-0`; el desborde real depende
 * del navegador.
 *
 * Se probo rompiendolo: sacando el reinicio del formulario en el exito, o las clases del titulo,
 * las pruebas correspondientes se ponen en rojo.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('fiestaId=fiesta_77') }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
const mockGet = jest.fn();
const mockCreate = jest.fn();
jest.mock('@/app/actions/approvals', () => ({
  getAprobaciones: (...a: unknown[]) => mockGet(...a),
  createAprobacion: (...a: unknown[]) => mockCreate(...a),
  aprobarCambio: jest.fn(),
  rechazarCambio: jest.fn(),
}));

const NOMBRE_LARGO = 'A'.repeat(80);
let host: HTMLElement;
let root: ReturnType<typeof createRoot>;

async function esperar() { await act(async () => { await Promise.resolve(); }); }
const porPlaceholder = (p: string) => document.body.querySelector(`[placeholder="${p}"]`) as HTMLInputElement | HTMLTextAreaElement;
const boton = (t: string) => Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes(t)) as HTMLButtonElement;
async function escribir(el: HTMLInputElement | HTMLTextAreaElement, valor: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  await act(async () => { setter.call(el, valor); el.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function click(b: HTMLButtonElement) { await act(async () => { b.click(); }); await esperar(); }
async function abrirNueva() {
  await click(boton('Nueva Solicitud'));
  expect(porPlaceholder('Describí el cambio solicitado...')).not.toBeNull();
}
async function completar() {
  await escribir(porPlaceholder('Describí el cambio solicitado...'), 'Subir el precio del DJ');
  await escribir(porPlaceholder('Valor actual'), '100');
  await escribir(porPlaceholder('Valor propuesto'), '120');
  await escribir(porPlaceholder('Describí el impacto operativo...'), 'Mas caro');
  await escribir(porPlaceholder('Nombre o usuario'), 'Marta');
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  mockGet.mockResolvedValue([{
    id: 'a1', fiestaId: 'fiesta_77', tipoCambio: 'otro', descripcion: NOMBRE_LARGO, valorAntes: '', valorDespues: '',
    impactoEconomico: 0, impactoOperativo: '', solicitadoPor: 'Marta', solicitadoEn: '2026-10-01T00:00:00.000Z',
    estadoAprobacion: 'Pendiente', version: 1,
  }]);
  const Page = require('@/app/(app)/aprobaciones/page').default;
  host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  await esperar();
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.body.innerHTML = ''; jest.restoreAllMocks(); });

describe('Pregunta 59: /aprobaciones se reabre limpia', () => {
  it('guardar bien y volver a abrir: todos los campos vacios, el evento sigue', async () => {
    mockCreate.mockResolvedValue({ success: true });
    await abrirNueva();
    await completar();
    await click(boton('Crear Solicitud'));
    expect(mockCreate).toHaveBeenCalledTimes(1);
    await abrirNueva();
    expect(porPlaceholder('Describí el cambio solicitado...').value).toBe('');
    expect(porPlaceholder('Valor actual').value).toBe('');
    expect(porPlaceholder('Valor propuesto').value).toBe('');
    expect(porPlaceholder('Describí el impacto operativo...').value).toBe('');
    expect(porPlaceholder('Nombre o usuario').value).toBe('');
    expect(porPlaceholder('ej: fiesta_1234567890').value).toBe('fiesta_77');
  });

  it('si el guardado falla, lo escrito se conserva para reintentar', async () => {
    mockCreate.mockResolvedValue({ success: false, error: 'sin senal' });
    await abrirNueva();
    await completar();
    await click(boton('Crear Solicitud'));
    expect(porPlaceholder('Describí el cambio solicitado...').value).toBe('Subir el precio del DJ');
    expect(porPlaceholder('Nombre o usuario').value).toBe('Marta');
  });
});

describe('Pregunta 60: nombres largos en celular', () => {
  it('/aprobaciones: el titulo se parte en cualquier lado y su contenedor puede achicarse', () => {
    const titulo = document.body.querySelector('[data-testid="titulo-aprobacion"]') as HTMLElement;
    expect(titulo.textContent).toBe(NOMBRE_LARGO);
    expect(titulo.className).toContain('break-words');
    expect(titulo.className).toContain('[overflow-wrap:anywhere]');
    expect(titulo.className).not.toContain('truncate');
    expect(titulo.parentElement!.parentElement!.className).toContain('min-w-0');
    expect(boton('Aprobar')).toBeTruthy();
  });

  const leer = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf-8');
  it.each([
    ['empresa/salones/page.tsx', 'titulo-salon'],
    ['empresa/servicios/page.tsx', 'titulo-servicio'],
    ['pagos-rapidos/page.tsx', 'titulo-cliente-pago'],
  ])('/%s: el titulo lleva las clases de contencion', (archivo, id) => {
    const codigo = leer('src', 'app', '(app)', ...archivo.split('/'));
    const i = codigo.indexOf(`data-testid="${id}"`);
    expect(i).toBeGreaterThan(-1);
    const etiqueta = codigo.slice(codigo.lastIndexOf('<CardTitle', i), i);
    expect(etiqueta).toContain('break-words [overflow-wrap:anywhere]');
    expect(etiqueta).not.toContain('truncate');
    // El contenedor del titulo puede achicarse (min-w-0) en las tres.
    expect(codigo.slice(Math.max(0, codigo.lastIndexOf('<div', codigo.lastIndexOf('<CardTitle', i)) ), i)).toContain('min-w-0');
  });
});

describe('Pregunta 59: /eventos no cierra el dialogo si la creacion falla', () => {
  it('handleReset avisa si salio bien y el dialogo se cierra solo en ese caso', () => {
    const codigo = fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(app)', 'eventos', 'page.tsx'), 'utf-8');
    expect(codigo).toContain('const handleReset = async (clienteId?: string, clienteNombre?: string): Promise<boolean>');
    expect((codigo.match(/if \(salioBien\) \{\s*setIsCreateDialogOpen\(false\);\s*setSelectedCustomerId\(null\);/g) || []).length).toBe(2);
    expect(codigo).not.toMatch(/setIsCreateDialogOpen\(false\);\s*await handleReset/);
  });
});
