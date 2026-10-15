import 'dotenv/config'; 
import fs from 'fs';
import path from 'path';

const token = process.env.FIGMA_PERSONAL_ACCESS_TOKEN?.trim();
const fileKey = process.env.FIGMA_FILE_KEY || process.env.FIGMA_DESIGN_FILE_KEY || 'CXxUbHl3oMzt9Bzv3SKv75';
const syncIntervalMs = 60_000;

const jsonDir = path.join(process.cwd(), 'src', 'style', 'json');
const scssDir = path.join(process.cwd(), 'src', 'style', 'scss');

type FigmaVariable = {
  name?: string;
  variableCollectionId?: string;
  resolvedType?: string;
  valuesByMode?: Record<string, unknown>;
};

type FigmaVariableCollection = {
  id: string;
  name: string;
  defaultModeId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeScssVariableName(name: string): string {
  const cleaned = name
    .replace(/[\/\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  if (!cleaned) {
    return 'token';
  }

  return /^[0-9]/.test(cleaned) ? `token-${cleaned}` : cleaned;
}

async function fetchFigmaVariables() {
  if (!token) {
    throw new Error('FIGMA_PERSONAL_ACCESS_TOKEN is missing. Add it to the local .env file or shell environment.');
  }

  console.log('🚀 Fetching variables from Figma API...');
  
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }

  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
    headers: {
      'X-Figma-Token': token
    }
  });

  if (!response.ok) {
    throw new Error(`Figma API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const savePath = path.join(jsonDir, 'figma-variables.tokens.json');

  fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`📥 Downloaded Figma variables to: ${savePath}`);
}

function processFigmaVariables() {
  const jsonPath = path.join(jsonDir, 'figma-variables.tokens.json');
  if (!fs.existsSync(jsonPath)) {
    console.log(`ℹ️ No JSON file found at ${jsonPath}`);
    return;
  }

  if (!fs.existsSync(scssDir)) {
    fs.mkdirSync(scssDir, { recursive: true });
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);
  const variables = data?.meta?.variables as Record<string, FigmaVariable> | undefined;
  const variableCollections = (data?.meta?.variableCollections ?? {}) as Record<string, FigmaVariableCollection>;

  if (!variables) {
    console.log('⚠️ No variables found in Figma JSON.');
    return;
  }

  const idToNameMap = new Map<string, string>();
  const groupOrder = ['global', 'font', 'spacing', 'radius', 'border', 'size', 'button', 'forms', 'icon', 'text', 'surface', 'feedback', 'shadow', 'component', 'misc'];
  const groupLabels: Record<string, string> = {
    global: 'Global tokens',
    font: 'Font tokens',
    spacing: 'Spacing tokens',
    radius: 'Radius tokens',
    border: 'Border tokens',
    size: 'Size tokens',
    button: 'Button tokens',
    forms: 'Form tokens',
    icon: 'Icon tokens',
    text: 'Text tokens',
    surface: 'Surface tokens',
    feedback: 'Feedback tokens',
    shadow: 'Shadow tokens',
    component: 'Component tokens',
    misc: 'Misc tokens'
  };

  for (const id in variables) {
    const variable = variables[id];
    if (variable && variable.name) {
      const cleanName = normalizeScssVariableName(variable.name);
      idToNameMap.set(id, cleanName);
    }
  }

  const groupedLines = new Map<string, string[]>();
  const semanticValues = new Map<string, string>();
  const newSemanticColorValues = new Map<string, string>();
  const semanticCollectionCounts = new Map<string, number>();

  for (const variable of Object.values(variables)) {
    if (variable?.variableCollectionId) {
      semanticCollectionCounts.set(
        variable.variableCollectionId,
        (semanticCollectionCounts.get(variable.variableCollectionId) ?? 0) + 1
      );
    }
  }

  const semanticCollectionId = Object.values(variableCollections)
    .filter((collection) => collection.name === 'Semantics' && collection.id)
    .sort(
      (left, right) =>
        (semanticCollectionCounts.get(right.id) ?? 0) - (semanticCollectionCounts.get(left.id) ?? 0)
    )[0]?.id;

  if (!semanticCollectionId) {
    throw new Error('No Figma variable collection named "Semantics" was found.');
  }

  for (const id in variables) {
    const variable = variables[id];
    if (!variable || !variable.name) continue;

    const valuesByMode = variable.valuesByMode;
    if (!valuesByMode) continue;

    const modeIds = Object.keys(valuesByMode);
    if (modeIds.length === 0) continue;

    const collection = variableCollections[variable.variableCollectionId ?? ''];
    const defaultModeId = collection?.defaultModeId;
    const modeId = defaultModeId && Object.prototype.hasOwnProperty.call(valuesByMode, defaultModeId)
      ? defaultModeId
      : modeIds[0];
    const rawVal = valuesByMode[modeId];

    const cleanName = normalizeScssVariableName(variable.name);

    const groupKey = (variable.name.split('/')[0] || 'misc').toLowerCase();
    const groupName = Object.prototype.hasOwnProperty.call(groupLabels, groupKey) ? groupKey : 'misc';

    let finalVal = '';

    if (isRecord(rawVal)) {
      if (typeof rawVal.r === 'number' && typeof rawVal.g === 'number' && typeof rawVal.b === 'number') {
        const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
        finalVal = `#${toHex(rawVal.r)}${toHex(rawVal.g)}${toHex(rawVal.b)}`.toUpperCase();
      } else if (rawVal.type === 'VARIABLE_ALIAS' && typeof rawVal.id === 'string') {
        const referencedName = idToNameMap.get(rawVal.id);
        if (!referencedName) {
          console.warn(`⚠️ Skipping Figma variable "${variable.name}" because alias "${rawVal.id}" could not be resolved.`);
          continue;
        }
        finalVal = `var(--${referencedName})`;
      } else if (typeof rawVal.value !== 'undefined') {
        finalVal = toScssLiteral(rawVal.value, cleanName, idToNameMap);
      } else {
        finalVal = 'inherit';
      }
    } else {
      finalVal = toScssLiteral(rawVal, cleanName, idToNameMap);
    }

    if (variable.variableCollectionId === semanticCollectionId) {
      semanticValues.set(cleanName, finalVal);
      if (variable.resolvedType === 'COLOR') {
        newSemanticColorValues.set(cleanName, finalVal);
      }
    }

    const groupLines = groupedLines.get(groupName) ?? [];
    groupLines.push(`$${cleanName}: ${finalVal};`);
    groupedLines.set(groupName, groupLines);
  }

  const scssLines: string[] = ['// 🤖 Auto-generated SCSS variables from Figma API'];

  for (const groupKey of groupOrder) {
    const lines = groupedLines.get(groupKey);
    if (!lines || lines.length === 0) continue;

    scssLines.push('');
    scssLines.push(`// ${groupLabels[groupKey]}`);
    scssLines.push(...lines);
  }

  const remainingGroups = [...groupedLines.keys()].filter((key) => !groupOrder.includes(key));
  for (const groupKey of remainingGroups) {
    const lines = groupedLines.get(groupKey) ?? [];
    scssLines.push('');
    scssLines.push(`// ${groupLabels[groupKey] ?? groupKey}`);
    scssLines.push(...lines);
  }

  const scssPath = path.join(scssDir, 'figma-variables.scss');
  const content = `${scssLines.join('\n')}\n`;

  fs.writeFileSync(scssPath, content, 'utf-8');
  console.log(`✅ Generated SCSS file successfully: ${scssPath}`);

  updateSemanticTokens(semanticValues, newSemanticColorValues);
}

