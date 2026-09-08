# Orden 47 - Marketing y redes: confirmaciones, medios y cifras confiables

Fecha: 2026-09-08. Codex revisa y propone; Gemini programa; Claude Opus compila.
Estado: hallazgos de codigo y orden preparada. No implementado ni probado en cuentas reales.
El dueno dio OK a continuar con estos puntos. No autoriza envios, publicaciones, gasto,
modificar permisos publicitarios ni fusionar automaticamente.

## Base comprobada y trabajo previo

GitHub main verificado el 8 de septiembre: 8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe.
ESTADO-ACTUAL.md de ese commit contiene la entrega de Claude del 5 de septiembre.
Se leyo la hoja y se buscaron entradas pertinentes del registro; NO se leyo el historico
completo ni se repitieron las 358 pantallas. Los cuatro archivos del alcance no difieren
de ese main en la copia local de revision usada por Codex.
Claude ya documento historial de redes, distincion manual/automatica, atribucion y limites
del agente de anuncios. Conservar esas funciones: esta orden no pide reconstruirlas.
La prueba visual fue interrumpida con Escape. No hubo acceso al panel, envio, cargo o
publicacion reales, ni compilacion o pruebas ejecutadas por Codex en esta tanda.

## RED-01 / P2: confirmacion de copia sin comprobar resultado

Evidencia: src/components/social-media/SocialPostCard.tsx:101-139, handlers
handleOneTouchPublish y handleCopyText. Ambos llaman navigator.clipboard.writeText sin
esperar su promesa ni manejar rechazo y muestran copiado/listo inmediatamente.
Impacto: si se deniega el portapapeles, el usuario recibe una confirmacion incorrecta.

Gemini: esperar confirmacion para afirmar copia; gestionar API ausente, rechazo y error.
En 1 Toque separar resultados: texto copiado, medio disponible y apertura de red. No
declarar publicacion realizada por abrir una app. Preservar activacion del usuario para
abrir ventanas; un await mal ubicado puede bloquearlas. No prometer descarga terminada
solo por pulsar un enlace, especialmente si el recurso esta en otro dominio.
Pruebas: copia resuelta/rechazada/no disponible y popup bloqueado; nunca exito anticipado
ni rechazo sin manejar. Recorrido movil/PC sin enviar publicaciones.

## RED-02 / P2: un video usa el renderizador de imagen

Evidencia: SocialPostCard.tsx:173-176 siempre renderiza NextImage para mediaUrl. El mismo
componente reconoce mediaType === 'video' en la descarga (linea 110), pero no en la vista.
Impacto: no permite revisar como video un archivo de video antes de publicarlo.

Gemini: respetar el tipo de medio con reproductor/miniatura adecuados. Preservar imagenes
y proporciones; no recortar material importante ni cargar todos los videos completos al
abrir el panel. En enlaces externos incompatibles, mostrar alternativa explicita y segura.
Pruebas: imagen, video real de prueba, medio ausente y recurso fallido; reproduccion visible
con controles accesibles, sin autoplay sonoro ni cambios bruscos de tamanio.

## ADS-01 / P1: compromiso presentado como real a partir de una estimacion

Evidencia encadenada:
- src/app/(app)/contabilidad/crm/marketing-ads/page.tsx:77-87 arma presupuestoDiarioUYU
  como Math.max(0, Math.round(c.spend / 30)) || 500 y fuerza activa: true.
- src/lib/marketing/tope-de-gasto-publicidad.ts:144-167 multiplica esos valores por dias
  restantes y calcula comprometido/disponible. Espera presupuestos activos en UYU.
- src/components/marketing/TopeDeGastoControl.tsx:95-116 presenta esos importes como
  compromiso de campanas activas y dinero disponible, sin marcar estimacion.

Defecto confirmado por lectura: el panel trata gasto historico como presupuesto diario
y un valor de respaldo como dato. Ejemplo ilustrativo: gasto cero implica 500 diarios
en esa expresion, aunque no demuestra ningun presupuesto ni campana activa.
NO se probo que estos valores hayan autorizado una operacion real o causado sobrecostos.

Gemini: usar estado y presupuesto configurado verificados, contemplando presupuesto a
nivel campana/conjunto, diario/total y moneda. No introducir conversion ficticia ni sumar
dos veces el mismo presupuesto. Si no se dispone de datos suficientes, mostrar compromiso
no verificado; no presentarlo como cero o saldo libre. Cualquier estimacion debe ser aparte,
con base/fecha y sin utilizarla como autorizacion de gasto. Rastrear los consumidores del
tope y proponer a Codex cualquier cambio necesario de politica, sin cambiarla unilateralmente.
Pruebas aisladas: campana pausada con gasto previo, activa sin gasto, datos faltantes,
moneda distinta, presupuesto compartido y errores de Meta. Ninguna llamada que gaste.

Correccion de texto asociada: TopeDeGastoControl.tsx dice "Margen libre para escalar o
crear campanas". elAgentePuedeHacerloSolo rechaza crear/encender. Ajustar el texto a la
politica existente; NO habilitar crear o encender para hacer coincidir la promesa.

## Entrega

Gemini trabaja sobre main actual en rama propia, comprueba que estos hallazgos siguen
vigentes y realiza las correcciones autorizadas en una sola PR de la tanda, abierta.
Mantener el alcance: no redisenio general del panel ni nuevas redes/suscripciones aqui.
Registrar pruebas focalizadas con fixtures, capturas/video y limites de comprobacion.
Entregar commit congelado a Claude Opus para compilar y registrar resultado/entorno.
Codex revisa diff y evidencia, en especial ADS-01; no repite toda la auditoria anterior.
Actualizar YA-RESUELTO.md y ESTADO-ACTUAL.md. No marcar resuelto hasta tener evidencia
del mismo commit. El acceso a cuentas reales y publicacion de prueba requieren autorizacion.

## Comprobacion automatica y evidencia

Los archivos de prueba de este bloque son propuestas a implementar, NO pruebas ya corridas.
Si existe cobertura equivalente, reutilizarla y cambiar la referencia. Verificar rechazo
del portapapeles, reproduccion de video y datos publicitarios faltantes/pausados, no solo
buscar nombres. No enviar publicaciones ni cambiar presupuestos reales para probar.
El control actual solo verifica existencia y menciones; Claude registra ejecucion y SHA.
Si Gemini extrae helpers para corregir, actualizar los simbolos con sus consumidores reales.

```comprobar
archivo: src/components/social-media/SocialPostCard.tsx
usa: handleCopyText en src/components/social-media/SocialPostCard.tsx
usa: handleOneTouchPublish en src/components/social-media/SocialPostCard.tsx
usa: SocialPostCard en src/app/(app)/empresa/redes-sociales/page.tsx
usa: TopeDeGastoControl en src/app/(app)/contabilidad/crm/marketing-ads/page.tsx
prueba: tests/e2e/47-redes-confirmaciones-y-videos.spec.ts
prueba: src/__tests__/47-publicidad-datos-verificados.test.ts
```
