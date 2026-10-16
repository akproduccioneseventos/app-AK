# Auditoria135 - Los tres bloques pendientes, ejecutados

Fecha:16/10/2026. Fuente congelada y compilada: `7230f9d02b32805952a185f704a0208bd5d643e6`.
El punto4 de la lista original ya se entrego en134. Esta tanda ejecuta los puntos1,2y3, no repite el inventario ni certifica cero errores.

## Entorno y criterio

Copia descartable del modo aislado existente, sin archivos de claves del equipo ni cuentas reales; variables reconstruidas desde su lista permitida, proyecto demo y APIs ficticias. Build Next completo salio0; `health` confirmo el SHA723 y Firebase/Gemini/GoogleWorkspace/mail/Instagram/MercadoPago deshabilitados. No se programo la app ni se fusiono. Dos agentes Luna low hicieron tareas acotadas de contraste/sonda movil y quedaron cerrados.

Los tests usan navegacion y acciones reales de esa copia; no sustituyen las respuestas de negocio por datos inventados. Excepcion declarada: se responde localmente al protocolo Firebase Installations con un token ficticio para que una instalacion de prueba no falle por la clave dummy. No es Firebase real ni prueba de su integracion. Las otras solicitudes externas del navegador se bloquean; no hubo mensajes, cobros ni datos de produccion modificados.

## 1 - Salon 3D

**PASS EN ALCANCE:2/2, escritorio y Pixel7.**

- Entrada por `/portal-cliente/:id` con clave ficticia; cookie del equipo retirada antes de entrar y ausente despues. Abrir la decoracion del evento como cliente.
- El canvas real aparece con la mesa y pista del fixture. No se acepta la imagen de respaldo como escena3D.
- Pixeles distintos: escritorio414colores antes y409despues,862x478; movil534antes y517despues,756x756. Arrastre/gesto cambia la imagen, sin errores JavaScript de pagina.
- Se inspeccionaron las dos capturas extraidas del recibo. Se ve la escena, mesa/sillas y pista; no es un canvas vacio. La tanda termina y cierra navegador sin los timeouts de trazas de133.

Evidencia: `135-3d-results.json.gz`, `135-3d-chromium-desktop.png/json` y `135-3d-chromium-mobile.png/json`.

Limite: renderizado WebGL por software y dispositivos emulados. No certifica cada mueble/asset del catalogo, medidas del salon real, guardado de todo el editor ni dispositivos fisicos. No se reejecuto la tanda extensa de28casos.

## 2 - Cocina y agenda

**Cocina: recorrido completado y defecto de impresion confirmado, orden178 para Claude.**

La hoja carga la fiesta real del fixture, no un aviso de error aceptado como sustituto. Lee un presupuesto de80adultos+15ninos+5adolescentes y presenta entrada100, principal80, infantil20, postre100. Familia confirmada Celiaco5; un vegano pendiente no suma. Recarga conserva el principal80 y el boton llama a `window.print()` una vez.

En el medio de impresion desaparece la identificacion de la hoja: nombre del evento, fecha, grupos/confirmados y titulo documental. Los2PDF reales de Chromium tienen1pagina y conservan platos/cantidades/Celiaco5, pero no `Cocina y salon QA135`. La captura de impresion coincide con la extraccion de texto de pypdf. El CSS global oculta cualquier `header` y alcanza tambien al encabezado documental. No es un error de las cantidades ni un PDF totalmente vacio.

Los2casos terminan FAIL por esa aceptacion. La variante inicial se conserva; la posterior genera y adjunta el PDF ANTES de exigir la misma cabecera. No se rebajo la asercion. El JSON auxiliar `135-kitchen-chromium-*.json` mide el primer h1 de la app (AK Producciones), NO el h1 del evento: no se usa ese dato para probar la cabecera documental. La prueba especifica del nombre, captura y PDF son la evidencia del defecto.

Evidencia: `135-kitchen-results.json.gz`, `135-kitchen-chromium-desktop.pdf/png`, equivalente movil, y orden178. La correccion debe ser local al documento, sin volver a imprimir menus ni cambiar calculos/permisos.

**Agenda:2/2PASS, escritorio y Pixel7.**

La tarjeta de `/settings/sincronizaciones` explica que los eventos personales no se tocan. `Revisar mi agenda` devuelve el aviso esperado de cuenta Google no conectada; no queda sin responder y el control final no registra errores de pagina. No se borro ni sincronizo una cuenta Google real.

