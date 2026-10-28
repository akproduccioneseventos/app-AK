import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import DecoCatalogDrafts from '@/components/decoracion/DecoCatalogDrafts';
import { approveDecorationDraft, getDecorationDrafts, processNextDecorationDraft, retryDecorationDraft } from '@/app/actions/decoracion-catalogo';

jest.mock('@/app/actions/decoracion-catalogo', () => ({ getDecorationDrafts: jest.fn(), processNextDecorationDraft: jest.fn(), approveDecorationDraft: jest.fn(), dismissDecorationDraft: jest.fn(), retryDecorationDraft: jest.fn() }));
jest.mock('@/components/decoracion/DecoCanvas', () => ({ __esModule: true,
  default: ({ elementos, onChange, onSelectId }: { elementos: Array<Record<string, unknown>>; onChange: (value: unknown) => void; onSelectId: (id: string) => void }) => (
    <button onClick={() => { onChange(elementos.map(el => ({ ...el, x: 123 }))); onSelectId(String(elementos[0]?.id)); }}>Mover elemento</button>
  ),
}));
jest.mock('@/components/decoracion/DecoElementLibrary', () => ({ __esModule: true,
  default: ({ onAddElement, akOnly }: { onAddElement: (value: unknown) => void; akOnly: boolean }) => (
    <button data-ak-only={String(akOnly)} onClick={() => onAddElement({ id: 'library-1', tipo: 'flor', label: 'Flor', width: 72, height: 88 })}>Anadir elemento</button>
  ),
}));

const makeDraft = (status = 'review') => ({ id: 'draft', source: { id: 'photo', url: '/reference.jpg', title: 'Referencia AK' }, status,
  elementos: [{ id: 'el', tipo: 'flor', x: 10, y: 20, escala: 1, colores: ['#112233'], imageDataUri: 'data:image/png;base64,AA==' }],
  unknowns: ['Detalle por revisar'], revision: 4, error: status === 'error' ? 'Fallo de analisis' : undefined,
});
const get = getDecorationDrafts as jest.Mock;
const process = processNextDecorationDraft as jest.Mock;
const approve = approveDecorationDraft as jest.Mock;
let container: HTMLDivElement; let root: Root;
const tick = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); }); };
const click = async (label: string) => {
  const button = [...container.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label || b.textContent === label);
  if (!button) throw new Error(`Boton no encontrado: ${label}`);
  await act(async () => { button.click(); }); await tick();
};
const input = async (label: string, value: string) => {
  const el = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
  expect(el).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  });
};
beforeEach(() => {
  jest.clearAllMocks(); (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
  process.mockResolvedValue({ processed: false }); approve.mockResolvedValue({ success: true });
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const render = async (props = {}) => { await act(async () => root.render(<DecoCatalogDrafts {...props} />)); await tick(); };

test('empty queue never calls the provider', async () => {
  get.mockResolvedValue({ drafts: [], pending: 0, automatic: true }); await render();
  expect(container.textContent).toContain('No hay borradores pendientes'); expect(process).not.toHaveBeenCalled();
});
test('automatic queue is bounded to three and does not restart on rerenders', async () => {
  get.mockResolvedValue({ drafts: [makeDraft('queued')], pending: 1, automatic: true }); process.mockResolvedValue({ processed: true });
  await render(); await tick(); expect(process).toHaveBeenCalledTimes(3);
});
test('provider failure is visible and stops the queue', async () => {
  get.mockResolvedValue({ drafts: [makeDraft('queued')], pending: 1, automatic: true }); process.mockResolvedValue({ processed: false, error: 'Proveedor caido' });
  await render(); expect(container.querySelector('[role="alert"]')?.textContent).toBe('Proveedor caido'); expect(process).toHaveBeenCalledTimes(1);
});
test('real review controls pass moved position, PNG tint and scale to approval and reload templates', async () => {
  get.mockResolvedValue({ drafts: [makeDraft()], pending: 0, automatic: false }); const changed = jest.fn();
  await render({ onChanged: changed }); await click('Revisar Referencia AK'); await click('Mover elemento');
  await input('Escala del elemento seleccionado', '1.5'); await input('Color del elemento seleccionado', '#abcdef');
  await click('Anadir elemento'); await click('Aprobar plantilla');
  expect(approve).toHaveBeenCalledTimes(1); expect(approve.mock.calls[0][1]).toBe(4);
  expect(approve.mock.calls[0][3][0]).toMatchObject({ x: 123, escala: 1.5, tintColor: '#abcdef', tintOpacity: 0.45 });
  expect(approve.mock.calls[0][3][1]).toMatchObject({ width: 72, height: 88 }); expect(changed).toHaveBeenCalledTimes(1);
});
test('error proposals cannot be approved, and an uncertain retry needs a second explicit confirmation', async () => {
  get.mockResolvedValue({ drafts: [makeDraft('error')], pending: 0, automatic: false }); await render(); await click('Revisar Referencia AK');
  expect([...container.querySelectorAll('button')].some(b => b.textContent === 'Aprobar plantilla')).toBe(false);
  await click('Reintentar análisis'); expect(retryDecorationDraft).toHaveBeenCalledWith('draft');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('puede consumir otra IA');
  expect(process).not.toHaveBeenCalled(); expect(approve).not.toHaveBeenCalled();
});
