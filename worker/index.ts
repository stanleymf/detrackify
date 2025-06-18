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

// Helper function to generate UUID
function generateUUID(): string {
	return globalThis.crypto.randomUUID()
}

// Helper function to fetch complete order data from Shopify API
async function fetchCompleteOrderData(accessToken: string, shopDomain: string, orderId: string): Promise<any> {
	try {
		console.log(`Fetching order ${orderId} from ${shopDomain}...`)
		const response = await fetch(`https://${shopDomain}/admin/api/2024-01/orders/${orderId}.json`, {
			headers: {
				'X-Shopify-Access-Token': accessToken,
				'Content-Type': 'application/json'
			}
		})
		
		if (!response.ok) {
			console.error(`Failed to fetch order from Shopify API: ${response.status} ${response.statusText}`)
			if (response.status === 404) {
				console.error(`Order ${orderId} not found - it may have been deleted or the ID is incorrect`)
			} else if (response.status === 401) {
				console.error('Authentication failed - check access token permissions')
			} else if (response.status === 403) {
				console.error('Access denied - insufficient permissions for this order')
			}
			return null
		}
		
		const data = await response.json()
		console.log(`Successfully fetched order ${orderId} from Shopify API`)
		return data.order
	} catch (error) {
		console.error('Error fetching order from Shopify API:', error)
		return null
	}
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

	if (path === '/api/update-webhook-secrets' && request.method === 'POST') {
		return handleUpdateWebhookSecrets(db)
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

	if (path === '/api/reprocess-orders' && request.method === 'POST') {
		return handleReprocessOrders(request, db)
	}

	if (path === '/api/detrack/config' && request.method === 'GET') {
		return handleGetDetrackConfig(db)
	}

	if (path === '/api/detrack/config' && request.method === 'POST') {
		return handleSaveDetrackConfig(request, db)
	}

	if (path === '/api/detrack/test' && request.method === 'POST') {
		return handleTestDetrackConnection(db)
	}

	if (path === '/api/detrack/update-key' && request.method === 'POST') {
		return handleUpdateDetrackApiKey(db)
	}

	// Protected routes (authentication required)
	const authResult = await requireAuth(request, authService)
	if (!authResult.authenticated) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

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

	if (path === '/api/orders/clear-all' && request.method === 'DELETE') {
		return handleClearAllOrders(db)
	}

	if (path === '/api/export/detrack' && request.method === 'POST') {
		return handleExportToDetrack(request, db)
	}

	if (path.startsWith('/api/orders/') && request.method === 'DELETE') {
		const orderId = path.split('/')[3]
		return handleDeleteOrder(orderId, db)
	}

	if (path.startsWith('/api/stores/') && path.includes('/mappings') && request.method === 'GET') {
		const storeId = path.split('/')[3]
		return handleGetMappings(storeId, db)
	}

	if (path.startsWith('/api/stores/') && path.includes('/mappings') && request.method === 'POST') {
		const storeId = path.split('/')[3]
		return handleSaveMappings(storeId, request, db)
	}

	if (path.startsWith('/api/stores/') && path.endsWith('/register-webhook') && request.method === 'POST') {
		const storeId = path.split('/')[3];
		return handleRegisterShopifyWebhook(storeId, db);
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
	console.log('=== WEBHOOK HANDLER VERSION 3.0 START ===')
	console.log('This is the NEWEST version of the webhook handler')
	console.log('Using global field mappings directly (no per-store logic)')
	
	try {
		const shopDomain = request.headers.get('x-shopify-shop-domain')
		const topic = request.headers.get('x-shopify-topic')
		const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
		
		console.log('Webhook received:', { shopDomain, topic, hmacHeader: hmacHeader ? 'present' : 'missing' })
		
		if (!shopDomain || !topic || !hmacHeader) {
			console.error('Missing required headers:', { shopDomain, topic, hmacHeader: !!hmacHeader })
			return new Response('Missing required headers', { status: 400 })
		}

		// Get store configuration
		const store = await db.getStoreByDomain(shopDomain)
		if (!store) {
			console.error('Store not found:', shopDomain)
			return new Response('Store not found', { status: 404 })
		}

		console.log('Store found:', { storeId: store.id, storeName: store.store_name, hasWebhookSecret: !!store.webhook_secret })

		// Verify webhook signature
		const body = await request.text()
		
		// Get webhook secret from store (per-store private app approach)
		let webhookSecret: string | null = null
		let secretSource = 'none'
		
		console.log('Webhook secret debugging:', {
			storeApiSecret: store.api_secret,
			storeApiSecretType: typeof store.api_secret,
			storeApiSecretLength: store.api_secret?.length || 0,
			storeApiSecretTruthy: !!store.api_secret
		})
		
		// Use store's API secret (for private app approach)
		if (store.api_secret && store.api_secret.trim().length > 0) {
			webhookSecret = store.api_secret
			secretSource = 'store'
		}
		
		console.log('Webhook secret resolution:', {
			webhookSecret: webhookSecret ? 'present' : 'missing',
			webhookSecretLength: webhookSecret?.length || 0,
			secretSource
		})
		
		// TEMPORARILY DISABLED: Webhook signature validation for private app testing
		// TODO: Implement proper polling for private apps instead of webhooks
		console.log('Webhook signature validation temporarily disabled for private app testing')
		
		/*
		if (!webhookSecret) {
			console.error('No webhook secret available for signature validation')
			console.error('Please set the API secret in the store configuration or as SHOPIFY_API_SECRET environment variable')
			return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 401 })
		}
		
		// Verify HMAC signature
		const hmacHeader = request.headers.get('x-shopify-hmac-sha256')
		if (!hmacHeader) {
			console.error('Missing HMAC header')
			return new Response(JSON.stringify({ error: 'Missing HMAC header' }), { status: 401 })
		}
		
		const calculatedHmac = crypto.createHmac('sha256', webhookSecret).update(body, 'utf8').digest('hex')
		const receivedHmac = hmacHeader
		
		console.log('Signature validation:', {
			calculatedHmac: calculatedHmac.substring(0, 10) + '...',
			receivedHmac: receivedHmac.substring(0, 10) + '...',
			match: calculatedHmac === receivedHmac,
			secretSource,
			secretLength: webhookSecret.length
		})
		
		if (calculatedHmac !== receivedHmac) {
			console.error('Invalid webhook signature')
			console.error('Expected:', calculatedHmac)
			console.error('Received:', receivedHmac)
			console.error('Webhook secret length:', webhookSecret.length)
			console.error('Secret source:', secretSource)
			return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401 })
		}
		*/

		// Parse Shopify order data
		let orderData: any
		try {
			console.log('Raw webhook body:', body.substring(0, 500) + (body.length > 500 ? '...' : ''))
			orderData = JSON.parse(body)
			console.log('Webhook data structure:', {
				hasOrder: !!orderData.order,
				hasFulfillment: !!orderData.fulfillment,
				orderKeys: orderData.order ? Object.keys(orderData.order) : [],
				fulfillmentKeys: orderData.fulfillment ? Object.keys(orderData.fulfillment) : [],
				orderId: orderData.order?.id,
				orderName: orderData.order?.name,
				fulfillmentId: orderData.fulfillment?.id,
				allKeys: Object.keys(orderData)
			})
			
			// Log some key fields to see what's available
			if (orderData.order) {
				console.log('Order data sample:', {
					name: orderData.order.name,
					email: orderData.order.email,
					shipping_address: orderData.order.shipping_address,
					billing_address: orderData.order.billing_address,
					line_items: orderData.order.line_items?.length || 0,
					tags: orderData.order.tags,
					note: orderData.order.note
				})
			}
		} catch (error) {
			console.error('Failed to parse webhook data:', error)
			console.error('Raw body that failed to parse:', body)
			return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
		}
		
		// Handle different webhook data structures
		let orderId: string | null = null
		let orderName: string | null = null
		
		if (orderData.order) {
			orderId = orderData.order.id?.toString()
			orderName = orderData.order.name
		} else if (orderData.fulfillment) {
			orderId = orderData.fulfillment.order_id?.toString()
			orderName = orderData.fulfillment.order_name || `Order ${orderData.fulfillment.order_id}`
		} else if (orderData.id) {
			// Direct order data
			orderId = orderData.id?.toString()
			orderName = orderData.name
		} else {
			console.error('No order information found in webhook data')
			console.error('Available keys:', Object.keys(orderData))
			return new Response(JSON.stringify({ error: 'No order information in webhook' }), { status: 400 })
		}
		
		if (!orderId) {
			console.error('No order ID found in webhook data')
			return new Response(JSON.stringify({ error: 'No order ID in webhook' }), { status: 400 })
		}
		
		console.log('Processing webhook for order:', orderName)
		
		// Create webhook event record first
		const webhookEventId = await db.createWebhookEvent(store.id, topic, parseInt(orderId))
		
		// Fetch complete order data from Shopify API since webhook data is incomplete
		console.log('Fetching complete order data from Shopify API...')
		const completeOrderData = await fetchCompleteOrderData(store.access_token, store.shopify_domain, orderId)
		
		if (!completeOrderData) {
			console.error('Failed to fetch complete order data from Shopify API')
			console.error('This could be because:')
			console.error('1. The order was deleted from Shopify')
			console.error('2. The order ID in the webhook is incorrect')
			console.error('3. The access token has insufficient permissions')
			console.error('4. The order is from a different store')
			console.error('Skipping this webhook to avoid errors')
			
			// Mark webhook as processed even if order not found to avoid retries
			await db.markWebhookEventProcessed(webhookEventId, 'Order not found in Shopify API')
			return new Response('OK - Order not found, skipping', { status: 200 })
		}
		
		console.log('Complete order data fetched successfully:', {
			name: completeOrderData.name,
			email: completeOrderData.email,
			hasShippingAddress: !!completeOrderData.shipping_address,
			hasBillingAddress: !!completeOrderData.billing_address,
			lineItemsCount: completeOrderData.line_items?.length || 0,
			tags: completeOrderData.tags,
			note: completeOrderData.note
		})

		try {
			// Check if order already exists
			const existingOrder = await db.getOrderByShopifyId(store.id, parseInt(orderId))
			if (existingOrder) {
				console.log('Order already exists:', orderName)
				// Update the existing order with fresh data instead of skipping
				console.log('Updating existing order with fresh data...')
				
				// Get field mappings - use global mappings directly
				console.log('=== WEBHOOK HANDLER DEBUG ===')
				console.log('About to call db.getGlobalFieldMappings() WITHOUT any parameters')
				console.log('This should load global mappings (store_id IS NULL)')
				const globalMappings = await db.getGlobalFieldMappings()
				console.log('=== WEBHOOK HANDLER DEBUG ===')
				console.log('Called db.getGlobalFieldMappings() WITHOUT parameters')
				console.log('Result length:', globalMappings.length)
				console.log('First few mappings:', globalMappings.slice(0, 3))
				console.log('About to call db.getExtractProcessingMappings() WITHOUT any parameters')
				const extractMappings = await db.getExtractProcessingMappings()
				console.log('Called db.getExtractProcessingMappings() WITHOUT parameters')
				console.log('Result length:', extractMappings.length)
				console.log('=== END WEBHOOK HANDLER DEBUG ===')
				
				// Process the order using global mappings with complete data
				const processedDataArray = processShopifyOrder(completeOrderData, globalMappings, extractMappings)
				
				// Update existing order with fresh data
				await db.updateOrder(existingOrder.id, {
					shopify_order_name: orderName!,
					processed_data: JSON.stringify(processedDataArray),
					raw_shopify_data: JSON.stringify(completeOrderData),
					updated_at: new Date().toISOString()
				})
				
				await db.markWebhookEventProcessed(webhookEventId)
				console.log('Order updated successfully:', orderName)
				return new Response('OK', { status: 200 })
			}
			
			// Get field mappings - use global mappings directly
			console.log('=== WEBHOOK HANDLER DEBUG ===')
			console.log('About to call db.getGlobalFieldMappings() WITHOUT any parameters')
			console.log('This should load global mappings (store_id IS NULL)')
			const globalMappings = await db.getGlobalFieldMappings()
			console.log('=== WEBHOOK HANDLER DEBUG ===')
			console.log('Called db.getGlobalFieldMappings() WITHOUT parameters')
			console.log('Result length:', globalMappings.length)
			console.log('First few mappings:', globalMappings.slice(0, 3))
			console.log('About to call db.getExtractProcessingMappings() WITHOUT any parameters')
			const extractMappings = await db.getExtractProcessingMappings()
			console.log('Called db.getExtractProcessingMappings() WITHOUT parameters')
			console.log('Result length:', extractMappings.length)
			console.log('=== END WEBHOOK HANDLER DEBUG ===')
			
			// Process the order using global mappings with complete data
			const processedDataArray = processShopifyOrder(completeOrderData, globalMappings, extractMappings)
			
			// Save order to database with expanded line-item data
			await db.createOrder({
				store_id: store.id,
				shopify_order_id: parseInt(orderId),
				shopify_order_name: orderName!,
				status: 'Ready for Export' as const,
				processed_data: JSON.stringify(processedDataArray),
				raw_shopify_data: JSON.stringify(completeOrderData),
				exported_at: null
			})

			await db.markWebhookEventProcessed(webhookEventId)
			console.log('Order processed successfully:', orderName)
			
			return new Response('OK', { status: 200 })
		} catch (error) {
			console.error('Error processing order:', error)
			await db.markWebhookEventProcessed(webhookEventId, error instanceof Error ? error.message : String(error))
			return new Response(JSON.stringify({ error: 'Failed to process order' }), { status: 500 })
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
		console.log('Updating store:', storeId, 'with updates:', updates)
		await db.updateStore(storeId, updates)
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error updating store:', error)
		return new Response(JSON.stringify({ error: 'Failed to update store', details: error.message }), {
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

		console.log('handleGetOrders called with:', { storeId, status, limit, offset })

		let orders
		if (storeId) {
			orders = await db.getOrdersByStore(storeId, limit, offset)
			console.log(`Found ${orders.length} orders for store ${storeId}`)
		} else if (status) {
			orders = await db.getOrdersByStatus(status, limit, offset)
			console.log(`Found ${orders.length} orders with status ${status}`)
		} else {
			// Get all orders instead of just 'Ready for Export'
			orders = await db.getAllOrders(limit, offset)
			console.log(`Found ${orders.length} total orders`)
		}

		console.log('Raw orders from database:', orders.map(o => ({ id: o.id, name: o.shopify_order_name, status: o.status })))

		// Transform database orders to frontend format
		const transformedOrders: any[] = []
		
		orders.forEach(dbOrder => {
			console.log(`Processing order ${dbOrder.shopify_order_name}:`)
			console.log(`  - processed_data type: ${typeof dbOrder.processed_data}`)
			console.log(`  - processed_data length: ${dbOrder.processed_data?.length || 0}`)
			console.log(`  - processed_data preview: ${dbOrder.processed_data?.substring(0, 200) || 'null/undefined'}`)
			
			try {
				const processedDataArray = JSON.parse(dbOrder.processed_data)
				console.log(`Successfully parsed processed data for order ${dbOrder.shopify_order_name}:`, processedDataArray)
				
				// Check if processedDataArray is an array (new format) or object (old format)
				if (Array.isArray(processedDataArray)) {
					// New format: array of line-item data
					processedDataArray.forEach((processedData, index) => {
						transformedOrders.push({
							id: `${dbOrder.id}-${index}`, // Unique ID for each line item
							...processedData,
							status: dbOrder.status,
							created_at: dbOrder.created_at,
							updated_at: dbOrder.updated_at
						})
					})
				} else {
					// Old format: single object
					transformedOrders.push({
						id: dbOrder.id,
						...processedDataArray,
						status: dbOrder.status,
						created_at: dbOrder.created_at,
						updated_at: dbOrder.updated_at
					})
				}
			} catch (error) {
				console.error('Error parsing processed data for order:', dbOrder.id, error)
				console.error('Raw processed_data:', dbOrder.processed_data)
				// Return a minimal order object if parsing fails
				transformedOrders.push({
					id: dbOrder.id,
					deliveryOrderNo: dbOrder.shopify_order_name,
					status: dbOrder.status,
					// Add default values for required fields
					deliveryDate: '',
					processingDate: '',
					jobReleaseTime: '',
					deliveryCompletionTimeWindow: '',
					trackingNo: '',
					senderNumberOnApp: '',
					deliverySequence: '',
					address: '',
					companyName: '',
					postalCode: '',
					firstName: '',
					lastName: '',
					recipientPhoneNo: '',
					senderPhoneNo: '',
					instructions: '',
					assignTo: '',
					emailsForNotifications: '',
					zone: '',
					accountNo: '',
					deliveryJobOwner: '',
					senderNameOnApp: '',
					group: '',
					noOfShippingLabels: '',
					attachmentUrl: '',
					podAt: '',
					remarks: '',
					itemCount: '',
					serviceTime: '',
					sku: '',
					description: '',
					qty: ''
				})
			}
		})

		console.log(`Returning ${transformedOrders.length} transformed orders`)

		return new Response(JSON.stringify(transformedOrders), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error in handleGetOrders:', error)
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
		let extractMappings = await db.getExtractProcessingMappings() // No storeId for global mappings
		
		// If no extract mappings exist, create default ones
		if (extractMappings.length === 0) {
			console.log('No extract mappings found, creating defaults...')
			const defaultExtractMappings = [
				{
					dashboardField: 'deliveryDate',
					processingType: 'date',
					sourceField: 'order.tags',
					format: 'dd/mm/yyyy'
				},
				{
					dashboardField: 'processingDate',
					processingType: 'date',
					sourceField: 'order.tags',
					format: 'dd/mm/yyyy'
				},
				{
					dashboardField: 'jobReleaseTime',
					processingType: 'time',
					sourceField: 'order.tags',
					format: 'time_window'
				},
				{
					dashboardField: 'deliveryCompletionTimeWindow',
					processingType: 'time',
					sourceField: 'order.tags',
					format: 'time_window'
				},
				{
					dashboardField: 'group',
					processingType: 'group',
					sourceField: 'order.name',
					format: 'first_two_letters'
				},
				{
					dashboardField: 'noOfShippingLabels',
					processingType: 'itemCount',
					sourceField: 'line_items',
					format: 'sum_quantities'
				},
				{
					dashboardField: 'itemCount',
					processingType: 'itemCount',
					sourceField: 'line_items',
					format: 'sum_quantities'
				}
			]
			
			await db.saveExtractProcessingMappings(null, defaultExtractMappings)
			extractMappings = defaultExtractMappings
			console.log('Created default extract mappings')
		}
		
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
		const apiUrl = `https://${store.shopify_domain}/admin/api/${store.api_version || '2024-01'}/orders.json?status=any&limit=200`
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
				
				console.log(`Processing order ${shopifyOrder.name} with mappings:`, { globalMappings: globalMappings.length, extractMappings: extractMappings.length })
				
				// Process and save
				const processedDataArray = processShopifyOrder(shopifyOrder, globalMappings, extractMappings)
				console.log(`Processed data for order ${shopifyOrder.name}:`, processedDataArray)
				
				const orderToSave = {
					store_id: store.id,
					shopify_order_id: shopifyOrder.id,
					shopify_order_name: shopifyOrder.name,
					status: 'Ready for Export' as const,
					processed_data: JSON.stringify(processedDataArray),
					raw_shopify_data: JSON.stringify(shopifyOrder),
					exported_at: null
				}
				
				console.log(`Saving order to database:`, orderToSave)
				await db.createOrder(orderToSave)
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

async function handleDeleteOrder(orderId: string, db: DatabaseService): Promise<Response> {
	try {
		await db.deleteOrder(orderId)
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to delete order' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleReprocessOrders(request: Request, db: DatabaseService): Promise<Response> {
	try {
		console.log('Starting reprocess orders process...')
		
		// Get all existing orders from database
		const existingOrders = await db.getAllOrders(1000, 0)
		console.log(`Found ${existingOrders.length} existing orders to reprocess`)
		
		if (existingOrders.length === 0) {
			console.log('No orders found in database to reprocess')
			return new Response(JSON.stringify({ 
				success: true, 
				results: [],
				message: 'No orders found in database to reprocess.'
			}), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		// Load global field mappings
		const [globalMappings, extractMappings] = await Promise.all([
			db.getGlobalFieldMappings(),
			db.getExtractProcessingMappings()
		])
		console.log(`Loaded ${globalMappings.length} global mappings and ${extractMappings.length} extract mappings`)
		
		let reprocessedCount = 0
		const errors: string[] = []
		
		for (const dbOrder of existingOrders) {
			try {
				console.log(`Reprocessing order: ${dbOrder.shopify_order_name}`)
				
				// Parse the raw Shopify data
				const rawShopifyData = JSON.parse(dbOrder.raw_shopify_data)
				
				// Reprocess the order with correct mappings
				const processedDataArray = processShopifyOrder(rawShopifyData, globalMappings, extractMappings)
				console.log(`Reprocessed data for order ${dbOrder.shopify_order_name}:`, processedDataArray)
				
				// Update the order in database with new processed data
				await db.updateOrder(dbOrder.id, {
					processed_data: JSON.stringify(processedDataArray),
					updated_at: new Date().toISOString()
				})
				
				console.log(`Successfully reprocessed order: ${dbOrder.shopify_order_name}`)
				reprocessedCount++
			} catch (err: any) {
				console.error(`Error reprocessing order ${dbOrder.shopify_order_name}:`, err)
				errors.push(`Order ${dbOrder.shopify_order_name}: ${err.message}`)
			}
		}
		
		console.log('Reprocess orders completed. Results:', { reprocessedCount, errors })
		return new Response(JSON.stringify({ 
			success: true, 
			results: [{
				storeName: 'All Stores',
				reprocessed: reprocessedCount,
				errors
			}]
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error: any) {
		console.error('Error in handleReprocessOrders:', error)
		return new Response(JSON.stringify({ error: 'Failed to reprocess orders', details: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleClearAllOrders(db: DatabaseService): Promise<Response> {
	try {
		console.log('handleClearAllOrders: Starting bulk delete operation...')
		
		// First, let's check how many orders exist before deletion
		const ordersBefore = await db.getAllOrders(1000, 0)
		console.log(`handleClearAllOrders: Found ${ordersBefore.length} orders before deletion`)
		
		await db.deleteAllOrders()
		console.log('handleClearAllOrders: deleteAllOrders() completed')
		
		// Let's verify the deletion worked
		const ordersAfter = await db.getAllOrders(1000, 0)
		console.log(`handleClearAllOrders: Found ${ordersAfter.length} orders after deletion`)
		
		return new Response(JSON.stringify({ success: true, deletedCount: ordersBefore.length }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('handleClearAllOrders: Error during bulk delete:', error)
		return new Response(JSON.stringify({ error: 'Failed to clear all orders', details: error instanceof Error ? error.message : String(error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleUpdateWebhookSecrets(db: DatabaseService): Promise<Response> {
	try {
		// Get all stores
		const stores = await db.getAllStores()
		
		console.log(`Found ${stores.length} stores`)
		
		const updatedStores: Array<{storeName: string, domain: string, newWebhookSecret: string}> = []
		
		for (const store of stores) {
			console.log(`Processing store: ${store.store_name} (${store.shopify_domain})`)
			
			// Check if webhook secret is empty or missing
			if (!store.webhook_secret || store.webhook_secret === '') {
				// Generate new webhook secret
				const newWebhookSecret = generateUUID()
				
				// Update the store
				await db.updateStore(store.id, { webhook_secret: newWebhookSecret })
				
				console.log(`  ✅ Updated webhook secret for ${store.store_name}`)
				console.log(`  New webhook secret: ${newWebhookSecret}`)
				
				updatedStores.push({
					storeName: store.store_name,
					domain: store.shopify_domain,
					newWebhookSecret
				})
			} else {
				console.log(`  ⏭️  Store ${store.store_name} already has webhook secret`)
			}
		}
		
		console.log('Webhook secret update completed!')
		
		return new Response(JSON.stringify({ 
			success: true, 
			message: `Updated ${updatedStores.length} stores`,
			updatedStores 
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error updating webhook secrets:', error)
		return new Response(JSON.stringify({ 
			error: 'Failed to update webhook secrets', 
			details: error instanceof Error ? error.message : String(error) 
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleRegisterShopifyWebhook(storeId: string, db: DatabaseService): Promise<Response> {
	try {
		const store = await db.getStoreById(storeId);
		if (!store) {
			return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404 });
		}

		const webhookUrl = 'https://detrackify.stanleytan92.workers.dev/api/webhooks/shopify';
		const accessToken = store.access_token;
		const shop = store.shopify_domain.replace(/^https?:\/\//, '');

		console.log('Attempting to register webhook:', {
			shop,
			webhookUrl,
			hasAccessToken: !!accessToken,
			accessTokenLength: accessToken?.length || 0
		});

		// First, let's check existing webhooks to avoid duplicates
		const listResponse = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
			method: 'GET',
			headers: {
				'X-Shopify-Access-Token': accessToken,
			}
		});

		if (listResponse.ok) {
			const existingWebhooks = await listResponse.json();
			console.log('Existing webhooks:', existingWebhooks);
			
			// Check if our webhook already exists
			const existingWebhook = existingWebhooks.webhooks?.find((wh: any) => 
				wh.address === webhookUrl && wh.topic === 'orders/fulfilled'
			);
			
			if (existingWebhook) {
				console.log('Webhook already exists:', existingWebhook);
				return new Response(JSON.stringify({ 
					success: true, 
					message: 'Webhook already registered',
					webhook: existingWebhook 
				}), { status: 200 });
			}
		}

		// Register webhook for orders/fulfilled topic
		const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Shopify-Access-Token': accessToken,
			},
			body: JSON.stringify({
				webhook: {
					topic: 'orders/fulfilled',
					address: webhookUrl,
					format: 'json'
				}
			})
		});

		const data = await response.json();
		console.log('Shopify webhook registration response:', {
			status: response.status,
			statusText: response.statusText,
			data: data
		});

		if (!response.ok) {
			// Provide more detailed error information
			const errorMessage = data.errors ? 
				Object.entries(data.errors).map(([key, value]) => `${key}: ${value}`).join(', ') :
				data.message || 'Unknown error';
				
			return new Response(JSON.stringify({ 
				error: 'Shopify webhook registration failed', 
				shopifyError: errorMessage,
				status: response.status,
				statusText: response.statusText,
				fullResponse: data
			}), { status: 400 });
		}

		return new Response(JSON.stringify({ 
			success: true, 
			message: 'Webhook registered successfully',
			webhook: data.webhook 
		}), { status: 200 });
	} catch (error) {
		console.error('Error in handleRegisterShopifyWebhook:', error);
		return new Response(JSON.stringify({ 
			error: 'Failed to register webhook', 
			details: error instanceof Error ? error.message : String(error) 
		}), { status: 500 });
	}
}

async function handleExportToDetrack(request: Request, db: DatabaseService): Promise<Response> {
	try {
		console.log('=== EXPORT TO DETRACK START ===')
		console.log('Starting export to Detrack process...')
		
		const body = await request.json()
		const { orderIds } = body
		
		if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
			return new Response(JSON.stringify({ error: 'No order IDs provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		console.log(`Exporting ${orderIds.length} orders to Detrack...`)
		
		// Get Detrack configuration from database
		console.log('Getting Detrack configuration...')
		const detrackConfig = await getDetrackConfig(db)
		console.log('Detrack config:', {
			hasConfig: !!detrackConfig,
			isEnabled: detrackConfig?.isEnabled,
			hasApiKey: !!detrackConfig?.apiKey,
			baseUrl: detrackConfig?.baseUrl
		})
		
		if (!detrackConfig) {
			return new Response(JSON.stringify({ error: 'Detrack configuration not found' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		if (!detrackConfig.isEnabled) {
			return new Response(JSON.stringify({ error: 'Detrack integration is disabled. Please enable it in Settings.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		if (!detrackConfig.apiKey) {
			return new Response(JSON.stringify({ error: 'Detrack API key not configured. Please set API Key in Settings.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		// Get all orders from database to find the ones we need to export
		const allOrders = await db.getAllOrders(1000, 0) // Get all orders
		console.log(`Found ${allOrders.length} total orders in database`)
		
		const results: Array<{ orderId: string, success: boolean, error?: string, detrackResponse?: string }> = []
		let successCount = 0
		let errorCount = 0
		
		for (const lineItemId of orderIds) {
			try {
				console.log(`\n--- Processing line item ${lineItemId} for Detrack export ---`)
				
				// Extract base order ID from line item ID (e.g., "90fc9be9-77fa-4550-830d-9853a44942f7-0" -> "90fc9be9-77fa-4550-830d-9853a44942f7")
				const baseOrderId = lineItemId.split('-').slice(0, -1).join('-')
				console.log(`Looking for base order ID: ${baseOrderId}`)
				
				// Find the order in our list
				const order = allOrders.find(o => o.id === baseOrderId)
				if (!order) {
					console.error(`Order ${baseOrderId} not found in database`)
					results.push({ orderId: lineItemId, success: false, error: 'Order not found' })
					errorCount++
					continue
				}
				
				console.log(`Order found: ${order.shopify_order_name}, Status: ${order.status}`)
				
				// Parse processed data
				let processedData: any[]
				try {
					processedData = JSON.parse(order.processed_data)
					console.log(`Processed data parsed successfully, ${processedData.length} items`)
				} catch (parseError) {
					console.error(`Failed to parse processed data for order ${baseOrderId}:`, parseError)
					results.push({ orderId: lineItemId, success: false, error: 'Invalid processed data format' })
					errorCount++
					continue
				}
				
				if (!processedData || processedData.length === 0) {
					console.error(`Order ${baseOrderId} has no processed data`)
					results.push({ orderId: lineItemId, success: false, error: 'No processed data available' })
					errorCount++
					continue
				}
				
				// Extract line item index from the line item ID (e.g., "90fc9be9-77fa-4550-830d-9853a44942f7-0" -> 0)
				const lineItemIndex = parseInt(lineItemId.split('-').pop() || '0')
				console.log(`Exporting line item index: ${lineItemIndex}`)
				
				if (lineItemIndex >= processedData.length) {
					console.error(`Line item index ${lineItemIndex} out of range (max: ${processedData.length - 1})`)
					results.push({ orderId: lineItemId, success: false, error: 'Line item index out of range' })
					errorCount++
					continue
				}
				
				// Get the specific line item data
				const lineItemData = processedData[lineItemIndex]
				console.log(`Line item data:`, {
					deliveryOrderNo: lineItemData.deliveryOrderNo,
					description: lineItemData.description,
					address: lineItemData.address,
					recipientPhoneNo: lineItemData.recipientPhoneNo
				})
				
				// Convert to Detrack format using dashboard fields directly
				const detrackPayload = convertToDetrackFormat(lineItemData, order.shopify_order_name)
				console.log('Detrack payload:', detrackPayload)
				
				// Validate required fields
				const requiredFields = ['do', 'date', 'address', 'phone', 'recipient_name']
				const missingFields = requiredFields.filter(field => !detrackPayload[field] || detrackPayload[field].trim() === '')
				
				if (missingFields.length > 0) {
					console.error(`Missing required fields for Detrack: ${missingFields.join(', ')}`)
					throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
				}
				
				console.log(`Sending to Detrack API: https://connect.detrack.com/api/v1/webhook/detrack/jobs/create/${detrackConfig.apiKey}`)
				console.log(`Using delivery order number: ${detrackPayload.do}`)
				
				const response = await fetch(`https://connect.detrack.com/api/v1/webhook/detrack/jobs/create/${detrackConfig.apiKey}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(detrackPayload)
				})
				
				console.log(`Detrack API response status: ${response.status}`)
				
				if (!response.ok) {
					const errorText = await response.text()
					console.error(`Detrack API error for order ${lineItemId}:`, response.status, errorText)
					throw new Error(`Detrack API error: ${response.status} - ${errorText}`)
				}
				
				const detrackResponse = await response.json()
				console.log(`Detrack API success response for order ${lineItemId}:`, detrackResponse)
				
				// Update order status to exported
				await db.updateOrder(baseOrderId, {
					status: 'Exported',
					exported_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				})
				
				console.log(`Order ${lineItemId} successfully exported to Detrack`)
				results.push({ orderId: lineItemId, success: true, detrackResponse: 'Successfully exported to Detrack' })
				successCount++
				
			} catch (error: any) {
				console.error(`Error exporting order ${lineItemId} to Detrack:`, error)
				
				// Update order status to error
				try {
					const baseOrderId = lineItemId.split('-').slice(0, -1).join('-')
					await db.updateOrder(baseOrderId, {
						status: 'Error',
						updated_at: new Date().toISOString()
					})
				} catch (updateError) {
					console.error(`Failed to update order status for ${lineItemId}:`, updateError)
				}
				
				results.push({ orderId: lineItemId, success: false, error: error.message })
				errorCount++
			}
		}
		
		console.log(`\n=== EXPORT TO DETRACK COMPLETED ===`)
		console.log(`Summary: Total: ${orderIds.length}, Success: ${successCount}, Errors: ${errorCount}`)
		
		return new Response(JSON.stringify({
			success: true,
			results,
			summary: {
				total: orderIds.length,
				success: successCount,
				errors: errorCount
			}
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
		
	} catch (error: any) {
		console.error('Error in handleExportToDetrack:', error)
		return new Response(JSON.stringify({ error: 'Failed to export to Detrack', details: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function getDetrackConfig(db: DatabaseService): Promise<any> {
	try {
		const config = await db.getDetrackConfig()
		if (config) {
			return {
				apiKey: config.api_key,
				baseUrl: config.base_url,
				isEnabled: config.is_enabled === 1
			}
		}
		
		// Return default config if none exists
		return {
			apiKey: '',
			baseUrl: 'https://app.detrack.com/api/v1/',
			isEnabled: false
		}
	} catch (error) {
		console.error('Error getting Detrack config from database:', error)
		// Return default config on error
		return {
			apiKey: '',
			baseUrl: 'https://app.detrack.com/api/v1/',
			isEnabled: false
		}
	}
}

function convertToDetrackFormat(orderData: any, orderName: string): any {
	// Use dashboard fields directly as they are already in the correct format for Detrack
	// This matches the CSV format that was previously used for manual import
	
	console.log('Converting order data to Detrack format using dashboard fields directly:', orderData)
	
	// Helper function to safely get field value
	const getField = (field: string, defaultValue: string = '') => {
		const value = orderData[field]
		return value && value.toString().trim() !== '' ? value.toString().trim() : defaultValue
	}
	
	// Helper function to clean phone number (remove country code if present)
	const cleanPhoneNumber = (phone: string) => {
		if (!phone) return ''
		// Remove +65 country code if present
		return phone.replace(/^\+65/, '').replace(/^65/, '')
	}

	// Helper function to convert time to 24-hour format
	const convertTo24Hour = (time: string) => {
		if (!time) return '09:00'
		
		// If already in 24-hour format, return as is
		if (time.includes(':') && !time.includes('am') && !time.includes('pm')) {
			return time
		}
		
		// Convert 12-hour format to 24-hour format
		const match = time.match(/(\d+):(\d+)(am|pm)/i)
		if (match) {
			let hours = parseInt(match[1])
			const minutes = match[2]
			const period = match[3].toLowerCase()
			
			if (period === 'pm' && hours !== 12) {
				hours += 12
			} else if (period === 'am' && hours === 12) {
				hours = 0
			}
			
			return `${hours.toString().padStart(2, '0')}:${minutes}`
		}
		
		return '09:00' // Default fallback
	}
	
	// Helper function to get delivery date in DD/MM/YYYY format (as Detrack expects)
	const getDeliveryDate = () => {
		const deliveryDate = getField('deliveryDate')
		if (deliveryDate) {
			// If it's already in DD/MM/YYYY format, return as is
			if (deliveryDate.includes('/')) {
				const parts = deliveryDate.split('/')
				if (parts.length === 3) {
					// Already in DD/MM/YYYY format
					return deliveryDate
				}
			}
			// If it's in YYYY-MM-DD format, convert to DD/MM/YYYY
			if (deliveryDate.includes('-') && deliveryDate.length === 10) {
				const parts = deliveryDate.split('-')
				if (parts.length === 3) {
					return `${parts[2]}/${parts[1]}/${parts[0]}`
				}
			}
			// If it's in MM/DD/YYYY format, convert to DD/MM/YYYY
			if (deliveryDate.includes('/') && deliveryDate.length === 10) {
				const parts = deliveryDate.split('/')
				if (parts.length === 3) {
					return `${parts[1]}/${parts[0]}/${parts[2]}`
				}
			}
			return deliveryDate
		}
		// Default to today if no date
		const today = new Date()
		return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
	}
	
	// Map dashboard fields directly to Detrack API fields
	// This matches the CSV structure that was previously used
	const payload = {
		// Core delivery information
		job_id: getField('deliveryOrderNo', orderName).replace('#', ''),
		date: getDeliveryDate(),
		time: convertTo24Hour(getField('jobReleaseTime', '09:00')),
		do: getField('deliveryOrderNo', orderName).replace('#', ''),
		
		// Delivery details
		delivery_type: 'delivery',
		status: 'pending',
		
		// Address and contact
		address: getField('address', ''),
		postal: getField('postalCode', ''),
		phone: cleanPhoneNumber(getField('recipientPhoneNo', '')),
		recipient_name: `${getField('firstName', '')} ${getField('lastName', '')}`.trim(),
		company: getField('companyName', ''),
		
		// Required shipping address structure
		shipping_address: {
			address1: getField('address', ''),
			postal_code: getField('postalCode', ''),
			phone: cleanPhoneNumber(getField('recipientPhoneNo', '')),
			recipient_name: `${getField('firstName', '')} ${getField('lastName', '')}`.trim(),
			company: getField('companyName', '')
		},
		
		// Additional information
		instructions: getField('instructions', ''),
		email: getField('emailsForNotifications', ''),
		sku: getField('sku', ''),
		qty: getField('qty', '1'),
		description: getField('description', ''),
		
		// Group and categorization
		group: getField('group', ''),
		zone: getField('zone', ''),
		
		// Account and assignment
		account_no: getField('accountNo', ''),
		assign_to: getField('assignTo', ''),
		delivery_job_owner: getField('deliveryJobOwner', ''),
		
		// Sender information
		sender_name: getField('senderNameOnApp', ''),
		sender_phone: cleanPhoneNumber(getField('senderPhoneNo', '')),
		sender_number: cleanPhoneNumber(getField('senderNumberOnApp', '')),
		
		// Additional fields
		service_time: getField('serviceTime', ''),
		remarks: getField('remarks', ''),
		attachment_url: getField('attachmentUrl', ''),
		pod_at: getField('podAt', ''),
		tracking_no: getField('trackingNo', ''),
		delivery_sequence: getField('deliverySequence', ''),
		no_of_shipping_labels: getField('noOfShippingLabels', ''),
		item_count: getField('itemCount', ''),
		delivery_completion_time_window: getField('deliveryCompletionTimeWindow', ''),
		processing_date: getField('processingDate', ''),
		
		// Shopify-specific field required by Detrack
		admin_graphql_api_id: getField('shopifyOrderId', orderName.replace('#', '')),
		
		// Additional required fields from validation error
		order_number: getField('deliveryOrderNo', orderName).replace('#', ''),
		updated_at: new Date().toISOString(), // Use proper ISO timestamp format
		line_items: [{
			title: getField('description', ''),
			quantity: parseInt(getField('qty', '1')),
			sku: getField('sku', ''),
			price: '0.00' // Default price since we don't have it
		}]
	}
	
	// Remove empty fields to avoid API validation issues
	const cleanPayload = Object.fromEntries(
		Object.entries(payload).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
	)

	console.log('Converted to Detrack format (using dashboard fields directly):', cleanPayload)
	return cleanPayload
}

async function handleGetDetrackConfig(db: DatabaseService): Promise<Response> {
	try {
		const detrackConfig = await getDetrackConfig(db)
		return new Response(JSON.stringify(detrackConfig), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error getting Detrack config:', error)
		return new Response(JSON.stringify({ error: 'Failed to get Detrack config' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleSaveDetrackConfig(request: Request, db: DatabaseService): Promise<Response> {
	try {
		console.log('Saving Detrack configuration...')
		const updatedConfig = await request.json()
		
		console.log('Received Detrack config:', {
			hasApiKey: !!updatedConfig.apiKey,
			baseUrl: updatedConfig.baseUrl,
			isEnabled: updatedConfig.isEnabled
		})
		
		// Save config directly to database
		await db.saveDetrackConfig({
			apiKey: updatedConfig.apiKey || '',
			baseUrl: updatedConfig.baseUrl || 'https://app.detrack.com/api/v1/',
			isEnabled: updatedConfig.isEnabled || false
		})
		
		console.log('Detrack configuration saved successfully')
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error saving Detrack config:', error)
		return new Response(JSON.stringify({ 
			error: 'Failed to save Detrack config',
			details: error instanceof Error ? error.message : String(error)
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleTestDetrackConnection(db: DatabaseService): Promise<Response> {
	try {
		console.log('Testing Detrack connection...')
		
		// Get Detrack configuration
		const detrackConfig = await getDetrackConfig(db)
		console.log('Detrack config:', {
			hasConfig: !!detrackConfig,
			isEnabled: detrackConfig?.isEnabled,
			hasApiKey: !!detrackConfig?.apiKey,
			baseUrl: detrackConfig?.baseUrl
		})
		
		if (!detrackConfig) {
			return new Response(JSON.stringify({ error: 'Detrack configuration not found' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		if (!detrackConfig.isEnabled) {
			return new Response(JSON.stringify({ error: 'Detrack integration is disabled' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		if (!detrackConfig.apiKey) {
			return new Response(JSON.stringify({ error: 'Detrack API key not configured' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		// Test connection using the correct webhook URL structure
		const testPayload = {
			do: "TEST-CONNECTION",
			date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
			address: "Test Address",
			phone: "12345678",
			recipient_name: "Test Recipient",
			delivery_type: "delivery",
			admin_graphql_api_id: "TEST-ORDER-123",
			order_number: "TEST-CONNECTION",
			updated_at: new Date().toISOString(), // Use proper ISO timestamp format
			shipping_address: {
				address1: "Test Address",
				postal_code: "123456",
				phone: "12345678",
				recipient_name: "Test Recipient",
				company: "Test Company"
			},
			line_items: [{
				title: "Test Item",
				quantity: 1,
				sku: "TEST-SKU",
				price: "0.00"
			}]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the webhook URL structure we discovered
		const response = await fetch(`https://connect.detrack.com/api/v1/webhook/detrack/jobs/create/${detrackConfig.apiKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			return new Response(JSON.stringify({ error: `Detrack API error: ${response.status} - ${errorText}` }), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
		
	} catch (error: any) {
		console.error('Error testing Detrack connection:', error)
		return new Response(JSON.stringify({ error: error.message || 'Failed to test Detrack connection' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleUpdateDetrackApiKey(db: DatabaseService): Promise<Response> {
	try {
		console.log('Updating Detrack API key to correct value...')
		
		// The correct API key from the webhook URL
		const correctApiKey = '10e3e77f4c4b42bc945bf8cbcc055cec0c826540a67681f82788cc17008b67d9'
		
		// Get current Detrack configuration
		const detrackConfig = await getDetrackConfig(db)
		console.log('Current Detrack config:', {
			hasConfig: !!detrackConfig,
			isEnabled: detrackConfig?.isEnabled,
			hasApiKey: !!detrackConfig?.apiKey,
			baseUrl: detrackConfig?.baseUrl
		})
		
		// Update API key to the correct one
		await db.saveDetrackConfig({
			apiKey: correctApiKey,
			baseUrl: detrackConfig?.baseUrl || 'https://connect.detrack.com/api/v1',
			isEnabled: detrackConfig?.isEnabled || true
		})
		
		console.log('Detrack API key updated successfully to:', correctApiKey)
		return new Response(JSON.stringify({ 
			success: true, 
			message: 'API key updated successfully',
			newApiKey: correctApiKey
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error updating Detrack API key:', error)
		return new Response(JSON.stringify({ error: 'Failed to update Detrack API key' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}