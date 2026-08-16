import {
  elegirFotoDePortada,
  fotoDePortadaPorTipo,
  FOTO_DE_PORTADA_GENERICA,
} from '@/lib/portal/foto-de-portada';
import { datosQueFaltanEnElPortal } from '@/lib/portal/datos-que-faltan';

describe('la foto con la que abre el portal del cliente', () => {
  it('usa la foto de la fiesta antes que cualquier otra cosa', () => {
    const elegida = elegirFotoDePortada(
      ['https://ak.uy/sofia.jpg', 'https://ak.uy/otra.jpg'],
      'Quinceañera'
    );

    expect(elegida).toBe('https://ak.uy/sofia.jpg');
  });

  it('saltea las que estan vacias o en blanco', () => {
    const elegida = elegirFotoDePortada([null, '', '   ', 'https://ak.uy/real.jpg'], '15');

    expect(elegida).toBe('https://ak.uy/real.jpg');
  });

  it('nunca deja el portal sin foto', () => {
    const elegida = elegirFotoDePortada([null, undefined, ''], 'Casamiento');

    // Foto propia de la app: nunca un enlace a otro sitio.
    expect(elegida).toMatch(/^\/media\//);
  });

  it('reconoce el tipo de evento con acentos y mayusculas', () => {
    expect(fotoDePortadaPorTipo('Quinceañera')).toBe(fotoDePortadaPorTipo('quinceanera'));
    expect(fotoDePortadaPorTipo('CUMPLEAÑOS')).toBe(fotoDePortadaPorTipo('cumpleanos'));
  });

  it('cae en la generica cuando el tipo no dice nada', () => {
    expect(fotoDePortadaPorTipo('')).toBe(FOTO_DE_PORTADA_GENERICA);
    expect(fotoDePortadaPorTipo('otro')).toBe(FOTO_DE_PORTADA_GENERICA);
  });
});

describe('que le falta al portal antes de mandarlo', () => {
  it('no marca nada cuando esta completo', () => {
    expect(
      datosQueFaltanEnElPortal({
        nombreEvento: 'Los 15 de Sofia',
        accessKey: 'cliente-vip-sofia-abc123',
        fechaEvento: '2026-11-20',
        tienePresupuesto: true,
      })
    ).toEqual([]);
  });

  it('detecta el nombre que pone el sistema solo', () => {
    const faltan = datosQueFaltanEnElPortal({
      nombreEvento: 'Nuevo Evento',
      accessKey: 'cliente-vip-x',
      fechaEvento: '2026-11-20',
      tienePresupuesto: true,
    });

    expect(faltan).toEqual(['El nombre de la fiesta']);
  });

  it('detecta el enlace de ejemplo que viene de fabrica', () => {
    const faltan = datosQueFaltanEnElPortal({
      nombreEvento: 'Los 15 de Sofia',
      accessKey: 'CLIENTE1',
      fechaEvento: '2026-11-20',
      tienePresupuesto: true,
    });

    expect(faltan).toEqual(['El enlace propio del cliente']);
  });

  it('junta todo lo que falta, en orden', () => {
    expect(datosQueFaltanEnElPortal({})).toEqual([
      'El nombre de la fiesta',
      'El enlace propio del cliente',
      'La fecha del evento',
      'El presupuesto',
    ]);
  });
});

describe('el portal del cliente no muestra notas internas del equipo', () => {
  it('el aviso de datos faltantes no vive en la pantalla publica', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const publico = fs.readFileSync(
      path.join(process.cwd(), 'src/app/portal/c/[accessKey]/PublicPortalClientExperience.tsx'),
      'utf8'
    );

    // Le hablaba al equipo -"antes de enviarlo al cliente final"- en la propia
    // pantalla del cliente.
    expect(publico).not.toContain('antes de enviarlo al cliente final');
    expect(publico).not.toContain('todavía necesita datos reales');
  });

  it('el aviso vive en la pantalla interna, donde se completan los datos', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const interno = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/portal-cliente/page.tsx'),
      'utf8'
    );

    expect(interno).toContain('datosQueFaltanEnElPortal');
    expect(interno).toContain('Antes de mandarle el portal al cliente');
  });
});
