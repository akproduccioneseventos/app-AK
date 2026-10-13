import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Orden 154: errores visibles y reintento de lectura en UI', () => {
  it('sincronizaciones conserva conexiones previas y presenta error persistente con reintento', () => {
    const page = read('app/(app)/settings/sincronizaciones/page.tsx');
    const loader = page.slice(page.indexOf('const cargarDatos'), page.indexOf('useEffect(() => {', page.indexOf('const cargarDatos')));

    expect(loader).toContain('setConexiones(data)');
    expect(loader).toContain('setErrorCarga(null)');
    expect(loader).toContain('setErrorCarga(');
    expect(loader).not.toMatch(/catch[\s\S]*?setConexiones\(\[\]\)/);
    expect(page).toContain('role="alert"');
    expect(page).toContain('onClick={cargarDatos}');
    expect(page).toContain('Cargando conexiones...');
  });

  it('redes sociales muestra el error y el reintento solo vuelve a leer los datos', () => {
    const page = read('app/(app)/empresa/redes-sociales/page.tsx');
    const fetcher = page.slice(page.indexOf('const fetchData'), page.indexOf('useEffect(() => {', page.indexOf('const fetchData')));
    const alert = page.slice(page.indexOf('{error && ('), page.indexOf('<SocialHistoryPanel', page.indexOf('{error && (')));

    expect(fetcher).toContain('getSocialPosts()');
    expect(fetcher).toContain('getFiestaActual()');
    expect(fetcher).toContain('getHistorialFiestas()');
    expect(fetcher).not.toMatch(/syncInstagramPosts|publishToInstagram|importHistorical/);
    expect(alert).toContain('role="alert"');
    expect(alert).toContain('onClick={fetchData}');
    expect(alert).toContain('Reintentar lectura');
  });

  it('Instagram no afirma que el historial está en curso sin un intento registrado', () => {
    const page = read('app/(app)/settings/sincronizaciones/page.tsx');
    const history = page.slice(page.indexOf('Estado del historial:'), page.indexOf('{resultadoInstagram &&'));

    expect(history).toContain('c.historial?.error');
    expect(history).toContain('c.historial?.completo');
    expect(history).toContain('c.historial?.ultimaSincronizacion');
    expect(history).toContain('Último intento fallido');
    expect(history).toContain('Historial parcial');
    expect(history).toContain('Sin intento registrado');
    expect(history).not.toContain('Sincronización en curso');
  });
});
