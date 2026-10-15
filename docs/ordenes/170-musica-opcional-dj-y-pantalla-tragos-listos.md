# Orden170 - Musica del cliente al DJ y estado real de pedidos listos

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
prueba: PENDIENTE src/__tests__/musica-opcional-visible-dj.test.tsx
prueba: PENDIENTE src/__tests__/barra-listos-informa-lecturas-fallidas.test.tsx
```
