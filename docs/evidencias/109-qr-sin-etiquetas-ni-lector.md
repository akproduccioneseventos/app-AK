# Auditoría — QR de carga no implementa el flujo aprobado de punta a punta, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Base de la entrega: `b52b1f013d21bd2831b918fb04649636ce24033a`
Clasificación: bloque 9 de la orden 95 incompleto en la tanda pendiente; no afirmar que el usuario puede escanear con cámara o imprimir etiquetas desde la app.

## P2 — Hay un campo para teclear el QR, pero no etiquetas ni apertura del lector

La orden aprobada `docs/ordenes/95-a-la-par-del-rubro-en-toda-la-app.md`, bloque 9, pide:
1. En Activos Fijos, imprimir una hoja de etiquetas QR para cada equipo con el contenido `ak-equipo:<id>`.
2. En Carga Operativa, el botón “Escanear” abre un lector; la app ya tenía como referencia `Html5QrcodeScanner` en el scanner de invitados.

En la PR:
- `src/app/(app)/fiestas/nueva/carga-operativa/page.tsx` abre un diálogo con un `Input` de texto, y `handleScanCode` solo procesa lo escrito/pegado o recibido por un lector USB que actúe como teclado. No hay componente de cámara ni arranque del lector.
- La pantalla de catálogo `src/app/(app)/empresa/activos-fijos/page.tsx` no está entre los archivos cambiados; no se implementó la impresión/generación de etiquetas. El helper nuevo `procesarEscaneoQREquipo` solo interpreta el texto ya recibido.

Impacto: la lógica de marcar cargado/retornado existe, pero el usuario no puede completar con la app el flujo aprobado de generar etiqueta y apuntar la cámara. Solo sirve si consigue el QR por fuera y tiene un lector que escriba como teclado o pega el texto manualmente.

Recomendación: completar el ciclo de etiquetas en Activos Fijos y usar el lector QR de cámara existente en Carga Operativa; conservar el ingreso manual como alternativa. E2E debe generar/imprimir o inspeccionar el QR de un activo y luego escanearlo en la fiesta; además cubrir QR ajeno, éxito y fallo de persistencia.

## Relación con hallazgos ya compartidos

La devolución de Claude `docs/ordenes/97-devolucion-de-la-orden-95.md` ya señaló el riesgo de mostrar éxito antes de persistir si la escritura falla. No duplico ese hallazgo aquí: este documento cubre la falta del lector de cámara y del generador de etiquetas respecto del alcance del bloque 9.

## Verificación

Contraste entre orden 95 y el diff de la PR. Codex no abrió cámara, no imprimió etiquetas, no ejecutó E2E ni validó un hardware QR.
