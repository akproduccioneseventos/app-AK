# Orden253 - Devolucion PR1371: foto utilizable, errores y cupo real

27/10/2026. Gemini programa; Claude dinero/permisos/validacion/compilacion/fusion.
Codex SOLO audita/prueba/documenta, nunca fusiona. Completar entrega actual
gemini/orden-250-asi-va-a-quedar, no reimplementar250 ni abrir una PR porcausa.
Fuente76855a1d4496b54b323edf83919212f32e2c6109, base0abe9199.
NO CONTRASTADO CON CAMBIOS PRIVADOS NO PUBLICADOS. Verificar HEAD antes de tocar.
Informe753/evidencias750-752:12originalesPASS;12sondas6PASS6FAIL=CUATROcausas.

## Gemini: salida real y experiencia visible
1. R1/P1 AK-CODEX-751-FOTO-BASE64-NO-ES-URL.
   generateGeminiImage REAL devuelve base64; accion lo guarda/devuelve comoimageUrl;
   UI/descarga lo usan comoURL y WhatsApp envia bytes como texto. Comentario de PR
   ya existe: incorporar reproduccion, no hacer otra solucion en paralelo.
   Normalizar salida de ESTA funcion (no romper contrato global del helper):
   MIME validado y src/archivo utilizable, persistencia con formato establecido.
   Descargar archivo REAL. WhatsApp debe recibir URL accesible autorizada o
   archivo via mecanismo compatible; dataURI/bloblocal en texto NO sirve como
   enlace para otra persona. Claude valida privacidad/permisos de almacenamiento.
   No decir compartido por abrir WhatsApp. Probar con respuesta realinlineData,
   NO reemplazar generador/ServerAction por '/media/foto.jpg' en toda la prueba.

2. R2/P2 AK-CODEX-752-ERROR-DEL-PORTAL-INVISIBLE.
   Componente descarta success:false y catch solo consola.
   Mostrar error devuelto (tope mensual/sesion/fallo de guardado) y excepcion
   comprensible/reintento. No declarar que no genero/cobro si ACK es incierto.
   Comentario previo confirmado:750originales no lo cubren.

3. R3/P2 AK-CODEX-752-GENERA-SIN-CAPTURA-LISTA.
   Boton llama API con captura undefined si escena aun carga. Bloquear ESTE
   flujo nuevo hasta captura valida; explicar fallo de captura sin gastar.
   Preservar parametro opcional de uso legado y regla de invalidas de250.
   No exigir comportamiento nuevo a todos los generadores sin decision deldueno.
   Probar captura lista, escena retrasada y captura que devuelve vacio.
   Revisar si boton anterior+boton3D quedan duplicados realmente; no ocultar
   elementos por gusto ni declarar fallo solo por ver dos handlers.

## Claude: limite financiero antes de trabajar el proveedor
4. R4/P1 AK-CODEX-751-CUPO-SALON-DOS-INSTANCIAS.
   Dos instancias del modulo con2fotos existentes generan2 y ambas success,
   consumos2,persistidas3:4generaciones acumuladas por cupo3.
   Mutex local ya existia, no reencargarlo ni afirmar que esta variante se
   arregla con otro test usando MISMA instancia.
   Reservar cupo atomico previo a proveedor con identidad estable de intento,
   conservar ante ACKincierto y permitir nuevas generaciones deliberadas
   dentro del tope. Politica/liberacion ante fallos explicitada sin escondergasto.
   No deduplicar por telefono/nombre/fecha ni borrar fotos para liberar cupo.
   Probar dos instancias y transaccion/SDKaislado con intercalado verificable;
   si solo hay doble local, declararlo. No proveedor/cargos/cuentas reales.

## Registro y prueba conjunta
Incluir YA-RESUELTO/ESTADO en MISMA entrega: hoy faltan entre9archivos.
Conservar12originalesPASS. Promover751/752 a regresiones sin debilitar aserciones.
Test de E2Eactual es presentacion con ServerAction sustituida, no flujo completo:
agregar caso que use la accion real y doble del PROTOCOLO Gemini, verificar
persistencia, reload y src/archivo decodificable; no llamada externa real.
UI390px/PC: estado carga, error, imagen legible, descarga y compartir realistas.
MismoSHA antes/despues; una validacion conjunta final porClaude, no repetir build
por documentos. No0errores/todaapp. Orden252/1370 sin cambio, no reauditar.
Pruebas nuevas propuestas abajo PENDIENTES hasta existir/ejecutarse.
No fusionar documentacion sola; Codex no afirma que otraIA ya empezo.

```comprobar
archivo: src/app/actions/fiesta/decoracion.actions.ts
usa: generarFotoDelSalonDesdeElPortal en src/components/salon-3d/Salon3DClienteView.tsx
usa: generarVisualizacionSalonAi en src/app/(app)/fiestas/nueva/decoracion/page.tsx
archivo: src/components/salon-3d/Salon3DClienteView.tsx
usa: Salon3DClienteView en src/app/portal/[fiestaId]/decoracion/page.tsx
archivo: src/lib/ai/gemini-image.ts
usa: generateGeminiImage en src/app/actions/fiesta/decoracion.actions.ts
prueba: src/__tests__/asi-va-a-quedar-tu-fiesta.test.ts
prueba: src/__tests__/decoracion-no-gasta-de-mas.test.ts
prueba: src/__tests__/salon-ia-cupo-entre-instancias.test.ts
prueba: src/__tests__/salon-cliente-foto-real-y-errores.test.tsx
prueba: tests/e2e/asi-va-a-quedar-tu-fiesta.spec.ts
```

