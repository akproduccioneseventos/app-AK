import fs from 'fs';
import path from 'path';

describe('Entretenimiento: Resiliencia Offline y Sesión Segura en 360 y Bogue (Orden 61)', () => {
  const p360Path = path.join(process.cwd(), 'src/app/evento/plataforma-360/[fiestaId]/page.tsx');
  const boguePath = path.join(process.cwd(), 'src/app/evento/bogue/[fiestaId]/page.tsx');

  const p360Code = fs.readFileSync(p360Path, 'utf8');
  const bogueCode = fs.readFileSync(boguePath, 'utf8');

  it('no contienen BOM UTF-8', () => {
    const b360 = fs.readFileSync(p360Path);
    const bBogue = fs.readFileSync(boguePath);
    expect(b360[0] === 0xef && b360[1] === 0xbb && b360[2] === 0xbf).toBe(false);
    expect(bBogue[0] === 0xef && bBogue[1] === 0xbb && bBogue[2] === 0xbf).toBe(false);
  });

  it('Plataforma 360 protege el finally de subida con isLiveSession', () => {
    expect(p360Code).toMatch(/finally\s*\{\s*if\s*\(\s*isLiveSession\(\)\s*\)\s*\{\s*setIsUploading\(false\);/);
  });

  it('Plataforma 360 limpia timers al reiniciar o reintentar', () => {
    expect(p360Code).toMatch(/if\s*\(\s*autoResetTimerRef\.current\s*\)\s*\{\s*clearTimeout\(autoResetTimerRef\.current\);/);
  });

  it('Bogue protege el finally de subida con isLiveSession', () => {
    expect(bogueCode).toMatch(/finally\s*\{\s*if\s*\(\s*isLiveSession\(\)\s*\)\s*\{\s*setIsUploading\(false\);/);
  });

  it('Bogue encola en saveOfflineMedia con moduleId: bogue si falla la subida', () => {
    expect(bogueCode).toMatch(/saveOfflineMedia\s*\(\s*\{[\s\S]*?moduleId:\s*['"]bogue['"]/);
  });

  it('Bogue limpia timers al reiniciar', () => {
    expect(bogueCode).toMatch(/if\s*\(\s*autoResetTimerRef\.current\s*\)\s*\{\s*clearTimeout\(autoResetTimerRef\.current\);/);
  });
});

