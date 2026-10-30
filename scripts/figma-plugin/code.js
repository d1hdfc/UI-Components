// Figma Plugin Sandbox Main Thread Script
figma.showUI(__html__, { width: 380, height: 480 });

function findNode(nodeId, name) {
  if (nodeId) {
    const node = figma.getNodeById(nodeId);
    if (node) return node;
  }
  if (name) {
    const cleanName = name.trim().toLowerCase();
    return figma.currentPage.findOne(
      (n) => n.name.trim().toLowerCase() === cleanName
    );
  }
  return null;
}

figma.ui.onmessage = async (msg) => {
  if (!msg || !msg.type) return;

  switch (msg.type) {
    case 'ACTION_DELETE_COMPONENT': {
      const { nodeId, componentName } = msg.payload || {};
      const node = findNode(nodeId, componentName);
      if (node) {
        const targetName = node.name;
        node.remove();
        figma.notify(`Deleted "${targetName}" from Figma canvas`);
        figma.ui.postMessage({
          type: 'LOG',
          message: `Canvas delete: Removed "${targetName}" (${nodeId || 'by name'})`
        });
      } else {
        figma.ui.postMessage({
          type: 'LOG',
          message: `Canvas delete: Node "${componentName}" not found on canvas`
        });
      }
      break;
    }

    case 'ACTION_UPDATE_COMPONENT': {
      const {
        nodeId,
        componentName,
        cornerRadius,
        padding,
        backgroundColor
      } = msg.payload || {};

      let node = findNode(nodeId, componentName);

      if (!node) {
        // Create new component if not found
        node = figma.createComponent();
        node.name = componentName || 'NewComponent';
        node.resize(160, 48);
        node.layoutMode = 'HORIZONTAL';
        node.primaryAxisAlignItems = 'CENTER';
        node.counterAxisAlignItems = 'CENTER';
        figma.currentPage.appendChild(node);

        // Add default text child
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        const text = figma.createText();
        text.characters = componentName || 'Component';
        text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        node.appendChild(text);

        figma.notify(`Created "${node.name}" on Figma canvas`);
      }

      // Apply styling updates
      if (backgroundColor && typeof backgroundColor === 'object') {
        node.fills = [
          {
            type: 'SOLID',
            color: {
              r: backgroundColor.r ?? 0.05,
              g: backgroundColor.g ?? 0.14,
              b: backgroundColor.b ?? 0.25
            }
          }
        ];
      }

      if (cornerRadius !== undefined && 'cornerRadius' in node) {
        node.cornerRadius = cornerRadius;
      }

      if (padding && 'paddingLeft' in node) {
        node.paddingLeft = padding.left ?? 16;
        node.paddingRight = padding.right ?? 16;
        node.paddingTop = padding.top ?? 10;
        node.paddingBottom = padding.bottom ?? 10;
      }

      figma.viewport.scrollAndZoomIntoView([node]);
      figma.notify(`Updated "${node.name}" on Figma canvas`);
      figma.ui.postMessage({
        type: 'LOG',
        message: `Canvas update: Applied changes to "${node.name}"`
      });
      break;
    }

    case 'CAPTURE_SELECTION': {
      const selection = figma.currentPage.selection;
      if (!selection.length) {
        figma.notify('Please select at least one node on the canvas.');
        return;
      }

      const items = selection.map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        width: n.width,
        height: n.height,
        cornerRadius: 'cornerRadius' in n ? n.cornerRadius : 0,
        layoutMode: 'layoutMode' in n ? n.layoutMode : 'NONE'
      }));

      figma.ui.postMessage({
        type: 'SELECTION_CAPTURED',
        payload: items
      });
      break;
    }

    default:
      break;
  }
};
