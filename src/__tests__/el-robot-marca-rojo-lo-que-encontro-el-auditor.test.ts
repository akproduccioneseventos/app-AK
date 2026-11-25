/**
 * @jest-environment jsdom
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  evaluarCartelExitoSinConfirmacion,
  evaluarComparacionBotonesPresupuesto,
  evaluarContexto,
  evaluarLecturaFallidaNoEsCero,
  evaluarListaTrasCancelar,
  evaluarNoSeCae,
  evaluarPublicoSinBorradores,
} from '../../tests/robot/reglas';
import { inspeccionarPdfBuffer } from '../../tests/robot/pdf-inspector';
import {
  ROBOT_FIESTA_A_ID,
  ROBOT_FIESTA_A_NOMBRE,
  ROBOT_FIESTA_B_NOMBRE,
  ROBOT_MENU_BORRADOR_NOMBRE,
  ROBOT_MUESTRA_NOMBRE,
  ROBOT_SERVICIO_BORRADOR_NOMBRE,
} from '../../tests/robot/sembrar';

describe('Orden 339: el robot marca rojo los defectos del informe del auditor', () => {
  it('Caso 1 (video-vida.tsx con getFiestaActual()): marca rojo cuando muestra la fiesta de muestra en vez de la de la URL', () => {
    // El defecto ya se arregló en la app (orden 338): la copia rota se arma abajo, no se exige en el código.

    // Copia rota: renderiza el resultado de getFiestaActual() (fiesta de muestra)
    const pantallaRota = `
      Video de Vida — ${ROBOT_MUESTRA_NOMBRE} (fiesta_muestra_auditor)
      Enlace para el cliente: /portal/fiesta_muestra_auditor
    `;
    const resRoto = evaluarContexto({
      textoVisible: pantallaRota,
      hrefs: [`/fiestas/nueva?fiestaId=${ROBOT_FIESTA_A_ID}`],
      fiestaEsperadaNombre: ROBOT_FIESTA_A_NOMBRE,
      otraFiestaNombre: ROBOT_FIESTA_B_NOMBRE,
      exigirFiestaEsperada: true,
    });
    expect(resRoto.estado).toBe('rojo');

    // Copia sana: muestra la fiesta pedida en la URL
    const pantallaSana = `
      Video de Vida — ${ROBOT_FIESTA_A_NOMBRE}
      Enlace para el cliente: /portal/${ROBOT_FIESTA_A_ID}
    `;
    const resSano = evaluarContexto({
      textoVisible: pantallaSana,
      hrefs: [`/fiestas/nueva?fiestaId=${ROBOT_FIESTA_A_ID}`],
      fiestaEsperadaNombre: ROBOT_FIESTA_A_NOMBRE,
      otraFiestaNombre: ROBOT_FIESTA_B_NOMBRE,
      exigirFiestaEsperada: true,
    });
    expect(resSano.estado).toBe('verde');
  });

  it('Caso 2 (carta-tragos.tsx con "Destornillador"): marca rojo cuando cancelar deja el trago en la lista', () => {
    const cartaTragosSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/fiestas/panels/carta-tragos.tsx'),
      'utf8',
    );
    expect(cartaTragosSrc).toContain('Destornillador');

    const itemsAntes = ['Mojito Clásico'];
    // Copia rota: handleAddCustomDrink mete 'Destornillador' antes de confirmar y al cancelar queda
    const itemsTrasCancelarRoto = ['Destornillador', 'Mojito Clásico'];
    const resRoto = evaluarListaTrasCancelar({
      itemsAntes,
      itemsDespues: itemsTrasCancelarRoto,
    });
    expect(resRoto.estado).toBe('rojo');
    expect(resRoto.motivo).toContain('Destornillador');

    // Copia sana: al cancelar el diálogo, la lista queda idéntica
    const resSano = evaluarListaTrasCancelar({
      itemsAntes,
      itemsDespues: ['Mojito Clásico'],
    });
    expect(resSano.estado).toBe('verde');
  });

  it('Caso 3 (carga-operativa.tsx con "Tildes sincronizadas online"): marca rojo si afirma sincronizado cuando el servidor falló', () => {
    // El defecto ya se arregló en la app (orden 338): la copia rota se arma abajo, no se exige en el código.

    // Copia rota: cartel fijo aunque la petición al servidor abortó
    const resRoto = evaluarCartelExitoSinConfirmacion({
      servidorFallo: true,
      textoVisible: 'Encargado de carga  Tildes sincronizadas online  Cabina DJ Principal',
    });
    expect(resRoto.estado).toBe('rojo');
    expect(resRoto.motivo).toMatch(/Tildes sincronizadas/i);

    // Copia sana: cuando el servidor falla, avisa el error y no muestra cartel de sincronizado
    const resSano = evaluarCartelExitoSinConfirmacion({
      servidorFallo: true,
      textoVisible: 'Encargado de carga  Error al guardar los cambios. Reintentá.',
    });
    expect(resSano.estado).toBe('verde');
  });

  it("Caso 4 (mi-dia--alertas.tsx con fiestaId: ''): marca rojo cuando rompe la pantalla o tira error en consola", () => {
    // El defecto ya se arregló en la app (orden 338): la copia rota se arma abajo, no se exige en el código.

    // Copia rota: SelectItem con value="" tira error en React/Radix y activa ErrorBoundary ("¡Ups! Algo salió mal")
    const resRoto = evaluarNoSeCae({
      textoVisible: '¡Ups! Algo salió mal en esta pantalla.',
      consoleErrors: ['Error: A <Select.Item /> must have a value prop that is not an empty string.'],
      pageErrors: ['A <Select.Item /> must have a value prop that is not an empty string.'],
    });
    expect(resRoto.estado).toBe('rojo');

    // Copia sana: sin fiestaId vacío, la pantalla abre limpia
    const resSano = evaluarNoSeCae({
      textoVisible: 'Centro de Alertas. Todas las notificaciones al día.',
      consoleErrors: [],
      pageErrors: [],
    });
    expect(resSano.estado).toBe('verde');
  });

  it('Reglas adicionales (enlaces rotos, borradores públicos, PDF vacío, lectura fallida como cero, botones LED)', async () => {
    // Enlace con undefined y marcador {SENIA} sin reemplazar
    const resLink = evaluarContexto({
      textoVisible: 'Seña requerida: {SENIA}',
      hrefs: ['/evento/hub/undefined?fiestaId='],
    });
    expect(resLink.estado).toBe('rojo');

    // Borradores o muestra visibles en lo público
    const resPublico = evaluarPublicoSinBorradores({
      textoVisible: `Catálogo público: ${ROBOT_MENU_BORRADOR_NOMBRE} y ${ROBOT_SERVICIO_BORRADOR_NOMBRE}`,
      borradoresProhibidos: [ROBOT_MENU_BORRADOR_NOMBRE, ROBOT_SERVICIO_BORRADOR_NOMBRE],
    });
    expect(resPublico.estado).toBe('rojo');

    // Lectura fallida que muestra $0 sin aviso
    const resCero = evaluarLecturaFallidaNoEsCero({
      textoVisible: 'Total recaudado: $0  0 clientes activos',
      lecturaAbortada: true,
    });
    expect(resCero.estado).toBe('rojo');

    // Plan de pagos con datos distintos al Presupuesto Manual
    const resBotones = evaluarComparacionBotonesPresupuesto({
      datosPresupuestoManual: { cliente: 'Ana', fecha: '2026-12-15', adultos: 100 },
      datosPlanPagos: { cliente: 'Ana', fecha: '', adultos: 0 },
    });
    expect(resBotones.estado).toBe('rojo');

    // PDF vacío / inválido
    const resPdf = await inspeccionarPdfBuffer(Buffer.from('no-es-un-pdf'));
    expect(resPdf.ok).toBe(false);
  });
});
