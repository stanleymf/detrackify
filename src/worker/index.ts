import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { handleApiRequest } from './api'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log(`[DEPLOYMENT_CHECK] Worker version from ${new Date().toUTCString()} running.`)
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx)
    }

    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: env.__STATIC_CONTENT_MANIFEST,
        },
      )
    } catch (e) {
      // ... existing code ...
    }
  },
} 