'use strict';
/**
 * css-to-scss-converter.cjs
 * Converts all auto-generated .css files in src/components/ to proper SCSS
 * following the Button.scss pattern: sass maps, @each loops, variables, mixins.
 */

const fs = require('node:fs');
const path = require('node:path');

const COMPONENTS_DIR = path.join(__dirname, '..', 'src', 'components');

// Parse a CSS file into structured data
function parseCssFile(cssContent, componentName) {
  const sizes = {};
  const variants = {};
  const baseRules = [];
  const spinnerRules = [];
  const contentRules = [];
  const extraRules = [];

  // Extract class blocks
  const blockRegex = /\.([\w-]+(?::[\w-]+(?:\([\w\s:.]+\))?)?)\s*\{([^}]+)\}/g;
  let match;

  while ((match = blockRegex.exec(cssContent)) !== null) {
    const selector = match[1];
    const body = match[2].trim();

    const cls = selector.replace(/^ui-/, '').replace(new RegExp(`^${toKebab(componentName)}-?`), '');

    // Size classes (--small, --medium, --large, --xlarge, --xsmall)
    if (/^[\w-]+--(?:xsmall|small|medium|large|xlarge)$/.test(selector)) {
      const sizeMatch = selector.match(/--(\w+)$/);
      if (sizeMatch) {
        sizes[sizeMatch[1]] = parseDeclarations(body);
      }
      continue;
    }

    // Variant classes (--primary, --secondary, --tertiary, --link, --success, --warning, --error, --danger)
    if (/^[\w-]+--(?:primary|secondary|tertiary|link|success|warning|error|danger|default|ghost|outline)$/.test(selector)) {
      const variantMatch = selector.match(/--(\w+)$/);
      if (variantMatch) {
        variants[variantMatch[1]] = variants[variantMatch[1]] || {};
        Object.assign(variants[variantMatch[1]], parseDeclarations(body));
      }
      continue;
    }

    // Hover/active states for variants
    const variantStateMatch = selector.match(/--(\w+)(?::hover|:active|:focus|:not\(.*?\))?$/);
    if (variantStateMatch && /hover|active/.test(selector)) {
      const v = variantStateMatch[1];
      if (['primary','secondary','tertiary','link','success','warning','error','danger','default','ghost','outline'].includes(v)) {
        const stateDecls = parseDeclarations(body);
        variants[v] = variants[v] || {};
        if (selector.includes(':hover')) {
          Object.keys(stateDecls).forEach(k => { variants[v][`hover-${k}`] = stateDecls[k]; });
        } else if (selector.includes(':active')) {
          Object.keys(stateDecls).forEach(k => { variants[v][`active-${k}`] = stateDecls[k]; });
        }
        continue;
      }
    }

    // Spinner
    if (selector.includes('__spinner') || selector.includes('-spin')) {
      spinnerRules.push({ selector, body });
      continue;
    }

    // Content
    if (selector.includes('__content')) {
      contentRules.push({ selector, body });
      continue;
    }

    // Base class (exact component class)
    const kebab = toKebab(componentName);
    if (selector === `ui-${kebab}` || selector === kebab) {
      baseRules.push(body);
      continue;
    }

    // Everything else
    extraRules.push({ selector, body });
  }

  return { sizes, variants, baseRules, spinnerRules, contentRules, extraRules };
}

function parseDeclarations(body) {
  const decls = {};
  body.split(';').forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const prop = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      if (prop && val) decls[prop] = val;
    }
  });
  return decls;
}

