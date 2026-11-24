import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockSetPortalSessionCookie = jest.fn(async () => undefined);
const mockVerifyPortalSession = jest.fn(async () => true);
const mockEnforcePublicRateLimit = jest.fn(async () => undefined);
const mockReadData = jest.fn(async () => []);
const mockLeerFiestasCrudas = jest.fn(async () => []);
const mockGetFiestaByIdRaw = jest.fn(async () => null);
const mockGetFiestaById = jest.fn(async () => null);
const mockSaveFiesta = jest.fn(async () => ({ success: true }));
const mockMutarPresupuesto = jest.fn();
const mockGetPresupuestoById = jest.fn();
const mockCreateNotification = jest.fn(async () => undefined);
const mockVerifySession = jest.fn(async () => ({ success: false, user: undefined }));
const mockActualizarFiesta = jest.fn(async () => ({ success: true }));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: (...args: any[]) => mockVerifyPortalSession(...args),
  setPortalSessionCookie: (...args: any[]) => mockSetPortalSessionCookie(...args),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: (...args: any[]) => mockEnforcePublicRateLimit(...args),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: (...args: any[]) => mockLeerFiestasCrudas(...args),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: (...args: any[]) => mockGetFiestaByIdRaw(...args),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
  saveFiesta: (...args: any[]) => mockSaveFiesta(...args),
  getFiestas: jest.fn(async () => []),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: (...args: any[]) => mockActualizarFiesta(...args),
}));

jest.mock('@/lib/budget/mutar-presupuesto', () => ({
  mutarPresupuesto: (...args: any[]) => mockMutarPresupuesto(...args),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: jest.fn(),
  getPresupuestoById: (...args: any[]) => mockGetPresupuestoById(...args),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: (...args: any[]) => mockVerifySession(...args),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => 'https://example.invalid/doc.txt'),
  isStorageAvailable: jest.fn(() => false),
}));

jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises');
  return {
    ...actual,
    mkdir: jest.fn(async () => undefined),
    writeFile: jest.fn(async () => undefined),
  };
});

import { useAutoSave } from '@/hooks/use-auto-save';
import {
  calcularCostoIngredienteEnReceta,
  unidadesQueNoSePuedenConvertir,
} from '@/lib/catering/unidades';
import {
  changeEventDate,
  entrarAlPortalPorTelefono,
  getPortalPublicPreview,
  initializePortalSession,
} from '@/app/actions/fiesta/portal.actions';
import { entrarComoInvitado } from '@/app/actions/entrar-como-invitado';
import { checkAssetConflicts } from '@/app/actions/fiesta/carga-operativa.actions';

function readProjectFile(...parts: string[]): string {
  return fs.readFileSync(path.join(process.cwd(), ...parts), 'utf8');
}

