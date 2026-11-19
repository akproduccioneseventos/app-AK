# Estado actual — 19 de noviembre de 2026 (tarde)

Rama de trabajo de Claude: `claude/app-debug-stabilize-m70e6z` (sólo esta hoja; se junta con la próxima tanda).

## Publicado
- **#1441** (19/11): entrega 1429 de Gemini (órdenes 310-318) + arreglos de Claude de las auditorías del 18/11 (plan de
  pagos según cláusula 3, anexo y recibo, ganancia con personal, compras sin presupuesto, celíaco, menores del LED,
  afinador, importador, orden de la noche que cruza medianoche) + órdenes 320 y 321. La 1429 quedó cerrada.

## Entrega 1443 de Gemini (382 → 185 pantallas): DEVUELTA con la orden 322
- En `claude/juntar-1443` con los arreglos de Claude: redirecciones que tapaban presupuestos y Nueva fiesta, cinco pantallas
  que se usan devueltas (Entrar, decoración y moodboard del portal, simulador y Sofía), avisos en Mi día, datos fuera.
- Falta: 39 pruebas de pantallas que fallan y las pruebas de Jest que Gemini ablandó. Gemini sigue en esa rama.

## Para Gemini (ya en GEMINI.md de la principal)
- Lo DEVUELTO de la 318 (precarga de "modificar confirmación") y `docs/pantallas-rotas-conocidas.json`.
- **Orden 319, 320** (sorteo, cronograma con `ordenarPorHoraDelEvento` que ya existe, Vendedor, AK Editor, etc.).
- **Orden 321, la grande:** achicar de 382 a 180 páginas o menos, seis áreas, sin papelería (menú digital en el hub).
- Todo en UNA propuesta.

## Para Claude, cuando llegue la próxima entrega
- Revisar con lupa lo que toque plata en la 321 (sólo se mueve, no cambia cómo guarda).
- Datos de `src/data/`: antes de devolver uno, `git log -1 -- <archivo>` (error 58).

## Ojo
- Con todas las pruebas de navegador, alguna falla sola por carga; si la app no cambió, la puerta repite sólo esa.
