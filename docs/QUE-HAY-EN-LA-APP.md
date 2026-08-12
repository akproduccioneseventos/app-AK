# Qué hay en la app (inventario verificado)

**Para qué sirve este archivo.** El dueño pregunta seguido "¿esto está?" y auditar
de nuevo cada vez cuesta tiempo y plata. Acá queda anotado lo que ya se revisó,
con fecha. **Se lee antes de salir a inventariar nada.** Si el dato está acá, no
se vuelve a buscar: se responde de acá.

**Cómo se mantiene.** Cuando se toca algo que figura en esta lista, se actualiza
la línea en la misma propuesta, igual que `docs/YA-RESUELTO.md`. Si aparece algo
nuevo que no está inventariado, se agrega. Un inventario desactualizado es peor
que no tenerlo.

Cada punto dice en qué estado está:

- **ANDA** — funciona de verdad hoy.
- **A MEDIAS** — existe pero le falta algo para servir; se aclara qué.
- **NO ESTÁ** — no existe en el código.

---

## Inteligencia artificial — revisado el 12 de agosto de 2026

### Lo que anda

Trece funciones activas:

- **Asistente que ejecuta acciones** (crear presupuestos, clientes, prospectos,
  eventos, facturas). Pantalla: Ajustes → Asistente.
- **Agente de marketing**: escribe contenido para Instagram, Facebook, TikTok y
  WhatsApp, adaptado a cada plataforma.
- **Análisis de reuniones con el cliente**: saca acta, acuerdos, tareas y alertas.
- **Fotocabina (Touchpix)**: siete transformaciones artísticas y cambio de cara con
  treinta personajes.
- **Espejo mágico**: cambio de cara propio de esa estación.
- **Guion del DJ**: arma el resumen profesional con canciones sugeridas por momento
  de la fiesta.
- **Línea de tiempo del evento** y **paletas de colores** sugeridas.
- **Lectura de contratos en PDF**: saca cliente, fecha, tipo de evento y monto.
- **Discurso de venta** generado.

### Filtro de contenido de los invitados — ANDA (verificado línea por línea)

Toda **foto** que sube un invitado se revisa antes de publicarse y se bloquea sola
si detecta contenido adulto, sexual o violento. Está enganchado en la subida real,
no es una función suelta.

Los **videos** no se pueden revisar así (el análisis mira imágenes fijas), y por eso
**van siempre a aprobación manual** antes de aparecer en la pantalla grande. Eso es
correcto y es a propósito: no se cambia.

Si el servicio de análisis no está configurado o se cae, la foto **no se publica
sola**: queda para revisión manual.

### Topes de uso — ANDAN

- Tres generaciones por invitado por sesión, en fotocabina y en espejo mágico.
- Ciento cincuenta por hora por estación (red de contención contra el abuso).
- Corte a los sesenta segundos si una generación se cuelga.
- Diez megas máximo por imagen.

### Lo que falta

- **Control de gasto — NO ESTÁ.** Los topes evitan el abuso pero nadie avisa cuánto
  se lleva consumido en el mes. No hay tablero ni aviso de consumo.
- Dos funciones escritas y nunca conectadas a ninguna pantalla: generación de
  testimonios y asignación automática de invitados a mesas. Ninguna es crítica.

### Si la inteligencia artificial falla

Está bien resuelto: si no hay configuración, si se cuelga o si el servicio rechaza
el pedido, devuelve la foto original con un efecto simple y la pantalla sigue
andando. No se rompe nada delante del invitado.

---

## Redes sociales — revisado el 12 de agosto de 2026

### Lo que anda

- **Pantalla de conexión** (Ajustes → Redes): guarda la dirección de cada perfil
  (Facebook, Instagram, TikTok), el número de WhatsApp y logos propios.
- **Importación de videos de YouTube**: trae los videos del canal a la galería. No
  necesita credenciales, es el listado público del canal, y se refresca cada seis
  horas.
- **Planificador de contenido** (Empresa → Redes sociales): se planifica y se
  redacta con inteligencia artificial. Después **se copia y se pega a mano** en la
  red. Eso es lo que hay, y está dicho así en la propia pantalla.

### A medias

- **Importación de Instagram**: existe y corre sola cada seis horas, pero **sólo si
  están cargadas las credenciales comerciales de Meta**. Sin eso devuelve error y no
  trae nada. Hay una prueba que impide que se muestre como exitosa cuando no lo fue.

