# Wardrobe AI - Claude Coding Guidelines

## Project Structure

This is a full-stack wardrobe management application with:

- **Frontend**: React Native + Expo (`wardrobe-frontend/`) - JavaScript/JSX
- **Backend**: Flask + SQLAlchemy (`wardrobe-backend/`) - Python
- **AI/ML Service**: FastAPI (`wardrobe-embed-service/`) - Python

## Implementation Best Practices

### Before implementing features:

- Prompt user to explain anything unclear about the feature requirements
- For complex features, plan approach first and confirm with user
- List multiple approaches when possible, with pros/cons for each approach
- Always run `prettier` on newly created files for consistent formatting
- Use ESLint rules and prefer strongly testable functions
- Always write unit tests for complex algorithms or business logic functions
- Prefer integration tests over excessive mocking
- Test API functions with integration tests
- NEVER put comments in code UNLESS there are known caveats
- Only put functions in shared utilities if multiple components use them
- For large DB operations, handle potential errors gracefully

### Component and Styling Best Practices

- **Before creating new components**: Always check existing components in `wardrobe-frontend/components/` to see if similar functionality already exists
- **Check existing styles**: `wardrobe-frontend/styles/tokens.js` is the single source of truth for colors, spacing, radii, typography and shadows; `typography.js`, `global.js` and `card.js` are built from it, and `colors.js` is a deprecated shim kept only for un-swept importers. See `wardrobe-frontend/styles/README.md` for the token groups, the never-hardcode-a-hex rule, and how to add a token
- **Reuse existing styles**: Use the tokens and the established typography and card styles rather than inline values
- **Break components into smaller pieces**: If a component will be reused or is getting complex, break it into smaller, focused components
- **Component organization**:
  - Put reusable components in `components/common/`
  - Put screen-specific components in `components/[screen-name]/`
  - Use descriptive names that indicate purpose
- **Styling approach**:
  - Import and use existing style objects from the styles folder
  - Create new style utilities in the styles folder if needed across multiple components
  - Keep component-specific styles within the component file if only used once

### Running Tests and Linting

- Frontend: Run `npm test` for Jest tests
- Backend: Check for pytest configuration and run tests accordingly
- Always run linting/formatting after code changes
- Ensure all tests pass before marking tasks complete

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not:

1. Can you read the function and HONESTLY easily follow what it's doing?
2. Does the function have very high cyclomatic complexity? (number of paths or conditions)
3. Are there any complex data structures and algorithms that would make testing much easier to follow?
4. Are there any unused parameters in the function?
5. Are there any unnecessary calls that can be moved to function arguments?
6. Is the function easily testable without mocking core features (DB queries, redis, etc.)?
7. Does it have any hidden unstated dependencies or any values that can be factored into arguments?
8. Brainstorm 3 better function names if current name is the best

## Testing Best Practices

Unit tests for a function should be grouped under `describe(functionName, () => {})`

- Avoid hardcoded values
- Adhere to the same high coding standards as production code
- A test must actually test the condition described
- NEVER write trivial tests for the sake of it
- Use `expect.any(...)` when testing for parameters that can be anything (e.g. variable IDs)
- ALWAYS use strong assertions over weaker ones (e.g. `.toEqual()` instead of `.toBe()`)
- Prefer testing axioms and properties over one-off hardcoded tests

## Code Organization - Wardrobe Specific

### Frontend (React Native + Expo) - JavaScript/JSX

- `wardrobe-frontend/screens/` - Main app screens (.jsx)
- `wardrobe-frontend/components/` - Reusable UI components (.jsx)
  - `components/common/` - Shared components across screens
  - `components/[screen-name]/` - Screen-specific components
- `wardrobe-frontend/navigation/` - React Navigation setup (.jsx)
- `wardrobe-frontend/api/` - API calls and external services (.js)
- `wardrobe-frontend/utils/` - Helper functions and utilities (.js)
- `wardrobe-frontend/hooks/` - Custom React hooks (.js)
- `wardrobe-frontend/contexts/` - State management (Context API) (.js)
- `wardrobe-frontend/auth/` - Authentication utilities (.js)
- `wardrobe-frontend/styles/` - Styling utilities (.js)
- `wardrobe-frontend/flows/` - Complex user flows (.js)

### Backend (Flask + SQLAlchemy) - Python

