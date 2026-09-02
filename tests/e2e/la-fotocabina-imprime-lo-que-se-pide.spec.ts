import { imprimirRecuerdo } from '@/lib/entretenimiento/imprimir-recuerdo';

// Mock de window.open para probar que se abren N ventanas con N páginas
const openedDocs: string[] = [];

beforeAll(() => {
  global.window = {
    open: jest.fn().mockImplementation(() => {
      const doc: string[] = [];
      return {
        document: {
          write: (html: string) => doc.push(html),
          close: jest.fn(),
        },
        focus: jest.fn(),
        print: jest.fn(),
        // guardamos el html para poder revisarlo
        _html: () => doc.join(''),
      };
    }),
  } as any;
});

describe('Orden 35 Bloque 2: La fotocabina imprime lo que se pide', () => {
  it('pedir 3 copias produce 3 páginas en el documento de impresión', () => {
    const imagenFalsa = 'data:image/png;base64,AAAA';

    // Llamar con 3 copias
    const resultado = imprimirRecuerdo(imagenFalsa, 3);
    expect(resultado.ok).toBe(true);

    // Verificar que se creó la ventana
    expect(window.open).toHaveBeenCalledWith('', '_blank', expect.stringContaining('width'));

    // El HTML generado debe tener 3 elementos class="pagina"
    const ventana = (window.open as jest.Mock).mock.results[0].value;
    const html: string = ventana._html();
    const matches = html.match(/class="pagina"/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(3);
  });

  it('pedir 1 copia produce 1 página', () => {
    const imagenFalsa = 'data:image/png;base64,BBBB';
    jest.clearAllMocks();

    // Re-mockear window.open
    (window.open as jest.Mock).mockImplementation(() => {
      const doc: string[] = [];
      return {
        document: { write: (html: string) => doc.push(html), close: jest.fn() },
        focus: jest.fn(),
        print: jest.fn(),
        _html: () => doc.join(''),
      };
    });

    const resultado = imprimirRecuerdo(imagenFalsa, 1);
    expect(resultado.ok).toBe(true);

    const ventana = (window.open as jest.Mock).mock.results[0].value;
    const html: string = ventana._html();
    const matches = html.match(/class="pagina"/g);
    expect(matches?.length).toBe(1);
  });

  it('sin imagen devuelve error amigable', () => {
    const resultado = imprimirRecuerdo('', 2);
    expect(resultado.ok).toBe(false);
    expect(resultado.aviso).toBeTruthy();
  });
});

