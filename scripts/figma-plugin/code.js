// ============================================================
// HDFC UI Components — Figma Plugin Sandbox (code.js)
// Full Bi-Directional Sync: Code ↔ Figma Canvas
// ============================================================
figma.showUI(__html__, { width: 400, height: 520 });

const LOG_PREFIX = '[HDFC Plugin]';

// ── Helpers ─────────────────────────────────────────────────

function log(msg) {
  console.log(`${LOG_PREFIX} ${msg}`);
  figma.ui.postMessage({ type: 'LOG', message: msg });
}

/** Find a node by Figma nodeId or by exact/fuzzy name match */
function findNode(nodeId, name) {
  if (nodeId) {
    try {
      const n = figma.getNodeById(nodeId);
      if (n) return n;
    } catch { /* ignore invalid id */ }
  }
  if (name) {
    const clean = name.trim().toLowerCase();
    // Search current page first, then all pages
    const found = figma.currentPage.findOne(n => n.name.trim().toLowerCase() === clean)
      || figma.root.findOne(n => n.name.trim().toLowerCase() === clean);
    return found || null;
  }
  return null;
}

/** Safely load fonts and update all TEXT children of a node */
async function applyFontSize(node, fontSize) {
  if (!fontSize || typeof fontSize !== 'number') return;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  for (const textNode of textNodes) {
    try {
      await figma.loadFontAsync(textNode.fontName);
      textNode.fontSize = fontSize;
      log(`  → fontSize=${fontSize}px applied to "${textNode.name}"`);
    } catch (e) {
      log(`  ⚠ Could not load font for "${textNode.name}": ${e.message}`);
    }
  }
}

async function applyFontWeight(node, fontWeight) {
  if (fontWeight === null || fontWeight === undefined) return;
  const style = fontWeight === 700 || fontWeight === 'bold' ? 'Bold'
    : fontWeight === 600 ? 'SemiBold'
    : fontWeight === 500 ? 'Medium'
    : 'Regular';
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  for (const textNode of textNodes) {
    try {
      const newFont = { family: textNode.fontName.family, style };
      await figma.loadFontAsync(newFont);
      textNode.fontName = newFont;
      log(`  → fontWeight=${fontWeight} (${style}) applied to "${textNode.name}"`);
    } catch (e) {
      log(`  ⚠ fontWeight not applied to "${textNode.name}": ${e.message}`);
    }
  }
}

function findAllTextChildren(node) {
  const results = [];
  function walk(n) {
    if (n.type === 'TEXT') { results.push(n); return; }
    if ('children' in n) n.children.forEach(walk);
  }
  walk(node);
  return results;
}

function applyFills(node, color) {
  if (!color || typeof color !== 'object') return;
  if ('fills' in node) {
    node.fills = [{ type: 'SOLID', color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 } }];
  }
}

function applyTextColor(node, color) {
  if (!color) return;
  const textNodes = node.type === 'TEXT' ? [node] : findAllTextChildren(node);
  for (const t of textNodes) {
    t.fills = [{ type: 'SOLID', color: { r: color.r ?? 0, g: color.g ?? 0, b: color.b ?? 0 } }];
  }
}

function applyCornerRadius(node, radius) {
  if (radius === undefined || radius === null) return;
  if ('cornerRadius' in node) node.cornerRadius = radius;
}

function applyPadding(node, padding) {
  if (!padding) return;
  if ('paddingLeft' in node) {
    node.paddingLeft   = padding.left   ?? 16;
    node.paddingRight  = padding.right  ?? 16;
    node.paddingTop    = padding.top    ?? 10;
    node.paddingBottom = padding.bottom ?? 10;
  }
}

function applyOpacity(node, opacity) {
  if (opacity === null || opacity === undefined) return;
  if ('opacity' in node) node.opacity = Math.max(0, Math.min(1, opacity));
}

function applyDimensions(node, width, height) {
  if (width && 'resize' in node) node.resize(width, node.height);
  if (height && 'resize' in node) node.resize(node.width, height);
}

// ── Main message handler ─────────────────────────────────────

figma.ui.onmessage = async (msg) => {
  if (!msg?.type) return;
  log(`Received: ${msg.type}`);

  switch (msg.type) {

    // ── DELETE component from canvas ────────────────────────
    case 'ACTION_DELETE_COMPONENT': {
      const { nodeId, componentName } = msg.payload || {};
      const node = findNode(nodeId, componentName);
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
        fontSize, fontWeight, letterSpacing, lineHeight,
        cornerRadius, padding, backgroundColor, textColor, borderColor,
        opacity, width, height, gap,
        sizesMap, variantsMap,
      } = msg.payload || {};

      let node = findNode(nodeId, componentName);

      if (!node) {
        // Create a new component frame
        node = figma.createComponent();
        node.name = componentName || 'NewComponent';
        node.resize(200, 56);
        node.layoutMode = 'HORIZONTAL';
        node.primaryAxisAlignItems = 'CENTER';
        node.counterAxisAlignItems = 'CENTER';
        node.paddingLeft = node.paddingRight = 16;
        node.paddingTop  = node.paddingBottom = 10;
        figma.currentPage.appendChild(node);

        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        const txt = figma.createText();
        txt.characters = componentName || 'Component';
        txt.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        node.appendChild(txt);

        figma.notify(`✅ Created "${node.name}" on canvas`);
        log(`CREATED: "${node.name}" on canvas`);
      } else {
        log(`UPDATING: "${node.name}" on canvas`);
      }

      // ── Apply all style updates ─────────────────────────
      applyCornerRadius(node, cornerRadius);
      applyPadding(node, padding);
      if (backgroundColor) applyFills(node, backgroundColor);
      if (textColor) applyTextColor(node, textColor);
      applyOpacity(node, opacity);
      applyDimensions(node, width, height);

      // Typography — most important for Code→Figma sync
      if (fontSize)   await applyFontSize(node, fontSize);
      if (fontWeight) await applyFontWeight(node, fontWeight);

      // Gap for auto-layout
      if (gap !== null && gap !== undefined && 'itemSpacing' in node) {
        node.itemSpacing = gap;
      }

      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`✅ Updated "${node.name}" — ${fontSize ? `font-size: ${fontSize}px` : 'styles applied'}`);
      log(`UPDATED: "${node.name}" — fontSize=${fontSize}, cornerRadius=${cornerRadius}, padding=${JSON.stringify(padding)}`);
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
        cornerRadius: 'cornerRadius' in n ? n.cornerRadius : 0,
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
        cornerRadius: 'cornerRadius' in n ? n.cornerRadius : 0,
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
