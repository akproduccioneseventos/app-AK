import fs from 'fs';
import path from 'path';

describe('Buzón de Recuerdos: No pierde saludos sin señal (Orden 61 - Preguntas 3 y 7)', () => {
  const buzonPath = path.join(process.cwd(), 'src/app/evento/buzon/[fiestaId]/page.tsx');
  const code = fs.readFileSync(buzonPath, 'utf8');

  it('no contiene BOM UTF-8', () => {
    const buffer = fs.readFileSync(buzonPath);
    expect(buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf).toBe(false);
  });

  it('importa saveOfflineMedia desde @/lib/offline/offline-db', () => {
    expect(code).toMatch(/import\s*\{[^}]*saveOfflineMedia[^}]*\}\s*from\s*['"]@\/lib\/offline\/offline-db['"]/);
  });

  it('encola en saveOfflineMedia con moduleId: buzon cuando no hay conexion o la subida falla', () => {
    expect(code).toMatch(/saveOfflineMedia\s*\(\s*\{[\s\S]*?moduleId:\s*['"]buzon['"]/);
  });

  it('avisa al invitado que el saludo quedo guardado sin conexion y se subira luego', () => {
    expect(code).toMatch(/Tu mensaje quedó guardado sin conexión y se subirá automáticamente al volver la señal/);
  });
});
