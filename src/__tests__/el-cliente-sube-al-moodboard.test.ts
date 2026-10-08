/**
 * El cliente sube una idea al moodboard desde su portal (8/10/2026).
 *
 * La subida pedía sesión del equipo, así que el botón de "¿Tienes una idea?" del portal
 * siempre fallaba con "Sesion no autorizada". Ahora pasa también el cliente, pero sólo con la
 * sesión de SU fiesta, una imagen y hasta 10 MB.
 */
const mockUpload = jest.fn();
const mockHasApp = jest.fn();
const mockPortal = jest.fn();

jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: (...a: unknown[]) => mockUpload(...a) }));
jest.mock('@/lib/auth/require-session', () => ({ hasAppSession: () => mockHasApp() }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: (id: string) => mockPortal(id) }));

import { uploadPublicPageAsset } from '@/app/actions/fiesta/assets.actions';

function formulario(folder: string, tipo = 'image/png', bytes = 10) {
  const fd = new FormData();
  fd.append('folder', folder);
  const archivo = new File([new Uint8Array(1)], 'idea.png', { type: tipo });
  // El File de jsdom no trae arrayBuffer ni deja fijar el peso: se completan a mano.
  Object.defineProperty(archivo, 'size', { value: bytes });
  Object.defineProperty(archivo, 'arrayBuffer', { value: async () => new ArrayBuffer(1) });
  fd.append('file', archivo);
  return fd;
}

describe('Subida de archivos públicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpload.mockResolvedValue('https://cdn/idea.png');
    mockHasApp.mockResolvedValue(false);
    mockPortal.mockResolvedValue(false);
  });

  it('el equipo sube a cualquier carpeta', async () => {
    mockHasApp.mockResolvedValue(true);
    const r = await uploadPublicPageAsset(formulario('empleados-9', 'application/pdf'));
    expect(r.success).toBe(true);
    expect(mockUpload.mock.calls[0][1]).toMatch(/^public-page-assets\/empleados-9\//);
  });

  it('el cliente sube a la carpeta de SU fiesta', async () => {
    mockPortal.mockImplementation(async (id: string) => id === 'fiesta-A');
    const r = await uploadPublicPageAsset(formulario('fiesta-A'));
    expect(r.success).toBe(true);
    expect(mockUpload.mock.calls[0][1]).toMatch(/^public-page-assets\/fiesta-A\//);
  });

  it('la sesión del portal de la fiesta A no sube a la carpeta de la fiesta B', async () => {
    mockPortal.mockImplementation(async (id: string) => id === 'fiesta-A');
    await expect(uploadPublicPageAsset(formulario('fiesta-B'))).rejects.toThrow('Sesion no autorizada');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('sin ninguna sesión se rechaza', async () => {
    await expect(uploadPublicPageAsset(formulario('fiesta-A'))).rejects.toThrow('Sesion no autorizada');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('el cliente no puede subir algo que no sea imagen, ni una imagen enorme', async () => {
    mockPortal.mockResolvedValue(true);
    const pdf = await uploadPublicPageAsset(formulario('fiesta-A', 'application/pdf'));
    expect(pdf.success).toBe(false);
    const grande = await uploadPublicPageAsset(formulario('fiesta-A', 'image/png', 11 * 1024 * 1024));
    expect(grande.success).toBe(false);
    expect(mockUpload).not.toHaveBeenCalled();
  });
});