- `wardrobe-backend/app/models/` - SQLAlchemy models
- `wardrobe-backend/app/routes/` - API routes and endpoints
- `wardrobe-backend/app/services/` - Business logic services
- `wardrobe-backend/app/utils/` - Helper functions
- `wardrobe-backend/app/tasks/` - Celery background tasks
- `wardrobe-backend/migrations/` - Alembic database migrations
- `wardrobe-backend/tests/` - Test files
- `wardrobe-backend/scripts/` - Utility scripts

### AI/ML Service (FastAPI) - Python

- `wardrobe-embed-service/app/` - FastAPI application
- Main files: `main.py`, `routes.py`, `schemas.py`, `qdrant_service.py`

## Wardrobe-Specific Implementation Guidelines

### Authentication & Security

- Always validate Firebase Auth tokens in backend middleware
- Implement proper CORS settings for production
- Sanitize all user inputs before database operations
- Use parameterized queries to prevent SQL injection
- Implement rate limiting on API endpoints
- Use service authentication for inter-service communication

### Image Processing

- **No image compression**: Upload full-quality images to S3 to maintain visual quality on frontend
- Use PhotoRoom API for background removal in async tasks
- Generate multiple image sizes if needed (thumbnail, medium, full) but prioritize quality
- Store image metadata in PostgreSQL, files in S3
- Use CloudFront CDN for optimized image delivery
- Handle large image files gracefully in the UI with loading states

### AI/ML Integration

- Process fashion embeddings asynchronously with Celery
- Cache similar item results in Redis for performance
- Implement fallback for when AI services are unavailable
- Use FashionCLIP for semantic similarity matching
- Store embeddings in Qdrant vector database

### Social Features

- Implement real-time notifications for follows/likes
- Use PostgreSQL for social graph relationships
- Cache feed data with Redis for performance
- Implement privacy controls for outfit sharing
- Add moderation system for user-generated content

### Performance Optimization

- Implement lazy loading for wardrobe item lists
- Use React Native's FlatList for large datasets
- Cache API responses with appropriate TTL
- Optimize database queries with proper indexing
- Use background sync for offline functionality
- Handle large, high-quality images with proper loading states and caching

### Weather Integration

- Cache weather data to reduce API calls
- Implement location-based weather recommendations
- Store user location preferences securely
- Handle weather API failures gracefully

### Code Quality Standards

- Use ESLint and Prettier for consistent formatting
- Write comprehensive unit tests for business logic
- Use integration tests for API endpoints
- Document complex algorithms and business rules
- Follow RESTful API design principles
- Implement proper error handling and logging

### Mobile-Specific Guidelines

- Handle different screen sizes and orientations
- Implement proper keyboard handling
- Use native modules for performance-critical features
- Handle app state changes (background/foreground)
- Implement proper deep linking
- Follow platform-specific design guidelines (iOS/Android)
- Optimize for high-quality image display without compromising performance

### Data Management

- Use Alembic for database schema migrations
- Implement soft deletes for user data
- Regular database backups and disaster recovery
- Monitor database performance and optimize queries
- Implement data retention policies

### Deployment & Monitoring

- Use Docker containers for consistent deployments
- Implement health checks for all services
- Set up proper logging and monitoring
- Use feature flags for gradual rollouts
- Implement A/B testing infrastructure

## File Creation Guidelines

When creating new files:

1. Follow the established directory structure
2. Use descriptive, consistent naming conventions
3. Add appropriate imports and exports
4. Include basic error handling
5. Add JSDoc comments for public APIs
6. Create corresponding test files for new modules
7. Use .jsx for React components, .js for utilities/logic
8. Check existing components and styles before creating new ones

## API Design Patterns

### Request/Response Structure

```
GET /api/v1/wardrobe/items
POST /api/v1/outfits
PUT /api/v1/outfits/{id}
DELETE /api/v1/wardrobe/items/{id}
```

### Error Handling

- Use consistent error response format
- Include error codes and human-readable messages
- Log errors with appropriate context
- Return appropriate HTTP status codes

### Pagination

- Implement cursor-based pagination for feeds
- Use offset-based pagination for search results
- Include pagination metadata in responses

## Technology Stack Constraints

- Frontend: React Native 0.79.2, Expo ~53.0.9, JavaScript/JSX
- Backend: Flask 3.0.2, SQLAlchemy, PostgreSQL, Redis, Celery
- AI/ML: FastAPI, Qdrant, sentence-transformers
- Cloud: AWS S3, CloudFront, Firebase Auth
- External APIs: OpenAI, Google Generative AI, PhotoRoom
- Testing: Jest for frontend, pytest for backend

Remember: The goal is production-ready, scalable code that follows our established patterns and handles edge cases gracefully.