function updateSemanticTokens(
  semanticValues: Map<string, string>,
  newSemanticColorValues: Map<string, string>
): void {
  const semanticPath = path.join(scssDir, 'variables', 'semantics.scss');
  if (!fs.existsSync(semanticPath)) {
    throw new Error(`Semantic token file not found: ${semanticPath}`);
  }

  let content = fs.readFileSync(semanticPath, 'utf-8');
  let updatedCount = 0;
  const newEntries: string[] = [];

  for (const [name, value] of semanticValues) {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const entryPattern = new RegExp(`(^\\s*"${escapedName}"\\s*:\\s*)([^,\\r\\n]+)(,?)`, 'm');
    if (!entryPattern.test(content)) {
      const colorValue = newSemanticColorValues.get(name);
      if (colorValue !== undefined) {
        newEntries.push(`  "${name}": ${colorValue}`);
      }
      continue;
    }

    content = content.replace(
      entryPattern,
      (_match, prefix: string, _currentValue: string, comma: string) => `${prefix}${value}${comma}`
    );
    updatedCount++;
  }

  if (updatedCount === 0 && newEntries.length === 0) {
    throw new Error(`No Figma semantic tokens matched entries in ${semanticPath}`);
  }

  if (newEntries.length > 0) {
    const insertionPattern = /(^\s*"[^"]+"\s*:\s*[^,\r\n]+)(,?)(\s*\n\);)/m;
    if (!insertionPattern.test(content)) {
      throw new Error(`Could not find the end of the semantic token map in ${semanticPath}`);
    }

    content = content.replace(
      insertionPattern,
      (_match, finalEntry: string, comma: string, close: string) =>
        `${finalEntry}${comma || ','}\n${newEntries.join(',\n')}${close}`
    );
  }

  fs.writeFileSync(semanticPath, content, 'utf-8');
  console.log(`✅ Updated ${updatedCount} semantic tokens and added ${newEntries.length} new color tokens in: ${semanticPath}`);
}

