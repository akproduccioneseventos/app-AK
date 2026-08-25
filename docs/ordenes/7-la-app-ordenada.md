# Orden 7 — La app ordenada: tres puertas, y que no mienta

**Para:** Gemini
**Fecha:** 25 de agosto de 2026
**Entrega:** **UNA SOLA propuesta de cambios con los ocho bloques.** No una por bloque:
cada fusión dispara un despliegue y eso lo paga el dueño. Si un bloque se traba,
entregá los otros siete igual, en la misma propuesta, y decí cuál faltó y por qué.

---

## Por qué existe esta orden

La app tiene **350 pantallas por dentro, 39 opciones de menú y 46 tarjetas** al abrir una
fiesta. Se contó una por una: **no sobra ninguna**. De esas 350, 38 son carteles que
redirigen de una dirección vieja a la nueva y las demás están enlazadas y se usan. El
problema nunca fue tener cosas de más: **es tenerlas todas apiladas en la entrada**.

El dueño lo pidió así: *"quiero la misma app con su potencial pero más organizada y más
fácil de usar, no esta app compleja"*.

**La regla que manda sobre todo lo demás en esta orden: no se borra nada que funcione.**
Cambia por dónde se llega, no qué hay. Toda pantalla que hoy existe tiene que seguir
siendo alcanzable.

---

## Bloque 1 — «Mi día», y las palabras que no se usan

**Lo que pidió el dueño, textual:** *"palabras como riesgo, urgente, no me gustan, me dan
estrés. Debe ser un módulo, solo yo entro y sé qué debo hacer"*.

**Qué hay que hacer:** una pantalla nueva, `/mi-dia`, que sea **lo primero que se ve al
entrar** al panel. Junta lo que hoy está repartido en seis pantallas: Repaso Diario,
Alertas, Cambios a Aprobar, Incidentes, WhatsApp del Día y el Control Operativo.

**Cómo tiene que estar escrita**, que es la parte que importa:

- **Cada línea es una cosa para hacer, no un estado.** No "pago vencido: $12.000" sino
  **"Cobrarle la segunda cuota a Marcela"**. No "tarea atrasada" sino **"Confirmar el
  menú con el salón"**. Con el nombre de la persona y el toque que la resuelve al lado.
- **Palabras prohibidas en esta pantalla:** *riesgo, urgente, crítico, vencido, alerta,
  atrasado, pendiente*. Ni en los títulos, ni en las etiquetas, ni en los mensajes.
- **Nada de rojo para apurar.** Sin semáforos, sin porcentajes de riesgo, sin contadores
  regresivos. El orden alcanza: lo de hoy arriba, lo de más adelante abajo.
- **Si no hay nada para hacer, se dice.** "Por hoy está todo al día" y nada más. Una
  pantalla vacía que no explica nada es peor que no tenerla.

**De dónde salen los datos:** de lo que la app ya calcula (cuotas, tareas, decisiones del
cliente, mensajes preparados, cambios a aprobar). **No inventes números nuevos ni
agregues cálculos.** Si un dato no existe, no lo muestres.

**Los mensajes preparados van con su botón de mandar**, y sale **cuando la persona lo
toca**, desde su propio WhatsApp. Eso no cambia: preparar sí, mandar no.

---

## Bloque 2 — La fiesta, ordenada por momentos

**El problema:** `src/app/(app)/fiestas/nueva/page.tsx` muestra **46 tarjetas en diez
categorías**, quince marcadas "Interno". Nadie usa 46 cosas para armar una fiesta.

**Qué hay que hacer:** que al abrir una fiesta se vea, en este orden:

1. **Lo que hay que hacer en esta fiesta**, con el mismo criterio de escritura del bloque
   1 (frases de acción, sin palabras de alarma).
2. **Los cuatro momentos**, cada uno con sus accesos:
   - **Vender:** presupuesto, contrato y cláusulas, plan de cuotas, cobros y recibos,
     documentos.
   - **Armar:** invitados y confirmaciones, menú/alergias/dietas, lista de compras,
     salón y decoración, personal y cronograma, música, proveedores, cartelería.
   - **La noche:** tótem de barra, fotocabina, espejo mágico, plataforma 360, Touchpix,
     muro en vivo, cabina del DJ, buzón, check-in, impresión.
   - **Después:** álbum, encuesta, reseña de Google, cierre de costos y rentabilidad.
