'use strict';
/**
 * code-parser.cjs — Enhanced SCSS/TSX parser for bi-directional sync.
 * Extracts: variants, sizes, fontSize, fontWeight, padding, cornerRadius,
 * backgroundColor, borderColor, opacity, and resolved token values.
 */

const fs = require('node:fs');
const path = require('node:path');
let sass;
try { sass = require('sass'); } catch { sass = null; }

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const CATALOG_PATH   = path.join(process.cwd(), 'src', 'figma', 'components.json');
const MCP_CONFIG_PATH = path.join(process.cwd(), '.mcp', 'config.json');
const TOKEN_VARIABLES_DIR = path.join(process.cwd(), 'src', 'tokens', 'variables');

let tokenValueCache = null;
let tokenCacheMtime = 0;

function getTokenDirMtime() {
  if (!fs.existsSync(TOKEN_VARIABLES_DIR)) return 0;
  let maxMtime = 0;
  for (const file of fs.readdirSync(TOKEN_VARIABLES_DIR)) {
    if (!file.endsWith('.scss')) continue;
    try {
      const stat = fs.statSync(path.join(TOKEN_VARIABLES_DIR, file));
      if (stat.mtimeMs > maxMtime) maxMtime = stat.mtimeMs;
    } catch { /* ignore */ }
  }
  return maxMtime;
}

/**
 * Read the generated token SCSS maps and CSS custom-property declarations.
 * Code -> Figma must resolve var(--token) before sending numeric/color values.
 */
function loadTokenValues(forceReload = false) {
  const currentMtime = getTokenDirMtime();
  if (!forceReload && tokenValueCache && currentMtime === tokenCacheMtime) {
    return tokenValueCache;
  }

  const values = {};
  if (!fs.existsSync(TOKEN_VARIABLES_DIR)) return values;

  for (const file of fs.readdirSync(TOKEN_VARIABLES_DIR)) {
    if (!file.endsWith('.scss')) continue;
    const fullPath = path.join(TOKEN_VARIABLES_DIR, file);
    const source = fs.readFileSync(fullPath, 'utf8');
    const mapPrefix = file === 'layout.scss' ? 'layout-' : '';

    // Token maps use quoted keys, for example: "button-size-medium-height": var(--global-scale-1000),
    const mapEntry = /["']([a-zA-Z0-9_-]+)["']\s*:\s*((?:var\([^)]*\)|rgba?\([^)]*\)|[^,\r\n()])+)/g;
    let match;
    while ((match = mapEntry.exec(source)) !== null) {
      const val = match[2].trim();
      values[match[1]] = val;
      if (mapPrefix) values[`${mapPrefix}${match[1]}`] = val;
    }

    // Keep support for explicitly authored CSS custom properties as well.
    const cssVariable = /--([a-zA-Z0-9_-]+)\s*:\s*([^;\n}]+)/g;
    while ((match = cssVariable.exec(source)) !== null) {
      if (!Object.prototype.hasOwnProperty.call(values, match[1])) {
        values[match[1]] = match[2].trim();
      }
    }

    // Compile token SCSS so loop-generated variables (colors/scales) are
    // available to the parser with their concrete values.
    if (sass) {
      try {
        const compiled = sass.compile(fullPath).css;
        const compiledVariable = /--([a-zA-Z0-9_-]+)\s*:\s*([^;\n}]+)/g;
        while ((match = compiledVariable.exec(compiled)) !== null) {
          values[match[1]] = match[2].trim();
        }
      } catch {
        // A token file may be intentionally partial; source-map values still work.
      }
    }
  }

  tokenValueCache = values;
  tokenCacheMtime = currentMtime;
  return values;
}

function invalidateTokenCache() {
  tokenValueCache = null;
  tokenCacheMtime = 0;
}

function resolveTokenValue(value, seen = new Set()) {
  if (typeof value !== 'string') return value;
  const tokens = loadTokenValues();
  return value.replace(/var\(--([a-zA-Z0-9_-]+)(?:,\s*([^)]+))?\)/g, (full, name, fallback) => {
    if (seen.has(name)) return fallback ? resolveTokenValue(fallback.trim(), seen) : full;
    if (!Object.prototype.hasOwnProperty.call(tokens, name)) {
      return fallback ? resolveTokenValue(fallback.trim(), seen) : full;
    }
    const nextSeen = new Set(seen);
    nextSeen.add(name);
    return resolveTokenValue(tokens[name], nextSeen);
  });
}

