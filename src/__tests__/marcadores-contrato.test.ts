import {
  conSinonimos,
  marcadoresDesconocidos,
  SINONIMOS_DE_MARCADORES,
} from '@/lib/contratos/marcadores';

/**
 * Defecto real: habia DOS nombres para lo mismo. El editor de plantillas ofrece
 * `{{CLIENTE_DIRECCION}}` y el contrato original usa `{{CLIENTE_DOMICILIO}}`.
 * El generador solo reemplazaba el primero, asi que una plantilla copiada del
 * contrato original salia impresa con `{{CLIENTE_DOMICILIO}}` escrito en el
 * papel que firma el cliente.
 */

describe('marcadores de las plantillas de contrato', () => {
  it('el domicilio del cliente se completa con los dos nombres', () => {
    const tabla = conSinonimos({ '{{CLIENTE_DIRECCION}}': 'Gaboto 3390' });
    expect(tabla['{{CLIENTE_DIRECCION}}']).toBe('Gaboto 3390');
    expect(tabla['{{CLIENTE_DOMICILIO}}']).toBe('Gaboto 3390');
  });

  it('los otros sinonimos tambien apuntan al mismo valor', () => {
    const tabla = conSinonimos({
      '{{EVENTO_FECHA}}': '05/09/2026',
      '{{EVENTO_SALON}}': 'Club Uruguay',
      '{{SENIA}}': '$ 20.000',
    });
    expect(tabla['{{FECHA_EVENTO}}']).toBe('05/09/2026');
    expect(tabla['{{SALON}}']).toBe('Club Uruguay');
    expect(tabla['{{MONTO_SENA}}']).toBe('$ 20.000');
  });

  it('no pisa un sinonimo que ya venia con valor propio', () => {
    const tabla = conSinonimos({
      '{{CLIENTE_DIRECCION}}': 'Gaboto 3390',
      '{{CLIENTE_DOMICILIO}}': 'Otro domicilio',
    });
    expect(tabla['{{CLIENTE_DOMICILIO}}']).toBe('Otro domicilio');
  });

  it('avisa de los datos que el sistema no sabe completar', () => {
    const texto = 'Hola {{CLIENTE_NOMBRE}}, tu evento en {{SALON}} el {{LO_QUE_SEA}}.';
    expect(marcadoresDesconocidos(texto)).toEqual(['{{LO_QUE_SEA}}']);
  });

  it('no marca como desconocidos ni los buenos ni los sinonimos', () => {
    const texto = Object.keys(SINONIMOS_DE_MARCADORES).join(' ') + ' {{CLIENTE_NOMBRE}}';
    expect(marcadoresDesconocidos(texto)).toEqual([]);
  });

  it('no repite el mismo aviso dos veces', () => {
    expect(marcadoresDesconocidos('{{XX}} y {{XX}}')).toEqual(['{{XX}}']);
  });

  it('rechaza marcadores con espacios, guiones o llaves incompletas', () => {
    expect(marcadoresDesconocidos('{{ FECHA_EVENTO }} {{NUMERO-CLIENTE}} {{SIN_CERRAR')).toEqual([
      '{{ FECHA_EVENTO }}',
      '{{NUMERO-CLIENTE}}',
      'marcador incompleto',
    ]);
  });
});
