import { DatabaseService } from '../src/lib/database'
import { CloudflareAuthService, requireAuth, getSessionTokenFromRequest, setSessionCookie, clearSessionCookie } from '../src/lib/auth'
import { processShopifyOrder } from '../src/lib/orderProcessor'
import crypto from 'crypto-js'
import type { ShopifyOrder } from '../src/types/shopify'
import type { GlobalFieldMapping } from '../src/types'

// Cloudflare Worker types
interface D1Database {
	prepare: (query: string) => any
	batch: (statements: any[]) => Promise<any[]>
	exec: (query: string) => Promise<any>
}

interface KVNamespace {
	get: (key: string) => Promise<string | null>
	put: (key: string, value: string) => Promise<void>
	delete: (key: string) => Promise<void>
}

interface Fetcher {
	fetch: (request: Request) => Promise<Response>
}

interface ExecutionContext {
	waitUntil: (promise: Promise<any>) => void
	passThroughOnException: () => void
}

interface Env {
	DB: D1Database
	SESSIONS: KVNamespace
	JWT_SECRET: string
	SHOPIFY_API_KEY: string
	SHOPIFY_API_SECRET: string
	ASSETS: Fetcher
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		const db = new DatabaseService(env.DB)
		const authService = new CloudflareAuthService(db, env.JWT_SECRET)

		try {
			// API Routes
			if (url.pathname.startsWith('/api/')) {
				return await handleApiRoutes(request, url, env, db, authService)
			}

			// Serve static assets and SPA
			return env.ASSETS.fetch(request)
		} catch (error) {
			console.error('Worker error:', error)
			return new Response('Internal Server Error', { status: 500 })
		}
	}
}

async function handleApiRoutes(
	request: Request,
	url: URL,
	env: Env,
	db: DatabaseService,
	authService: CloudflareAuthService
): Promise<Response> {
	const path = url.pathname

	// Public routes (no authentication required)
	if (path === '/api/auth/login' && request.method === 'POST') {
		return handleLogin(request, authService)
	}

	if (path === '/api/auth/register' && request.method === 'POST') {
		return handleRegister(request, authService)
	}

	if (path === '/api/auth/logout' && request.method === 'POST') {
		return handleLogout(request, authService)
	}

	if (path === '/api/auth/check' && request.method === 'GET') {
		return handleAuthCheck(request, authService)
	}

	if (path === '/api/webhooks/shopify' && request.method === 'POST') {
		return handleShopifyWebhook(request, env, db)
	}

	if (path === '/api/field-mappings' && request.method === 'GET') {
		return handleGetGlobalFieldMappings(db)
	}

	if (path === '/api/field-mappings' && request.method === 'POST') {
		return handleSaveGlobalFieldMappings(request, db)
	}

	if (path === '/api/fetch-orders' && request.method === 'POST') {
		return handleFetchOrders(request, db)
	}

	// Protected routes (authentication required)
	const authResult = await requireAuth(request, authService)
	if (!authResult.authenticated) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	// API routes that require authentication
	if (path === '/api/stores' && request.method === 'GET') {
		return handleGetStores(db)
	}

	if (path === '/api/stores' && request.method === 'POST') {
		return handleCreateStore(request, db)
	}

	if (path.startsWith('/api/stores/') && request.method === 'GET') {
		const storeId = path.split('/')[3]
		return handleGetStore(storeId, db)
	}

	if (path.startsWith('/api/stores/') && request.method === 'PUT') {
		const storeId = path.split('/')[3]
		return handleUpdateStore(storeId, request, db)
	}

	if (path.startsWith('/api/stores/') && request.method === 'DELETE') {
		const storeId = path.split('/')[3]
		return handleDeleteStore(storeId, db)
	}

	if (path === '/api/orders' && request.method === 'GET') {
		return handleGetOrders(request, db)
	}

	if (path.startsWith('/api/stores/') && path.includes('/mappings') && request.method === 'GET') {
		const storeId = path.split('/')[3]
		return handleGetMappings(storeId, db)
	}

	if (path.startsWith('/api/stores/') && path.includes('/mappings') && request.method === 'POST') {
		const storeId = path.split('/')[3]
		return handleSaveMappings(storeId, request, db)
	}

	return new Response('Not Found', { status: 404 })
}

