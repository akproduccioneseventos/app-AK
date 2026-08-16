# Orden de trabajo: reseñas en Google y el plan de la noche del equipo

**SEGUNDA ENTREGA. La primera no trajo el trabajo.** Fecha: 13 de agosto de 2026.

La entrega anterior (propuesta 970) cambió siete archivos y **en ninguno estaba lo
pedido**. Traía un archivo de pruebas de una función que no existe, cambios en la
configuración de compilación que nadie pidió, un archivo vacío y un script de
PowerShell de la máquina del dueño. Se cerró sin fusionar.

Antes de entregar, releé esta sección.

## Qué tiene que existir cuando termines

Es una lista, no una sugerencia. Si algo de esto no está, la entrega no sirve:

1. **Una función que decida a quién se le pide la reseña**, separada del envío y con
   sus pruebas. Recibe las opiniones y devuelve a quiénes corresponde escribirles.
2. **El envío enganchado** a donde ya se mandan los WhatsApp.
3. **El interruptor en Ajustes**, apagado, y el campo para pegar el enlace de
   reseñas de Google.
4. **La pantalla del plan de la noche**, que se abra desde el acceso propio de cada
   empleado y se vea bien en un celular.
5. **Las anotaciones** en `docs/YA-RESUELTO.md` y `docs/QUE-HAY-EN-LA-APP.md`.

## Tres cosas que NO se hacen

- **No entregues una prueba de algo que no construiste.** Una prueba de una función
  inexistente no protege nada y hace creer que el trabajo está hecho.
- **No entregues una prueba que no pueda fallar.** Si la prueba arma una lista
  adentro de sí misma y después la filtra ahí mismo, se está probando a sí misma, no
  a la aplicación. Tiene que llamar al código de verdad.
- **No toques nada de lo que no te pidieron.** En concreto: `next.config.js`, la
  carpeta `scripts/`, los archivos de service worker, ni scripts de PowerShell.
  Cambiar la configuración de compilación rompe la publicación de la aplicación sin
  que se entienda por qué, y eso ya dejó la app seis días sin poder publicarse.

**Entregá UNA SOLA propuesta de cambio con los dos bloques adentro.**

Antes de arrancar, leé `docs/QUE-HAY-EN-LA-APP.md`: es el inventario verificado de
lo que ya existe. **No rehagas nada de lo que figura ahí**, y actualizá esas líneas
en esta misma propuesta.

**Dos cosas de esta tanda NO van acá porque tocan plata y las hace Claude:** cobrar
la seña en el momento en que el cliente acepta, y comparar la ganancia entre todas
las fiestas. No las toques.

---

## Reglas que valen para los dos bloques

**1. Nada que le hable a un cliente arranca prendido.** Interruptor en Ajustes y
viene apagado. Los mensajes no se pueden deshacer.

**2. Ningún dato de plata de una persona se le muestra a otra.** Vale sobre todo
para el bloque 2.

**3. Si algo falla, la pantalla no se rompe.** Siempre hay un camino simple.

**4. Archivos que NO se tocan.** Ahí viven reglas ya resueltas y probadas:
`src/lib/testimonios/para-mostrar.ts`,
`src/lib/marketing/candidatos-recontacto.ts`,
`src/lib/marketing/recontacto-automatico.ts`,
`src/lib/ai/consumo.ts`,
`src/lib/seo/paginas-publicas.ts`,
`src/lib/public-experience/donde-va-el-asistente.ts`.

**5. Esto no necesita inteligencia artificial.** No la uses: son mensajes cortos y
una pantalla de lectura. Si igual la usaras para algo, tiene que pasar por
`hayPresupuestoParaIA()` y `registrarConsumoIA()`.

---

## Bloque 1 — Pedirle la reseña de Google al cliente que quedó contento

**Por qué esto importa más que cualquier otra cosa de esta orden.** Cuando alguien
en Salto busca "salón para casamientos", las estrellas de Google deciden a quién
llama primero. Hoy las opiniones buenas de los clientes **se quedan guardadas
adentro del sistema**, donde no las ve ningún cliente nuevo.

**Lo que ya existe y hay que reusar:** después de cada evento el cliente deja su
opinión con una nota del 1 al 10 (`npsScore` en `FeedbackSubmission`,
`src/types/feedback.ts`). O sea que **la aplicación ya sabe quién quedó feliz**. La
pantalla de opiniones es `src/app/feedback/[fiestaId]/` y las acciones están en
`src/app/actions/feedback.ts`.

