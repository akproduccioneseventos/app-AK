import { marcadoresSinLlenar, rellenarPlantilla } from '@/lib/whatsapp/plantilla-mensaje';

/**
 * Los mensajes salen con el nombre de AK. Un marcador sin llenar en el celular
 * del cliente ("Hola {{NOMBRE}}") queda peor que no mandar nada.
 */
describe('mensajes de WhatsApp', () => {
  it('reemplaza los datos que tiene', () => {
    const texto = rellenarPlantilla('Hola {{NOMBRE}}, tu evento es el {{FECHA}}.', {
      NOMBRE: 'Valentina',
      FECHA: 'sábado 1 de agosto',
    });
    expect(texto).toBe('Hola Valentina, tu evento es el sábado 1 de agosto.');
  });

  it('no deja el marcador crudo cuando falta el dato', () => {
    const texto = rellenarPlantilla('Hola {{NOMBRE}}, el saldo es {{SALDO}}.', { NOMBRE: 'Ana' });
    expect(texto).not.toContain('{{');
    expect(texto).toContain('Ana');
  });

  it('no escribe "undefined" ni "null" en el mensaje', () => {
    const texto = rellenarPlantilla('Hola {{NOMBRE}}, el {{FECHA}}.', {
      NOMBRE: undefined,
      FECHA: null,
    });
    expect(texto).not.toMatch(/undefined|null/);
    expect(texto).not.toContain('{{');
  });

  it('no deja espacios ni comas colgando donde faltaba el dato', () => {
    const texto = rellenarPlantilla('Hola {{NOMBRE}} , ¿cómo estás?', {});
    expect(texto).toBe('Hola, ¿cómo estás?');
  });

  it('avisa cuáles marcadores quedaron sin dato', () => {
    const faltan = marcadoresSinLlenar('Hola {{NOMBRE}}, saldo {{SALDO}} para {{FECHA}}.', {
      NOMBRE: 'Ana',
      SALDO: '',
    });
    expect(faltan).toEqual(['SALDO', 'FECHA']);
  });

  it('acepta números sin romperse', () => {
    expect(rellenarPlantilla('Son {{CANTIDAD}} personas.', { CANTIDAD: 80 })).toBe('Son 80 personas.');
  });
});