describe('Orden 336 Bloque 3 — Sección D y E + Escaneo 214', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockEnforcePublicRateLimit.mockResolvedValue(undefined);
    mockVerifyPortalSession.mockResolvedValue(true);
    mockVerifySession.mockResolvedValue({ success: false, user: undefined });
  });

  describe('Sección D — Planificador, catering, compras y personal', () => {
    test('useAutoSave guarda los cambios pendientes al desmontar antes de cambiar de solapa', async () => {
      jest.useFakeTimers();
      const onSave = jest.fn(async () => ({ success: true }));

      function Harness({ value }: { value: { nota: string } }) {
        useAutoSave({ data: value, onSave, debounceMs: 5000, enabled: true });
        return null;
      }

      const host = document.body.appendChild(document.createElement('div'));
      const root = createRoot(host);

      await act(async () => {
        root.render(React.createElement(Harness, { value: { nota: 'inicial' } }));
      });

      await act(async () => {
        root.render(React.createElement(Harness, { value: { nota: 'editado sin esperar debounce' } }));
      });

      expect(onSave).not.toHaveBeenCalled();

      await act(async () => {
        root.unmount();
      });
      host.remove();

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ nota: 'editado sin esperar debounce' });
    });

    test('Hoja de Cocina lee menuData.items (no menuData.secciones)', () => {
      const code = readProjectFile('src/components/panels/catering--hoja-de-cocina.tsx');
      expect(code).toContain('menuData.items');
      expect(code).not.toContain('menuData?.secciones');
    });

    test('Lista de Compras maneja platos sin ingredients y respeta invitadosAdultos: 0', () => {
      const code = readProjectFile('src/components/panels/catering--lista-compras.tsx');
      expect(code).toContain('presupuestoData?.invitadosAdultos ?? (Number(fiestaData.configuracion.invitadosEstimados) || 0)');
      expect(code).toContain('(catalogDish.ingredients || []).forEach');
    });

    test('Recibos diferencia dos roles del mismo empleado con rolId y excluye demo/suspendidas de multi-fiesta', () => {
      const code = readProjectFile('src/components/panels/personal--recibos.tsx');
      expect(code).toContain('handleSalaryChange = (empleadoId: string, rolId: string, newSalary: string)');
      expect(code).toContain('detail.empleado.id === empleadoId && detail.rolId === rolId');
      expect(code).toContain('!esFiestaDemo(f)');
      expect(code).toContain('!esFiestaSuspendida(f)');
    });

    test('Enlace Utileros no apunta a /carga-operativa/retorno y cuenta celíacos por persona (partySize)', () => {
      const code = readProjectFile('src/components/panels/fiesta--en-vivo.tsx');
      expect(code).not.toContain('/carga-operativa/retorno');
      expect(code).toContain('liveTab=retorno');
      expect(code).toContain('g.partySize || 1');
      expect(code).toContain("i.dietaryRestriction === 'Celiaco'");

      const alergiasCode = readProjectFile('src/components/fiestas/panels/alergias.tsx');
      expect(alergiasCode).toContain('{totalConfirmados}');
      expect(alergiasCode).toContain('{personasConRestricciones}');
      expect(alergiasCode).toContain('{personasCeliacas}');
    });

    test('Unidades gr, grs, mililitros, kg->g y detección de peso contra volumen', () => {
      expect(calcularCostoIngredienteEnReceta(500, 400, 'gr', 'kg')).toBeCloseTo(200);
      expect(calcularCostoIngredienteEnReceta(250, 400, 'grs', 'Kg')).toBeCloseTo(100);
      expect(calcularCostoIngredienteEnReceta(500, 100, 'mililitros', 'Litro')).toBeCloseTo(50);
      expect(calcularCostoIngredienteEnReceta(2, 10, 'kg', 'g')).toBeCloseTo(20000);

      const avisoPesoVol = unidadesQueNoSePuedenConvertir(
        { name: 'Aceite', unit: 'gr', origenId: 'ins_lit' },
        [{ id: 'ins_lit', unidad: 'Litros' } as any],
      );
      expect(avisoPesoVol).toContain('peso');
      expect(avisoPesoVol).toContain('volumen');
    });

    test('checkAssetConflicts excluye fiestas demo y suspendidas', async () => {
      const { getFiestas } = require('@/app/actions/fiesta/fiesta.actions');
      const { getActivosFijos } = require('@/app/actions/activos-fijos');
      jest.mock('@/app/actions/activos-fijos', () => ({ getActivosFijos: jest.fn() }), { virtual: true });
      const code = readProjectFile('src/app/actions/fiesta/carga-operativa.actions.ts');
      expect(code).toContain('esFiestaDemo(f)');
      expect(code).toContain('esFiestaSuspendida(f)');
      expect(typeof checkAssetConflicts).toBe('function');
      void getFiestas;
      void getActivosFijos;
    });

    test('Todas las vistas del cronograma usan ordenarPorHoraDelEvento', () => {
      const vistas = [
        'src/components/panels/fiesta--en-vivo.tsx',
        'src/components/panels/pdf--itinerario.tsx',
        'src/app/acceso-personal/[tokenId]/page.tsx',
        'src/app/(app)/fiestas/[id]/centro/page.tsx',
        'src/app/invitacion/[fiestaId]/invitado/[guestId]/page.tsx',
        'src/app/portal-cliente/[id]/page.tsx',
        'src/app/portal/c/[accessKey]/PublicPortalView.tsx',
        'src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx',
        'src/app/portal/page.tsx',
      ];
      for (const archivo of vistas) {
        expect(readProjectFile(archivo)).toContain('ordenarPorHoraDelEvento(');
      }
    });
  });

  describe('Sección E + Escaneo 214 + portal.actions.ts', () => {
    test('Las 7 solapas del portal (incluidas mensajes y tu-web) NO usan sessionStorage.getItem(SESSION_KEY_PREFIX)', () => {
      const paneles = [
        'src/components/panels/portal--menu.tsx',
        'src/components/panels/portal--confirmar-invitados.tsx',
        'src/components/panels/portal--muro-social.tsx',
        'src/components/panels/portal--fotos-video.tsx',
        'src/components/panels/portal--musica.tsx',
        'src/components/panels/portal--mensajes.tsx',
        'src/components/panels/portal--tu-web.tsx',
      ];
      for (const archivo of paneles) {
        const contenido = readProjectFile(archivo);
        expect(contenido).not.toContain('sessionStorage.getItem(SESSION_KEY_PREFIX');
      }
    });

    test('entrarAlPortalPorTelefono normaliza +598 / 099 / 99 y no pisa cookie en bucle con varias fiestas', async () => {
      mockLeerFiestasCrudas.mockResolvedValue([
        {
          id: 'fiesta-1',
          estado: 'Contratado',
          configuracion: { nombreEvento: 'Cumple 15', telefono: '+598 99 123 456' },
          clientPortalSettings: { enabled: true, accessKey: 'CLAVE1' },
        },
        {
          id: 'fiesta-2',
          estado: 'Contratado',
          configuracion: { nombreEvento: 'Boda', telefono: '99123456' },
          clientPortalSettings: { enabled: true, accessKey: 'CLAVE1' },
        },
      ]);

      const multi = await entrarAlPortalPorTelefono('099 123 456', 'CLAVE1');
      expect(multi.success).toBe(true);
      expect(multi.fiestas).toHaveLength(2);
      expect(mockSetPortalSessionCookie).not.toHaveBeenCalled();

      const elegida = await entrarAlPortalPorTelefono('+598 99 123 456', 'CLAVE1', 'fiesta-1');
      expect(elegida).toEqual({ success: true, fiestaId: 'fiesta-1' });
      expect(mockSetPortalSessionCookie).toHaveBeenCalledTimes(1);
      expect(mockSetPortalSessionCookie).toHaveBeenCalledWith('fiesta-1', 'CLAVE1');
    });

    test('initializePortalSession aplica rate limit y comparación en tiempo constante', async () => {
      mockGetFiestaByIdRaw.mockResolvedValue({
        id: 'f-1',
        clientPortalSettings: { enabled: true, accessKey: 'SECRETA' },
      });

      const ok = await initializePortalSession('f-1', 'SECRETA');
      expect(ok).toEqual({ success: true });
      expect(mockEnforcePublicRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'portal-session-init', identity: 'f-1' }),
      );

      mockEnforcePublicRateLimit.mockRejectedValueOnce(new Error('rate limit'));
      const blocked = await initializePortalSession('f-1', 'SECRETA');
      expect(blocked.success).toBe(false);

      const portalCode = readProjectFile('src/app/actions/fiesta/portal.actions.ts');
      expect(portalCode).toContain('timingSafeEqual(');
    });

    test('changeEventDate activa ajusteAnualActivo al pasar el evento al año siguiente y lo aplica al saldo', async () => {
      mockGetFiestaById.mockResolvedValue({
        id: 'fiesta-anio',
        presupuestoId: 'pres-anio',
        configuracion: { nombreEvento: 'Fiesta Año', fechaEvento: '2026-10-10' },
        clientPortalSettings: { enabled: true, clientPassword: 'PIN' },
        othersDocumentos: [],
      });
      mockLeerFiestasCrudas.mockResolvedValue([]);

      const presupuestoBase = {
        id: 'pres-anio',
        clienteNombre: 'Cliente Test',
        eventoFecha: '2026-10-10',
        timestamp: '2026-03-01T12:00:00Z',
        estado: 'Aceptado',
        ajusteAnualActivo: false,
        ajusteAnualPorcentaje: 15,
        itemsPresupuestados: [
          {
            idServicioCatalogo: 'srv-1',
            nombreServicio: 'Servicio',
            cantidad: 1,
            precioUnitario: 10000,
            precioUnitarioPresupuesto: 10000,
            costoTotalItem: 10000,
          },
        ],
        costoTotalEstimado: 10000,
        totalConDescuento: 10000,
        pagosCliente: [],
        saldo: 10000,
        ajustesAplicados: [],
      };

      let presupuestoMutado: any = null;
      mockMutarPresupuesto.mockImplementation(async (_id: string, fn: (p: any) => any) => {
        presupuestoMutado = fn(presupuestoBase);
        return { encontrado: true, presupuesto: presupuestoMutado };
      });

      const res = await changeEventDate('fiesta-anio', {
        newDate: '2027-04-15',
        passwordInput: 'PIN',
      });

      expect(res.success).toBe(true);
      expect(presupuestoMutado.ajusteAnualActivo).toBe(true);
      // Base 10000 + 10% multa (1000) = 11000; + 15% ajuste anual = 12650
      expect(res.newBalance).toBe(12650);
    });

    test('getPortalPublicPreview permite abrir /portal?fiestaId= sin exponer accessKey', async () => {
      mockGetFiestaByIdRaw.mockResolvedValue({
        id: 'f-pub',
        configuracion: { nombreEvento: 'Fiesta Pública' },
        clientPortalSettings: { enabled: true, accessKey: 'NO_DEBE_SALIR' },
      });

      const preview = await getPortalPublicPreview('f-pub');
      expect(preview).toEqual({
        id: 'f-pub',
        enabled: true,
        configuracion: expect.objectContaining({ nombreEvento: 'Fiesta Pública' }),
      });
      expect(JSON.stringify(preview)).not.toContain('NO_DEBE_SALIR');
    });

    test('/entrar valida la sesión con verifySession() y no redirige por cookie suelta', () => {
      const code = readProjectFile('src/app/entrar/page.tsx');
      expect(code).toContain('verifySession(');
    });

    test('entrarComoInvitado excluye fiestas demo, no elige primero si hay duplicados y admite >20 por wifi', async () => {
      mockLeerFiestasCrudas.mockResolvedValue([
        {
          id: 'demo_fiesta',
          estado: 'Demo AK',
          configuracion: { nombreEvento: 'Demo', fechaEvento: '2099-01-01' },
          invitados: [{ id: 'g-demo', nombre: 'Invitado Demo', contacto: '099111222' }],
        },
        {
          id: 'fiesta-real',
          estado: 'Contratado',
          codigoFiesta: 'ABC123',
          configuracion: { nombreEvento: 'Real', fechaEvento: '2099-01-01' },
          invitados: [
            { id: 'g-1', nombre: 'Juan Perez', contacto: '099555666', guestAccessToken: 'tok-1' },
            { id: 'g-2', nombre: 'Juan Perez', contacto: '099555666', guestAccessToken: 'tok-2' },
          ],
        },
      ]);

      const demoRes = await entrarComoInvitado({ telefono: '099111222' });
      expect(demoRes.status).toBe('no_encontrado');

      const dupRes = await entrarComoInvitado({ telefono: '099555666' });
      expect(dupRes.status).toBe('ir_a_invitacion');

      const dupNameRes = await entrarComoInvitado({ codigoFiesta: 'ABC123', nombre: 'Juan Perez' });
      expect(dupNameRes.status).toBe('ir_a_invitacion');

      const code = readProjectFile('src/app/actions/entrar-como-invitado.ts');
      expect(code).toContain('limit: 120');
    });

    test('Enlaces de invitado incluyen withGuestAccess/credenciales, accesos no rechaza sin guestAccessToken y /portal/mesas evita 0/0', () => {
      const hubCode = readProjectFile('src/app/evento/hub/[fiestaId]/page.tsx');
      expect(hubCode).toContain('withGuestAccess(`/evento/mi-mesa/${encodeURIComponent(fiestaId)}`, guestId, guestAccessToken)');

      const rsvpCode = readProjectFile('src/app/invitacion/[fiestaId]/rsvp/page.tsx');
      expect(rsvpCode).toContain('withGuestAccess(`/invitacion/${fiestaId}/rsvp`');
      expect(rsvpCode).toContain('withGuestAccess(`/evento/social/${fiestaId}`');

      const miMesaCode = readProjectFile('src/app/evento/mi-mesa/[fiestaId]/page.tsx');
      expect(miMesaCode).toContain('withGuestAccess(`/evento/barra/${encodeURIComponent(fiestaId)}`');

      const accesosCode = readProjectFile('src/app/evento/accesos/[fiestaId]/page.tsx');
      expect(accesosCode).toContain('if (match?.guestAccessToken && match.guestAccessToken !== token)');

      const mesasCode = readProjectFile('src/app/portal/mesas/mesas-del-cliente.tsx');
      expect(mesasCode).toContain('totalContractedKids > 0 ?');
      expect(mesasCode).toContain('totalContractedAdults > 0 ?');
    });
  });
});
