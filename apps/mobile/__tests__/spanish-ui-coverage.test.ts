import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { hasSpanishUiLiteral } from '../lib/i18n/uiLiteral';

const appRoot = path.resolve(__dirname, '..');
const roots = [path.join(appRoot, 'app'), path.join(appRoot, 'components')];
const visibleStringProps = new Set([
  'accessibilityLabel',
  'actionLabel',
  'buttonText',
  'body',
  'blurb',
  'description',
  'emptyBody',
  'emptyTitle',
  'label',
  'message',
  'hint',
  'placeholder',
  'subtitle',
  'title',
  'value',
]);
const allowedLiterals = new Set(['SpiceSync', 'X', 'QA', 'XXX']);

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolute);
    return /\.tsx?$/.test(entry.name) ? [absolute] : [];
  });
}

function isUserFacingLiteral(value: string): boolean {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return (
    /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalized) &&
    !allowedLiterals.has(normalized)
  );
}

function expressionLiterals(node: ts.Expression): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return [node.text];
  }
  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.flatMap((span) => [span.literal.text]),
    ];
  }
  if (ts.isConditionalExpression(node)) {
    return [
      ...expressionLiterals(node.whenTrue),
      ...expressionLiterals(node.whenFalse),
    ];
  }
  if (
    ts.isBinaryExpression(node) &&
    [
      ts.SyntaxKind.PlusToken,
      ts.SyntaxKind.QuestionQuestionToken,
      ts.SyntaxKind.BarBarToken,
      ts.SyntaxKind.AmpersandAmpersandToken,
    ].includes(node.operatorToken.kind)
  ) {
    return [
      ...expressionLiterals(node.left),
      ...expressionLiterals(node.right),
    ];
  }
  return [];
}

describe('Spanish UI coverage', () => {
  it('keeps visible screen copy behind the localization boundary', () => {
    const violations: string[] = [];
    const missingTranslations: string[] = [];

    for (const filename of roots.flatMap(sourceFiles)) {
      const source = fs.readFileSync(filename, 'utf8');
      const file = ts.createSourceFile(
        filename,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node) && isUserFacingLiteral(node.text)) {
          const position = file.getLineAndCharacterOfPosition(
            node.getStart(file)
          );
          violations.push(
            `${path.relative(appRoot, filename)}:${position.line + 1} ${node.text
              .replace(/\s+/g, ' ')
              .trim()}`
          );
        }

        if (
          ts.isJsxAttribute(node) &&
          visibleStringProps.has(node.name.getText(file)) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer) &&
          isUserFacingLiteral(node.initializer.text)
        ) {
          const position = file.getLineAndCharacterOfPosition(
            node.getStart(file)
          );
          violations.push(
            `${path.relative(appRoot, filename)}:${position.line + 1} ${node.name.getText(
              file
            )}="${node.initializer.text}"`
          );
        }

        if (
          ts.isJsxExpression(node) &&
          node.expression &&
          !ts.isCallExpression(node.expression) &&
          ((ts.isJsxElement(node.parent) &&
            /Text$/.test(node.parent.openingElement.tagName.getText(file))) ||
            (ts.isJsxAttribute(node.parent) &&
              visibleStringProps.has(node.parent.name.getText(file))))
        ) {
          for (const literal of expressionLiterals(node.expression)) {
            if (!isUserFacingLiteral(literal)) continue;
            const position = file.getLineAndCharacterOfPosition(
              node.getStart(file)
            );
            violations.push(
              `${path.relative(appRoot, filename)}:${position.line + 1} expression ${literal
                .replace(/\s+/g, ' ')
                .trim()}`
            );
          }
        }

        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'ui' &&
          node.arguments.length === 1 &&
          ts.isStringLiteral(node.arguments[0]) &&
          !hasSpanishUiLiteral(node.arguments[0].text)
        ) {
          const position = file.getLineAndCharacterOfPosition(
            node.getStart(file)
          );
          missingTranslations.push(
            `${path.relative(appRoot, filename)}:${position.line + 1} ${node.arguments[0].text
              .replace(/\s+/g, ' ')
              .trim()}`
          );
        }

        ts.forEachChild(node, visit);
      };

      visit(file);
    }

    expect(violations).toEqual([]);
    expect(missingTranslations).toEqual([]);
  });
});
