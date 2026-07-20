import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('barra publica y base de totem', () => {
  const barPage = read('src/app/evento/barra/[fiestaId]/page.tsx');
  const barmanPage = read('src/app/evento/barra/[fiestaId]/barman/page.tsx');
  const totemPage = read('src/app/evento/totem/[fiestaId]/[totemId]/page.tsx');
  const setup = read('src/components/kiosk/kiosk-setup.tsx');

  it('mantiene una carta tactil con categorias, datos del trago y pedido identificado', () => {
    expect(barPage).toContain('getDrinkTags');
    expect(barPage).toContain('aria-label="Categorias de tragos"');
    expect(barPage).toContain('getDrinkDescription(selectedDrink)');
    expect(barPage).toContain('createBarDrinkOrder');
    expect(barPage).toContain('lastOrder.status');
  });

  it('limita los botones del barman a transiciones del contrato', () => {
    expect(barmanPage).toContain("nuevo: ['preparando', 'cancelado']");
    expect(barmanPage).toContain("preparando: ['listo', 'cancelado']");
    expect(barmanPage).toContain("listo: ['entregado']");
    expect(barmanPage).toContain('ALLOWED_NEXT_STATUS[order.status]?.includes(status)');
    expect(barmanPage).toContain('updateBarDrinkOrderStatus');
  });

  it('usa la configuracion publica exacta del totem y no expone desbloqueo en reproduccion', () => {
    expect(totemPage).toContain('find((item) => item.id === totemId)');
    expect(totemPage).toContain('data-totem-id={totem.id}');
    expect(totemPage).not.toContain('KioskUnlockButton');
  });

  it('obliga a elegir un identificador de totem antes de bloquear el dispositivo', () => {
    expect(setup).not.toContain("useState('totem-1')");
    expect(setup).toContain("savedRole !== 'totem' || savedTotemId.trim()");
    expect(setup).toContain("selectedRole === 'totem' && !totemId.trim()");
    expect(setup).toContain("localStorage.setItem('kiosk_totem_id', totemId.trim())");
  });
});
