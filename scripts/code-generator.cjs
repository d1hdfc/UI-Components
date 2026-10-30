'use strict';

const fs = require('node:fs');
const path = require('node:path');

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const INDEX_FILE = path.join(COMPONENTS_DIR, 'index.ts');

/**
 * Helpers for naming conventions
 */
function toPascalCase(str) {
  if (!str) return 'Component';
  const clean = str.replace(/^[@_]+/, '').replace(/[^a-zA-Z0-9\s_-]/g, ' ');
  return clean
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function toKebabCase(str) {
  if (!str) return 'component';
  return str
    .replace(/^[@_]+/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toSnakeCase(str) {
  return toKebabCase(str).replace(/-/g, '_');
}

function parseVariantsAndProps(node) {
  const variants = new Set(['primary', 'secondary', 'tertiary', 'outlined']);
  const sizes = new Set(['small', 'medium', 'large']);
  let defaultLabel = 'Component';

  if (node.componentPropertyDefinitions) {
    for (const [key, prop] of Object.entries(node.componentPropertyDefinitions)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('variant') || lowerKey.includes('style') || lowerKey.includes('type')) {
        if (prop.variantOptions) {
          prop.variantOptions.forEach(opt => variants.add(toKebabCase(opt)));
        }
      }
      if (lowerKey.includes('size')) {
        if (prop.variantOptions) {
          prop.variantOptions.forEach(opt => sizes.add(toKebabCase(opt)));
        }
      }
      if (lowerKey.includes('label') && prop.defaultValue) {
        defaultLabel = String(prop.defaultValue);
      }
    }
  }

  // Scan children if it's a COMPONENT_SET
  if (Array.isArray(node.children)) {
    for (const child of node.children.slice(0, 50)) {
      if (child.name && child.name.includes('=')) {
        const parts = child.name.split(',').map(s => s.trim());
        for (const part of parts) {
          const [k, v] = part.split('=').map(s => s.trim().toLowerCase());
          if ((k === 'style' || k === 'variant' || k === 'type') && v) {
            variants.add(toKebabCase(v));
          }
          if (k === 'size' && v) {
            sizes.add(toKebabCase(v));
          }
        }
      }
    }
  }

  const sample = (node.children && node.children[0]) || node;
  const paddingLeft = sample.paddingLeft ?? 16;
  const paddingRight = sample.paddingRight ?? 16;
  const paddingTop = sample.paddingTop ?? 10;
  const paddingBottom = sample.paddingBottom ?? 10;
  const cornerRadius = sample.cornerRadius ?? 8;
  const layoutMode = sample.layoutMode === 'VERTICAL' ? 'column' : 'row';

  return {
    variants: Array.from(variants),
    sizes: Array.from(sizes),
    defaultLabel,
    padding: {
      left: paddingLeft,
      right: paddingRight,
      top: paddingTop,
      bottom: paddingBottom
    },
    cornerRadius,
    layoutMode
  };
}

/**
 * Generate React Types (<Name>.types.ts)
 */
function generateReactTypes(pascalName, kebabName, meta) {
  const variantType = meta.variants.map(v => `'${v}'`).join(' | ') || "'primary' | 'secondary'";
  const sizeType = meta.sizes.map(s => `'${s}'`).join(' | ') || "'small' | 'medium' | 'large'";

  return `import type React from 'react';

export type ${pascalName}Variant = ${variantType};
export type ${pascalName}Size = ${sizeType};

export interface ${pascalName}Props extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: ${pascalName}Variant;
  size?: ${pascalName}Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}
`;
}

/**
 * Generate React Component (<Name>.tsx)
 */
function generateReactComponent(pascalName, kebabName, meta) {
  const isButton = kebabName.includes('button') || pascalName.toLowerCase().includes('button');
  const defaultVariant = meta.variants[0] || 'primary';
  const defaultSize = meta.sizes.includes('medium') ? 'medium' : meta.sizes[0] || 'medium';

  return `import React from 'react';
import type { ${pascalName}Props } from './${pascalName}.types';
import './${pascalName}.scss';

const cx = (...parts: Array<string | false | undefined>) => parts.filter(Boolean).join(' ');

export const ${pascalName}: React.FC<${pascalName}Props> = ({
  children = '${meta.defaultLabel || pascalName}',
  size = '${defaultSize}',
  variant = '${defaultVariant}',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const combinedClasses = cx(
    'ui-${kebabName}',
    \`ui-${kebabName}--\${size}\`,
    \`ui-${kebabName}--\${variant}\`,
    fullWidth && 'ui-${kebabName}--full-width',
    isDisabled && 'ui-${kebabName}--disabled',
    loading && 'ui-${kebabName}--loading',
    className
  );

  return (
    <${isButton ? 'button' : 'div'}
      {...rest}
      className={combinedClasses}
      ${isButton ? 'disabled={isDisabled}' : 'aria-disabled={isDisabled || undefined}'}
      aria-busy={loading || undefined}
    >
      {loading && <span className="ui-${kebabName}__spinner" aria-hidden="true" />}
      <span className="ui-${kebabName}__content">{children}</span>
    </${isButton ? 'button' : 'div'}>
  );
};

export default ${pascalName};
`;
}

/**
 * Generate SCSS (<Name>.scss)
 */
function generateScss(pascalName, kebabName, meta) {
  const { padding, cornerRadius, layoutMode } = meta;

  return `@use 'sass:color';

.ui-${kebabName} {
  display: inline-flex;
  flex-direction: ${layoutMode};
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: ${cornerRadius}px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  outline: none;

  &__content {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: ui-${kebabName}-spin 0.75s linear infinite;
  }

  &--small {
    font-size: 13px;
    line-height: 16px;
    padding: ${Math.max(4, Math.round(padding.top * 0.7))}px ${Math.max(8, Math.round(padding.right * 0.7))}px;
  }

  &--medium {
    font-size: 14px;
    line-height: 20px;
    padding: ${padding.top}px ${padding.right}px;
  }

  &--large {
    font-size: 16px;
    line-height: 24px;
    padding: ${Math.round(padding.top * 1.3)}px ${Math.round(padding.right * 1.3)}px;
  }

  &--primary {
    background-color: var(--color-interactive-primary, #0c2340);
    color: #ffffff;
    border-color: transparent;

    &:hover:not(.ui-${kebabName}--disabled) {
      background-color: var(--color-interactive-primary-hover, #1d4076);
    }
  }

  &--secondary {
    background-color: transparent;
    color: var(--color-interactive-primary, #0c2340);
    border-color: var(--color-border-subtle, #d1d5db);

    &:hover:not(.ui-${kebabName}--disabled) {
      background-color: rgba(12, 35, 64, 0.05);
    }
  }

  &--tertiary {
    background-color: transparent;
    color: var(--color-interactive-primary, #0c2340);
    border-color: transparent;

    &:hover:not(.ui-${kebabName}--disabled) {
      background-color: rgba(12, 35, 64, 0.08);
    }
  }

  &--outlined {
    background-color: transparent;
    color: var(--color-interactive-primary, #0c2340);
    border: 1.5px solid currentColor;

    &:hover:not(.ui-${kebabName}--disabled) {
      background-color: rgba(12, 35, 64, 0.05);
    }
  }

  &--full-width {
    width: 100%;
    display: flex;
  }

  &--disabled {
    opacity: 0.55;
    cursor: not-allowed;
    pointer-events: none;
  }
}

@keyframes ui-${kebabName}-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
}

/**
 * Generate Flutter Widget (<component_name>.dart)
 */
function generateFlutterWidget(pascalName, kebabName, meta) {
  const { padding, cornerRadius } = meta;
  const widgetClass = `UI${pascalName}`;
  const variantEnum = `${widgetClass}Variant`;
  const sizeEnum = `${widgetClass}Size`;

  const variantCases = meta.variants.map(v => toSnakeCase(v)).join(', ');
  const sizeCases = meta.sizes.map(s => toSnakeCase(s)).join(', ');

  return `import 'package:flutter/material.dart';

enum ${variantEnum} { ${variantCases || 'primary, secondary, tertiary'} }
enum ${sizeEnum} { ${sizeCases || 'small, medium, large'} }

/// Auto-generated Flutter widget for [${pascalName}] from Figma.
class ${widgetClass} extends StatelessWidget {
  final String label;
  final Widget? child;
  final VoidCallback? onPressed;
  final ${variantEnum} variant;
  final ${sizeEnum} size;
  final bool isDisabled;
  final bool isLoading;
  final bool isFullWidth;
  final Widget? leadingIcon;
  final Widget? trailingIcon;

  const ${widgetClass}({
    Key? key,
    this.label = '${meta.defaultLabel || pascalName}',
    this.child,
    this.onPressed,
    this.variant = ${variantEnum}.${toSnakeCase(meta.variants[0] || 'primary')},
    this.size = ${sizeEnum}.${toSnakeCase(meta.sizes[0] || 'medium')},
    this.isDisabled = false,
    this.isLoading = false,
    this.isFullWidth = false,
    this.leadingIcon,
    this.trailingIcon,
  }) : super(key: key);

  EdgeInsets _getPadding() {
    switch (size) {
      case ${sizeEnum}.${toSnakeCase(meta.sizes[0] || 'small')}:
        return const EdgeInsets.symmetric(horizontal: ${Math.max(8, Math.round(padding.right * 0.7))}, vertical: ${Math.max(4, Math.round(padding.top * 0.7))});
      case ${sizeEnum}.large:
        return const EdgeInsets.symmetric(horizontal: ${Math.round(padding.right * 1.3)}, vertical: ${Math.round(padding.top * 1.3)});
      case ${sizeEnum}.medium:
      default:
        return const EdgeInsets.symmetric(horizontal: ${padding.right}.0, vertical: ${padding.top}.0);
    }
  }

  Color _getBackgroundColor(BuildContext context) {
    if (variant == ${variantEnum}.primary) {
      return const Color(0xFF0C2340);
    }
    return Colors.transparent;
  }

  Color _getTextColor(BuildContext context) {
    if (variant == ${variantEnum}.primary) {
      return Colors.white;
    }
    return const Color(0xFF0C2340);
  }

  BorderSide _getBorderSide(BuildContext context) {
    if (variant == ${variantEnum}.secondary) {
      return const BorderSide(color: Color(0xFFD1D5DB), width: 1.0);
    }
    if (variant == ${variantEnum}.outlined) {
      return const BorderSide(color: Color(0xFF0C2340), width: 1.5);
    }
    return BorderSide.none;
  }

  @override
  Widget build(BuildContext context) {
    final effectiveEnabled = !isDisabled && !isLoading;
    final content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading)
          const Padding(
            padding: EdgeInsets.only(right: 8.0),
            child: SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2.0),
            ),
          )
        else if (leadingIcon != null)
          Padding(
            padding: const EdgeInsets.only(right: 6.0),
            child: leadingIcon!,
          ),
        child ??
            Text(
              label,
              style: TextStyle(
                color: _getTextColor(context),
                fontWeight: FontWeight.w600,
              ),
            ),
        if (trailingIcon != null && !isLoading)
          Padding(
            padding: const EdgeInsets.only(left: 6.0),
            child: trailingIcon!,
          ),
      ],
    );

    return Opacity(
      opacity: effectiveEnabled ? 1.0 : 0.5,
      child: Material(
        color: _getBackgroundColor(context),
        borderRadius: BorderRadius.circular(${cornerRadius}.0),
        child: InkWell(
          onTap: effectiveEnabled ? onPressed : null,
          borderRadius: BorderRadius.circular(${cornerRadius}.0),
          child: Container(
            padding: _getPadding(),
            decoration: BoxDecoration(
              border: Border.fromBorderSide(_getBorderSide(context)),
              borderRadius: BorderRadius.circular(${cornerRadius}.0),
            ),
            child: content,
          ),
        ),
      ),
    );
  }
}
`;
}

/**
 * Generate HTML snippet (<component-name>.html)
 */
function generateHtmlSnippet(pascalName, kebabName, meta) {
  const isButton = kebabName.includes('button') || pascalName.toLowerCase().includes('button');
  const tag = isButton ? 'button' : 'div';
  const label = meta.defaultLabel || pascalName;

  return `<!-- ${pascalName} Component HTML Showcase -->
