# Auditoría — hoja imprimible de orden de evento, PR #1240

Fecha: 2026-09-28
HEAD candidato: `79dae2cd75f1ffc572f28f6ee890174c3912fff8`
Clasificación: limitación funcional visible en la candidata; impresión real no verificada. No es un defecto confirmado de producción.

## P2 — La orden impresa corta la carga operativa a seis ítems por categoría sin indicarlo

En `src/app/(app)/fiestas/nueva/orden-de-evento/page.tsx`, la sección “Equipamiento y Carga” renderiza `(cat.items || []).slice(0, 6)`. Si una categoría contiene siete o más elementos, los adicionales no aparecen ni hay contador/enlace que indique que la lista está recortada. La página se presenta como hoja operativa para el equipo y ofrece imprimirla.

Impacto: quien usa la impresión como checklist puede preparar, transportar o devolver material incompleto creyendo que vio la categoría entera.

Recomendación: imprimir todos los elementos, o mostrar explícitamente “se muestran 6 de N” y proporcionar una hoja de carga completa complementaria. La prueba E2E debe sembrar una categoría con más de seis elementos y verificar que el impreso no oculte los restantes o advierta claramente que hay otra página/lista.

## Verificación

Código exacto inspeccionado en la sección operativa. El E2E nuevo valida horario, nombre de empleado y ausencia del signo de dinero, pero no crea carga operativa ni prueba impresión. Codex no ejecutó E2E ni validó paginación/estilos de impresión en navegador.
