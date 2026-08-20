import * as fs from 'fs';
import * as path from 'path';
import { ejecutarAuditoria } from '../../scripts/auditoria.mjs';

describe('Orden 4: La auditoría que corre sola', () => {
  it('el script scripts/auditoria.mjs existe y se ejecuta correctamente', () => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'auditoria.mjs');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('ejecutarAuditoria genera el archivo auditoria-out/informe.md con los 4 números de resumen', () => {
    const resultado = ejecutarAuditoria();

    expect(resultado.informePath).toBeTruthy();
    expect(fs.existsSync(resultado.informePath)).toBe(true);

    const contenido = fs.readFileSync(resultado.informePath, 'utf8');

    // 1. Encabezado y fecha
    expect(contenido).toContain('# Informe de Auditoría Mecánica Continua');
    expect(contenido).toContain('## Resumen de Resultados (4 Números)');

    // 2. Las 4 pasadas presentes
    expect(contenido).toContain('Pasada 1: ¿Dejó rastro?');
    expect(contenido).toContain('Pasada 2: ¿Alguien lo llama?');
    expect(contenido).toContain('Pasada 3: ¿Muestra datos inventados?');
    expect(contenido).toContain('Pasada 4: ¿Se cumple lo que promete la pantalla?');

    // 3. Tipos numéricos en el resultado
    expect(typeof resultado.pasada1).toBe('number');
    expect(typeof resultado.pasada2).toBe('number');
    expect(typeof resultado.pasada3).toBe('number');
    expect(typeof resultado.pasada4).toBe('number');
  });

  it('el comando auditoria está declarado en package.json', () => {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    expect(pkg.scripts.auditoria).toBe('node scripts/auditoria.mjs');
  });
});
