// Script to update Detrack API key
import { D1Database } from '@cloudflare/workers-types'

const correctApiKey = '10e3e77f4c4b42bc945bf8cbcc055cec0c826540a67681f82788cc17008b67d9'

// This script should be run in the Cloudflare Worker environment
export async function updateDetrackApiKey(db) {
  try {
    console.log('Updating Detrack API key...')
    
    // Update the API key in the detrack_config table
    const result = await db.prepare(`
      UPDATE detrack_config 
      SET api_key = ?, updated_at = datetime('now')
      WHERE id = 1
    `).bind(correctApiKey).run()
    
    console.log('API key updated successfully:', result)
    return result
  } catch (error) {
    console.error('Error updating API key:', error)
    throw error
  }
} 