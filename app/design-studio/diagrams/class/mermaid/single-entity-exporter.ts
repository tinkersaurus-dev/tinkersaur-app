import type { Shape, ClassShapeData, EnumerationShapeData } from '~/core/entities/design-studio/types/Shape';
import { isClassShapeData, isEnumerationShapeData } from '~/core/entities/design-studio/types/Shape';

/**
 * Sanitize class name for mermaid (alphanumeric only, start with letter)
 */
function sanitizeClassName(name: string): string {
  // Remove special characters and spaces
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, '');

  // Ensure starts with a letter
  if (sanitized.length === 0 || /^[0-9]/.test(sanitized)) {
    sanitized = 'Class' + sanitized;
  }

  return sanitized;
}

/**
 * Generate mermaid syntax for a single class shape
 * Returns standalone class definition without relationships
 */
export function generateClassMermaid(shape: Shape): string {
  const lines: string[] = ['classDiagram', ''];
  const className = sanitizeClassName(shape.label || 'Class');

  if (shape.data && isClassShapeData(shape.data)) {
    const classData = shape.data as ClassShapeData;

    lines.push(`class ${className} {`);

    // Add stereotype if present
    if (classData.stereotype) {
      lines.push(`  <<${classData.stereotype}>>`);
    }

    // Add attributes
    if (classData.attributes && classData.attributes.length > 0) {
      for (const attribute of classData.attributes) {
        lines.push(`  ${attribute.trim()}`);
      }
    }

    // Add methods
    if (classData.methods && classData.methods.length > 0) {
      for (const method of classData.methods) {
        lines.push(`  ${method.trim()}`);
      }
    }

    lines.push('}');
  } else {
    // Simple class without data
    lines.push(`class ${className}`);
  }

  return lines.join('\n');
}

/**
 * Generate mermaid syntax for a single enumeration shape
 * Returns standalone enumeration definition without relationships
 */
export function generateEnumerationMermaid(shape: Shape): string {
  const lines: string[] = ['classDiagram', ''];
  const enumName = sanitizeClassName(shape.label || 'Enumeration');

  lines.push(`class ${enumName} {`);
  lines.push('  <<enumeration>>');

  if (shape.data && isEnumerationShapeData(shape.data)) {
    const enumData = shape.data as EnumerationShapeData;

    // Add literals
    if (enumData.literals && enumData.literals.length > 0) {
      for (const literal of enumData.literals) {
        lines.push(`  ${literal.trim()}`);
      }
    }
  }

  lines.push('}');

  return lines.join('\n');
}
