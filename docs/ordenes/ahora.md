# LA ORDEN. Todo lo que falta, en cuatro tandas

**Para:** Gemini (Antigravity)
**Escrita:** 22 de agosto de 2026.

**Esta es la unica orden.** Adentro esta todo lo que falta, en el orden en que hay
que hacerlo. Los dos trabajos mas grandes tienen su detalle en
`docs/ordenes/detalle/`, y estan marcados donde corresponde.

---

## Como se entrega

**Una tanda = una propuesta de cambios.** Cuatro tandas, cuatro fusiones, en este
orden. **No las mezcles**: cada fusion dispara un despliegue y, si se mezcla todo,
el dia que algo falle en una fiesta no vamos a saber que lo rompio.

**Dentro de cada tanda, TODO va en UNA sola propuesta.** Si un bloque se traba,
entregá el resto igual, en la misma propuesta, avisando cual falto y por que.

**Arranca cada tanda desde la version principal de ahora.** Una propuesta hecha
sobre una base vieja puede borrar trabajo mas nuevo sin que se note.

**Antes de fusionar, en cada tanda:** tipos en cero, pruebas en verde,
`npm run check:acentos` limpio y `npm run build` que termine bien.

**Antes de tocar nada, lee:** `docs/MANUAL-DE-LA-APP.md`, `docs/YA-RESUELTO.md` y
`docs/COMO-AUDITAR.md`.

---

## Las cinco reglas que no se rompen

1. **El WhatsApp prepara mensajes y no los manda.** El mensaje sale cuando una
   persona lo toca, desde su propio WhatsApp.
2. **No se tocan textos que ve el cliente si no estan pedidos.** Ya paso: se
   cambiaron la promesa de respuesta y el boton de precio, y hubo que volverlos
   atras.
3. **Nada que aumente lo que se paga por mes.** `apphosting.yaml` no se toca: el
   servidor se duerme a proposito.
4. **Nunca datos inventados mostrados como reales.** Si algo no esta conectado, se
   dice en criollo y se explica como conectarlo.
5. **Nunca desactivar ni saltear una prueba** para que pase el control.

## Y la que costo mas cara: COMPILAR NO ES ANDAR

El 22 de agosto aparecieron **tres cosas escritas que no producian nada**, y las
tres pasaron los cuatro controles. Antes de dar cualquier bloque por terminado:

- **Si algo llama a otra cosa por su nombre escrito** (una direccion, una ruta, el
  nombre de un modelo), **verifica que ese nombre exista de verdad**.
- **Si algo tiene que correr solo**, verifica que **algo lo dispare** y que eso
  **este publicado**. Una tarea programada que no se despliega no existe.
- **Una prueba nueva no vale hasta verla en rojo**: rompé a proposito lo que tiene
  que detectar, y recien ahi dala por buena.

---

# TANDA 1 — Que la app corra sola, y cuatro arreglos

## 1.1 URGENTE: el despertador esta escrito pero NADIE LO PUBLICA

Ya esta fusionado (tarea programada cada 15 minutos en `functions/src/index.ts`,
con traba de concurrencia y pruebas). **Pero no corre y no va a correr.**

El despliegue automatico (`.github/workflows/deploy.yml`) compila `functions/`
pero **despliega solo el sitio**, con `action-hosting-deploy`. La tarea programada
nunca sube a Google. Ademas el sitio va por Firebase App Hosting
(`apphosting.yaml`), que es otro camino.

**Resultado: el codigo esta, las pruebas pasan, y la app sigue tan dormida como
antes.**

Que hacer:
1. **Que el despliegue publique tambien la tarea programada**, en el mismo viaje
   en que se publica el sitio. El dueño no es programador: no va a correr ningun
   comando a mano.
2. **Que se pueda comprobar**: en `/settings/tareas-automaticas`, mostrar **cuando
   fue la ultima vez que el despertador toco la puerta**, distinto de cuando corrio
   cada tarea. Si nunca toco, en rojo y en criollo: "el despertador no esta
   funcionando".
3. **Un control que impida que se repita**: si hay una tarea programada en
   `functions/`, el despliegue tiene que incluirla, o ponerse en rojo.
4. **Si el despliegue necesita algo que no tenes** (permisos, cuenta de servicio),
   **PARA Y AVISA** en una linea. No lo dejes a medias sin decirlo.