// Authentication handlers
async function handleLogin(request: Request, authService: CloudflareAuthService): Promise<Response> {
	try {
		const { email, password } = await request.json()
		const result = await authService.login(email, password)
		
		if (result.success && result.sessionToken) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Set-Cookie': setSessionCookie(result.sessionToken)
				}
			})
		} else {
			return new Response(JSON.stringify({ error: result.error }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			})
		}
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Invalid request' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleRegister(request: Request, authService: CloudflareAuthService): Promise<Response> {
	try {
		const { email, password } = await request.json()
		const result = await authService.register(email, password)
		
		if (result.success && result.sessionToken) {
			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Set-Cookie': setSessionCookie(result.sessionToken)
				}
			})
		} else {
			return new Response(JSON.stringify({ error: result.error }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Invalid request' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleLogout(request: Request, authService: CloudflareAuthService): Promise<Response> {
	const sessionToken = getSessionTokenFromRequest(request)
	if (sessionToken) {
		await authService.logout(sessionToken)
	}
	
	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
			'Set-Cookie': clearSessionCookie()
		}
	})
}

async function handleAuthCheck(request: Request, authService: CloudflareAuthService): Promise<Response> {
	const sessionToken = getSessionTokenFromRequest(request)
	if (sessionToken) {
		const { valid } = await authService.validateSession(sessionToken)
		if (valid) {
			return new Response(JSON.stringify({ authenticated: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		}
	}
	
	return new Response(JSON.stringify({ authenticated: false }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}

// Shopify webhook handler
async function handleShopifyWebhook(request: Request, env: Env, db: DatabaseService): Promise<Response> {
	try {
		const shopDomain = request.headers.get('x-shopify-shop-domain')
		const topic = request.headers.get('x-shopify-topic')
		const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
		
		if (!shopDomain || !topic || !hmacHeader) {
			return new Response('Missing required headers', { status: 400 })
		}

		// Get store configuration
		const store = await db.getStoreByDomain(shopDomain)
		if (!store) {
			console.error('Store not found:', shopDomain)
			return new Response('Store not found', { status: 404 })
		}

		// Verify webhook signature
		const body = await request.text()
		const calculatedHmac = crypto.HmacSHA256(body, store.webhook_secret).toString(crypto.enc.Hex)
		
		if (calculatedHmac !== hmacHeader) {
			console.error('Invalid webhook signature')
			return new Response('Invalid signature', { status: 401 })
		}

		// Parse Shopify order data
		const shopifyOrder: ShopifyOrder = JSON.parse(body)
		
		// Create webhook event record
		const webhookEventId = await db.createWebhookEvent(store.id, topic, shopifyOrder.id)

		try {
			// Check if order already exists
			const existingOrder = await db.getOrderByShopifyId(store.id, shopifyOrder.id)
			if (existingOrder) {
				console.log('Order already exists:', shopifyOrder.name)
				await db.markWebhookEventProcessed(webhookEventId)
				return new Response('OK', { status: 200 })
			}

			// Get global field mappings (not store-specific)
			const [globalMappings, extractMappings] = await Promise.all([
				db.getGlobalFieldMappings(), // No storeId for global mappings
				db.getExtractProcessingMappings() // No storeId for global mappings
			])
			
			// Process the order using global mappings
			const processedData = processShopifyOrder(shopifyOrder, globalMappings, extractMappings)
			
			// Save order to database
			await db.createOrder({
				store_id: store.id,
				shopify_order_id: shopifyOrder.id,
				shopify_order_name: shopifyOrder.name,
				status: 'Ready for Export',
				processed_data: JSON.stringify(processedData),
				raw_shopify_data: body,
				exported_at: null
			})

			await db.markWebhookEventProcessed(webhookEventId)
			console.log('Order processed successfully:', shopifyOrder.name)
			
			return new Response('OK', { status: 200 })
		} catch (error) {
			console.error('Error processing order:', error)
			await db.markWebhookEventProcessed(webhookEventId, error.message)
			return new Response('Processing error', { status: 500 })
		}
	} catch (error) {
		console.error('Webhook error:', error)
		return new Response('Internal Server Error', { status: 500 })
	}
}

// Store management handlers
async function handleGetStores(db: DatabaseService): Promise<Response> {
	try {
		const stores = await db.getAllStores()
		return new Response(JSON.stringify(stores), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to get stores' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleCreateStore(request: Request, db: DatabaseService): Promise<Response> {
	try {
		const storeData = await request.json()
		const store = await db.createStore(storeData)
		
		return new Response(JSON.stringify(store), {
			status: 201,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to create store' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleGetStore(storeId: string, db: DatabaseService): Promise<Response> {
	try {
		const store = await db.getStoreById(storeId)
		if (!store) {
			return new Response(JSON.stringify({ error: 'Store not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		return new Response(JSON.stringify(store), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to get store' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleUpdateStore(storeId: string, request: Request, db: DatabaseService): Promise<Response> {
	try {
		const updates = await request.json()
		await db.updateStore(storeId, updates)
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to update store' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleDeleteStore(storeId: string, db: DatabaseService): Promise<Response> {
	try {
		await db.deleteStore(storeId)
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to delete store' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

// Order management handlers
async function handleGetOrders(request: Request, db: DatabaseService): Promise<Response> {
	try {
		const url = new URL(request.url)
		const storeId = url.searchParams.get('storeId')
		const status = url.searchParams.get('status')
		const limit = parseInt(url.searchParams.get('limit') || '50')
		const offset = parseInt(url.searchParams.get('offset') || '0')

		let orders
		if (storeId) {
			orders = await db.getOrdersByStore(storeId, limit, offset)
		} else if (status) {
			orders = await db.getOrdersByStatus(status, limit, offset)
		} else {
			orders = await db.getOrdersByStatus('Ready for Export', limit, offset)
		}

		return new Response(JSON.stringify(orders), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to get orders' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

// Field mapping handlers
async function handleGetMappings(storeId: string, db: DatabaseService): Promise<Response> {
	try {
		const [globalMappings, extractMappings] = await Promise.all([
			db.getGlobalFieldMappings(storeId),
			db.getExtractProcessingMappings(storeId)
		])
		
		return new Response(JSON.stringify({
			globalMappings,
			extractMappings
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to get mappings' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleSaveMappings(storeId: string, request: Request, db: DatabaseService): Promise<Response> {
	try {
		const { globalMappings, extractMappings } = await request.json()
		
		await Promise.all([
			db.saveGlobalFieldMappings(storeId, globalMappings),
			db.saveExtractProcessingMappings(storeId, extractMappings)
		])
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to save mappings' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

// Global field mapping handlers
async function handleGetGlobalFieldMappings(db: DatabaseService): Promise<Response> {
	try {
		console.log('Getting global field mappings...')
		// Get global field mappings (not store-specific)
		const globalMappings = await db.getGlobalFieldMappings() // No storeId for global mappings
		const extractMappings = await db.getExtractProcessingMappings() // No storeId for global mappings
		
		console.log('Global mappings:', globalMappings)
		console.log('Extract mappings:', extractMappings)
		
		return new Response(JSON.stringify({
			globalFieldMappings: globalMappings,
			extractProcessingMappings: extractMappings
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error getting global field mappings:', error)
		return new Response(JSON.stringify({ 
			error: 'Failed to get global field mappings',
			details: error instanceof Error ? error.message : String(error)
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleSaveGlobalFieldMappings(request: Request, db: DatabaseService): Promise<Response> {
	try {
		console.log('Saving global field mappings...')
		const { globalFieldMappings, extractProcessingMappings } = await request.json()
		
		console.log('Received globalFieldMappings:', globalFieldMappings)
		console.log('Received extractProcessingMappings:', extractProcessingMappings)
		
		// Save global field mappings (not store-specific)
		await Promise.all([
			db.saveGlobalFieldMappings(null, globalFieldMappings), // null for global mappings
			db.saveExtractProcessingMappings(null, extractProcessingMappings) // null for global mappings
		])
		
		console.log('Successfully saved global field mappings')
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error saving global field mappings:', error)
		return new Response(JSON.stringify({ 
			error: 'Failed to save global field mappings',
			details: error instanceof Error ? error.message : String(error)
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function fetchOrdersFromShopify(db: any, store: any, globalMappings: any, extractMappings: any): Promise<{ storeId: string, storeName: string, fetched: number, saved: number, errors: string[] }> {
	const results = { storeId: store.id, storeName: store.store_name, fetched: 0, saved: 0, errors: [] as string[] }
	try {
		console.log(`Fetching orders from Shopify store: ${store.store_name} (${store.shopify_domain})`)
		// Shopify REST Admin API endpoint for orders
		const apiUrl = `https://${store.shopify_domain}/admin/api/${store.api_version || '2024-01'}/orders.json?status=any&limit=50`
		console.log(`Making API call to: ${apiUrl}`)
		
		const response = await fetch(apiUrl, {
			headers: {
				'X-Shopify-Access-Token': store.access_token,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
		})
		console.log(`Shopify API response status: ${response.status}`)
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error(`Shopify API error: ${response.status} - ${errorText}`)
			results.errors.push(`Failed to fetch: ${response.status} - ${errorText}`)
			return results
		}
		
		const data = await response.json()
		const shopifyOrders: any[] = data.orders || []
		console.log(`Received ${shopifyOrders.length} orders from Shopify`)
		results.fetched = shopifyOrders.length
		
		for (const shopifyOrder of shopifyOrders) {
			try {
				console.log(`Processing order: ${shopifyOrder.name} (ID: ${shopifyOrder.id})`)
				// Check if order already exists
				const existingOrder = await db.getOrderByShopifyId(store.id, shopifyOrder.id)
				if (existingOrder) {
					console.log(`Order ${shopifyOrder.name} already exists, skipping`)
					continue
				}
				// Process and save
				const processedData = processShopifyOrder(shopifyOrder, globalMappings, extractMappings)
				await db.createOrder({
					store_id: store.id,
					shopify_order_id: shopifyOrder.id,
					shopify_order_name: shopifyOrder.name,
					status: 'Ready for Export',
					processed_data: JSON.stringify(processedData),
					raw_shopify_data: JSON.stringify(shopifyOrder),
					exported_at: null
				})
				console.log(`Successfully saved order: ${shopifyOrder.name}`)
				results.saved++
			} catch (err: any) {
				console.error(`Error processing order ${shopifyOrder.id}:`, err)
				results.errors.push(`Order ${shopifyOrder.id}: ${err.message}`)
			}
		}
	} catch (err: any) {
		console.error(`General error for store ${store.store_name}:`, err)
		results.errors.push(`General error: ${err.message}`)
	}
	console.log(`Completed processing store ${store.store_name}. Results:`, results)
	return results
}

async function handleFetchOrders(request: Request, db: DatabaseService): Promise<Response> {
	try {
		console.log('Starting fetch orders process...')
		const stores = await db.getAllStores()
		console.log(`Found ${stores.length} stores in database:`, stores.map((s: any) => ({ id: s.id, name: s.store_name, domain: s.shopify_domain })))
		
		if (stores.length === 0) {
			console.log('No stores found in database')
			return new Response(JSON.stringify({ 
				success: true, 
				results: [],
				message: 'No stores configured. Please add stores in Settings first.'
			}), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		const [globalMappings, extractMappings] = await Promise.all([
			db.getGlobalFieldMappings(),
			db.getExtractProcessingMappings()
		])
		console.log(`Loaded ${globalMappings.length} global mappings and ${extractMappings.length} extract mappings`)
		
		const results: any[] = []
		for (const store of stores) {
			console.log(`Processing store: ${store.store_name} (${store.shopify_domain})`)
			const res = await fetchOrdersFromShopify(db, store, globalMappings, extractMappings)
			console.log(`Store ${store.store_name} result:`, res)
			results.push(res)
		}
		
		console.log('Fetch orders completed. Results:', results)
		return new Response(JSON.stringify({ success: true, results }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error: any) {
		console.error('Error in handleFetchOrders:', error)
		return new Response(JSON.stringify({ error: 'Failed to fetch orders', details: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}