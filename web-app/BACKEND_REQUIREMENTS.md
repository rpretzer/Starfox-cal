# Backend Requirements for Authentication and Cloud Persistence

## Overview

To implement authentication and cloud persistence, you'll need a backend API that handles:
1. User authentication and authorization
2. OAuth integration (Google, Apple, Microsoft)
3. Data storage and synchronization
4. Real-time updates across devices
5. Conflict resolution

---

## Architecture Options

### Option 1: Serverless (Recommended for Start)
**Best for:** Quick start, low initial cost, auto-scaling
- **AWS**: API Gateway + Lambda + DynamoDB + Cognito
- **Google Cloud**: Cloud Functions + Firestore + Firebase Auth
- **Vercel/Netlify**: Serverless Functions + Supabase/PlanetScale
- **Azure**: Functions + Cosmos DB + Azure AD B2C

### Option 2: Traditional Backend
**Best for:** More control, predictable costs
- **Node.js/Express** + PostgreSQL/MongoDB
- **Python/FastAPI** + PostgreSQL
- **Go/Gin** + PostgreSQL
- **Ruby on Rails** + PostgreSQL

### Option 3: Backend-as-a-Service (BaaS)
**Best for:** Fastest development, managed services
- **Firebase** (Google) - Full stack solution
- **Supabase** - Open-source Firebase alternative
- **AWS Amplify** - Full-stack framework
- **Appwrite** - Self-hostable BaaS

---

## Required Components

### 1. Authentication Service

#### User Management
- **User Registration**
  - Email/password signup
  - Email verification
  - Password reset flow
  - Account activation

- **User Login**
  - Email/password authentication
  - Session management
  - Remember me functionality
  - Multi-factor authentication (optional)

- **OAuth Integration**
  - Google Sign-In (OAuth 2.0)
  - Microsoft/Azure AD (OAuth 2.0)
  - Apple Sign-In (OAuth 2.0)
  - Account linking (link OAuth to existing account)

- **Demo Mode**
  - Temporary anonymous accounts
  - Auto-cleanup after inactivity
  - Limited functionality

#### Session Management
- **JWT Tokens**
  - Access tokens (short-lived, 15-60 min)
  - Refresh tokens (long-lived, 7-30 days)
  - Token rotation for security
  - Token revocation

- **Session Storage**
  - Redis for active sessions
  - Database for session history
  - Device tracking

#### Security
- **Password Hashing**
  - bcrypt or Argon2
  - Salt rounds (minimum 10)
  - Password strength requirements

- **Rate Limiting**
  - Login attempts (5-10 per 15 min)
  - Registration attempts
  - Password reset requests

- **CORS Configuration**
  - Allow only your domain(s)
  - Credentials support

---

### 2. Data Storage Service

#### Database Schema

**Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for OAuth-only users
  display_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_login TIMESTAMP,
  is_demo BOOLEAN DEFAULT FALSE,
  demo_expires_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE
);
```

**OAuth Accounts Table**
```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', 'apple'
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);
```

**Meetings Table**
```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) NOT NULL,
  days TEXT[] NOT NULL, -- Array of day names
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  week_type VARCHAR(20) NOT NULL,
  requires_attendance TEXT,
  notes TEXT,
  assigned_to TEXT,
  series_id VARCHAR(255),
  meeting_link TEXT,
  meeting_link_type VARCHAR(20),
  public_visibility VARCHAR(20) DEFAULT 'private',
  permalink VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_synced_at TIMESTAMP,
  version INTEGER DEFAULT 1, -- For conflict resolution
  UNIQUE(user_id, id)
);
```

**Categories Table**
```sql
CREATE TABLE categories (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color_value INTEGER NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, id)
);
```

**Meeting Series Table**
```sql
CREATE TABLE meeting_series (
  series_id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(255) NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  week_type VARCHAR(20) NOT NULL,
  days TEXT[] NOT NULL,
  requires_attendance TEXT,
  notes TEXT,
  assigned_to TEXT,
  meeting_ids INTEGER[],
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Calendar Sync Configs Table**
```sql
CREATE TABLE calendar_sync_configs (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  sync_interval INTEGER,
  -- Provider-specific fields
  google_calendar_id VARCHAR(255),
  outlook_calendar_id VARCHAR(255),
  ics_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**User Settings Table**
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  monthly_view_enabled BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(100),
  time_format VARCHAR(5) DEFAULT '12h',
  default_public_visibility VARCHAR(20) DEFAULT 'private',
  permalink_base_url TEXT,
  oauth_client_ids JSONB, -- {google: "...", microsoft: "...", apple: "..."}
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Sync Log Table** (for conflict resolution)
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  entity_type VARCHAR(50) NOT NULL, -- 'meeting', 'category', etc.
  entity_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  device_id VARCHAR(255),
  timestamp TIMESTAMP NOT NULL,
  data JSONB, -- Snapshot of the change
  version INTEGER NOT NULL
);
```

---

### 3. API Endpoints

#### Authentication Endpoints
```
POST   /api/auth/register          - Create new account
POST   /api/auth/login              - Login with email/password
POST   /api/auth/logout             - Logout (invalidate tokens)
POST   /api/auth/refresh            - Refresh access token
POST   /api/auth/forgot-password    - Request password reset
POST   /api/auth/reset-password     - Reset password with token
POST   /api/auth/verify-email       - Verify email address
GET    /api/auth/me                 - Get current user info
PUT    /api/auth/me                 - Update user profile
DELETE /api/auth/me                 - Delete account

POST   /api/auth/oauth/google       - Initiate Google OAuth
POST   /api/auth/oauth/microsoft    - Initiate Microsoft OAuth
POST   /api/auth/oauth/apple        - Initiate Apple OAuth
GET    /api/auth/oauth/callback     - OAuth callback handler
POST   /api/auth/oauth/link         - Link OAuth account
DELETE /api/auth/oauth/unlink       - Unlink OAuth account

POST   /api/auth/demo               - Create demo account
```

#### Data Endpoints
```
# Meetings
GET    /api/meetings                - List all meetings
GET    /api/meetings/:id            - Get single meeting
POST   /api/meetings                - Create meeting
PUT    /api/meetings/:id            - Update meeting
DELETE /api/meetings/:id            - Delete meeting
POST   /api/meetings/batch          - Batch create/update/delete

# Categories
GET    /api/categories              - List all categories
POST   /api/categories              - Create category
PUT    /api/categories/:id          - Update category
DELETE /api/categories/:id          - Delete category

# Meeting Series
GET    /api/series                  - List all series
GET    /api/series/:id              - Get single series
POST   /api/series                  - Create series
PUT    /api/series/:id              - Update series
DELETE /api/series/:id              - Delete series

# Calendar Sync
GET    /api/sync/configs            - List sync configs
POST   /api/sync/configs            - Create sync config
PUT    /api/sync/configs/:id        - Update sync config
DELETE /api/sync/configs/:id        - Delete sync config
POST   /api/sync/configs/:id/sync   - Trigger manual sync

# Settings
GET    /api/settings                - Get user settings
PUT    /api/settings                - Update user settings

# Sync
GET    /api/sync/changes            - Get changes since timestamp
POST   /api/sync/push               - Push local changes
GET    /api/sync/conflicts           - Get conflict list
POST   /api/sync/resolve            - Resolve conflict
```

---

### 4. Real-Time Sync

#### WebSocket Server
- **Connection Management**
  - Authenticate WebSocket connections
  - Track active connections per user
  - Handle reconnection logic

- **Message Types**
  ```typescript
  // Client -> Server
  { type: 'subscribe', channel: 'user:123' }
  { type: 'unsubscribe', channel: 'user:123' }
  { type: 'ping' }

  // Server -> Client
  { type: 'meeting:created', data: {...} }
  { type: 'meeting:updated', data: {...} }
  { type: 'meeting:deleted', id: 123 }
  { type: 'conflict', data: {...} }
  { type: 'pong' }
  ```

#### Polling Alternative (Simpler)
- Client polls `/api/sync/changes?since=<timestamp>` every 5-10 seconds
- Server returns changes since last sync
- Simpler to implement, less real-time

---

### 5. Conflict Resolution

#### Strategy: Last-Write-Wins with Versioning
1. Each entity has a `version` number
2. Client sends version with updates
3. Server checks version:
   - If client version < server version → conflict
   - If client version = server version → update succeeds
   - If client version > server version → error (shouldn't happen)

#### Conflict Resolution Options
1. **Automatic (Last Write Wins)**
   - Server accepts the latest update
   - Simpler but may lose data

2. **Manual Resolution**
   - Server returns both versions
   - Client shows conflict UI
   - User chooses which to keep or merges manually

3. **Field-Level Merging**
   - Compare fields individually
   - Auto-merge non-conflicting fields
   - Prompt for conflicting fields

#### Implementation
```typescript
interface Conflict {
  entityType: 'meeting' | 'category' | 'series';
  entityId: string;
  localVersion: number;
  serverVersion: number;
  localData: any;
  serverData: any;
  timestamp: Date;
}
```

---

## Technology Stack Recommendations

### Option A: Supabase (Easiest)
**Pros:**
- PostgreSQL database (familiar SQL)
- Built-in authentication (email, OAuth)
- Real-time subscriptions
- Row-level security
- Free tier available
- Self-hostable

**Cons:**
- Vendor lock-in (can migrate)
- Less control over infrastructure

**Setup:**
1. Create Supabase project
2. Run migration scripts
3. Configure OAuth providers
4. Set up Row Level Security policies
5. Use Supabase client in frontend

### Option B: AWS (Most Scalable)
**Components:**
- **API Gateway** - REST API
- **Lambda** - Serverless functions
- **DynamoDB** - NoSQL database (or RDS for PostgreSQL)
- **Cognito** - Authentication
- **S3** - File storage (if needed)
- **CloudWatch** - Logging/monitoring

**Pros:**
- Highly scalable
- Pay-per-use pricing
- Enterprise-grade security

**Cons:**
- More complex setup
- AWS learning curve
- Can be expensive at scale

### Option C: Node.js + PostgreSQL (Most Control)
**Stack:**
- **Express.js** or **Fastify** - API framework
- **PostgreSQL** - Database
- **Prisma** or **TypeORM** - ORM
- **Passport.js** - Authentication middleware
- **Socket.io** - WebSocket server
- **Redis** - Session storage, caching
- **JWT** - Token management

**Pros:**
- Full control
- Can deploy anywhere (VPS, Railway, Render, etc.)
- Predictable costs

**Cons:**
- More code to write
- Need to manage infrastructure

---

## Security Considerations

1. **HTTPS Only**
   - All API calls over HTTPS
   - Secure cookies (HttpOnly, Secure, SameSite)

2. **Input Validation**
   - Validate all inputs server-side
   - Sanitize user data
   - SQL injection prevention (use parameterized queries)

3. **Rate Limiting**
   - Limit API calls per user/IP
   - Prevent brute force attacks
   - DDoS protection

4. **CORS**
   - Whitelist only your domain(s)
   - No wildcard origins

5. **Token Security**
   - Short-lived access tokens
   - Secure refresh token storage
   - Token rotation

6. **Data Encryption**
   - Encrypt sensitive data at rest
   - Encrypt data in transit (TLS)
   - Hash passwords properly

---

## Deployment Options

### Serverless
- **Vercel** - Frontend + API routes
- **Netlify** - Frontend + Functions
- **AWS Lambda** - Serverless functions
- **Google Cloud Functions** - Serverless functions

### Traditional Hosting
- **Railway** - Easy PostgreSQL + Node.js
- **Render** - PostgreSQL + Node.js
- **Fly.io** - Global edge deployment
- **DigitalOcean App Platform** - Managed platform
- **Heroku** - Easy but expensive

### Self-Hosted
- **VPS** (DigitalOcean, Linode, AWS EC2)
- **Docker** containers
- **Kubernetes** (for scale)

---

## Cost Estimates (Monthly)

### Supabase (Free Tier)
- Free: Up to 500MB database, 50K monthly active users
- Pro: $25/month - 8GB database, 100K MAU

### AWS (Pay-as-you-go)
- API Gateway: $3.50 per million requests
- Lambda: $0.20 per million requests
- DynamoDB: $1.25 per million reads, $1.25 per million writes
- Cognito: $0.0055 per MAU
- **Estimated**: $10-50/month for small app

### Node.js + PostgreSQL (VPS)
- **Railway**: $5-20/month
- **Render**: $7-25/month
- **DigitalOcean**: $6-12/month (droplet) + $15/month (managed DB)

---

## Implementation Phases

### Phase 1: Basic Authentication (Week 1-2)
1. Set up backend infrastructure
2. Implement email/password auth
3. JWT token generation
4. Basic user CRUD

### Phase 2: OAuth Integration (Week 2-3)
1. Google OAuth
2. Microsoft OAuth
3. Apple OAuth
4. Account linking

### Phase 3: Data Sync (Week 3-4)
1. Database schema
2. CRUD APIs for meetings/categories
3. Basic sync (polling)
4. Conflict detection

### Phase 4: Real-Time (Week 4-5)
1. WebSocket server
2. Real-time updates
3. Multi-device sync

### Phase 5: Advanced Features (Week 5-6)
1. Conflict resolution UI
2. Demo mode
3. Advanced sync strategies
4. Performance optimization

---

## Next Steps

1. **Choose your stack** (Supabase recommended for fastest start)
2. **Set up development environment**
3. **Create database schema**
4. **Implement authentication endpoints**
5. **Build data sync APIs**
6. **Add real-time capabilities**
7. **Implement conflict resolution**
8. **Deploy and test**

---

## Recommended Starting Point: Supabase

**Why Supabase?**
- Fastest to get started
- PostgreSQL (familiar SQL)
- Built-in auth with OAuth
- Real-time subscriptions
- Good free tier
- Can migrate later if needed

**Quick Start:**
1. Sign up at supabase.com
2. Create new project
3. Run SQL migrations
4. Configure OAuth providers
5. Use Supabase client in React app

Would you like me to create a detailed implementation guide for any specific option?

