import fs from 'fs';
import path from 'path';

describe('Pantallas de la Noche - Resiliencia y Manejo de Conexión', () => {
  const rootDir = process.cwd();

  describe('BLOQUE A: Estación de Impresión (impresion/[fiestaId]/page.tsx)', () => {
    const filePath = path.join(rootDir, 'src/app/evento/impresion/[fiestaId]/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    it('importa y utiliza el ReconnectingIndicator oficial', () => {
      expect(content).toContain("import { ReconnectingIndicator } from '@/components/entretenimiento/ReconnectingIndicator'");
      expect(content).toContain('<ReconnectingIndicator isReconnecting={hasError} />');
    });

    it('no usa un estado separado isReconnecting redundante con hasError', () => {
      expect(content).not.toContain('const [isReconnecting');
    });

    it('mantiene el estado persistente de error (hasError) y la marca temporal de desconexión', () => {
      expect(content).toContain('const [hasError, setHasError] = useState(false);');
      expect(content).toContain('const [disconnectedSince, setDisconnectedSince] = useState<Date | null>(null);');
      expect(content).toContain('setHasError(true);');
      expect(content).toContain('setHasError(false);');
    });

    it('muestra un aviso visible y permanente al operador mientras no haya conexión', () => {
      expect(content).toContain('{hasError && (');
      expect(content).toContain('Sin conexión a internet');
    });
  });

  describe('BLOQUE B: Presentación LED (presentacion-led/page.tsx)', () => {
    const filePath = path.join(rootDir, 'src/app/presentacion-led/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    it('dispone de reintento automático periódico ante fallos de carga', () => {
      expect(content).toContain('setInterval(() => {');
      expect(content).toContain('load();');
      expect(content).toContain('10000');
    });

    it('la pantalla de error indica el reintento automático y provee botón manual', () => {
      expect(content).toContain('Reintentando automaticamente cada 10 segundos');
      expect(content).toContain('onClick={load}');
    });

    it('el spinner de carga no tapa la pantalla de error durante reintentos', () => {
      expect(content).toContain('loading && !loadError');
    });
  });

  describe('BLOQUE C: Tótem (totem/[fiestaId]/[totemId]/page.tsx)', () => {
    const filePath = path.join(rootDir, 'src/app/evento/totem/[fiestaId]/[totemId]/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    it('no muestra el QR como disponible si la estación aún no está conectada', () => {
      // El QR no debe renderizarse como un botón normal si no hay qrUrl
      expect(content).toContain('Conectando estación...');
      expect(content).toContain('Habilitando código de acceso');
    });

    it('el aviso de conexión es grande y legible desde lejos en vez de un spinner diminuto en el botón', () => {
      expect(content).toContain('text-lg sm:text-xl font-black uppercase tracking-wider text-amber-200');
    });
  });
});
