'use strict';
/**
 * code-parser.cjs — Enhanced SCSS/TSX parser for bi-directional sync.
 * Extracts: variants, sizes, fontSize, fontWeight, padding, cornerRadius,
 * backgroundColor, borderColor, opacity, and any CSS custom properties.
 */

const fs = require('node:fs');
const path = require('node:path');

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const CATALOG_PATH   = path.join(process.cwd(), 'src', 'figma', 'components.json');
const MCP_CONFIG_PATH = path.join(process.cwd(), '.mcp', 'config.json');

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
            c.filePath?.includes(folder)
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

/** Extract a single numeric px value from SCSS content for a given property */
function extractPx(scss, property) {
  const re = new RegExp(`(?:^|[^-])${property}:\\s*([0-9.]+)px`, 'mi');
  const m = scss.match(re);
  return m ? parseFloat(m[1]) : null;
}

/** Extract a raw value (px, em, rem, %, number) */
function extractValue(scss, property) {
  const re = new RegExp(`(?:^|[^-])${property}:\\s*([^;\\n]+)`, 'mi');
  const m = scss.match(re);
  return m ? m[1].trim() : null;
}

/** Convert hex color to Figma {r,g,b} (0–1) */
function hexToFigmaRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length !== 3 && h.length !== 6) return null;
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
  };
}

/** Parse SCSS map blocks like $sizes: ( small: (font-size: 14px, ...), ... ) */
function parseSassMap(scss, mapName) {
  const mapRe = new RegExp(`\\$${mapName}\\s*:\\s*\\(([\\s\\S]*?)^\\);`, 'mi');
  const mapMatch = scss.match(mapRe);
  if (!mapMatch) return {};

  const result = {};
  const entryRe = /(\w[\w-]*):\s*\(([^)]+)\)/g;
  let entry;
  while ((entry = entryRe.exec(mapMatch[1])) !== null) {
    const key = entry[1];
    const body = entry[2];
    result[key] = {};
    const propRe = /([\w-]+)\s*:\s*([^,\n]+)/g;
    let prop;
    while ((prop = propRe.exec(body)) !== null) {
      result[key][prop[1].trim()] = prop[2].trim();
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────
// Main parser
// ─────────────────────────────────────────────────────────────
function parseComponentDir(componentFolder) {
  const dirPath = path.isAbsolute(componentFolder)
    ? componentFolder
    : path.join(COMPONENTS_DIR, componentFolder);

  // ── DELETED ─────────────────────────────────────────────
  if (!fs.existsSync(dirPath)) {
    const folder = path.basename(dirPath);
    return {
      isDeleted: true,
      folder,
      componentName: folder.charAt(0).toUpperCase() + folder.slice(1),
      nodeId: findFigmaNodeId(folder, folder),
    };
  }

  const files      = fs.readdirSync(dirPath);
  const tsxFile    = files.find(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
  const componentName = tsxFile ? path.basename(tsxFile, '.tsx') : path.basename(dirPath);
  const folder     = path.basename(dirPath);
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

    // ── Sass maps ────────────────────────────────────────
    const componentBase = componentName.replace(/([A-Z])/g, (_, c, i) => i === 0 ? c.toLowerCase() : `-${c.toLowerCase()}`);
    const variantMapName  = `${componentBase.replace(/-/g,'')}-variants`.replace(/^-/, '');
    const sizeMapName     = `${componentBase.replace(/-/g,'')}-sizes`.replace(/^-/, '');

    // Try generic names too (button-variants, button-sizes)
    const folderBase = folder.replace(/-/g, '');
    sizesMap    = parseSassMap(scss, `${folderBase}-sizes`)    || parseSassMap(scss, `${folderBase}Sizes`) || {};
    variantsMap = parseSassMap(scss, `${folderBase}-variants`) || parseSassMap(scss, `${folderBase}Variants`) || {};

    // ── Direct property extraction ────────────────────────
    const radiusVal = extractPx(scss, 'border-radius');
    if (radiusVal !== null) cornerRadius = radiusVal;

    const fsVal = extractPx(scss, 'font-size');
    if (fsVal !== null) fontSize = fsVal;

    const fwVal = extractValue(scss, 'font-weight');
    if (fwVal !== null) fontWeight = isNaN(Number(fwVal)) ? fwVal : Number(fwVal);

    const lsVal = extractValue(scss, 'letter-spacing');
    if (lsVal !== null) letterSpacing = lsVal;

    const lhVal = extractValue(scss, 'line-height');
    if (lhVal !== null) lineHeight = lhVal;

    const gapVal = extractPx(scss, 'gap');
    if (gapVal !== null) gap = gapVal;

    const opacityVal = extractValue(scss, 'opacity');
    if (opacityVal !== null) opacity = parseFloat(opacityVal);

    // ── Padding ───────────────────────────────────────────
    // Try 4-value first, then 2-value
    const p4 = scss.match(/padding:\s*([0-9]+)px\s+([0-9]+)px\s+([0-9]+)px\s+([0-9]+)px/);
    const p2 = scss.match(/padding:\s*([0-9]+)px\s+([0-9]+)px/);
    if (p4) {
      padding = { top: +p4[1], right: +p4[2], bottom: +p4[3], left: +p4[4] };
    } else if (p2) {
      padding = { top: +p2[1], right: +p2[2], bottom: +p2[1], left: +p2[2] };
    } else {
      // Try individual padding properties
      const pt = extractPx(scss, 'padding-top');
      const pr = extractPx(scss, 'padding-right');
      const pb = extractPx(scss, 'padding-bottom');
      const pl = extractPx(scss, 'padding-left');
      if (pt !== null) padding.top    = pt;
      if (pr !== null) padding.right  = pr;
      if (pb !== null) padding.bottom = pb;
      if (pl !== null) padding.left   = pl;
    }

    // ── Dimensions ───────────────────────────────────────
    const wVal = extractPx(scss, 'width');
    if (wVal !== null) width = wVal;
    const hVal = extractPx(scss, 'height');
    if (hVal !== null) height = hVal;

    // ── Colors ────────────────────────────────────────────
    const bgMatch = scss.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6}|rgb[^;]+)/);
    if (bgMatch) {
      const hex = bgMatch[1];
      if (hex.startsWith('#')) backgroundColor = hexToFigmaRgb(hex);
    }

    const colorMatch = scss.match(/(?:^|[^-])color:\s*(#[0-9a-fA-F]{3,6})/m);
    if (colorMatch) textColor = hexToFigmaRgb(colorMatch[1]);

    const borderMatch = scss.match(/border(?:-color)?:\s*.*?(#[0-9a-fA-F]{3,6})/);
    if (borderMatch) borderColor = hexToFigmaRgb(borderMatch[1]);
  }

  // ── Parse TSX for additional hints ───────────────────────
  if (tsxFile) {
    const tsx = fs.readFileSync(path.join(dirPath, tsxFile), 'utf8');
    // Check if component has children (text nodes)
    const hasChildren = tsx.includes('children');
    const hasText = tsx.includes('<span') || tsx.includes('<p ') || tsx.includes('<label');
    // Extract default variant/size from destructuring
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

module.exports = { findFigmaNodeId, parseComponentDir };
