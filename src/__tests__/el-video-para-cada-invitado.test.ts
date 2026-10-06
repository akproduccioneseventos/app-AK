/**
 * @fileOverview Pruebas para los videos de la quinceañera / novios para cada invitado (Orden 117).
 *
 * Casos obligatorios:
 * 1. Sin sesión del portal, guardarVideoParaInvitados no guarda nada.
 * 2. Con un archivo de más de 8 MB (ej. 9 MB) o un invitado de otra fiesta, no guarda.
 * 3. Antes del check-in getPublicGuestPortalData NO trae videoPersonal, después SÍ,
 *    y a otro invitado del mismo grupo también, y a uno que no está en el grupo no.
 * 4. Con el interruptor videosParaInvitadosActivo apagado, no viaja aunque haya video.
 * 5. Si actualizarFiesta falla, se llama a deleteFromStorage y devuelve success: false.
 */

import { guardarVideoParaInvitados } from '@/app/actions/videos-invitados';
import { getPublicGuestPortalData } from '@/app/actions/public-guest-portal';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { uploadToStorage, deleteFromStorage, getSignedUrl } from '@/lib/firebase/storage';

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn(),
  getSignedUrl: jest.fn(),
}));

if (typeof Blob !== 'undefined') {
  Blob.prototype.arrayBuffer = async function () {
    // jsdom no trae Blob.text: se lee el contenido con FileReader, que sí trae. Un video vacío
    // ahora se rechaza, así que la prueba tiene que mandar los bytes de verdad.
    const text: string = typeof this.text === 'function'
      ? await this.text()
      : await new Promise((ok, mal) => {
        const lector = new FileReader();
        lector.onload = () => ok(String(lector.result));
        lector.onerror = () => mal(lector.error);
        lector.readAsText(this);
      });
    const buf = Buffer.from(text);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  };
}

