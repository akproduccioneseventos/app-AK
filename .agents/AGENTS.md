# Reglas de Trabajo de Antigravity para AK Producciones

Estas reglas definen cómo deben actuar los asistentes de IA en este proyecto para garantizar la máxima agilidad y automatización real sin interrupciones.

## 🚀 Flujo de Trabajo Directo e Imperativo
1. **Diseñar el Plan**: Crear o actualizar un plan claro y conciso en `implementation_plan.md` que resuelva el problema completo directamente.
2. **Hacerlo (Ejecución Directa)**: Una vez aprobado el plan, proceder a la ejecución inmediata de todos los cambios de código necesarios sin fases intermedias ni esperas adicionales.
3. **PR y Desplegar**: Crear la Pull Request (PR) correspondiente y dejar todo listo para el despliegue automático en Firebase.

## 🔒 Minimizar Solicitudes de Aprobación de Acceso (Sandbox de Windows)
Para evitar interrumpir al usuario con constantes popups de aprobación de comandos en Windows:
- **Agrupar Tareas en Scripts**: En lugar de ejecutar múltiples comandos de terminal individuales (como `git checkout`, `git add`, `git commit`, `git push`), escribe un script temporal de automatización en Node.js (JavaScript) o PowerShell dentro del directorio `scratch` y ejecútalo en un solo paso.
- **Evitar Preguntas Triviales**: No bloquees el flujo preguntando por accesos obvios para leer o escribir archivos que pertenecen al plan ya aprobado. Procede con determinación y de manera autónoma.
- **Mantenerse en Español**: Toda la comunicación, explicaciones de PRs y descripciones de código deben ser escritas en español de forma directa y clara.
