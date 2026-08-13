# Acá quedé

Última actualización: 12 de agosto de 2026.
Rama: `main`, con las propuestas 952 a 962 fusionadas. **No hay propuestas
abiertas.** Salud completa verificada: acentos limpios, tipos en cero, 1505 pruebas
internas, compila, 20 de seguridad de la base y 94 de navegador.

## Lo más importante de esta tanda

**El sitio tenía prohibido aparecer en Google.** Una instrucción vieja, de cuando la
aplicación era sólo interna, le decía a todos los buscadores que no indexaran nada.
Destrabado abriendo **página por página**: el portal del cliente, las invitaciones
con la lista de invitados y las pantallas del equipo siguen cerradas a propósito.
La lista está en `src/lib/seo/paginas-publicas.ts`, con pruebas que cuidan las dos
puntas. Todas las páginas abiertas tienen ya título y descripción propios.

**Se podía dar por firmado un contrato sin ser del equipo.** Subir el contrato en
papel no pedía sesión, y esa acción marca el contrato firmado y deja el evento como
Contratado. Igual pasaba con los documentos adjuntos y la subida de imágenes. Las
tres piden sesión ahora.

**Ya se sabe cuánto se gasta en inteligencia artificial**, con tope opcional en
pesos y aviso al 80%. Al llegar al tope **la fotocabina y el espejo siguen
andando**: sacan la foto con efecto simple, sin gastar.

**Los testimonios reales llegan a la presentación**, y una opinión mala no se
publica nunca: se controla dos veces.

**El recontacto del que no señó** está enganchado y **apagado de fábrica**, y su
mensaje ahora se escribe a medida de cada persona.

**Las cuatro ideas grandes están hechas**: recontacto personalizado, asistente de
ventas en la página (apagado de fábrica y sólo en las páginas de venta), video del
recuerdo con fotos aprobadas, y repaso de la mañana que esconde los cobros a quien
no tiene permiso.

## Documentos que hay que usar

- **`docs/QUE-HAY-EN-LA-APP.md`** — inventario verificado de inteligencia
  artificial, redes, marketing y Google. **Se lee antes de salir a inventariar**, y
  se actualiza en la misma propuesta que toca el código.

## Lo que le queda a Gemini

**Dos cosas**, las dos anotadas al final de
`docs/ordenes/grandes-01-las-cuatro-ideas.md`.

**Lo más urgente y lo más barato: ponerle la puerta a las dos pantallas nuevas.**
El repaso de la mañana y el video del recuerdo están hechos y funcionan, pero no
hay un solo botón en toda la aplicación que lleve a ellos. Verificado buscando en
todo el código: las únicas menciones están en un archivo de pruebas. Dos trabajos
terminados que hoy no usa nadie. En la orden están los archivos y las líneas
exactas donde van.

**Lo otro:** armar el presupuesto desde el chat
del asistente. Se sacó a propósito porque la entrega original inventaba las cuentas
que el cliente ve como precio firme. Ahí está explicada la forma real que espera la
función y la regla: **los números salen del catálogo, no de la conversación**.

Ojo con lo que ya pasó dos veces el 12 de agosto. Primero rehizo por su cuenta los
testimonios y el recontacto, que ya estaban fusionados, y su propuesta habría
borrado el filtro doble de las opiniones y veinte pruebas. Después entregó las
cuatro ideas sin compilar y con dos cosas graves: el asistente de ventas aparecía
en toda la aplicación (encima de la invitación de un casamiento, del portal del
cliente y de la presentación del salón), y daba por dado el permiso del cliente
para escribirle. **Compará siempre contra la versión principal de ahora, corré el
build de verdad y revisá a mano lo que toca plata y permisos.**

**No se tocan:** `src/lib/testimonios/para-mostrar.ts`,
`src/lib/marketing/candidatos-recontacto.ts`,
`src/lib/marketing/recontacto-automatico.ts`, `src/lib/ai/consumo.ts`,
`src/lib/seo/paginas-publicas.ts`,
`src/lib/public-experience/donde-va-el-asistente.ts`.

## Lo que el dueño tiene que hacer él

- **Dar el aviso a Google desde su panel** para que pase a mirar el sitio. La app ya
  le dio permiso; es trámite de una vez con su cuenta.
- **Prender el recontacto automático** en Ajustes → Contenido público. Viene apagado.
- **Prender el asistente de ventas de la página**, en Ajustes. También viene apagado.
- **Poner el tope de gasto mensual** en la misma pantalla, si quiere uno.
- Las comprobaciones con Firebase de producción, las credenciales reales de
  Instagram y la prueba física en el salón.

## Falsas alarmas verificadas (no volver a abrirlas)

- "No hay forma de juntar la opinión del cliente después del evento": sí la hay.
- Las opiniones malas no se publican solas: hay tres candados y andan.
- Los avisos de "Prospecto de prueba" en el panel los generan las pruebas de
  navegador. No se commitean: se descartan.
