#!/usr/bin/env node

/**
 * Script to register Shopify fulfillment webhook
 * Usage: node register-webhook.js <shop-domain> <access-token> <webhook-url>
 */

const https = require('https');

const shopDomain = process.argv[2];
const accessToken = process.argv[3];
const webhookUrl = process.argv[4];

if (!shopDomain || !accessToken || !webhookUrl) {
  console.error('Usage: node register-webhook.js <shop-domain> <access-token> <webhook-url>');
  console.error('Example: node register-webhook.js your-shop.myshopify.com shpat_xxx https://your-worker.workers.dev/api/webhooks/shopify');
  process.exit(1);
}

const webhookData = JSON.stringify({
  webhook: {
    topic: 'orders/fulfilled',
    address: webhookUrl,
    format: 'json'
  }
});

const options = {
  hostname: shopDomain,
  port: 443,
  path: '/admin/api/2024-01/webhooks.json',
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(webhookData)
  }
};

console.log(`Registering webhook for ${shopDomain}...`);
console.log(`Webhook URL: ${webhookUrl}`);
console.log(`Topic: orders/fulfilled`);

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 201) {
      const response = JSON.parse(data);
      console.log('✅ Webhook registered successfully!');
      console.log(`Webhook ID: ${response.webhook.id}`);
      console.log(`Status: ${response.webhook.status}`);
    } else {
      console.error('❌ Failed to register webhook');
      console.error(`Status: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error registering webhook:', error.message);
});

req.write(webhookData);
req.end(); 