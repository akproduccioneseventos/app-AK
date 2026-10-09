# Antes de decir "terminé": las quince preguntas

**Para las tres IA que programan esta app, y para cualquier entrega.** Es la lista corta de
lo que hay que mirarle al propio trabajo antes de decir que está hecho. No es una auditoría
general —eso está prohibido—: es el repaso de **lo que uno acaba de tocar**.

**Por qué existe, y con números.** Desde que Codex empezó a revisar, encontró **alrededor de
veinte defectos y todos eran ciertos**. Ninguno estaba roto a la vista: todos compilaban,
tenían pruebas en verde y decían que funcionaban. Cada uno dejó una pregunta nueva o un
control automático, y hoy hay **quince preguntas** y **más de cincuenta controles** puestos.

**La idea de esta lista es que el que programa se haga las quince preguntas ANTES**, para que
cuando Codex pase, lo que encuentre sea algo **nuevo** y no lo mismo otra vez.

---

## Las quince preguntas

1. **¿Dejó rastro?** Lo que tiene que pasar solo —una tarea, un aviso, un cierre—, ¿cuándo
   pasó por última vez? "Nunca" es una falla.
2. **¿Alguien lo llama?** Que la función exista no alcanza. Hay que ver **quién la usa**.
3. **¿Necesita algo que no está?** Y si falta, ¿avisa, o **inventa datos** como si fueran
   reales? Lo segundo es lo más grave.
4. **¿Lo que dice la pantalla existe en el código?** Una promesa que nadie cumple es una
   mentira al cliente.
5. **¿El dato LLEGA hasta donde se muestra?** Se guarda en un lado y se lee en otro: hay que
   recorrer el camino entero.
6. **¿La prueba termina el trabajo?** Que la pantalla abra no prueba nada. La prueba mira el
   **resultado**: que imprima, que se mueva, que quede guardado.
7. **¿Qué pasa cuando falla, y qué pasa si son dos a la vez?** La mitad de los defectos de
   esta app viven acá: alguien devuelve el error en vez de tirarlo y nadie lo mira; o dos
   personas hacen lo mismo al mismo tiempo y una operación se pierde.
8. **¿El servidor se lo mandó de verdad?** Lo que el cliente ve tiene que salir del servidor,
   no armarse en el navegador con datos que no llegaron.
9. **¿Puede terminar A MEDIAS y decir que terminó?** Todo lo que recorre una lista o hace
   varios pasos. Tres cosas obligatorias:
   - Lo que salió a medias **no dice que salió**, y **nombra lo que faltó**.
   - Lo que salió a medias **no pisa ni borra lo anterior**.
   - El aviso **se puede leer**: nada de recargar la pantalla arriba del cartel.

---

10. **¿De cuántas formas puede venir mal este dato, y cuál NO hace ruido?** La excepción se ve;
    la lista vacía no; la fecha corrida tres horas tampoco. Se prueba **la forma silenciosa**,
    no la que te reportaron.

11. **Esto lo puede mandar cualquiera: ¿qué campos se copian sin mirar?** En lo que contesta
    alguien sin cuenta —encuesta, asistencia, buzón, muro— nunca se copia entero lo que llega.
    Los campos internos de la app **no pueden venir de afuera**.

12. **¿Qué pasa si toca dos veces?** El dedo nervioso con la señal lenta: ¿se cobra dos veces, se
    manda el mensaje dos veces, se paga dos veces una imagen?

13. **¿Este cálculo usa la hora de Uruguay?** El servidor está en hora de Greenwich. Tres horas
    alcanzan para que un cobro de la noche caiga en el mes siguiente.

14. **¿Qué ve el que adivina el enlace?** Lo que se abre sin cuenta, ¿trae pegado algo interno:
    el presupuesto, el teléfono, la lista del personal?

15. **¿Qué pasa cuando la lista se hace larga?** Con veinte anda. La pregunta es con mil: ¿se
    escribe la lista entera para cambiar un renglón?
16. **¿Pasaste algo a segundo plano?** Entonces el cartel final tiene que decir dónde quedó de
    verdad en cada salida (bien, sin señal, rechazo, sin lugar), y el trabajo tiene que llevar
    copia de su invitado y su identidad, no leer la pantalla cuando termina. Lo que se guarda
    en el equipo va **antes** de cualquier espera a la red, y lo que lo protege se renueva
    mientras el trabajo vive; un plazo fijo no sabe si el trabajo sigue andando.
17. **¿Lo que tu pantalla afirma lo comprobaste en el último paso?** "Publicada" es cuando el
    servidor contestó que sí, no cuando empezó a subir. Retené esa respuesta en la prueba y fijate
    que el cartel no salga antes.
18. **¿Tu botón lleva a algo que puede estar oculto?** Si la sección o la pantalla de destino se
    esconde con un ajuste o un modo, el botón tiene que esconderse con la misma condición. Si no,
    el cliente toca y no pasa nada.
19. **¿Tu enlace pasa un dato en la dirección?** Fijate que la pantalla de destino lea ese mismo
    nombre, y probalo abriendo el destino con el enlace de verdad, no con uno armado a mano.
20. **¿Tocaste algo que la IA escribe para un cliente o un invitado?** Las reglas de los textos
    (nada de promesas, garantías ni datos inventados) también van en su instrucción, y lo que genera
    se controla antes de guardarse.
