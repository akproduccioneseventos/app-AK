# Acá quedé

Última actualización: 13 de agosto de 2026.
Rama: `main`, con hasta la propuesta 967 fusionada. Todo el trabajo del día quedó
junto en **una sola propuesta, la 971**.

## Propuestas abiertas y qué hacer con cada una

- **971 — FUSIONAR ESTA. Es la única.** Trae todo: las reseñas de Google, el plan
  de la noche del equipo y la presentación alineada con el catálogo. Verificada
  entera y sobre el conjunto, no por pedazos: acentos limpios, tipos en cero, 1572
  pruebas internas, compila y las de seguridad de la base en verde.
- **968, 969 y 970 — CERRAR sin fusionar.** Lo bueno de la 969 ya está adentro de
  la 971 (se juntaron porque chocaban en la documentación y así es una sola
  fusión en vez de dos). La 968 ya viajaba adentro de la 969. La 970 nunca trajo
  la función.

## Lo hecho el 13 de agosto

**Reseñas en Google, reparadas.** Cuando el cliente contesta la encuesta de después
del evento y pone 9 o 10, se le manda solo un WhatsApp con el enlace para dejar la
reseña. Se prende en Ajustes → Empresa pegando el enlace; **viene apagado** y sin
enlace no se puede prender. Con nota menor a 9 no sale nada, y a la misma fiesta no
se le pide dos veces. Hay además un botón para pedirlo a mano.

**Plan de la noche para el equipo.** Cada persona entra con su código y ve, en el
celular, su rol en esa fiesta, la hora, el lugar con dirección, un botón para llamar
al encargado y el programa de la noche. **No ve sueldos**, ni el suyo ni el de los
demás.

**La seña se cobraba de menos.** El botón de Mercado Pago cobraba siempre $5.000 sin
mirar la seña acordada con ese cliente. En un evento grande la reserva quedaba
señada con una fracción de lo pactado. Ahora manda la seña del presupuesto, y el
monto general se edita desde Ajustes. **Decisión del dueño: la seña es un monto
fijo, hoy $5.000, no un porcentaje.**

**Sin usuario se veía plata.** Preguntar por los permisos de alguien que no existe
devolvía los de secretaria, que incluyen contabilidad. Cerrado; la conversión de las
cuentas viejas no cambió.

**Ganancia real por fiesta y comparación entre todas.** El analizador mostraba la
ganancia contra el costo estimado; ahora usa el gasto real donde está cargado.

**La regla de qué se muestra del muro** estaba copiada en nueve lugares. Vive en uno.

**Presentación:** los doce logos reales, sacados del catálogo impreso,
recortados y verificados uno por uno, guardados en la aplicación y con el nombre
visible. La pantalla del equipo enganchada. El salón cuenta el Club Uruguay **sin
mencionar el portero** (decisión del dueño: el salón dejó de ofrecerlo). Infantiles y
empresariales toman las fotos de la galería, así no hace falta catálogo impreso.

## Trampas encontradas que conviene recordar

- **Lo común de los tres catálogos se perdía por tipo de fiesta.** Se devolvía el
  bloque del tipo entero en vez de combinarlo con el común, así que la pantalla del
  equipo salía sin título ni frase en todos los tipos conocidos. Ahora se combinan.
- **La presentación y la galería no llaman igual a las mismas cosas**: "Empresarial"
  contra "Corporativo", mayúsculas distintas en infantiles. Buscar tal cual no traía
  ninguna foto y la pantalla quedaba vacía **sin dar error**. Traducción en
  `src/lib/presentacion/fotos-por-tipo.ts`, probada.
- **Pruebas que no pueden fallar.** Aparecieron dos veces: arman una lista inventada
  adentro de la prueba y la filtran ahí mismo, así que no prueban la aplicación.
  Revisar siempre que la prueba llame al código de verdad.
- **Logos dibujados.** Una entrega reemplazó los logos reales por rectángulos de
  color con el nombre escrito. No son los logos de esas empresas: se ve barato y usa
  mal una marca ajena. No se hace.
- **Una función que exige sesión, usada en una pantalla pública.** El envío
  automático de reseñas buscaba el teléfono del cliente con una función del sistema
  interno. Como el cliente contesta la encuesta sin estar logueado, fallaba en
  silencio en cada intento: el interruptor habría quedado prendido y no habría salido
  un solo mensaje. Antes de dar por buena una función que corre en una pantalla
  pública, revisar que todo lo que llama pueda correr sin sesión.
- **Las pruebas pasan y aun así no compila.** Las pruebas no revisan los tipos: la
  entrega usaba cuatro campos que no existen (`telefono` por `phone`, `apiToken` por
  `apiKey`, y dos que nunca se declararon) y las pruebas seguían en verde. El
  revisor de tipos y el build son controles obligatorios, no un extra.
- **Acentos rotos en la documentación.** La revisión completa sólo miraba el código:
  `docs/YA-RESUELTO.md` había juntado 427 sin que nadie lo viera. Ahora la revisión
  mira también los documentos.

## Lo que el dueño tiene que hacer él

- **Dar el aviso a Google desde su panel** para que pase a mirar el sitio.
- **Prender el recontacto automático** y el **asistente de ventas** en Ajustes. Los
  dos vienen apagados.
- **Poner el tope de gasto mensual** de inteligencia artificial, si quiere uno.
- Firebase de producción, credenciales reales de Instagram y prueba física en salón.

## No se tocan

`src/lib/testimonios/para-mostrar.ts`, `src/lib/marketing/candidatos-recontacto.ts`,
`src/lib/marketing/recontacto-automatico.ts`, `src/lib/ai/consumo.ts`,
`src/lib/seo/paginas-publicas.ts`,
`src/lib/public-experience/donde-va-el-asistente.ts`,
`src/lib/budget/monto-de-senia.ts`, `src/lib/costos/ganancia-evento.ts`,
`src/lib/social-fiesta/visibilidad.ts`, `src/lib/presentacion/fotos-por-tipo.ts`.
