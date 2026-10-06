# Revision Codex 69: cierre NO aprobado

5/10/2026. PR 1256 de Claude YA fusionada, main `feb90f4d40906029d6d31ba2e2abbed64461a2ad`.
No habia otra PR abierta al contrastar. Ordenes/evidencia nuevas en
`codex/auditoria-final-feb90f4`; no confundir esta rama documental con main.

## Comprobado

- 597 suites / 3.432 pruebas aprobadas; ocho suites repetidas con mocks correctos.
- Originales/hashes: `docs/evidencias/69-resultados/manifest.json`.
- Cliente ficticio: ingreso y pestanas; saldo consistente. Invitado: enlace, mesa,
  QR visible, accesos, carta y red social. No todos los recorridos completos.
- Informe: `docs/evidencias/69-revision-final-de-la-entrega.md`.

## Una tanda de correcciones

- Claude, orden 118: BASE01/02, permisos de funciones generales de fiesta y
  proyecciones publicas sin secretos. Sonda con persistencia sintetica.
- Gemini, orden 119: PORTAL01/02, fiesta de hoy concluida en Uruguay y
  WhatsApp sobre el asistente. Navegador y sonda/medicion reproducibles.
- No duplicar orden 117 (video/voz/multipaso/reunion/pantalla/estaciones) ni
  orden 112 B.1/AUD01 (mapa de areas). Codex no programo ni fusiono la app.

## Limites para cierre

- E2E amplia interrumpida: timeouts de 90 s; sin reporte completo, NO aprobada.
  Un timeout exacto registrado, no trazas; orden 114 mantiene entorno compilado verificable.
- Dev local reinicio tres veces por umbral de memoria (heap 3072 MB); no extrapolar a produccion.
- Firestore desactivado en JSON local: dedicatoria no confirmada; no es evidencia
  de defecto productivo. Proveedores reales y 19 importaciones no comprobados.
- Ensayo fisico de orden 92 va al final, como decidio el propietario.
- No marcar areas limpias por existencia de codigo o por pruebas omitidas.

Claude compila, registra SHA/entorno/resultados; Codex retoma SOLO cambios y limites.
Sin `expectedHeadSha` igual al de `.ak-puerta-verde.json`, no fusionar.
No cambiar de rama ni usar `commit -a` mientras corre la puerta.
