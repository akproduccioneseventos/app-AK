# Ajustes del instrumento de recorrido, no de la app

Fuente congelada3e45a4ac6b479f89605163168e31b37dc84f2d0f.
Los archivos333/334 solo generan y coordinan pruebas en la copia ficticia.
No cambian la app ni la fuente compilada.

1. El inventario original omitefiestaId en rutas/fiestas/nueva. Sus consumidores
   configuracion/en-vivo/costos lo leen de searchParams. Un redireccionamiento
   a/eventos o un encabezado no acredita el modulo. Los nuevos tramos aportan
   fiesta_esta_noche, ya sembrada, y334 vuelve a abrir SOLO los intentos sin ese
   dato; conserva resultados originales, incluidos losPASO sin contexto.
2. El recorrido original ignora errores de captura pero puede esperar el timeout
   completo de cada una. Para los siguientes tramos333, la captura sigue siendo
   posterior a los controles de pagina, usa animations:disabled y timeout5000;
   registra captured/unavailable y el error, no inventa una imagen tomada.
   No cambia controles funcionales ni convierte la captura en prueba de animacion.
3. El inicio de cada nuevo tramo vuelve a comprobar recursos y mantiene un solo
   servidor/navegador. No se altera una copia de test que ya esta ejecutandose:
   el generador actualizado se lee al crear el siguiente tramo.

El primer tramo33201 conserva el generador previo, sin estos dos ajustes.
No se atribuyen las omisiones de contexto ni las esperas de captura a la app.
duracionMs del test original se toma al terminar page.goto, antes de hidratacion,
controles y captura: NO es tiempo total de carga ni una medicion de produccion.

343 corrige una atribucion inicial de339: la lectura diagnostica de main no
tenia timeout y algunas estaciones se dibujan con div, sinmain.33802 se atasco
tambien sinCDP; no se demostro queCDP ni la app fueran la causa. Se conserva
ese errorQA, se comprueba presencia de main y se limitan lecturas a1500ms.
344 continua solo las once entradas sin recibo, sin repetir las cuatro guardadas.
