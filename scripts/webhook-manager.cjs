'use strict';

require('dotenv').config();
const figmaApi = require('./figma-rest-api.cjs');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';

  console.log('=============================================');
  console.log('🔗  Figma Webhook Management Tool');
  console.log('=============================================');

  try {
    if (command === 'list') {
      console.log('Fetching active Figma webhooks...');
      const result = await figmaApi.listWebhooks();
      const webhooks = result.webhooks || [];
      console.log(`Found ${webhooks.length} registered webhook(s):`);
      webhooks.forEach((wh, index) => {
        console.log(`\n[${index + 1}] ID: ${wh.id}`);
        console.log(`    Event: ${wh.event_type}`);
        console.log(`    Endpoint: ${wh.endpoint}`);
        console.log(`    Status: ${wh.status}`);
        console.log(`    File Key: ${wh.file_key || 'Global'}`);
      });
      return;
    }

    if (command === 'create') {
      const endpoint = args[1] || process.env.FIGMA_WEBHOOK_ENDPOINT;
      const passcode = args[2] || process.env.FIGMA_WEBHOOK_PASSCODE || 'hdfc-sync-secret';

      if (!endpoint) {
        console.error('❌ Error: Webhook endpoint URL is required.');
        console.log('Usage: node scripts/webhook-manager.cjs create <endpoint_url> [passcode]');
        process.exit(1);
      }

      console.log(`Registering webhook for endpoint: ${endpoint}...`);
      const response = await figmaApi.createWebhook({
        endpoint,
        passcode,
        eventType: 'FILE_UPDATE'
      });
      console.log('✅ Webhook successfully created:', response);
      return;
    }

    if (command === 'delete') {
      const webhookId = args[1];
      if (!webhookId) {
        console.error('❌ Error: Webhook ID is required.');
        console.log('Usage: node scripts/webhook-manager.cjs delete <webhook_id>');
        process.exit(1);
      }

      console.log(`Deleting webhook ${webhookId}...`);
      await figmaApi.deleteWebhook(webhookId);
      console.log(`✅ Webhook ${webhookId} successfully deleted.`);
      return;
    }

    console.log('Unknown command. Available commands: list, create, delete');
  } catch (err) {
    console.error('❌ Webhook operation failed:', err.message);
    if (err.details) {
      console.error('Details:', err.details);
    }
    process.exit(1);
  }
}

main();

