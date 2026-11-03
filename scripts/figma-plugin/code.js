// ============================================================
// HDFC UI Components — Figma Plugin Sandbox (code.js)
// Full Bi-Directional Sync: Code ↔ Figma Canvas
// Compatible with "documentAccess": "dynamic-page"
// ============================================================
figma.showUI(__html__, { width: 420, height: 540 });

const LOG_PREFIX = '[HDFC Plugin]';

// ── Helpers ─────────────────────────────────────────────────

function log(msg) {
  console.log(`${LOG_PREFIX} ${msg}`);
  figma.ui.postMessage({ type: 'LOG', message: msg });
}

function normalizeName(str) {
  return String(str || '').trim().toLowerCase().replace(/[-_\s]+/g, '');
}

function getPageOfNode(node) {
  let curr = node;
  while (curr && curr.type !== 'PAGE') {
    curr = curr.parent;
  }
  return curr;
}

/**
 * Find a node by Figma nodeId or by exact/fuzzy name match.
 * Uses async APIs required by "documentAccess": "dynamic-page".
 */
async function findNode(nodeId, name) {
  // 1. Try exact nodeId via getNodeByIdAsync
  if (nodeId) {
    try {
      const n = await figma.getNodeByIdAsync(nodeId);
      if (n && n.type !== 'DOCUMENT' && n.type !== 'PAGE') {
        return n;
      }
    } catch {
      // Ignore invalid nodeId
    }
  }

  const targetClean = normalizeName(name);
  if (!targetClean) return null;

  // 2. Check current selection first if user selected the component
  for (const sel of figma.currentPage.selection) {
    if (normalizeName(sel.name) === targetClean && sel.type !== 'TEXT') {
      return sel;
    }
    if (sel.parent && normalizeName(sel.parent.name) === targetClean && sel.parent.type === 'COMPONENT_SET') {
      return sel.parent;
    }
  }

  // Helper to search a page prioritizing COMPONENT_SET and COMPONENT over other nodes
  const searchContainer = (container) => {
    try {
      const compSet = container.findOne(
        n => n.type === 'COMPONENT_SET' && normalizeName(n.name) === targetClean
      );
      if (compSet) return compSet;

      const comp = container.findOne(
        n => n.type === 'COMPONENT' && normalizeName(n.name) === targetClean
      );
      if (comp) return comp;

      const frame = container.findOne(
        n => (n.type === 'FRAME' || n.type === 'INSTANCE') && normalizeName(n.name) === targetClean
      );
      if (frame) return frame;
    } catch {
      // Ignore search errors
    }
    return null;
  };

  // 3. Search current page
  const onCurrentPage = searchContainer(figma.currentPage);
  if (onCurrentPage) return onCurrentPage;

  // 4. Load all pages for dynamic-page mode and search every page
  try {
    await figma.loadAllPagesAsync();
    for (const page of figma.root.children) {
      if (page.id === figma.currentPage.id) continue;
      // If a page itself is named after the component (e.g. Page "Button"), check its children
      const found = searchContainer(page);
      if (found) return found;
    }
  } catch (e) {
    log(`⚠ Could not search all pages: ${e.message}`);
  }

  return null;
}

function unbindVariable(node, field) {
  try {
    if ('boundVariables' in node && node.boundVariables && node.boundVariables[field]) {
      node.setBoundVariable(field, null);
    }
  } catch {
    // Ignore if field cannot be unbound
  }
}

function findAllTextChildren(node) {
  const results = [];
  function walk(n) {
    if (!n) return;
    if (n.type === 'TEXT') {
      results.push(n);
      return;
    }
    if ('children' in n && Array.isArray(n.children)) {
      for (const child of n.children) walk(child);
    }
  }
  walk(node);
  return results;
}

async function loadTextNodeFonts(textNode) {
  if (textNode.fontName === figma.mixed) {
    const len = textNode.characters.length;
    if (len > 0) {
      const fonts = textNode.getRangeAllFontNames(0, len);
      for (const f of fonts) {
        await figma.loadFontAsync(f);
      }
    } else {
      await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    }
  } else if (textNode.fontName) {
    await figma.loadFontAsync(textNode.fontName);
  }
}

/** Safely load fonts, clear linked textStyleId/boundVariables, and update TEXT children */
async function applyFontSize(node, fontSize) {
  if (!fontSize || typeof fontSize !== 'number' || fontSize <= 0) return 0;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  let updatedCount = 0;

  for (const textNode of textNodes) {
    try {
      await loadTextNodeFonts(textNode);
      if (textNode.textStyleId && textNode.textStyleId !== '') {
        try {
          await textNode.setTextStyleIdAsync('');
        } catch {
          // Ignore
        }
      }
      unbindVariable(textNode, 'fontSize');
      textNode.fontSize = fontSize;
      updatedCount++;
    } catch (e) {
      log(`  ⚠ Could not set fontSize on "${textNode.name}": ${e.message}`);
    }
  }
  return updatedCount;
}