La primera corrida, con la llamada Installations abortada, produjo `Failed to fetch`: es el fallo conocido del banco con APIs dummy. La corrida final usa el doble de protocolo declarado arriba, conserva la asercion de consola y pasa. Se conserva tambien una seleccion vacia de tests causada por anclar el grep al comienzo del titulo completo de Playwright; cero casos, error del runner, no fallo de la app.

## 3 - Entregas y correcciones moviles

**Correcciones168/169/170 presentes y comprobaciones focales ejecutadas.**

El contraste de PR1321/1322 ya integradas en723 esta en `135-entregas-contraste.md`. Se ejecutaron sus8suites nuevas:41PASS y1fallo de expectativa de proveedor. Ese caso esperaba el `deleteDataItem` simulado de Firestore, pero el runner habia elegido correctamente el almacenamiento localJSON. Se repitio SOLO el caso con su proveedor completamente simulado y el modo para el que esta escrito:1PASS,7casos no seleccionados. Se conservaron ambas salidas y no se cambio codigo ni asercion. Son42nombres de comprobacion aceptados entre ambos modos, no una corrida amplia de toda la app.

El viaje nativo DJ opcional pasa2/2: dato del fixture visible y conservado al recargar en escritorio y movil. Las sondas de escritura DJ, lecturas fallidas de barra y chat, centavos/negativos y lecturas que deciden permisos/dinero son focales con dobles, NO una integracion externa certificada.

**Movil171/172:2casos FAIL que confirman pendientes anteriores, no ordenes nuevas.**

- Contrato390px: titulo3lineas; firma/sello invade la etiqueta; boton244px con texto336px. Sin overflow global. Medidas/captura conservadas.
- Panel social390px: el dock sigue intersectando el encabezadoEvento; no se da por resuelto por tener0overflow horizontal.

Se contrastaron los archivos originales entre9aa y723: no traen esos arreglos. Ademas se observaron nuevas PR1325 HEAD73165d9d y1326 HEADa21d0b69; solo se reviso su interseccion con178/171/172, sin cambios en esas rutas/CSS/dock. No se aprueban completas esas ramas nuevas ni sus HEAD privados. No se reencargaron171/172; ya estan agrupadas por Claude con176.

## Resumen sin duplicar resultados

| Bloque | Resultado observado |
| --- | --- |
| 1 - 3D |2/2PASS virtuales focales |
| 2 - Agenda |2/2PASS sin Google conectado |
| 2 - Cocina |Datos/recarga correctos;2FAIL por cabecera impresa, nuevo178 |
| 3 - Entregas |42comprobaciones unitarias aceptadas en modos documentados;DJ2/2PASS nativos |
| 3 - Movil |2FAIL de171/172 ya existentes |
| 4 - Recuento anterior |Completado en134, no repetido |

Diez casos nativos distintos al cierre:6PASS y4FAIL. Las ejecuciones anteriores repetidas y errores del runner no se suman como funciones nuevas ni nuevos bugs. No hay areas completas aceptadas por estos conteos. La auditoria de estos tres bloques termino; la app conserva los hallazgos detallados, por eso NO se declara lista sin errores.

## Cierre y reproduccion

`135-aceptacion.json` conserva fuente, resultados, hashes de archivos originales comprimidos y limites. `135-consolidar.mjs` comprobo fuente/build, conteos y limpieza. Tras la firma ficticia se restauraron SOLO las dos listas de notificaciones de la copia QA: contenian una notificacion sintetica nueva y habian desplazado una fila por el tope50. Los registros conservados se compararon con la base antes de restaurar sus bytes. No se toco el worktree original de otras IA.

Sin fixtures135 pendientes, sin cambios tracked en la copiaQA, servidor3300 cerrado y agentes cerrados. Se conserva la copia compilada para reutilizar sin otro build si el codigo no cambia. Privados NO CONTRASTADOS. No Hosting/OAuth, modelo/voz real,19originales ni hardware aceptados.

Runner: `node docs/evidencias/135-entorno.mjs test <grupo>`; grupos core (historico inicial), agenda, kitchen, mobile,3d,unit,unit-crm. Para repetir necesita reabrir el servidor de la misma copia y comprobar health/SHA; no requiere nueva compilacion mientras su fuente no cambie. Las fuentes originales y variantes de las sondas se conservan comprimidas para no atribuir a una version de test el resultado de otra.
