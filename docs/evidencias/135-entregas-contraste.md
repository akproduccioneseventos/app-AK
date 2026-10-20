# 135 - Contraste estático de entregas 168-172

Fecha: 2026-10-16
Rama de auditoría: `codex/134-conciliacion-cobertura-20261015`
HEAD inspeccionado: `731f2f1da99bb0c5e22560ffce5c87aa3e171c91`
Base Git verificada: `7230f9d02b32805952a185f704a0208bd5d643e6` (`origin/main`, merge #1323). No equivale a verificar el despliegue de Hosting. Solo se inspeccionaron fuentes; los archivos QA de la auditoria principal estaban separados.

Alcance: contraste de las correcciones 169/170 y presencia real de cambios 171/172 en el HEAD publicado. No se editaron archivos de aplicación ni pruebas; no se ejecutaron pruebas, navegador, build, merge ni push. No se contrastaron worktrees privados Claude/Gemini: sus HEAD son desconocidos (**NO CONTRASTADO CON LAS TANDAS PRIVADAS**). La comparación fuente/destino de este documento sí se limita a los SHA arriba indicados.

## Correcciones en `7230f9d0`

- **Orden 169, DJ desmarcar y error de escritura: presente.** `src/app/evento/dj/[fiestaId]/page.tsx`: `handleMarkPlayed` pasa explícitamente `!req.played` a `markSongPlayed`; maneja `success:false`, excepción, limpia `actionLoading` en `finally` y muestra el error al consumidor. El botón llama a esa función y usa `req.played` para su etiqueta/estado. El test de unidad `src/__tests__/dj-estado-explicito-y-error-de-marca.test.tsx` contiene 7 casos: marcar, desmarcar, idempotencia false, fiesta ajena, permiso denegado, resultado fallido y excepción. Es evidencia de aserciones escritas, no de ejecución en esta tarea.
- **Orden 170, canciones opcionales visibles al DJ: presente.** Mismo archivo, bloque de lista del portal `fiesta.listaMusicaPortal.siEsPosible`, con conteo y canciones; consumidor de datos `getFiestaById` carga `fiesta`. `src/__tests__/musica-opcional-visible-dj.test.tsx` contiene 2 casos (lista no vacía y vacía). Aserciones existentes, no ejecutadas aquí.
- **Orden 170, barra listo/error inicial y sondeo: presente.** `src/app/evento/barra/[fiestaId]/listo/page.tsx`, `cargarPedidos`: trata `success:false` y excepciones como lectura fallida; aviso `role="alert"`, conserva pedidos anteriores, limpia aviso al recuperarse y cambia indicador de estado. Consumidor real `getBarPedidosListos` en `src/app/actions/fiesta/barra-tecnologica.actions.ts` retorna `success:false` ante error; el fallback de lectura Firestore a datos almacenados es conducta existente de la acción, no cambio de esta pantalla. `src/__tests__/barra-listos-informa-lecturas-fallidas.test.tsx` contiene 4 casos: fallo inicial, fallo de sondeo conservando dato, recuperación y vacío confirmado. Escritos, no ejecutados aquí.
- **Orden 170, chat en vivo y fallo de lectura: presente.** `src/app/evento/en-vivo/[fiestaId]/page.tsx`, carga inicial y polling cada 6 s: registra `chatSinLeer`, evita declarar chat vacío en el fallo inicial y conserva mensajes/avisa durante fallo de sondeo. Consumidor real `getChatMessages` en `src/app/actions/social-gallery.ts` lanza ante fallo de lectura; modo sin base devuelve `[]` como estado legítimamente vacío. `src/__tests__/chat-en-vivo-avisa-si-no-pudo-leer.test.tsx` contiene 2 casos (fallo inicial y recuperación). Escritos, no ejecutados aquí.

Los commits fuente relevantes aparecen en el historial anterior al merge #1323: `29bbb5e5` (169) y `ddcb61b4` (170), ambos ancestros de `7230f9d0`. No hay diff de aplicación entre `7230f9d0` y el HEAD auditado en las rutas revisadas; por tanto no se reemiten correcciones 169/170. Esto prueba presencia en el SHA publicado, no despliegue verificado ni aprobación de las pruebas.

## Riesgos estáticos, no reproducidos

- **Barra, fallo inicial con cero pedidos:** `cargarPedidos` pone `isLoading=false` en `finally`, pero el render no consulta `isLoading`; con `lecturaFallida=true` y lista vacía el `<main>` devuelve `null`. Hay alerta y estado de conexión en footer, pero el área principal queda vacía, sin el contenido explícito de preparación/error. Es un borde de presentación inferido directamente del render, no una reproducción de navegador. El test de fallo inicial solo comprueba alerta y ausencia de los textos “preparando”/“En tiempo real”; no afirma que el área principal tenga una presentación útil.
- **DJ, lectura periódica fallida:** `fetchData(false)` solo activa `loadError` cuando `showLoader` es true. El polling llama `fetchData(false)`; si falla tras carga inicial, conserva datos previos sin un estado de desactualización visible. No es el requisito de escritura de 169 y no se presenta como fallo reproducido.

No se encontró riesgo análogo demostrable en chat para la lectura: la acción rechaza cuando falla, y la pantalla conserva mensajes anteriores y muestra estado de reconexión; al recuperar, una lista vacía válida limpia el aviso correctamente.

## Órdenes móviles 171/172

- **171, contrato móvil:** el contraste principal adicional `9aa64f99..7230f9d0` tampoco cambia la pagina exacta `src/app/portal/[fiestaId]/contrato/page.tsx`. La orden171 sigue pendiente; la sonda nueva135 volvio a reproducir el defecto, ver informe principal. Privado NO CONTRASTADO.
- **172, dock social:** el contraste `9aa64f99..7230f9d0` no cambia `src/components/module-navigation-dock.tsx`, `src/components/app-shell.tsx` ni la pagina del panel social. La sonda nueva135 vuelve a reproducir la interseccion; no solo overflow. Privado NO CONTRASTADO.

La orden 171 se entrega junto con 176 y 172 con 176 según las órdenes del repositorio; esta auditoría no propone reabrirlas ni ejecutar los recorridos. Navegador y nuevo QA/build corresponden a la auditoría principal y no se realizaron aquí.

## Estado de evidencia

- Fuente comprobada: SHA publicado `7230f9d0`; HEAD de auditoría `731f2f1d`.
- Aserciones presentes: DJ 7, música opcional 2, barra 4, chat 2. **No ejecutadas en esta tarea; ningún PASS declarado.**
- Navegador, E2E nuevo, compilación, despliegue y validación privada Claude/Gemini: no ejecutados / no contrastados.

## Seguimiento principal posterior

El texto anterior distingue el contraste estatico del ayudante de las ejecuciones posteriores. El principal ejecuto las8suites nuevas168/169/170 sobre la copia congelada723:41PASS y1expectativa de almacenamiento incompatible con el modo JSONlocal. Se ejecuto SOLO ese caso con su proveedor completamente simulado y modo esperado:1PASS,7casos no seleccionados; no se tocaron las aserciones ni datos reales. Son42nombres de comprobacion aceptados entre ambos modos, no una nueva validacion amplia de toda la app. El DJ opcional tambien aprobo2recorridos nativos, escritorio/movil y recarga. Recibos135 conservan resultados originales.

Al cerrar se observaron PR1325 HEAD73165d9d y1326 HEADa21d0b69 abiertas. Solo se contrastaron sus archivos relacionados con el nuevo178 y los defectos171/172: no contienen cambios de la hoja de cocina, CSS global, pagina exacta del contrato del portal ni dock/app-shell. Los cambios de contratos-salon/servicio en1326 son otras paginas y ortografia, no el arreglo171. No se aprueban esas PR completas ni su despliegue a partir de este contraste acotado.
