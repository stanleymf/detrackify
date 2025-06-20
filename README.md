# Detrackify

A web application that bridges Shopify e-commerce platforms with Detrack delivery management systems. It processes Shopify orders, transforms them into Detrack-compatible formats, and provides a comprehensive dashboard for order management and analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- Cloudflare account with Workers and D1 database

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd detrackify

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev

# Deploy to Cloudflare Workers
pnpm deploy
```

## 📁 Project Structure

```
detrackify/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── lib/               # Utility libraries
│   ├── types/             # TypeScript type definitions
│   └── main.tsx           # Application entry point
├── worker/                # Cloudflare Worker backend
│   └── index.ts           # Worker entry point
├── scripts/               # Utility scripts
│   ├── register-*.js      # Webhook registration scripts
│   ├── update-*.js        # Configuration update scripts
│   ├── schema.sql         # Database schema
│   └── migration.sql      # Database migrations
├── tests/                 # Test files and debugging scripts
│   ├── test-*.js          # Various test scripts
│   ├── debug-*.js         # Debugging utilities
│   └── analyze-*.js       # Analysis scripts
├── docs/                  # Documentation
│   ├── SCRATCHPAD.md      # Development notes
│   ├── detrack-api-*.md   # API documentation
│   └── zapi-*.md          # ZAPI integration docs
├── migrations/            # Database migration files
├── public/                # Static assets
└── dist/                  # Build output
```

## 🛠️ Development

### Available Scripts
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm deploy` - Deploy to Cloudflare Workers
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Biome

### Key Features
- **Shopify Integration**: Real-time order processing via webhooks
- **Detrack Export**: Convert orders to Detrack delivery jobs
- **Field Mapping**: Configurable data transformation
- **Multi-Store Support**: Manage multiple Shopify stores
- **Authentication**: Secure user authentication system
- **Dashboard**: Comprehensive order management interface

## 📚 Documentation

- [Architecture](ARCHITECTURE.md) - System architecture and design
- [Changelog](CHANGELOG.md) - Version history and changes
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [Field Mapping Guide](FIELD_MAPPING_GUIDE.md) - Data mapping configuration

## 🔧 Configuration

### Environment Variables
- `JWT_SECRET` - JWT signing secret
- `SHOPIFY_API_KEY` - Shopify API key
- `SHOPIFY_API_SECRET` - Shopify API secret

### Database Setup
The application uses Cloudflare D1 database. See [scripts/schema.sql](scripts/schema.sql) for the database schema.

## 🚀 Deployment

1. Build the application: `pnpm build`
2. Deploy to Cloudflare: `pnpm deploy`
3. Configure environment variables in Cloudflare dashboard
4. Set up D1 database and KV namespaces

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software.

## 🆘 Support

For support and questions, please refer to the documentation or create an issue in the repository. 