# Orden169 - Panel DJ: desmarcar y avisar si falla guardar

NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE/GEMINI: HEAD desconocido.
Fuente main/publicada: e8cd2c2b114bcda21d153cb406318cc1119d1dc5.
PR1314 abierta d4b1a84ee6cea662603e00cdea0012854875ee83: pagina DJ y accion
directas identicas a main; no contraste transitivo ni aprobacion de esa PR.
Contrastar tanda nueva antes de programar. No repetir167/168 activas.

Gemini programa; Claude revisa/compila/valida/fusiona. Codex solo audito.
Integrar documentacion con el arreglo, no fusionarla sola. No cambiar politica
de votos, dinero, permisos, listas del cliente ni funcionamiento comercial.

## P2 - Desmarcar no devuelve una cancion a pendientes

Ruta real /evento/dj/[fiestaId]. DJPage ofrece Marcar como no reproducida.
handleMarkPlayed siempre llama markSongPlayed(fiestaId, req.id); esta funcion
escribe siempre played:true. Al pulsar el boton real sigue true, y tras
desmontar/remontar sigue sin aparecer en pendientes. Pagina y accion reales;
Firestore, lecturas y permiso ficticios. No dispositivo ni base reales.

Corregir el contrato para pedir estado deseado explicito (o equivalente
compatible). No toggle ciego: repetir false debe conservar false. Mantener
requireEventPermission y pertenencia del pedido a la fiesta. Localizar todos
los consumidores antes de ampliar contrato, no inventar rutas o funciones.

## P2 - Si guardar la marca falla, el operador no recibe aviso

update del doble rechaza. La accion REAL retorna success:false con error.
La pantalla ignora ese resultado, refresca y no informa fallo ni reintento.
No guarda una marca falsa ni pierde la cancion: el defecto es no comunicarlo.

Mirar success, comunicar error accesible y liberar ocupado en finally, tambien
si falla transporte. Conservar lista confirmada y permitir reintentar.
Votos NO probados por esta sonda: no dar sus fallos por confirmados.

## Evidencia y aceptacion

131-dj-control-reproduccion.test.tsx:4casos distintos,2PASS2FAIL en e8.
131-dj-observado.json: estados persistidos, texto visible y remontado.
ControlesPASS: marcar normalmente; rechazar ID de otra fiesta sin mutarlo.
No navegador nativo, equipo fisico, autorizacion real ni aceptacion global.

Despues del parche ejecutar sobre SHA nuevo. Llevar la sonda a regresion
estable y sumar permiso denegado, excepcion de transporte y repeticion del
estado deseado. Estos tres casos adicionales estan PENDIENTES, no aprobados.
Claude ejecuta la validacion amplia final congelada, Codex no compila/fusiona.

```comprobar
archivo: src/app/actions/social-interactive.ts
usa: markSongPlayed en src/app/evento/dj/[fiestaId]/page.tsx
archivo: src/app/evento/dj/[fiestaId]/page.tsx
usa: handleMarkPlayed en src/app/evento/dj/[fiestaId]/page.tsx
prueba: docs/evidencias/131-dj-control-reproduccion.test.tsx
prueba: PENDIENTE src/__tests__/dj-estado-explicito-y-error-de-marca.test.tsx
```
