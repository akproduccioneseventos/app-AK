# Acá quedé

Última actualización: 13 de agosto de 2026.
Rama: `main`, con hasta la propuesta 967 fusionada.

## Propuestas abiertas y qué hacer con cada una

- **969 — Presentación alineada con el catálogo. LISTA PARA FUSIONAR.** Es la que
  importa. Trae los doce logos reales, la pantalla del equipo, el Salón Club Uruguay
  y las fiestas infantiles y empresariales. Verificada entera: acentos limpios,
  tipos en cero, 1562 pruebas y compila.
- **968 — Orden de la presentación. CERRAR sin fusionar.** Su contenido ya viaja
  adentro de la 969.
- **970 — Entrega de Gemini de reseñas y plan del equipo. NO FUSIONAR sin revisar:**
  cambia siete archivos y **ninguno trae la función pedida**. Agrega un archivo de
  pruebas de algo que no existe, más cambios de configuración de compilación y un
  script de PowerShell que no venían al caso.

## Lo hecho el 13 de agosto

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

**Presentación (en la 969):** los doce logos reales, sacados del catálogo impreso,
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
