# Quick Start Guide - hy10 API

This guide will help you get the hy10 API running locally.

## Prerequisites

- Node.js 20+ and pnpm 8+
- Docker and Docker Compose (recommended)
- PostgreSQL 14+ (if not using Docker)

## Option 1: Using Docker (Recommended)

The easiest way to get started:

```bash
# Start PostgreSQL and API
docker-compose up -d

# Check logs
docker-compose logs -f api

# Stop services
docker-compose down
```

The API will be available at:
- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/health

## Option 2: Local Development

### 1. Install Dependencies

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm@8.15.0

# Install project dependencies
pnpm install
```

### 2. Set Up Database

Start PostgreSQL (using Docker):

```bash
docker-compose up -d postgres
```

Or use your own PostgreSQL instance and update `.env` accordingly.

### 3. Configure Environment

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` with your configuration (defaults should work with Docker Compose).

### 4. Run Migrations

```bash
cd apps/api
pnpm migration:run
```

### 5. Start Development Server

```bash
# From project root
pnpm dev

# Or from apps/api
cd apps/api
pnpm dev
```

The API will be available at http://localhost:3001.

## Testing the Audit API

### 1. Health Check

```bash
# Process liveness
curl http://localhost:3001/api/v1/health

# Database readiness
curl http://localhost:3001/api/v1/health/ready
```

### 2. View API Documentation

Open http://localhost:3001/api/docs in your browser to see the Swagger UI.

### 3. Query Audit Logs (requires authentication)

Once you implement authentication, you can query audit logs:

```bash
# Example query (requires valid JWT token)
curl -X GET "http://localhost:3001/api/v1/audit?action=reservation_created&from_date=2026-01-01T00:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch

# Run only audit tests
pnpm test audit
```

## Database Migrations

```bash
# Run migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Show migration status
pnpm migration:show

# Generate new migration (after entity changes)
pnpm migration:generate src/migrations/MigrationName
```

## Project Structure

```
apps/api/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── audit/               # Audit module (US-31)
│   │   ├── entities/
│   │   ├── dto/
│   │   ├── audit.service.ts
│   │   ├── audit.controller.ts
│   │   └── audit.module.ts
│   ├── health/              # Health check endpoints
│   └── migrations/          # Database migrations
├── test/                    # E2E tests
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Next Steps

1. **Implement Authentication**: Add JWT authentication and role-based access control
2. **Add More Modules**: Implement Reservations, Billing, Catalog, etc.
3. **Set Up CI/CD**: Configure GitHub Actions for automated testing and deployment
4. **Configure Production**: Set up Railway/Supabase for production deployment

## Troubleshooting

### Port Already in Use

If port 3001 is already in use:

```bash
# Change PORT in .env
PORT=3002
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Migration Errors

```bash
# Drop and recreate database (WARNING: destroys all data)
docker-compose down -v
docker-compose up -d postgres

# Then run migrations again
pnpm migration:run
```

## Additional Resources

- [Full API Documentation](./README.md)
- [US-31 Implementation Guide](../../docs/US-31-implementation.md)
- [hy10 Requirements](../../aidlc-docs/inception/requirements/requirements.md)
- [User Stories](../../aidlc-docs/inception/user-stories/stories.md)

## Support

For issues or questions, please open an issue on GitHub or refer to the project documentation.
