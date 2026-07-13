import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const INTERACTIVE_WRAPPERS = new Set(['NewPostDialog', 'ShareLinkDialog']);

function findTsxFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTsxFiles(entryPath);
    return entry.name.endsWith('.tsx') ? [entryPath] : [];
  });
}

function getTagName(node: ts.JsxTagNameExpression) {
  return node.getText();
}

function getAttributes(node: ts.JsxOpeningLikeElement) {
  return new Map(
    node.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => [attribute.name.getText(), attribute]),
  );
}

function getLiteralAttribute(attributes: Map<string, ts.JsxAttribute>, name: string) {
  const initializer = attributes.get(name)?.initializer;
  return initializer && ts.isStringLiteral(initializer) ? initializer.text : undefined;
}

function isWrappedByAction(node: ts.Node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (!ts.isJsxElement(parent)) continue;
    const tagName = getTagName(parent.openingElement.tagName);
    const attributes = getAttributes(parent.openingElement);
    if (
      tagName === 'form' ||
      tagName === 'Link' ||
      tagName === 'a' ||
      INTERACTIVE_WRAPPERS.has(tagName) ||
      attributes.has('asChild') ||
      [...attributes.keys()].some((attribute) => /^on[A-Z]/.test(attribute)) ||
      /(Trigger|Close|Cancel|Action)$/.test(tagName)
    ) {
      return true;
    }
  }
  return false;
}

function containsLink(node: ts.Node) {
  let found = false;
  const visit = (child: ts.Node) => {
    if (
      child !== node &&
      (ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) &&
      ['Link', 'a'].includes(getTagName(child.tagName))
    ) {
      found = true;
      return;
    }
    if (!found) ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

describe('interactive control boundary', () => {
  it('does not expose enabled buttons without an action', () => {
    const offenders: string[] = [];
    const sourceRoot = path.join(process.cwd(), 'src');

    for (const filePath of findTsxFiles(sourceRoot)) {
      if (filePath.endsWith(path.join('components', 'ui', 'button.tsx'))) continue;
      const sourceText = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

      const visit = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tagName = getTagName(node.tagName);
          if (tagName === 'Button' || tagName === 'button') {
            const attributes = getAttributes(node);
            const attributeNames = [...attributes.keys()];
            const type = getLiteralAttribute(attributes, 'type');
            const className = getLiteralAttribute(attributes, 'className') ?? '';
            const hasSpread = node.attributes.properties.some(ts.isJsxSpreadAttribute);
            const isPermanentlyDisabled = attributes.has('disabled') && !attributes.get('disabled')?.initializer;
            const hasAction =
              hasSpread ||
              attributeNames.some((attribute) => /^on[A-Z]/.test(attribute)) ||
              ['formAction', 'asChild', 'href'].some((attribute) => attributes.has(attribute)) ||
              type === 'submit' ||
              type === 'reset' ||
              isPermanentlyDisabled ||
              className.includes('pointer-events-none') ||
              isWrappedByAction(node) ||
              containsLink(node);

            if (!hasAction) {
              const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
              offenders.push(`${path.relative(process.cwd(), filePath)}:${position.line + 1}`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    expect(offenders).toEqual([]);
  });
});
