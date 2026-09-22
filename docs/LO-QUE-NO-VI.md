# Lo que encontró otro y yo no vi

**Orden del dueño, 9 de septiembre de 2026:** *"cada cosa que Codex vea y vos no, sin que te
diga corregís tu método automáticamente; guardá eso"*.

**Para qué sirve esta lista, y no es para pedir perdón.** Cada vez que otro encuentra algo que a
mí se me pasó, lo que falló no fue la atención: **falló la pregunta que yo estaba haciendo**. Si
sólo se arregla el defecto, la próxima vez se me escapa otro igual. Acá queda escrito, para cada
hallazgo: qué era, **qué pregunta de mi método lo hubiera agarrado** —y si ninguna, cuál se
agregó— y el control que lo frena.

**Cómo se usa, sin que nadie lo pida:**

1. Aparece un hallazgo que yo no vi.
2. Antes de arreglarlo, la pregunta es: **¿por qué mi método no lo agarró?**
3. Si ninguna de mis preguntas lo hubiera agarrado, **se agrega la pregunta nueva** a
   `docs/COMO-AUDITAR.md` y se vuelve a pasar lo que toca plata con ella.
4. Se anota acá, con su control.

---

## 22 de septiembre de 2026 (tarde) — La fiesta entera saliendo por la pantalla publica (Codex)

**Qué era:** cinco funciones que tocan un invitado devolvían **la fiesta completa** —todos los
invitados con sus teléfonos y alergias, las mesas, los datos del cliente— y las cinco se pueden
llamar desde internet sin cuenta, porque las usa la pantalla pública de la invitación.

**Por qué mi método no lo agarró, y es lo importante:** yo había mirado **qué campos del
invitado** se devolvían, y me quedé discutiendo el QR. **No miré el resto del objeto que
viajaba al lado.** La pregunta que yo hacía era "¿este dato puede salir?"; la que faltaba es
**"¿qué MÁS sale junto con él?"**. El dato problemático no estaba pedido por nadie: venía de
arrastre porque la función de guardar devuelve todo.

**La pregunta que queda, y vale para toda acción pública:** *¿qué devuelve esta función,
entero?* No los campos que a uno le interesan: **el objeto completo que sale por el cable.** Si
adentro viene algo que el que llama no necesita, sobra, y si el que llama es cualquiera de
internet, es una fuga.

**Y la corrección de alcance, otra vez la misma:** cuando el dueño cerró la discusión del QR,
di el tema por cerrado entero. **Una decisión del dueño cierra lo que él decidió, no el archivo.**

**El control que lo frena:** `src/__tests__/la-pantalla-publica-no-devuelve-la-lista-de-invitados.test.ts`.

## 22 de septiembre de 2026 — Cuatro defectos del calendario (Codex)

**Qué eran:**

1. **Arrastrar una reunión reprogramaba la fiesta entera**, y le salía el aviso al cliente con
   la fecha nueva. Las reuniones y las fiestas se dibujan igual y las dos llevan el número de
   la fiesta; había una sola acción para las dos.
2. **Una fiesta con la fecha ilegible dejaba el calendario completamente vacío.** El error se
   comía la lista entera, y una agenda sin nada se ve igual que no tener fiestas.
3. **Las fiestas de noche aparecían al día siguiente**, y marcaban ocupado el día equivocado
   para vender.
4. **Una fecha imposible se guardaba como otra.** El 31 de febrero no falla: se corre solo al
   3 de marzo, se guarda cambiado y sale el aviso al cliente con ese día.

**Por qué mi método no los agarró.** El tercero sí lo tenía —la pregunta trece, la hora de
Uruguay— y **no lo volví a pasar por el calendario** cuando lo arreglé en el reporte de cobros:
ese es un error mío de alcance, no de método. Los otros tres **no los agarraba ninguna de las
diecinueve preguntas**: todas miran si algo funciona, ninguna preguntaba **sobre qué está
funcionando** ni qué pasa con el registro roto de al lado.

**Qué preguntas se agregaron:** la **20** —si dos cosas distintas se dibujan igual, ¿la acción
sabe cuál agarró?— y la **21** —un registro roto, ¿se lleva puesta la lista entera?—, las dos
en `docs/COMO-AUDITAR.md`.

**Y la corrección de alcance, que es la que más me importa:** cuando una pregunta del método
arregla un caso, **hay que barrer con ella los demás lugares que tengan la misma forma**, no
sólo el que se reportó. La pregunta trece estaba puesta desde el 8 de septiembre y el calendario
siguió contando los días en hora de Greenwich dos semanas más.