21. **¿Tu pantalla tiene una llave en la dirección, o carga algo de afuera?** Ningún servicio externo
    (medición, píxel, chat) puede recibir la dirección de una pantalla privada.

## Y dos reglas que valen para las pruebas

- **Si sacando la app entera la prueba igual pasa, esa prueba no prueba nada.** Nada de
  escribir la lógica adentro de la prueba y después aprobarla.
- **Un control nuevo se prueba ROMPIÉNDOLO**, no viéndolo pasar en verde.

---

## Dónde está el detalle

- El porqué de cada pregunta: `docs/COMO-AUDITAR.md`.
- Los controles automáticos que ya están puestos y qué error apagó cada uno: la tabla de
  matafuegos en `CLAUDE.md`.
- Lo que ya se arregló —para no volver a reportarlo—: `docs/YA-RESUELTO.md`.

22. **¿Pasaste algo que escribió una persona a otro formato?** Probalo con un ejemplo que traiga
    algo más (una hora, un "de 21 a 04 hs") y mirá que siga en la salida. Y si creaste una lista
    nueva que se guarda entera, leé y guardá en el mismo turno de la base.

23. **¿Después de guardar llamás a otro paso de plata?** Cubrí que devuelva error **y** que tire
    una excepción, y que reintentar la misma operación no cree otro registro. Y ningún tope suma
    tolerancia a un saldo recortado a cero.


24. **¿Tu función está en un archivo `'use server'`?** Entonces la puede llamar cualquiera desde
    internet, no sólo tu pantalla. Si devuelve datos de otras personas, pide sesión adentro.

25. **¿Tu código contesta "ya estaba, listo"?** Comparalo con lo que se pidió ahora y mirá si el
    paso siguiente terminó de verdad. Y no prometas en un cartel algo que hace una persona.

26. **¿Tu acción pide sólo sesión?** El personal y el operador también la tienen. Pedí el permiso
    del perfil que la usa (`requirePermiso` o `requireEventPermission`), no `requireAppSession`.

27. **¿Mostrás un número de plata?** Buscá dónde más se calcula ese mismo número y probá que den
    igual (con y sin ajuste anual). Si guardás una lista que leíste antes, mirá que no deshaga un
    cobro que entró entretanto.

28. **¿Los datos de tu prueba tienen la forma real?** Cada campo tiene que existir en el tipo de
    `src/types/`. Si inventás un campo, la prueba copia el error en vez de encontrarlo.

29. **¿Tu acción toca plata?** El candado (`el-candado-de-la-plata.test.ts`) frena si pide sólo
    sesión. Pedí el permiso del perfil; si de verdad es pública, anotala con el motivo.


30. **¿Hay otra puerta que guarde el mismo campo?** Si cuidaste un campo de plata o de contrato con
    un permiso, buscá el guardado general (entero o parcial) que también lo escribe: tiene que pedir
    lo mismo o dejarlo como estaba.

31. **¿Guardás la lista que mandó la pantalla?** Guardá sólo lo que la persona cambió, sobre lo de
    ese momento. Una pantalla vieja no puede deshacer lo que otro hizo recién.
32. **¿Cambiaste lo que devuelve una función que usan varias pantallas?** Buscá todos los que la
    llaman y fijate qué le agregan encima (`funcion(x) || otraCosa`). Si la función dice "no hay",
    un `||` en la pantalla lo deshace sin que nadie se entere. La prueba mira la pantalla, no sólo
    la función.

33. **¿Tu cambio corre adentro de una transacción (`mutarDocumento`, `mutate...`, `runTransaction`)?**
    La base lo puede correr dos veces. Lo que anotás afuera (contador, "encontrado", "guardado") se
    pone en cero al empezar el cambio, y lo que no se puede repetir (mensajes, borrar archivos) va
    después, no adentro.

34. **¿Tu pantalla ofrece algo o se abre con un enlace?** Lo que ofrece tiene que salir de la misma
    función con que el servidor lo valida al guardar. Y si se abre sin cuenta, nada de lo que pide
    al cargar puede exigir cuenta (abrila sin sesión en la prueba).

35. **¿Escribís un número o un campo que otros ya muestran?** Mismo número, misma función y misma
    unidad (personas o invitaciones). Y un campo no se usa para otra cosa: una fecha de fiesta no
    va en el campo de las citas.

36. **¿Tu código corre sin sesión (despertador, tarea, webhook)?** Seguí cada función que llama
    hasta la última lectura: si alguna pide sesión, falla siempre. Pasale la llave interna o leé por
    dentro, y una lectura que falla no se vuelve "lista vacía, todo bien".

37. **¿Sumás pagos del cliente?** Sólo los confirmados (`isConfirmedClientPayment`). Un pago "a
    confirmar" no es plata cobrada.

38. **¿Pusiste un candado o un reclamo?** Buscá todos los que llaman a la función que protege: el
    candado va adentro de ella. Y si la tarea puede correr dos veces el mismo día, lo que guarda
    lleva un id estable (qué + quién + día), no uno al azar.

39. **¿Tu acción la usa un invitado, una estación o el cliente?** Seguila hasta el guardado: si
    guarda con `saveFiesta` (que pide sesión del equipo o del portal), al invitado se le rechaza.
    Va una escritura angosta (`actualizarFiesta` con `publicRsvp`, sólo su parte). Y en la prueba,
    el guardado de mentira rechaza sin permiso, como el de verdad.