<link rel="stylesheet" href="./${kebabName}.css">

<section class="component-showcase">
  <h3>${pascalName} — Default (Primary)</h3>
  <${tag} class="ui-${kebabName} ui-${kebabName}--medium ui-${kebabName}--primary" ${isButton ? 'type="button"' : ''}>
    <span class="ui-${kebabName}__content">${label}</span>
  </${tag}>

  <h3>${pascalName} — Secondary</h3>
  <${tag} class="ui-${kebabName} ui-${kebabName}--medium ui-${kebabName}--secondary" ${isButton ? 'type="button"' : ''}>
    <span class="ui-${kebabName}__content">${label}</span>
  </${tag}>

  <h3>${pascalName} — Disabled</h3>
  <${tag} class="ui-${kebabName} ui-${kebabName}--medium ui-${kebabName}--primary ui-${kebabName}--disabled" ${isButton ? 'type="button" disabled' : 'aria-disabled="true"'}>
    <span class="ui-${kebabName}__content">${label}</span>
  </${tag}>
</section>
`;
}

/**
 * Generate Standalone Vanilla CSS (<component-name>.css)
 */
function generateVanillaCss(pascalName, kebabName, meta) {
  const { padding, cornerRadius, layoutMode } = meta;

  return `/* Standalone CSS for ${pascalName} */
