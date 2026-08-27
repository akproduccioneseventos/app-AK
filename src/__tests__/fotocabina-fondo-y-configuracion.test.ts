import fs from 'node:fs';
import path from 'node:path';
import {
  getPublicEntertainmentEvent,
  getEntertainmentStationConfig,
} from '@/lib/entertainment/station-config';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Orden 13: Fotocabina con fondo heredado y configuración por fiesta', () => {
  const fiestaMockConInvitacion: FiestaEnPlanificacion = {
    id: 'fiesta_areli_15',
    fechaCreacion: '2026-08-20',
    estado: 'planificacion',
    configuracion: {
      nombreEvento: '15 Años de Areli',
      nombreAgasajado: 'Areli',
      tipoCelebracion: 'Fiesta de 15',
      fechaEvento: '2026-11-15',
      primaryColor: '#a855f7',
      colorTema: '#d8b4fe',
    },
    invitacionDigital: {
      musicaFondoUrl: '',
      secciones: [],
      cabecera: {
        imagenFondoUrl: '/media/fondos/lila-mariposas.jpg',
        paletaColores: {
          primary: '#a855f7',
          secondary: '#d8b4fe',
          accent: '#c084fc',
        },
      },
    },
    others: {
      entretenimiento: {
        modules: {
          fotocabina: {
            enabled: true,
            fotosPorTanda: 4,
            segundosCuentaRegresiva: 12,
            marcosHabilitados: ['none', 'flowers'],
          },
        },
      },
    },
  };

  const fiestaMockSinInvitacion: FiestaEnPlanificacion = {
    id: 'fiesta_simple_1',
    fechaCreacion: '2026-08-20',
    estado: 'planificacion',
    configuracion: {
      nombreEvento: 'Cumpleaños de Martín',
      nombreAgasajado: 'Martín',
      tipoCelebracion: 'Cumpleaños',
      fechaEvento: '2026-09-10',
      primaryColor: '#059669',
    },
  };

  it('hereda imagenFondoUrl y colorFondo directamente desde la invitación digital', () => {
    const pubEvent = getPublicEntertainmentEvent(fiestaMockConInvitacion, 'fotocabina');
    expect(pubEvent.imagenFondoUrl).toBe('/media/fondos/lila-mariposas.jpg');
    expect(pubEvent.colorFondo).toBe('#a855f7');
  });

  it('cae en color primario de la fiesta cuando no hay invitación armada', () => {
    const pubEvent = getPublicEntertainmentEvent(fiestaMockSinInvitacion, 'fotocabina');
    expect(pubEvent.imagenFondoUrl).toBe('');
    expect(pubEvent.colorFondo).toBe('#059669');
  });

  it('lee la configuración de fotosPorTanda, cuenta regresiva y marcos habilitados por fiesta', () => {
    const station = getEntertainmentStationConfig(fiestaMockConInvitacion, 'fotocabina');
    expect(station.fotosPorTanda).toBe(4);
    expect(station.segundosCuentaRegresiva).toBe(12);
    expect(station.marcosHabilitados).toEqual(['none', 'flowers']);
  });

  it('usa los valores por defecto estándar para fiestas sin configurar (3 fotos, 10 segundos, todos los marcos)', () => {
    const station = getEntertainmentStationConfig(fiestaMockSinInvitacion, 'fotocabina');
    expect(station.fotosPorTanda).toBe(3);
    expect(station.segundosCuentaRegresiva).toBe(10);
    expect(station.marcosHabilitados).toEqual(['none', 'golden', 'neon', 'flowers', 'ak_brand']);
  });

  it('la pantalla de entretenimiento no promete funciones inexistentes (GIF, Boomerang, Filtros en vivo, Correos en fotocabina)', () => {
    const filePath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/entretenimiento/page.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    // No debe prometer GIF ni boomerang en la lista de fotocabina
    expect(content).not.toMatch(/fotocabina:\s*\[[^\]]*'GIF'/);
    expect(content).not.toMatch(/fotocabina:\s*\[[^\]]*'Boomerang'/);
    expect(content).not.toMatch(/fotocabina:\s*\[[^\]]*'Filtros en vivo'/);
    expect(content).not.toMatch(/fotocabina:\s*\[[^\]]*'Captura de correos'/);
  });
});
