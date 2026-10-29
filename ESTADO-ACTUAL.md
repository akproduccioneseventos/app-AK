# Estado actual — 29 de octubre de 2026
## Entrega para Claude: PR 1375
- Rama `gemini/orden-255-asistente-ak`, desde la corrección de Claude `dcdac4ee3`; código de esta entrega `790cf920941e64de5c3683d701284157bb21c8d7` (después solo documentación y un espacio final).
- Pendientes pedidos implementados: voz MP3 real con cupo compartido; presupuesto comercial en borrador; consentimiento promocional auditable/revocable; informe posfiesta visible; avisos de prospectos y cuotas reconciliadas.
- Los 11 casos están en `src/__tests__/el-asistente-de-ak.test.ts`. Regresión conjunta: 22 suites/131 PASS, TypeScript PASS con heap 4096, ESLint PASS y acentos PASS.
- El primer TypeScript agotó el heap predeterminado; la repetición con más memoria encontró un error de comparación de tipos, corregido, y luego pasó.
- No se enviaron mensajes reales ni se tocaron datos reales. No se agrega `data/` ni `src/data/` al commit.
- Sin build, E2E de navegador, Firebase ni Meta/Gemini reales: los verifica Claude antes de publicar. Mantener PR abierta, no fusionada.
- Matriz y límites: `docs/evidencias/orden-255-asistente-aceptacion.md`.

Rama de trabajo: `claude/app-debug-stabilize-m70e6z`. Versión publicada: la integración de 1370 y 1374 (esta tanda).

## Publicado en esta tanda
- **1370 de Gemini (órdenes 247, 249, 251 y 252):** sesiones que se cortan, perfil roto que no entra, último dueño, casillas de módulos fuera, enlace del presupuesto que se apaga, factura y presupuesto que no se borran con cobros, centavos del contador, un solo número de plata (comisión, mes de pagos, seña sin presupuesto, saldo), pregunta frecuente del ajuste.
- **1374 de Gemini (orden 254):** plantillas de decoración que se publican solas y objetos nuevos a la biblioteca.
- **Completado por Claude:** dueños con candado entre servidores, presupuesto que se vuelve a mirar en la transacción del borrado, recortes achicados para que entren en la base y gasto contado siempre, tipos de la comisión y del renglón cerrado, sesión de prueba con usuario adentro en las pruebas de navegador.

## Pendiente
- **Codex** programa: orden 255 bloques 3 a 9 (sobre la 1375) y orden 253 (sobre la 1371). Claude compila, verifica y publica.
- **Gemini**: órdenes 242 a 246 y 248 (una sola propuesta).

## Para el dueño (abogado)
- Revisión legal del contrato de Codex: `docs/evidencias/738-legal-contratos-dictamen.md` en la rama de Codex. No se cambia nada sin abogado.

## Errores de plata y permisos abiertos
- Ninguno conocido después de esta publicación.