// ─────────────────────────────────────────────────────────────
// Figma node-id lookup
// ─────────────────────────────────────────────────────────────
function findFigmaNodeId(componentName, folder) {
  if (fs.existsSync(MCP_CONFIG_PATH)) {
    try {
      const mcp = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf8'));
      if (Array.isArray(mcp.components)) {
        const found = mcp.components.find(
          c =>
            c.codeComponentName?.toLowerCase() === componentName.toLowerCase() ||
            c.figmaComponentName?.toLowerCase() === componentName.toLowerCase() ||
            c.filePath?.includes(`/${folder}/`)
        );
        if (found?.nodeId) return found.nodeId;
      }
    } catch { /* ignore */ }
  }

  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
      if (Array.isArray(catalog.components)) {
        const found = catalog.components.find(
          c =>
            c.name.toLowerCase() === componentName.toLowerCase() ||
            c.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === componentName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        );
        if (found) return found.nodeId;
      }
    } catch { /* ignore */ }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// SCSS helpers
// ─────────────────────────────────────────────────────────────

function parsePxValue(raw) {
  if (raw === null || raw === undefined) return null;
  const resolved = resolveTokenValue(String(raw).trim());
  const px = resolved.match(/-?(?:\d+(?:\.\d+)?)px\b/i);
  if (px) return parseFloat(px[0]);
  if (/^-?\d+(?:\.\d+)?$/.test(resolved)) return parseFloat(resolved);
  return null;
}

/** Extract a single numeric px value from SCSS content for a given property */
function extractPx(scss, property) {
  const re = new RegExp(`(?:^|[^-\\w])${property}:\\s*([^;\\n}]+)`, 'gmi');
  let m;
  let lastValid = null;
  while ((m = re.exec(scss)) !== null) {
    const px = parsePxValue(m[1]);
    if (px !== null) lastValid = px;
  }
  return lastValid;
}

/** Extract a raw value (px, em, rem, %, number) */
function extractValue(scss, property) {
  const re = new RegExp(`(?:^|[^-\\w])${property}:\\s*([^;\\n}]+)`, 'gmi');
  let m;
  let lastValid = null;
  while ((m = re.exec(scss)) !== null) {
    const resolved = resolveTokenValue(m[1].trim());
    if (!resolved.startsWith('var(--')) {
      lastValid = resolved;
    }
  }
  return lastValid;
}

