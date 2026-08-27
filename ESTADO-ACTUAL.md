# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026.
**Estado de la app:** sana. Tipos en cero, 2260 pruebas en verde, acentos limpios, compila,
y las pruebas de navegador de los entretenimientos sin fallas.
**Propuestas abiertas:** ninguna.

## Lo que se cerró hoy

**Las estaciones estaban todas muertas y se arreglaron.** El operador tocaba "Iniciar cuenta
regresiva" en la 360, en Bogue, en el Espejo Mágico o en Touchpix y le aparecía un cartel
rojo en inglés: no arrancaba ninguna. Una sola causa para las cuatro. Con candado de prueba.

**El control de navegador mentía.** `scripts/run-playwright-production.mjs` decía "todas las
pruebas pasaron" **con cero pruebas corridas** cuando una tanda se caía. Apenas se arregló
aparecieron dos defectos que ya estaban fusionados desde el 26 de agosto: la portada tenía
dos secciones con el mismo nombre interno y el título se había movido sin actualizar su
referencia. Los dos corregidos. **La lección: cuando un control deja de mirar, lo que entra
no se ve.**

**Gemini entregó la orden 13 (fotocabina) y se fusionó** tras pasar los siete controles: la
tira sale con el fondo de la invitación de esa fiesta (también en Bogue y el Espejo), se
configura por fiesta cuántas fotos y qué marcos, y se sacaron cuatro promesas que la
fotocabina no cumple.

## Lo que sigue: la orden 14, para Gemini

**`docs/ordenes/14-el-entretenimiento-de-ak.md`**, quince bloques, **una sola propuesta**.
Convierte las estaciones sueltas en una sola experiencia que sabe de qué fiesta se trata y
quién está parado adelante. Del invitado: saludo por nombre, elegir entre foto/GIF/video/
boomerang/avatar IA, guía en pantalla, fondo sin tela verde, **marco armado solo con los
datos de la fiesta**, accesorios pegados a la cara, QR sin pedir un dato. Del operador: un
tablero con todas las estaciones y el contador de la noche, todo preparado el día anterior,
y el resumen final que se le muestra al cliente. Más: el tótem (que se ve desarmado), el
muro moderado por IA, la cápsula que se abre sola y el Club Uruguay ofrecido siempre.

### El bloque 14, nuevo, pedido por el dueño hoy

**Toda la música junta y conectada de verdad.** Hoy los enlaces que manda el cliente caen en
un cuadro de texto libre y **nadie los abre nunca**. Que entre lo que sea —playlist o tema
de Spotify, video o playlist de YouTube, o texto pegado de WhatsApp—, que la app lo resuelva
a canciones con título y artista, las cruce entre los dos servicios, las junte con los
pedidos de los invitados y las vuelque a una playlist en la cuenta del dueño. **Ya existen y
no se rehacen:** infaltables/prohibidas del DJ, "Imprimir para DJ", el campo del vals y la
búsqueda en Spotify.

**Hallazgo del mismo bloque: el panel de conexiones puede mentir.** YouTube figura
"conectada" con que exista una ficha guardada, aunque el permiso haya vencido; Spotify
figura "conectada" con que exista la llave de la aplicación, aunque la cuenta personal del
dueño no esté autorizada a escribir. **No se comprueba contra el servicio.** Se le pidió a
Gemini que lo pruebe de verdad —él corre en la máquina del dueño y tiene los accesos— y que
muestre los dos niveles por separado.

## LA PUERTA, nueva y es la que manda: `npm run "publicar?"`

**Pedido del dueño el 27 de agosto**, después de que una auditoría diera *"cero errores"*
con la fotocabina imprimiendo mal: *"quiero un mecanismo que deje mi app en cero errores en
código y en funcionamiento; todo debe marchar para poder publicar."*

**El diagnóstico:** el problema no era la calidad de los informes, era que **ninguno podía
frenar la publicación**. Un control que no frena es una sugerencia.

`npm run "publicar?"` corre los seis controles del más barato al más caro, se corta en la
primera falla y contesta **una sola cosa**: se puede publicar, o no se puede, qué falló y qué
significa en criollo. Devuelve un resultado que una máquina puede leer, así que **algo puede
frenar solo**. `publicar?:rapido` saltea la prueba de navegador y **no alcanza para publicar**.

**La regla, en `CLAUDE.md`: no se fusiona nada sin eso en verde, y no se saltea un paso para
que dé verde.**

### Lo que le falta a la puerta: la orden 15

**`docs/ordenes/15-las-pruebas-que-terminan-el-trabajo.md`**, dos partes:

- **El recorrido de las 348 pantallas, que hoy no mira.** Existe y las visita, pero sólo
  detecta error de servidor. **Una pantalla en blanco le pasa; una con `$NaN` en el precio,
  también.** Se le suman cinco comprobaciones por pantalla.
- **Trece pruebas que terminan el trabajo.** Medido: `simulator-budget-journey` tiene **cero**
  comprobaciones de resultado contra once de que la pantalla abrió. Recorre los cinco pasos,
  se baja el PDF y **nunca mira el monto**.

### Y las dos preguntas nuevas para auditar (en `docs/COMO-AUDITAR.md`)

- **¿El dato LLEGA?** Una función acepta un parámetro opcional y ninguna llamada se lo pasa.
  Pasó tres veces en un día.
- **¿La prueba TERMINA EL TRABAJO?** Si termina en `toBeVisible` o en `status < 400`, sólo
  confirma que abrió. **No cuenta.**

## Decisiones ya tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto: frena la fila.
- **Cloudflare: no.** **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
