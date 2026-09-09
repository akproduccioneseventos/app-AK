# Orden 53: desbloquear ingreso, sin parches a ciegas

> ACTUALIZACION 2026-09-09: evidencia historica de main8c5, NO una orden
> para reprogramar todo. Contrastar cada caso con el HEAD de la tanda abierta
> antes de editar y verificar alli rutas/simbolos/consumidores.
> PR #1204 observada en a0050d40181dbaf8f0e54ffa3f2d8ce191b7185d;
> no se certifico toda esa PR. Prevalece el reparto corregido de AGENTS.md:
> Claude: dinero, cobros, contabilidad, comida y permisos; Gemini: resto.

2026-09-09. P1, BLOQUEO OBSERVADO; causa sin determinar; NO solucionado.
Codex diagnostica, Gemini programa, Claude compila. Incluir junto a la tanda abierta,
no crear otra PR solo documental ni fusionar automaticamente.
Base revisada main 8c5eb6e173e7b7b8dce6a8811cade7cf38411dfe.

## Evidencia de este intento

1. Navegador integrado Codex abre /fiestas/nueva/decoracion y redirige a
   /login?redirect=%2Ffiestas%2Fnueva%2Fdecoracion.
2. Pagina muestra Error al cargar y Ocurrio un problema al cargar la pagina de login.
   No se introdujo correo ni contrasena: esto no demuestra credenciales incorrectas.
3. Reintentar, recuperar la pestana y recargar agotaron tiempos de la herramienta de
   navegador. Tambien fallo adjuntar una nueva vista del navegador para /login directo.
   Eso impide obtener consola/stack; no atribuir todos esos timeouts a Firebase.
4. Peticion HTTP independiente a https://akproducciones.uy/login, limite 25 segundos:
   status 200, 33349 bytes, sin texto Error al cargar ni digest en esa respuesta.
   HTML correcto NO demuestra hidratacion ni autenticacion correctas.
5. Se pregunto al dueno si /login tambien falla en Chrome fuera de Codex. Pendiente
   su respuesta. No borrar cookies, claves ni almacenamiento del usuario por suposicion.

## Investigacion y correccion para Gemini

- Capturar error/stack y recurso fallido en navegador externo y version publicada;
  registrar fecha, navegador, ruta, SHA desplegado y digest sanitizado. No recopilar
  claves, cookies, tokens ni datos del cliente.
- src/app/login/error.tsx recibe error pero no lo usa para diagnostico. Agregar
  identificador seguro y telemetria existente si corresponde; el cliente debe tener
  un reintento acotado. No revelar stack interno ni secretos publicamente.
- Comparar login directo y redireccion desde decoracion/eventos, carga inicial y
  navegacion, perfil normal y limpio sin borrar el normal. Si el navegador integrado
  es el unico afectado, diagnosticar compatibilidad; no alterar autenticacion del
  servidor para disimular una falla de la herramienta.
- Reutilizar orden 44 y sus pruebas existentes. El historial menciona React #310,
  pero este intento NO obtuvo ese error: no afirmar misma causa, ni aplicar parches
  ReactCurrentBatchConfig o cambiar versiones sin evidencia.
- Identificar la causa antes de editar: carga de chunk, render/hidratacion, llamada
  servidor o inicializacion. Si falla un dato opcional (logo/ajustes), el formulario
  debe seguir utilizable; no ignorar errores de sesion ni fabricar confirmacion.
- No resetear contrasena, ampliar usuarios, deshabilitar permisos, exigir tarjeta
  ni aumentar instancias/costos para resolverlo sin autorizacion del dueno.

## Aceptacion

En el MISMO SHA desplegado: formulario visible directo y redirigido, intento invalido
controlado, ingreso autorizado y llegada a decoracion; cerrar sesion y no quedar con
acceso; recuperacion de clave separada, solo probar envio con autorizacion. Probar
Chrome y navegador integrado; distinguir incompatibilidad de herramienta si persiste.
Claude registra compilacion. Codex contrasta evidencia. No cerrar por HTTP200 o build.

Prueba siguiente PROPUESTA/PENDIENTE, no creada ni ejecutada. El bloque es inventario.

```comprobar
archivo: src/app/login/error.tsx
usa: Button en src/app/login/error.tsx
prueba: tests/e2e/login-directo-y-redireccion-decoracion.spec.ts
```