**El control que lo frena:** `src/__tests__/el-calendario-no-mueve-la-fiesta-equivocada.test.ts`,
con las cuatro comprobaciones, cada una probada rompiéndola.

## 8 de septiembre de 2026 — Cinco defectos contables (Codex)

**Qué eran:** un cobro que desaparecía cuando dos personas cobraban a la vez; una cuota que se
anunciaba cobrada —con mail al cliente— sin haberse guardado; una conciliación que fallaba en
silencio; un flujo de caja que mostraba cero cuando no había podido leer nada; y las facturas de
la empresa legibles por cualquiera del equipo con sesión.

**Por qué no los vi:** mis seis preguntas miraban si algo **está y funciona**. Los cinco estaban
escritos, alguien los llamaba, dejaban rastro y tenían pruebas en verde. **Vivían en el camino de
al lado**: el que se recorre cuando algo falla, o cuando dos personas hacen lo mismo a la vez.

**Qué pregunta se agregó:** la séptima —*¿qué pasa cuando falla, y qué pasa si son dos a la
vez?*—, en `docs/COMO-AUDITAR.md`. Con ella salieron **140 lugares más** en toda la app con la
misma forma, ninguno de los cuales se habría encontrado con las preguntas viejas.

```comprobar
prueba: src/__tests__/dos-cobros-a-la-vez-no-se-pisan.test.ts
prueba: src/__tests__/la-contabilidad-no-miente.test.ts
archivo: scripts/nadie-dice-que-si-sin-mirar.mjs
```

## 8 de septiembre de 2026 — La galería pública mostraba borradores (Codex)

**Qué era:** un borrador a medio escribir o una publicación programada para dentro de un mes
salían igual en la portada, a la vista de cualquiera.

**Por qué no lo vi:** ninguna de mis preguntas mira **quién puede ver lo que todavía no salió**.
Yo controlaba que las pantallas hicieran lo que dicen, no que lo que se muestra esté autorizado a
mostrarse.

**Qué se hace distinto:** en todo lo que se publica hacia afuera, la regla es **fallar cerrado**:
un estado que no está en la lista de lo autorizado, no sale. Una foto de menos no cuesta nada;
una de más puede ser la fiesta de un cliente antes de tiempo.

```comprobar
prueba: src/__tests__/la-web-no-muestra-ni-pierde-lo-que-no-debe.test.ts
```

## 9 de septiembre de 2026 — El 3D dibujaba una mesa donde había un arco (Codex)

**Qué era:** cualquier elemento que no fuera barra, pista o escenario se dibujaba como una mesa.
Y cargar un diseño guardado podía **duplicar las medidas**.

**Por qué no lo vi:** yo comprobaba que la pantalla del 3D abriera y dibujara algo. **Nunca
comprobé que dibujara lo mismo que el plano.** Que se vea no es que sea fiel.

**Qué se hace distinto:** cuando una pantalla **representa** otra cosa —un plano, una factura, un
presupuesto—, la pregunta no es "¿se ve?" sino **"¿coincide con lo que representa?"**. Va con las
medidas comparadas, no a ojo.

```comprobar
archivo: docs/ordenes/52-el-3d-muestra-lo-que-se-acordo.md
```

## 9 de septiembre de 2026 — El itinerario interno llegaba al cliente (Codex)

**Qué era:** al portal del cliente se le mandaba **el programa entero**, incluidos los momentos
que el equipo marca como internos —"cambio de turno del personal", "el padre llega tarde"— y las
notas internas de cada momento. Una de las dos pantallas del portal los mostraba tal cual, y la
otra los escondía **después de haberlos recibido**.

**Por qué no lo vi:** yo comprobaba que la pantalla escondiera lo que no corresponde. Nunca me
pregunté **qué se le manda al navegador**. Esconder algo que ya viajó no es esconderlo: el dato
está en la computadora del cliente igual.

**Qué pregunta se agregó:** en todo lo que sale hacia un cliente o un invitado, la pregunta no es
*"¿la pantalla lo muestra?"* sino **"¿el servidor se lo mandó?"**. Se filtra y se recorta en el
servidor, y la pantalla es la segunda barrera, no la primera.

**Y al pasar toda la app con la pregunta nueva apareció un segundo lugar, peor:** el muro de la
fiesta —el que abre **cualquier invitado** con el enlace— mandaba el mismo itinerario completo.
Ese no lo había reportado nadie: salió de aplicar la pregunta, que es exactamente para lo que
sirve agregarla.

