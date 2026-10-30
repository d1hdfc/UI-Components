'use strict';

require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const FIGMA_API_BASE = 'https://api.figma.com';

function getToken() {
  const token =
    process.env.FIGMA_PERSONAL_ACCESS_TOKEN?.trim() ||
    process.env.FIGMA_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error('FIGMA_PERSONAL_ACCESS_TOKEN is missing. Please set it in .env or environment.');
  }
  return token;
}

function getFileKey() {
  const configPath = path.join(process.cwd(), '.mcp', 'config.json');
  let defaultKey = 'CXxUbHl3oMzt9Bzv3SKv75';
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.connection?.defaultFileKey) {
        defaultKey = cfg.connection.defaultFileKey;
      }
    } catch {
      // ignore
    }
  }

  return (
    process.env.FIGMA_FILE_KEY?.trim() ||
    process.env.FIGMA_DESIGN_FILE_KEY?.trim() ||
    defaultKey
  );
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const url = endpoint.startsWith('http') ? endpoint : `${FIGMA_API_BASE}${endpoint}`;
  const headers = {
    'X-Figma-Token': token,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(errorText);
    } catch {
      parsed = null;
    }
    const message = parsed?.err || parsed?.message || errorText;
    const error = new Error(`Figma API Error [${response.status} ${response.statusText}]: ${message}`);
    error.status = response.status;
    error.details = parsed || errorText;
    throw error;
  }

  return response.json();
}

/**
 * Fetch file details (document tree)
 */
async function getFile(fileKey = getFileKey(), depth = null) {
  const query = depth ? `?depth=${depth}` : '';
  return request(`/v1/files/${encodeURIComponent(fileKey)}${query}`);
}

/**
 * Fetch file versions
 */
async function getFileVersions(fileKey = getFileKey()) {
  return request(`/v1/files/${encodeURIComponent(fileKey)}/versions`);
}

/**
 * Fetch specific nodes by IDs
 */
async function getNodes(fileKey = getFileKey(), nodeIds = []) {
  if (!nodeIds.length) return { nodes: {} };
  const idsParam = nodeIds.map(encodeURIComponent).join(',');
  return request(`/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${idsParam}`);
}

/**
 * Fetch preview image URLs
 */
async function getImages(fileKey = getFileKey(), nodeIds = [], format = 'png', scale = 1) {
  if (!nodeIds.length) return { images: {} };
  const idsParam = nodeIds.map(encodeURIComponent).join(',');
  return request(
    `/v1/images/${encodeURIComponent(fileKey)}?ids=${idsParam}&format=${format}&scale=${scale}`
  );
}

/**
 * Fetch dev resources for a file or node
 */
async function getDevResources(fileKey = getFileKey(), nodeId = null) {
  const query = nodeId ? `?node_ids=${encodeURIComponent(nodeId)}` : '';
  return request(`/v1/files/${encodeURIComponent(fileKey)}/dev_resources${query}`);
}

/**
 * Create or attach a Dev Resource to a Figma node via REST API
 */
async function createDevResource(fileKey = getFileKey(), { name, url, nodeId }) {
  return request(`/v1/files/${encodeURIComponent(fileKey)}/dev_resources`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      url,
      file_key: fileKey,
      node_id: nodeId
    })
  });
}

/**
 * Delete a Dev Resource via REST API
 */
async function deleteDevResource(fileKey = getFileKey(), devResourceId) {
  return request(
    `/v1/files/${encodeURIComponent(fileKey)}/dev_resources/${encodeURIComponent(devResourceId)}`,
    {
      method: 'DELETE'
    }
  );
}

/**
 * Fetch local variables via REST API
 */
async function getLocalVariables(fileKey = getFileKey()) {
  return request(`/v1/files/${encodeURIComponent(fileKey)}/variables/local`);
}

/**
 * Post/update variables via REST API
 */
async function postVariables(fileKey = getFileKey(), payload) {
  return request(`/v1/files/${encodeURIComponent(fileKey)}/variables`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

/**
 * Post a comment to a Figma node or file via REST API
 */
async function postComment(fileKey = getFileKey(), message, clientMeta = null) {
  const body = { message };
  if (clientMeta) {
    body.client_meta = clientMeta;
  }
  return request(`/v1/files/${encodeURIComponent(fileKey)}/comments`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/**
 * List Figma webhooks
 */
async function listWebhooks() {
  return request(`/v2/webhooks`);
}

/**
 * Create a Figma webhook
 */
async function createWebhook({
  eventType = 'FILE_UPDATE',
  fileKey = getFileKey(),
  endpoint,
  passcode,
  description = 'HDFC UI Components Bi-directional Auto-Sync'
}) {
  if (!endpoint) {
    throw new Error('Webhook endpoint URL is required.');
  }
  return request(`/v2/webhooks`, {
    method: 'POST',
    body: JSON.stringify({
      event_type: eventType,
      file_key: fileKey,
      endpoint,
      passcode: passcode || 'hdfc-sync-secret',
      description
    })
  });
}

/**
 * Delete a Figma webhook
 */
async function deleteWebhook(webhookId) {
  return request(`/v2/webhooks/${encodeURIComponent(webhookId)}`, {
    method: 'DELETE'
  });
}

module.exports = {
  getToken,
  getFileKey,
  request,
  getFile,
  getFileVersions,
  getNodes,
  getImages,
  getDevResources,
  createDevResource,
  deleteDevResource,
  getLocalVariables,
  postVariables,
  postComment,
  listWebhooks,
  createWebhook,
  deleteWebhook
};
