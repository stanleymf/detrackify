#!/usr/bin/env node

/**
 * Script to register Shopify fulfillment webhook
 * Usage: node register-fulfillment-webhook.js <shop-domain> <access-token>
 * 
 * Example: node register-fulfillment-webhook.js your-shop.myshopify.com shpat_xxx
 */

const https = require('https');

const shopDomain = process.argv[2];
const accessToken = process.argv[3];
const webhookUrl = 'https://detrackify.stanleytan92.workers.dev/api/webhooks/shopify';

if (!shopDomain || !accessToken) {
  console.error('Usage: node register-fulfillment-webhook.js <shop-domain> <access-token>');
  console.error('Example: node register-fulfillment-webhook.js your-shop.myshopify.com shpat_xxx');
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

console.log(`Registering fulfillment webhook for ${shopDomain}...`);
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
      console.log(`Topic: ${response.webhook.topic}`);
      console.log(`Address: ${response.webhook.address}`);
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