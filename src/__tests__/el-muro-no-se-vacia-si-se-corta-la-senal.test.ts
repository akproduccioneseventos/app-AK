/**
 * Revisión de la orden 94 (28/09/2026): la entrega le había puesto `.catch(() => [])` a la
 * lectura de las fotos del muro. Con un corte de señal la lista llegaba vacía, la pantalla
 * gigante quedaba en blanco y se apagaba el aviso de "reconectando". La falla tiene que llegar
 * al manejo de reconexión, que conserva lo último que se mostró.
 */
import fs from 'fs';
import path from 'path';

const muro = fs.readFileSync(path.join(process.cwd(), 'src/app/evento/muro-en-vivo/[fiestaId]/page.tsx'), 'utf8');

it('la lectura de fotos y del evento no se traga la falla', () => {
  expect(muro).not.toMatch(/getPublicSocialPosts\(fiestaId\)\s*\.catch/);
  expect(muro).not.toMatch(/getPublicSocialEvent\(fiestaId\)\s*\.catch/);
  expect(muro).toMatch(/setIsReconnecting\(true\)/);
});