3. **«Ver todo»**, que muestra las 46 agrupadas como están hoy. Lo marcado "Interno" vive
   sólo acá.

**Lo que NO hay que hacer:** borrar pantallas ni cambiar lo que hacen. Es sólo qué se
muestra primero.

---

## Bloque 3 — Dos pantallas de «¿está lista?» se hacen una

`/fiestas/[id]/ak-100` y `/fiestas/nueva/fiesta-lista` revisan casi lo mismo —portal del
cliente, invitados, operación, post-fiesta, muro social— y dan **dos puntajes distintos**.
Dos números parecidos y el dueño no sabe a cuál creerle.

**Qué hay que hacer:** dejar **una sola**, que conteste "¿está lista esta fiesta?".
Quedate con la que cubre más (AK-100 revisa ocho áreas) y sumale lo que sólo tiene la
otra (la zona digital). La dirección que se saca queda como redirección a la que queda,
para no romper enlaces guardados.

`/fiestas/nueva/readiness` **no se junta con esas dos**: mira otra cosa (cuotas y tareas
por fecha). Su contenido pasa a ser la parte de "lo que hay que hacer" del bloque 2, y la
pantalla suelta se saca del menú.

---

## Bloque 4 — El módulo de Marketing

**Lo que pidió el dueño, textual:** *"el módulo de marketing, donde esté todo referente a
eso: WhatsApp, redes, paneles, páginas de aterrizaje, etc."*

Hoy eso está desparramado en cuatro lugares del menú: las redes por un lado, el WhatsApp
en ajustes, las páginas de venta en otro lado y los anuncios dentro de contabilidad.

**Qué hay que hacer:** un módulo **Marketing**, con todo adentro:

- Redes sociales y planificador de contenido
- Comentarios de redes y moderación
- WhatsApp: plantillas, bandeja de salida, conversaciones
- Blog
- Páginas de aterrizaje: bodas, quince, cumpleaños, experiencia AK
- Editor de la web pública
- Publicidad y anuncios, y su rendimiento
- Ficha de Google y reseñas
- Galería y catálogo público
- Presentación LED

**Ojo:** mover una pantalla de lugar en el menú **no es mover el archivo**. Si cambiás
direcciones, dejá redirección desde la vieja. Y corré `npm run mapa:generar`.

---

## Bloque 5 — El resto del menú: tres puertas y nada más

Arriba quedan **tres puertas**, no cinco secciones con 39 opciones:

- **Mi día** (bloque 1)
- **Fiestas** (bloque 2)
- **La empresa**, con cuatro grupos: **Vender** (prospectos, simulador, presupuestos,
  clientes), **Plata** (pagos rápidos, panel contable, facturas, métricas), **Recursos**
  (comida y menús, insumos, salones, catálogo de servicios, proveedores, empleados) y
  **Marketing** (bloque 4).

**Ajustes sale del camino:** conexiones, tareas automáticas, WhatsApp (la configuración,
no el uso diario), contratos y cláusulas, seguridad, promociones, asistente y plantillas.

**Laboratorio:** lo experimental deja de estar mezclado con el trabajo diario. Vive en un
solo lugar y **sólo lo ve el administrador**.

---

## Bloque 6 — Instagram deja de mentir

**Verificado línea por línea:** el mensaje que ve el usuario dice *"Instagram todavia no
esta conectado. Se conecta desde Ajustes, en Redes sociales."*
(`src/app/actions/social-media.ts`). Pero esa pantalla
(`src/app/(app)/settings/social-connections/page.tsx`) **sólo guarda la dirección del
perfil**. Lo que de verdad hace falta está en `src/lib/instagram/public-feed.ts`: un
permiso de Meta y el identificador de la cuenta comercial, que hoy se leen del entorno del
servidor y **no se pueden cargar desde ninguna pantalla**.

El dueño puede cargar su perfil, ver que quedó "conectado", y no bajar una sola foto
nunca, sin entender por qué.

**Qué hay que hacer:**

1. Que la pantalla de conexiones pueda recibir lo que de verdad conecta Instagram.
2. Que muestre **estado real**: conectado / falta un dato / vencido, con la fecha de la
   última vez que bajó fotos y cuántas trajo.
3. Un botón de **probar la conexión** que pregunte de verdad y diga qué pasó, en criollo.
4. Si falta algo, el mensaje dice **qué** falta. Nunca mandar a una pantalla donde el
   problema no se resuelve.

