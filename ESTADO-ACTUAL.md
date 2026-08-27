# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 27 de agosto de 2026.
**Estado de la app:** sana. Tipos en cero, 2253 pruebas en verde, acentos limpios, compila.
**Propuestas abiertas:** ninguna. Se fusionaron la #1149 y la #1150, y la versión principal
se verificó con las dos adentro.

## LO URGENTE: el dueño va a usar los entretenimientos en una fiesta

### La fotocabina (la trabaja la otra sesión)

Anda bien y se probó con cámara: arranque como kiosco, tanda de tres fotos, tira en 10x15
vertical a 1200x1800, nombre del homenajeado en manuscrita, aviso si falla la cámara y
guardado sin internet.

**El defecto que importa: el recuerdo sale con el fondo pelado.** `componerTiraDeFotos` ya
sabe recibir `imagenFondoUrl` y `colorFondo`; la fotocabina nunca se los pasa. El fondo ya
existe: es el de la invitación digital de esa misma fiesta. Todo en
**`docs/ordenes/13-la-fotocabina-que-gana.md`**.

### Las otras estaciones: estaban TODAS muertas, y ya se arreglaron

Se probaron en un navegador de verdad, como operador y como invitado. El operador tocaba
"Iniciar cuenta regresiva" en la 360, en Bogue, en el Espejo Mágico o en Touchpix y **le
aparecía un cartel rojo en inglés**: la estación no arrancaba. Una sola causa para las
cuatro —se mandaban casilleros vacíos a la base y la base rechazaba el guardado entero—.
Arreglado, con candado de prueba.

## Lo más grave del día: el control de navegador mentía

`scripts/run-playwright-production.mjs` decía **"todas las pruebas pasaron" con cero pruebas
corridas** cuando una tanda se caía. Es el único control que ve lo que ve el usuario.

Apenas se arregló, aparecieron **dos defectos que estaban fusionados en la versión principal
desde el 26 de agosto**: la portada tenía dos secciones con el mismo nombre interno (el menú
"Inicio" apuntaba ahí) y el título se había movido sin actualizar su referencia. Los dos,
corregidos.

**La lección: cuando un control deja de mirar, lo que entra no se ve.**

## Lo que sigue: la orden 14, para Gemini

**`docs/ordenes/14-el-entretenimiento-de-ak.md`.** Convierte las seis estaciones sueltas en
**una sola experiencia** que sabe de qué fiesta se trata y quién está parado adelante —lo
único que las plataformas del rubro no pueden copiar, porque son fotocabinas sueltas—.

Del lado del invitado: lo saluda por su nombre y le guarda la foto sin que haga nada; elige
entre foto, GIF, video, boomerang o avatar IA; guía en pantalla; fondo sin tela verde;
**el marco se arma solo con los datos de la fiesta**; accesorios pegados a la cara; QR sin
pedir un dato. Del lado del operador: un tablero con todas las estaciones y el contador de
la noche, todo preparado desde la app el día anterior, y el resumen final que se le muestra
al cliente. Además: el tótem (que se ve desarmado), el muro moderado por IA, la cápsula que
se abre sola, y el Club Uruguay ofrecido siempre en la Presentación LED.

**Ojo con los números de orden:** la 13 es la de la fotocabina, de la otra sesión. La del
entretenimiento es la **14** y no toca la fotocabina.

## Decisiones ya tomadas (no volver a preguntar)

- **No se le pide el mail ni el teléfono al invitado** para darle su foto: frena la fila.
  El QR alcanza.
- **Cloudflare: no.** Se queda en Firebase. **Google Flow: no se conecta.**
- **El agente de publicidad no prende ni crea campañas.** Eso lo activa el dueño.
- **Nada de promesas en la web** ni precios congelados: trabaja con ajuste anual.
- **El reloj del simulador va**, y es para la promoción, no para congelar la tarifa.
