# Ya resuelto — NO lo vuelvas a reportar ni a "arreglar"

**Leé esto ANTES de auditar cualquier cosa.** Vale para Codex, Gemini, Claude y
cualquier ayudante que salga a buscar problemas.

En este proyecto trabajan varias IA en paralelo, en cuentas distintas. Sin esta
lista pasa lo siguiente: una auditoría nueva encuentra "un problema", lo reporta,
alguien lo arregla otra vez, y a veces **deshace** el arreglo bueno con uno peor.
Ya pasó: dos propuestas protegieron el mismo archivo de maneras distintas y al
fusionarse dejaron la pantalla colgada para siempre.

**Regla: si algo de esta lista aparece en tu auditoría, es falso positivo.** Si
creés que igual está mal, no lo arregles: decilo y esperá respuesta.

Quien arregle algo nuevo, **lo agrega acá en la misma tanda**. Si no queda
anotado, la próxima auditoría lo va a volver a encontrar.

---

## Decisiones del dueño (no son errores, no se discuten)

- **El ajuste anual del 15% va siempre.** Aparece en presupuestos y en el portal.
- **El descuento del 50% del Salón Club Uruguay** y el descuento del presupuesto
  son decisiones de marketing.
- **La lista de compras usa los invitados del PRESUPUESTO**, no los confirmados.
  Se cocina lo que se contrató. Si vienen más, se agregan y el presupuesto sube.
- **Las fotos del muro se descargan con enlace directo, a propósito.**
- **Se trabaja sólo en pesos uruguayos.** No hay diferencias de redondeo en
  dólares que corregir.
- **Los controles rojos de GitHub son por facturación de la cuenta.** No los
  investigues. Vale lo que se verifica localmente.
- **El pasaje a la galería del cliente (wfolio) es manual.** No tiene forma
  documentada de automatizarse; ya se investigó. No armes una integración.

---

## Módulo de entretenimiento — TERMINADO

### Arreglado, no lo toques

- **Las cuatro estaciones de captura ya no mienten.** Cuando falla la subida no
  muestran más "escaneá tu recuerdo" con el código girando: avisan y ofrecen
  descargar o reintentar. Hay un componente compartido, `QrRecuerdo`, para que el
  defecto no se copie en la próxima estación.
- **Espejo mágico IA:** al fallar la IA se queda en revisión con la foto original
  y los botones para subirla, en vez de saltar al cartel de recuerdo listo. La
  cámara no se reenciende encima del cartel de error.
- **El operador ve las fallas del invitado** en su cabina, con la hora, y el
  aviso se borra solo cuando la estación vuelve a andar (`lastError` en la sesión).
- **El operador sabe si la IA no está disponible** antes de que llegue el primer
  invitado.
- **Pantalla gigante, muro, galería y red social** avisan si se cortó la conexión
  y distinguen "no hay nada" de "no se pudo cargar".
- **La zona digital** no tiene más tarjetas muertas; el **tótem** no muestra un QR
  que no sirve.
- **Trivia por mesa:** funciona, arma el ranking por mesa y el invitado sin mesa
  juega igual en el ranking individual.
- **El muro saluda por nombre** cuando la foto viene del enlace personal, y sigue
  funcionando sin nombre cuando viene del QR general del salón.
- **Las estaciones funcionan sin muro contratado.** La foto **se guarda siempre**;
  si el muro está pausado o no contratado queda como `pending` y no se ve. Nadie
  saltea la pausa de la moderación.

### Topes, ya calibrados

- **Videos del invitado: 15 segundos.** Es a propósito.
- **Tope del evento: 5000 fotos.** Antes eran 200 y cortaba la fiesta a la mitad.
  No lo bajes.
- **Generaciones de IA: 3 por sesión de foto**, contadas en el servidor con un
  identificador estable, más una red de contención de 150 por hora por estación.
- **Paquete de recuerdos: 300 MB por pedido**, y se puede pedir por estación
  (`?estacion=`). El límite es de memoria del servidor, no de la fiesta.
- **41 estilos de IA**, y se pueden elegir por fiesta con `allowedTemplateIds`.
  Vacío significa todos.

---

## Módulo de organización — TERMINADO

### Arreglado, no lo toques

- **Los conteos cuentan PERSONAS, no filas.** Celíacos en la pantalla de
  invitados y el reporte al catering ya usan `partySize`. Si ves un `.length`
  sobre invitados en otro lado, ese sí puede ser un problema nuevo: reportalo.
- **Las bebidas llegan a la lista de compras**, todas las categorías activadas,
  leyendo `fiestaData.bebidas`.
- **El autoguardado del diseño de decoración avisa cuando falla** y reintenta.
- **Borrar una foto del moodboard** confirma o avisa el error.
- **Los recibos del personal se autoguardan**, igual que la pantalla de personal.
- **El aviso de doble asignación** dice cuándo no se pudo verificar, en vez de
  callarse.
- **Primero se guarda, después se sincroniza con Google.** El orden es
  deliberado: al revés mandaba los avisos con la asignación vieja. **No lo
  muevas.**
- **En la lista de carga, el precio ya no se usa como cantidad.** Sin referencia
  de cobertura queda en 1 unidad.
- **El PDF del itinerario no muestra las notas internas del organizador** y
  filtra los momentos marcados como no visibles. Ese PDF lo ven proveedores.
- **El tablero central** muestra el avance por módulo, el avance general y el
  próximo paso sugerido con botón directo.
- **Buscador de empleados**, sincronización de carga que no duplica, tareas de
  proveedores que no se cortan en silencio, aviso de horarios que se pisan en el
  itinerario, y vista previa del portal del invitado.
- **El menú de mesa vuelve atrás el color** si el guardado falla, en vez de
  dejarlo visible como si hubiera guardado.
- **La descarga de recuerdos incluye el dominio propio de AK**
  (`galeria.akproducciones.uy`) en la lista de dominios habilitados.
- **El paquete de recuerdos baja ordenado por estación** y con el tipo de fiesta
  en el nombre.

### Ya existía antes, no lo construyas de nuevo

- **El álbum del portal del cliente.** Está en
  `src/app/portal-cliente/[id]/fotos-video/page.tsx` y `getContractedDownloads`
  ya decide qué mostrar según lo contratado. Una orden de trabajo pidió
  construirlo y se perdió el viaje entero.

---

## Infraestructura y pruebas

- **`tests/e2e/layout-baseline.json` se regeneró el 8 de agosto de 2026.** Estuvo
  seis días en rojo por un cambio global del 3. Si vuelve a fallar, mirá primero
  si el cambio fue intencional antes de tocar pantallas.
- **`npm run check:acentos` existe** y es control obligatorio. No hace falta
  inventar otro.
- **La pantalla de recepción ya está arreglada**: declaraba mal los parámetros de
  ruta y rompía el build entero.

---

## Cómo agregar algo a esta lista

Cuando arregles algo, sumá una línea en el módulo que corresponda, en la misma
propuesta. Con esto alcanza:

- **Qué se arregló**, en una frase, en criollo.
- **Dónde**, si sirve para ubicarlo.
- **Si la decisión tiene un porqué que no se ve en el código, escribilo.** Ese es
  el dato que evita que otro lo "arregle" al revés.
