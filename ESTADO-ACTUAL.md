# Estado actual — 4 de noviembre de 2026

Rama de trabajo: `claude/app-debug-stabilize-m70e6z` (igual a la principal). Versión publicada: la 1379.

## Publicado
- **1379 (Gemini, órdenes 262 a 268, revisadas por Claude):** el prospecto del anuncio va al simulador y a la entrevista;
  la app instalada pregunta "¿Quién sos?"; la Plataforma 360 edita sola (video de 12 a 20 s, armado en tiempo real a
  propósito); pantalla gigante desde el celular; el ajuste anual NO se le muestra al prospecto (sólo con presupuesto
  Aceptado o Facturado). Claude cerró un permiso: la orden por voz aceptaba un perfil por parámetro.

## Decisiones pendientes del dueño
- Contratos nuevos: ¿15% fijo sobre el primer presupuesto, o acumulativo como hoy? (el contrato dice acumulativo; ver con el abogado).
- Panel del cliente: hoy muestra de entrada el total ajustado hasta el año de la fiesta; ¿que aparezca año a año? (`saldo-con-ajuste.ts`). Cuando decida, orden para Gemini.
- Play Store: crear la cuenta (unos 25 dólares) y pasar la huella para `public/.well-known/assetlinks.json` (`REEMPLAZAR_HUELLA_PLAY`).

## Otros
- La 1366 (auditoría vieja de Codex) sigue abierta; lo que traía ya se arregló.
- Gemini no puede subir solo: el dueño pega en PowerShell `git add -A`, `git reset -q -- data src/data`, `git commit`, `git push`.

## Errores de plata y permisos abiertos
- Ninguno conocido.
