# Orden de trabajo: el editor de la invitación y lo que ve el invitado

Fecha: 12 de agosto de 2026.

**Entregá UNA SOLA propuesta de cambio con los tres bloques adentro.** Si uno se
traba, entregá los otros igual en la misma propuesta y avisá cuál faltó y por qué.
No abras una propuesta por bloque: cada fusión dispara un despliegue y eso se paga.

Contexto: la invitación digital es lo primero que el cliente le muestra a sus
invitados. Si el equipo la arma en el celular y no ve si guardó, o si la vista
previa no se parece al resultado, el cliente se entera cuando ya la mandó.

Los tres hallazgos están verificados leyendo el código, no son sospechas.

---

## Bloque 1 — En el celular no se ve si la invitación guardó (ni si falló)

**Dónde:** `src/app/(app)/fiestas/nueva/pagina-web/page.tsx`, línea 443.

**Qué hace hoy:**

```tsx
<AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} saveError={saveError} className="hidden sm:flex" />
```

`hidden sm:flex` esconde el cartel en pantallas angostas, es decir en el celular.

**Por qué está mal:** ese cartel no sólo dice "guardado", también es el único
lugar donde aparece **el error de guardado**. En el celular el equipo edita la
invitación, ve que no pasa nada raro, cierra, y los cambios se perdieron sin un
solo aviso. La invitación es justo lo que más se toca desde el teléfono.

**Qué hay que hacer:** que el estado del guardado se vea siempre, también en el
celular. En pantalla angosta no hace falta el texto largo: alcanza con una versión
compacta (un punto o un ícono con color: guardando / guardado / error), y que al
tocarla se explique. **El error nunca puede quedar escondido**: si el guardado
falla en el celular, además del indicador tiene que salir un aviso que se lea.

Mirá `src/components/ui/auto-save-indicator.tsx` (o donde esté `AutoSaveIndicator`)
y resolvelo ahí adentro con una variante compacta, en vez de sacar la clase y que
se desarme el encabezado.

---

## Bloque 2 — La vista previa no muestra lo mismo que va a ver el invitado

**Dónde:** `src/components/invitacion/templates/GraziaTemplate.tsx`, línea 150 y
alrededores. Lo mismo en `AllegriaTemplate.tsx`.

**Qué hace hoy:** el editor dibuja la plantilla con `isPreview = true`, y esa
bandera apaga cosas. Algunas están bien apagadas y **no se tocan**:

- No se guarda la confirmación de asistencia (bien: es una prueba).
- No se cuentan las visitas ni se registran datos del evento (bien).
- No arranca sola la música de fondo (bien: nadie quiere música al editar).
- No se manda el mensaje del chat ni se reserva un regalo (bien).

Pero también apaga **lo puramente visual**, y eso sí está mal:

- `EventParticles` (la animación de fondo de la portada) no se dibuja en la vista
  previa.

**Por qué está mal:** el equipo elige colores, foto y textos mirando una portada
que **no es** la que va a ver el invitado. Después se manda la invitación y la
animación tapa o cambia lo que se había elegido. La vista previa tiene que
mostrar exactamente el resultado.

**Qué hay que hacer:** que lo visual se dibuje igual en la vista previa. En
concreto, sacar `isPreview` de la condición que envuelve a `EventParticles` y
revisar si hay otros efectos sólo decorativos apagados por la misma bandera
(pantalla de bienvenida, transiciones de entrada, fondos animados). **No toques**
las condiciones que evitan guardar datos, contar visitas o mandar mensajes: esas
están bien como están.

Si algún efecto visual traba el editor por consumo, dejalo prendido igual pero
buscá que sea liviano; no lo apagues.

---

## Bloque 3 — Se puede publicar una invitación sin los datos mínimos

**Dónde:** `saveFiesta` en `src/app/actions/fiesta/fiesta.actions.ts` y la
pantalla del editor.

**Qué pasa hoy:** se guarda y se publica la invitación aunque falten los datos que
el invitado necesita sí o sí: fecha, hora, nombre del lugar y dirección de la
celebración. La invitación sale al aire con huecos.

**Qué hay que hacer:** **no bloquear el guardado** (el equipo arma la invitación
de a poco y tiene que poder dejarla a medias). Lo que hay que hacer es avisar
antes de compartirla: en el botón de publicar o compartir, si falta alguno de esos
datos, mostrar un cartel claro que diga **qué falta**, en criollo, con un botón
para ir directo a completarlo. Por ejemplo: "Falta la dirección del salón. Sin eso
el invitado no sabe adónde ir." Y dejar seguir igual si el equipo insiste.

---

## Cómo se comprueba

1. `npx tsc --noEmit` en cero.
2. `npx jest --silent` todo en verde.
3. `npm run check:acentos` limpio.
4. `npm run build` termina bien.
5. Probado a mano en el navegador, en tamaño de celular: que se vea el estado del
   guardado y que la vista previa se parezca al resultado.

Y anotá lo que hiciste en `docs/YA-RESUELTO.md`, en la misma propuesta.