**Cuidado:** el permiso de Meta es un dato sensible. No se muestra en pantalla una vez
guardado, no viaja al navegador del invitado y no se escribe en el registro. Ya hay una
prueba que impide que esos datos salgan al público
(`src/app/actions/social-connections.ts`): respetala.

---

## Bloque 7 — El control que impide mentir

Esto es lo que hace que el bloque 6 no se repita en otro lado dentro de dos meses.

**Todos los errores de esta semana son de la misma familia:** la app dice una cosa y hace
otra. El botón de ingreso decía "Ingresando..." sin ingresar. Una pantalla decía que el
asistente estaba "temporalmente desactivado" y funcionaba. La cabina decía "tu foto se
sube cuando vuelva la señal" y con un iPhone la perdía. Instagram dice "se conecta desde
Ajustes" y ahí no se puede conectar.

**Qué hay que hacer:** una prueba (`src/__tests__/ninguna-pantalla-miente.test.ts`) que
recorra las pantallas y falle cuando una **afirma un estado que no comprobó**. Palabras a
vigilar en el texto que ve el usuario: "conectado", "sincronizado", "publicado",
"enviado", "guardado", "activo".

La regla: si una pantalla muestra una de esas palabras, tiene que salir de un dato que
vino del servidor diciendo que pasó. No de una constante escrita a mano, ni de que la
llamada no tiró error.

El mensaje de error tiene que decir en criollo qué pantalla y qué palabra, y por qué
importa. Los casos legítimos se declaran en una lista **con el motivo escrito al lado**,
como ya se hace en `auditoria-puertas-abiertas.test.ts`. Sin motivo, no entra.

---

## Bloque 8 — Sacar lo que es de programador, y arreglar dos pantallas rotas

**Sacar de la aplicación** (el contenido, si sirve, queda en `docs/`):

- `src/app/(app)/fiestas/nueva/integracion-post-445/` — lista 37 cambios de código con
  sus números de propuesta.
- `src/app/(app)/fiestas/nueva/cierre-100/` — una revisión de desarrollo.

Hay que sacar también los accesos que llevan a ellas (`post445-quick-access.tsx` y lo que
enlace desde la pantalla de armar la fiesta).

**Arreglar dos pantallas que muestran algo que no tiene nada que ver:**

`src/app/(app)/fiestas/nueva/reuniones/imprimir/page.tsx` y
`src/app/(app)/empresa/todos-los-servicios/[id]/editar/page.tsx` son **dos archivos
idénticos renglón por renglón** (741 líneas, la misma huella), y los dos muestran **el
diseñador de mesas del salón**. Pasó por una copia mal hecha y no lo agarró ninguna prueba
porque compila.

- El botón **"Imprimir"** de Reuniones tiene que dar una hoja imprimible de las reuniones.
  Mirá cómo lo hacen `itinerario/pdf`, `musica/pdf` y `decoracion/pdf`.
- El botón **"Diseño visual"** del catálogo de servicios
  (`src/app/(app)/empresa/servicios/page.tsx`, línea 312) apunta a esa pantalla. El
  servicio ya tiene su editor propio en `/empresa/servicios/editar/[id]`: **sacá ese
  botón** y la pantalla que abre.

---

## Antes de entregar

- `npm run check:acentos` — sin acentos rotos. **Con acentos rotos no se fusiona.**
- `npx tsc --noEmit` — cero errores.
- `npx jest --silent` — todas en verde.
- `npm run build` — tiene que terminar bien. **No alcanza con el revisor de tipos:** ya
  pasó que los tipos daban cero y el build fallaba, y la app estuvo seis días sin poder
  publicarse.
- `npm run mapa:generar` — el manual se regenera solo, no lo edites a mano.
- **No toques `apphosting.yaml`.** **Tres entregas seguidas la trajeron modificada** con
  la configuración de cobros vieja: si tu copia la trae, sacá ese cambio antes de entregar.
- Anotá lo que hiciste en `docs/YA-RESUELTO.md` y en `docs/MANUAL-DE-LA-APP.md`, **en la
  misma propuesta**.

## Y la regla nueva, que vale de acá en adelante

**No se agrega una pantalla nueva sin sacar otra**, salvo que la pida el dueño. La app
llegó a 350 pantallas porque cada pedido se convirtió en una pantalla más en vez de un
cambio en la que ya existía. Si para resolver algo te parece que hace falta una pantalla
nueva, primero fijate si no se puede resolver en una que ya está.