.ui-${kebabName} {
  display: inline-flex;
  flex-direction: ${layoutMode};
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: ${cornerRadius}px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  outline: none;
}

.ui-${kebabName}__content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.ui-${kebabName}__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ui-${kebabName}-spin 0.75s linear infinite;
}

.ui-${kebabName}--small {
  font-size: 13px;
  line-height: 16px;
  padding: ${Math.max(4, Math.round(padding.top * 0.7))}px ${Math.max(8, Math.round(padding.right * 0.7))}px;
}

.ui-${kebabName}--medium {
  font-size: 14px;
  line-height: 20px;
  padding: ${padding.top}px ${padding.right}px;
}

.ui-${kebabName}--large {
  font-size: 16px;
  line-height: 24px;
  padding: ${Math.round(padding.top * 1.3)}px ${Math.round(padding.right * 1.3)}px;
}

.ui-${kebabName}--primary {
  background-color: #0c2340;
  color: #ffffff;
  border-color: transparent;
}

.ui-${kebabName}--primary:hover:not(.ui-${kebabName}--disabled) {
  background-color: #1d4076;
}

.ui-${kebabName}--secondary {
  background-color: transparent;
  color: #0c2340;
  border-color: #d1d5db;
}

.ui-${kebabName}--secondary:hover:not(.ui-${kebabName}--disabled) {
  background-color: rgba(12, 35, 64, 0.05);
}

