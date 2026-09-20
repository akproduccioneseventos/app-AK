import fs from 'fs';
import path from 'path';
import { generarEscenaAutomatica } from '@/lib/decoracion/generar-layout-automatico';
import type { FiestaEnPlanificacion, LayoutElement } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

describe('Orden 3D: Salón en 3D, Generación Automática y 5 Piezas de Layout', () => {
  const rootDir = process.cwd();
  const layoutPagePath = path.join(rootDir, 'src/app/(app)/fiestas/nueva/invitados/layout/page.tsx');
  const salonScenePath = path.join(rootDir, 'src/components/salon-3d/SalonScene.tsx');
  const portalDecoPath = path.join(rootDir, 'src/app/portal/[fiestaId]/decoracion/page.tsx');

  const layoutPageCode = fs.readFileSync(layoutPagePath, 'utf8');
  const salonSceneCode = fs.readFileSync(salonScenePath, 'utf8');
  const portalDecoCode = fs.readFileSync(portalDecoPath, 'utf8');

  describe('1. Salón en 3D en el Portal del Cliente y Fallback a Foto', () => {
    it('el portal del cliente contiene la sección de Salón en 3D con giro táctil', () => {
      expect(portalDecoCode).toContain('Tu Salón en 3D');
      expect(portalDecoCode).toContain('data-testid="seccion-salon-3d"');
      expect(portalDecoCode).toContain('Girá el salón con el dedo');
      expect(portalDecoCode).toContain('<SalonScene decoracion={deco} />');
    });

    it('cuenta con detección de WebGL y fallback a foto para dispositivos que no pueden dibujarlo', () => {
      expect(portalDecoCode).toContain('canRenderWebGL');
      expect(portalDecoCode).toContain('fallback=');
      expect(portalDecoCode).toContain('tu dispositivo no soporta aceleración 3D');
      expect(portalDecoCode).toContain('SalonSceneAislada');
    });
  });

  describe('2. La escena se arma sola según lo contratado y NUNCA pisa un plano existente', () => {
    const fiestaBase: FiestaEnPlanificacion = {
      id: 'fiesta_test_auto',
      invitacionSlug: 'fiesta-test',
      configuracion: {
        nombreEvento: 'Boda de Prueba',
        tipoCelebracion: 'Boda',
        invitadosEstimados: 80,
      } as any,
      invitados: [
        { id: 'inv_1', nombre: 'Familia Perez', asistencia: 'confirmado', partySize: 4 } as any,
        { id: 'inv_2', nombre: 'Familia Lopez', asistencia: 'confirmado', partySize: 6 } as any,
        { id: 'inv_3', nombre: 'Familia Gomez', asistencia: 'confirmado', partySize: 15 } as any,
        { id: 'inv_4', nombre: 'Amigo Pendiente', asistencia: 'pendiente', partySize: 2 } as any,
      ],
      decoracion: {
        salonWidth: 16,
        salonHeight: 16,
        pixelsPerMeter: 40,
        salonElements: [],
      },
    } as any;

    const presupuestoContratado: Presupuesto = {
      id: 'pres_123',
      clienteNombre: 'Cliente Prueba',
      eventoTipo: 'Boda',
      eventoFecha: '2027-10-10',
      totalFinal: 5000,
      itemsPresupuestados: [
        { idServicioCatalogo: 'srv_1', nombreServicio: 'Discoteca y Pista de Baile LED', cantidad: 1, precioUnitario: 1000, precioUnitarioPresupuesto: 1000, costoTotalItem: 1000 },
        { idServicioCatalogo: 'srv_2', nombreServicio: 'Escenario y Sonido en Vivo Banda', cantidad: 1, precioUnitario: 800, precioUnitarioPresupuesto: 800, costoTotalItem: 800 },
        { idServicioCatalogo: 'srv_3', nombreServicio: 'Barra de Tragos Premium', cantidad: 1, precioUnitario: 600, precioUnitarioPresupuesto: 600, costoTotalItem: 600 },
        { idServicioCatalogo: 'srv_4', nombreServicio: 'Sector de Sillones y Living Lounge', cantidad: 1, precioUnitario: 400, precioUnitarioPresupuesto: 400, costoTotalItem: 400 },
        { idServicioCatalogo: 'srv_5', nombreServicio: 'Mesa de la Torta y Candy Bar', cantidad: 1, precioUnitario: 300, precioUnitarioPresupuesto: 300, costoTotalItem: 300 },
        { idServicioCatalogo: 'srv_6', nombreServicio: 'Photo-opportunity con Fotocabina', cantidad: 1, precioUnitario: 500, precioUnitarioPresupuesto: 500, costoTotalItem: 500 },
        { idServicioCatalogo: 'srv_7', nombreServicio: 'Pantalla LED Gigante', cantidad: 1, precioUnitario: 700, precioUnitarioPresupuesto: 700, costoTotalItem: 700 },
      ],
    } as any;

    it('arma mesas según los confirmados (25 confirmados = 3 mesas de 10 personas)', () => {
      const res = generarEscenaAutomatica({
        fiesta: fiestaBase,
        presupuesto: presupuestoContratado,
      });

      expect(res.aplicado).toBe(true);
      expect(res.elementosGenerados).toBeGreaterThan(0);

      const elementos = res.decoracion.salonElements || [];
      const mesas = elementos.filter(e => e.category === 'Mesa Redonda');
      // 4 + 6 + 15 = 25 confirmados -> ceil(25 / 10) = 3 mesas
      expect(mesas.length).toBe(3);
    });

    it('incluye pista, escenario, barra, sillones, torta, photo-opportunity y pantalla LED según presupuesto', () => {
      const res = generarEscenaAutomatica({
        fiesta: fiestaBase,
        presupuesto: presupuestoContratado,
      });

      const elementos = res.decoracion.salonElements || [];
      const categorias = elementos.map(e => e.category);

      expect(categorias).toContain('Pista de Baile');
      expect(categorias).toContain('Escenario');
      expect(categorias).toContain('Barra');
      expect(categorias).toContain('Living');
      expect(categorias).toContain('Mesa de la Torta');
      expect(categorias).toContain('Photo-opportunity');
      expect(categorias).toContain('Pantalla LED');
    });

    it('REGLA ESTRICTA: NUNCA pisa un plano que ya esté hecho', () => {
      const elementoExistente: LayoutElement = {
        id: 'el_existente_1',
        name: 'Mesa Principal VIP Creada a Mano',
        x: 100,
        y: 100,
        rotation: 0,
        type: 'element',
        category: 'Mesa Redonda',
      };

      const fiestaConPlanoPrevio: FiestaEnPlanificacion = {
        ...fiestaBase,
        decoracion: {
          ...fiestaBase.decoracion,
          salonElements: [elementoExistente],
        },
      };

      const res = generarEscenaAutomatica({
        fiesta: fiestaConPlanoPrevio,
        presupuesto: presupuestoContratado,
      });

      expect(res.aplicado).toBe(false);
      expect(res.motivo).toBe('ya_tiene_plano');
      expect(res.decoracion.salonElements).toHaveLength(1);
      expect(res.decoracion.salonElements?.[0].name).toBe('Mesa Principal VIP Creada a Mano');
    });
  });

  describe('3. Cinco piezas nuevas en el layout y en 3D', () => {
    it('las 5 piezas están disponibles en el menú desplegable de Añadir Elemento en layout/page.tsx', () => {
      expect(layoutPageCode).toContain("addElement('Barra'");
      expect(layoutPageCode).toContain("addElement('Sector de Sillones'");
      expect(layoutPageCode).toContain("addElement('Mesa de la Torta'");
      expect(layoutPageCode).toContain("addElement('Photo-opportunity'");
      expect(layoutPageCode).toContain("addElement('Pantalla LED'");
    });

    it('las 5 piezas están configuradas con dimensiones y estilos en addElement()', () => {
      expect(layoutPageCode).toContain("category === 'Barra'");
      expect(layoutPageCode).toContain("category === 'Sector de Sillones'");
      expect(layoutPageCode).toContain("category === 'Mesa de la Torta'");
      expect(layoutPageCode).toContain("category === 'Photo-opportunity'");
      expect(layoutPageCode).toContain("category === 'Pantalla LED'");
    });

    it('las 5 piezas están modeladas en 3D en SalonScene.tsx y registradas en elegirObjeto3D', () => {
      expect(salonSceneCode).toContain('export function Barra3D');
      expect(salonSceneCode).toContain('export function SectorSillones3D');
      expect(salonSceneCode).toContain('export function MesaTorta3D');
      expect(salonSceneCode).toContain('export function PhotoOpportunity3D');
      expect(salonSceneCode).toContain('export function PantallaLed3D');

      expect(salonSceneCode).toContain('if (cat.includes(\'barra\') || cat.includes(\'bar\') || name.includes(\'barra\')) return Barra3D;');
      expect(salonSceneCode).toContain('if (cat.includes(\'living\') || cat.includes(\'sillon\') || cat.includes(\'sillones\') || name.includes(\'living\') || name.includes(\'sillon\')) return SectorSillones3D;');
      expect(salonSceneCode).toContain('if (cat.includes(\'torta\') || name.includes(\'torta\')) return MesaTorta3D;');
      expect(salonSceneCode).toContain('if (cat.includes(\'photo\') || cat.includes(\'foto\') || name.includes(\'photo\') || name.includes(\'foto\')) return PhotoOpportunity3D;');
      expect(salonSceneCode).toContain('if (cat.includes(\'led\') || cat.includes(\'pantalla\') || name.includes(\'led\') || name.includes(\'pantalla\')) return PantallaLed3D;');
    });
  });
});