```comprobar
prueba: src/__tests__/el-cliente-no-ve-lo-interno-del-itinerario.test.ts
usa: mapProgramaParaElCliente en src/lib/client-portal/public-fiesta.ts
usa: mapProgramaParaElCliente en src/lib/social-fiesta/public-event.ts
```

## 10 de septiembre de 2026 — El autoguardado del salón decía "guardado" sin guardar (Codex)

**Qué era:** el autoguardado de la distribución del salón llamaba al guardado, **tiraba el
resultado a la basura** y contestaba que había salido bien. Si el guardado fallaba, el cartel
decía "guardado" igual y el trabajo se perdía sin que nadie se enterara.

**Por qué no lo vi, y ahí está el agujero de verdad:** el control que persigue exactamente este
defecto en toda la app —`npm run "dice-que-si?"`— **sólo reconocía las funciones que escriben en
su firma que devuelven `{ success }`**. Y las funciones que usan las pantallas no lo escriben:
`src/app/actions/fiesta-actual.ts` tiene **57 puertas de paso de una línea** que le pasan la
pelota al módulo de abajo y heredan el resultado sin declararlo. O sea: el control miraba para el
lado del código que las pantallas **no** usan.

**Qué se hace distinto:** el control ahora **sigue la cadena**. Si una función no hace más que
devolver lo que devuelve otra que sí promete `{ success }`, también devuelve el error. Al
encenderlo aparecieron **cuatro** lugares, no uno: el que reportó Codex, la captura de la vista 3D
—que anunciaba "preview guardado en el portal del cliente"—, el autoguardado del planificador de
costos y el cronograma sugerido. Los tres últimos no los había reportado nadie: salieron de
arreglar el método, que es para lo que sirve.

**La regla que queda:** un control que reconoce cosas **por cómo están escritas** se escapa todo
lo que está escrito de otra manera. Antes de confiar en uno, hay que preguntarle **cuántas cosas
encontró de las que tendría que ver**, no si dio verde.

```comprobar
archivo: scripts/nadie-dice-que-si-sin-mirar.mjs
usa: siguiendoLasPuertasDePaso en scripts/nadie-dice-que-si-sin-mirar.mjs
```

## 10 de septiembre de 2026 — Dos toques al botón pagaban dos imágenes (Codex)

**Qué era:** la imagen del salón decorado que arma la inteligencia artificial **se paga por
unidad** y hay un tope de tres por fiesta. El tope se contaba antes de generar y se guardaba
después; entre esas dos cosas entraba otro pedido. Con dos imágenes hechas y lugar para una, dos
toques seguidos **pagaban dos**.

**Por qué no lo vi:** la séptima pregunta del método —*"¿qué pasa si dos personas lo hacen a la
vez?"*— la venía aplicando a lo que **guarda plata**: cobros, cuotas, facturas. No a lo que
**gasta** plata. Un tope que se cuenta afuera del turno no es un tope.

**Qué se hace distinto:** la pregunta de las dos personas a la vez se aplica igual a **todo cupo,
tope o saldo que autorice un gasto**, no sólo a lo que registra un cobro. Contar y gastar van
adentro del mismo turno.

```comprobar
prueba: src/__tests__/decoracion-no-gasta-de-mas.test.ts
usa: visualizacionesMutex en src/app/actions/fiesta/decoracion.actions.ts
```

## 10 de septiembre de 2026 — La nota "para el equipo" se le publicaba al cliente (Codex)

**Qué era:** el cuadro "Notas Generales" de la pantalla de decoración dice, en su propio texto
de ayuda, *"notas para el equipo"*. Y todo lo que el equipo escribía ahí se le publicaba al
cliente en su portal, tal cual.

**Por qué no lo vi:** el 9 de septiembre agregué la pregunta *"¿el servidor se lo mandó?"* y la
pasé por el itinerario, que era donde había aparecido el defecto. **No la pasé por los otros
campos que van al portal.** Agregar una pregunta y aplicarla sólo donde saltó el problema es
media pregunta.

**Qué se hace distinto:** cuando se agrega una pregunta al método, **se pasa por todo lo que
sale hacia un cliente o un invitado, no por el caso que la motivó**. Y hay una señal barata que
delata a estos: **si la pantalla que lo escribe dice "interno", "para el equipo" o "no mostrar",
ese campo no puede estar en ningún recorte que salga del servidor.** Es texto contra texto, se
busca en un minuto.