.ui-${kebabName}--outlined {
  background-color: transparent;
  color: #0c2340;
  border: 1.5px solid currentColor;
}

.ui-${kebabName}--full-width {
  width: 100%;
  display: flex;
}

.ui-${kebabName}--disabled {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

@keyframes ui-${kebabName}-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;
}

/**
 * Generate component folder index.ts
 */
function generateComponentFolderIndex(pascalName) {
  return `export { ${pascalName} } from './${pascalName}';
export * from './${pascalName}.types';
`;
}

/**
 * Add or update export in src/components/index.ts
 */
function ensureExportInIndex(pascalName, folder) {
  if (!fs.existsSync(INDEX_FILE)) return;
  let content = fs.readFileSync(INDEX_FILE, 'utf8');

  const exportLine = `export { ${pascalName} } from './${folder}/${pascalName}'`;
  if (!content.includes(exportLine)) {
    content += `\n${exportLine}\nexport type { ${pascalName}Props } from './${folder}/${pascalName}.types'\n`;
    fs.writeFileSync(INDEX_FILE, content, 'utf8');
    console.log(`[CodeGenerator] Added export for ${pascalName} to src/components/index.ts`);
  }
}

/**
 * Remove export from src/components/index.ts
 */
function removeExportFromIndex(pascalName, folder) {
  if (!fs.existsSync(INDEX_FILE)) return;
  let content = fs.readFileSync(INDEX_FILE, 'utf8');

  const lines = content.split('\n').filter(line => {
    return !line.includes(`./${folder}/`) && !line.includes(`{ ${pascalName} }`);
  });

  fs.writeFileSync(INDEX_FILE, lines.join('\n') + '\n', 'utf8');
  console.log(`[CodeGenerator] Removed export for ${pascalName} from src/components/index.ts`);
}

/**
 * Main entry: Generate all files for a component
 */
