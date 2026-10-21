/**
 * 21/10/2026: la puerta dio verde y no anotó el commit, porque el filtro de la subida había dejado
 * escrito un aviso de prueba (`data/notifications.json`). Sin anotar, no se puede fusionar y hay que
 * correrla de nuevo. Los datos de la corrida no cuentan como "sucio": lo mismo que para la huella.
 */
import fs from 'fs';
import path from 'path';

it('"sucio al empezar" excluye lo que escribe la corrida', () => {
  const codigo = fs.readFileSync(path.join(process.cwd(), 'scripts/se-puede-publicar.mjs'), 'utf8');
  const linea = codigo.slice(codigo.indexOf('const sucioAlEmpezar'), codigo.indexOf('const hayTrabajoSinCommitear'));
  expect(linea).toMatch(/NO_ES_CODIGO_PARA_LA_HUELLA/);
  const lista = codigo.slice(codigo.indexOf('const NO_ES_CODIGO_PARA_LA_HUELLA'), codigo.indexOf('];', codigo.indexOf('const NO_ES_CODIGO_PARA_LA_HUELLA')));
  expect(lista).toContain(":(exclude)data'");
  expect(lista).toContain(":(exclude)src/data'");
});
