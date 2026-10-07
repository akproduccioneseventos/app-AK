# Orden 126: WhatsApp correcto también cuando falla la configuración

## Fuente contrastada y reparto

7/10/2026. Main `9bb955ac6af65a314f3ac62975020b37c9edaaf3`, fusión #1261.
Consulta actual: ninguna PR abierta. La entrega 1261 sí corrigió órdenes
123/124/125; no reprogramarlas por seguir viendo una versión pública anterior.
El bootstrap y los dos callbacks del simulador no cambiaron en esa entrega:
CONTACT75 se reprodujo también en el SHA nuevo, no sólo en el publicado.

**Gemini:** contacto y UI pública. **Claude:** compilación y registro de la
puerta del conjunto. Codex audita/retesta, no programa app. Escribir esta orden
no arranca otra IA. Reunir con RED03 /122 y AUD01 /112 B.1 en una tanda de código;
no una PR por hallazgo ni fusión separada de documentación. Dueño fusiona.

## Área: web · Commit: 9bb955ac6af65a314f3ac62975020b37c9edaaf3

**Hallazgo: CONTACT75, P1.** El presupuesto o consulta puede dirigirse a un
número de ejemplo en lugar del teléfono oficial de AK cuando no se recupera
la conexión de WhatsApp. No se afirma que ocurra con la conexión real sana.

Fuente/consumidores actuales comprobados:
- `getPublicSimulatorBootstrap`, `src/app/actions/public-simulator-bootstrap.ts:95`:
  `whatsappConnection?.phoneNumber || "59899123456"`.
- `SimuladorContent`, `src/app/simulador-de-presupuesto/page.tsx:459` carga ese
  `whatsappNumber` en el estado.
- `handleWhatsAppQuickConsult`, misma página línea 1102; botón de consultar.
- `handleShareBudgetWhatsApp`, misma página línea 1108; compartir el enlace
  personalizado del presupuesto. Ambos llaman `toWhatsAppNumber` y `window.open`.
- Fuente oficial existente: `AK_WHATSAPP_NUMBER`, `src/lib/public-contact.ts:8`.
- Botones reales con `onClick`: compartir línea 1684, consulta 1691;
  compartir también en 1611/3124 y fallback de agenda en 1653.

## Reproducción aislada ejecutada

```text
node docs/evidencias/75-simulador-contacto-probe.cjs
```

Ejecuta bootstrap real del Git, normalizador real, constante oficial real y
los DOS callbacks reales extraídos por AST TypeScript. Sólo simula lectores de
configuración y captura `window.open` en memoria; no crea CRM, presupuesto,
HTTP, mensaje ni cuenta de WhatsApp. No lee credenciales.

| Caso | Resultado observado |
|---|---|
| No hay conexión WhatsApp | Ambos callbacks abren `wa.me/59899123456` |
| Lectura de conexiones rechaza | Ambos abren el mismo número de ejemplo |
| Lectura no termina | El timeout REAL de 4,5 s aplica el mismo fallback |
| Control: conexión con número oficial | Ambos abren `wa.me/59898355530` |

Pasar la sonda significa reproducir el defecto, NO que esté arreglado. Una causa
con tres condiciones y dos consumidores, no seis bugs ni seis propuestas.
No se enviaron datos a ese destino ni se comprobó quién posee el número.

## Resultado requerido, sin cambiar el negocio

Usar el contacto canónico de AK cuando no existe conexión recuperable; nunca
un número de demostración. Conservar una conexión explícita válida aprobada
del negocio; validar/normalizar el destino antes de abrir WhatsApp. Si el dato
es inválido, aplicar el fallback oficial o error visible, no `wa.me/` vacío.
Compartir debe conservar texto, total, enlace/token del presupuesto y la opción
de consulta existente. No modificar fórmula de precio, pagos ni permisos.

Agregar regresiones reales para conexión ausente, error, demora, dato inválido
y conexión válida. Simular el proveedor/configuración, NO reemplazar bootstrap
ni copiar la lógica de fallback dentro del test. Comprobar destinatario de
los dos botones consumidores, no sólo que el objeto tenga `whatsappNumber`.
Regresiones rojas en `9bb955ac`, verdes con el arreglo. Después retest en el
entorno aislado de orden 114, sin enviar WhatsApp ni consultas ficticias al CRM.

## Lo ya cerrado y lo que no se confunde

- Retest 1261: 6 suites / 50 casos pasan, sin pruebas de backend real; incluye
  las 29 nuevas de guardado/barra/salón/web y 21 controles anteriores.
- El correo como WhatsApp en PRIVACIDAD está corregido en main. CONTACT75 es
  otro consumidor/fallback, no la misma orden 125 repetida.
- Navegación pública a privacidad todavía mostró el correo; SHA publicado no
  identificado. Corrección Git presente, despliegue aún no comprobado. No pedir
  volver a escribir su código sin contrastar release/caché/versión primero.
- Siete fotos locales recomendadas coinciden visualmente con el Canva original.
  Eso no acepta todo el catálogo ni las fotos editadas en la base productiva.
- Nuevas pruebas propuestas abajo **PENDIENTES**, no existen ni se ejecutaron.

```comprobar
archivo: src/app/actions/public-simulator-bootstrap.ts
usa: getPublicSimulatorBootstrap en src/app/simulador-de-presupuesto/page.tsx
archivo: src/lib/public-contact.ts
usa: AK_WHATSAPP_NUMBER en src/app/actions/public-simulator-bootstrap.ts (PENDIENTE, consumidor requerido por esta corrección)
usa: handleWhatsAppQuickConsult en src/app/simulador-de-presupuesto/page.tsx
usa: handleShareBudgetWhatsApp en src/app/simulador-de-presupuesto/page.tsx
prueba: src/__tests__/simulador-contacto-con-configuracion-caida.test.ts (PENDIENTE)
prueba: tests/e2e/simulador-contacto-oficial.spec.ts (PENDIENTE, entorno aislado)
```