### No está

- **Publicar automáticamente en Instagram, Facebook, TikTok o YouTube.** No hay
  nada. Todo el publicado es manual.
- Sincronización de comentarios, seguidores o "me gusta".
- Avisos automáticos que lleguen desde las redes hacia la app.

### Ojo con esto

Las publicaciones que se importan de Instagram se guardan con el estado
**"Publicado"**. Es cierto en el sentido de que ya están publicadas *en Instagram*,
pero en el planificador se lee como si la app las hubiera publicado. Conviene
cambiarle el nombre a ese estado (por ejemplo "Ya está en Instagram") para que no
confunda.

---

## Marketing y captación — revisado el 12 de agosto de 2026

### Lo que anda

- **Simulador de presupuesto público**: cualquiera lo usa sin cuenta, y los datos
  (nombre, teléfono, fecha, invitados, salón) **entran solos al CRM como prospecto**,
  con el presupuesto armado. Es la puerta de entrada de clientes nuevos y funciona.
- **Cupones y descuentos**: se configuran, se validan y se aplican solos al armar el
  presupuesto. Hay estadísticas de uso.
- **Tablero de conversión del CRM**: prospectos activos, valor del embudo, ganados,
  perdidos y tasa de conversión.
- **Tablero de publicidad (Meta Ads)**: cruza lo gastado en publicidad con los
  contratos reales para calcular el retorno. Necesita credenciales cargadas.
- **WhatsApp uno a uno**: conversaciones, envío y estadísticas.
- **Prioridad de prospectos**: calcula a quién conviene atender primero.
- **Agenda de seguimiento** de reuniones con prospectos.
- **Módulo de marketing**: lista de tareas configurable y plantillas guardadas.
- **Recordatorios de cobro**: se disparan solos.
- **Opinión del cliente después del evento**: hay una pantalla por evento donde el
  cliente deja su opinión, se llega desde la pantalla de post-evento y desde
  Ajustes, y esa opinión se puede convertir en testimonio. La portada del sitio
  muestra los testimonios reales cargados.

### A medias

- **Testimonios en la presentación grande**: la pantalla de testimonios de la
  presentación muestra una lista **fija escrita a mano**, no los testimonios reales
  que se van juntando. La portada del sitio sí usa los reales. Conviene unificar.

### No está

- **Recontacto automático de los que no contrataron.** La función está escrita, con
  el mensaje redactado y todo, para escribirle al prospecto que no señó a las 48
  horas. **Nadie la llama nunca.** Es plata que se deja arriba de la mesa: está
  hecho el trabajo y falta prenderlo.
- **Envío de mails masivos.** No hay nada.
- **Formulario de contacto** aparte del simulador.
- **Reseñas de Google** u otro servicio de reputación: no hay integración.

---

## Aparecer en Google (posicionamiento) — revisado el 12 de agosto de 2026

### El problema principal

El sitio tenía una instrucción que le decía a **todos** los buscadores que no
indexaran **ninguna** página. Venía de cuando la aplicación era sólo interna. Con
eso puesto, nada de la parte pública podía aparecer en Google. Corregido: ver
`docs/YA-RESUELTO.md`.

### Lo que anda

- Las páginas de bodas, quince años y eventos tienen título, descripción e imagen
  de vista previa para cuando se comparte por WhatsApp o redes.
- Las invitaciones arman su título, descripción e imagen con los datos reales de
  cada fiesta, y se actualizan solas al guardar la fiesta.
- El blog y las páginas por tipo de evento tienen título y descripción.
- La portada tiene la ficha de negocio (dirección, teléfono, coordenadas de Salto,
  redes) que Google usa para mostrar el local.
- La mayoría de las pantallas públicas se arman del lado del servidor, que es lo
  que Google lee bien.

### A medias

- Varias pantallas públicas no tienen título ni descripción propios.
- La ficha de negocio para Google está sólo en la portada, no en las páginas de
  bodas, quince ni en el blog.

### No está

- Nada que avise a Google cuando se agrega un servicio, una foto o un evento nuevo.
  El listado de páginas se arma solo, pero el aviso a Google no existe (Google dejó
  de aceptarlo en 2023; hoy se hace desde su panel).
