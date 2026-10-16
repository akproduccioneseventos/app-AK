# PARA GEMINI - Orden 170: la lista "Si es posible" llega al DJ, y la pantalla de tragos listos avisa si no pudo leer

**Hacela en la MISMA propuesta que la orden 169**: las dos tocan `src/app/evento/dj/[fiestaId]/page.tsx`.
Una sola propuesta con las dos órdenes. Si un bloque se traba, entregá el resto y avisá cuál faltó.
Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md`. Arrancá de la versión principal de hoy.

## Camino exacto (lo investigó Claude)

### Bloque 1 - Panel DJ muestra "Si es posible"

- Dato: `fiesta.listaMusicaPortal?.siEsPosible` (`string[]`), tipo `ListaMusicaPortal` en
  `src/types/fiesta.ts` línea ~1334. Lo guarda el portal del cliente (`saveListaMusica`); eso anda, no se toca.
- `src/app/evento/dj/[fiestaId]/page.tsx`: hoy hay una sección para `imprescindibles` (línea ~239,
  título ámbar, "N obligatorias") y otra para `noQuiero` (línea ~272, rosa, "N vetadas").
  **Agregá una tercera sección entre esas dos**, con la misma forma, para `siEsPosible`:
  título "Si es posible", contador "N sugeridas", color distinto (por ejemplo `sky`), y un texto
  chico: *"Sugerencias del cliente: pasalas si encajan."* Si la lista está vacía, no se muestra.
- **No** las mezcles con las obligatorias ni con los pedidos de invitados, **no** crees pedidos ni
  votos con ellas, y **no** toques la bandeja de `musica.playlistFiesta` (línea ~88).

### Bloque 2 - Pantalla de tragos listos no disfraza una lectura fallida

`src/app/evento/barra/[fiestaId]/listo/page.tsx`, `cargarPedidos` (línea ~19). Hoy, si
`getBarPedidosListos` devuelve `success:false` o tira excepción, no pasa nada visible: con la lista
vacía dice "Los tragos se están preparando" y siempre "En tiempo real".

- Estado nuevo `const [lecturaFallida, setLecturaFallida] = useState(false)`.
- `res.success && res.orders`: `setPedidosListos(res.orders)` como hoy y `setLecturaFallida(false)`.
- `success:false` o `catch`: `setLecturaFallida(true)` y **no** vaciar `pedidosListos` (se conserva
  lo último que se leyó).
- Con `lecturaFallida`:
  - el rótulo "En tiempo real" (línea ~128) pasa a decir "Sin conexión, reintentando…";
  - arriba aparece un cartel con `role="alert"`:
    - con lista vacía: *"No pudimos leer los pedidos. Reintentando…"*;
    - con pedidos en pantalla: *"Puede estar desactualizado. Reintentando…"*.
- Con lista vacía y `lecturaFallida`, **no** mostrar "Los tragos se están preparando" (línea ~71).
- Mantener el reintento cada 2500 ms (línea ~35). Al primer éxito el cartel se va solo.
- **No** tocar `getBarPedidosListos`, estados de pedidos, stock, importes ni permisos.

### Bloque 3 - Pruebas

- `src/__tests__/musica-opcional-visible-dj.test.tsx`: una fiesta con
  `listaMusicaPortal.siEsPosible = ['Tema X']` muestra "Tema X" bajo "Si es posible". Las
  obligatorias y vetadas siguen. Con la lista vacía, la sección no aparece. Nombrar la ruta
  `/evento/dj/[fiestaId]`.
- `src/__tests__/barra-listos-informa-lecturas-fallidas.test.tsx`, con la acción simulada:
  1. `success:false` de entrada: aparece el aviso y no dice "Los tragos se están preparando" ni "En tiempo real".
  2. Primero un pedido listo y después una falla: el pedido sigue en pantalla y aparece "Puede estar desactualizado".
  3. Después vuelve a andar: el aviso desaparece y la lista nueva reemplaza a la vieja.
  4. Lista vacía confirmada: dice "Los tragos se están preparando", sin aviso.
  Nombrar la ruta `/evento/barra/[fiestaId]/listo`. Podés partir de `docs/evidencias/132-barra-listos.test.tsx`.

### Bloque 4 - Barrido de la pregunta 50: el chat en vivo del invitado

Lo encontró el barrido de Claude sobre las pantallas que se actualizan solas (unas 20 revisadas,
las demás ya avisan). `src/app/evento/en-vivo/[fiestaId]/page.tsx`, `load` (línea ~51): si
`getChatMessages` falla (tira error), el `catch` sólo escribe en la consola, `messages` queda vacío y
el invitado ve "0 mensajes" y "Sé la primera persona en mandar un saludo a la fiesta" (línea ~222).

- Estado nuevo `const [chatSinLeer, setChatSinLeer] = useState(false)`. Leé el chat **aparte** de
  la fiesta (no en el mismo `Promise.all`), para que una falla de uno no tape al otro.
- Si falla la lectura del chat (al cargar o en el sondeo de cada 6 s, línea ~67):
  `setChatSinLeer(true)` y **no** vaciar `messages`. Si anda: `setChatSinLeer(false)`.
- Con `chatSinLeer` y lista vacía, en lugar del cartel "Sé la primera persona…" mostrá
  *"No pudimos cargar los saludos. Reintentando…"* (`role="status"`), y no muestres "0 mensajes".
  Con mensajes en pantalla, una línea chica: *"Reintentando conexión…"*.
- No toques el envío de mensajes, los corazones ni `getChatMessages`.
- Prueba: `src/__tests__/chat-en-vivo-avisa-si-no-pudo-leer.test.tsx`. Con `getChatMessages`
  rechazando, no aparece "Sé la primera persona" y sí el aviso. Cuando vuelve a andar, se ven los
  mensajes. Nombrar la ruta `/evento/en-vivo/[fiestaId]`.

---

## Lo que encontró Codex (auditoría 132)


NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE/GEMINI: HEAD desconocido.
Fuente ejecutada d10f332a17241de5a4705a560336585853073a76. Main bbf68006
solo agrega documentos respecto a esa fuente: diff src/deps/config vacio.
No habia PR abierta al contrastar. Orden169 ya encargada: compartir el archivo
DJ con su responsable, no pisar la entrega privada ni reprogramar sus bloques.
Gemini programa, Claude valida/compila/fusiona; Codex solo audito.

## P2 - La lista Si es posible se guarda pero no llega a la vista del DJ

Recorrido ejecutado con pagina y acciones REALES, datos/avisos/sesion ficticios:
portal-cliente/[id]/musica, escribir en Si es posible, agregar y Guardar.
saveListaMusica persiste listaMusicaPortal.siEsPosible con la cancion.
Abrir la pagina real evento/dj/[fiestaId], cuyo getFiestaById recibe esa MISMA
fiesta ya guardada: el tema no se muestra. Los infaltables si aparecen.

Consumer real: DJPage en src/app/evento/dj/[fiestaId]/page.tsx. Renderiza
imprescindibles/noQuiero y una bandeja que lee musica.playlistFiesta, pero no
listaMusicaPortal.siEsPosible. No falta guardado ni se perdio la cancion.

Mostrar tambien las sugerencias opcionales del cliente, identificadas como
tales. No convertirlas en obligatorias ni en votos del publico; no inventar
autoplay ni duplicar pedidos. Reutilizar bandeja-musica si corresponde, pero
conservar infaltables, prohibidas y su prioridad. Coordinar con169, que toca
el MISMO archivo en otros handlers. No cambiar permisos ni funciones de votos.

## P2 - Pantalla de pedidos listos disfraza lecturas fallidas de estado normal

Pagina real src/app/evento/barra/[fiestaId]/listo/page.tsx,
PantallaTragoListoPage/cargarPedidos, con getBarPedidosListos sustituido por
respuestas ficticias controladas; no se probo Firestore/stock/barman reales.

- Si devuelve success:false o rechaza, muestra Los tragos se estan preparando
  y En tiempo real sin aviso de que la lista no se pudo leer.
- Si falla el sondeo despues de haber mostrado un pedido listo, conserva ese
  pedido y En tiempo real, sin avisar que puede estar desactualizado.
- ControlesPASS: vacio comprobado, pedido listo correcto y recuperacion
  posterior con reemplazo por lista nueva. No reimplementar el motor de barra.

Separar cargando/vacio confirmado/error inicial/lista anterior sin actualizar.
Mostrar aviso humano y accesible cuando falla; conservar lista previa si hay
datos y avisar que no es una lectura nueva. Mantener reintento automatico2500ms
y limpiar aviso al recuperar. No acusar pedido entregado ni modificar estados,
consumos, importes o permisos para solucionar una pantalla de lectura.

## Pruebas y limites

132-portal-menu-musica.test.tsx:9casos8PASS1FAIL. Guarda y remonta restricciones,
agrega por Enter/boton, elimina, guarda/remonta tres listas, conserva borrador
y notifica error, rechaza sesion/clave no autorizadas en los dobles. Unico fallo:
opcional persistida no visible enDJ. No cookies reales ni seguridad de transporte.

132-barra-listos.test.tsx:6casos3PASS3FAIL. Los tresFAIL son variantes de UNA
causa, no tres defectos. Total15casos11PASS4FAIL, cero omitidos, dos defectos.
Fuente Git congelada, TS-jest sin buildNext/typecheck, red bloqueada y datos
ficticios. 132-*-observado.json contiene texto y datos antes de las aserciones.
No alterar expectativas para ocultar fallo. Tras parche, integrar regresiones
y validar en navegador con artefactoQA actual porClaude. No certificado global.

```comprobar
archivo: src/app/evento/dj/[fiestaId]/page.tsx
usa: saveListaMusica en src/app/portal-cliente/[id]/musica/page.tsx
usa: listaMusicaPortal en src/app/evento/dj/[fiestaId]/page.tsx
prueba: docs/evidencias/132-portal-menu-musica.test.tsx
archivo: src/app/evento/barra/[fiestaId]/listo/page.tsx
usa: getBarPedidosListos en src/app/evento/barra/[fiestaId]/listo/page.tsx
prueba: docs/evidencias/132-barra-listos.test.tsx
prueba: src/__tests__/musica-opcional-visible-dj.test.tsx
prueba: src/__tests__/barra-listos-informa-lecturas-fallidas.test.tsx
prueba: src/__tests__/chat-en-vivo-avisa-si-no-pudo-leer.test.tsx
```

