import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const WRITE_CALL = /\b(writeData|deleteData|updateData|saveData|setDoc|addDoc|updateDoc|deleteDoc|createFirestore\w*|updateFirestore\w*|deleteFirestore\w*|writeFile|unlink|rename)\s*\(/;
const AUTHORIZATION = /\b(requireAppSession|hasAppSession|requireSession|verifySession|requireAdmin|assertAuthenticated|requireRole|verifyBudgetToken|verifyEntertainment\w*|verifyPortal\w*|requireFiestaWriteAccess|getProveedorByToken|WHATSAPP_WEBHOOK_INTERNAL_TOKEN|enforcePublicRateLimit)\s*\(?/;

function findTypeScriptFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findTypeScriptFiles(entryPath);
    return entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

describe('server action write boundaries', () => {
  it('classifies every exported action that writes data', () => {
    const root = path.join(process.cwd(), 'src', 'app', 'actions');
    const unclassified: string[] = [];

    for (const file of findTypeScriptFiles(root)) {
      const sourceText = fs.readFileSync(file, 'utf8');
      if (!sourceText.includes('use server')) continue;
      const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);

      for (const statement of source.statements) {
        if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
        const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
        if (!isExported) continue;
        const functionSource = statement.getText(source);
        if (WRITE_CALL.test(functionSource) && !AUTHORIZATION.test(functionSource)) {
          unclassified.push(`${path.relative(process.cwd(), file)}:${statement.name.text}`);
        }
      }
    }

    expect(unclassified).toEqual([]);
  });
});
