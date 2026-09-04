/**
 * Orden 35 Bloque 2 — La fotocabina imprime lo que se pide.
 *
 * OJO: esta prueba es de Jest, no de navegador. Vivio dentro de tests/e2e/ y ahi
 * NO LA CORRIA NADIE: Jest ignora esa carpeta a proposito, y Playwright, al
 * encontrarse con `beforeAll` y `jest.fn()`, se caia al cargarla y **se llevaba
 * puesta la tanda entera de cuatro archivos** sin registrar ni una prueba.
 * Se descubrio el 4 de septiembre de 2026. No moverla de vuelta.
 *
 * Ademas la version original hacia `global.window = {...}`, que en jsdom no
 * reemplaza la ventana de verdad: las tres pruebas que usaban el simulacro
 * fallaban. Ahora se pone el simulacro sobre `window.open` con spyOn.
 */
import { imprimirRecuerdo } from '@/lib/entretenimiento/imprimir-recuerdo';

/** Deja un simulacro nuevo de window.open y devuelve el HTML que se escribio. */
function espiarLaVentanaDeImpresion(): () => string {
  const partes: string[] = [];
  const ventanaFalsa = {
    document: {
      write: (html: string) => {
        partes.push(html);
      },
      close: jest.fn(),
      // La funcion busca la imagen para esperar a que cargue. Sin esto se cae.
      querySelector: () => null,
    },
    focus: jest.fn(),
    print: jest.fn(),
    close: jest.fn(),
  };
  jest.spyOn(window, 'open').mockReturnValue(ventanaFalsa as unknown as Window);
  return () => partes.join('');
}

describe('Orden 35 Bloque 2: La fotocabina imprime lo que se pide', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('pedir 3 copias produce 3 paginas en el documento de impresion', () => {
    const html = espiarLaVentanaDeImpresion();

    const resultado = imprimirRecuerdo('data:image/png;base64,AAAA', 3);
    expect(resultado.ok).toBe(true);
    expect(window.open).toHaveBeenCalledWith('', '_blank', expect.stringContaining('width'));

    expect(html().match(/class="pagina"/g)?.length).toBe(3);
  });

  it('pedir 1 copia produce 1 pagina', () => {
    const html = espiarLaVentanaDeImpresion();

    expect(imprimirRecuerdo('data:image/png;base64,BBBB', 1).ok).toBe(true);
    expect(html().match(/class="pagina"/g)?.length).toBe(1);
  });

  it('sin imagen devuelve un aviso escrito para el invitado, no un error tecnico', () => {
    const resultado = imprimirRecuerdo('', 2);
    expect(resultado.ok).toBe(false);
    expect(resultado.aviso).toBeTruthy();
  });

  it('el tamano de papel cambia la medida de la hoja', () => {
    const casos: Array<[Parameters<typeof imprimirRecuerdo>[2], string]> = [
      ['5x15', '@page{size:5cm 15cm;margin:0}'],
      ['10x15', '@page{size:10cm 15cm;margin:0}'],
      ['13x18', '@page{size:13cm 18cm;margin:0}'],
    ];

    for (const [tamano, esperado] of casos) {
      const html = espiarLaVentanaDeImpresion();
      imprimirRecuerdo('data:image/png;base64,CCCC', 1, tamano);
      expect(html()).toContain(esperado);
      jest.restoreAllMocks();
    }
  });

  it('el diseno de impresion configura el formato de grilla solicitado', () => {
    const disenos = ['una', 'dos', 'tira'] as const;
    for (const diseno of disenos) {
      const html = espiarLaVentanaDeImpresion();
      const resultado = imprimirRecuerdo('data:image/png;base64,DDDD', 1, '10x15', diseno);
      expect(resultado.ok).toBe(true);
      expect(html()).toContain(`data-diseno="${diseno}"`);
      expect(html()).toContain(`foto-${diseno}`);
      expect(html().match(/class="pagina"/g)?.length).toBe(1);
      jest.restoreAllMocks();
    }
  });
});
