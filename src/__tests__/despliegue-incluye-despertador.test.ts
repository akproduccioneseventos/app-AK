import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import {
  estadoDelDespertador,
  marcarToqueDespertador,
} from '@/lib/automatico/tareas-automaticas';

const RAIZ = process.cwd();

const datosGuardados: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    return datosGuardados[file] !== undefined ? JSON.parse(JSON.stringify(datosGuardados[file])) : fallback;
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    datosGuardados[file] = JSON.parse(JSON.stringify(data));
  }),
}));

describe('El despliegue automatico incluye el despertador de Google', () => {
  beforeEach(() => {
    for (const key of Object.keys(datosGuardados)) {
      delete datosGuardados[key];
    }
    jest.clearAllMocks();
  });

  it('firebase.json tiene configurada la seccion de functions apuntando a la carpeta functions', () => {
    const firebaseJsonPath = path.join(RAIZ, 'firebase.json');
    expect(existsSync(firebaseJsonPath)).toBe(true);

    const config = JSON.parse(readFileSync(firebaseJsonPath, 'utf8'));
    expect(config.functions).toBeDefined();

    const functionsConfig = Array.isArray(config.functions) ? config.functions[0] : config.functions;
    expect(functionsConfig.source).toBe('functions');
  });

  it('.github/workflows/deploy.yml contiene el paso de despliegue de functions', () => {
    const deployYmlPath = path.join(RAIZ, '.github/workflows/deploy.yml');
    expect(existsSync(deployYmlPath)).toBe(true);

    const deployYml = readFileSync(deployYmlPath, 'utf8');
    expect(deployYml).toContain('firebase-tools deploy --only functions:despertadorTareasAutomaticas');
    expect(deployYml).not.toContain('FirebaseExtended/action-hosting-deploy');
    expect(deployYml).toContain('FIREBASE_SERVICE_ACCOUNT is required');
    expect(deployYml).toContain("'.github/workflows/deploy.yml'");
    expect(deployYml).not.toContain('cp -r .next functions/.next');
  });

  it('el estado del despertador informa si nunca toco, si esta activo o si esta atrasado', async () => {
    const ahora = new Date('2026-08-22T15:00:00.000Z');

    // Estado inicial: nunca toco la puerta
    const estadoInicial = await estadoDelDespertador(ahora);
    expect(estadoInicial.estado).toBe('nunca');
    expect(estadoInicial.mensaje).toContain('El despertador no está funcionando: nunca tocó la puerta');

    // Marcamos un toque hace 10 minutos
    const hace10Min = new Date(ahora.getTime() - 10 * 60 * 1000);
    await marcarToqueDespertador(hace10Min);

    const estadoActivo = await estadoDelDespertador(ahora);
    expect(estadoActivo.estado).toBe('activo');
    expect(estadoActivo.minutosDesdeUltimoToque).toBe(10);
    expect(estadoActivo.mensaje).toContain('El despertador está funcionando');

    // Si pasaron 60 minutos (mas de 3 ciclos de 15 min), debe figurar atrasado / no funcionando
    const tarde = new Date(ahora.getTime() + 60 * 60 * 1000);
    const estadoAtrasado = await estadoDelDespertador(tarde);
    expect(estadoAtrasado.estado).toBe('atrasado');
    expect(estadoAtrasado.mensaje).toContain('El despertador no está funcionando');
  });
  it('App Hosting no puede ocultar errores de tipos o lint durante su build', () => {
    const nextConfig = readFileSync(path.join(RAIZ, 'next.config.js'), 'utf8');
    const functionsPackage = JSON.parse(
      readFileSync(path.join(RAIZ, 'functions/package.json'), 'utf8'),
    );

    expect(nextConfig).not.toContain('ignoreBuildErrors: true');
    expect(nextConfig).not.toContain('ignoreDuringBuilds: true');
    expect(functionsPackage.engines.node).toBe('20');
  });

});
