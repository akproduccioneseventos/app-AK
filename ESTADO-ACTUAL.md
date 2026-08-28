# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026, cierre del día.
**Estado de la app:** sana. Tipos en cero, 2260 pruebas en verde, acentos limpios, compila,
y las pruebas de navegador de los entretenimientos sin fallas.
**Propuestas abiertas:** ninguna fusionable. **Dos entregas de Gemini devueltas** (abajo).

## LO QUE ESTÁ ESPERANDO A GEMINI: dos entregas devueltas

Las dos están escritas arriba de todo en su orden, como **DEVOLUCIÓN**. Ninguna se fusionó.

### Orden 14 — entretenimiento (rama `feat/orden-14-entretenimiento-unificado`)

Pasa los cinco controles **y aun así la mitad no hace nada**: cinco piezas nuevas —GIF,
marcos dinámicos, resumen de la noche, moderación automática del muro y el selector de
formato— **no las llama nadie**. Verificado por nombre de archivo y de función. Además, el
tablero del operador **no tiene puerta** (ninguna pantalla lleva ahí) y **falta entero el
bloque de la música** sin avisar. Y `YA-RESUELTO.md` quedó afirmando como resueltas tres
cosas que no ocurren.

**Lo que sí quedó bien y no se toca:** el saludo y la guía en pantalla (enchufada de verdad
en 360, Bogue y Touchpix), **el tótem arreglado** (confirmado en el navegador) y el Club
Uruguay siempre visible en la Presentación LED, marcado como opcional.

### Orden 15 — las pruebas (rama `feat/orden-15-pruebas-que-terminan-el-trabajo`)

**El recorrido de las 348 pantallas mira el lugar equivocado:** usa
`context.request.get(route)` y mide el HTML crudo, no la pantalla dibujada. Las pantallas
internas se dibujan en el cliente, así que ese HTML son **69 caracteres de cáscara siempre**:
reportó **veintipico de pantallas sanas como "vacías"**. Peor: por lo mismo, las
comprobaciones de `$NaN` y basura de programador **quedan ciegas**.

En el segundo intento arregló la compatibilidad con Windows —bien, y hacía falta— pero
**no tocó lo anterior**, y sumó dos cosas nuevas: el control de acentos en Node **da verde
si `git ls-files` falla** (el mismo defecto que acabamos de sacarle al corredor de pruebas,
y es uno de los seis pasos de la puerta), y quedó `path-scurry` en las dependencias **sin
que lo use nadie**.

**Pendiente que sólo puede resolver él, con los accesos de producción:** abrir
`/club-uruguay` y decir qué se ve. La prueba mide 11 caracteres, pero esa página le pide los
salones a la base y en el contenedor de prueba no hay base. Si de verdad está vacía, es un
defecto en una página que vende.

## Lo que se cerró y ya está en la versión principal

- **Las estaciones estaban todas muertas y se arreglaron.** El operador tocaba "Iniciar
  cuenta regresiva" en la 360, en Bogue, en el Espejo Mágico o en Touchpix y aparecía un
  cartel rojo en inglés. Una sola causa para las cuatro, con candado de prueba.
- **El corredor de pruebas de navegador mentía:** decía "todas las pruebas pasaron" **con
  cero pruebas corridas**. Apenas se arregló aparecieron dos defectos ya fusionados desde el
  26 de agosto (la portada con dos secciones del mismo nombre y el título movido sin
  actualizar su referencia). Los dos corregidos.
- **La fotocabina imprime con el fondo de la invitación** de esa fiesta, y también Bogue y
  el Espejo. Se configura por fiesta cuántas fotos y qué marcos.
- **La orden 14 quedó escrita con quince bloques**, incluida la música: que entre lo que sea
  —Spotify, YouTube o texto pegado— y salga una sola lista conectada, para el DJ.

**La lección del día, y vale para todo: cuando un control deja de mirar, lo que entra no se
ve.** Pasó dos veces hoy con dos controles distintos.

## LA PUERTA, y es la que manda: `npm run "publicar?"`

Corre los seis controles del más barato al más caro, corta en la primera falla y contesta una
sola cosa: se puede publicar o no, y por qué en criollo. **No se fusiona nada sin eso en
verde, y no se saltea un paso para que dé verde.** `publicar?:rapido` saltea la prueba de
navegador y **no alcanza para publicar**.

## Decisiones ya tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto: frena la fila.
- **Cloudflare: no.** **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
