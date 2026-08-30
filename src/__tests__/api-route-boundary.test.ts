import fs from 'node:fs';
import path from 'node:path';

const API_ROOT = path.join(process.cwd(), 'src', 'app', 'api');
const PUBLIC_ROUTES = new Set([
  'health/route.ts',
  'imports/confirmed-events-29/route.ts',
  'payments/mercadopago/checkout/route.ts',
  'payments/mercadopago/status/route.ts',
  'payments/mercadopago/webhook/route.ts',
  'public-page-assets/[...parts]/route.ts',
  'social-gallery/[fiestaId]/[filename]/route.ts',
  'social-media-assets/[filename]/route.ts',
  'whatsapp/webhook/route.ts',
  // El invitado busca su cancion desde la invitacion, sin sesion. Es publica a
  // proposito: no devuelve datos del evento, solo resultados de Spotify, y tiene
  // tope de 30 busquedas por minuto.
  'integrations/spotify/search/route.ts',
  // El "instalador" de una estacion suelta. La maquina del empleado no tiene la
  // sesion de AK y el navegador tiene que poder leerlo para ofrecer instalar la
  // fotocabina como programa aparte. **No devuelve ningun dato de la fiesta**:
  // solo el nombre de la estacion, el icono y en que pantalla arranca.
  'manifest-estacion/route.ts',
]);

function listRoutes(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listRoutes(absolute)
      : entry.name === 'route.ts'
        ? [path.relative(API_ROOT, absolute).replaceAll('\\', '/')]
        : [];
  });
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(API_ROOT, relativePath), 'utf8');
}

describe('API route authentication boundary', () => {
  it('classifies every API route as protected or deliberately public', () => {
    const unclassified = listRoutes(API_ROOT).filter((route) => {
      if (PUBLIC_ROUTES.has(route)) return false;
      // Las rutas pensadas para consumo automatico (Looker Studio, panel de
      // marketing) no usan la sesion del navegador: validan una clave
      // compartida contra su variable de entorno y responden 401. Se listan por
      // nombre a proposito, para que una ruta nueva sin proteccion siga fallando.
      //
      // Las tareas programadas usan `abrirPuertaDeLaTarea`, que decide en un solo
      // lugar: exige la clave si esta configurada, y si no lo esta deja pasar
      // unicamente las tareas que se pueden repetir sin hacer dano, con freno. La
      // que le escribe al cliente por WhatsApp no pasa nunca sin clave.
      return !/requireAppSession|hasAppSession|verifySession|CRON_SECRET|abrirPuertaDeLaTarea|LOOKER_STUDIO_TOKEN|MARKETING_API_SECRET_KEY/.test(
        read(route),
      );
    });

    expect(unclassified).toEqual([]);
  });

  it('keeps the historic import endpoint permanently disabled', () => {
    const source = read('imports/confirmed-events-29/route.ts');
    expect(source).toContain('{ status: 410 }');
    expect(source).not.toContain('writeData(');
    expect(source).not.toContain('saveFiesta(');
  });

  it('sanitizes all public file-serving path segments', () => {
    for (const route of [
      'public-page-assets/[...parts]/route.ts',
      'social-gallery/[fiestaId]/[filename]/route.ts',
      'social-media-assets/[filename]/route.ts',
    ]) {
      expect(read(route)).toContain('path.basename(');
    }
  });

  it('cryptographically verifies both production WhatsApp providers', () => {
    const source = read('whatsapp/webhook/route.ts');
    expect(source).toContain('verifyMetaWebhookSignature(');
    expect(source).toContain('verifyTwilioWebhookSignature({');
    expect(source).toContain("contentType.includes('application/x-www-form-urlencoded')");
  });

  it('protects every public Mercado Pago boundary', () => {
    expect(read('payments/mercadopago/checkout/route.ts')).toContain(
      'getPresupuestoById(presupuestoId, token)',
    );
    const statusRoute = read('payments/mercadopago/status/route.ts');
    expect(statusRoute).toContain("/^[a-f0-9-]{36}$/i.test(sessionId)");
    expect(statusRoute).not.toContain('generateBudgetToken');
    expect(statusRoute).not.toContain('budgetUrl');
    expect(read('payments/mercadopago/webhook/route.ts')).toContain(
      'verifyMercadoPagoWebhookSignature({',
    );
  });
});
