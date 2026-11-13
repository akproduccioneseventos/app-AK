import { enlaceDeDocumentoDelCliente } from '@/lib/clientes/enlace-documento';

describe('El documento del cliente no apunta a una computadora (Orden 285 - Bloque 3)', () => {
  it('con ruta de computadora devuelve null', () => {
    expect(enlaceDeDocumentoDelCliente('C:/Users/x/contrato.pdf', 'contracts')).toBeNull();
    expect(enlaceDeDocumentoDelCliente('C:\\Users\\x\\contrato.pdf', 'contracts')).toBeNull();
    expect(enlaceDeDocumentoDelCliente('/Users/x/contrato.pdf', 'contracts')).toBeNull();
    expect(enlaceDeDocumentoDelCliente('docs/contrato.pdf', 'contracts')).toBeNull();
  });

  it('con nombre suelto de archivo devuelve /api/<tipo>/<nombre>', () => {
    expect(enlaceDeDocumentoDelCliente('contrato.pdf', 'contracts')).toBe('/api/contracts/contrato.pdf');
    expect(enlaceDeDocumentoDelCliente('presupuesto_firmado.pdf', 'budgets')).toBe('/api/budgets/presupuesto_firmado.pdf');
    expect(enlaceDeDocumentoDelCliente('salon_contrato.pdf', 'salon-contracts')).toBe('/api/salon-contracts/salon_contrato.pdf');
  });

  it('con https:// devuelve la misma dirección', () => {
    const url = 'https://storage.googleapis.com/ak-bucket/contrato.pdf';
    expect(enlaceDeDocumentoDelCliente(url, 'contracts')).toBe(url);
  });

  it('con null, undefined o cadena vacía devuelve null', () => {
    expect(enlaceDeDocumentoDelCliente(null, 'contracts')).toBeNull();
    expect(enlaceDeDocumentoDelCliente(undefined, 'budgets')).toBeNull();
    expect(enlaceDeDocumentoDelCliente('', 'salon-contracts')).toBeNull();
    expect(enlaceDeDocumentoDelCliente('   ', 'contracts')).toBeNull();
  });
});
