/**
 * MATAFUEGO: GUARDAR UN CAMBIO NO PUEDE BORRAR LO DEMAS.
 *
 * Lo reprodujo Codex el 14 de septiembre de 2026 y es de las peores que aparecieron.
 *
 * Cuando se guarda un cambio parcial —por ejemplo, solo el telefono de un contacto—
 * la app **lee lo que habia, le suma lo nuevo y guarda el conjunto entero**. Si esa
 * lectura falla —la base tardo, se corto la red— la app entendia que no habia nada y
 * **guardaba encima solo el pedacito nuevo: el resto se borraba**. Sin aviso y sin
 * error en pantalla, justo cuando la base anda mal, que es cuando mas duele.
 *
 * Lo que se comprueba aca es lo unico que importa: **con la lectura fallando, NO se
 * guarda nada**, y el que llamo se entera.
 *
 * Se probo rompiendolo: devolviendo la lectura fallada como si fuera un documento
 * vacio, la primera comprobacion se pone en rojo.
 */

const mockSync = jest.fn();
const mockLeerParaGuardar = jest.fn();
const mockSyncToFirestore = jest.fn();

jest.mock('@/lib/generic-json-store', () => ({
  readGenericJsonFile: jest.fn(async () => null),
  syncGenericJsonFile: (...args: unknown[]) => mockSync(...args),
  leerGenericJsonParaGuardarEncima: (...args: unknown[]) => mockLeerParaGuardar(...args),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: {} }));

import { updateDataPartial } from '@/lib/data-service';

describe('guardar un cambio no borra el resto', () => {
  // El guardado deja una copia local de respaldo. Si no existia antes, la prueba la
  // borra al terminar: las pruebas no ensucian el repositorio, y un archivo suelto
  // parece trabajo pendiente cuando no lo hay.
  const fs = require('fs');
  const path = require('path');
  const copias = [
    path.join(process.cwd(), 'data', 'settings.json'),
    path.join(process.cwd(), 'src', 'data', 'settings.json'),
  ];
  const existiaAntes = copias.map((c: string) => fs.existsSync(c));

  afterAll(() => {
    copias.forEach((c: string, i: number) => {
      if (!existiaAntes[i] && fs.existsSync(c)) fs.unlinkSync(c);
    });
  });


  beforeEach(() => {
    mockSync.mockReset();
    mockLeerParaGuardar.mockReset();
    mockSyncToFirestore.mockReset();
  });

  it('si NO se pudo leer lo que habia, no se guarda nada', async () => {
    mockLeerParaGuardar.mockResolvedValue({ sePudoLeer: false, datos: null });

    await expect(
      updateDataPartial('settings.json', { telefono: '099111222' } as any),
    ).rejects.toThrow();

    // Lo unico que de verdad importa: no se escribio encima.
    expect(mockSync).not.toHaveBeenCalled();
  });

  it('si se pudo leer, se guarda lo viejo junto con lo nuevo', async () => {
    mockLeerParaGuardar.mockResolvedValue({
      sePudoLeer: true,
      datos: { nombre: 'AK Producciones', direccion: 'Salto' },
    });

    await updateDataPartial('settings.json', { telefono: '099111222' } as any).catch(() => null);

    const guardado = mockSync.mock.calls[0]?.[1];
    expect(guardado).toBeDefined();
    // Lo nuevo entra y lo viejo SIGUE estando.
    expect(guardado.telefono).toBe('099111222');
    expect(guardado.nombre).toBe('AK Producciones');
    expect(guardado.direccion).toBe('Salto');
  });
});
