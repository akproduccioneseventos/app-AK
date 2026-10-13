# Auditoria98 - Arreglos recibidos comprobados, no reprogramados

Areas: asistente, entretenimiento y portal de fotos.
Commit ejecutado: `755f0707d55a09dbc0641f65e2d56c2e7ac77c60` (main remoto).
Hallazgos nuevos: VIS98-MURAL P1, geometria que recorta contenido; orden150.
NO CONTRASTADO CON TANDA DE PROGRAMACION LOCAL NO SUBIDA.

## Resultado y evidencia

Retests funcionales:18 ejecuciones aprobadas, cero fallidas/omitidas,16 pares
caso/viewport distintos y dos repeticiones del espejo con un criterio mas fuerte.
Extension visual:4 ejecuciones FALLIDAS (dos pares PC/movil, repetidos para
agregar control causal). Total22 ejecuciones:18pass/4fail,NO conjunto verde.
PC y viewport movil de Chromium, NO telefonos ni equipos fisicos.

| Orden / criterio recibido | Resultado observable |
| --- | --- |
| 146 voz: respuesta tardia despues de Cortar | 0 adquisiciones de microfono, 0 sockets y panel no reabierto |
| 146 voz: primer intento HTTP503 | segundo clic inicia segunda peticion; no requiere tercer clic |
| 148 fotos guardadas cuyo lector falla | aviso + Reintentar; no anuncia 0 fotos ni habilita sobrescribir; archivo sigue en Storage |
| 148 reintento / galeria genuinamente vacia | falla repetida conserva archivo; al retirar SOLO fixture propia y reintentar muestra 0 de 2 y habilita carga |
| 145 Touchpix, camara nativa falsa | imagen con pixeles no negros, descarga con bytes reales, sin cookie del equipo |
| 145 misma senal azul/verde de Codex | primera y segunda captura tras recargar tienen mas de 500 pixeles de esa senal |
| 145 camara que no entrega cuadros | aviso + boton Reintentar camara, ninguna foto ni posteo |
| 144 espejo, analisis de imagen caido | UN posteo pending, aviso de aprobacion del equipo, mural publico cargado no lo muestra; recargar no duplica |

Voz/video: `98-browser.json`, `98-browser-resultados.json`, 8 pass en 3.3 min.
Estaciones inicial: `98-stations-primer.json`, `98-stations-primer-resultados.json`,
8 pass en 3.2 min. Capturas originales conservadas en `98-artifactos/98-stations-*`.
Espejo reforzado: `98-mural.json`, `98-mural-resultados.json`, 2 pass en 1.2 min.
Este ultimo exige HTTP200, `live-wall-empty` visible y fin de Cargando muro;
NO acepta una pantalla todavia cargando como prueba de que excluye la foto.
Raw inicial conservado antes de la segunda corrida. No contar las dos
repeticiones como dos funcionalidades nuevas ni borrar la primera evidencia.

Inspeccionadas capturas movil de error de fotos y Touchpix con senal real de
prueba. Avisos/controles visibles; no aprobacion estetica de toda la app ni de
todas sus combinaciones de contenido. Captura del mural llevo a sonda visual
nueva: estadoDOM cargado NO significa que el contenido se pinte.

## Hallazgo visual nuevo, sin deshacer moderacion aprobada

Con fiesta propia y mural forzado, PC/movil, el texto existe pero sus padres
flex miden0px/overflow:hidden. La caja del estado vacio mide80px por padding,
por eso toBeVisible PASA. Tras4s y otros4s permanece recortado; titulo no recibe
el punto de su centro. Sin errores de pagina en esa sonda, no animacion inicial.
`.ak-red-premium-live > * { position:relative }` de ak-public-experience.css260
gana a fixed del root y deja alto180px en PC. Control sobreescribe SOLO position
en navegadorQA: misma escena/datos ahora area540px PC/659px movil y titulo pintado.
NO codigo de app corregido ni aceptacion por el control. Orden150 Gemini.
Raw `98-visual-primer.json` (2fail), `98-visual-control.json` (2fail del original
despues de comprobar control positivo), resultados/capturas `98-artifactos`.
Una causa P1; no declarar que otras pantallas fallan sin reproducirlas.

