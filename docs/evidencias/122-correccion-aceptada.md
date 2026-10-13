# Codex122: tarjeta del asistente conecta con el chat actual

Fuente final `5dc197e5c831d8dbd75dec268efa5806eca957d8`.
NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE. PR1293 no fusionar.

## Antes y despues

En fuente87, PC: pulsar Abrir asistente activo no abre el chat. Su consulta DOM
buscaba Abrir Asistente AK, inexistente (0); el lanzador real Abrir Asistente IA AK
si existe (1) y funciona. `122-indicador-antes.json.gz` conserva esa reproduccion
con fixture JSON vaciado y SDK demo. Cambioapp de122: SOLO ese selector.

Sobre fuente nueva5dc: el mismo boton abre el chat, y el boton principal permite
cerrarlo/reabrirlo. La prueba nativa financiera usa ahora la tarjeta para entrar
en PC, sin saltarse el enlace arreglado. Movil usa su lanzador correspondiente.

-735suites4601tests PASS,0fallos/omitidos. Build con tipos/lint PASS; acentos2862.
-18comprobaciones nativas:2de lanzadores y16de presupuestos ACK/recarga/replay/
 concurrencia/nueva cotizacion/documento persistente, sobre la misma fuente5dc.
-El modelo es DOBLE LOCAL de protocolo; API y Firestore SDK reales en demo.
 Ninguna llamada al modelo externo, datos/cuentas/cargos/mensajes reales.
-SDK0, dos servicios propios detenidos, agentes cerrados y bytes restaurados.
 Archivo de marketing ajeno conserva hashf125e01b...814f1e5.
-Grafo14652nodos/43895relaciones/922comunidades,0LLM;25avisos parciales del parser,
 no errores TypeScript. Gate122 PASS_INDICATOR_AND_CHAT_BUDGET_ACK_ONLY.

## QA propio y limites

La primera sonda no vacio los arrays JSON: no se uso para aceptar el resultado,
se repitio con fixture limpio y todas las guardas restauraron bytes. La primera
prueba unitaria asumio @testing-library/react disponible; fallo con0tests y se
conservo en122-prueba-inicial-herramienta-ausente.json.gz. Se uso ReactDOM ya
instalado, sin agregar dependencias. No son defectos de app ni pruebas omitidas.

Un ayudante confundio HEAD documental con SHAapp y no encontro tres pruebas en
el rango103-121. El diff87..HEAD no cambiaba app hasta122; no era bloqueo por SHA.
Regalos/post-evento/QR si tienen tests historicos, localizados en tests/e2e. Eso
NO certifica su ejecucion en122, pero impide inferir "nunca probado" o encargar
otra correccion por ausencia de referencias. Inventario109 queda por conciliar.

No se cambia la posicion/default/minimizado del indicador ni se cierra la
friccion152; el usuario conserva mover/minimizar. Otros efectos del chat, modelo
real/voz/catalogo variable, deps, Hosting/OAuth/19originales y hardware no tienen
certificado nuevo. No todaapp ni0errores. Los baselines previos siguen archivados.

```comprobar
archivo: src/components/assistant/contextual-assistant-indicator.tsx
usa: ContextualAssistantIndicator en src/app/(app)/layout.tsx
prueba: docs/evidencias/122-indicador-probe.mjs
```
