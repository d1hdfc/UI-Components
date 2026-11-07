'use strict';

const fs = require('node:fs');
const path = require('node:path');
const appPageGenerator = require('./app-page-generator.cjs');
const docsGenerator = require('./docs-generator.cjs');

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const INDEX_FILE = path.join(COMPONENTS_DIR, 'index.ts');

/**
 * Helpers for naming conventions
 */
function toPascalCase(str) {
  if (!str) return 'Component';
  const clean = str
    .replace(/^[@_\d.\s-]+/, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ');
  const result = clean
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  if (!result) return 'Component';
  return /^\d/.test(result) ? `Comp${result}` : result;
}

function toKebabCase(str) {
  if (!str) return 'component';
  const result = str
    .replace(/^[@_]+/, '')
    .replace(/^\d+[\.\s_-]+/, '')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return result || 'component';
}

function toSnakeCase(str) {
  return toKebabCase(str).replace(/-/g, '_');
}

function parseVariantsAndProps(node) {
  const variants = new Set();
  const sizes = new Set();
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
    for (const child of node.children) {
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

  if (variants.size === 0) {
    ['primary', 'secondary', 'tertiary', 'outlined'].forEach(value => variants.add(value));
  }
  if (sizes.size === 0) {
    ['small', 'medium', 'large'].forEach(value => sizes.add(value));
  }

  const sample = (node.children && node.children[0]) || node;
  const paddingLeft = sample.paddingLeft ?? 16;
  const paddingRight = sample.paddingRight ?? 16;
  const paddingTop = sample.paddingTop ?? 10;
  const paddingBottom = sample.paddingBottom ?? 10;
  const cornerRadius = sample.cornerRadius ?? 8;
  const height = sample.height ?? node.height ?? null;
  const gap = sample.itemSpacing ?? node.itemSpacing ?? null;
  const fontSize = sample.fontSize ?? node.fontSize ?? null;
  const backgroundColor = sample.backgroundColor?.hex ?? node.backgroundColor?.hex ?? null;
  const textColor = sample.textColor?.hex ?? node.textColor?.hex ?? null;
  const borderColor = sample.borderColor?.hex ?? node.borderColor?.hex ?? null;
  const layoutMode = sample.layoutMode === 'VERTICAL' ? 'column' : 'row';
  if (node.textContent && defaultLabel === 'Component') {
    defaultLabel = String(node.textContent);
  }

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
    height,
    gap,
    fontSize,
    backgroundColor,
    textColor,
    borderColor,
    layoutMode
  };
}

/**
 * Generate React Types (<component-name>.types.ts)
 */
function generateReactTypes(pascalName, kebabName, meta) {
  const isButton = kebabName.includes('button') || pascalName.toLowerCase().includes('button');
  const htmlAttrType = isButton
    ? 'React.ButtonHTMLAttributes<HTMLButtonElement>'
    : 'React.HTMLAttributes<HTMLDivElement>';
  const variantType = meta.variants.map(v => `'${v}'`).join(' | ') || "'primary' | 'secondary'";
  const sizeType = meta.sizes.map(s => `'${s}'`).join(' | ') || "'small' | 'medium' | 'large'";

  return `// Generated from Figma by scripts/code-generator.cjs.
import type React from 'react';

export type ${pascalName}Variant = ${variantType};
export type ${pascalName}Size = ${sizeType};

export interface ${pascalName}Props extends ${htmlAttrType} {
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
 * Generate React Component (<component-name>.tsx)
 */
function generateReactComponent(pascalName, kebabName, meta) {
  const isButton = kebabName.includes('button') || pascalName.toLowerCase().includes('button');
  const defaultVariant = meta.variants[0] || 'primary';
  const defaultSize = meta.sizes.includes('medium') ? 'medium' : meta.sizes[0] || 'medium';

  return `// Generated from Figma by scripts/code-generator.cjs.
import React from 'react';
import type { ${pascalName}Props } from './${kebabName}.types';
import './${kebabName}.scss';

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
 * Generate SCSS (<component-name>.scss) using exclusively token variables from src/tokens/variables/
 */
function generateScss(pascalName, kebabName, meta) {
  const { layoutMode } = meta;

  return `@use 'sass:map';

$${kebabName}-sizes: (
  small: (
    height: var(--button-size-small-height),
    padding: var(--button-size-small-padding-x),
    radius: var(--button-size-small-radius),
    gap: var(--button-size-small-gap),
    font-size: var(--button-size-small-font-size),
    line-height: var(--font-line-height-paragraph-xsm)
  ),
  medium: (
    height: var(--button-size-medium-height),
    padding: var(--button-size-medium-padding-x),
    radius: var(--button-size-medium-radius),
    gap: var(--button-size-medium-gap),
    font-size: var(--button-size-medium-font-size),
    line-height: var(--font-line-height-paragraph-md)
  ),
  large: (
    height: var(--button-size-large-height),
    padding: var(--button-size-large-padding-x),
    radius: var(--button-size-large-radius),
    gap: var(--button-size-large-gap),
    font-size: var(--button-size-large-font-size),
    line-height: var(--font-line-height-paragraph-lg)
  )
);

$${kebabName}-variants: (
  primary: (
    background: var(--button-primary-background-color-default),
    foreground: var(--button-primary-foreground-color-static),
    border: var(--surface-root-opacity),
    hover-background: var(--button-primary-background-color-hover)
  ),
  secondary: (
    background: var(--button-secondary-background-color-default),
    foreground: var(--button-secondary-foreground-color-default),
    border: var(--button-secondary-border-color-default),
    hover-background: var(--button-secondary-background-color-hover)
  ),
  tertiary: (
    background: var(--button-tertiary-background-color-default),
    foreground: var(--button-tertiary-foreground-color-default),
    border: var(--surface-root-opacity),
    hover-background: var(--button-tertiary-background-color-hover)
  ),
  outlined: (
    background: var(--surface-root-opacity),
    foreground: var(--color-interactive-primary),
    border: var(--color-border-subtle),
    hover-background: var(--button-secondary-background-color-hover)
  )
);

.ui-${kebabName} {
  display: inline-flex;
  flex-direction: ${layoutMode};
  align-items: center;
  justify-content: center;
  gap: var(--global-scale-100);
  box-sizing: border-box;
  font-family: var(--font-family-inter);
  font-weight: var(--font-weight-500);
  text-decoration: none;
  cursor: pointer;
  border: var(--button-size-border-width) solid var(--surface-root-opacity);
  border-radius: var(--button-size-medium-radius);
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  user-select: none;
  outline: none;

  &__content {
    display: inline-flex;
    align-items: center;
    gap: var(--global-scale-75);
  }

  &__spinner {
    width: var(--global-scale-175);
    height: var(--global-scale-175);
    border: var(--global-scale-25) solid currentColor;
    border-right-color: var(--surface-root-opacity);
    border-radius: var(--layout-radius-full);
    animation: ui-${kebabName}-spin 0.75s linear infinite;
  }

  @each $size, $props in $${kebabName}-sizes {
    &--#{$size} {
      min-height: map.get($props, height);
      font-size: map.get($props, font-size);
      line-height: map.get($props, line-height);
      padding: var(--global-scale-100) map.get($props, padding);
      border-radius: map.get($props, radius);
      gap: map.get($props, gap);
    }
  }

  @each $variant, $props in $${kebabName}-variants {
    &--#{$variant} {
      background-color: map.get($props, background);
      color: map.get($props, foreground);
      border-color: map.get($props, border);

      &:hover:not(.ui-${kebabName}--disabled) {
        background-color: map.get($props, hover-background);
      }
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`;
}

/**
 * Generate Flutter Widget (<component-name>.dart)
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
 * Clean up any extra/non-standard files inside a component directory so only
 * the canonical files remain: the 4 code files (<kebab>.dart, <kebab>.scss, <kebab>.tsx,
 * <kebab>.types.ts) plus the optional Figma docs file (<kebab>.md).
 */
function enforceFourFileStructure(componentDir, kebabName) {
  if (!fs.existsSync(componentDir)) return;
  const allowed = new Set([
    `${kebabName}.dart`,
    `${kebabName}.scss`,
    `${kebabName}.tsx`,
    `${kebabName}.types.ts`,
    `${kebabName}.md`
  ]);
  for (const file of fs.readdirSync(componentDir)) {
    const lowerFile = file.toLowerCase();
    if (allowed.has(lowerFile) && file !== lowerFile) {
      // Force rename on case-insensitive file systems (Windows) via temporary name
      const srcPath = path.join(componentDir, file);
      const tmpPath = path.join(componentDir, `${lowerFile}.__case_tmp__`);
      const dstPath = path.join(componentDir, lowerFile);
      fs.renameSync(srcPath, tmpPath);
      fs.renameSync(tmpPath, dstPath);
    } else if (!allowed.has(file)) {
      fs.rmSync(path.join(componentDir, file), { recursive: true, force: true });
    }
  }
}

/**
 * Add or update export in src/components/index.ts
 */
function ensureExportInIndex(pascalName, folder) {
  if (!fs.existsSync(INDEX_FILE)) return;
  let content = fs.readFileSync(INDEX_FILE, 'utf8');

  const alreadyHasFolder = content.includes(`./${folder}/${folder}`);
  const alreadyHasSymbol = new RegExp(`\\b${pascalName}\\b`).test(content);
  if (!alreadyHasFolder && !alreadyHasSymbol) {
    const exportLine = `export { ${pascalName} } from './${folder}/${folder}'`;
    content += `\n${exportLine}\nexport type { ${pascalName}Props } from './${folder}/${folder}.types'\n`;
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
 * Remove @use './<folder>/<folder>'; from src/components/library.scss if present
 */
function removeFromLibraryScss(folder) {
  const libScss = path.join(COMPONENTS_DIR, 'library.scss');
  if (!fs.existsSync(libScss)) return;
  const content = fs.readFileSync(libScss, 'utf8');
  const lines = content.split('\n').filter(line => !line.includes(`./${folder}/${folder}`));
  if (lines.length !== content.split('\n').length) {
    fs.writeFileSync(libScss, lines.join('\n'), 'utf8');
  }
}

/**
 * Main entry: Generate strictly the 4 files (<kebab>.dart, <kebab>.scss, <kebab>.tsx, <kebab>.types.ts)
 */
function generateComponentFiles(figmaNode, options = {}) {
  const rawName = figmaNode.name || 'Component';
  const pascalName = toPascalCase(rawName);
  const kebabName = toKebabCase(rawName);

  const componentDir = path.join(COMPONENTS_DIR, kebabName);
  fs.mkdirSync(componentDir, { recursive: true });

  const meta = parseVariantsAndProps(figmaNode);

  const tsxPath = path.join(componentDir, `${kebabName}.tsx`);
  const typesPath = path.join(componentDir, `${kebabName}.types.ts`);
  const scssPath = path.join(componentDir, `${kebabName}.scss`);
  const flutterPath = path.join(componentDir, `${kebabName}.dart`);

  if (!options.preserveExistingReact || !fs.existsSync(tsxPath)) {
    fs.writeFileSync(tsxPath, generateReactComponent(pascalName, kebabName, meta), 'utf8');
  }
  if (!options.preserveExistingReact || !fs.existsSync(typesPath)) {
    fs.writeFileSync(typesPath, generateReactTypes(pascalName, kebabName, meta), 'utf8');
  }
  if (!options.preserveExistingReact || !fs.existsSync(scssPath)) {
    fs.writeFileSync(scssPath, generateScss(pascalName, kebabName, meta), 'utf8');
  }
  ensureExportInIndex(pascalName, kebabName);

  fs.writeFileSync(flutterPath, generateFlutterWidget(pascalName, kebabName, meta), 'utf8');
  const docsResult = docsGenerator.writeComponentDocs(figmaNode).result;
  if (docsResult) {
    console.log(`[DocsSync] ${docsResult.toUpperCase()}: src/components/${kebabName}/${kebabName}.md`);
  }

  enforceFourFileStructure(componentDir, kebabName);
  appPageGenerator.syncAppComponentPages();

  console.log(`[CodeGenerator] Generated 4-file component (${kebabName}.tsx, .types.ts, .scss, .dart) in ${componentDir}`);

  return {
    componentName: pascalName,
    folder: kebabName,
    files: {
      react: tsxPath,
      types: typesPath,
      scss: scssPath,
      flutter: flutterPath
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
    removeFromLibraryScss(kebabName);
    docsGenerator.forgetComponent(kebabName);
    appPageGenerator.syncAppComponentPages();
    return true;
  }

  return false;
}

/**
 * Ensure all existing components follow the strict 4-file lowercase-hyphen structure
 */
function generateForExistingComponents() {
  if (!fs.existsSync(COMPONENTS_DIR)) return;

  const entries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'assets') continue;
    const rawDirPath = path.join(COMPONENTS_DIR, entry.name);
    const folder = toKebabCase(entry.name);
    const folderPath = path.join(COMPONENTS_DIR, folder);

    if (entry.name !== folder) {
      fs.mkdirSync(folderPath, { recursive: true });
      const rawFiles = fs.readdirSync(rawDirPath);
      for (const rf of rawFiles) {
        const ext = rf.endsWith('.types.ts')
          ? '.types.ts'
          : path.extname(rf);
        if (['.tsx', '.types.ts', '.scss', '.dart'].includes(ext)) {
          const destFile = path.join(folderPath, `${folder}${ext}`);
          if (!fs.existsSync(destFile)) {
            fs.copyFileSync(path.join(rawDirPath, rf), destFile);
          }
        }
      }
      fs.rmSync(rawDirPath, { recursive: true, force: true });
    }

    if (!fs.existsSync(folderPath)) continue;

    const pascalName = toPascalCase(folder);
    const mockMeta = {
      variants: ['primary', 'secondary', 'tertiary'],
      sizes: ['small', 'medium', 'large'],
      defaultLabel: pascalName,
      padding: { top: 10, right: 16, bottom: 10, left: 16 },
      cornerRadius: 8,
      layoutMode: 'row'
    };

    const tsxPath = path.join(folderPath, `${folder}.tsx`);
    const typesPath = path.join(folderPath, `${folder}.types.ts`);
    const scssPath = path.join(folderPath, `${folder}.scss`);
    const flutterPath = path.join(folderPath, `${folder}.dart`);

    if (!fs.existsSync(tsxPath)) {
      fs.writeFileSync(tsxPath, generateReactComponent(pascalName, folder, mockMeta), 'utf8');
    }
    if (!fs.existsSync(typesPath)) {
      fs.writeFileSync(typesPath, generateReactTypes(pascalName, folder, mockMeta), 'utf8');
    }
    if (!fs.existsSync(scssPath)) {
      fs.writeFileSync(scssPath, generateScss(pascalName, folder, mockMeta), 'utf8');
    }
    if (!fs.existsSync(flutterPath)) {
      fs.writeFileSync(flutterPath, generateFlutterWidget(pascalName, folder, mockMeta), 'utf8');
    }
    ensureExportInIndex(pascalName, folder);
    enforceFourFileStructure(folderPath, folder);
  }

  appPageGenerator.syncAppComponentPages();
}

module.exports = {
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  parseVariantsAndProps,
  generateScss,
  writeComponentDocs: (node) => docsGenerator.writeComponentDocs(node),
  generateComponentFiles,
  deleteComponentFiles,
  generateForExistingComponents,
  ensureExportInIndex,
  removeExportFromIndex,
  enforceFourFileStructure
};