function toScssLiteral(rawVal: unknown, cleanName: string, idToNameMap: Map<string, string>): string {
  if (typeof rawVal === 'string') {
    if (rawVal.startsWith('var(') || rawVal.startsWith('#') || rawVal.startsWith('rgb') || rawVal.startsWith('hsl')) {
      return rawVal;
    }
    return JSON.stringify(rawVal);
  }

  if (typeof rawVal === 'number') {
    const needsPx = /height|width|padding|margin|radius|size|gap|spacing|top|bottom|left|right|font|line|border/i.test(cleanName);
    if (Number.isFinite(rawVal) && needsPx && !Number.isInteger(rawVal)) {
      return `${rawVal}px`;
    }
    if (Number.isFinite(rawVal) && needsPx && Number.isInteger(rawVal)) {
      return `${rawVal}px`;
    }
    return String(rawVal);
  }

  if (typeof rawVal === 'boolean') {
    return rawVal ? 'true' : 'false';
  }

  if (Array.isArray(rawVal)) {
    return rawVal.map((value): string => toScssLiteral(value, cleanName, idToNameMap)).join(', ');
  }

  if (typeof rawVal === 'object' && rawVal !== null && 'id' in rawVal && rawVal.id && 'type' in rawVal && rawVal.type === 'VARIABLE_ALIAS') {
    const referencedName = idToNameMap.get(String(rawVal.id));
    if (!referencedName) {
      console.warn(`⚠️ Unresolved Figma variable alias "${String(rawVal.id)}" for "${cleanName}".`);
      return 'inherit';
    }
    return `var(--${referencedName})`;
  }

  return JSON.stringify(String(rawVal));
}

async function syncTokens() {
  await fetchFigmaVariables();
  processFigmaVariables();
}

async function main() {
  await syncTokens();

  if (process.argv.includes('--watch')) {
    console.log(`👀 Watching Figma variables; syncing every ${syncIntervalMs / 1000} seconds.`);
    setInterval(() => {
      void syncTokens().catch((error: unknown) => {
        console.error('❌ Figma token sync failed:', error);
      });
    }, syncIntervalMs);
  }
}

void main().catch((error: unknown) => {
  console.error('❌ Figma token sync failed:', error);
  process.exitCode = 1;
});