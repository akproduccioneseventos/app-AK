import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('Orden 319 Bloque 1: editar empleado guarda y revalida', () => {
  it('saveEmpleado actualiza vía mutateDataItem y revalida las rutas de empleados', () => {
    const src = readFileSync(path.join(process.cwd(), 'src/app/actions/empleados.ts'), 'utf8');
    expect(src).toContain('mutateDataItem');
    expect(src).toContain("revalidatePath('/empleados')");
    expect(src).toContain('revalidatePath(`/empleados/${empleadoId}/editar`)');
  });
});