```comprobar
prueba: src/__tests__/la-decoracion-llega-al-cliente-como-es.test.ts
usa: notaDecoracionParaElCliente en src/lib/client-portal/public-fiesta.ts
```

## 14 de septiembre de 2026 — Guardar un cambio podía borrar el resto (Codex)

**Qué era:** cuando se guarda un cambio parcial —sólo el teléfono de un contacto, un dato de
ajustes— la app **lee lo que había, le suma lo nuevo y guarda el conjunto entero**. La función
que lee devolvía lo mismo —"nada"— en dos casos que no son iguales: cuando el documento **no
existe**, y cuando **no se pudo leer**. Con la base lenta o cortada, la app entendía que no había
nada y **guardaba encima sólo el pedacito nuevo. El resto se borraba**, sin aviso.

**Por qué no lo vi, y es la parte que corrijo del método.** Yo había mirado este mismo lugar dos
días antes, y lo miré bien: frené un cambio que le ponía un tope de espera a la lectura, y dije
que si esa lectura se pasaba del tope se borraba el resto. **Vi el peligro y lo até al cambio que
lo traía.** Nunca me pregunté si el mismo agujero estaba abierto sin ese cambio. Y lo estaba:
cualquier falla de lectura hace lo mismo.

**Qué se hace distinto:** cuando se rechaza un cambio porque **abre** un agujero, la pregunta que
sigue es *"¿ese agujero ya está abierto por otro lado?"*. Rechazar algo peligroso no arregla lo
que ya era peligroso. Es la misma forma del error de la nota interna: aplicar una pregunta nueva
sólo donde saltó, en vez de pasarla por todo.

**Y la regla de fondo que queda escrita:** una función que devuelve "no hay nada" **tiene que
distinguir "está vacío" de "no pude mirar"**, siempre que lo que devuelve se use para decidir qué
se guarda encima.

```comprobar
prueba: src/__tests__/guardar-un-cambio-no-borra-el-resto.test.ts
usa: leerGenericJsonParaGuardarEncima en src/lib/data-service.ts
```

## 16 de septiembre de 2026 — Arreglé un turno y rompí el de al lado (lo vio Codex)

**Qué era:** la fotocabina y el espejo quedaban colgados en "Subiendo..." para la persona
siguiente de la fila. Yo frené la entrega de Gemini por eso —bien frenada— y le indiqué que el
apagado de ese cartel fuera **sin condición**. Codex probó los dos turnos con una sonda sobre el
código real y mostró que mi indicación **arregla un caso y abre otro**: si la persona siguiente
ya empezó SU PROPIA subida, la respuesta tardía de la anterior **le apaga el cartel a ella**.

**Por qué no lo vi:** miré el turno que fallaba —la persona siguiente esperando— y no el turno de
al lado —la persona siguiente ya trabajando—. El cartel de subiendo es de la pantalla, no de la
persona, y con estado compartido entre turnos hay más de un camino.

**La pregunta que lo hubiera agarrado, y que queda puesta:** ante cualquier arreglo sobre estado
compartido, *"¿de quién es lo que estoy tocando, y qué pasa si el siguiente ya empezó lo suyo?"*.
Con su mitad obligatoria: **el turno nuevo limpia lo heredado**, en vez de confiar en que el que
termina tarde se abstenga.

**Y el corolario para las órdenes:** una comprobación no pide la forma del código —"que no haya
un `if` ahí"— sino el resultado en pantalla con las dos personas.

```comprobar
archivo: docs/ordenes/DEVOLUCION-48-entretenimiento-sesion-segura.md
```

## 16 de septiembre de 2026 — El trabajo que sale A MEDIAS, no el que falla (lo vio Codex)

**Qué era:** tres defectos de respaldos. Una copia a la que le faltaban partes se guardaba
**marcada como completa** —y la rotación borraba una copia vieja que sí estaba entera—; una
restauración que dejaba archivos afuera anunciaba **"Restauración Completa"**; y cualquiera con
sesión podía borrar respaldos o bajarse todo el negocio en un archivo.

**Por qué no lo vi:** mi séptima pregunta es *"¿qué pasa cuando falla?"*, y estos tres **no
fallan**: salen a medias y **terminan bien**. Devuelven éxito, escriben su registro y dejan la
pantalla en verde. El camino del medio —ni todo ni nada— no lo estaba mirando nadie.

