# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada sesión.
Lo histórico va a `docs/YA-RESUELTO.md`. **Se pisa, no se acumula.**

---

**Última actualización:** 10 de septiembre de 2026. **Rama: `main`.** Todo fusionado y
publicable: la puerta (`npm run "publicar?"`) dio **SE PUEDE PUBLICAR** con las diez etapas en
verde, incluido el recorrido de las 360 pantallas.

## Lo que se hizo en esta tanda

Codex revisó decoración y portal y encontró siete defectos. **Los siete eran ciertos.**
Arreglados, con su control para que no vuelvan:

- **Seis pantallas decían "guardado" sin haber guardado**: distribución del salón,
  planificador de costos, captura de la vista 3D, cronograma sugerido, ajustes de avisos y
  contenido público de la web.
- **La imagen del salón con inteligencia artificial se paga por unidad** y dos toques seguidos
  pagaban dos habiendo lugar para una. Ahora contar, generar y guardar son un solo turno.
- **La paleta vieja**: la imagen con IA y el portal del cliente usaban colores que ya nadie
  había elegido.
- **La captura de la vista 3D** se anunciaba como guardada en el portal y nunca llegaba.
- **La nota "para el equipo" se le publicaba al cliente.** Ahora hay un campo aparte,
  `notaDecoracionParaElCliente`, y la interna no sale del servidor.
- **La foto que se le manda a la IA se valida**: sólo pegada en el momento o de donde la app
  guarda sus imágenes.

**Y lo que más importa: se corrigió el método, no sólo el defecto.** El control de
`npm run "dice-que-si?"` sólo reconocía funciones que escriben su resultado en la firma, y las
57 puertas de paso de `fiesta-actual.ts` —las que usan las pantallas— no lo escriben. De un
defecto reportado salieron cuatro. Está anotado en `docs/LO-QUE-NO-VI.md`.

**De Gemini entró** el botón "Exportar PNG" que ahora baja el archivo de verdad y la vista 3D
mostrándose en el portal. **Se le sacó una prueba** que comprobaba algo que ella misma se
inventaba adentro: pasaba en verde con la app borrada.

## Lo que sigue

- **Orden 55** (Gemini): el botón para generar la imagen del salón con IA y el cuadro para
  escribirle al cliente. El bloque del PNG ya está hecho.
- **Orden 56** (Gemini): los ajustes de avisos no se guardan en ningún lado —se escriben en el
  navegador de quien los toca— y nadie los respeta al mandar.
- **El dueño tiene que abrir la web en su celular y decir si puede entrar.** Es lo único que
  queda de la orden 53 y no se puede comprobar desde acá.
- `docs/ordenes/DEVOLUCION-acceso-administrativo.md` sigue esperando su decisión.

## Trampas que costaron tiempo y no se repiten

- **La puerta se cae si se cae la sesión.** Se larga desprendida (`setsid nohup`) y aun así una
  reconexión del contenedor se la lleva. Si el registro corta en una etapa sin veredicto, no es
  una falla: se limpia el turno y se corre de nuevo.
- **Dos controles pueden decir números distintos de lo mismo** y nadie lo nota, porque cada uno
  se mira por separado. Ya hay una prueba que los compara.
- **No correr nada mientras corre la puerta.** Sigue vigente y sigue costando caro.
