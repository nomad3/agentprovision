# AGENTS.md

## Build/Lint/Test Commands

### API (Python)

```bash
cd apps/api && pip install -r requirements.txt
pytest                    # Run all tests
pytest tests/test_api.py  # Run single test file
pytest -v                 # Verbose output
ruff check app            # Lint code
```

### Web (React)

```bash
cd apps/web && npm install
npm test                  # Run tests in watch mode
npm test -- --ci          # Run tests once
npm test -- WizardStepper.test.js  # Run single test
npm run build             # Build for production
```

### Monorepo

```bash
pnpm install && pnpm build && pnpm lint
```

## Code Style Guidelines

### Python (API)

- SQLAlchemy models with UUID primary keys, always include `tenant_id`
- Import order: stdlib → third-party → local app
- Pydantic schemas for API validation, service layer pattern
- Synchronous SQLAlchemy sessions, not async

### JavaScript (Web)

- React functional components with hooks, Bootstrap 5 UI
- Axios for API calls with JWT auth, localStorage for tokens
- Components: PascalCase, Services: camelCase

### Error Handling

- API: Proper HTTP status codes with error details
- Frontend: Try/catch for API calls, user-friendly messages
- Always validate tenant isolation in queries
