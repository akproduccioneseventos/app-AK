/**
 * @jest-environment node
 *
 * Pruebas unitarias de las 5 Innovaciones Mundiales y el Armador Inteligente de Mesas.
 */

import { armarMesasInteligente, type InvitadoParaMesa } from '@/lib/fiesta/armador-mesas-inteligente';
import { getCrowdSyncStateAction, setCrowdSyncStateAction } from '@/app/actions/crowd-sync';
import { getAudioGuestbookEntriesAction, saveAudioGuestbookEntryAction } from '@/app/actions/audio-guestbook';
import { getBrindisActivosAction, enviarBrindisCruzadoAction } from '@/app/actions/brindis-cruzado';
import { getFotosDescartablesAction, guardarFotoDescartableAction } from '@/app/actions/camara-descartable';

const base: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f in base ? copia(base[f]) : d)),
  writeData: jest.fn(async (f: string, d: any) => {
    base[f] = copia(d);
  }),
}));

describe('Innovaciones Mundiales AK Producciones 2026', () => {
  beforeEach(() => {
    for (const k of Object.keys(base)) delete base[k];
  });

  describe('1. Armador Inteligente de Mesas Anti-Estrés', () => {
    it('distribuye invitados por afinidad sin superar la capacidad máxima por mesa', () => {
      const invitados: InvitadoParaMesa[] = [
        { id: '1', nombre: 'Papá', grupoAfinidad: 'Familia Novio', cantidadAcompaniantes: 1 },
        { id: '2', nombre: 'Tío Juan', grupoAfinidad: 'Familia Novio', cantidadAcompaniantes: 2 },
        { id: '3', nombre: 'Primo Nico', grupoAfinidad: 'Familia Novio', cantidadAcompaniantes: 1 },
        { id: '4', nombre: 'Amigo 1', grupoAfinidad: 'Amigos Liceo', cantidadAcompaniantes: 0 },
        { id: '5', nombre: 'Amigo 2', grupoAfinidad: 'Amigos Liceo', cantidadAcompaniantes: 0 },
      ];

      const resultado = armarMesasInteligente(invitados, { capacidadPorMesa: 6 });

      expect(resultado.totalAsignados).toBe(9); // 2 + 3 + 2 + 1 + 1 = 9 personas
      expect(resultado.totalMesasUsadas).toBeGreaterThanOrEqual(2);

      // Ninguna mesa debe superar la capacidad de 6
      for (const mesa of resultado.mesas) {
        expect(mesa.totalPersonas).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('2. Efecto Coldplay (CrowdSync en Celulares)', () => {
    it('activa el modo show sincronizado con color, BPM y título', async () => {
      const resSet = await setCrowdSyncStateAction({
        fiestaId: 'fiesta_test_1',
        active: true,
        mode: 'coldplay_pulsing',
        title: '¡Todos con el celular en alto!',
        primaryColor: '#eab308',
        bpm: 128,
      });

      expect(resSet.success).toBe(true);
      expect(resSet.state?.active).toBe(true);
      expect(resSet.state?.bpm).toBe(128);

      const resGet = await getCrowdSyncStateAction('fiesta_test_1');
      expect(resGet.success).toBe(true);
      expect(resGet.state?.title).toBe('¡Todos con el celular en alto!');
    });
  });

  describe('3. El Teléfono Rojo Digital (Cápsula de Audio)', () => {
    it('graba y lista mensajes de audio para el recuerdo de la fiesta', async () => {
      const saveRes = await saveAudioGuestbookEntryAction({
        fiestaId: 'fiesta_test_2',
        autor: 'Padrino Roberto',
        mesa: 'Mesa 1',
        audioBase64OrUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQ8=',
        duracionSegundos: 18,
      });

      expect(saveRes.success).toBe(true);
      expect(saveRes.entry?.id).toBeTruthy();

      const getRes = await getAudioGuestbookEntriesAction('fiesta_test_2');
      expect(getRes.success).toBe(true);
      expect(getRes.entries).toHaveLength(1);
      expect(getRes.entries![0].autor).toBe('Padrino Roberto');
    });
  });

  describe('4. Brindis Cruzado entre Mesas en Pantalla LED', () => {
    it('emite un brindis entre mesas con dedicatoria para el muro gigante', async () => {
      const toastRes = await enviarBrindisCruzadoAction({
        fiestaId: 'fiesta_test_3',
        mesaOrigen: 'Mesa 4',
        mesaDestino: 'Mesa 9',
        remitente: 'Los amigos del liceo',
        tragoOBrindis: 'Fernet con Coca',
        dedicatoria: '¡Salud por los novios!',
      });

      expect(toastRes.success).toBe(true);
      expect(toastRes.brindis?.mesaDestino).toBe('Mesa 9');

      const listRes = await getBrindisActivosAction('fiesta_test_3');
      expect(listRes.success).toBe(true);
      expect(listRes.brindis).toHaveLength(1);
      expect(listRes.brindis![0].dedicatoria).toBe('¡Salud por los novios!');
    });
  });

  describe('5. Cámara Descartable Retro con Revelado al Mediodía Siguiente', () => {
    it('guarda fotos en el rollo calculando la fecha de revelado oficial', async () => {
      const fotoRes = await guardarFotoDescartableAction({
        fiestaId: 'fiesta_test_4',
        autor: 'Camila',
        fotoUrlOrBase64: 'data:image/jpeg;base64,fakeimg',
        filtroVintage: 'kodak_gold',
        caption: 'En la pista bailando',
      });

      expect(fotoRes.success).toBe(true);
      expect(fotoRes.reveladoAt).toBeTruthy();

      const getFotos = await getFotosDescartablesAction('fiesta_test_4');
      expect(getFotos.success).toBe(true);
      expect(getFotos.fotos).toHaveLength(1);
      expect(getFotos.fotos![0].filtroVintage).toBe('kodak_gold');
    });
  });
});
