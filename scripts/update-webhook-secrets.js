// Script to update webhook secrets for existing stores
import { D1Database } from '@cloudflare/workers-types'

// This script should be run in the Cloudflare Workers environment
// You can run it via the Cloudflare dashboard or via wrangler

export async function updateWebhookSecrets(db) {
  try {
    // Get all stores
    const stores = await db.prepare('SELECT * FROM stores').all()
    
    console.log(`Found ${stores.results.length} stores`)
    
    for (const store of stores.results) {
      console.log(`Processing store: ${store.store_name} (${store.shopify_domain})`)
      
      // Check if webhook secret is empty or missing
      if (!store.webhook_secret || store.webhook_secret === '') {
        // Generate new webhook secret
        const newWebhookSecret = crypto.randomUUID()
        
        // Update the store
        await db.prepare(`
          UPDATE stores 
          SET webhook_secret = ?, updated_at = ? 
          WHERE id = ?
        `).bind(newWebhookSecret, new Date().toISOString(), store.id).run()
        
        console.log(`  ✅ Updated webhook secret for ${store.store_name}`)
        console.log(`  New webhook secret: ${newWebhookSecret}`)
      } else {
        console.log(`  ⏭️  Store ${store.store_name} already has webhook secret`)
      }
    }
    
    console.log('Webhook secret update completed!')
  } catch (error) {
    console.error('Error updating webhook secrets:', error)
  }
}

// For manual execution in Cloudflare Workers
export default {
  async fetch(request, env, ctx) {
    if (request.url.includes('/update-webhook-secrets')) {
      await updateWebhookSecrets(env.DB)
      return new Response('Webhook secrets updated!', { status: 200 })
    }
    return new Response('Not found', { status: 404 })
  }
} 