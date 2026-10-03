# Acá quedé

**3 de octubre de 2026.** Rama `claude/ponte-al-dia-qtrho3`, sin fusionar todavía: cobros COB06 a
COB09 (segunda vuelta de Codex), la lista de invitados que pide sesión (PER01), el contador de
Codex en Windows (AUD02), y los informes 64 y 65 de Codex juntados. La puerta corre con **todas**
las pruebas de navegador y deja el resultado prueba por prueba (`AK_REGISTRO_POR_PRUEBA`), que es
lo que pidió Codex en la orden 114.

## Espera a Gemini — UNA sola propuesta, la misma 1251

- **115:** el video resumen dura lo que tarda el teléfono (la muestra dio 141 s): el bucle tiene
  que ir con el reloj, y la prueba medir el archivo.
- **112, B.1 (AUD01):** el contador de Codex tiene que cubrir las 416 rutas y enterarse de los
  cambios en lo compartido. Está masticado en la orden.
- **109:** barrido de formatos que pierden lo escrito.

## Espera al dueño

- La voz real del asistente se paga por uso (clave de Gemini o de Google). Falta su sí.

## Codex

- Cobros: COB01-05 confirmados; COB06-09 arreglados, falta que la vuelva a mirar.
- Orden 114: pide un servidor compilado que alcance desde su máquina. Desde la nube no se puede
  abrir uno; se le deja el resultado de la corrida completa en `docs/evidencias/`.

## Cómo se fusiona (error 30)

- La puerta anota el commit aprobado en `.ak-puerta-verde.json`; sin `expectedHeadSha` igual, no.
- Con la puerta corriendo: no cambiar de rama ni `commit -a` (error 31).
- Una prueba que falla con la máquina cargada se repite sola con `npm run otravez`.
