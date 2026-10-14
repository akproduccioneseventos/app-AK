## Descripción del Cambio

Delta125 desde main4b6d6620; conserva tandas1298/1299/1300 de Claude.
Claude fusiona, Codex NO. NO CONTRASTADO CON LA TANDA PRIVADA DE CLAUDE.

- Corrige configuracion compartida de11equipos: nombres accesibles de fiesta y
  totem, rol elegido anunciado, h1 y alerta. Mantiene apariencia, roles y SIN PIN.
- Texto del totem antes invisible pese a inputValue correcto: contraste real
  1.0013 sobre fondo oscuro. Despues18.414 yplaceholder7.868, comprobados en
  PC/Pixel7. No cambia tema global ni controles de otras pantallas.
- InstalacionPWA: captura fallos, evita doble prompt, conserva nuevos intentos y
  no afirma instalada hasta appinstalled. Cuatro fallos antes, siete focales PASS.
- Selector6.1.4 compatible quita un aviso. CLI15/UUID11/FTP6 YA son de mainClaude.
  RE21.27 rechazado por incompatibilidad Node20; se conserva1.24 vulnerable.
  Java21 solo portable QA con SHA256; no modifica Java global ni dependencias prod.
- Reconcilia95seguimientos:32redirects+7wrappers comprobados en navegador,
  3reexports/11kioscos entradas,94GET y1import excluido. No equivale a95modulos.
- Actualiza registro y orden163 existente. Npm42:11avisos unicos,0critical;
  quedan87entradas agregadas (15high/72moderate). Un aviso menos que main1300.
  NO seguridad completa ni prueba de todas las cadenas transitivas por guardias estaticas.

## Tipo de Cambio
- [x] Corrección de errores (bug fix)
- [ ] Nueva funcionalidad (feature)
- [ ] Refactorización / Optimización
- [x] Actualización de documentación / Configuración

## Lista de Verificación (Checklist) antes de solicitar revisión
- [x] TypeScript y lint de build125 finalb520: salida0; avisos existentes conservados.
- [x] Jest ampliob520:759suites4765tests,0fallos/omitidos.
- [x] Focales de los dos componentes b520:9tests PASS.
- [x] Focales543:4suites17tests; cuatro smokes CLI/RE2/tar/selector.
- Los smokes finales son de42 con package/lock identicos a b520; RE21.24
  funciona en Node24, pero NO esta parcheado. Candidato1.27 fue rechazado.
- [x] CLI15/Java21:3suites29tests Firestore/Storage, salida0 y apagado.
- [x] Grafo125 actualizado local15117/44629/1008,0LLM; no nueva grafica HTML por limite5000.
- [x] Navegador125 PC/Pixel7 sobre buildb520:6casos PASS,22selecciones de roles,
  guardia sin ID, nombres, contraste real y pagina PWA sin falsa instalacion.
- [ ] Hosting/OAuth/modelo externo/voz/hardware/datos originales: NO certificados.

## Impacto en Firebase
- [ ] Afecta reglas de Firestore / Seguridad.
- [ ] Modifica Cloud Functions (requiere despliegue de funciones).
- [x] Modifica Hosting / Frontend.
- [ ] Requiere variables de entorno adicionales para produccion.
- Herramienta de desarrollo Firebase CLI15 exige Java21 para emuladores.
  CI ya declara21; local usar AK_QA_JAVA_HOME para launcher125 o JAVA_HOME21
  en otros comandos. No despliega ni cambia cuentas/configuracion remota.

## Evidencia y Limites
Fuente finalb520f7cee28546634e1c87391efd7a80e1a40f48.
Dependencias42 reutilizadas solo verificando blobs package/lock iguales.
Recorridos de entrada anteriores sobre742 se conservan como historicos.
Sondas propias fallidas/interrumpidas conservadas, no ajustadas para esconderlas.
Datos ficticios aislados; se preservan archivos locales ajenos.
No promete toda la aplicacion lista ni cero errores.
