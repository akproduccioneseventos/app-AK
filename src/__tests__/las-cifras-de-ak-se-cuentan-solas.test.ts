import fs from 'node:fs';
import path from 'node:path';
import {
  FECHA_DE_INICIO,
  FIESTAS_BASE,
  aniosDeAK,
  fiestasRealizadas,
  resolverEstadisticasPortada,
} from '@/lib/marketing/cifras-de-ak';

const mockLeerFiestasCrudas = jest.fn();

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: (...args: unknown[]) => mockLeerFiestasCrudas(...args),
}));

import { getCifrasPublicasAK } from '@/app/actions/cifras-ak';

describe('Orden 349 — Bloque 6: Las cifras de AK se cuentan solas', () => {
  beforeEach(() => {
    mockLeerFiestasCrudas.mockReset();
  });

  it('usa 2018-08-08 como fecha de inicio y 200 fiestas base', () => {
    expect(FECHA_DE_INICIO).toBe('2018-08-08');
    expect(FIESTAS_BASE).toBe(200);
  });

  it('aniosDeAK da 8 el 25/11/2026 y 9 el 08/08/2027 en hora de Uruguay', () => {
    expect(aniosDeAK('2026-11-25')).toBe(8);
    expect(aniosDeAK(new Date('2026-11-25T15:00:00Z'))).toBe(8);
    expect(aniosDeAK('2027-08-07')).toBe(8);
    expect(aniosDeAK('2027-08-08')).toBe(9);

    // 2027-08-08 02:59 UTC es 2027-08-07 23:59 en Montevideo (todavía 8 años)
    expect(aniosDeAK('2027-08-08T02:59:59Z')).toBe(8);
    // 2027-08-08 03:00 UTC es 2027-08-08 00:00 en Montevideo (ya cumplió 9 años)
    expect(aniosDeAK('2027-08-08T03:00:00Z')).toBe(9);
  });

  it('fiestasRealizadas suma 200 + fiestas reales >= 2027-01-01 ya pasadas y excluye muestra, canceladas, archivadas, futuras y anteriores a 2027', () => {
    const hoy = '2027-06-15';
    const fiestas = [
      // 3 fiestas reales de 2027 ya pasadas
      { id: 'f_1', configuracion: { fechaEvento: '2027-01-15' }, estado: 'Finalizado' },
      { id: 'f_2', fecha: '2027-03-20', status: 'Confirmado' },
      { id: 'f_3', configuracion: { fechaEvento: '2027-06-15' }, estado: 'En Planificación' },
      // Muestra del auditor y demo: no cuentan
      { id: 'fiesta_muestra_auditor', configuracion: { fechaEvento: '2027-02-10' }, estado: 'Confirmado' },
      { id: 'otra_muestra', esMuestra: true, configuracion: { fechaEvento: '2027-02-11' }, estado: 'Confirmado' },
      { id: 'demo_salon', configuracion: { fechaEvento: '2027-02-12' }, estado: 'Demo AK' },
      // Cancelada, rechazada, archivada o suspendida: no cuentan
      { id: 'f_cancelada', configuracion: { fechaEvento: '2027-02-14' }, estado: 'Cancelada' },
      { id: 'f_rechazada', fecha: '2027-02-15', status: 'rechazada' },
      { id: 'f_archivada', fecha: '2027-02-16', archived: true },
      { id: 'f_suspendida', configuracion: { fechaEvento: '2027-02-17' }, estado: 'suspendida' },
      // Anteriores a 2027: no cuentan (ya están dentro de la base de 200)
      { id: 'f_2026', configuracion: { fechaEvento: '2026-12-20' }, estado: 'Finalizado' },
      // Futuras: todavía no pasaron
      { id: 'f_futura', configuracion: { fechaEvento: '2027-06-16' }, estado: 'Confirmado' },
    ];

    expect(fiestasRealizadas(fiestas, hoy)).toBe(203);
  });

  it('resolverEstadisticasPortada actualiza los valores por defecto pero respeta cifras cargadas a mano por el dueño', () => {
    const cifras = { anios: 9, fiestasRealizadas: 214 };

    const defaultsViejos = [
      { value: '+200', label: 'Eventos Realizados', icon: '🎉' },
      { value: '+7', label: 'Años de Experiencia', icon: '⭐' },
      { value: 'Clientes', label: 'Satisfechos', icon: '❤️' },
    ];
    expect(resolverEstadisticasPortada(defaultsViejos, cifras)).toEqual([
      { value: '+214', label: 'Eventos Realizados', icon: '🎉' },
      { value: '+9', label: 'Años de Experiencia', icon: '⭐' },
      { value: 'Clientes', label: 'Satisfechos', icon: '❤️' },
    ]);

    const editadasAMano = [
      { value: '+350', label: 'Eventos Realizados', icon: '🎉' },
      { value: '+12', label: 'Años de Experiencia', icon: '⭐' },
    ];
    expect(resolverEstadisticasPortada(editadasAMano, cifras)).toEqual(editadasAMano);
  });

  it('getCifrasPublicasAK devuelve sólo cifras agregadas sin datos ni nombres de fiestas', async () => {
    mockLeerFiestasCrudas.mockResolvedValueOnce([
      {
        id: 'fiesta_privada_1',
        configuracion: { fechaEvento: '2027-01-20', nombreEvento: 'Fiesta Privada Secreta' },
        estado: 'Confirmado',
      },
      {
        id: 'fiesta_muestra_auditor',
        esMuestra: true,
        configuracion: { fechaEvento: '2027-01-25' },
        estado: 'Confirmado',
      },
    ]);

    const res = await getCifrasPublicasAK();
    expect(Object.keys(res).sort()).toEqual(['anios', 'fiestasRealizadas']);
    expect(typeof res.anios).toBe('number');
    expect(typeof res.fiestasRealizadas).toBe('number');
    expect(JSON.stringify(res)).not.toContain('Fiesta Privada Secreta');
  });

  it('ninguna pantalla o catálogo público de Orden 349 escribe "+7 años", "7 años" o "Más de 500 familias" a mano', () => {
    const archivos = [
      'src/components/landing/StatsSection.tsx',
      'src/components/landing/AkTeamStorySection.tsx',
      'src/components/public/HeroSection.tsx',
      'src/app/experiencia/page.tsx',
      'src/data/presentacion.ts',
      'src/data/event-catalogs/shared.ts',
      'src/lib/marketing/plantillas-base.ts',
      'src/types/landing-editor.ts',
      'src/app/presentacion-led/slides/testimonios-slide.tsx',
      'src/lib/blog/sin-promesas.ts',
    ];

    for (const rel of archivos) {
      const contenido = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(contenido).not.toMatch(/\+?7\s*años/);
      expect(contenido).not.toContain('Más de 500 familias');
    }
  });
});
