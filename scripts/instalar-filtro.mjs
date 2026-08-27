#!/usr/bin/env node
/**
 * Instala el filtro obligatorio: nadie puede subir código roto.
 *
 * **Pedido del dueño el 27 de agosto de 2026:** *"para futuras propuestas, cualquier cosa que
 * se cree pasa por un filtro obligatorio que asegura que todo funcione sin errores."*
 *
 * **Por qué un gancho de git y no un control en GitHub:** un control en GitHub avisa
 * *después* de que el código ya subió, y en este proyecto además no está disponible. Esto
 * frena **antes**: el código roto no llega ni a salir de la máquina.
 *
 * Se instala solo con `npm install` (va enganchado en `prepare`), así que nadie tiene que
 * acordarse. Y no agrega ninguna dependencia: es un archivo de texto en la carpeta de git.
 */
import fs from 'node:fs';
import path from 'node:path';

const GANCHO = path.join(process.cwd(), '.git', 'hooks', 'pre-push');

if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
  process.exit(0); // no es un repositorio: nada que instalar, y no es un error
}

const CONTENIDO = `#!/bin/sh
# EL FILTRO OBLIGATORIO. Lo instala scripts/instalar-filtro.mjs — no lo edites a mano.
#
# Corre acentos, tipos y pruebas antes de dejar subir. Si algo falla, la subida no sale.
# La compilacion y las pruebas de navegador NO van aca a proposito: tardan mas de quince
# minutos y un filtro lento se saltea. Esas van en la puerta completa, antes de fusionar.

echo ""
echo "FILTRO OBLIGATORIO — revisando antes de subir"

node scripts/se-puede-publicar.mjs --filtro
RESULTADO=$?

if [ $RESULTADO -ne 0 ]; then
  echo ""
  echo "  LA SUBIDA SE FRENO. El codigo roto no sale de esta maquina."
  echo ""
  echo "  Arregla lo que dice arriba y volve a subir."
  echo "  Si es una emergencia de verdad: git push --no-verify (queda registrado que se saltio)."
  echo ""
  exit 1
fi

exit 0
`;

fs.mkdirSync(path.dirname(GANCHO), { recursive: true });
fs.writeFileSync(GANCHO, CONTENIDO, { mode: 0o755 });
console.log('Filtro obligatorio instalado: nada roto puede subirse.');