Es **una sola** tarea cada 15 minutos: entra en lo incluido, no agrega gasto.

## 1.2 Cuatro arreglos chicos (verificados a mano)

1. **La lista de compras queda en blanco y no dice por que.**
   `src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx:475`. Dibuja una
   tarjeta por proveedor y nada mas. **Un cartel que diga que falta y a que
   pantalla ir a cargarlo.**
2. **El presupuesto del cliente muestra centavos y el resto de la app no.**
   `src/components/budget/BudgetDocument.tsx:31` y
   `src/components/presupuestos/BudgetPrintTemplate.tsx:34` muestran "$ 10.000,00";
   el resto muestra "$ 10.000". **Es el papel que se le manda al cliente.**
   Unificar en cero decimales. Revisa tambien `paso-4-resumen.tsx`.
3. **El boton de borrar una factura cobrada se ve activo y no funciona.**
   `src/components/invoice-list-item.tsx:97`. El servidor la protege bien (no se
   toca). **Que el boton se vea apagado** cuando la factura tiene pagos.
4. **En el tablero de decoracion, el corazon se borra solo sin avisar.**
   `src/app/portal/[fiestaId]/moodboard/page.tsx:57-62`. Al subir una foto si avisa
   (linea 88): **hacer lo mismo aca.**

## 1.3 Rematar el movimiento

1. **Los numeros que suben**: donde hay una cifra que impresiona, que trepe desde
   cero al llegar ahi, una sola vez, con `useReducedMotion`.
2. **La galeria**: al tocar "ver mas", que la tanda nueva entre **escalonada**.
3. **Mientras carga, el molde gris** en vez de un hueco vacio.
4. **SACAR**: en `src/components/landing/HeroSection.tsx` quedaron **tres
   animaciones que no paran nunca**. **Deja una sola**: las otras no se notan y le
   chupan bateria al celular del que esta mirando.

## 1.4 Dos pruebas de navegador que se quejan del Centro de Control

De 596 pasan 594. Las 2 son `tests/e2e/layout-baseline.spec.ts`:
- **Escritorio:** `/admin · no tiene titulo ni contenido`. Pero en celular carga
  bien y el `<h1>` de `src/app/(app)/admin/page.tsx:222` no depende de los datos.
  Lo que dice la prueba no coincide con el codigo.
- **Celular:** `/presupuestos/nuevo · falta referencia para chromium-mobile`. Se
  graba con `UPDATE_MISSING_LAYOUT_BASELINE=true`, **con nada mas corriendo**.

**Ya fallaban antes, no son una regresion.** Si la prueba mide mal, arregla la
prueba. **No la desactives.**

---

# TANDA 2 — WhatsApp, redes, agenda con avisos al celular, la web con modelos y Google

**Detalle completo en `docs/ordenes/detalle/redes-whatsapp-agenda.md`.** Resumen:

## 2.1 URGENTE: la bandeja de WhatsApp abre un numero que no existe

`src/app/(app)/contabilidad/crm/outbox/page.tsx:51`: arma el enlace sacandole los
simbolos al telefono, y queda sin el codigo de pais. WhatsApp dice que el numero no
existe. **Y la app igual lo marca como enviado** (linea 65): en la planilla figura
que se aviso a alguien que nunca recibio nada. En recordatorios de cuota, es plata
que no se reclamo creyendo que si.

**El arreglo ya existe**: `toWhatsAppNumber()` en `src/lib/commercial/contact.ts:18`.
Usala. Y ademas: no marcar como enviado si el numero no se puede armar, poder decir
"en realidad no lo mande", avisar si reprogramar falla, y poder editar el mensaje
antes de mandarlo.

## 2.2 El planificador de redes miente sobre lo que publica solo

El cartel dice "copia y pega para publicar", pero **Instagram y Facebook salen
solos**. Que cada red diga que va a pasar con ella; boton "publicar ahora"; una
pantalla para los que hay que copiar a mano; aviso cuando una publicacion falla; y
vista por estado. **Y lo que mas rinde: que al cerrar una fiesta quede el posteo
escrito**, con las fotos ya aprobadas del muro.

## 2.3 La agenda y los avisos al celular

**Los avisos al celular no funcionan**: `public/firebase-messaging-sw.js` esta
apagado por falta de configuracion, y **no hay nadie que mande nada**. Los
recordatorios solo se crean si alguien abre el panel. **No existe el aviso de
"reunion en una hora".**

