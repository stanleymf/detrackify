# Detrackify Architecture Document

## Overview

Detrackify is a web application that bridges Shopify e-commerce platforms with Detrack delivery management systems. It processes Shopify orders, transforms them into Detrack-compatible formats, and provides a comprehensive dashboard for order management and analytics.

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.0.1
- **UI Library**: Radix UI components with Tailwind CSS
- **Routing**: React Router DOM 6
- **State Management**: React hooks (useState, useEffect)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics
- **Styling**: Tailwind CSS with custom design system

### Backend
- **Platform**: Cloudflare Workers (Edge Computing)
- **Runtime**: V8 JavaScript engine
- **Database**: Cloudflare D1 (SQLite-based)
- **Session Storage**: Cloudflare KV
- **Deployment**: Wrangler CLI

### External Integrations
- **Shopify API**: REST API v2024-01
- **Detrack API**: REST API v2
- **Authentication**: JWT-based with session management

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shopify       │    │   Detrackify     │    │   Detrack       │
│   Store         │◄──►│   Application    │◄──►│   API           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Cloudflare     │
                       │   Infrastructure │
                       │   • Workers      │
                       │   • D1 Database  │
                       │   • KV Storage   │
                       └──────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                     │
├─────────────────────────────────────────────────────────────┤
│  App.tsx                                                    │
│  ├── Layout.tsx                                             │
│  ├── NavigationTabs                                         │
│  └── Routes                                                 │
│      ├── Dashboard.tsx                                      │
│      ├── Analytics.tsx                                      │
│      ├── Settings.tsx                                       │
│      ├── Info.tsx                                           │
│      └── AddOrder.tsx (Modal)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Worker                          │
├─────────────────────────────────────────────────────────────┤
│  worker/index.ts                                            │
│  ├── API Routes Handler                                     │
│  ├── Authentication Service                                 │
│  ├── Database Service                                       │
│  ├── Order Processor                                        │
│  └── Webhook Handlers                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  D1 Database (SQLite)                                       │
│  ├── stores                                                 │
│  ├── orders                                                 │
│  ├── global_field_mappings                                  │
│  ├── extract_processing_mappings                            │
│  ├── users                                                  │
│  ├── user_sessions                                          │
│  ├── webhook_events                                         │
│  └── detrack_config                                         │
│                                                             │
│  KV Storage                                                 │
│  └── sessions                                               │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1 Implementation Details

### 1. Core Infrastructure

#### Database Schema
- **stores**: Shopify store configurations and API credentials
- **orders**: Processed order data with both raw and transformed formats
- **global_field_mappings**: Field mapping configurations for data transformation
- **extract_processing_mappings**: Special processing rules for complex field transformations
- **users**: User authentication and management
- **user_sessions**: Session management for authentication
- **webhook_events**: Webhook processing tracking
- **detrack_config**: Detrack API configuration

#### Key Features Implemented

##### Authentication System
- JWT-based authentication with session management
- User registration and login
- Session persistence using Cloudflare KV
- Protected API routes

##### Order Processing Pipeline
1. **Webhook Reception**: Shopify webhooks for order events
2. **Data Fetching**: Complete order data retrieval from Shopify API
3. **Field Mapping**: Configurable field mapping system
4. **Data Transformation**: Complex processing for dates, times, and calculations
5. **Storage**: Processed data stored in D1 database
6. **Export**: Detrack-compatible format generation

##### Field Mapping System
- **Global Field Mappings**: Direct field-to-field mappings
- **Extract Processing Mappings**: Complex transformations including:
  - Date extraction from tags (dd/mm/yyyy format)
  - Time window processing (Morning/Afternoon/Night)
  - Group extraction from order names
  - Item count calculations
  - Phone number normalization

##### Webhook Management
- Automatic webhook registration with Shopify
- Webhook secret management
- Event processing tracking
- Error handling and retry mechanisms

### 2. Frontend Architecture

#### Component Structure
- **Layout**: Main application layout with navigation
- **Dashboard**: Order management and export interface
- **Analytics**: Data visualization and reporting
- **Settings**: Configuration management
- **Info**: System information and documentation

