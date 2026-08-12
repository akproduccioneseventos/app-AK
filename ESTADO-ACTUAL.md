# Acá quedé

Última actualización: 12 de agosto de 2026.
Rama: `main`, con las propuestas 952, 953 y 954 fusionadas. No hay propuestas
abiertas. Salud completa en verde: acentos limpios, tipos en cero, 1472 pruebas,
compila, y 20 de seguridad de la base.

## Lo más importante de esta tanda

**El sitio tenía prohibido aparecer en Google.** Había una instrucción, de cuando
la aplicación era sólo interna, que le decía a todos los buscadores que no
indexaran ninguna página. La portada, bodas, quince, cumpleaños, catálogo y blog no
podían salir en una búsqueda. Ya está destrabado, abriendo **página por página**:
el portal del cliente, las invitaciones con la lista de invitados y las pantallas
del equipo siguen cerradas a propósito. La lista vive en
`src/lib/seo/paginas-publicas.ts` y hay seis pruebas que cuidan las dos puntas.
**Falta que el dueño dé el aviso desde el panel de Google**, que es trámite suyo.

**Se podía dar por firmado un contrato sin ser del equipo.** Subir el contrato en
papel no pedía sesión, y esa acción marca el contrato firmado y deja el evento
como Contratado. Igual pasaba con los documentos adjuntos y con la subida de
imágenes. Las tres piden sesión ahora.

**Borrar una foto de la galería no la borraba del todo**: quedaba el archivo en el
depósito y el gemelo en el catálogo, así que el cliente la seguía viendo.

## Documentos nuevos que hay que usar

- **`docs/QUE-HAY-EN-LA-APP.md`** — inventario verificado de inteligencia
  artificial, redes sociales, marketing y posicionamiento, con el estado de cada
  cosa. **Se lee antes de salir a inventariar nada** y se actualiza en la misma
  propuesta que toca el código. Está referenciado desde `CLAUDE.md`.

## Lo que le queda a Gemini

`docs/ordenes/marketing-01-testimonios-y-recontacto.md`, cuatro bloques en **una
sola propuesta**:

1. La presentación grande muestra testimonios inventados en vez de los reales
   aprobados. **Regla dura del dueño: una opinión mala nunca se publica**; sólo se
   puede usar `getTestimonials()`, que devuelve nada más que las aprobadas.
2. El planificador de redes marca como "Publicado" lo que sólo se importó de
   Instagram. La app no publica en ninguna red: se copia y pega a mano.
3. El recontacto automático del que no señó está escrito y **nunca se llama**. Hay
   que engancharlo, apagado de fábrica y una sola vez por persona.
4. Terminar las páginas de venta para Google (títulos, descripciones y ficha de
   negocio). **Sin abrir ninguna página nueva por su cuenta.**

## Falsas alarmas verificadas (no volver a abrirlas)

- "No hay forma de juntar la opinión del cliente después del evento": **sí la hay**,
  con pantalla propia por evento y conversión a testimonio.
- Las opiniones malas no se publican solas: hay tres candados y los tres andan.

## Ideas que el dueño está evaluando (no empezadas)

Recontacto personalizado con inteligencia artificial, asistente de venta en la
página pública, video recuerdo automático de la fiesta, y repaso diario del
negocio. Falta decidir cuál va primero. **Antes de sumar funciones que consumen
inteligencia artificial hay que poner el control de gasto: hoy no existe.**
