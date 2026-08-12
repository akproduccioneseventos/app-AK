# Acá quedé

Última actualización: 12 de agosto de 2026.
Rama: `main`, con las propuestas 952 a 959 fusionadas. Salud completa en verde:
acentos limpios, tipos en cero, 1500 pruebas y compila.

## Lo más importante de esta tanda

**El sitio tenía prohibido aparecer en Google.** Una instrucción vieja, de cuando la
aplicación era sólo interna, le decía a todos los buscadores que no indexaran nada.
Destrabado abriendo **página por página**: el portal del cliente, las invitaciones
con la lista de invitados y las pantallas del equipo siguen cerradas a propósito.
La lista está en `src/lib/seo/paginas-publicas.ts`, con pruebas que cuidan las dos
puntas.

**Se podía dar por firmado un contrato sin ser del equipo.** Subir el contrato en
papel no pedía sesión, y esa acción marca el contrato firmado y deja el evento como
Contratado. Igual pasaba con los documentos adjuntos y la subida de imágenes. Las
tres piden sesión ahora.

**Ya se sabe cuánto se gasta en inteligencia artificial.** Antes nadie avisaba hasta
que llegaba la factura. Ahora se ve el gasto del mes y se le puede poner tope. Al
llegar al tope **la fotocabina y el espejo siguen andando**: sacan la foto con
efecto simple, sin gastar.

**Los testimonios reales llegan a la presentación**, y una opinión mala no se
publica nunca: se controla dos veces.

**El recontacto del que no señó** está enganchado y **apagado de fábrica**.

## Documentos que hay que usar

- **`docs/QUE-HAY-EN-LA-APP.md`** — inventario verificado de inteligencia
  artificial, redes, marketing y Google. **Se lee antes de salir a inventariar**, y
  se actualiza en la misma propuesta que toca el código.

## Lo que le queda a Gemini

Terminar títulos y descripciones de las pantallas públicas que no los tienen.
**Sin abrir ninguna página nueva a Google por su cuenta**: la lista está cerrada a
propósito.

Ojo con lo que ya pasó el 12 de agosto: Gemini rehízo por su cuenta los testimonios
y el recontacto, que ya estaban fusionados, y su propuesta habría borrado el filtro
doble de las opiniones y veinte pruebas. **Compará siempre contra la versión
principal de ahora antes de fusionar.** De esa propuesta se rescató lo bueno y se
cerró.

No se tocan: `src/lib/testimonios/para-mostrar.ts`,
`src/lib/marketing/candidatos-recontacto.ts`, `src/lib/ai/consumo.ts`.

## Lo que el dueño tiene que hacer él

- **Dar el aviso a Google desde su panel** para que pase a mirar el sitio. La app ya
  le dio permiso; es trámite de una vez con su cuenta.
- **Prender el recontacto automático** en Ajustes → Contenido público. Viene apagado.
- **Poner el tope de gasto mensual** en la misma pantalla, si quiere uno.

## Falsas alarmas verificadas (no volver a abrirlas)

- "No hay forma de juntar la opinión del cliente después del evento": sí la hay.
- Las opiniones malas no se publican solas: hay tres candados y andan.

## Ideas que el dueño está evaluando (no empezadas)

Recontacto personalizado con inteligencia artificial, asistente de venta en la
página pública, video recuerdo automático de la fiesta, y repaso diario del negocio.
Falta que él elija cuál va primero. El control de gasto, que era el requisito previo,
ya está hecho.
