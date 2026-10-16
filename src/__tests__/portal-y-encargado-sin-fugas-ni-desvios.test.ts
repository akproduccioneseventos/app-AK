import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

// Los atajos y el botón Documentos del portal llevan a pantallas del cliente (/portal/[fiestaId]/contrato,
// /portal-cliente/[id]/musica), nunca a las del equipo.
describe('Portal del cliente sin desvíos', () => {
  it('el módulo Documentos del portal del cliente lleva al contrato y no al menú de comida', () => {
    const portalSource = fs.readFileSync(path.join(RAIZ, 'src/app/portal/page.tsx'), 'utf8');
    const lineaDocumentos = portalSource
      .split('\n')
      .find((line) => line.includes("id: 'documentos'"));

    expect(lineaDocumentos).toBeDefined();
    expect(lineaDocumentos).toContain('/portal/${id}/contrato');
    expect(lineaDocumentos).not.toContain('/portal-cliente/${id}/menu');
  });

  it('los atajos de módulos del portal nunca mandan al cliente a las pantallas privadas del equipo (/fiestas/nueva)', () => {
    const redirectSource = fs.readFileSync(
      path.join(RAIZ, 'src/app/portal/[fiestaId]/[module]/page.tsx'),
      'utf8'
    );

    expect(redirectSource).not.toContain('/fiestas/nueva/');
    expect(redirectSource).toContain('/portal-cliente/${fiestaId}/musica');
    expect(redirectSource).toContain('/portal-cliente/${fiestaId}/fotos-video');
    expect(redirectSource).toContain('/portal/${fiestaId}/contrato');
  });
});