## Metodo y limites de aceptacion

- TEMP98 separado, source SHA protegido, Firestore8085/Storage9195 demo,
  Next dev3300. Sin .env ni credenciales productivas, sin modificar codigo de app.
- Voz: solo respuesta de proveedor controlada (503 o ficha tardia); no conversacion
  con Gemini real, factura de voz ni audio fisico. WebSocket HMR no se reemplaza.
- Fotos/video/espejo/Touchpix: paginas, acciones y SDK contra emuladores reales;
  no respuestas de app simuladas para fabricar posteos/archivos.
- Vision devuelve API key not valid con clave `dummy`: falla real del analisis,
  NO fallo demostrado de la cuenta de AK ni prueba de moderacion real disponible.
- Video: emulador sin firmante. El control de recuperacion retira SOLO la foto
  ficticia propia; NO certifica la visualizacion de URLs firmadas reales.
- Touchpix: se probo contenido de captura y descarga. No certifica transformacion
  facial, impresora, 360 ni todas las acciones del operador por esa captura.
- Espejo: recarga sin duplicados, NO reenvio concurrente del mismo POST aceptado
  por esta prueba. No ampliar la afirmacion de idempotencia mas alla de ese caso.
- Arranque frio compila rutas de desarrollo; no usar esos tiempos como medicion
  de rendimiento del sitio publicado. Logs de peticiones abortadas no son por
  si solos un nuevo defecto reproducido de producto.
- Solo sintaxis QA y diff comprobados; sin build/typecheck/lint completo de app.
  Claude conserva compilacion y aprobacion final de la tanda.

Comandos con el runner `node docs/evidencias/98-ejecutar-aislado.mjs`:
`start`, `e2e --workers=1`, `stations --workers=1`, y
`stations --workers=1 --grep 'Mirror failed'`. Extension: `resume`, luego
`visual --workers=1` (original y control). No repetir positivos sin delta.
Runner conserva SHA y restricciones demo. Recolector conserva JSON/capturas.
Primera limpieza98 elimino diez sesiones de entretenimiento propias remanentes;
segunda limpieza tras extension visual confirma cero remanentes en raw98-limpieza.
Fiestas,
posteos y fotos propios ya retirados por finally. No colecciones preservadas.
Runtime98 detenido por PID/fecha/comando validado; puertos3300/8085/9195 libres.
Primer intento de ejecutar el script de cierre fue bloqueado por politica local
de PowerShell; se ejecuto con politica de proceso, sin cambiar politica del equipo.

## Lo que no se cierra por estos verdes

1. Orden149: dos P2 comprobados97 (NodeSDK en primera generacion y respaldo de
   FiestaA que priorizaB). No hay nueva correccion publicada contrastada.
2. Orden147: PNG QR original que no lee la propia app; intento retirado por
   fallo movil. No repetir sonda igual ni cerrar por el control con borde.
3. Salon3D: escena/canvas historicamente no aceptados; nueva entrega debe tener
   delta causal y evidencia de escena, no fotografia de respaldo.
4. 19 presupuestos manuales: requieren originales y export autorizado de lectura.
5. Integraciones reales/URLs firmadas/modelos y voz: cuentas y entorno autorizados,
   resultado final observable; mocks ni un enlace de ajustes no prueban conexion.
6. Release: build final y revision Hosting del mismo SHA registra Claude.
   Ensayo de hardware reservado por el dueno para despues.

No nueva orden duplicada144/145/146/148; criterios anteriores quedan cerrados
en esta fuente y contexto. No `14 areas limpias`, no certificado `0 errores`.
