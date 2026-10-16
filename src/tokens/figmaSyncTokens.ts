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
  modes?: Array<{ modeId: string; name: string }>;
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

  return cleaned || 'token';
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
    throw new Error(`Figma variables JSON file not found: ${jsonPath}`);
  }

  if (!fs.existsSync(scssDir)) {
    fs.mkdirSync(scssDir, { recursive: true });
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(rawData);
  const variables = data?.meta?.variables as Record<string, FigmaVariable> | undefined;
  const variableCollections = (data?.meta?.variableCollections ?? {}) as Record<string, FigmaVariableCollection>;

  if (!variables || Object.keys(variables).length === 0) {
    throw new Error('No Figma variables found in the local variables JSON.');
  }
  currentVariables = variables;
  currentCollections = variableCollections;

  const variableById = new Map(Object.entries(variables));
  const collections = Object.values(variableCollections);
  const idToNameMap = new Map<string, string>();
  for (const id in variables) {
    const variable = variables[id];
    if (variable && variable.name) {
      const collectionName = variableCollections[variable.variableCollectionId ?? '']?.name.toLowerCase();
      let cssName = normalizeScssVariableName(variable.name);
      if (collectionName === 'layout') {
        cssName = `layout-${cssName}`;
      } else if (collectionName === 'adaptive' && cssName.startsWith('responsive-')) {
        cssName = `global-${cssName.slice('responsive-'.length)}`;
      }
      idToNameMap.set(id, cssName);
    }
  }

  const targetCollectionNames = [
    'Primitives',
    'Alias',
    'Semantics',
    'layout',
    'Adaptive',
    'Primitive-type',
    'Platform'
  ];
  const selectedCollections = new Map(
    targetCollectionNames.map((name) => [name, findCollection(name, collections, variables)])
  );
  const updates = new Map<string, string>();

  const generatedVariables = generateFigmaVariableScss(variables, variableCollections, idToNameMap);
  updates.set(path.join(scssDir, 'figma-variables.scss'), generatedVariables);

  const primitivePath = path.join(scssDir, 'variables', 'primitives.scss');
  let primitiveContent = readTargetFile(primitivePath);
  primitiveContent = updatePrimitives(
    primitiveContent,
    selectedCollections.get('Primitives')!,
    variables,
    idToNameMap
  );
  updates.set(primitivePath, primitiveContent);

  const aliasPath = path.join(scssDir, 'variables', 'alias.scss');
  let aliasContent = readTargetFile(aliasPath);
  aliasContent = updateAlias(aliasContent, selectedCollections.get('Alias')!, idToNameMap);
  updates.set(aliasPath, aliasContent);

  const semanticPath = path.join(scssDir, 'variables', 'semantics.scss');
  const semanticContent = updateCollectionMap(
    readTargetFile(semanticPath),
    'semantic-tokens',
    selectedCollections.get('Semantics')!,
    idToNameMap
  );
  updates.set(semanticPath, semanticContent);

  const layoutPath = path.join(scssDir, 'variables', 'layout.scss');
  const layoutContent = updateCollectionMap(
    readTargetFile(layoutPath),
    'layout-tokens',
    selectedCollections.get('layout')!,
    idToNameMap
  );
  updates.set(layoutPath, layoutContent);

  const adaptivePath = path.join(scssDir, 'variables', 'adaptive.scss');
  const adaptiveContent = updateAdaptive(
    readTargetFile(adaptivePath),
    selectedCollections.get('Adaptive')!,
    variables,
    variableCollections,
    idToNameMap
  );
  updates.set(adaptivePath, adaptiveContent);

  const primitiveTypePath = path.join(scssDir, 'variables', 'primitive-type.scss');
  const primitiveTypeContent = updatePrimitiveType(
    readTargetFile(primitiveTypePath),
    selectedCollections.get('Primitive-type')!,
    idToNameMap
  );
  updates.set(primitiveTypePath, primitiveTypeContent);

  const platformPath = path.join(scssDir, 'variables', 'platform.scss');
  const platformContent = updatePlatform(
    readTargetFile(platformPath),
    selectedCollections.get('Platform')!,
    idToNameMap
  );
  updates.set(platformPath, platformContent);

  for (const [filePath, content] of updates) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Updated token file: ${filePath}`);
  }
}

function generateFigmaVariableScss(
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>,
  idToNameMap: Map<string, string>
): string {
  const tokens = new Map<string, string>();
  let skipped = 0;

  for (const variable of Object.values(variables)) {
    if (!variable?.name || !variable.valuesByMode) continue;
    const collection = collections[variable.variableCollectionId ?? ''];
    const mode = collection?.defaultModeId;
    const valueByMode = variable.valuesByMode;
    const selectedMode = mode && Object.prototype.hasOwnProperty.call(valueByMode, mode)
      ? mode
      : Object.keys(valueByMode)[0];
    if (!selectedMode) continue;

    try {
      const value = toScssLiteral(valueByMode[selectedMode], normalizeScssVariableName(variable.name), idToNameMap);
      const name = normalizeScssVariableName(variable.name);
      tokens.set(/^[0-9]/.test(name) ? `token-${name}` : name, value);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('Unresolved Figma variable alias')) throw error;
      skipped++;
    }
  }

  if (skipped > 0) {
    console.warn(`⚠️ Skipped ${skipped} generated variables with aliases outside the Figma response.`);
  }

  const lines: string[] = [];
  let line = '  ';
  for (const [name, value] of tokens) {
    const entry = `"${name}": ${value}`;
    const separator = line === '  ' ? '' : ', ';
    if (line.length + separator.length + entry.length > 112) {
      lines.push(`${line},`);
      line = `  ${entry}`;
    } else {
      line += `${separator}${entry}`;
    }
  }
  if (line.trim()) lines.push(line);

  return [
    '// Auto-generated SCSS variables from Figma API',
    '$figma-tokens: (',
    ...lines,
    ');',
    '',
    '@mixin render-figma-tokens($tokens: $figma-tokens) {',
    '  @each $name, $value in $tokens {',
    '    --#{$name}: #{$value};',
    '  }',
    '}',
    '',
    ':root {',
    '  @include render-figma-tokens();',
    '}',
    ''
  ].join('\n');
}

type ScssTree = Map<string, string | ScssTree>;

function findCollection(
  name: string,
  collections: FigmaVariableCollection[],
  variables: Record<string, FigmaVariable>
): FigmaVariableCollection {
  const matches = collections
    .filter((collection) => collection.name.toLowerCase() === name.toLowerCase())
    .sort((left, right) => collectionVariableCount(right, variables) - collectionVariableCount(left, variables));
  const collection = matches[0];
  if (!collection) {
    throw new Error(`Figma variable collection "${name}" was not found.`);
  }
  if (matches.length > 1) {
    console.warn(`⚠️ Multiple Figma collections named "${name}" found; using the one with the most variables.`);
  }
  return collection;
}

function collectionVariableCount(
  collection: FigmaVariableCollection,
  variables: Record<string, FigmaVariable>
): number {
  return Object.values(variables).filter((variable) => variable.variableCollectionId === collection.id).length;
}

function readTargetFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`SCSS token file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

function variablesInCollection(
  collection: FigmaVariableCollection,
  variables: Record<string, FigmaVariable>
): FigmaVariable[] {
  return Object.values(variables).filter(
    (variable) => variable.variableCollectionId === collection.id && Boolean(variable.name)
  );
}

function collectionValue(
  variable: FigmaVariable,
  collection: FigmaVariableCollection,
  modeId?: string
): unknown {
  const values = variable.valuesByMode;
  if (!values) {
    throw new Error(`Figma variable "${variable.name}" has no mode values.`);
  }
  const selectedMode = modeId && Object.prototype.hasOwnProperty.call(values, modeId)
    ? modeId
    : collection.defaultModeId && Object.prototype.hasOwnProperty.call(values, collection.defaultModeId)
      ? collection.defaultModeId
      : Object.keys(values)[0];
  if (!selectedMode || !Object.prototype.hasOwnProperty.call(values, selectedMode)) {
    throw new Error(`Figma variable "${variable.name}" has no value for mode "${modeId ?? 'default'}".`);
  }
  return values[selectedMode];
}

function collectionModes(collection: FigmaVariableCollection, variables: FigmaVariable[]): Array<{ modeId: string; name: string }> {
  if (collection.modes?.length) {
    return collection.modes.map(({ modeId, name }) => ({ modeId, name }));
  }
  const modeIds = [...new Set(variables.flatMap((variable) => Object.keys(variable.valuesByMode ?? {})))];
  if (modeIds.length === 0) {
    throw new Error(`Figma collection "${collection.name}" has no modes.`);
  }
  return modeIds.map((modeId, index) => ({ modeId, name: index === 0 ? 'default' : modeId }));
}

function resolveAliasValue(
  rawValue: unknown,
  variablesById: Map<string, FigmaVariable>,
  collectionsById: Record<string, FigmaVariableCollection>,
  visited = new Set<string>()
): unknown {
  if (!isRecord(rawValue) || rawValue.type !== 'VARIABLE_ALIAS' || typeof rawValue.id !== 'string') {
    return rawValue;
  }
  if (visited.has(rawValue.id)) {
    throw new Error(`Circular Figma variable alias detected at "${rawValue.id}".`);
  }
  const target = variablesById.get(rawValue.id);
  if (!target || !target.variableCollectionId) {
    throw new Error(`Unresolved Figma variable alias "${rawValue.id}".`);
  }
  const targetCollection = collectionsById[target.variableCollectionId];
  if (!targetCollection) {
    throw new Error(`Collection for Figma variable alias "${rawValue.id}" was not found.`);
  }
  const nextVisited = new Set(visited);
  nextVisited.add(rawValue.id);
  return resolveAliasValue(collectionValue(target, targetCollection), variablesById, collectionsById, nextVisited);
}

function createTree(): ScssTree {
  return new Map();
}

function setTreeValue(tree: ScssTree, pathParts: string[], value: string, context: string): void {
  const [part, ...rest] = pathParts;
  if (!part) {
    throw new Error(`Empty token path while generating ${context}.`);
  }
  const current = tree.get(part);
  if (rest.length === 0) {
    if (current instanceof Map) {
      throw new Error(`Token path collision for "${pathParts.join('/')}" in ${context}.`);
    }
    if (typeof current === 'string' && current !== value) {
      console.warn(`⚠️ Duplicate token "${pathParts.join('/')}" in ${context}; the last Figma value will be used.`);
    }
    tree.set(part, value);
    return;
  }
  if (typeof current === 'string') {
    throw new Error(`Token path collision for "${pathParts.join('/')}" in ${context}.`);
  }
  const child = current ?? createTree();
  tree.set(part, child);
  setTreeValue(child, rest, value, context);
}

function treeFromFlatEntries(entries: Map<string, string>, context: string): ScssTree {
  const tree = createTree();
  for (const [key, value] of entries) {
    setTreeValue(tree, [key], value, context);
  }
  return tree;
}

function renderTreeEntries(tree: ScssTree, indent = '  '): string {
  const lines: string[] = [];
  for (const [key, value] of tree) {
    if (value instanceof Map) {
      lines.push(`${indent}"${key}": (`);
      lines.push(renderTreeEntries(value, `${indent}  `));
      lines.push(`${indent}),`);
    } else {
      lines.push(`${indent}"${key}": ${value},`);
    }
  }
  if (lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
  }
  return lines.join('\n');
}

function sassMapDeclaration(name: string, tree: ScssTree): string {
  return `$${name}: (\n${renderTreeEntries(tree)}\n);`;
}

function findSassDeclarationEnd(content: string, start: number): number {
  const open = content.indexOf('(', start);
  if (open < 0) {
    throw new Error(`Could not find opening parenthesis for Sass map at offset ${start}.`);
  }
  let depth = 0;
  let quote = '';
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < content.length; index++) {
    const char = content[index];
    const next = content[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (char === '\\') {
        index++;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '(') depth++;
    if (char === ')') {
      depth--;
      if (depth === 0) {
        const semicolon = content.indexOf(';', index);
        if (semicolon < 0) {
          throw new Error(`Could not find the end of Sass map at offset ${start}.`);
        }
        return semicolon + 1;
      }
    }
  }
  throw new Error(`Unclosed Sass map at offset ${start}.`);
}

function replaceSassMap(content: string, name: string, tree: ScssTree): string {
  const declaration = sassMapDeclaration(name, tree);
  const match = new RegExp(`\\$${name}\\s*:\\s*\\(`).exec(content);
  if (match) {
    const end = findSassDeclarationEnd(content, match.index);
    return `${content.slice(0, match.index)}${declaration}${content.slice(end)}`;
  }
  const rootIndex = content.indexOf(':root {');
  if (rootIndex < 0) {
    throw new Error(`Could not insert generated Sass map "$${name}" into the token file.`);
  }
  return `${content.slice(0, rootIndex)}${declaration}\n\n${content.slice(rootIndex)}`;
}

function readSassMapEntries(content: string, name: string): Map<string, string> {
  const match = new RegExp(`\\$${name}\\s*:\\s*\\(`).exec(content);
  if (!match) return new Map();
  const end = findSassDeclarationEnd(content, match.index);
  const open = content.indexOf('(', match.index);
  const body = content.slice(open + 1, end - 2);
  const chunks: string[] = [];
  let chunkStart = 0;
  let depth = 0;
  let quote = '';
  let lineComment = false;
  for (let index = 0; index < body.length; index++) {
    const char = body[index];
    const next = body[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (quote) {
      if (char === '\\') index++;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      chunks.push(body.slice(chunkStart, index));
      chunkStart = index + 1;
    }
  }
  chunks.push(body.slice(chunkStart));
  const entries = new Map<string, string>();
  for (const rawChunk of chunks) {
    const entry = rawChunk.replace(/\/\/[^\r\n]*/g, '').trim();
    if (!entry) continue;
    const colon = entry.indexOf(':');
    if (colon < 0) continue;
    const key = entry.slice(0, colon).trim().replace(/^["']|["']$/g, '');
    const value = entry.slice(colon + 1).trim();
    if (key && value) entries.set(normalizeScssVariableName(key), value);
  }
  return entries;
}

function getTokenLiteral(
  variable: FigmaVariable,
  collection: FigmaVariableCollection,
  idToNameMap: Map<string, string>,
  variablesById: Map<string, FigmaVariable>,
  collectionsById: Record<string, FigmaVariableCollection>,
  modeId?: string,
  resolveAliases = false
): string {
  const rawValue = collectionValue(variable, collection, modeId);
  const value = resolveAliases
    ? resolveAliasValue(rawValue, variablesById, collectionsById)
    : rawValue;
  return toScssLiteral(value, normalizeScssVariableName(variable.name ?? 'token'), idToNameMap);
}

function updateCollectionMap(
  content: string,
  mapName: string,
  collection: FigmaVariableCollection,
  idToNameMap: Map<string, string>
): string {
  const collectionVars = getVariablesForCollection(collection);
  const variableById = new Map(Object.entries(currentVariables));
  const previousValues = readSassMapEntries(content, mapName);
  const entries = new Map<string, string>();
  for (const variable of collectionVars) {
    const name = normalizeScssVariableName(variable.name ?? 'token');
    try {
      entries.set(name, getTokenLiteral(variable, collection, idToNameMap, variableById, currentCollections));
    } catch (error) {
      if (!(error instanceof Error) || !error.message.startsWith('Unresolved Figma variable alias')) throw error;
      const previous = previousValues.get(name);
      if (previous) {
        console.warn(`⚠️ Keeping existing "$${name}" in $${mapName}; Figma alias "${error.message}" is unavailable.`);
        entries.set(name, previous);
      } else {
        console.warn(`⚠️ Omitting "$${name}" from $${mapName}; Figma alias "${error.message}" is unavailable.`);
      }
    }
  }
  return replaceSassMap(content, mapName, treeFromFlatEntries(entries, mapName));
}

function updatePrimitives(
  content: string,
  collection: FigmaVariableCollection,
  variables: Record<string, FigmaVariable>,
  idToNameMap: Map<string, string>
): string {
  const collectionVariables = variablesInCollection(collection, variables);
  const variableById = new Map(Object.entries(variables));
  const collectionsById = getCollectionsById();
  const colorPalette = createTree();
  const scales = new Map<string, string>();
  const ramps = new Map<string, string>();
  const alphaTokens = new Map<string, string>();
  const extraTokens = new Map<string, string>();

  for (const variable of collectionVariables) {
    const name = variable.name ?? '';
    const parts = name.split('/').map((part) => normalizeScssVariableName(part));
    const value = getTokenLiteral(variable, collection, idToNameMap, variableById, collectionsById);
    if (name.startsWith('global-colors/')) {
      const colorPath = parts.slice(1);
      const palettePath = colorPath.length === 2 && ['basic', 'identity'].includes(colorPath[0])
        ? [`${colorPath[0]}-${colorPath[1]}`]
        : colorPath;
      setTreeValue(colorPalette, palettePath, value, '$color-palette');
    } else if (name.startsWith('global-scale/')) {
      setUniqueEntry(scales, parts.slice(1).join('-'), value, '$scales');
    } else if (name.startsWith('ramps/')) {
      setUniqueEntry(
        ramps,
        parts.slice(1).join('-'),
        toScssLiteral(collectionValue(variable, collection), `size-${name}`, idToNameMap),
        '$ramps'
      );
    } else if (name.startsWith('alpha/')) {
      setUniqueEntry(alphaTokens, parts.slice(1).join('-'), value, '$alpha-tokens');
    } else {
      setUniqueEntry(extraTokens, parts.join('-'), value, '$primitive-extra-tokens');
    }
  }

  content = replaceSassMap(content, 'color-palette', colorPalette);
  content = replaceSassMap(content, 'scales', treeFromFlatEntries(scales, '$scales'));
  content = replaceSassMap(content, 'ramps', treeFromFlatEntries(ramps, '$ramps'));
  content = replaceSassMap(content, 'alpha-tokens', treeFromFlatEntries(alphaTokens, '$alpha-tokens'));
  content = replaceSassMap(content, 'primitive-extra-tokens', treeFromFlatEntries(extraTokens, '$primitive-extra-tokens'));
  return content;
}

function setUniqueEntry(entries: Map<string, string>, key: string, value: string, context: string): void {
  const current = entries.get(key);
  if (current !== undefined && current !== value) {
    console.warn(`⚠️ Duplicate token "${key}" in ${context}; the last Figma value will be used.`);
  }
  entries.set(key, value);
}

function updateAlias(
  content: string,
  collection: FigmaVariableCollection,
  idToNameMap: Map<string, string>
): string {
  const variables = Object.values(currentVariables).filter((variable) => variable.variableCollectionId === collection.id);
  const modes = collectionModes(collection, variables);
  const lightMode = modes.find((mode) => mode.name.toLowerCase() === 'light') ?? modes[0];
  const darkMode = modes.find((mode) => mode.name.toLowerCase() === 'dark') ?? modes[1] ?? modes[0];
  const varsById = new Map(Object.entries(currentVariables));
  const collectionsById = getCollectionsById();
  const oldLight = readSassMapEntries(content, 'light-theme-tokens');
  const oldDark = readSassMapEntries(content, 'dark-theme-tokens');
  const makeModeTree = (modeId: string, previous: Map<string, string>, mapName: string): ScssTree => {
    const values = new Map<string, string>();
    for (const variable of variables) {
      const name = normalizeScssVariableName(variable.name ?? 'token');
      try {
        values.set(name, getTokenLiteral(variable, collection, idToNameMap, varsById, collectionsById, modeId));
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('Unresolved Figma variable alias')) throw error;
        const existing = previous.get(name);
        if (!existing) throw error;
        console.warn(`⚠️ Keeping existing "$${name}" in $${mapName}; Figma alias "${error.message}" is unavailable.`);
        values.set(name, existing);
      }
    }
    return treeFromFlatEntries(values, mapName);
  };

  content = replaceSassMap(content, 'dark-theme-tokens', makeModeTree(darkMode.modeId, oldDark, 'dark-theme-tokens'));
  const lightTree = makeModeTree(lightMode.modeId, oldLight, 'light-theme-tokens');
  if (oldLight.size > 0) {
    content = replaceSassMap(content, 'light-theme-tokens', lightTree);
  } else {
    const insertionPoint = content.indexOf('$light-theme-custom-tokens:');
    if (insertionPoint < 0) {
      throw new Error('Could not insert generated light theme map into alias.scss.');
    }
    content = `${content.slice(0, insertionPoint)}${sassMapDeclaration('light-theme-tokens', lightTree)}\n\n${content.slice(insertionPoint)}`;
  }
  return content;
}

function updateAdaptive(
  content: string,
  collection: FigmaVariableCollection,
  variables: Record<string, FigmaVariable>,
  collections: Record<string, FigmaVariableCollection>,
  idToNameMap: Map<string, string>
): string {
  const collectionVariables = variablesInCollection(collection, variables);
  const modes = collectionModes(collection, collectionVariables);
  const variablesById = new Map(Object.entries(variables));
  const columns = createTree();
  const viewports = createTree();
  const groups = ['font-size', 'font-lineheight', 'radius', 'spacing', 'visibility', 'popup', 'margin'];
  const viewportValues = new Map<string, ScssTree>();
  const columnValues = new Map<string, string[]>();

  for (let index = 0; index < modes.length; index++) {
    const mode = modes[index];
    const viewport = createTree();
    viewportValues.set(mode.name, viewport);
    setTreeValue(viewport, ['number'], '0', '$adaptive-viewport-tokens');
    for (const group of groups) viewport.set(group, createTree());

    for (const variable of collectionVariables) {
      const name = variable.name ?? '';
      const parts = name.split('/');
      if (name === 'breakpoints') {
        const resolved = resolveAliasValue(
          collectionValue(variable, collection, mode.modeId),
          variablesById,
          collections
        );
        setTreeValue(viewport, ['breakpoints'], toScssLiteral(resolved, 'breakpoints', idToNameMap), '$adaptive-viewport-tokens');
        continue;
      }
      if (!name.startsWith('responsive/')) continue;
      const responsivePath = parts.slice(1).map(normalizeScssVariableName);
      if (responsivePath[0] === 'number') {
        setTreeValue(viewport, ['number'], getTokenLiteral(variable, collection, idToNameMap, variablesById, collections, mode.modeId), '$adaptive-viewport-tokens');
        continue;
      }
      if (responsivePath[0] === 'button' && responsivePath[1] === 'size') {
        setTreeValue(viewport, ['button-size'], getTokenLiteral(variable, collection, idToNameMap, variablesById, collections, mode.modeId), '$adaptive-viewport-tokens');
        continue;
      }
      if (responsivePath[0] === 'columns') {
        const key = responsivePath.slice(1).join('-');
        const values = columnValues.get(key) ?? Array(modes.length).fill('0');
        values[index] = getTokenLiteral(variable, collection, idToNameMap, variablesById, collections, mode.modeId);
        columnValues.set(key, values);
        continue;
      }
      if (responsivePath.length < 2) {
        console.warn(`⚠️ Skipping unsupported Adaptive token "${name}".`);
        continue;
      }
      const group = responsivePath[0] === 'font' && responsivePath[1] === 'lineheight'
        ? 'font-lineheight'
        : responsivePath[0] === 'font' && responsivePath[1] === 'size'
          ? 'font-size'
          : responsivePath[0];
      const keyParts = group.startsWith('font-') ? responsivePath.slice(2) : responsivePath.slice(1);
      if (!groups.includes(group) || keyParts.length === 0) {
        console.warn(`⚠️ Skipping unsupported Adaptive token "${name}".`);
        continue;
      }
      const value = getTokenLiteral(variable, collection, idToNameMap, variablesById, collections, mode.modeId);
      setTreeValue(viewport.get(group) as ScssTree, [keyParts.join('-')], value, '$adaptive-viewport-tokens');
    }
  }

  const screenIndex = createTree();
  for (let index = 0; index < modes.length; index++) {
    const mode = modes[index];
    screenIndex.set(mode.name, String(index + 1));
    viewports.set(mode.name, viewportValues.get(mode.name) as ScssTree);
  }
  for (const [key, values] of columnValues) {
    columns.set(key, `(${values.join(', ')})`);
  }

  content = replaceSassMap(content, 'screen-index', screenIndex);
  content = replaceSassMap(content, 'columns', columns);
  content = replaceSassMap(content, 'adaptive-viewport-tokens', viewports);
  return content;
}

function updatePrimitiveType(
  content: string,
  collection: FigmaVariableCollection,
  idToNameMap: Map<string, string>
): string {
  const variables = Object.values(currentVariables).filter((variable) => variable.variableCollectionId === collection.id);
  const variablesById = new Map(Object.entries(currentVariables));
  const collectionsById = getCollectionsById();
  const tree = createTree();
  for (const variable of variables) {
    const parts = (variable.name ?? '').split('/').map(normalizeScssVariableName);
    if (parts[0] === 'font') parts.shift();
    if (parts.length === 0) continue;
    setTreeValue(
      tree,
      parts,
      getTokenLiteral(variable, collection, idToNameMap, variablesById, collectionsById),
      '$primitive-type-tokens'
    );
  }
  return replaceSassMap(content, 'primitive-type-tokens', tree);
}

function updatePlatform(
  content: string,
  collection: FigmaVariableCollection,
  idToNameMap: Map<string, string>
): string {
  const variables = Object.values(currentVariables).filter((variable) => variable.variableCollectionId === collection.id);
  const modes = collectionModes(collection, variables);
  const variablesById = new Map(Object.entries(currentVariables));
  const collectionsById = getCollectionsById();
  const priorWeb = readSassMapEntries(content, 'web-tokens');
  const priorApp = readSassMapEntries(content, 'app-tokens');
  const trees = new Map<string, ScssTree>();
  for (const mode of modes) {
    const entries = new Map<string, string>();
    for (const variable of variables) {
      const name = normalizeScssVariableName(variable.name ?? 'token');
      try {
        entries.set(name, getTokenLiteral(variable, collection, idToNameMap, variablesById, collectionsById, mode.modeId));
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('Unresolved Figma variable alias')) throw error;
        const previous = (mode.name.toLowerCase() === 'app' ? priorApp : priorWeb).get(name);
        if (previous) {
          console.warn(`⚠️ Keeping existing "$${name}" in ${mode.name} platform tokens; Figma alias "${error.message}" is unavailable.`);
          entries.set(name, previous);
        } else {
          console.warn(`⚠️ Omitting "${name}" from ${mode.name} platform tokens; Figma alias "${error.message}" is unavailable.`);
        }
      }
    }
    trees.set(mode.name.toLowerCase(), treeFromFlatEntries(entries, `${mode.name} platform tokens`));
  }
  const web = trees.get('web');
  const app = trees.get('app');
  if (!web || !app) {
    throw new Error('The Figma Platform collection must contain "web" and "app" modes.');
  }
  content = replaceSassMap(content, 'web-tokens', web);
  content = replaceSassMap(content, 'app-tokens', app);
  return content;
}

function getVariablesForCollection(collection: FigmaVariableCollection): FigmaVariable[] {
  return Object.values(currentVariables).filter((variable) => variable.variableCollectionId === collection.id);
}

let currentVariables: Record<string, FigmaVariable> = {};
let currentCollections: Record<string, FigmaVariableCollection> = {};

function getCollectionsById(): Record<string, FigmaVariableCollection> {
  return currentCollections;
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
    if (Number.isFinite(rawVal) && needsPx) {
      return `${rawVal}px`;
    }
    return String(rawVal);
  }

  if (typeof rawVal === 'boolean') {
    return rawVal ? '1' : '0';
  }

  if (isRecord(rawVal)) {
    if (isRecord(rawVal.color) && typeof rawVal.color.r === 'number' &&
      typeof rawVal.color.g === 'number' && typeof rawVal.color.b === 'number') {
      const color = rawVal.color;
      const toByte = (channel: number) => Math.round(channel * 255);
      const red = toByte(color.r as number);
      const green = toByte(color.g as number);
      const blue = toByte(color.b as number);
      let alpha = typeof color.a === 'number' ? color.a : 1;
      if (rawVal.opacity !== undefined) {
        const opacity = resolveAliasValue(
          rawVal.opacity,
          new Map(Object.entries(currentVariables)),
          currentCollections
        );
        if (typeof opacity !== 'number') {
          throw new Error(`Unsupported Figma color opacity for "${cleanName}".`);
        }
        alpha *= opacity > 1 ? opacity / 100 : opacity;
      }
      if (alpha < 1) {
        return `rgba(${red}, ${green}, ${blue}, ${Number(alpha.toFixed(4))})`;
      }
      const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
      return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
    }
    if (typeof rawVal.r === 'number' && typeof rawVal.g === 'number' && typeof rawVal.b === 'number') {
      const toByte = (channel: number) => Math.round(channel * 255);
      const red = toByte(rawVal.r);
      const green = toByte(rawVal.g);
      const blue = toByte(rawVal.b);
      const alpha = typeof rawVal.a === 'number' ? rawVal.a : 1;
      if (alpha < 1) {
        return `rgba(${red}, ${green}, ${blue}, ${Number(alpha.toFixed(4))})`;
      }
      const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
      return `#${toHex(red)}${toHex(green)}${toHex(blue)}`.toUpperCase();
    }
    if (rawVal.type === 'VARIABLE_ALIAS' && typeof rawVal.id === 'string') {
      const referencedName = idToNameMap.get(rawVal.id);
      if (!referencedName) {
        throw new Error(`Unresolved Figma variable alias "${rawVal.id}".`);
      }
      return `var(--${referencedName})`;
    }
    if (typeof rawVal.value !== 'undefined') {
      return toScssLiteral(rawVal.value, cleanName, idToNameMap);
    }
  }

  if (Array.isArray(rawVal)) {
    return rawVal.map((value): string => toScssLiteral(value, cleanName, idToNameMap)).join(', ');
  }

  throw new Error(`Unsupported Figma token value for "${cleanName}".`);
}

async function syncTokens() {
  await fetchFigmaVariables();
  processFigmaVariables();
}

async function main() {
  if (process.argv.includes('--generate')) {
    processFigmaVariables();
    return;
  }

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