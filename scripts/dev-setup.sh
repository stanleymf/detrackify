#!/bin/bash

# Detrackify Development Setup Script

echo "🚀 Setting up Detrackify development environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating .env.example..."
    cat > .env.example << EOF
# JWT Secret for authentication
JWT_SECRET=your-jwt-secret-here

# Shopify API credentials
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret

# Cloudflare configuration
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
EOF
    echo "✅ Created .env.example. Please copy it to .env and fill in your values."
else
    echo "✅ .env file found."
fi

# Check if wrangler is configured
if [ ! -f .wrangler/config/default.toml ]; then
    echo "⚠️  Wrangler not configured. Please run:"
    echo "npx wrangler login"
    echo "npx wrangler config"
else
    echo "✅ Wrangler configuration found."
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Run 'pnpm dev' to start development server"
echo "3. Run 'pnpm deploy' to deploy to Cloudflare Workers"
echo ""
echo "📚 Documentation:"
echo "- README.md - Quick start guide"
echo "- ARCHITECTURE.md - System architecture"
echo "- DEPLOYMENT_GUIDE.md - Deployment instructions" 