#### State Management
- React hooks for local state
- Context API for global state (if needed)
- Session-based authentication state

#### UI/UX Design
- Responsive design with mobile-first approach
- Custom design system with Tailwind CSS
- Radix UI components for accessibility
- Dark/light theme support

### 3. API Architecture

#### RESTful Endpoints
```
Authentication:
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/check

Store Management:
GET    /api/stores
POST   /api/stores
GET    /api/stores/:id
PUT    /api/stores/:id
DELETE /api/stores/:id

Order Management:
GET    /api/orders
POST   /api/orders/manual
POST   /api/fetch-orders
POST   /api/reprocess-orders
DELETE /api/orders/:id

Configuration:
GET    /api/field-mappings
POST   /api/field-mappings
GET    /api/detrack/config
POST   /api/detrack/config

Detrack Integration:
GET    /api/detrack/job-types
POST   /api/detrack/test
POST   /api/detrack/update-key

Webhooks:
POST   /api/webhooks/shopify
POST   /api/update-webhook-secrets
```

### 4. Data Flow

#### Order Processing Flow
```
1. Shopify Order Created/Updated
   ↓
2. Webhook Received
   ↓
3. Complete Order Data Fetched from Shopify API
   ↓
4. Field Mappings Applied
   ↓
5. Extract Processing Rules Applied
   ↓
6. Transformed Data Stored in Database
   ↓
7. Available for Export to Detrack
```

#### Manual Order Creation Flow
```
1. User Clicks "Add Order" on Dashboard
   ↓
2. AddOrder.tsx Modal Opens
   ↓
3. User Fills and Submits Form
   ↓
4. POST Request to /api/orders/manual
   ↓
5. Minimal Processing in Worker (e.g., phone normalization)
   ↓
6. Order Inserted into D1 with `store_id: 'manual'`
   ↓
7. Available for Export to Detrack
```

#### Authentication Flow
```
1. User Login Request
   ↓
2. Credentials Validated
   ↓
3. JWT Token Generated
   ↓
4. Session Stored in KV
   ↓
5. Cookie Set in Browser
   ↓
6. Subsequent Requests Validated
```

## Phase 2 Suggestions

### 1. Enhanced Analytics & Reporting

#### Advanced Analytics Dashboard
- **Real-time Metrics**: Live order processing statistics
- **Performance Analytics**: Processing time, success rates, error tracking
- **Business Intelligence**: Revenue tracking, delivery patterns, customer insights
- **Custom Reports**: User-defined report generation
- **Data Export**: CSV/Excel export capabilities

#### Predictive Analytics
- **Delivery Time Prediction**: ML-based delivery time estimation
- **Order Volume Forecasting**: Seasonal and trend analysis
- **Route Optimization**: Delivery route suggestions
- **Capacity Planning**: Resource allocation recommendations

### 2. Multi-Store Management

#### Store Federation
- **Centralized Dashboard**: Manage multiple stores from single interface
- **Store Grouping**: Organize stores by region, business type, etc.
- **Bulk Operations**: Apply configurations across multiple stores
- **Store-specific Customization**: Individual store settings and mappings

#### Advanced Store Features
- **Store Templates**: Pre-configured store setups
- **Store Cloning**: Copy configurations between stores
- **Store Analytics**: Individual store performance metrics
- **Store Comparison**: Side-by-side store analysis

### 3. Enhanced Integration Capabilities

#### Additional E-commerce Platforms
- **WooCommerce Integration**: WordPress-based stores
- **Magento Integration**: Enterprise e-commerce
- **Custom API Support**: Generic API integration framework

#### Delivery Service Expansion
- **Multiple Delivery Providers**: Beyond Detrack
- **Provider Comparison**: Cost and service comparison
- **Automatic Provider Selection**: Best provider based on criteria
- **Provider API Abstraction**: Unified interface for multiple providers

### 4. Advanced Order Management

#### Smart Order Processing
- **AI-powered Field Mapping**: Automatic field detection and mapping
- **Order Classification**: Automatic categorization of orders
- **Duplicate Detection**: Identify and handle duplicate orders
- **Order Validation**: Automated order data validation

