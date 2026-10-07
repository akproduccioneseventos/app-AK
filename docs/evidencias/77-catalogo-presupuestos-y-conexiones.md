# Auditoria 77: trabajo independiente mientras la tanda se programa

7/10/2026. App main `9bb955ac6af65a314f3ac62975020b37c9edaaf3`.
Rama de documentos: `codex/auditoria-75-20261007`. No es main.
El dueno informa trabajo en paralelo: no se esperaron ni reprogramaron 112/122/126.
Al cierre aparecio PR1262, HEAD `f6f91e9d24eeb6bb9dfd5d06430019e81835cc95`,
contacto corregido PRESENTE. No reimplementarlo ni darlo por aceptado/publicado.
Fotos/base/helper y sus consumidores no cambian en ese HEAD. No conocemos el
HEAD no publicado del otro trabajo: orden 127 exige contraste antes de programar.

## Hallazgos nuevos: comida, evidencia visual y consumidor real

**MENU77-BUFFET P2.** Mesa bufet en la base apunta a un JPEG de pizarra oscura
sin comida. El helper real lo devuelve y el catalogo/simulador lo consumen.
La referencia del dueno muestra un servicio de buffet con comida. No se afirma
que Firebase tenga hoy ese mismo dato: falta contrastar maestro autenticado.

**MENU77-PICADAS P2.** Picada criolla y Picada de mar resuelven fotos
intercambiadas respecto a los titulos de Canva. Se documenta la relacion
visible, no se adivinan ingredientes ni se declara correcto el nombre original.
Confirmar la combinacion canonica si el material original tambien contiene el
intercambio. Es una causa con dos platos, no dos PR.

Orden unica 127 a Claude (comida), con rutas/simbolos/consumidores actuales,
assets, condiciones de no pisar fotos personalizadas y pruebas PENDIENTES.

## Catalogo revisado sin repetir lo que ya estaba visto

Se uso Canva como cliente que mira foto y nombre, despues los assets exactos
de Git con el helper real. No un algoritmo que "aprueba" por URL existente.
La base tiene 44 platos: 22 entradas, 18 principales (incluye Mesa bufet) y
4 infantiles. Resuelve 43 fotos; empanaditas/pizzetitas no tiene foto confirmada.

| Resultado de comparacion | Cantidad / detalle |
|---|---|
| Foto correspondiente a la referencia | 38: 7 de 75 reutilizadas + 31 nuevas |
| Discrepancias visuales | 3 platos: buffet y ambas picadas |
| Opciones base sin equivalente encontrado en Canva | 3: papas cheddar, empanaditas/pizzetitas, pancho de medio metro |
| Opciones Canva no encontradas en la base estatica | 7: cuatro entradas y tres principales adultos |

Canva muestra 24 entradas, 20 principales, 3 infantiles y una seccion buffet.
No concluir que los siete falten en Firebase ni crear duplicados/precios cero.
Fotos extra no son bugs por no estar en Canva; pueden ser decisiones comerciales.
El pancho largo tiene una foto real; no reportarlo como imagen incorrecta.

Reproduccion de los assets, sin modificar archivos de la app:

```text
node docs/evidencias/77-catalogo-local.mjs
```

`77-resultados/catalogo.json` guarda IDs, URLs resueltas y hashes. Cinco hojas
de contacto muestran las 37 opciones no revisadas antes, incluidos el hueco
sin foto y el fondo erroneo. Seis capturas guardan las secciones restantes de
Canva. Las siete anteriores y su referencia siguen en 75, no otra revision.

La foto Picada snack es una captura de telefono de 296 x 640; el recorte de
las tarjetas es 96 x 80 con object-cover. La comida coincide; NO se reprodujo
un defecto visible en el consumidor. Limpiar su archivo seria propuesta de
calidad, no impedimento inventado para publicar. El JPEG de buffet pesa 1,18 MB:
optimizar la foto correcta es secundario a que muestre el servicio correcto.

## Los 19 presupuestos originales: no volver a inventar una aprobacion

