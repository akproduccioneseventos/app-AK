# Estado actual — 24 de noviembre de 2026

## Publicado
- #1462 a #1465, #1471, y las entregas 336 a 342 de Gemini juntas con los arreglos de Claude.

## Rama actual (`gemini/orden-343`) — Verificada y lista en PR (sin fusionar)
- **Orden 343 — El simulador que vende solo**: bienvenida mobile-first con botón rojo de marca, 4 pasos, `DEFAULT_STATS`, 6 respuestas a miedos, testimonios y fotos reales en el bootstrap, conteo dinámico de `esRegalo`, rojo/cálido sin `bg-indigo-*`, `framer-motion` respetando `prefers-reduced-motion`. Interruptor `mostrarPrecios` en Ajustes (`budget-display.tsx`) que oculta precios sueltos hasta que el presupuesto pasa a `Aceptado`/`Facturado` o contrato firmado (incluye vista normal de `/presupuestos/[id]/ver` y PDF de `/simulador-ak`). Comparación exacta `mismoTipoDeEvento` y paquetes sugeridos en `src/types/armado-rapido.ts` y `generarPaquetesSugeridosPorTipo` (5 tipos × 3 niveles).
- **Orden 344 — Presentación LED**: layout flex `h-[100dvh]` separando escenario y barra inferior fija sin solapes, fotos únicas reales en `public/media/catalogo-servicios/`, textos reales sin promesas, plan de pagos usando `bookingDepositAmount` de Ajustes, cierre unificado.
- **Orden 345 — Ajuste anual 15%, Cargar contrato IA y Empezar 2027**: campo `tipoAjusteAnual?: 'acumulativo' | 'simple'` (`acumulativo` por defecto), nota unificada sin montos de años futuros, botón "Cargar contrato" en `/presupuestos/nuevo` con borrador asistido en `/presupuestos/nuevo/crear` sin guardar sin confirmación manual, textos de contratos en `src/lib/contratos/generar-textos-contrato.ts`, y migración idempotente `empezar-2027` (solo perfil dueño, con respaldo completo obligatorio antes de borrar `< 2027`).

## Recordatorio
- Revisar línea por línea sin auto-merge ni publicar automáticamente. Seguimos con auditoría profunda 0 errores en rama separada.
