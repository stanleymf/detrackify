# Detrack API v2 Integration Test Details

## API Endpoint
```
POST https://app.detrack.com/api/v2/dn/jobs
```

## Request Headers
```
Content-Type: application/json
X-API-KEY: process.env.DETRACK_API_KEY
Accept: application/json
```

## Request Payload
```json
{
  "data": [
    {
      "type": "Delivery",
      "do_number": "TEST-CONNECTION",
      "date": "18/06/2025",
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
```

## Current Status
- **API Key**: ✅ Valid (no longer getting 401 Unauthorized)
- **Endpoint**: ✅ Correct v2 endpoint
- **Response**: ❌ 500 Internal Server Error

## Error Response
```
HTTP 500 Internal Server Error
Response Body: <h1>Internal Server Error</h1>
```

## Integration Context
This is a test request from our Shopify order integration app (Detrackify) to verify the Detrack API v2 connection. The app processes Shopify orders and exports them to Detrack for delivery management.

## Questions for Detrack Team
1. Is the payload format correct for the `/api/v2/dn/jobs` endpoint?
2. Are there any required fields missing from the payload?
3. Is the date format (DD/MM/YYYY) correct?
4. Are there any specific validation rules or constraints we should be aware of?
5. Is the API key `process.env.DETRACK_API_KEY` properly configured for this endpoint?

## Additional Information
- This is a test connection, not a production order
- The app is designed to export real Shopify orders to Detrack
- We're using the official Detrack API v2 documentation as reference 