function generateComponentFiles(figmaNode, options = {}) {
  const rawName = figmaNode.name || 'Component';
  const pascalName = toPascalCase(rawName);
  const kebabName = toKebabCase(rawName);
  const snakeName = toSnakeCase(rawName);

  const componentDir = path.join(COMPONENTS_DIR, kebabName);
  fs.mkdirSync(componentDir, { recursive: true });

  const meta = parseVariantsAndProps(figmaNode);

  // 1. React files
  const tsxPath = path.join(componentDir, `${pascalName}.tsx`);
  const typesPath = path.join(componentDir, `${pascalName}.types.ts`);
  const scssPath = path.join(componentDir, `${pascalName}.scss`);
  const localIndexPath = path.join(componentDir, 'index.ts');

  if (!options.preserveExistingReact || !fs.existsSync(tsxPath)) {
    fs.writeFileSync(tsxPath, generateReactComponent(pascalName, kebabName, meta), 'utf8');
    fs.writeFileSync(typesPath, generateReactTypes(pascalName, kebabName, meta), 'utf8');
    fs.writeFileSync(scssPath, generateScss(pascalName, kebabName, meta), 'utf8');
    fs.writeFileSync(localIndexPath, generateComponentFolderIndex(pascalName), 'utf8');
    ensureExportInIndex(pascalName, kebabName);
  }

  // 2. Flutter file
  const flutterPath = path.join(componentDir, `${snakeName}.dart`);
  fs.writeFileSync(flutterPath, generateFlutterWidget(pascalName, kebabName, meta), 'utf8');

  // 3. HTML/CSS files
  const htmlPath = path.join(componentDir, `${kebabName}.html`);
  const cssPath = path.join(componentDir, `${kebabName}.css`);
  fs.writeFileSync(htmlPath, generateHtmlSnippet(pascalName, kebabName, meta), 'utf8');
  fs.writeFileSync(cssPath, generateVanillaCss(pascalName, kebabName, meta), 'utf8');

  console.log(`[CodeGenerator] Generated React, Flutter, and HTML/CSS for "${pascalName}" in ${componentDir}`);

  return {
    componentName: pascalName,
    folder: kebabName,
    files: {
      react: tsxPath,
      types: typesPath,
      scss: scssPath,
      flutter: flutterPath,
      html: htmlPath,
      css: cssPath
    }
  };
}

/**
 * Delete a component from code
 */
function deleteComponentFiles(rawName) {
  const kebabName = toKebabCase(rawName);
  const pascalName = toPascalCase(rawName);
  const componentDir = path.join(COMPONENTS_DIR, kebabName);

  if (fs.existsSync(componentDir)) {
    fs.rmSync(componentDir, { recursive: true, force: true });
    console.log(`[CodeGenerator] Deleted component folder: ${componentDir}`);
    removeExportFromIndex(pascalName, kebabName);
    return true;
  }

  return false;
}

/**
 * Generate Flutter & HTML/CSS for all existing components in their existing folders
 */
function generateForExistingComponents() {
  if (!fs.existsSync(COMPONENTS_DIR)) return;

  const entries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'assets') continue;
    const folder = entry.name;
    const folderPath = path.join(COMPONENTS_DIR, folder);
    const files = fs.readdirSync(folderPath);

    const tsxFile = files.find(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
    if (!tsxFile) continue;

    const pascalName = path.basename(tsxFile, '.tsx');
    const snakeName = toSnakeCase(folder);

    const mockMeta = {
      variants: ['primary', 'secondary', 'tertiary'],
      sizes: ['small', 'medium', 'large'],
      defaultLabel: pascalName,
      padding: { top: 10, right: 16, bottom: 10, left: 16 },
      cornerRadius: 8,
      layoutMode: 'row'
    };

    // Flutter file
    const flutterPath = path.join(folderPath, `${snakeName}.dart`);
    fs.writeFileSync(flutterPath, generateFlutterWidget(pascalName, folder, mockMeta), 'utf8');

    // HTML & CSS files
    const htmlPath = path.join(folderPath, `${folder}.html`);
    const cssPath = path.join(folderPath, `${folder}.css`);
    fs.writeFileSync(htmlPath, generateHtmlSnippet(pascalName, folder, mockMeta), 'utf8');
    fs.writeFileSync(cssPath, generateVanillaCss(pascalName, folder, mockMeta), 'utf8');

    console.log(`[CodeGenerator] Added Flutter & HTML/CSS to existing component "${pascalName}" (${folder})`);
  }
}

module.exports = {
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  parseVariantsAndProps,
  generateComponentFiles,
  deleteComponentFiles,
  generateForExistingComponents,
  ensureExportInIndex,
  removeExportFromIndex
};
