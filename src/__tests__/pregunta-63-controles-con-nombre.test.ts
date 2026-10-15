import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

// Pregunta 63: un <label> que se ve junto a un control tiene que estar
// asociado de verdad (htmlFor/id, envolverlo, o aria-label en el control).
const ROOT = path.join(process.cwd(), 'src');
const CARPETAS = [
  'app/evento', 'app/invitado', 'app/invitacion', 'app/galeria-led', 'app/album',
  'app/pago', 'app/i', 'app/feedback', 'app/landing', 'app/bodas', 'app/cumpleanos',
  'components/kiosk', 'components/entertainment', 'components/evento', 'components/public',
  'components/simulator', 'components/social-wall', 'components/social-gallery',
  'components/landing', 'components/invitacion/templates', 'components/games',
];
const LABELS = new Set(['label', 'Label']);
const CONTROLES = new Set(['input', 'Input', 'select', 'SelectTrigger', 'textarea', 'Textarea']);

function tsx(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return tsx(p);
    return e.name.endsWith('.tsx') ? [p] : [];
  });
}

function tag(n: ts.Node): string | undefined {
  if (ts.isJsxElement(n)) return n.openingElement.tagName.getText();
  if (ts.isJsxSelfClosingElement(n)) return n.tagName.getText();
  return undefined;
}
function attrs(n: ts.Node): Set<string> {
  const o = ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : undefined;
  return new Set(
    (o?.attributes.properties ?? []).filter(ts.isJsxAttribute).map((a) => a.name.getText()),
  );
}
function sinNombre(n: ts.Node): boolean {
  const a = attrs(n);
  return !(a.has('aria-label') || a.has('aria-labelledby'));
}
function tieneControl(n: ts.Node, soloSinNombre = false): boolean {
  let hay = false;
  const v = (c: ts.Node) => {
    if (CONTROLES.has(tag(c) ?? '') && (!soloSinNombre || sinNombre(c))) hay = true;
    ts.forEachChild(c, v);
  };
  ts.forEachChild(n, v);
  return hay;
}

export function hallazgos(source: string, file = 'x.tsx'): string[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isJsxElement(n) && LABELS.has(tag(n) ?? '') && !attrs(n).has('htmlFor') && !tieneControl(n)) {
      const padre = n.parent;
      if (ts.isJsxElement(padre) || ts.isJsxFragment(padre)) {
        const suelto = padre.children
          .filter((c) => c !== n)
          .some((h) => {
            const t = tag(h);
            if (!t || LABELS.has(t)) return false;
            if (CONTROLES.has(t)) return sinNombre(h);
            return tieneControl(h, true);
          });
        if (suelto) {
          const { line } = sf.getLineAndCharacterOfPosition(n.getStart());
          out.push(`${file}:${line + 1}`);
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

describe('pregunta 63: los labels estan asociados a su control', () => {
  it('el detector marca un label suelto junto a un input sin id', () => {
    expect(hallazgos('const a = <div><label>Nombre</label><input /></div>;')).toHaveLength(1);
    expect(hallazgos('const a = <div><label htmlFor="x">N</label><input id="x" /></div>;')).toHaveLength(0);
    expect(hallazgos('const a = <div><label>N<input /></label></div>;')).toHaveLength(0);
  });

  it('ningun label de invitados, estaciones y formularios publicos queda sin asociar', () => {
    const malos = CARPETAS.flatMap((c) => tsx(path.join(ROOT, c))).flatMap((f) =>
      hallazgos(fs.readFileSync(f, 'utf8'), path.relative(process.cwd(), f)),
    );
    expect(malos).toEqual([]);
  });
});