#### Workflow Automation
- **Custom Workflows**: User-defined processing pipelines
- **Conditional Processing**: Rules-based order handling
- **Automated Actions**: Trigger actions based on order status
- **Integration Hooks**: Webhook endpoints for external systems

### 5. Security & Compliance

#### Enhanced Security
- **Multi-factor Authentication**: 2FA support
- **Role-based Access Control**: User roles and permissions
- **API Rate Limiting**: Protection against abuse
- **Audit Logging**: Comprehensive activity tracking

#### Compliance Features
- **GDPR Compliance**: Data privacy and deletion
- **Data Encryption**: End-to-end encryption
- **Backup & Recovery**: Automated data backup
- **Compliance Reporting**: Regulatory compliance reports

### 6. Performance & Scalability

#### Performance Optimization
- **Caching Layer**: Redis or similar for performance
- **CDN Integration**: Global content delivery
- **Database Optimization**: Query optimization and indexing
- **Background Processing**: Async job processing

#### Scalability Improvements
- **Microservices Architecture**: Service decomposition
- **Load Balancing**: Traffic distribution
- **Auto-scaling**: Automatic resource scaling
- **Multi-region Deployment**: Global availability

### 7. User Experience Enhancements

#### Advanced UI/UX
- **Progressive Web App**: Offline capabilities
- **Mobile App**: Native mobile applications
- **Real-time Updates**: WebSocket-based live updates
- **Customizable Dashboard**: Drag-and-drop dashboard builder

#### Collaboration Features
- **Team Management**: Multi-user support
- **Shared Workspaces**: Collaborative order management
- **Communication Tools**: In-app messaging and notifications
- **Activity Feed**: Real-time activity tracking

### 8. API & Developer Experience

#### Developer Tools
- **API Documentation**: Comprehensive API docs
- **SDK Development**: Client libraries for popular languages
- **Webhook Testing**: Webhook testing and debugging tools
- **API Versioning**: Backward-compatible API versions

#### Integration Marketplace
- **Plugin System**: Third-party integrations
- **Custom Connectors**: User-defined integrations
- **Integration Templates**: Pre-built integration patterns
- **Developer Portal**: Self-service integration tools

## Deployment Architecture

### Current Deployment
- **Platform**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Storage**: Cloudflare KV
- **CDN**: Cloudflare's global network
- **Domain**: Custom domain with SSL

### Phase 2 Deployment Options
- **Multi-region**: Global deployment for better latency
- **Hybrid Cloud**: On-premise + cloud deployment
- **Containerization**: Docker-based deployment
- **Kubernetes**: Orchestration for complex deployments

## Monitoring & Observability

### Current Monitoring
- **Cloudflare Analytics**: Basic performance metrics
- **Console Logging**: Application-level logging
- **Error Tracking**: Basic error handling

### Phase 2 Monitoring
- **Application Performance Monitoring**: Detailed performance insights
- **Distributed Tracing**: Request flow tracking
- **Custom Metrics**: Business-specific metrics
- **Alerting System**: Proactive issue detection
- **Health Checks**: System health monitoring

## Security Considerations

### Current Security
- **JWT Authentication**: Secure token-based auth
- **HTTPS**: Encrypted communication
- **Input Validation**: Data sanitization
- **SQL Injection Prevention**: Parameterized queries

### Phase 2 Security
- **Penetration Testing**: Regular security audits
- **Vulnerability Scanning**: Automated security checks
- **Security Headers**: Enhanced HTTP security
- **Data Encryption**: At-rest and in-transit encryption
- **Access Control**: Fine-grained permissions

## Conclusion

The current Phase 1 implementation provides a solid foundation for Shopify-Detrack integration with a modern, scalable architecture. The suggested Phase 2 enhancements would transform Detrackify into a comprehensive e-commerce delivery management platform with advanced analytics, multi-store support, and enterprise-grade features.

The architecture is designed to be modular and extensible, allowing for incremental implementation of Phase 2 features without disrupting existing functionality. 