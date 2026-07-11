# API Reference

JD Store uses Next.js Route Handlers (`src/app/api/...`) and Server Actions (`src/actions/...`) for its backend operations.

## Server Actions (Preferred)
Most client-to-server mutations should use Server Actions for better type safety and progressive enhancement.

### `login(formData)`
Authenticates a user and sets HTTP-only cookies.

### `addToCart(productId, variantId, quantity)`
Adds a product to the user's cart in Supabase.

### `checkout(checkoutData)`
Validates inventory, applies discounts, creates an order, and redirects to payment.

## REST APIs
Used primarily by third-party integrations (like webhooks).

### `POST /api/webhooks/payment`
Receives payment status updates from the gateway (Razorpay/Stripe).
- **Body**: `{ "order_id": "...", "status": "paid", "signature": "..." }`

### `POST /api/webhooks/courier`
Receives shipment tracking updates.
- **Body**: `{ "awb": "...", "status": "In Transit", "location": "..." }`

### `POST /api/admin/generate-insights`
Called by the AI Assistant to parse a natural language query and return BI insights.
- **Body**: `{ "query": "How many sales today?", "dashboardData": { ... } }`
- **Response**: `{ "response": "..." }`
