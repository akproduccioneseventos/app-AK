# PARA GEMINI - Orden 169: Panel DJ, desmarcar y avisar si falla guardar

**Una sola propuesta con todos los bloques.** Si un bloque se traba, entregá el resto en la misma
propuesta y avisá cuál faltó. Antes de decir "terminé", pasá `docs/ANTES-DE-ENTREGAR.md` sobre lo
que tocaste. Arrancá desde la versión principal de hoy (`git fetch origin main`).

## Camino exacto (lo investigó Claude; no lo repitas)

### Bloque 1 - La acción recibe el estado que se quiere

`src/app/actions/social-interactive.ts`, `markSongPlayed` (línea ~349). Hoy escribe siempre
`{ played: true }`.

- Firma nueva: `markSongPlayed(fiestaId: string, requestId: string, reproducida: boolean)`.
- Escribe `{ played: reproducida }`. **No** es un "dar vuelta": si llega `false` dos veces, queda `false`.
- Si `typeof reproducida !== 'boolean'`, devolver `{ success: false, error: 'Estado inválido.' }` sin escribir.
- **No tocar**: `requireEventPermission(fiestaId, PERMISOS.NOCHE)`, la lectura del documento y el
  control `snapshot.data()?.fiestaId !== fiestaId`. Siguen igual y antes de escribir.
- El único que la llama es la pantalla del DJ (verificado). No hay otros consumidores.

### Bloque 2 - La pantalla del DJ pide lo contrario de lo que ve y avisa si falla

`src/app/evento/dj/[fiestaId]/page.tsx`, `handleMarkPlayed` (línea ~59) y `handleVote` (línea ~67).

- `handleMarkPlayed` llama `markSongPlayed(params.fiestaId, req.id, !req.played)`.
- Mira `result.success`. Si es `false`, o si la llamada tira excepción, muestra un aviso visible
  con `role="alert"` en la pantalla: *"No se pudo guardar la marca. Tocá de nuevo."* (estado nuevo,
  por ejemplo `const [actionError, setActionError] = useState<string | null>(null)`, que se limpia
  al empezar la próxima acción). La pantalla hoy **no usa toast**: un cartel simple arriba de la
  lista alcanza, con el estilo oscuro que ya tiene.
- `setActionLoading(null)` va en un `finally`, para que el botón no quede girando si falla la red.
- La lista **no** se marca sola: se sigue refrescando con `fetchData(false)` después de guardar,
  así la canción queda donde la base dice.
- `handleVote`: mismo trato (mirar `success`, aviso, `finally`). La regla de un voto por teléfono
  de `voteSongRequest` **no se toca**.
- Sacar los dos comentarios `// no-mira-el-resultado:` de esas funciones, porque ahora sí se mira.

### Bloque 3 - La prueba

`src/__tests__/dj-estado-explicito-y-error-de-marca.test.tsx` (Jest). Base de mentira que
**devuelve una copia** en cada lectura. Tiene que mirar el resultado, no la forma del código:

1. Marcar una pendiente: queda `played: true` y sale de pendientes.
2. **Desmarcar una reproducida desde el botón de la pantalla**: queda `played: false` y vuelve a pendientes.
3. Pedir `false` dos veces: sigue `false`.
4. ID de otra fiesta: no escribe y devuelve error.
5. Sin permiso de la noche (personal sin `PERMISOS.NOCHE`): no escribe y devuelve error.
6. La acción devuelve `success:false`: la pantalla muestra el aviso con `role="alert"` y el botón
   vuelve a estar habilitado.
7. La llamada tira excepción: lo mismo que el 6.

La prueba tiene que nombrar la ruta `/evento/dj/[fiestaId]` (lo exige el control de pantallas).
Podés partir de `docs/evidencias/131-dj-control-reproduccion.test.tsx`, que ya monta la pantalla real.

### Qué NO tocar

Votos de invitados, la pantalla social (`src/app/evento/social/[fiestaId]/page.tsx`), permisos,
`getSongRequests` y el resto del panel DJ.

---

## Lo que encontró Codex (auditoría 131)


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
no-usa: no-mira-el-resultado: marca visual del DJ en src/app/evento/dj/[fiestaId]/page.tsx
```