Encender los avisos; **que el despertador dispare los recordatorios**; que tocar el
aviso lleve a la pantalla; que la reunion guarde con quien y donde; y **una sola
agenda** en vez de las dos que hay hoy. Cada aviso se manda **una sola vez**.

## 2.4 La web con modelos para elegir

Tres o cuatro modelos de la portada (mismos textos y fotos, cambia el vestido),
vista previa de verdad, volver atras de un toque, **sin romper el posicionamiento
en Google**, probado en celular.

## 2.5 Publicar tambien en Google

Sumar el perfil de empresa de Google como una red mas del planificador. Si no esta
conectado, decirlo y explicar como conectarlo. **Nunca simular que publico.**

---

# TANDA 3 — La app instalable y que funcione sin internet

**Detalle completo en `docs/ordenes/detalle/despues-sin-internet.md`.** Resumen:

- **Ya esta y no se rehace:** la app se instala sin tienda (manifiesto +
  `next-pwa`), el modo quiosco existe, y hay una cola sin internet.
- **Faltan estaciones en el modo quiosco**: fotocabina, espejo magico, touchpix,
  buzon, video de vida, impresion y DJ.
- **Ninguna estacion que captura aguanta sin internet.** La foto se sube en el
  momento y si falla **no queda encolada**.
  **⚠️ La trampa:** la cola de hoy usa `localStorage`, que aguanta pocos megas.
  **Las fotos y videos van en IndexedDB, como `Blob`, no como texto.** Si no, a la
  decima foto revienta en plena fiesta.
- **Toda la app, por niveles:** ver lo ya bajado (todas las pantallas); escribir
  sin internet solo donde es seguro; y decir claramente lo que no se puede.
- **La regla que evita el desastre:** se encola lo que **se suma**, no lo que
  **pisa**. Si dos editan lo mismo sin internet, uno pierde su trabajo sin
  enterarse.
- **No se sube a ninguna tienda de aplicaciones.**

---

# TANDA 4 — La asistente de la app, al maximo

**Detalle completo en `docs/ordenes/detalle/asistente-maxima.md`.** Resumen:

- **El modelo:** el casillero del "pro" apunta al mismo modelo rapido
  (`src/ai/genkit.ts:6-8`). El dueño pidio **la ultima version de Flash (3.7 si ya
  salio) y el Pro, si estan disponibles**. **Verificalo contra la lista oficial de
  Google, no de memoria**, y probá que responden de verdad. Para el rapido usa
  `gemini-flash-latest`, que se actualiza solo cuando Google saca una nueva: hoy
  esta clavado a un numero de version y por eso **no se actualizo cuando salio la
  nueva**.
- **Cargar un prospecto contandoselo**, mostrando lo que entendio antes de guardar.
- **El borrador del presupuesto**: precios del catalogo, nunca inventados, **siempre
  en borrador** y lo cierra una persona.
- **Preparar los mensajes** con los datos reales, en la bandeja.
- **Que hable sin que le pregunten**: el repaso de la manana, armado por el
  despertador una vez por dia.
- **Una asistente para el cliente y el invitado en su portal.** Cada uno ve **solo
  lo suyo**, armado en el servidor. Al invitado **no le llega nada de plata**. Con
  una prueba que lo demuestre.
- **Lo que nunca se le da:** cobrar, mandar mensajes solo, tocar permisos, cerrar un
  presupuesto, borrar nada.

---

# ESTA LISTA ESTA CERRADA

El dueño dijo, con razon, que esta cansado de que cada pregunta abra una lista
nueva. **La app esta sana**: de siete areas auditadas el 22 de agosto, cinco
vinieron sin un solo hallazgo.

**Hace esto y nada mas.** Si mientras trabajas ves algo roto de verdad —que falle
en una fiesta, que mueva mal la plata, o que deje ver a alguien lo que no
corresponde— arreglalo y decilo en una linea. **Todo lo demas que se te ocurra, no
va.** Si no esta roto y el dueño no lo pidio, no existe.

**Y en cada tanda:** si tocas o agregas una pantalla, corré `npm run mapa:generar`,
y anota lo que hiciste en `docs/YA-RESUELTO.md`, en la misma propuesta.
