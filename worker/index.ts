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

	if (path === '/api/detrack/test-simple' && request.method === 'POST') {
		return handleTestDetrackSimple(db)
	}

	if (path === '/api/detrack/test-date' && request.method === 'POST') {
		return handleTestDetrackDate(db)
	}

	if (path === '/api/detrack/test-v1' && request.method === 'POST') {
		return handleTestDetrackV1(db)
	}

	if (path === '/api/detrack/test-v2-alt' && request.method === 'POST') {
		return handleTestDetrackV2Alt(db)
	}

	if (path === '/api/detrack/test-auth' && request.method === 'POST') {
		return handleTestDetrackAuth(db)
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

	if (path === '/api/orders' && request.method === 'GET') {
		return handleGetOrders(request, db)
	}

	if (path === '/api/orders/manual' && request.method === 'POST') {
		return handleCreateManualOrder(request, db)
	}

	if (path === '/api/orders/clear-all' && request.method === 'DELETE') {
		return handleClearAllOrders(db)
	}

	if (path.startsWith('/api/orders/') && request.method === 'DELETE') {
		const orderId = path.split('/')[3]
		return handleDeleteOrder(orderId, db)
	}

	if (path.startsWith('/api/orders/') && request.method === 'PUT') {
		const orderId = path.split('/')[3]
		return handleUpdateOrder(orderId, request, db)
	}

	if (path === '/api/detrack/job-types' && request.method === 'GET') {
		return await handleGetDetrackJobTypes(db)
	}

	if (path === '/api/detrack/jobs' && request.method === 'GET') {
		return await handleGetDetrackJobs(request, db)
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

	if (path === '/api/export/detrack' && request.method === 'POST') {
		return handleExportToDetrack(request, db)
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

	// Configuration data endpoints (Product Labels and Driver Info)
	if (path === '/api/config/product-labels' && request.method === 'GET') {
		return handleGetProductLabels(request, db, authResult.user!.id)
	}

	if (path === '/api/config/product-labels' && request.method === 'POST') {
		return handleSaveProductLabels(request, db, authResult.user!.id)
	}

	if (path === '/api/config/product-labels' && request.method === 'DELETE') {
		return handleDeleteProductLabels(request, db, authResult.user!.id)
	}

	if (path === '/api/config/driver-info' && request.method === 'GET') {
		return handleGetDriverInfo(request, db, authResult.user!.id)
	}

	if (path === '/api/config/driver-info' && request.method === 'POST') {
		return handleSaveDriverInfo(request, db, authResult.user!.id)
	}

	if (path === '/api/config/driver-info' && request.method === 'DELETE') {
		return handleDeleteDriverInfo(request, db, authResult.user!.id)
	}

	if (path === '/api/config/tag-filters' && request.method === 'GET') {
		return handleGetTagFilters(request, db, authResult.user!.id);
	}

	if (path === '/api/config/tag-filters' && request.method === 'POST') {
		return handleSaveTagFilter(request, db, authResult.user!.id);
	}

	if (path.startsWith('/api/config/tag-filters/') && request.method === 'DELETE') {
		const filterId = path.split('/').pop();
		return handleDeleteTagFilter(filterId!, db, authResult.user!.id);
	}

	if (path === '/api/config/title-filters' && request.method === 'GET') {
		return handleGetTitleFilters(request, db, authResult.user!.id);
	}

	if (path === '/api/config/title-filters' && request.method === 'POST') {
		return handleSaveTitleFilter(request, db, authResult.user!.id);
	}

	if (path.startsWith('/api/config/title-filters/') && request.method === 'DELETE') {
		const filterId = path.split('/').pop();
		return handleDeleteTitleFilter(filterId!, db, authResult.user!.id);
	}

	if (path === '/api/stores/products2' && request.method === 'POST') {
		return new Response(JSON.stringify({ test: true, version: '20240619-UNIQUE', message: 'NEW CODE IS RUNNING' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	}

	if (path === '/api/stores/products' && request.method === 'POST') {
		return handleFetchStoreProductsByTag(request, db, authResult.user!.id);
	}

	if (path === '/api/saved-products' && request.method === 'GET') {
		return handleGetSavedProducts(request, db, authResult.user!.id);
	}

	if (path === '/api/saved-products' && request.method === 'POST') {
		return handleSaveProduct(request, db, authResult.user!.id);
	}

	if (path.startsWith('/api/saved-products/') && request.method === 'DELETE') {
		const productId = path.split('/').pop();
		return handleDeleteSavedProduct(productId!, db, authResult.user!.id);
	}

	if (path === '/api/saved-products/check' && request.method === 'POST') {
		return handleCheckProductSaved(request, db, authResult.user!.id);
	}

	if (path === '/api/sync/status' && request.method === 'GET') {
		return handleGetSyncStatus(request, db, authResult.user!.id);
	}

	if (path === '/api/sync/products' && request.method === 'POST') {
		return handleSyncProducts(request, db, authResult.user!.id);
	}

	if (path === '/api/saved-products/bulk-save' && request.method === 'POST') {
		return handleBulkSaveProducts(request, db, authResult.user!.id);
	}

	if (path === '/api/saved-products/bulk-label' && request.method === 'POST') {
		return handleBulkApplyLabel(request, db, authResult.user!.id);
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
			console.error('Missing required headers:', { shopDomain, topic, hmacHeader: !!hmacHeader })
			return new Response('Missing required headers', { status: 400 })
		}

		// Get store configuration
		const store = await db.getStoreByDomain(shopDomain)
		if (!store) {
			console.error('Store not found:', shopDomain)
			return new Response('Store not found', { status: 404 })
		}

		const [globalMappings, extractMappings] = await Promise.all([
			db.getGlobalFieldMappings(),
			db.getExtractProcessingMappings()
		])

		// Verify webhook signature
		const body = await request.text()
		
		// Get webhook secret from store (per-store private app approach)
		let webhookSecret: string | null = null
		let secretSource = 'none'
		
		// Use store's API secret (for private app approach)
		if (store.api_secret && store.api_secret.trim().length > 0) {
			webhookSecret = store.api_secret
			secretSource = 'store'
		}
		
		// TEMPORARILY DISABLED: Webhook signature validation for private app testing
		// TODO: Implement proper polling for private apps instead of webhooks

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
		});
		// Log the full line_items array for debugging removed/cancelled items
		console.log('=== RAW LINE_ITEMS ARRAY START ===');
		console.log('Raw line_items array:', JSON.stringify(completeOrderData.line_items, null, 2));
		console.log('=== RAW LINE_ITEMS ARRAY END ===');
		
		try {
			// Check if order already exists
			const existingOrder = await db.getOrderByShopifyId(store.id, parseInt(orderId))
			
			// Always re-process the order to get the latest data
			const processedDataArray = processShopifyOrder(completeOrderData, globalMappings, extractMappings)

			if (existingOrder) {
				console.log('Order already exists, updating with fresh data:', orderName)
				await db.updateOrder(existingOrder.id, {
					processed_data: JSON.stringify(processedDataArray),
					raw_shopify_data: JSON.stringify(completeOrderData),
					manually_edited_fields: null, // Reset manual edits on update
					updated_at: new Date().toISOString()
				})
			} else {
				console.log('Creating new order:', orderName)
				await db.createOrder({
					store_id: store.id,
					shopify_order_id: parseInt(orderId),
					shopify_order_name: orderName!,
					status: 'Ready for Export' as const,
					processed_data: JSON.stringify(processedDataArray),
					raw_shopify_data: JSON.stringify(completeOrderData),
					manually_edited_fields: null,
					exported_at: null
				})
			}

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
		const limit = parseInt(url.searchParams.get('limit') || '100', 10)
		const offset = parseInt(url.searchParams.get('offset') || '0', 10)

		// Get total order count
		const totalCount = await db.getTotalOrderCount()

		// Get paginated orders
		const orders = await db.getAllOrders(limit, offset)

		// The frontend expects a specific format where each DB row (which represents a processed Shopify order)
		// is transformed. The processed_data field contains a JSON string of an array of line items.
		// We need to parse this and create a flat list of line-item-based orders for the frontend.
		const transformedOrders: any[] = []
		
		orders.forEach(dbOrder => {
			try {
				const processedDataArray = JSON.parse(dbOrder.processed_data)
				
				if (Array.isArray(processedDataArray)) {
					processedDataArray.forEach((processedData, index) => {
						transformedOrders.push({
							id: `${dbOrder.id}-${index}`,
							...processedData,
							status: dbOrder.status,
							created_at: dbOrder.created_at,
							updated_at: dbOrder.updated_at
						})
					})
				} else if (processedDataArray) { // Handle case where it might be a single object
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
			}
		})

		const response = {
			orders: transformedOrders,
			totalCount,
		}

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error in handleGetOrders:', error)
		return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
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
				},
				{
					dashboardField: 'senderNumberOnApp',
					processingType: 'phone',
					sourceField: 'billing_address.phone',
					format: 'normalize'
				},
				{
					dashboardField: 'senderPhoneNo',
					processingType: 'phone',
					sourceField: 'billing_address.phone',
					format: 'normalize'
				},
				{
					dashboardField: 'recipientPhoneNo',
					processingType: 'phone',
					sourceField: 'shipping_address.phone',
					format: 'normalize'
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

async function fetchOrdersFromShopify(db: any, store: any, globalMappings: any, extractMappings: any, tags?: string[], filterMode: 'OR' | 'AND' = 'OR', filterCriteria?: { deliveryDate?: string, processingDate?: string }): Promise<{ storeId: string, storeName: string, fetched: number, saved: number, errors: string[] }> {
	const results = { storeId: store.id, storeName: store.store_name, fetched: 0, saved: 0, errors: [] as string[] }
	try {
		console.log(`Fetching orders from Shopify store: ${store.store_name} (${store.shopify_domain})`)
		
		// Build API URL with optional tag filtering
		let apiUrl = `https://${store.shopify_domain}/admin/api/${store.api_version || '2024-01'}/orders.json?status=any&limit=200`
		
		// Add tag filtering if tags are provided
		if (tags && tags.length > 0) {
			if (filterMode === 'OR') {
				// Shopify API supports multiple tag parameters for OR logic
				// Each tag should be a separate &tag= parameter
				tags.forEach(tag => {
					const cleanTag = tag.trim()
					if (cleanTag) {
						apiUrl += `&tag=${encodeURIComponent(cleanTag)}`
					}
				})
				console.log(`Adding OR tag filters to API call: ${tags.join(', ')}`)
			} else {
				// For AND logic, we'll fetch all orders and filter client-side
				// Use the first tag for initial filtering to reduce data transfer
				const firstTag = tags[0].trim()
				if (firstTag) {
					apiUrl += `&tag=${encodeURIComponent(firstTag)}`
					console.log(`Adding initial tag filter for AND logic: ${firstTag}`)
				}
			}
		}
		
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
		let shopifyOrders: any[] = data.orders || []
		
		// Apply AND logic filtering if needed
		if (filterMode === 'AND' && tags && tags.length > 1) {
			const requiredTags = tags.map(tag => tag.trim().toLowerCase())
			shopifyOrders = shopifyOrders.filter(order => {
				const orderTags = (order.tags || '').split(',').map((tag: string) => tag.trim().toLowerCase())
				// Check if order has ALL required tags
				return requiredTags.every(requiredTag => 
					orderTags.some(orderTag => orderTag.includes(requiredTag))
				)
			})
			console.log(`AND filtering applied: ${data.orders?.length || 0} orders fetched, ${shopifyOrders.length} orders match ALL tags: ${tags.join(', ')}`)
		}
		
		console.log(`Received ${shopifyOrders.length} orders from Shopify${tags && tags.length > 0 ? ` (filtered by tags: ${tags.join(', ')} with ${filterMode} logic)` : ''}`)
		results.fetched = shopifyOrders.length
		
		for (const shopifyOrder of shopifyOrders) {
			try {
				console.log(`Processing order: ${shopifyOrder.name} (ID: ${shopifyOrder.id})`)
				
				const processedDataArray = processShopifyOrder(shopifyOrder, globalMappings, extractMappings, filterCriteria)
				
				const existingOrder = await db.getOrderByShopifyId(store.id, shopifyOrder.id)
				if (existingOrder) {
					console.log(`Order ${shopifyOrder.name} already exists, updating it.`)
					
					await db.updateOrder(existingOrder.id, {
						processed_data: JSON.stringify(processedDataArray),
						raw_shopify_data: JSON.stringify(shopifyOrder),
						manually_edited_fields: null, // Reset manual edits on update
						updated_at: new Date().toISOString()
					})
				} else {
					console.log(`Saving new order to database: ${shopifyOrder.name}`)
					await db.createOrder({
						store_id: store.id,
						shopify_order_id: shopifyOrder.id,
						shopify_order_name: shopifyOrder.name,
						status: 'Ready for Export' as const,
						processed_data: JSON.stringify(processedDataArray),
						raw_shopify_data: JSON.stringify(shopifyOrder),
						manually_edited_fields: null,
						exported_at: null
					})
					results.saved++
				}
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
		
		// Parse request body for optional tag filtering
		let tags: string[] | undefined
		let filterMode: 'OR' | 'AND' = 'OR'
		let filterCriteria: { deliveryDate?: string, processingDate?: string } | undefined
		try {
			const requestBody = await request.json()
			if (requestBody.tags && Array.isArray(requestBody.tags)) {
				tags = requestBody.tags.filter((tag: string) => tag && tag.trim())
				console.log(`Tag filtering requested: ${tags?.join(', ')}`)
			}
			if (requestBody.filterMode && (requestBody.filterMode === 'OR' || requestBody.filterMode === 'AND')) {
				filterMode = requestBody.filterMode
				console.log(`Filter mode requested: ${filterMode}`)
			}
			if (requestBody.filterCriteria && typeof requestBody.filterCriteria === 'object') {
				filterCriteria = requestBody.filterCriteria
				console.log(`Filter criteria provided:`, filterCriteria)
			}
		} catch (e) {
			// No request body or invalid JSON - continue without tags
			console.log('No tag filtering specified in request')
		}
		
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
		
		const results: Array<{ storeId: string, storeName: string, fetched: number, saved: number, errors: string[] }> = []
		
		for (const store of stores) {
			console.log(`Processing store: ${store.store_name} (${store.shopify_domain})`)
			const res = await fetchOrdersFromShopify(db, store, globalMappings, extractMappings, tags || [], filterMode, filterCriteria)
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
		console.log(`[handleDeleteOrder] Deleting order ${orderId}...`)
		
		// Check if order exists
		const existingOrder = await db.getOrderById(orderId)
		if (!existingOrder) {
			console.log(`[handleDeleteOrder] Order ${orderId} not found`)
			return new Response(JSON.stringify({ error: 'Order not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		// Delete the order
		await db.deleteOrder(orderId)
		console.log(`[handleDeleteOrder] Successfully deleted order ${orderId}`)
		
		return new Response(JSON.stringify({ success: true, message: 'Order deleted successfully' }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error(`[handleDeleteOrder] Error deleting order ${orderId}:`, error)
		return new Response(JSON.stringify({ error: 'Failed to delete order', details: error instanceof Error ? error.message : String(error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleUpdateOrder(orderId: string, request: Request, db: DatabaseService): Promise<Response> {
	try {
		const existingOrder = await db.getOrderById(orderId)
		if (!existingOrder) {
			return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
		}
		
		const updateData = await request.json()
		const processedData = JSON.parse(existingOrder.processed_data)
		
		const lineItemIndex = updateData.lineItemIndex || 0
		if (processedData[lineItemIndex] && updateData.field && updateData.value !== undefined) {
			processedData[lineItemIndex][updateData.field] = updateData.value
		}
		
		await db.updateOrder(orderId, {
			processed_data: JSON.stringify(processedData),
			updated_at: new Date().toISOString()
		})
		
		return new Response(JSON.stringify({ success: true }), { status: 200 })
	} catch (error) {
		console.error(`[handleUpdateOrder] Error updating order ${orderId}:`, error)
		return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500 })
	}
}

async function handleCreateManualOrder(request: Request, db: DatabaseService): Promise<Response> {
	try {
		const orderData = await request.json()
		
		// Process manual order with minimal transformations
		const processedData = processManualOrder(orderData)
		
		// Generate a unique manual order ID
		const manualOrderId = generateManualOrderId()
		const orderName = orderData.deliveryOrderNo || `MANUAL-${manualOrderId}`
		
		// Create order directly in database
		await db.createOrder({
			store_id: 'manual', // Special store ID for manual orders
			shopify_order_id: manualOrderId,
			shopify_order_name: orderName,
			status: 'Ready for Export',
			processed_data: JSON.stringify([processedData]), // Single line item
			raw_shopify_data: JSON.stringify(orderData), // Store original input
			manually_edited_fields: null,
			exported_at: null
		})
		
		return new Response(JSON.stringify({ 
			success: true, 
			message: 'Manual order created successfully',
			orderId: manualOrderId
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('[handleCreateManualOrder] Error creating manual order:', error)
		return new Response(JSON.stringify({ 
			error: 'Failed to create manual order',
			details: error instanceof Error ? error.message : String(error)
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

// Helper function to process manual order data with minimal transformations
function processManualOrder(userInput: any): any {
	// Helper function to normalize phone numbers (reuse existing logic)
	const normalizePhoneNumber = (phone: string, format: string): string => {
		if (!phone) return ''
		
		// Remove all spaces and special characters first
		let cleaned = phone.replace(/[\s\-\(\)\.]/g, '')
		
		// Handle Singapore numbers (+65)
		if (cleaned.startsWith('+65')) {
			// Remove +65 and return clean number
			return cleaned.substring(3)
		}
		
		// Handle other international numbers (just remove +)
		if (cleaned.startsWith('+')) {
			return cleaned.substring(1)
		}
		
		// Return as is for local numbers
		return cleaned
	}
	
	return {
		// Direct mapping from user input to dashboard fields
		deliveryOrderNo: userInput.deliveryOrderNo || '',
		deliveryDate: userInput.deliveryDate || '',
		processingDate: userInput.processingDate || '',
		jobReleaseTime: userInput.jobReleaseTime || '',
		deliveryCompletionTimeWindow: userInput.deliveryCompletionTimeWindow || '',
		trackingNo: '', // Manual orders don't have tracking numbers initially
		senderNumberOnApp: normalizePhoneNumber(userInput.senderNumberOnApp, 'normalize'),
		deliverySequence: '', // Not provided in manual form
		address: userInput.address || '',
		companyName: userInput.companyName || '',
		postalCode: '', // Not provided in manual form
		firstName: userInput.firstName || '',
		lastName: userInput.lastName || '',
		recipientPhoneNo: normalizePhoneNumber(userInput.recipientPhoneNo, 'normalize'),
		senderPhoneNo: normalizePhoneNumber(userInput.senderPhoneNo, 'normalize'),
		instructions: userInput.instructions || '',
		assignTo: '', // Not provided in manual form
		emailsForNotifications: userInput.emailsForNotifications || '',
		zone: '', // Not provided in manual form
		accountNo: '', // Not provided in manual form
		deliveryJobOwner: '', // Not provided in manual form
		senderNameOnApp: userInput.senderNameOnApp || '',
		group: userInput.group || '',
		noOfShippingLabels: userInput.noOfShippingLabels || '',
		attachmentUrl: '', // Not provided in manual form
		podAt: '', // Not provided in manual form
		remarks: '', // Not provided in manual form
		itemCount: userInput.itemCount || '',
		serviceTime: '', // Not provided in manual form
		sku: '', // Not provided in manual form
		description: userInput.description || '',
		qty: userInput.qty || ''
	}
}

// Helper function to generate unique manual order ID
function generateManualOrderId(): number {
	return Math.floor(Math.random() * 1000000) + 1000000 // 7-digit number
}

async function handleReprocessOrders(request: Request, db: DatabaseService): Promise<Response> {
	return new Response(JSON.stringify({ success: true, message: "This feature is being reworked." }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}

async function handleClearAllOrders(db: DatabaseService): Promise<Response> {
	try {
		// First, let's check how many orders exist before deletion
		const ordersBefore = await db.getAllOrders(1000, 0)
		console.log(`handleClearAllOrders: Found ${ordersBefore.length} orders before deletion`)
		
		// Log a sample order to verify we're getting data
		if (ordersBefore.length > 0) {
			console.log('Sample order before deletion:', {
				id: ordersBefore[0].id,
				name: ordersBefore[0].shopify_order_name,
				status: ordersBefore[0].status
			})
		}
		
		console.log('handleClearAllOrders: Calling db.deleteAllOrders()...')
		await db.deleteAllOrders()
		console.log('handleClearAllOrders: deleteAllOrders() completed successfully')
		
		// Let's verify the deletion worked
		const ordersAfter = await db.getAllOrders(1000, 0)
		console.log(`handleClearAllOrders: Found ${ordersAfter.length} orders after deletion`)
		
		const response = { success: true, deletedCount: ordersBefore.length }
		console.log('handleClearAllOrders: Returning success response:', response)
		
		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('=== handleClearAllOrders: Error during bulk delete ===')
		console.error('Error details:', error)
		console.error('Error message:', error instanceof Error ? error.message : String(error))
		console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
		
		return new Response(JSON.stringify({ 
			error: 'Failed to clear all orders', 
			details: error instanceof Error ? error.message : String(error) 
		}), {
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

		const webhookUrl = 'https://detrackify.dand3.com/api/webhooks/shopify';
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
		
		const body = await request.json()
		const { orderIds } = body
		
		if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
			return new Response(JSON.stringify({ error: 'No order IDs provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		
		// Initialize tracking variables
		const exportResults: any[] = []
		let errorCount = 0
		let successCount = 0
		
		// Get Detrack configuration from database
		const detrackConfig = await getDetrackConfig(db)
		
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

		// Group line items by their base order ID
		const orderGroups = new Map<string, { order: any, lineItems: any[], lineItemIds: string[] }>()
		
		for (const lineItemId of orderIds) {
			try {
				const baseOrderId = lineItemId.split('-').slice(0, -1).join('-')
				
				const order = allOrders.find(o => o.id === baseOrderId)
				if (!order) {
					console.error(`Order ${baseOrderId} not found in database`)
					exportResults.push({ orderId: lineItemId, success: false, error: 'Order not found' })
					errorCount++
					continue
				}
				
				let processedData: any[]
				try {
					processedData = JSON.parse(order.processed_data)
				} catch (parseError) {
					console.error(`Failed to parse processed data for order ${baseOrderId}:`, parseError)
					exportResults.push({ orderId: lineItemId, success: false, error: 'Invalid processed data format' })
					errorCount++
					continue
				}
				
				if (!processedData || processedData.length === 0) {
					console.error(`Order ${baseOrderId} has no processed data`)
					exportResults.push({ orderId: lineItemId, success: false, error: 'No processed data available' })
					errorCount++
					continue
				}
				
				const lineItemIndex = parseInt(lineItemId.split('-').pop() || '0')
				
				if (lineItemIndex >= processedData.length) {
					console.error(`Line item index ${lineItemIndex} out of range (max: ${processedData.length - 1})`)
					exportResults.push({ orderId: lineItemId, success: false, error: 'Line item index out of range' })
					errorCount++
					continue
				}
				
				const lineItemData = processedData[lineItemIndex]
				
				// Add to order group
				if (!orderGroups.has(baseOrderId)) {
					orderGroups.set(baseOrderId, {
						order: order,
						lineItems: [],
						lineItemIds: []
					})
				}
				
				const group = orderGroups.get(baseOrderId)!
				group.lineItems.push(lineItemData)
				group.lineItemIds.push(lineItemId)
				
			} catch (error: any) {
				console.error(`Error processing line item ${lineItemId} for grouping:`, error)
				exportResults.push({ orderId: lineItemId, success: false, error: error.message })
				errorCount++
			}
		}

		const jobs = []
		const orderIdMapping = new Map<string, string[]>() // Maps job index to line item IDs

		// Process each order group
		for (const [baseOrderId, group] of orderGroups) {
			try {
				// Convert all line items for this order into a single Detrack job
				const payload = convertMultipleLineItemsToDetrackFormat(group.lineItems, group.order.shopify_order_name)
				
				if (payload && payload.data && payload.data[0]) {
					jobs.push(payload.data[0])
					orderIdMapping.set(jobs.length - 1, group.lineItemIds) // Map job index to line item IDs
				} else {
					console.error(`Failed to convert order ${baseOrderId} to Detrack format`)
					group.lineItemIds.forEach(lineItemId => {
						exportResults.push({ orderId: lineItemId, success: false, error: 'Failed to convert to Detrack format' })
						errorCount++
					})
				}
			} catch (error: any) {
				console.error(`Error converting order ${baseOrderId} to Detrack format:`, error)
				group.lineItemIds.forEach(lineItemId => {
					exportResults.push({ orderId: lineItemId, success: false, error: error.message })
					errorCount++
				})
			}
		}

		if (jobs.length === 0) {
			return new Response(JSON.stringify({ error: 'No valid jobs to export' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		// Send all jobs in a single bulk request
		const bulkPayload = { data: jobs }
		const detrackUrl = `${detrackConfig.baseUrl}/dn/jobs/bulk`
		const response = await fetch(detrackUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(bulkPayload)
		})
		const responseText = await response.text()
		let detrackResult
		try {
			detrackResult = JSON.parse(responseText)
		} catch (e) {
			detrackResult = responseText
		}

		// Mark all jobs as exported if successful
		if (response.ok && detrackResult && detrackResult.data && Array.isArray(detrackResult.data)) {
			for (let i = 0; i < detrackResult.data.length; i++) {
				const job = detrackResult.data[i]
				const lineItemIds = orderIdMapping.get(i)
				if (lineItemIds) {
					try {
						// Get the base order ID from the first line item ID
						const baseOrderId = lineItemIds[0].split('-').slice(0, -1).join('-')
						
						// Update the base order status (not individual line items)
						await db.updateOrder(baseOrderId, {
							status: 'Exported',
							exported_at: new Date().toISOString(),
							updated_at: new Date().toISOString()
						})
						
						// Mark all line items as successful
						lineItemIds.forEach(lineItemId => {
							exportResults.push({ orderId: lineItemId, success: true, detrackResponse: job })
							successCount++
						})
						
						console.log(`Successfully exported order ${baseOrderId} with ${lineItemIds.length} line items`)
					} catch (e) {
						console.error(`Error updating order status for job ${i}:`, e)
						lineItemIds.forEach(lineItemId => {
							exportResults.push({ orderId: lineItemId, success: false, error: 'Exported but failed to update local status' })
							errorCount++
						})
					}
				}
			}
		} else {
			console.error('Bulk export failed:', detrackResult)
			exportResults.push({ orderId: 'bulk', success: false, error: 'Bulk export failed', detrackResponse: detrackResult })
			errorCount += orderIds.length
		}

		console.log(`=== EXPORT TO DETRACK COMPLETED ===`)
		console.log(`Summary: Total: ${orderIds.length}, Success: ${successCount}, Errors: ${errorCount}`)

		return new Response(JSON.stringify({
			success: true,
			exportResults,
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
			baseUrl: 'https://app.detrack.com/api/v2',
			isEnabled: false
		}
	} catch (error) {
		console.error('Error getting Detrack config from database:', error)
		// Return default config on error
		return {
			apiKey: '',
			baseUrl: 'https://app.detrack.com/api/v2',
			isEnabled: false
		}
	}
}

function convertToDetrackFormat(orderData: any, orderName: string): any {
	console.log('Converting order data to Detrack format:', orderData)
	
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

	// Helper function to get delivery date in DD/MM/YYYY format
	const getDeliveryDate = () => {
		const deliveryDate = getField('deliveryDate')
		if (deliveryDate) {
			// If it's already in DD/MM/YYYY format, return as is
			if (deliveryDate.includes('/')) {
				const parts = deliveryDate.split('/')
				if (parts.length === 3) {
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
			return deliveryDate
		}
		// Default to today if no date
		const today = new Date()
		return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
	}
	
	// Create payload according to Detrack API v2 specification
	const payload = {
		"data": [
			{
				"type": "Delivery",
				"do_number": getField('deliveryOrderNo', orderName).replace('#', ''),
				"date": getDeliveryDate(),
				"tracking_number": getField('trackingNo', 'T0'),
				"order_number": getField('senderNumberOnApp', ''),
				"invoice_number": getField('senderNameOnApp', ''),
				"address": getField('address', ''),
				"deliver_to_collect_from": getField('firstName', ''),
				"last_name": getField('lastName', ''),
				"phone_number": cleanPhoneNumber(getField('recipientPhoneNo', '')),
				"notify_email": getField('emailsForNotifications', ''),
				"instructions": getField('instructions', ''),
				"postal_code": getField('postalCode', ''),
				"group_name": getField('group', ''),
				"job_release_time": getField('jobReleaseTime', ''),
				"time_window": getField('deliveryCompletionTimeWindow', ''),
				"number_of_shipping_labels": parseInt(getField('noOfShippingLabels', '1')),
				"items": [
					{
						"sku": getField('sku', ''),
						"description": getField('description', ''),
						"quantity": parseInt(getField('qty', '1'))
					}
				]
			}
		]
	}
	
	console.log('Converted to Detrack format:', payload)
	return payload
}

// New function to convert multiple line items into a single Detrack job
function convertMultipleLineItemsToDetrackFormat(lineItems: any[], orderName: string): any {
	if (lineItems.length === 0) {
		console.error('No line items provided')
		return null
	}
	
	// Use the first line item as the base for common fields
	const baseItem = lineItems[0]
	
	// Helper function to safely get field value
	const getField = (field: string, defaultValue: string = '') => {
		const value = baseItem[field]
		return value && value.toString().trim() !== '' ? value.toString().trim() : defaultValue
	}
	
	// Helper function to clean phone number (remove country code if present)
	const cleanPhoneNumber = (phone: string) => {
		if (!phone) return ''
		// Remove +65 country code if present
		return phone.replace(/^\+65/, '').replace(/^65/, '')
	}

	// Helper function to get delivery date in DD/MM/YYYY format
	const getDeliveryDate = () => {
		const deliveryDate = getField('deliveryDate')
		if (deliveryDate) {
			// If it's already in DD/MM/YYYY format, return as is
			if (deliveryDate.includes('/')) {
				const parts = deliveryDate.split('/')
				if (parts.length === 3) {
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
			return deliveryDate
		}
		// Default to today if no date
		const today = new Date()
		return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
	}
	
	// Create items array from all line items
	const items = lineItems.map(item => ({
		"sku": item.sku || '',
		"description": item.description || '',
		"quantity": parseInt(item.qty || '1')
	}))
	
	// Create payload according to Detrack API v2 specification
	const payload = {
		"data": [
			{
				"type": "Delivery",
				"do_number": getField('deliveryOrderNo', orderName).replace('#', ''),
				"date": getDeliveryDate(),
				"tracking_number": getField('trackingNo', 'T0'),
				"order_number": getField('senderNumberOnApp', ''),
				"invoice_number": getField('senderNameOnApp', ''),
				"address": getField('address', ''),
				"deliver_to_collect_from": getField('firstName', ''),
				"last_name": getField('lastName', ''),
				"phone_number": cleanPhoneNumber(getField('recipientPhoneNo', '')),
				"notify_email": getField('emailsForNotifications', ''),
				"instructions": getField('instructions', ''),
				"postal_code": getField('postalCode', ''),
				"group_name": getField('group', ''),
				"job_release_time": getField('jobReleaseTime', ''),
				"time_window": getField('deliveryCompletionTimeWindow', ''),
				"number_of_shipping_labels": parseInt(getField('noOfShippingLabels', '1')),
				"items": items
			}
		]
	}
	
	return payload
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
			baseUrl: updatedConfig.baseUrl || 'https://app.detrack.com/api/v2',
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
		
		// Test connection using the correct Detrack API v2 payload structure
		const testPayload = {
			"data": [
				{
					"type": "Delivery",
					"do_number": "TEST-CONNECTION",
					"date": "18/06/2025", // Use DD/MM/YYYY format instead of YYYY-MM-DD
					"address": "Test Address",
					"deliver_to_collect_from": "Test Recipient",
					"phone_number": "12345678",
					"order_number": "TEST-CONNECTION",
					"items": [
						{
							"description": "Test Item",
							"quantity": 1
						}
					]
				}
			]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the correct Detrack API v2 endpoint
		const response = await fetch(`https://app.detrack.com/api/v2/dn/jobs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		console.log('Detrack API response headers:', Object.fromEntries(response.headers.entries()))
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			
			// Try to parse as JSON if possible
			let errorDetails = errorText
			try {
				const errorJson = JSON.parse(errorText)
				errorDetails = JSON.stringify(errorJson, null, 2)
			} catch (e) {
				// Keep as text if not JSON
			}
			
			return new Response(JSON.stringify({ 
				error: `Detrack API error: ${response.status}`,
				details: errorDetails,
				payload: testPayload
			}), {
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

async function handleTestDetrackSimple(db: DatabaseService): Promise<Response> {
	try {
		console.log('Testing Detrack connection with simple payload...')
		
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
		
		// Test connection using the correct Detrack API v2 payload structure
		const testPayload = {
			"data": [
				{
					"type": "Delivery",
					"do_number": "TEST-CONNECTION",
					"date": "18/06/2025", // Use DD/MM/YYYY format instead of YYYY-MM-DD
					"address": "Test Address",
					"deliver_to_collect_from": "Test Recipient",
					"phone_number": "12345678",
					"order_number": "TEST-CONNECTION",
					"items": [
						{
							"description": "Test Item",
							"quantity": 1
						}
					]
				}
			]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the correct Detrack API v2 endpoint
		const response = await fetch(`https://app.detrack.com/api/v2/dn/jobs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		console.log('Detrack API response headers:', Object.fromEntries(response.headers.entries()))
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			
			// Try to parse as JSON if possible
			let errorDetails = errorText
			try {
				const errorJson = JSON.parse(errorText)
				errorDetails = JSON.stringify(errorJson, null, 2)
			} catch (e) {
				// Keep as text if not JSON
			}
			
			return new Response(JSON.stringify({ 
				error: `Detrack API error: ${response.status}`,
				details: errorDetails,
				payload: testPayload
			}), {
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

async function handleTestDetrackDate(db: DatabaseService): Promise<Response> {
	try {
		console.log('Testing Detrack connection with date payload...')
		
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
		
		// Test connection using the correct Detrack API v2 payload structure
		const testPayload = {
			"data": [
				{
					"type": "Delivery",
					"do_number": "TEST-CONNECTION",
					"date": "18/06/2025", // Use DD/MM/YYYY format instead of YYYY-MM-DD
					"address": "Test Address",
					"deliver_to_collect_from": "Test Recipient",
					"phone_number": "12345678",
					"order_number": "TEST-CONNECTION",
					"items": [
						{
							"description": "Test Item",
							"quantity": 1
						}
					]
				}
			]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the correct Detrack API v2 endpoint
		const response = await fetch(`https://app.detrack.com/api/v2/dn/jobs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		console.log('Detrack API response headers:', Object.fromEntries(response.headers.entries()))
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			
			// Try to parse as JSON if possible
			let errorDetails = errorText
			try {
				const errorJson = JSON.parse(errorText)
				errorDetails = JSON.stringify(errorJson, null, 2)
			} catch (e) {
				// Keep as text if not JSON
			}
			
			return new Response(JSON.stringify({ 
				error: `Detrack API error: ${response.status}`,
				details: errorDetails,
				payload: testPayload
			}), {
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

async function handleTestDetrackV1(db: DatabaseService): Promise<Response> {
	try {
		console.log('Testing Detrack connection with v1 payload...')
		
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
		
		// Test connection using the correct Detrack API v2 payload structure
		const testPayload = {
			"data": [
				{
					"type": "Delivery",
					"do_number": "TEST-CONNECTION",
					"date": "18/06/2025", // Use DD/MM/YYYY format instead of YYYY-MM-DD
					"address": "Test Address",
					"deliver_to_collect_from": "Test Recipient",
					"phone_number": "12345678",
					"order_number": "TEST-CONNECTION",
					"items": [
						{
							"description": "Test Item",
							"quantity": 1
						}
					]
				}
			]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the correct Detrack API v2 endpoint
		const response = await fetch(`https://app.detrack.com/api/v2/dn/jobs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		console.log('Detrack API response headers:', Object.fromEntries(response.headers.entries()))
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			
			// Try to parse as JSON if possible
			let errorDetails = errorText
			try {
				const errorJson = JSON.parse(errorText)
				errorDetails = JSON.stringify(errorJson, null, 2)
			} catch (e) {
				// Keep as text if not JSON
			}
			
			return new Response(JSON.stringify({ 
				error: `Detrack API error: ${response.status}`,
				details: errorDetails,
				payload: testPayload
			}), {
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

async function handleTestDetrackV2Alt(db: DatabaseService): Promise<Response> {
	try {
		console.log('Testing Detrack connection with v2 alt payload...')
		
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
		
		// Test connection using the correct Detrack API v2 payload structure
		const testPayload = {
			"data": [
				{
					"type": "Delivery",
					"do_number": "TEST-CONNECTION",
					"date": "18/06/2025", // Use DD/MM/YYYY format instead of YYYY-MM-DD
					"address": "Test Address",
					"deliver_to_collect_from": "Test Recipient",
					"phone_number": "12345678",
					"order_number": "TEST-CONNECTION",
					"items": [
						{
							"description": "Test Item",
							"quantity": 1
						}
					]
				}
			]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the correct Detrack API v2 endpoint
		const response = await fetch(`https://app.detrack.com/api/v2/dn/jobs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		console.log('Detrack API response headers:', Object.fromEntries(response.headers.entries()))
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			
			// Try to parse as JSON if possible
			let errorDetails = errorText
			try {
				const errorJson = JSON.parse(errorText)
				errorDetails = JSON.stringify(errorJson, null, 2)
			} catch (e) {
				// Keep as text if not JSON
			}
			
			return new Response(JSON.stringify({ 
				error: `Detrack API error: ${response.status}`,
				details: errorDetails,
				payload: testPayload
			}), {
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

async function handleTestDetrackAuth(db: DatabaseService): Promise<Response> {
	try {
		console.log('Testing Detrack connection with auth payload...')
		
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
		
		// Test connection using the correct Detrack API v2 payload structure
		const testPayload = {
			"data": [
				{
					"type": "Delivery",
					"do_number": "TEST-CONNECTION",
					"date": "18/06/2025", // Use DD/MM/YYYY format instead of YYYY-MM-DD
					"address": "Test Address",
					"deliver_to_collect_from": "Test Recipient",
					"phone_number": "12345678",
					"order_number": "TEST-CONNECTION",
					"items": [
						{
							"description": "Test Item",
							"quantity": 1
						}
					]
				}
			]
		}
		
		console.log('Testing with payload:', testPayload)
		console.log('Using API key:', detrackConfig.apiKey)
		
		// Use the correct Detrack API v2 endpoint
		const response = await fetch(`https://app.detrack.com/api/v2/dn/jobs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json'
			},
			body: JSON.stringify(testPayload)
		})
		
		console.log('Detrack API response status:', response.status)
		console.log('Detrack API response headers:', Object.fromEntries(response.headers.entries()))
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('Detrack API error:', response.status, errorText)
			
			// Try to parse as JSON if possible
			let errorDetails = errorText
			try {
				const errorJson = JSON.parse(errorText)
				errorDetails = JSON.stringify(errorJson, null, 2)
			} catch (e) {
				// Keep as text if not JSON
			}
			
			return new Response(JSON.stringify({ 
				error: `Detrack API error: ${response.status}`,
				details: errorDetails,
				payload: testPayload
			}), {
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
		
		// The correct API key from the Detrack team
		const correctApiKey = '9943520c80ee2aaad2cc80c29bdfb298e85feed021ef0328'
		
		// Get current Detrack configuration
		const detrackConfig = await getDetrackConfig(db)
		console.log('Current Detrack config:', {
			hasConfig: !!detrackConfig,
			isEnabled: detrackConfig?.isEnabled,
			hasApiKey: !!detrackConfig?.apiKey,
			baseUrl: detrackConfig?.baseUrl
		})
		
		// Update API key to the correct one and ensure we use the v2 endpoint
		await db.saveDetrackConfig({
			apiKey: correctApiKey,
			baseUrl: 'https://app.detrack.com/api/v2', // Always use the correct v2 endpoint
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

async function handleGetDetrackJobTypes(db: DatabaseService): Promise<Response> {
	try {
		const detrackConfig = await getDetrackConfig(db)
		if (!detrackConfig?.apiKey) {
			return new Response(JSON.stringify({ error: 'Detrack API key not configured' }), { status: 500 })
		}
		const detrackUrl = `https://app.detrack.com/api/v2/dn/jobs/do_number?type=DeliveryParameters`
		const resp = await fetch(detrackUrl, {
			method: 'GET',
			headers: {
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json',
			},
		})
		if (!resp.ok) {
			const errText = await resp.text()
			return new Response(JSON.stringify({ error: 'Detrack API error', details: errText }), { status: resp.status })
		}
		const data = await resp.json()
		return new Response(JSON.stringify({ jobTypes: data.data || [] }), { status: 200 })
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message || 'Failed to fetch Detrack job types' }), { status: 500 })
	}
}

async function handleGetDetrackJobs(request: Request, db: DatabaseService): Promise<Response> {
	try {
		const url = new URL(request.url)
		const type = url.searchParams.get('type') || 'Delivery'
		const date = url.searchParams.get('date')
		if (!date) {
			return new Response(JSON.stringify({ error: 'Missing date parameter' }), { status: 400 })
		}
		const detrackConfig = await getDetrackConfig(db)
		if (!detrackConfig?.apiKey) {
			return new Response(JSON.stringify({ error: 'Detrack API key not configured' }), { status: 500 })
		}
		// Proxy to Detrack with increased limit
		const detrackUrl = `https://app.detrack.com/api/v2/dn/jobs?type=${encodeURIComponent(type)}&date=${encodeURIComponent(date)}&limit=200`
		const resp = await fetch(detrackUrl, {
			method: 'GET',
			headers: {
				'X-API-KEY': detrackConfig.apiKey,
				'Accept': 'application/json',
			},
		})
		if (!resp.ok) {
			const errText = await resp.text()
			return new Response(JSON.stringify({ error: 'Detrack API error', details: errText }), { status: resp.status })
		}
		const data = await resp.json()
		// Normalize jobs for frontend with description field
		const jobs = (data.data || []).map((job: any) => {
			// Extract description from items array or job description field
			let description = '';
			if (job.items && job.items.length > 0) {
				// Get description from first item
				description = job.items[0].description || '';
			} else if (job.description) {
				// Fallback to job description field
				description = job.description;
			}
			
			return {
				date: job.date || '',
				do_number: job.do_number || '',
				assign_to: job.assign_to || '',
				status: job.status || '',
				time_window: job.time_window || '',
				description: description,
			};
		})
		return new Response(JSON.stringify({ jobs }), { status: 200 })
	} catch (error: any) {
		return new Response(JSON.stringify({ error: error.message || 'Failed to fetch Detrack jobs' }), { status: 500 })
	}
}

// Configuration data endpoints (Product Labels and Driver Info)
async function handleGetProductLabels(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		// Implement logic to fetch product labels for the user
		const productLabels = await db.getProductLabelsForUser(userId)
		// Map DB fields to camelCase for frontend
		const mapped = productLabels.map((p: any) => ({
			id: p.id,
			productName: p.product_name,
			label: p.label,
			createdAt: p.created_at,
			updatedAt: p.updated_at
		}))
		return new Response(JSON.stringify({ productLabels: mapped }), { status: 200 })
	} catch (error) {
		console.error('Error getting product labels:', error)
		return new Response(JSON.stringify({ error: 'Failed to get product labels' }), { status: 500 })
	}
}

async function handleSaveProductLabels(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		// Implement logic to save product labels for the user
		const updatedLabels = await request.json()
		await db.saveProductLabelsForUser(userId, updatedLabels)
		return new Response(JSON.stringify({ success: true }), { status: 200 })
	} catch (error) {
		console.error('Error saving product labels:', error)
		return new Response(JSON.stringify({ error: 'Failed to save product labels' }), { status: 500 })
	}
}

async function handleDeleteProductLabels(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		// Implement logic to delete product labels for the user
		const labelIds = await request.json()
		await db.deleteProductLabelsForUser(userId, labelIds)
		return new Response(JSON.stringify({ success: true }), { status: 200 })
	} catch (error) {
		console.error('Error deleting product labels:', error)
		return new Response(JSON.stringify({ error: 'Failed to delete product labels' }), { status: 500 })
	}
}

async function handleGetDriverInfo(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		// Implement logic to fetch driver info for the user
		const driverInfo = await db.getDriverInfoForUser(userId)
		// Map DB fields to camelCase for frontend
		const mapped = driverInfo.map((d: any) => ({
			id: d.id,
			driverName: d.driver_name,
			paynowNumber: d.paynow_number,
			detrackId: d.detrack_id,
			contactNo: d.contact_no,
			pricePerDrop: d.price_per_drop,
			createdAt: d.created_at,
			updatedAt: d.updated_at
		}))
		return new Response(JSON.stringify({ driverInfo: mapped }), { status: 200 })
	} catch (error) {
		console.error('Error getting driver info:', error)
		return new Response(JSON.stringify({ error: 'Failed to get driver info' }), { status: 500 })
	}
}

async function handleSaveDriverInfo(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		// Implement logic to save driver info for the user
		const updatedInfo = await request.json()
		await db.saveDriverInfoForUser(userId, updatedInfo)
		return new Response(JSON.stringify({ success: true }), { status: 200 })
	} catch (error) {
		console.error('Error saving driver info:', error)
		return new Response(JSON.stringify({ error: 'Failed to save driver info' }), { status: 500 })
	}
}

async function handleDeleteDriverInfo(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		// Implement logic to delete driver info for the user
		const infoIds = await request.json()
		await db.deleteDriverInfoForUser(userId, infoIds)
		return new Response(JSON.stringify({ success: true }), { status: 200 })
	} catch (error) {
		console.error('Error deleting driver info:', error)
		return new Response(JSON.stringify({ error: 'Failed to delete driver info' }), { status: 500 })
	}
}

async function handleGetTagFilters(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		console.log('handleGetTagFilters called with userId:', userId);
		const url = new URL(request.url)
		const storeId = url.searchParams.get('storeId')
		console.log('storeId from query params:', storeId);
		
		const tagFilters = await db.getTagFiltersForUser(userId, storeId || undefined)
		console.log('Retrieved tag filters:', tagFilters);

		return new Response(JSON.stringify({ tagFilters }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error getting tag filters:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});
		return new Response(JSON.stringify({ error: 'Failed to get tag filters' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleSaveTagFilter(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		console.log('handleSaveTagFilter called with userId:', userId);
		const { tag, storeId } = await request.json();
		console.log('Request body:', { tag, storeId });
		
		// Generate UUID for the tag filter
		const tagFilterId = globalThis.crypto.randomUUID();
		console.log('Generated tagFilterId:', tagFilterId);
		
		// Save tag filter using DatabaseService
		await db.saveTagFilter({
			id: tagFilterId,
			tag,
			storeId,
			userId,
			createdAt: new Date().toISOString()
		});
		console.log('Tag filter saved successfully');

		const tagFilter = {
			id: tagFilterId,
			tag,
			storeId,
			createdAt: new Date().toISOString()
		};

		return new Response(JSON.stringify({ tagFilter }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error saving tag filter:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});
		return new Response(JSON.stringify({ error: 'Failed to save tag filter' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleDeleteTagFilter(filterId: string, db: DatabaseService, userId: string): Promise<Response> {
	try {
		await db.deleteTagFilter(filterId, userId);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error deleting tag filter:', error);
		return new Response(JSON.stringify({ error: 'Failed to delete tag filter' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleFetchStoreProducts(request: Request, db: DatabaseService): Promise<Response> {
	try {
		const { storeId, tags, titles } = await request.json();
		
		// Debug logging
		console.log('[FetchProducts] Request received:', { storeId, tags, titles });
		
		const store = await db.getStoreById(storeId);
		if (!store) {
			return new Response(JSON.stringify({ error: 'Store not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		console.log('[FetchProducts] Store found:', { 
			id: store.id, 
			domain: store.shopify_domain,
			hasAccessToken: !!store.access_token 
		});

		// Fetch all products using pagination
		let allProducts: any[] = [];
		let pageInfo: string | null = null;
		let pageCount = 0;
		
		do {
			pageCount++;
			console.log(`[FetchProducts] Fetching page ${pageCount}...`);
			
			// Build URL with pagination parameters
			let url = `https://${store.shopify_domain}/admin/api/2024-01/products.json?limit=250`;
			if (pageInfo) {
				url += `&page_info=${pageInfo}`;
			}
			
			const response = await fetch(url, {
				headers: {
					'X-Shopify-Access-Token': store.access_token
				}
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch products from Shopify: ${response.status} ${response.statusText}`);
			}

			const { products } = await response.json();
			allProducts = allProducts.concat(products);
			
			console.log(`[FetchProducts] Page ${pageCount} - fetched ${products.length} products, total so far: ${allProducts.length}`);
			
			// Check for next page
			const linkHeader = response.headers.get('Link');
			if (linkHeader && linkHeader.includes('rel="next"')) {
				// Extract page_info from Link header
				const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
				pageInfo = nextMatch ? nextMatch[1] : null;
			} else {
				pageInfo = null;
			}
			
		} while (pageInfo);
		
		console.log('[FetchProducts] Completed fetching all products - total count:', allProducts.length);
		if (allProducts.length > 0) {
			console.log('[FetchProducts] Sample product tags:', allProducts.slice(0, 3).map(p => ({
				title: p.title,
				tags: p.tags,
				tagsType: typeof p.tags
			})));
		}

		// Filter products by tags and/or titles
		const filteredProducts = allProducts.filter((product: any) => {
			// If no filters provided, return all products (for debugging)
			if ((!tags || tags.length === 0) && (!titles || titles.length === 0)) {
				console.log(`[Debug] Showing all products - Product: ${product.title}, Tags: "${product.tags}"`);
				return true;
			}
			
			// Check tag filters - use substring matching for better results
			if (tags && tags.length > 0) {
				const productTags = product.tags.split(',').map((t: string) => t.trim().toLowerCase());
				const inputTags = tags.map((tag: string) => tag.trim().toLowerCase());
				// Debug logging for tag filtering
				console.log(`[TagFilter] Product: ${product.title}, ProductTags:`, productTags, 'InputTags:', inputTags);
				// Match if any input tag is a substring of any product tag
				const hasMatchingTag = inputTags.some(inputTag =>
					productTags.some(productTag => productTag.includes(inputTag))
				);
				console.log(`[TagFilter] Has matching tag:`, hasMatchingTag);
				if (hasMatchingTag) return true;
			}
			
			// Check title filters
			if (titles && titles.length > 0) {
				const productTitle = product.title.toLowerCase();
				const hasMatchingTitle = titles.some((title: string) => 
					productTitle.includes(title.trim().toLowerCase())
				);
				if (hasMatchingTitle) return true;
			}
			
			return false;
		});

		// Transform to our format, including variant information
		const transformedProducts = filteredProducts.flatMap((product: any) => 
			product.variants.map((variant: any) => ({
				id: `${product.id}-${variant.id}`,
				title: product.title,
				variantTitle: variant.title !== 'Default Title' ? variant.title : '',
				price: variant.price,
				handle: product.handle,
				tags: product.tags.split(',').map((t: string) => t.trim()),
				orderTags: product.tags.split(',').filter((tag: string) => 
					tag.trim().toLowerCase().includes('express') || 
					tag.trim().toLowerCase().includes('stand') ||
					tag.trim().toLowerCase().includes('priority')
				),
				storeId,
				storeDomain: store.shopify_domain,
				createdAt: product.created_at,
				updatedAt: product.updated_at
			}))
		);

		return new Response(JSON.stringify({ products: transformedProducts }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error fetching store products:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch store products' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleGetSavedProducts(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		const url = new URL(request.url)
		const storeId = url.searchParams.get('storeId')
		
		const savedProducts = await db.getSavedProductsForUser(userId, storeId || undefined)
		
		// Map DB fields to camelCase for frontend
		const mapped = savedProducts.map((p: any) => ({
			id: p.id,
			productId: p.product_id,
			title: p.title,
			variantTitle: p.variant_title,
			price: p.price,
			handle: p.handle,
			tags: p.tags ? p.tags.split(', ') : [],
			orderTags: p.order_tags ? p.order_tags.split(', ') : [],
			storeId: p.store_id,
			storeDomain: p.store_domain,
			createdAt: p.created_at,
			label: p.label || null
		}))
		
		return new Response(JSON.stringify({ savedProducts: mapped }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error getting saved products:', error)
		return new Response(JSON.stringify({ error: 'Failed to get saved products' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleSaveProduct(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		const productData = await request.json()
		
		// Generate UUID for the saved product
		const savedProductId = globalThis.crypto.randomUUID()
		
		// Save product using DatabaseService
		await db.saveProduct({
			id: savedProductId,
			productId: productData.id,
			title: productData.title,
			variantTitle: productData.variantTitle || '',
			price: productData.price,
			handle: productData.handle,
			tags: productData.tags.join(', '),
			orderTags: productData.orderTags.join(', '),
			storeId: productData.storeId,
			storeDomain: productData.storeDomain,
			userId,
			createdAt: new Date().toISOString()
		})

		return new Response(JSON.stringify({ success: true, savedProductId }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error saving product:', error)
		return new Response(JSON.stringify({ error: 'Failed to save product' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleDeleteSavedProduct(productId: string, db: DatabaseService, userId: string): Promise<Response> {
	try {
		await db.deleteSavedProduct(productId, userId)

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error deleting saved product:', error)
		return new Response(JSON.stringify({ error: 'Failed to delete saved product' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleCheckProductSaved(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		const { productId } = await request.json()
		const isSaved = await db.isProductSaved(productId, userId)
		
		return new Response(JSON.stringify({ isSaved }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	} catch (error) {
		console.error('Error checking product saved status:', error)
		return new Response(JSON.stringify({ error: 'Failed to check product saved status' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

async function handleGetTitleFilters(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		console.log('handleGetTitleFilters called with userId:', userId);
		const url = new URL(request.url)
		const storeId = url.searchParams.get('storeId')
		console.log('storeId from query params:', storeId);
		
		const titleFilters = await db.getTitleFiltersForUser(userId, storeId || undefined)
		console.log('Retrieved title filters:', titleFilters);

		return new Response(JSON.stringify({ titleFilters }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error getting title filters:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});
		return new Response(JSON.stringify({ error: 'Failed to get title filters' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleSaveTitleFilter(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		console.log('handleSaveTitleFilter called with userId:', userId);
		const { title, storeId } = await request.json();
		console.log('Request body:', { title, storeId });
		
		// Generate UUID for the title filter
		const titleFilterId = globalThis.crypto.randomUUID();
		console.log('Generated titleFilterId:', titleFilterId);
		
		// Save title filter using DatabaseService
		await db.saveTitleFilter({
			id: titleFilterId,
			title,
			storeId,
			userId,
			createdAt: new Date().toISOString()
		});
		console.log('Title filter saved successfully');

		const titleFilter = {
			id: titleFilterId,
			title,
			storeId,
			createdAt: new Date().toISOString()
		};

		return new Response(JSON.stringify({ titleFilter }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error saving title filter:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});
		return new Response(JSON.stringify({ error: 'Failed to save title filter' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleDeleteTitleFilter(filterId: string, db: DatabaseService, userId: string): Promise<Response> {
	try {
		await db.deleteTitleFilter(filterId, userId);

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error deleting title filter:', error);
		return new Response(JSON.stringify({ error: 'Failed to delete title filter' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleGetSyncStatus(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		const url = new URL(request.url);
		const storeId = url.searchParams.get('storeId');
		
		if (!storeId) {
			return new Response(JSON.stringify({ error: 'Store ID is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		const syncStatus = await db.getSyncStatus(userId, storeId);
		
		return new Response(JSON.stringify({ syncStatus }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error getting sync status:', error);
		return new Response(JSON.stringify({ error: 'Failed to get sync status' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

async function handleSyncProducts(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	let body: any;
	try {
		body = await request.json();
		const storeId = body.storeId;
		console.log('[SyncProducts] userId:', userId, 'storeId:', storeId);
		if (!storeId) {
			console.error('[SyncProducts] No storeId provided');
			return new Response(JSON.stringify({ error: 'Store ID is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		// Get store details
		const store = await db.getStoreById(storeId);
		if (!store) {
			console.error('[SyncProducts] Store not found for storeId:', storeId);
			return new Response(JSON.stringify({ error: 'Store not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		console.log('[SyncProducts] Store found:', store.shopify_domain, 'API version:', store.api_version);
		// Get current sync status
		const currentSyncStatus = await db.getSyncStatus(userId, storeId);
		console.log('[SyncProducts] Current sync status:', currentSyncStatus);
		// Fetch all products from Shopify
		const allProducts = [];
		let hasMore = true;
		let pageInfo = null;
		let pageCount = 0;
		while (hasMore) {
			const url = `https://${store.shopify_domain}/admin/api/${store.api_version}/products.json?limit=250${pageInfo ? `&page_info=${pageInfo}` : ''}`;
			console.log(`[SyncProducts] Fetching products from Shopify:`, url);
			const response = await fetch(url, {
				headers: {
					'X-Shopify-Access-Token': store.access_token,
					'Content-Type': 'application/json'
				}
			});
			console.log(`[SyncProducts] Shopify API response status:`, response.status);
			if (!response.ok) {
				const errorText = await response.text();
				console.error(`[SyncProducts] Shopify API error:`, response.status, errorText);
				throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
			}
			const data = await response.json();
			allProducts.push(...data.products);
			console.log(`[SyncProducts] Fetched ${data.products.length} products, total so far: ${allProducts.length}`);
			// Check for pagination
			const linkHeader = response.headers.get('Link');
			if (linkHeader && linkHeader.includes('rel="next"')) {
				const match = linkHeader.match(/page_info=([^&>]+)/);
				pageInfo = match ? match[1] : null;
				hasMore = !!pageInfo;
				pageCount++;
				console.log(`[SyncProducts] More pages detected, pageInfo:`, pageInfo, 'pageCount:', pageCount);
			} else {
				hasMore = false;
				console.log('[SyncProducts] No more pages.');
			}
		}
		// Save all products to database
		console.log(`[SyncProducts] Saving ${allProducts.length} products to DB for userId:`, userId, 'storeId:', storeId);
		await db.saveAllProducts(userId, storeId, store.shopify_domain, allProducts);
		// Update sync status
		await db.updateSyncStatus(userId, storeId, {
			last_sync: new Date().toISOString(),
			total_products: allProducts.length,
			last_sync_status: 'success'
		});
		console.log('[SyncProducts] Sync complete. Products saved:', allProducts.length);
		return new Response(JSON.stringify({ 
			success: true, 
			totalProducts: allProducts.length,
			syncTime: new Date().toISOString()
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('[SyncProducts] Error syncing products:', error && error.message);
		if (error && error.stack) console.error('[SyncProducts] Stack:', error.stack);
		try {
			const storeId = body && body.storeId;
			if (storeId) {
				await db.updateSyncStatus(userId, storeId, {
					last_sync_status: 'error'
				});
			}
		} catch (updateError) {
			console.error('[SyncProducts] Error updating sync status after failure:', updateError);
		}
		return new Response(JSON.stringify({ error: 'Failed to sync products', details: error && error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

// Handler: Fetch products from Shopify by tag filter (no DB write)
async function handleFetchStoreProductsByTag(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	console.log('[FetchProductsByTag] === NEW FUNCTION CALLED ===');
	console.log('[FetchProductsByTag] This is the NEW function with pagination');
	
	try {
		const { storeId, tags, titles } = await request.json();
		
		// Debug logging
		console.log('[FetchProductsByTag] Request received:', { storeId, tags, titles });
		
		if (!storeId) {
			return new Response(JSON.stringify({ error: 'Store ID is required' }), { status: 400 });
		}
		
		const store = await db.getStoreById(storeId);
		if (!store) {
			return new Response(JSON.stringify({ error: 'Store not found' }), { status: 404 });
		}

		console.log('[FetchProductsByTag] Store found:', { 
			id: store.id, 
			domain: store.shopify_domain,
			hasAccessToken: !!store.access_token 
		});

		// Fetch all products using pagination
		let allProducts: any[] = [];
		let pageInfo: string | null = null;
		let pageCount = 0;
		const limit = 250; // Maximum allowed by Shopify

		do {
			pageCount++;
			console.log(`[FetchProductsByTag] Fetching page ${pageCount}...`);
			
			const url = new URL(`https://${store.shopify_domain}/admin/api/2023-10/products.json`);
			url.searchParams.set('limit', limit.toString());
			if (pageInfo) {
				url.searchParams.set('page_info', pageInfo);
			}

			const response = await fetch(url.toString(), {
				headers: {
					'X-Shopify-Access-Token': store.access_token,
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				console.error(`[FetchProductsByTag] Shopify API error: ${response.status} ${response.statusText}`);
				return new Response(JSON.stringify({ error: `Shopify API error: ${response.status}` }), { status: response.status });
			}

			const data = await response.json();
			const products = data.products || [];
			
			console.log(`[FetchProductsByTag] Page ${pageCount} - fetched ${products.length} products, total so far: ${allProducts.length + products.length}`);
			
			allProducts.push(...products);

			// Get next page info from Link header
			const linkHeader = response.headers.get('Link');
			if (linkHeader && linkHeader.includes('rel="next"')) {
				const match = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
				pageInfo = match ? match[1] : null;
			} else {
				pageInfo = null;
			}

		} while (pageInfo);

		console.log(`[FetchProductsByTag] Completed fetching all products - total count: ${allProducts.length}`);

		// Process and filter products
		const processedProducts = allProducts.map(product => {
			const tags = product.tags ? product.tags.split(',').map((tag: string) => tag.trim()) : [];
			const variants = product.variants || [];
			const firstVariant = variants[0] || {};
			
			return {
				id: product.id.toString(),
				title: product.title,
				handle: product.handle,
				tags: tags,
				price: firstVariant.price || '0',
				variantTitle: firstVariant.title || '',
				variants: variants.map((v: any) => ({
					id: v.id.toString(),
					title: v.title || '',
					price: v.price || '0',
					sku: v.sku || ''
				}))
			};
		});

		// Apply filters if provided
		let filteredProducts = processedProducts;
		
		if (tags.length > 0 || titles.length > 0) {
			filteredProducts = processedProducts.filter(product => {
				// Tag filtering
				if (tags.length > 0) {
					const productTags = product.tags.map((tag: string) => tag.toLowerCase());
					const hasMatchingTag = tags.some(filterTag => 
						productTags.some(productTag => productTag.includes(filterTag.toLowerCase()))
					);
					if (!hasMatchingTag) return false;
				}
				
				// Title filtering
				if (titles.length > 0) {
					const productTitle = product.title.toLowerCase();
					const hasMatchingTitle = titles.some(filterTitle => 
						productTitle.includes(filterTitle.toLowerCase())
					);
					if (!hasMatchingTitle) return false;
				}
				
				return true;
			});
		}

		console.log(`[FetchProductsByTag] Filtered products: ${filteredProducts.length} of ${processedProducts.length} total`);

		// Debug: Show sample products
		if (filteredProducts.length > 0) {
			console.log('[FetchProductsByTag] Sample filtered products:');
			filteredProducts.slice(0, 3).forEach(product => {
				console.log(`[FetchProductsByTag] - ${product.title}: ${product.tags.join(', ')}`);
			});
		}

		return new Response(JSON.stringify({ 
			products: filteredProducts,
			total: filteredProducts.length,
			totalFetched: allProducts.length
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('[FetchProductsByTag] Error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
	}
}

// Handler: Bulk save selected products to DB
async function handleBulkSaveProducts(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		const { products } = await request.json();
		console.log('[handleBulkSaveProducts] Received products to save:', products.length);
		
		if (!products || !Array.isArray(products) || products.length === 0) {
			return new Response(JSON.stringify({ error: 'No products to save' }), { status: 400 });
		}
		
		let savedCount = 0;
		let skippedCount = 0;
		
		// Save each product using upsert logic
		for (const product of products) {
			try {
				const savedProductId = globalThis.crypto.randomUUID();
				console.log(`[handleBulkSaveProducts] Saving product: ${product.title} (${product.id})`);
				
				// Use INSERT OR REPLACE to handle duplicates
				await db.saveProductUpsert({
					id: savedProductId,
					productId: product.id,
					title: product.title,
					variantTitle: product.variantTitle || '',
					price: product.price || '0',
					handle: product.handle,
					tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags,
					orderTags: '',
					storeId: product.storeId,
					storeDomain: product.storeDomain,
					userId,
					createdAt: new Date().toISOString(),
				});
				savedCount++;
			} catch (error) {
				console.error(`[handleBulkSaveProducts] Error saving product ${product.id}:`, error);
				// Continue with other products even if one fails
			}
		}
		
		console.log(`[handleBulkSaveProducts] Completed: ${savedCount} saved, ${skippedCount} skipped`);
		return new Response(JSON.stringify({ 
			success: true, 
			savedCount,
			skippedCount,
			totalProcessed: products.length
		}), { status: 200 });
	} catch (error) {
		console.error('[handleBulkSaveProducts] Error:', error);
		return new Response(JSON.stringify({ error: 'Failed to save products' }), { status: 500 });
	}
}async function handleBulkApplyLabel(request: Request, db: DatabaseService, userId: string): Promise<Response> {
	try {
		const { productIds, label, storeId } = await request.json();
		console.log('[handleBulkApplyLabel] Received productIds to label:', productIds.length, 'label:', label);
		
		if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
			return new Response(JSON.stringify({ error: 'No products to label' }), { status: 400 });
		}
		
		if (!label || !label.trim()) {
			return new Response(JSON.stringify({ error: 'Label is required' }), { status: 400 });
		}
		
		let updatedCount = 0;
		let skippedCount = 0;
		
		// Update each product's label
		for (const productId of productIds) {
			try {
				console.log(`[handleBulkApplyLabel] Updating label for product: ${productId}`);
				
				// Update the product's label in the database
				await db.updateProductLabel(productId, userId, label.trim());
				updatedCount++;
			} catch (error) {
				console.error(`[handleBulkApplyLabel] Error updating product ${productId}:`, error);
				// Continue with other products even if one fails
				skippedCount++;
			}
		}
		
		console.log(`[handleBulkApplyLabel] Completed: ${updatedCount} updated, ${skippedCount} skipped`);
		return new Response(JSON.stringify({ 
			success: true, 
			updatedCount,
			skippedCount,
			totalProcessed: productIds.length
		}), { status: 200 });
	} catch (error) {
		console.error('[handleBulkApplyLabel] Error:', error);
		return new Response(JSON.stringify({ error: 'Failed to apply label' }), { status: 500 });
	}
}

