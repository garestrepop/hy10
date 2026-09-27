# Contributing to hy10

Thank you for your interest in contributing to hy10! This document provides guidelines and instructions for contributing.

## Development Workflow

We follow GitFlow branching model:

### Branches

- `main` - Production-ready code
- `develop` - Integration branch (default)
- `feature/*` - New features (branch from `develop`)
- `release/*` - Release preparation (branch from `develop`)
- `hotfix/*` - Production fixes (branch from `main`)

### Branch Naming Convention

Cloud Agents and developers should follow this pattern:

```
feature/descriptive-name
hotfix/issue-number-short-description
release/version-number
```

For Cloud Agent branches specifically:
```
cursor/descriptive-name-7a13
```

## Getting Started

### 1. Set Up Development Environment

```bash
# Clone the repository
git clone https://github.com/garestrepop/hy10.git
cd hy10

# Run setup script
./scripts/setup.sh

# Or manually:
pnpm install
docker-compose up -d postgres
cd apps/api && pnpm migration:run
```

### 2. Create a Feature Branch

```bash
# Make sure you're on develop
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

Follow the project conventions:

- **Code Style**: Follow TypeScript and NestJS best practices
- **Naming**: Use `snake_case` for database columns, `camelCase` for TypeScript
- **Commits**: Write clear, descriptive commit messages
- **Tests**: Add tests for new functionality

### 4. Test Your Changes

```bash
# Run linter
pnpm lint

# Run tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Test specific module
pnpm test audit
```

### 5. Commit Your Changes

We follow conventional commits format:

```bash
git add .
git commit -m "feat(module): add new feature

Detailed description of what was added and why.

Refs: HY1-XX"
```

Commit types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `chore`: Build process or auxiliary tool changes

### 6. Push and Create Pull Request

```bash
# Push your branch
git push -u origin feature/your-feature-name

# Create a PR on GitHub targeting 'develop'
```

## Pull Request Guidelines

### PR Title

Follow the same format as commits:

```
feat(audit): implement US-31 audit consultation feature
```

### PR Description

Include:

1. **Summary**: Brief description of changes
2. **User Story**: Reference to Linear issue if applicable
3. **Features**: List of features implemented
4. **Testing**: How to test the changes
5. **Requirements Met**: Traceability to requirements

See [PR #1](https://github.com/garestrepop/hy10/pull/1) as an example.

### PR Checklist

Before submitting:

- [ ] Code follows project conventions
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] Migrations created if schema changed
- [ ] Linear issue referenced in commit/PR

## Code Review Process

1. **Automated Checks**: CI must pass (lint, tests, build)
2. **Review**: At least one approval required
3. **Address Feedback**: Make requested changes
4. **Merge**: Squash and merge to `develop`

## Project Structure

```
hy10/
├── apps/
│   └── api/              # NestJS API
│       ├── src/
│       │   ├── audit/    # Audit module (US-31)
│       │   ├── health/   # Health checks
│       │   └── migrations/
│       └── test/
├── docs/                 # Project documentation
├── aidlc-docs/          # AI-DLC specification docs
├── scripts/             # Utility scripts
└── .github/
    └── workflows/       # GitHub Actions
```

## Testing Guidelines

### Unit Tests

- Test all public methods
- Mock external dependencies
- Aim for 80%+ coverage

```typescript
describe('AuditService', () => {
  it('should record audit log with sanitized data', async () => {
    // Test implementation
  });
});
```

### Integration Tests

- Test module interactions
- Use test database
- Clean up after tests

## Documentation

### Code Comments

- Document complex logic
- Don't comment obvious code
- Use JSDoc for public APIs

```typescript
/**
 * Record an audit event
 * Per FR-56: If write fails, business operation should not rollback
 */
async record(dto: CreateAuditLogDto): Promise<void> {
  // Implementation
}
```

### API Documentation

Use Swagger decorators:

```typescript
@ApiOperation({
  summary: 'Query audit logs',
  description: 'Detailed description...',
})
@ApiResponse({
  status: 200,
  description: 'Success',
  type: AuditLogPageResponseDto,
})
```

## Database Migrations

### Creating Migrations

```bash
# After changing entities
pnpm --filter @hy10/api migration:generate src/migrations/MigrationName

# Run migrations
pnpm --filter @hy10/api migration:run

# Revert last migration
pnpm --filter @hy10/api migration:revert
```

### Migration Guidelines

- **One change per migration**: Don't mix schema changes
- **Reversible**: Always implement `down()` method
- **Test**: Test both up and down migrations
- **Data safety**: Never drop columns with data in production

## Security Guidelines

### Sensitive Data

Never commit:
- API keys or secrets
- Database credentials
- JWT secrets
- Personal data

Use environment variables for all secrets.

### Audit Log Safety

Per FR-56, never log:
- Passwords or password hashes
- Tokens (access, refresh, API keys)
- Card data (numbers, CVV)
- Audio or voice recordings

The `AuditService` automatically redacts these fields.

## Performance Guidelines

- Use database indexes for frequently queried fields
- Paginate large result sets
- Avoid N+1 queries
- Use connection pooling

## Issue Tracking

We use Linear for issue tracking:

- Reference Linear issues in commits: `Refs: HY1-XX`
- Update issue status when starting work
- Link PRs to issues
- Close issues when merged to main

## Questions?

- Check existing documentation first
- Open an issue for questions
- Ask in PR comments for review questions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
