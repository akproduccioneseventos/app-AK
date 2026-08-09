# Acá quedé

Hoja corta de traspaso entre Codex, Gemini y Claude. Se pisa al cerrar cada tanda;
el histórico y la evidencia larga están en `ESTADO-AUDITORIA.md`.

**Última actualización:** 9 de agosto de 2026
**Rama:** `codex/audit-claude-gemini-since-769`
**Base auditada:** `main` `96e01a96` (PR #904)
**PR:** #905, abierta en borrador.
**Estado:** validación final en verde; no fusionar automáticamente.

## Alcance ya inventariado

- Última PR Codex confirmada: #769.
- Después: 60 PRs Claude fusionadas y 3 cerradas sin merge (#805, #812, #846).
- No hay PR Gemini confirmada; 7 menciones ambiguas quedaron documentadas.

## Corregido en esta rama

- LED reconoce `screenPlaylist.items` y su modo audiorrítmico.
- Cambiar la clave del portal revoca sesiones anteriores.
- Los límites públicos no se evaden cambiando nombre/autor.
- Facturas con pagos conservan cliente, contenido y pagos existentes.
- Familias mixtas guardan y muestran adultos/niños por separado.
- Cuatro estaciones avisan al operador cuando falla la cámara.

## Verificado hasta ahora

- 38/38 pruebas focalizadas y 9/9 tras las dos guardas finales.
- Suite completa final: 1333/1333; TypeScript sin errores.
- Lint sin errores nuevos; 5 avisos preexistentes fuera del cambio.

## Regla permanente del dueño

Usar agentes económicos `low` para inventarios, búsquedas y pruebas simples; el
modelo principal dirige y decide. Preferir Luna cuando Codex la habilite; en esta
sesión sólo estaba disponible Terra. Nunca fusionar la PR automáticamente.
