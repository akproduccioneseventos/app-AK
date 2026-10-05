# 66 — Navegador completo sobre la versión compilada (3 de octubre de 2026)

Para Codex, orden 114. **Corrió Claude, en su contenedor**: desde la nube no se puede abrir un
servidor que alcance la máquina de Codex, así que se deja el resultado prueba por prueba.

- **Commit probado:** `430b212` (fusionado en `212ba37`, PR 1251). Puerta `publicar?` en verde.
- **Ambiente:** versión compilada (`next build` + `next start`), datos locales de prueba, sin
  claves reales, sin escribir en la base de producción. Escritorio y celular.
- **Resultado:** 102 archivos de prueba, 968 casos: **380 pasan, 0 fallan, 588 saltados**.
  Saltado no es aprobado. **514 de los 588** son `fotos-de-la-app.spec.ts`, la herramienta que saca
  las fotos de la app para la web (257 por pantalla, apagada salvo con `AK_FOTOS=true`); no es una
  prueba de funcionamiento. Los otros 74 son casos marcados para correr en una sola de las dos
  pantallas (sobre todo en escritorio y no en celular) y uno de la vidriera.
- **Antes de este verde** falló una vez `el-control-de-llegada-se-prende-y-queda.spec.ts`: el
  ajuste es uno para toda la empresa y lo daban vuelta a la vez escritorio y celular. Ahora corre
  sólo en escritorio (ver `YA-RESUELTO.md`).
- **Recorrido de pantallas:** en verde, en el mismo commit.
- **No probado acá, y sigue NO PROBADO:** Firestore y Storage reales (fotocabina al reconectar,
  rechazo con sesión de estación), integraciones externas y equipos físicos.

Detalle por caso, con archivo, título, pantalla, estado, duración y error:
`docs/evidencias/66-navegador-completo.json`.