**Qué hay que hacer:** que al cliente que puso una nota alta le llegue, poco después
de dejar su opinión, un mensaje corto agradeciéndole e invitándolo a dejar la
reseña en Google, con el enlace directo.

**Las reglas, y ninguna es negociable:**

1. **Sólo a los que pusieron 9 o 10.** A nadie más. Pedirle una reseña pública a
   alguien que se quejó es pedirle que te baje la reputación. Si no dejó nota, no se
   le pide.
2. **Una sola vez por cliente, nunca dos.** Se anota que ya se le pidió.
3. **Apagado de fábrica**, con interruptor en Ajustes.
4. **El enlace de Google se configura, no se escribe en el código.** Poné un campo
   en Ajustes para pegar la dirección de reseñas del negocio. Si ese campo está
   vacío, **no se manda nada** y el interruptor no se puede prender: avisá en
   pantalla que primero hay que cargar el enlace.
5. **El mensaje es de agradecimiento, no de venta.** Corto, en criollo, con el
   nombre del cliente y el de su fiesta. Nada de promociones ni de pedir que ponga
   cinco estrellas: se invita a contar su experiencia y listo.
6. **Nada se publica solo en ningún lado.** La aplicación sólo manda el enlace; la
   reseña la escribe el cliente en Google si quiere.
7. Para mandarlo, usá el camino de WhatsApp que ya existe. Si no hay credenciales
   configuradas, no rompas: no se manda y queda anotado.

**Además, en la pantalla interna de opiniones:** mostrale al equipo, al lado de cada
opinión, si a esa persona ya se le pidió la reseña o no, y un botón para pedírsela a
mano. Sirve para los casos en que el envío automático está apagado.

---

## Bloque 2 — El plan de la noche, en el celular de cada uno del equipo

**El problema:** el día del evento, cada persona del equipo llama para preguntar a
qué hora entra y qué le toca. Esa información ya está cargada en el sistema, pero
sólo la ve el dueño desde la computadora.

**Lo que ya existe y hay que reusar:** cada empleado tiene su acceso propio
(`src/app/acceso-personal/[tokenId]/`), y el personal se asigna a cada fiesta
(`personalAsignado`, con su rol y horarios).

**Qué hay que hacer:** que al entrar por su acceso, cada persona vea **su** próxima
fiesta con:

- Dónde es y a qué hora tiene que estar.
- Qué le toca hacer (su rol).
- Los momentos de la noche que le importan: a qué hora entran los novios o la
  quinceañera, cuándo sale la comida, cuándo el vals, cuándo la torta. Eso sale del
  itinerario del evento, que ya existe.
- Un teléfono de contacto del responsable, para no tener que buscarlo.

**Las reglas:**

1. **Cada uno ve sólo lo suyo.** Nunca la lista completa del personal, nunca lo que
   cobra otro, nunca datos del cliente que no le hagan falta para trabajar. Esto es
   lo más importante del bloque: un descuido acá muestra sueldos ajenos.
2. **Es de sólo lectura.** No cambia nada.
3. **Pensado para el celular primero**, que es donde se va a mirar, parado en la
   puerta del salón. Letra grande, poco texto, sin tablas que se desborden.
4. Si esa persona no tiene ninguna fiesta próxima, que la pantalla lo diga con
   gracia, no que quede vacía.

---

## Cómo se comprueba

1. `npm run check:acentos` limpio.
2. `npx tsc --noEmit` en cero.
3. `npx jest --silent` todo en verde.
4. `npm run build` termina bien. **Correlo de verdad**: ya pasó que los tipos daban
   bien y la aplicación no se podía publicar.
5. Pruebas nuevas para lo que no se ve a ojo:
   - Que **nunca** se le pida la reseña a alguien con nota menor a 9, ni dos veces a
     la misma persona, ni con el enlace sin configurar.
   - Que la pantalla del equipo **no muestre** sueldos ni datos de otras personas.
6. Probado a mano en tamaño de celular la pantalla del equipo.

Anotá todo en `docs/YA-RESUELTO.md` y en `docs/QUE-HAY-EN-LA-APP.md`, en esta misma
propuesta.
