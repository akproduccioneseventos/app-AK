import fs from 'fs';
import path from 'path';

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('public simulator identity boundaries', () => {
  it('does not persist assistant budgets under shared placeholder identities', () => {
    const source = read('src/app/simulador-ak/page.tsx');

    expect(source).not.toContain("clienteNombre.trim() || 'Cliente Chat'");
    expect(source).not.toContain("clienteContacto || '099000000'");
    expect(source).toContain('isValidUruguayMobile(normalizedPhone)');
  });

  it('rate limits phone-based budget history without collapsing multiple budgets', () => {
    const source = read('src/app/actions/armado-rapido.ts');

    expect(source).toContain("scope: 'public-budget-history'");
    expect(source).toContain('.limit(20)');
    expect(source).toContain('.slice(0, 20)');
  });

  it('does not use a browser-only countdown as a reservation promise', () => {
    const source = read('src/app/simulador-de-presupuesto/page.tsx');

    expect(source).not.toContain('setTimeLeft');
    expect(source).not.toContain('antes de que expire la reserva');
    expect(source).toContain('la reserva queda confirmada únicamente cuando AK valida la fecha');
  });
});