**La pregunta nueva, que queda puesta en `docs/COMO-AUDITAR.md`:** *"¿puede terminar a medias y
decir que terminó?"*. Se aplica a todo lo que recorre una lista y sigue después de un tropiezo:
respaldos, restauraciones, importaciones, envíos en tanda, sincronizaciones.

**Y la regla de fondo:** lo que salió a medias **no puede decir que salió**, y sobre todo **no
puede pisar ni borrar lo anterior**, que es lo que convierte un aviso en una pérdida.

```comprobar
prueba: src/__tests__/el-respaldo-no-miente.test.ts
```

## 17 de septiembre de 2026 — El arreglo que tapa el caso ruidoso y deja el silencioso (lo vio Codex)

**Qué era:** dos arreglos MÍOS del día anterior, los dos incompletos por la misma razón.

- El respaldo frenaba cuando la lectura **tiraba un error**. Pero leer acá casi nunca tira error:
  devuelve vacío. El respaldo seguía guardando **cero datos marcados como copia completa**.
- El reporte ya comparaba días en vez de horas, pero tomaba el día **tal cual venía escrito**, y
  los cobros vienen con hora de Greenwich: los de la noche del último día seguían afuera.

**Por qué no lo vi:** arreglé **el caso que me contaron** y no recorrí los otros caminos por los
que entra el mismo dato. Le pregunté al código *"¿qué pasa cuando falla?"* y me quedé con la
forma ruidosa de fallar —la excepción— sin preguntarme **cómo falla esto en silencio**.

**La pregunta nueva, que queda puesta en `docs/COMO-AUDITAR.md`:** *"¿de cuántas formas puede
venir mal este dato, y cuál de ellas no hace ruido?"*. Un arreglo se prueba con **todas las
formas del dato** —vacío, con zona horaria, sin ella, a medias— no sólo con la que se reportó.

**Y el corolario, que vale para cualquier arreglo mío de acá en adelante:** **verificar un arreglo
propio es mirar el caso de al lado**, no repetir el caso que lo originó. Los dos defectos de este
día habrían aparecido escribiendo una segunda prueba con el dato entrando por la otra puerta.

```comprobar
prueba: src/__tests__/el-respaldo-no-miente.test.ts
prueba: src/__tests__/el-reporte-y-las-invitaciones-no-mienten.test.ts
```

## 17 de septiembre de 2026 — Lo que entra por una puerta pública, y la prueba que no puede fallar (lo vio Codex)

**Qué era:** tres defectos en la encuesta post fiesta. El botón quedaba en "Enviando..." para
siempre si se cortaba la señal; dos respuestas simultáneas perdían una; y se aceptaba cualquier
cosa que llegara del navegador —una nota de 99, y el campo interno que hace que **no se le pida
nunca más la reseña en Google a ese cliente**.

**Por qué no lo vi:** miré la encuesta como una pantalla del cliente y no como **una puerta
abierta al público**. Es de los poquísimos lugares de la app donde alguien sin cuenta manda datos
al servidor, y ahí la pregunta no es "¿funciona?" sino **"¿qué pasa si lo que llega no es lo que
manda la pantalla?"**. Con sesión, esa pregunta casi no hace falta; sin sesión, es la primera.

**La pregunta nueva, que queda puesta en `docs/COMO-AUDITAR.md`:** *"esto lo puede mandar
cualquiera: ¿qué campos se copian sin mirar?"*. Se aplica a todo lo que contesta un invitado o un
cliente sin cuenta: encuesta, confirmación de asistencia, buzón de recuerdos, muro.

**Y lo segundo, que me lo agarré yo solo al romper el control a propósito:** la prueba de "dos a
la vez" que escribí **no podía fallar**, porque la base de mentira devolvía siempre la misma lista
en memoria. Quedó anotado en la lista de errores de `CLAUDE.md`.

```comprobar
prueba: src/__tests__/la-encuesta-no-se-traga-cualquier-cosa.test.ts
prueba: src/__tests__/las-pantallas-publicas-no-quedan-colgadas.test.ts
```

## 18 de septiembre de 2026 — El control que mira un campo que no existe (lo vio Codex)

**Qué era:** el borrado de un equipo comprobaba que no estuviera asignado mirando `item.id` y
`item.activoId`. **Esos campos no existen en la lista de carga**, que guarda el equipo del
catálogo en `origenId`. El control parecía puesto y en los hechos sólo comparaba el nombre: con
renombrar el equipo se podía borrar igual.