describe('Orden 117 — El video para cada invitado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Sin sesión del portal, guardarVideoParaInvitados no guarda nada', async () => {
    (verifyPortalSession as jest.Mock).mockResolvedValue(false);

    const formData = new FormData();
    const fakeBlob = new Blob(['contenido-video'], { type: 'video/webm' });
    formData.append('video', fakeBlob, 'video.webm');

    const res = await guardarVideoParaInvitados('fiesta-123', ['inv-1'], formData);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/sesión/i);
    expect(uploadToStorage).not.toHaveBeenCalled();
    expect(actualizarFiesta).not.toHaveBeenCalled();
  });

  test('2. Con un archivo de 9 MB o un invitado de otra fiesta, no guarda', async () => {
    (verifyPortalSession as jest.Mock).mockResolvedValue(true);
    (getFiestaById as jest.Mock).mockResolvedValue({
      id: 'fiesta-123',
      clientPortalSettings: { videosParaInvitadosActivo: true },
      invitados: [{ id: 'inv-1', nombre: 'Juan' }],
    });

    // Caso A: Archivo de 9 MB
    const largeBuffer = new Uint8Array(9 * 1024 * 1024);
    const largeBlob = new Blob([largeBuffer], { type: 'video/webm' });
    const formDataLarge = new FormData();
    formDataLarge.append('video', largeBlob, 'grande.webm');

    const resLarge = await guardarVideoParaInvitados('fiesta-123', ['inv-1'], formDataLarge);
    expect(resLarge.success).toBe(false);
    expect(resLarge.error).toMatch(/8 MB/i);
    expect(uploadToStorage).not.toHaveBeenCalled();

    // Caso B: Invitado de otra fiesta
    const normalBlob = new Blob(['video-ok'], { type: 'video/webm' });
    const formDataNormal = new FormData();
    formDataNormal.append('video', normalBlob, 'video.webm');

    const resOtroInvitado = await guardarVideoParaInvitados('fiesta-123', ['invitado-fantasma'], formDataNormal);
    expect(resOtroInvitado.success).toBe(false);
    expect(resOtroInvitado.error).toMatch(/no pertenecen/i);
    expect(uploadToStorage).not.toHaveBeenCalled();
  });

  test('3. Antes del check-in getPublicGuestPortalData NO trae videoPersonal, después SÍ, y a otro del grupo sí, y a uno fuera no', async () => {
    const fiestaMock = {
      id: 'fiesta-123',
      configuracion: {
        nombreEvento: '15 de Sofía',
        nombreAgasajado: 'Sofía',
        fechaEvento: '2026-12-15',
        horaInicio: '21:00',
      },
      clientPortalSettings: { videosParaInvitadosActivo: true },
      invitados: [
        { id: 'inv-1', nombre: 'Martín', guestAccessToken: 'tok-1', checkedIn: false },
        { id: 'inv-2', nombre: 'Lucas', guestAccessToken: 'tok-2', checkedIn: true },
        { id: 'inv-3', nombre: 'Camila', guestAccessToken: 'tok-3', checkedIn: true },
      ],
      videosParaInvitados: [
        {
          id: 'vid-grupo-1',
          invitadoIds: ['inv-1', 'inv-2'],
          storagePath: 'videos-invitados/fiesta-123/vid-1.webm',
          duracionSegundos: 20,
          creadoAt: '2026-10-05T12:00:00Z',
        },
      ],
      programa: [],
    };

    (getFiestaById as jest.Mock).mockResolvedValue(fiestaMock);
    (getSignedUrl as jest.Mock).mockResolvedValue('https://storage.googleapis.com/firmada.webm');

    // 3A. inv-1 tiene video asignado pero checkedIn es false: NO debe traer videoPersonal
    const dataAntes = await getPublicGuestPortalData('fiesta-123', 'inv-1', 'tok-1');
    expect(dataAntes).not.toBeNull();
    expect(dataAntes?.videoPersonal).toBeUndefined();

    // 3B. inv-2 está en el mismo video asignado y checkedIn es true: SÍ debe traer videoPersonal
    const dataDespues = await getPublicGuestPortalData('fiesta-123', 'inv-2', 'tok-2');
    expect(dataDespues).not.toBeNull();
    expect(dataDespues?.videoPersonal).toBeDefined();
    expect(dataDespues?.videoPersonal?.url).toBe('https://storage.googleapis.com/firmada.webm');
    expect(getSignedUrl).toHaveBeenCalledWith('videos-invitados/fiesta-123/vid-1.webm', 6 * 60 * 60 * 1000);

    // 3C. inv-3 tiene checkedIn true pero NO está en el grupo del video: NO debe traer videoPersonal
    const dataFuera = await getPublicGuestPortalData('fiesta-123', 'inv-3', 'tok-3');
    expect(dataFuera).not.toBeNull();
    expect(dataFuera?.videoPersonal).toBeUndefined();
  });

  test('4. Con el interruptor apagado no viaja aunque haya video y checkedIn sea true', async () => {
    const fiestaMock = {
      id: 'fiesta-123',
      configuracion: { nombreEvento: '15 de Sofía' },
      clientPortalSettings: { videosParaInvitadosActivo: false }, // APAGADO
      invitados: [
        { id: 'inv-2', nombre: 'Lucas', guestAccessToken: 'tok-2', checkedIn: true },
      ],
      videosParaInvitados: [
        {
          id: 'vid-grupo-1',
          invitadoIds: ['inv-2'],
          storagePath: 'videos-invitados/fiesta-123/vid-1.webm',
        },
      ],
      programa: [],
    };

    (getFiestaById as jest.Mock).mockResolvedValue(fiestaMock);

    const data = await getPublicGuestPortalData('fiesta-123', 'inv-2', 'tok-2');
    expect(data).not.toBeNull();
    expect(data?.videoPersonal).toBeUndefined();
  });

  test('5. Si actualizarFiesta falla, se llama a deleteFromStorage y devuelve success: false', async () => {
    (verifyPortalSession as jest.Mock).mockResolvedValue(true);
    (getFiestaById as jest.Mock).mockResolvedValue({
      id: 'fiesta-123',
      clientPortalSettings: { videosParaInvitadosActivo: true },
      invitados: [{ id: 'inv-1', nombre: 'Juan' }],
    });
    (uploadToStorage as jest.Mock).mockResolvedValue('url-temp');
    (actualizarFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Error en base de datos' });

    const formData = new FormData();
    const blob = new Blob(['video-valido'], { type: 'video/webm' });
    formData.append('video', blob, 'video.webm');

    const res = await guardarVideoParaInvitados('fiesta-123', ['inv-1'], formData);

    expect(res.success).toBe(false);
    expect(uploadToStorage).toHaveBeenCalled();
    expect(actualizarFiesta).toHaveBeenCalled();
    // Se asegura de borrar el archivo subido si falló actualizar la fiesta
    expect(deleteFromStorage).toHaveBeenCalledWith(expect.stringContaining('videos-invitados/fiesta-123/'));
  });
});
