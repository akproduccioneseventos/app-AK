// Browser-only QA transport double. Never imported by the application.
const key = 'ak-758-fictional';
const initial = () => ({ status: 'queued', elements: [], name: '' });
const read = () => JSON.parse(localStorage.getItem(key) || JSON.stringify(initial()));
const write = (value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const element = { id: 'native-el', tipo: 'ak_deco_v2_AK-001', imageDataUri: '/media/decoracion-ak/ak-001.png', isCustom: true,
  x: 450, y: 275, escala: 1, width: 158, height: 160, colores: ['#ffffff'], tintColor: '#ff0000', tintOpacity: 0.25 };
export async function getDecorationDrafts() {
  const data = read();
  return { automatic: true, pending: data.status === 'queued' ? 1 : 0, drafts: data.status === 'approved' || data.status === 'dismissed' ? [] : [{
    id: 'fictional-native', source: { id: 'fictional', url: '/media/decoracion-ak/ak-001.png', title: 'Decoracion de prueba' },
    status: data.status, elementos: data.status === 'review' ? [element] : [], unknowns: ['Detalle por revisar'], revision: 2,
  }] };
}
export async function processNextDecorationDraft() { const data = read(); if (data.status !== 'queued') return { processed: false }; write({ ...data, status: 'review' }); return { processed: true }; }
export async function approveDecorationDraft(_id: string, _revision: number, name: string, elements: unknown) { write({ status: 'approved', name, elements }); return { success: true }; }
export async function dismissDecorationDraft() { write({ ...read(), status: 'dismissed' }); }
export async function retryDecorationDraft() { write({ ...read(), status: 'queued' }); }
export async function getDecoCanvasTemplates() { const data = read(); return data.status === 'approved' ? [{ id: 'catalog_deco_native', nombre: data.name, elementos: data.elements, fondoColor: '#f8f9fa', creadoEn: '2026-10-28T12:00:00Z' }] : []; }
export async function saveDecoCanvasTemplate() { return { success: false, error: 'Fuera del alcance de esta sonda' }; }
export async function deleteDecoCanvasTemplate() { write({ ...read(), status: 'dismissed' }); return { success: true }; }