Ya existe control readonly conectado: `getFinancialIntegrityReport`,
`src/app/actions/financial-integrity.ts`, llama presupuestos/facturas/fiestas
con permiso CONTABILIDAD. `runFinancialAudit` en
`src/app/(app)/auditoria/page.tsx` lo usa y muestra error si falla.
No pedir crear otra pantalla ni contar el numero de fixtures como registros reales.

Se aprobaron sus tres pruebas con datos sinteticos. Originales examinados en
esta tanda: **0**. Registros Firebase cotejados contra originales: **0**.
El registro compartido ya advierte que la copia local no contiene los 19 reales.
No se confunde falta de evidencia local con que las fiestas se hayan perdido.

Para cerrar falta una tabla privada/autorizada uno a uno: documento original
e ID presupuesto/fiesta/factura; fecha, invitados, servicios y regalos,
descuento, moneda, total, pagos confirmados, saldo y enlaces. No subir a Git
documentos privados/PII. Una fiesta pasada no prueba que este pagada o cerrada.
El control interno encuentra inconsistencias, pero no puede verificar una
promesa o monto que solo figura en el papel original no inspeccionado.

## Conexiones externas: seis suites y 39 casos pasan en este main

Se ejecutaron una vez y sin credenciales, envio/publicacion/pago real:

| Contrato probado | Casos | Evidencia que NO aporta |
|---|---|---|
| YouTube: bytes resumable, rechazo sin ID y limite de tamano | 4 | Canal autorizado o video recibido en YouTube |
| TikTok: fallo/proceso/completado y persistencia simulada | 7 | Permisos o publicacion real en TikTok |
| Instagram: tres sync sin duplicados y limpieza de copias | 3 | Credenciales/historial vivo ni carrera RED03 de videos |
| Voz Gemini: proveedor simulado, WAV, limites concurrentes y permisos | 12 | Modelo/cuenta real, costo autorizado, microfono o parlante |
| Mercado Pago core: saldo, estado, HMAC, idempotencia y reembolsos | 10 | Checkout/webhook sandbox real ni conciliacion bancaria |
| Integridad presupuesto/factura/fiesta | 3 | Fidelidad de los 19 documentos originales |

**39 pasan, 0 fallan, 0 pendientes; 6 suites.** Raw comprimido y hashes en
`77-resultados/manifest.json`. Incluyen 6 comprobaciones estaticas de fuente
(YouTube 1, TikTok 2, voz 3) y 33 casos que ejecutan helpers/acciones con datos
sinteticos; las seis estaticas NO son recorridos de funcionamiento.
Son focalizadas de main9bb, NO las pruebas de
la PR1262 ni build, E2E o demostracion de todas las integraciones.
No sumarlas con las 3522 antiguas como cobertura global del SHA actual.

Gmail/recuperacion y WhatsApp: el inventario del ayudante encontro consumidores
y tests con proveedores simulados. No ejecutados en esta bateria; no se probo
recepcion/canje del correo ni mensaje recibido. Un formulario configurado no
demuestra que su cuenta tenga permisos vigentes. No pedir activarlos de nuevo
sin mirar el estado real y las decisiones del dueno.

Un ayudante economico hizo solo inventario de evidencia; el principal reviso
fuente/consumidores y ejecuto la bateria aislada. Ayudante cerrado. No se le
delegaron dinero, permisos ni aprobacion final. No se inicio otra IA por escribir.

## Limites y salida concreta

- Pendientes existentes siguen en su tanda. PR1262 ya contiene CONTACT75;
  clasificacion: correccion presente en rama pendiente de validar, no arreglarla otra vez.
- Nuevo 127: fotos de comida; contrastar primero el trabajo no publicado.
- Entorno 114/roles/backend/Storage, 19 originales, proveedores autorizados y
  hardware aun no aceptados. No una certificacion de cero errores.
- Catalogo base/Canva visualmente revisados; NO selector productivo, recetas,
  precios, PDF/CRM ni propagacion de fotos editadas en Firebase aceptados.
- Solo documentos/sondas de auditoria: no app programada, build ni fusion por
  Codex. No datos productivos tocados. Documentos viajan con la tanda de codigo.
