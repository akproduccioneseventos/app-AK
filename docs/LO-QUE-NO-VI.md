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