async function applyFontWeight(node, fontWeight) {
  if (fontWeight === null || fontWeight === undefined) return;
  const style = fontWeight === 700 || fontWeight === 'bold' ? 'Bold'
    : fontWeight === 600 || fontWeight === 'semibold' ? 'Semi Bold'
      : fontWeight === 500 || fontWeight === 'medium' ? 'Medium'
        : 'Regular';
  const fallbackStyle = style === 'Semi Bold' ? 'SemiBold' : style;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);

  for (const textNode of textNodes) {
    try {
      await loadTextNodeFonts(textNode);
      const family = textNode.fontName !== figma.mixed && textNode.fontName?.family
        ? textNode.fontName.family
        : 'Inter';
      if (textNode.textStyleId && textNode.textStyleId !== '') {
        try { await textNode.setTextStyleIdAsync(''); } catch {}
      }
      unbindVariable(textNode, 'fontWeight');
      unbindVariable(textNode, 'fontStyle');
      try {
        const newFont = { family, style };
        await figma.loadFontAsync(newFont);
        textNode.fontName = newFont;
      } catch {
        const altFont = { family, style: fallbackStyle };
        await figma.loadFontAsync(altFont);
        textNode.fontName = altFont;
      }
    } catch {
      // Ignore if specific font style is not installed
    }
  }
}

function applyFills(node, color) {
  if (!color || typeof color !== 'object') return;
  if ('fills' in node) {
    try {
      unbindVariable(node, 'fills');
      node.fills = [{
        type: 'SOLID',
        color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 }
      }];
    } catch {}
  }
}

function applyStrokes(node, color) {
  if (!color || typeof color !== 'object') return;
  if ('strokes' in node) {
    try {
      unbindVariable(node, 'strokes');
      node.strokes = [{
        type: 'SOLID',
        color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 }
      }];
    } catch {}
  }
}

function applyTextColor(node, color) {
  if (!color || typeof color !== 'object') return;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  for (const t of textNodes) {
    try {
      unbindVariable(t, 'fills');
      t.fills = [{
        type: 'SOLID',
        color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 }
      }];
    } catch {}
  }
}

function applyCornerRadius(node, radius) {
  if (radius === undefined || radius === null || typeof radius !== 'number') return;
  if ('cornerRadius' in node) {
    try {
      unbindVariable(node, 'cornerRadius');
      unbindVariable(node, 'topLeftRadius');
      unbindVariable(node, 'topRightRadius');
      unbindVariable(node, 'bottomLeftRadius');
      unbindVariable(node, 'bottomRightRadius');
      node.cornerRadius = radius;
    } catch {}
  }
}

function applyPadding(node, padding) {
  if (!padding || typeof padding !== 'object') return;
  if ('paddingLeft' in node) {
    try {
      if (padding.left !== undefined) {
        unbindVariable(node, 'paddingLeft');
        node.paddingLeft = padding.left;
      }
      if (padding.right !== undefined) {
        unbindVariable(node, 'paddingRight');
        node.paddingRight = padding.right;
      }
      if (padding.top !== undefined) {
        unbindVariable(node, 'paddingTop');
        node.paddingTop = padding.top;
      }
      if (padding.bottom !== undefined) {
        unbindVariable(node, 'paddingBottom');
        node.paddingBottom = padding.bottom;
      }
    } catch {}
  }
}

function applyGap(node, gap) {
  if (gap === null || gap === undefined || typeof gap !== 'number') return;
  if ('itemSpacing' in node) {
    try {
      unbindVariable(node, 'itemSpacing');
      node.itemSpacing = gap;
    } catch {}
  }
}

function applyOpacity(node, opacity) {
  if (opacity === null || opacity === undefined || typeof opacity !== 'number') return;
  if ('opacity' in node) {
    try {
      unbindVariable(node, 'opacity');
      node.opacity = Math.max(0, Math.min(1, opacity));
    } catch {}
  }
}

function applyDimensions(node, width, height) {
  if (!('resize' in node)) return;
  try {
    const targetW = (width && typeof width === 'number' && width > 0) ? width : node.width;
    const targetH = (height && typeof height === 'number' && height > 0) ? height : node.height;
    if (height && typeof height === 'number' && height > 0) {
      unbindVariable(node, 'height');
    }
    if (width && typeof width === 'number' && width > 0) {
      unbindVariable(node, 'width');
    }
    if (targetW !== node.width || targetH !== node.height) {
      node.resize(targetW, targetH);
    }
  } catch {}
}

/**
 * Parse Figma variant name like "size=Large, style=Primary, state=Default, type=Default"
 * into a lowercase key-value map: { size: 'large', style: 'primary', state: 'default', type: 'default' }
 */
