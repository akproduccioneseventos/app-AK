# Acá quedé

Hoja de traspaso entre chats. **Corta a propósito**: se lee entera al abrir cada
sesión. Lo histórico va a `ESTADO-AUDITORIA.md`.

Quien cierre una sesión reescribe este archivo. Se pisa, no se acumula.

---

**Última actualización:** 20 de agosto de 2026.
**Estado de la app:** sana. Acentos limpios (0 rotos), tipos en 0 errores, pruebas unitarias 100% en verde, build de producción Next.js OK.
**Orden completada:** `docs/ordenes/hechas/4-la-auditoria-que-corre-sola.md`.
**Siguiente orden en la fila:** Consultar próximas órdenes en `docs/ordenes/` (`ahora.md` / `propuesta-de-mejoras.md`).

## Lo que se cerró en esta entrega (Orden 4: La auditoría que corre sola)

- **Comando `npm run auditoria`:**
  - Corre las 4 pasadas de conteo mecánico exacto sin IA en pocos segundos.
  - Escribe el informe completo con fecha en `auditoria-out/informe.md`.
  - Cada hallazgo lleva archivo y línea exacta.
  - Termina con el resumen de 4 números.
  - No falla la compilación ni frena nada.

### Resumen de la última corrida de `npm run auditoria`:
- **1. Tareas automáticas sin rastro:** 4 hallazgos
- **2. Elementos huérfanos o solo en tests:** 201 hallazgos
- **3. Datos simulados o inventados en UI:** 1 hallazgo
- **4. Promesas automáticas en pantalla:** 120 frases a contrastar

## Lo que depende del dueño

1. **Prender los 4 despertadores externos**, siguiendo `docs/PRENDER-LAS-TAREAS.md`.
2. **Pedir una reseña por fiesta**, a todos los clientes por igual.
