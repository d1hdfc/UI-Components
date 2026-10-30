'use strict';

const fs = require('node:fs');
const path = require('node:path');

const COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components');
const CATALOG_PATH = path.join(process.cwd(), 'src', 'figma', 'components.json');
const MCP_CONFIG_PATH = path.join(process.cwd(), '.mcp', 'config.json');

/**
 * Find nodeId in Figma catalog or MCP config
 */
function findFigmaNodeId(componentName, folder) {
  // Check MCP config
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
        if (found && found.nodeId) return found.nodeId;
      }
    } catch {
      // ignore
    }
  }

  // Check Figma components catalog
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
      if (Array.isArray(catalog.components)) {
        const found = catalog.components.find(
          c =>
            c.name.toLowerCase() === componentName.toLowerCase() ||
            c.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === componentName.toLowerCase()
        );
        if (found) return found.nodeId;
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Parse a component directory
 */
function parseComponentDir(componentFolder) {
  const dirPath = path.isAbsolute(componentFolder)
    ? componentFolder
    : path.join(COMPONENTS_DIR, componentFolder);

  if (!fs.existsSync(dirPath)) {
    const folder = path.basename(dirPath);
    return {
      isDeleted: true,
      folder,
      componentName: folder.charAt(0).toUpperCase() + folder.slice(1),
      nodeId: findFigmaNodeId(folder, folder)
    };
  }

  const files = fs.readdirSync(dirPath);
  const tsxFile = files.find(f => f.endsWith('.tsx') && !f.endsWith('.test.tsx'));
  const componentName = tsxFile ? path.basename(tsxFile, '.tsx') : path.basename(dirPath);
  const folder = path.basename(dirPath);
  const nodeId = findFigmaNodeId(componentName, folder);

  let variants = [];
  let sizes = [];
  let padding = { top: 10, right: 16, bottom: 10, left: 16 };
  let cornerRadius = 8;
  let backgroundColor = { r: 0.047, g: 0.137, b: 0.251 }; // #0c2340

  // Parse types file
  const typesFile = files.find(f => f.endsWith('.types.ts'));
  if (typesFile) {
    const typesContent = fs.readFileSync(path.join(dirPath, typesFile), 'utf8');
    const variantMatch = typesContent.match(/type\s+\w+Variant\s*=\s*([^;]+);/);
    if (variantMatch) {
      variants = variantMatch[1]
        .split('|')
        .map(v => v.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    }
    const sizeMatch = typesContent.match(/type\s+\w+Size\s*=\s*([^;]+);/);
    if (sizeMatch) {
      sizes = sizeMatch[1]
        .split('|')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    }
  }

  // Parse SCSS file for styles
  const scssFile = files.find(f => f.endsWith('.scss'));
  if (scssFile) {
    const scssContent = fs.readFileSync(path.join(dirPath, scssFile), 'utf8');

    const radiusMatch = scssContent.match(/border-radius:\s*([0-9]+)px/);
    if (radiusMatch) {
      cornerRadius = parseInt(radiusMatch[1], 10);
    }

    const paddingMatch = scssContent.match(/padding:\s*([0-9]+)px\s+([0-9]+)px/);
    if (paddingMatch) {
      padding = {
        top: parseInt(paddingMatch[1], 10),
        right: parseInt(paddingMatch[2], 10),
        bottom: parseInt(paddingMatch[1], 10),
        left: parseInt(paddingMatch[2], 10)
      };
    }
  }

  return {
    isDeleted: false,
    folder,
    componentName,
    nodeId,
    variants,
    sizes,
    cornerRadius,
    padding,
    backgroundColor,
    files
  };
}

module.exports = {
  findFigmaNodeId,
  parseComponentDir
};