function parseVariantName(name) {
  const props = {};
  const parts = String(name || '').split(',');
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      const k = part.slice(0, eq).trim().toLowerCase();
      const v = part.slice(eq + 1).trim().toLowerCase();
      props[k] = v;
    }
  }
  return props;
}

// ── Main message handler ─────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  if (!msg?.type) return;
  log(`Received: ${msg.type}`);

  switch (msg.type) {

    // ── DELETE component from canvas ────────────────────────
    case 'ACTION_DELETE_COMPONENT': {
      const { nodeId, componentName } = msg.payload || {};
      const node = await findNode(nodeId, componentName);
      if (node) {
        const name = node.name;
        node.remove();
        figma.notify(`🗑️ Deleted "${name}" from Figma canvas`);
        log(`DELETED: "${name}" (nodeId=${nodeId || 'by-name'})`);
      } else {
        log(`DELETE: Node "${componentName}" not found on canvas`);
        figma.notify(`⚠️ Component "${componentName}" not found on canvas`);
      }
      break;
    }

    // ── UPDATE component on canvas ──────────────────────────
    case 'ACTION_UPDATE_COMPONENT': {
      const {
        nodeId, componentName,
        fontSize, fontWeight,
        cornerRadius, padding, backgroundColor, textColor, borderColor,
        opacity, width, height, gap,
        sizesMap, variantsMap,
      } = msg.payload || {};

      let node = await findNode(nodeId, componentName);

      if (!node) {
        // Create a new component frame on current page
        node = figma.createComponent();
        node.name = componentName || 'NewComponent';
        node.resize(width || 200, height || 48);
        node.layoutMode = 'HORIZONTAL';
        node.primaryAxisAlignItems = 'CENTER';
        node.counterAxisAlignItems = 'CENTER';
        node.paddingLeft = node.paddingRight = padding?.left ?? 16;
        node.paddingTop = node.paddingBottom = padding?.top ?? 10;
        figma.currentPage.appendChild(node);

        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        const txt = figma.createText();
        txt.characters = componentName || 'Component';
        txt.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        node.appendChild(txt);

        figma.notify(`✅ Created "${node.name}" on canvas`);
        log(`CREATED: "${node.name}" on canvas`);
      } else {
        const nodePage = getPageOfNode(node);
        if (nodePage && nodePage.id !== figma.currentPage.id) {
          try {
            await figma.setCurrentPageAsync(nodePage);
            log(`Switched to page "${nodePage.name}" for "${node.name}"`);
          } catch {}
        }
        log(`UPDATING: "${node.name}" (${node.type}, id=${node.id})`);
      }

      let updatedVariants = 0;
      let updatedTexts = 0;

      if (node.type === 'COMPONENT_SET' && 'children' in node) {
        // Apply per-size and per-variant styles to every variant COMPONENT child!
        const variantChildren = node.children.filter(c => c.type === 'COMPONENT');
        log(`Updating ${variantChildren.length} variant(s) inside COMPONENT_SET "${node.name}"...`);

        for (const variantNode of variantChildren) {
          const vProps = parseVariantName(variantNode.name);
          const sizeKey = vProps.size || vProps.sizes || '';
          const styleKey = vProps.style || vProps.variant || '';
          const stateKey = vProps.state || 'default';
          const typeKey = vProps.type || 'default';

          const sizeSpec = (sizesMap && sizeKey && sizesMap[sizeKey]) ? sizesMap[sizeKey] : null;
          const variantSpec = (variantsMap && styleKey && variantsMap[styleKey]) ? variantsMap[styleKey] : null;

          // 1. Dimensions & Layout from sizeSpec or fallback top-level props
          const vHeight = sizeSpec?.heightPx ?? height;
          const vRadius = sizeSpec?.radiusPx ?? cornerRadius;
          const vGap    = sizeSpec?.gapPx ?? gap;
          const vPadX   = sizeSpec?.paddingPx ?? padding?.left;
          const vFontSz = sizeSpec?.['font-sizePx'] ?? fontSize;

          if (vRadius !== null && vRadius !== undefined) {
            applyCornerRadius(variantNode, vRadius);
          }
          if (vPadX !== null && vPadX !== undefined && typeKey !== 'icon') {
            applyPadding(variantNode, {
              left: vPadX,
              right: vPadX,
              top: variantNode.paddingTop,
              bottom: variantNode.paddingBottom,
            });
          }
          if (vGap !== null && vGap !== undefined) {
            applyGap(variantNode, vGap);
          }
          if (vHeight !== null && vHeight !== undefined) {
            applyDimensions(variantNode, typeKey === 'icon' ? vHeight : null, vHeight);
          }

          // 2. Colors from variantSpec (for Default/Hover/Pressed/Disabled states)
          if (variantSpec && typeKey === 'default') {
            let bgRgb = variantSpec.backgroundRgb;
            let fgRgb = variantSpec.foregroundRgb;
            let bdRgb = variantSpec.borderRgb;

            if (stateKey === 'hover') {
              bgRgb = variantSpec['hover-backgroundRgb'] || bgRgb;
              fgRgb = variantSpec['hover-foregroundRgb'] || fgRgb;
              bdRgb = variantSpec['hover-borderRgb'] || bdRgb;
            } else if (stateKey === 'pressed' || stateKey === 'active') {
              bgRgb = variantSpec['active-backgroundRgb'] || bgRgb;
              fgRgb = variantSpec['active-foregroundRgb'] || fgRgb;
              bdRgb = variantSpec['active-borderRgb'] || bdRgb;
            } else if (stateKey === 'disabled') {
              bgRgb = variantSpec['disabled-backgroundRgb'] || bgRgb;
              fgRgb = variantSpec['disabled-foregroundRgb'] || fgRgb;
              bdRgb = variantSpec['disabled-borderRgb'] || bdRgb;
            }

            if (bgRgb) applyFills(variantNode, bgRgb);
            if (fgRgb) applyTextColor(variantNode, fgRgb);
            if (bdRgb) applyStrokes(variantNode, bdRgb);
          }

          // 3. Typography (fontSize & fontWeight) on all TEXT nodes in this variant
          if (vFontSz) {
            updatedTexts += await applyFontSize(variantNode, vFontSz);
          }
          if (fontWeight) {
            await applyFontWeight(variantNode, fontWeight);
          }

          updatedVariants++;
        }
      } else {
        // Single COMPONENT / FRAME / INSTANCE node
        applyCornerRadius(node, cornerRadius);
        applyPadding(node, padding);
        if (backgroundColor) applyFills(node, backgroundColor);
        if (textColor) applyTextColor(node, textColor);
        if (borderColor) applyStrokes(node, borderColor);
        applyOpacity(node, opacity);
        applyDimensions(node, width, height);
        applyGap(node, gap);

        if (fontSize) {
          updatedTexts += await applyFontSize(node, fontSize);
        }
        if (fontWeight) {
          await applyFontWeight(node, fontWeight);
        }
        updatedVariants = 1;
      }

      // Also if user has any other nodes selected on the canvas, update their text/styles too
      for (const sel of figma.currentPage.selection) {
        if (sel.id !== node.id && (!node.children || !node.children.some(c => c.id === sel.id))) {
          if (fontSize) {
            updatedTexts += await applyFontSize(sel, fontSize);
          }
        }
      }

      try {
        figma.viewport.scrollAndZoomIntoView([node]);
      } catch {}

      const summary = `fontSize=${fontSize ?? 'map'}px (${updatedVariants} variants, ${updatedTexts} text nodes)`;
      figma.notify(`✅ Updated "${node.name}" — ${summary}`);
      log(`UPDATED: "${node.name}" — ${summary}`);
      break;
    }

    // ── CAPTURE current selection ───────────────────────────
    case 'CAPTURE_SELECTION': {
      const selection = figma.currentPage.selection;
      if (!selection.length) {
        figma.notify('Please select at least one node first.');
        return;
      }
      const items = selection.map(n => ({
        id: n.id,
        name: n.name,
        type: n.type,
        width: n.width,
        height: n.height,
        cornerRadius: 'cornerRadius' in n && typeof n.cornerRadius === 'number' ? n.cornerRadius : 0,
        layoutMode: 'layoutMode' in n ? n.layoutMode : 'NONE',
        fontSize: findAllTextChildren(n)[0]?.fontSize ?? null,
      }));
      figma.ui.postMessage({ type: 'SELECTION_CAPTURED', payload: items });
      log(`Captured ${items.length} selected node(s)`);
      break;
    }

    // ── PUSH selection to code (Figma → Code) ───────────────
    case 'PUSH_SELECTION_TO_CODE': {
      const selection = figma.currentPage.selection;
      if (!selection.length) {
        figma.notify('Select a component first.');
        return;
      }
      const items = selection.map(n => ({
        id: n.id,
        name: n.name,
        type: n.type,
        width: n.width,
        height: n.height,
        cornerRadius: 'cornerRadius' in n && typeof n.cornerRadius === 'number' ? n.cornerRadius : 0,
        fontSize: findAllTextChildren(n)[0]?.fontSize ?? null,
      }));
      figma.ui.postMessage({ type: 'FIGMA_SELECTION_PUSH', items });
      figma.notify(`📤 Pushed ${items.length} component(s) to sync server`);
      log(`PUSH_SELECTION: ${items.map(i => i.name).join(', ')}`);
      break;
    }

    default:
      log(`Unknown message type: ${msg.type}`);
      break;
  }
};