/** Convert #hex or rgb()/rgba() color to Figma {r,g,b} (0–1) */
function colorToFigmaRgb(colorStr) {
  if (!colorStr || typeof colorStr !== 'string') return null;
  const resolved = resolveTokenValue(colorStr.trim());
  if (resolved === 'transparent' || resolved === 'none') return null;

  const hexMatch = resolved.match(/#([0-9a-fA-F]{3,8})\b/);
  if (hexMatch) {
    const h = hexMatch[1];
    if (h.length === 3) {
      return {
        r: parseInt(h[0] + h[0], 16) / 255,
        g: parseInt(h[1] + h[1], 16) / 255,
        b: parseInt(h[2] + h[2], 16) / 255,
      };
    }
    if (h.length >= 6) {
      return {
        r: parseInt(h.slice(0, 2), 16) / 255,
        g: parseInt(h.slice(2, 4), 16) / 255,
        b: parseInt(h.slice(4, 6), 16) / 255,
      };
    }
  }

  const rgbMatch = resolved.match(/rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i);
  if (rgbMatch) {
    return {
      r: Math.min(1, Math.max(0, parseFloat(rgbMatch[1]) / 255)),
      g: Math.min(1, Math.max(0, parseFloat(rgbMatch[2]) / 255)),
      b: Math.min(1, Math.max(0, parseFloat(rgbMatch[3]) / 255)),
    };
  }
  return null;
}

/** Parse SCSS map blocks like $sizes: ( small: (font-size: 14px, ...), ... ) */
function parseSassMap(scss, mapName) {
  const mapRe = new RegExp(`\\$${mapName}\\s*:\\s*\\(([\\s\\S]*?)^\\);`, 'mi');
  const mapMatch = scss.match(mapRe);
  if (!mapMatch) return {};

  const result = {};
  const entryRe = /(['"]?[\w-]+['"]?)\s*:\s*\(/g;
  let entry;
  while ((entry = entryRe.exec(mapMatch[1])) !== null) {
    const key = entry[1].replace(/['"]/g, '');
    const bodyStart = entryRe.lastIndex;
    let depth = 1;
    let index = bodyStart;
    while (index < mapMatch[1].length && depth > 0) {
      if (mapMatch[1][index] === '(') depth++;
      if (mapMatch[1][index] === ')') depth--;
      index++;
    }
    const body = mapMatch[1].slice(bodyStart, index - 1);
    entryRe.lastIndex = index;
    result[key] = {};
    const propRe = /([\w-]+)\s*:\s*((?:var\([^)]*\)|rgba?\([^)]*\)|[^,\r\n()])+)/g;
    let prop;
    while ((prop = propRe.exec(body)) !== null) {
      const propName = prop[1].trim();
      const rawVal = prop[2].trim();
      const resolvedVal = resolveTokenValue(rawVal);
      result[key][propName] = resolvedVal;

      const pxVal = parsePxValue(resolvedVal);
      if (pxVal !== null) {
        result[key][`${propName}Px`] = pxVal;
      }
      const rgbVal = colorToFigmaRgb(resolvedVal);
      if (rgbVal !== null) {
        result[key][`${propName}Rgb`] = rgbVal;
      }
    }
  }
  return result;
}

function toPascalFromFolder(folder) {
  return String(folder || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

// ─────────────────────────────────────────────────────────────
// Main parser
// ─────────────────────────────────────────────────────────────
function parseComponentDir(componentFolder) {
  loadTokenValues(true);

  const dirPath = path.isAbsolute(componentFolder)
    ? componentFolder
    : path.join(COMPONENTS_DIR, componentFolder);

  // ── DELETED ─────────────────────────────────────────────
  if (!fs.existsSync(dirPath)) {
    const folder = path.basename(dirPath);
    return {
      isDeleted: true,
      folder,
      componentName: toPascalFromFolder(folder),
      nodeId: findFigmaNodeId(toPascalFromFolder(folder), folder),
    };
  }

  const files      = fs.readdirSync(dirPath);
  const tsxFile    = files.find(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
  const folder     = path.basename(dirPath);
  let componentName = toPascalFromFolder(folder);
  if (tsxFile) {
    try {
      const tsxSource = fs.readFileSync(path.join(dirPath, tsxFile), 'utf8');
      const exportMatch = tsxSource.match(/export\s+(?:const|function)\s+([A-Z][A-Za-z0-9_]*)/);
      if (exportMatch) {
        componentName = exportMatch[1];
      }
    } catch { /* fallback to folder pascal */ }
  }
  const nodeId     = findFigmaNodeId(componentName, folder);

  // ── Defaults ─────────────────────────────────────────────
  let variants        = [];
  let sizes           = [];
  let fontSize        = null;
  let fontWeight      = null;
  let letterSpacing   = null;
  let lineHeight      = null;
  let padding         = { top: 10, right: 16, bottom: 10, left: 16 };
  let cornerRadius    = 8;
  let backgroundColor = null;
  let borderColor     = null;
  let textColor       = null;
  let opacity         = null;
  let width           = null;
  let height          = null;
  let gap             = null;
  let sizesMap        = {};
  let variantsMap     = {};

  // ── Parse .types.ts ──────────────────────────────────────
  const typesFile = files.find(f => f.endsWith('.types.ts'));
  if (typesFile) {
    const tc = fs.readFileSync(path.join(dirPath, typesFile), 'utf8');

    const vm = tc.match(/type\s+\w+Variant\s*=\s*([^;]+);/);
    if (vm) variants = vm[1].split('|').map(v => v.trim().replace(/['"]/g, '')).filter(Boolean);

    const sm = tc.match(/type\s+\w+Size\s*=\s*([^;]+);/);
    if (sm) sizes = sm[1].split('|').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  }

  // ── Parse SCSS ───────────────────────────────────────────
  const scssFile = files.find(f => f.endsWith('.scss'));
  if (scssFile) {
    const scss = fs.readFileSync(path.join(dirPath, scssFile), 'utf8');

    // Strip out top-level Sass maps ($...-sizes: (...);) to inspect selector rules separately
    const selectorScss = scss.replace(/\$[\w-]+\s*:\s*\([\s\S]*?^\);/gmi, '');
    const resolvedSelectorScss = resolveTokenValue(selectorScss);

    // ── Sass maps ────────────────────────────────────────
    const folderBase = folder.replace(/-/g, '');
    const folderCamel = folder.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    const compLower = componentName.toLowerCase();
    const sMap0 = parseSassMap(scss, `${folder}-sizes`);
    const sMap1 = parseSassMap(scss, `${folderCamel}-sizes`);
    const sMap2 = parseSassMap(scss, `${folderBase}-sizes`);
    const sMap3 = parseSassMap(scss, `${compLower}-sizes`);
    const sMap4 = parseSassMap(scss, 'sizes');
    sizesMap = Object.keys(sMap0).length ? sMap0
      : Object.keys(sMap1).length ? sMap1
      : Object.keys(sMap2).length ? sMap2
      : Object.keys(sMap3).length ? sMap3 : sMap4;

    const vMap0 = parseSassMap(scss, `${folder}-variants`);
    const vMap1 = parseSassMap(scss, `${folderCamel}-variants`);
    const vMap2 = parseSassMap(scss, `${folderBase}-variants`);
    const vMap3 = parseSassMap(scss, `${compLower}-variants`);
    const vMap4 = parseSassMap(scss, 'variants');
    variantsMap = Object.keys(vMap0).length ? vMap0
      : Object.keys(vMap1).length ? vMap1
      : Object.keys(vMap2).length ? vMap2
      : Object.keys(vMap3).length ? vMap3 : vMap4;

    // ── Direct property extraction from selector rules ───
    const selectorFontSize = extractPx(selectorScss, 'font-size');
    const selectorRadius   = extractPx(selectorScss, 'border-radius');
    const selectorGap      = extractPx(selectorScss, 'gap');
    const selectorHeight   = extractPx(selectorScss, 'height');
    const selectorWidth    = extractPx(selectorScss, 'width');

    if (selectorRadius !== null) cornerRadius = selectorRadius;
    if (selectorFontSize !== null) fontSize = selectorFontSize;
    if (selectorGap !== null) gap = selectorGap;
    if (selectorHeight !== null) height = selectorHeight;
    if (selectorWidth !== null) width = selectorWidth;

    const fwVal = extractValue(scss, 'font-weight');
    if (fwVal !== null) fontWeight = isNaN(Number(fwVal)) ? fwVal : Number(fwVal);

    const lsVal = extractValue(scss, 'letter-spacing');
    if (lsVal !== null) letterSpacing = lsVal;

    const lhVal = extractValue(scss, 'line-height');
    if (lhVal !== null) lineHeight = lhVal;

    // Component maps provide per-size defaults and fallback top-level metrics
    const preferredSize = sizesMap.medium || sizesMap.large || sizesMap.small || sizesMap.xsmall || Object.values(sizesMap)[0];
    if (preferredSize) {
      if (fontSize === null && preferredSize['font-sizePx'] !== undefined) {
        fontSize = preferredSize['font-sizePx'];
      }
      if (gap === null && preferredSize.gapPx !== undefined) {
        gap = preferredSize.gapPx;
      }
      if (selectorRadius === null && preferredSize.radiusPx !== undefined) {
        cornerRadius = preferredSize.radiusPx;
      }
      if (height === null && preferredSize.heightPx !== undefined) {
        height = preferredSize.heightPx;
      }
      if (preferredSize.paddingPx !== undefined) {
        padding = {
          top: 0,
          bottom: 0,
          left: preferredSize.paddingPx,
          right: preferredSize.paddingPx,
        };
      }
    }

    // If a direct selector font-size override was set (e.g. .btn { font-size: 35px; }),
    // propagate it to sizesMap so all variants on the Figma canvas reflect the override.
    if (selectorFontSize !== null && Object.keys(sizesMap).length > 0) {
      for (const sizeKey of Object.keys(sizesMap)) {
        sizesMap[sizeKey]['font-sizePx'] = selectorFontSize;
        sizesMap[sizeKey]['font-size'] = `${selectorFontSize}px`;
      }
    }

    // Fallbacks if neither selector nor map had them
    if (fontSize === null) fontSize = extractPx(scss, 'font-size');
    if (gap === null) gap = extractPx(scss, 'gap');

    const opacityVal = extractValue(selectorScss, 'opacity');
    if (opacityVal !== null && !isNaN( parseFloat(opacityVal) )) {
      opacity = parseFloat(opacityVal);
    }

    // ── Padding from selector rules ──────────────────────
    const p4 = resolvedSelectorScss.match(/padding:\s*(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/);
    const p2 = resolvedSelectorScss.match(/padding:\s*(-?\d+(?:\.\d+)?)(?:px)?\s+(-?\d+(?:\.\d+)?)px/);
    if (p4) {
      padding = { top: +p4[1], right: +p4[2], bottom: +p4[3], left: +p4[4] };
    } else if (p2) {
      padding = { top: +p2[1], right: +p2[2], bottom: +p2[1], left: +p2[2] };
    } else {
      const pt = extractPx(selectorScss, 'padding-top');
      const pr = extractPx(selectorScss, 'padding-right');
      const pb = extractPx(selectorScss, 'padding-bottom');
      const pl = extractPx(selectorScss, 'padding-left');
      if (pt !== null) padding.top    = pt;
      if (pr !== null) padding.right  = pr;
      if (pb !== null) padding.bottom = pb;
      if (pl !== null) padding.left   = pl;
    }

    // ── Colors ────────────────────────────────────────────
    const preferredVariant = variantsMap.primary || variantsMap.default || variantsMap.filled || Object.values(variantsMap)[0];
    if (preferredVariant) {
      if (preferredVariant.backgroundRgb) backgroundColor = preferredVariant.backgroundRgb;
      if (preferredVariant.foregroundRgb) textColor = preferredVariant.foregroundRgb;
      if (preferredVariant.borderRgb) borderColor = preferredVariant.borderRgb;
    }

    const bgMatch = resolvedSelectorScss.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
    if (bgMatch) {
      const rgb = colorToFigmaRgb(bgMatch[1]);
      if (rgb) backgroundColor = rgb;
    }

    const colorMatch = resolvedSelectorScss.match(/(?:^|[^-\w])color:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/m);
    if (colorMatch) {
      const rgb = colorToFigmaRgb(colorMatch[1]);
      if (rgb) textColor = rgb;
    }

    const borderMatch = resolvedSelectorScss.match(/border(?:-color)?:\s*[^;\n]*?(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
    if (borderMatch) {
      const rgb = colorToFigmaRgb(borderMatch[1]);
      if (rgb) borderColor = rgb;
    }
  }

  // ── Parse TSX for additional hints ───────────────────────
  if (tsxFile) {
    const tsx = fs.readFileSync(path.join(dirPath, tsxFile), 'utf8');
    const hasChildren = tsx.includes('children');
    const hasText = tsx.includes('<span') || tsx.includes('<p ') || tsx.includes('<label');
    const defaultVariant = (tsx.match(/variant\s*=\s*['"](\w+)['"]/) || [])[1] || null;
    const defaultSize    = (tsx.match(/size\s*=\s*['"](\w+)['"]/) || [])[1] || null;

    return {
      isDeleted: false,
      folder,
      componentName,
      nodeId,
      variants,
      sizes,
      sizesMap,
      variantsMap,
      fontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      padding,
      cornerRadius,
      backgroundColor,
      borderColor,
      textColor,
      opacity,
      width,
      height,
      gap,
      hasChildren,
      hasText,
      defaultVariant,
      defaultSize,
      files,
    };
  }

  return {
    isDeleted: false,
    folder,
    componentName,
    nodeId,
    variants,
    sizes,
    sizesMap,
    variantsMap,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    padding,
    cornerRadius,
    backgroundColor,
    borderColor,
    textColor,
    opacity,
    width,
    height,
    gap,
    files,
  };
}

module.exports = { findFigmaNodeId, parseComponentDir, invalidateTokenCache, loadTokenValues, resolveTokenValue };
