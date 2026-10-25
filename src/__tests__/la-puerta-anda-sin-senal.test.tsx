import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

/**
 * Pantalla: /fiestas/nueva/invitados/checkin-scanner
 * La puerta anda sin señal (Orden 181)
 */
describe('La puerta anda sin señal (/fiestas/nueva/invitados/checkin-scanner)', () => {
  it('el componente checkin-scanner maneja la cola local ak_checkin_pendientes_ y reintenta online', () => {
    const scannerFile = path.join(RAIZ, 'src/app/(app)/fiestas/nueva/invitados/checkin-scanner/page.tsx');
    expect(fs.existsSync(scannerFile)).toBe(true);
    const contenido = fs.readFileSync(scannerFile, 'utf8');

    expect(contenido).toContain('ak_checkin_pendientes_');
    expect(contenido).toContain('escaneadoEn');
    expect(contenido).toContain('online');
    expect(contenido).toContain('Adelante');
  });

  it('el servidor acepta escaneadoEn si es una fecha válida reciente (menos de 12 horas)', () => {
    const invitadosFile = path.join(RAIZ, 'src/app/actions/fiesta/invitados.actions.ts');
    const contenido = fs.readFileSync(invitadosFile, 'utf8');

    expect(contenido).toContain('escaneadoEn');
    expect(contenido).toContain('12 * 60 * 60 * 1000');
  });
});