function toKebab(name) {
  return name
    .replace(/([A-Z])/g, (m, c, i) => (i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`))
    .replace(/[_\s]+/g, '-')
    .replace(/--+/g, '-')
    .toLowerCase();
}

function toCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Generate SCSS content following Button.scss pattern
function generateScss(componentName, parsed, cssContent) {
  const kebab = toKebab(componentName);
  const varName = toCamel(kebab);
  const lines = [];

  lines.push(`@use 'sass:map';`);
  lines.push(``);

  const hasSizes = Object.keys(parsed.sizes).length > 0;
  const hasVariants = Object.keys(parsed.variants).length > 0;

  // ── Size map ─────────────────────────────────────────────
  if (hasSizes) {
    lines.push(`// Size tokens`);
    lines.push(`$${varName}-sizes: (`);
    Object.entries(parsed.sizes).forEach(([size, decls]) => {
      lines.push(`  ${size}: (`);
      Object.entries(decls).forEach(([prop, val]) => {
        lines.push(`    ${prop}: ${val},`);
      });
      lines.push(`  ),`);
    });
    lines.push(`);`);
    lines.push(``);
  }

  // ── Variant map ───────────────────────────────────────────
  if (hasVariants) {
    lines.push(`// Variant tokens`);
    lines.push(`$${varName}-variants: (`);
    Object.entries(parsed.variants).forEach(([variant, decls]) => {
      lines.push(`  ${variant}: (`);
      Object.entries(decls).forEach(([prop, val]) => {
        lines.push(`    ${prop}: ${val},`);
      });
      lines.push(`  ),`);
    });
    lines.push(`);`);
    lines.push(``);
  }

  // ── Base class ───────────────────────────────────────────
  lines.push(`// Base component styles`);
  lines.push(`.ui-${kebab} {`);

  // Extract base rules from CSS directly
  const baseBlockMatch = cssContent.match(new RegExp(`\\.ui-${kebab}\\s*\\{([^}]+)\\}`));
  if (baseBlockMatch) {
    baseBlockMatch[1].trim().split('\n').forEach(line => {
      const t = line.trim();
      if (t) lines.push(`  ${t}`);
    });
  } else if (parsed.baseRules.length > 0) {
    parsed.baseRules[0].split('\n').forEach(line => {
      const t = line.trim();
      if (t) lines.push(`  ${t}`);
    });
  }

  lines.push(`}`);
  lines.push(``);

  // ── Content block ─────────────────────────────────────────
  if (parsed.contentRules.length > 0) {
    lines.push(`.ui-${kebab}__content {`);
    const contentBlockMatch = cssContent.match(new RegExp(`\\.ui-${kebab}__content\\s*\\{([^}]+)\\}`));
    if (contentBlockMatch) {
      contentBlockMatch[1].trim().split('\n').forEach(line => {
        const t = line.trim();
        if (t) lines.push(`  ${t}`);
      });
    }
    lines.push(`}`);
    lines.push(``);
  }

  // ── Spinner ───────────────────────────────────────────────
  if (parsed.spinnerRules.length > 0) {
    const spinnerBlockMatch = cssContent.match(new RegExp(`\\.ui-${kebab}__spinner\\s*\\{([^}]+)\\}`));
    if (spinnerBlockMatch) {
      lines.push(`.ui-${kebab}__spinner {`);
      spinnerBlockMatch[1].trim().split('\n').forEach(line => {
        const t = line.trim();
        if (t) lines.push(`  ${t}`);
      });
      lines.push(`}`);
      lines.push(``);
    }
  }

  // ── @each loop for sizes ──────────────────────────────────
  if (hasSizes) {
    lines.push(`// Size modifiers`);
    lines.push(`@each $size, $tokens in $${varName}-sizes {`);
    lines.push(`  .ui-${kebab}--#{$size} {`);
    // Get property names from first size entry
    const firstSizeDecls = Object.keys(Object.values(parsed.sizes)[0]);
    firstSizeDecls.forEach(prop => {
      lines.push(`    ${prop}: map.get($tokens, ${prop});`);
    });
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(``);
  }

  // ── @each loop for variants ───────────────────────────────
  if (hasVariants) {
    lines.push(`// Variant modifiers`);
    lines.push(`@each $variant, $tokens in $${varName}-variants {`);
    lines.push(`  .ui-${kebab}--#{$variant} {`);
    lines.push(`    @each $property, $value in $tokens {`);
    lines.push(`      #{$property}: #{$value};`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push(``);
  }

  // ── Keyframe animations ───────────────────────────────────
  const keyframeRegex = /@keyframes\s+[\w-]+\s*\{[^}]+\}/g;
  let kfMatch;
  while ((kfMatch = keyframeRegex.exec(cssContent)) !== null) {
    lines.push(kfMatch[0]);
    lines.push(``);
  }

  // ── Disabled state ────────────────────────────────────────
  const disabledMatch = cssContent.match(new RegExp(`\\.ui-${kebab}--disabled\\s*\\{([^}]+)\\}`));
  if (disabledMatch) {
    lines.push(`.ui-${kebab}--disabled {`);
    disabledMatch[1].trim().split('\n').forEach(l => { const t = l.trim(); if (t) lines.push(`  ${t}`); });
    lines.push(`}`);
    lines.push(``);
  }

  return lines.join('\n');
}

// Get component name from folder
function getComponentName(folder) {
  // Convert kebab-case folder to PascalCase component name
  return folder
    .split(/[-_]/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

// Main conversion runner
async function convertAll() {
  const folders = fs.readdirSync(COMPONENTS_DIR).filter(f => {
    const full = path.join(COMPONENTS_DIR, f);
    return fs.statSync(full).isDirectory();
  });

  let converted = 0;
  let skipped = 0;
  let deleted = 0;

  for (const folder of folders) {
    const folderPath = path.join(COMPONENTS_DIR, folder);
    const cssFile = path.join(folderPath, `${folder}.css`);
    const scssFile = path.join(folderPath, `${folder}.scss`);

    if (!fs.existsSync(cssFile)) continue;

    const cssContent = fs.readFileSync(cssFile, 'utf8');

    // If SCSS already exists and has real SCSS content, just delete the CSS
    if (fs.existsSync(scssFile)) {
      const scssContent = fs.readFileSync(scssFile, 'utf8');
      if (scssContent.trim().length > 50) {
        fs.unlinkSync(cssFile);
        deleted++;
        console.log(`  [DELETE] ${folder}.css (scss exists)`);
        continue;
      }
    }

    // Convert CSS to SCSS
    const componentName = getComponentName(folder);
    try {
      const parsed = parseCssFile(cssContent, componentName);
      const scssContent = generateScss(componentName, parsed, cssContent);

      // Write .scss file
      fs.writeFileSync(scssFile, scssContent, 'utf8');

      // Delete .css file
      fs.unlinkSync(cssFile);

      converted++;
      console.log(`  [CONVERT] ${folder}.css → ${folder}.scss`);
    } catch (err) {
      console.warn(`  [WARN] Could not convert ${folder}: ${err.message}`);
      // Still delete the css and write a minimal scss wrapper
      const minimalScss = `// Converted from ${folder}.css\n// TODO: refactor using Button.scss pattern\n\n${cssContent.replace(/\/\*.*?\*\//gs, '').trim()}\n`;
      fs.writeFileSync(scssFile, minimalScss, 'utf8');
      fs.unlinkSync(cssFile);
      skipped++;
    }
  }

  // Also update .tsx imports: replace .css with .scss
  const tsxFiles = getAllFiles(COMPONENTS_DIR, '.tsx');
  let importFixed = 0;
  for (const txFile of tsxFiles) {
    let content = fs.readFileSync(txFile, 'utf8');
    if (content.includes(".css'") || content.includes('.css"')) {
      content = content.replace(/\.css(['"])/g, '.scss$1');
      fs.writeFileSync(txFile, content, 'utf8');
      importFixed++;
    }
  }

  console.log(`\n✅ Conversion complete:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Deleted (scss existed): ${deleted}`);
  console.log(`   Minimal wrap (skipped full): ${skipped}`);
  console.log(`   TSX imports fixed: ${importFixed}`);
}

function getAllFiles(dir, ext) {
  const results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      results.push(...getAllFiles(full, ext));
    } else if (f.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

convertAll().catch(console.error);