**Por qué no lo vi:** mis preguntas comprueban que el control **exista** y que **alguien lo
llame**. Ninguna comprueba que **el campo que mira sea el que el dato tiene de verdad**. Un
control que lee un campo inexistente da siempre "no hay conflicto" y **se ve idéntico a uno que
funciona**.

**La pregunta nueva, puesta en `docs/COMO-AUDITAR.md`:** *"el campo que este control compara,
¿existe en el dato que le llega?"*. Se aplica a todo control de "no se puede borrar / no se puede
duplicar / ya está usado", que es donde una comparación que nunca acierta pasa desapercibida.

```comprobar
prueba: src/__tests__/no-se-borra-un-equipo-asignado.test.ts
```

## 20 de septiembre de 2026 — La direccion se perdia al pasar por el ingreso

**Que era:** al rebotar por la pantalla de ingreso, la app se quedaba con la ruta y tiraba
el `?fiestaId=...`. La pantalla volvia sin fiesta y quedaba cargando para siempre.

**Que pregunta lo hubiera agarrado:** ninguna de las que tenia. Todas miran la pantalla
abierta directo. **Pregunta nueva:** *"si esta pantalla se abre con datos en la direccion,
¿sobreviven a un rebote por el ingreso?"* — y su hermana: *"cuando falta ese dato, ¿la
pantalla lo dice, o se queda cargando?"*

**El control que lo frena:** `src/__tests__/al-volver-del-ingreso-no-se-pierde-la-fiesta.test.ts`.

## 20 de septiembre de 2026 — Un campo que no existe, escondido en un `as any`

**Que era:** el indicador de preparacion leia `fiesta.planPago`, que no existe (es
`planDePagos`). Con `as any` el revisor de tipos no dice nada y la cuenta da cero para
siempre: 100% de preparacion con cuotas sin cobrar.

**Que pregunta lo hubiera agarrado:** ninguna. **Pregunta nueva:** *"cada `as any` que lee
un campo, ¿ese campo existe en el tipo? ¿Lo escribe alguien alguna vez?"* Un `as any` que
lee es una cuenta que puede estar dando cero desde siempre sin que nadie se entere.

**El control que lo frena:** `src/__tests__/el-indicador-de-preparacion-ve-las-cuotas.test.ts`,
y el barrido de todos los `as any` que leen campos queda como orden para Gemini.

## 20 de septiembre de 2026 — Juntar renglones sin mirar la unidad

**Que era:** la lista de compras sumaba 200 g con 2 kg como si fueran lo mismo.

**Que pregunta lo hubiera agarrado:** ninguna de las mias miraba las claves con las que se
agrupa. **Pregunta nueva:** *"cuando se juntan cosas para sumarlas, ¿la clave incluye TODO lo
que las hace distintas (unidad, moneda, impuesto, fecha)? Si falta una, el total miente."*

**El control que lo frena:** `src/__tests__/la-lista-de-compras-no-suma-gramos-con-kilos.test.ts`.

## 20 de septiembre de 2026 — Acciones ofrecidas a la inteligencia artificial que nadie ejecuta

**Que era:** el texto de instrucciones le ofrecia al asistente siete acciones y el servidor
ejecutaba dos. Contestaba como si hubiera hecho las otras cinco.

**Que pregunta lo hubiera agarrado:** ninguna. Las mias miran si algo que existe funciona;
esta mira **lo que se le promete a la inteligencia artificial**. **Pregunta nueva:** *"todo lo
que el asistente puede DECIDIR hacer, ¿alguien lo ejecuta? ¿Y lo que ejecuta, esta declarado?"*
Las tres listas —el tipo, las instrucciones y el ejecutor— tienen que decir lo mismo.

**El control que lo frena:** `src/__tests__/el-secretario-hace-lo-que-dice-que-hace.test.ts`.

## 20 de septiembre de 2026 — Controles dormidos, que es de donde sale casi todo lo que encuentra Codex

**Que era:** dos pruebas de comida apagadas hacia semanas, y una prueba de la vista 3D que
siempre salia por una puerta de emergencia. Ninguna estaba rota: **ninguna miraba**.

**Que pregunta lo hubiera agarrado:** ninguna de las mias mira a los controles. **Pregunta
nueva:** *"¿este control esta mirando de verdad, o se saltea solo cuando no encuentra datos?"*
Un control que se apaga solo es peor que no tenerlo, porque da verde.

**El control que lo frena:** `src/__tests__/ninguna-prueba-esta-apagada.test.ts`.
