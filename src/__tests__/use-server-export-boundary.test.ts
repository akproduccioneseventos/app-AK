import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

const SRC_DIR = path.join(process.cwd(), 'src');

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return Boolean(ts.getModifiers(node as ts.HasModifiers)?.some(modifier => modifier.kind === kind));
}

function isAsyncFunctionExpression(expression: ts.Expression): boolean {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }

  return (
    (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
    hasModifier(current, ts.SyntaxKind.AsyncKeyword)
  );
}

function exportedRuntimeViolation(statement: ts.Statement): string[] {
  if (ts.isExportDeclaration(statement)) {
    const onlyExportsTypes =
      statement.isTypeOnly ||
      (statement.exportClause &&
        ts.isNamedExports(statement.exportClause) &&
        statement.exportClause.elements.every(element => element.isTypeOnly));
    return onlyExportsTypes ? [] : ['re-exportacion de runtime'];
  }

  if (ts.isExportAssignment(statement)) {
    return isAsyncFunctionExpression(statement.expression)
      ? []
      : ['exportacion predeterminada de runtime'];
  }

  if (!hasModifier(statement, ts.SyntaxKind.ExportKeyword)) return [];
  if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) return [];

  if (ts.isFunctionDeclaration(statement)) {
    return hasModifier(statement, ts.SyntaxKind.AsyncKeyword)
      ? []
      : [statement.name?.text ?? 'funcion sin nombre'];
  }

  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap(declaration => {
      const name = declaration.name.getText();
      return declaration.initializer && isAsyncFunctionExpression(declaration.initializer)
        ? []
        : [name];
    });
  }

  if (ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) {
    return [statement.name?.text ?? 'declaracion sin nombre'];
  }

  return [];
}

describe('limite de modulos use server', () => {
  it('solo exporta funciones asincronas o tipos', () => {
    const violations = collectSourceFiles(SRC_DIR).flatMap(filePath => {
      const sourceText = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      const firstStatement = sourceFile.statements[0];
      const isUseServerModule =
        firstStatement &&
        ts.isExpressionStatement(firstStatement) &&
        ts.isStringLiteral(firstStatement.expression) &&
        firstStatement.expression.text === 'use server';

      if (!isUseServerModule) return [];

      return sourceFile.statements.flatMap(statement =>
        exportedRuntimeViolation(statement).map(name =>
          `${path.relative(process.cwd(), filePath)}: ${name}`
        )
      );
    });

    expect(violations).toEqual([]);
  });
});
