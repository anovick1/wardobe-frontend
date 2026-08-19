# Testing Documentation

This directory contains the test suite for the Wardrobe Frontend application. The tests are written using Jest and React Native Testing Library.

## Directory Structure

```
__tests__/
├── PlannerScreen.test.js
├── ProfileScreen.test.js
├── WardrobeItems.test.js
├── LoginScreen.test.js
├── WardrobeScreen.test.js
├── FeedScreen.test.js
├── WardrobeItemDetail.test.js
└── tokens.test.js

__mocks__/
├── hooks/
└── firebase/
```

## Test Files Overview

- `PlannerScreen.test.js`: Tests for the outfit planning functionality
- `ProfileScreen.test.js`: Tests for user profile management
- `WardrobeItems.test.js`: Tests for wardrobe item management and display
- `LoginScreen.test.js`: Tests for authentication and login functionality
- `WardrobeScreen.test.js`: Tests for the main wardrobe view
- `FeedScreen.test.js`: Tests for the social feed functionality
- `WardrobeItemDetail.test.js`: Tests for individual wardrobe item details
- `tokens.test.js`: Tests for the Terrace design tokens in `styles/` — hex validity, contrast ratios, scale ordering and the legacy `colors.js` shim (see `styles/README.md`)

## Mock Files

The `__mocks__` directory contains mock implementations for external dependencies:

- `hooks/`: Mock implementations of custom hooks
- `firebase/`: Mock implementations of Firebase services

## Running Tests

To run the test suite, use one of the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run a specific test file
npm test -- PlannerScreen.test.js
```

## Writing Tests

When writing new tests, follow these guidelines:

1. **File Naming**: Name test files with `.test.js` extension
2. **Test Structure**: Use the following structure:

   ```javascript
   describe("Component Name", () => {
     beforeEach(() => {
       // Setup code
     });

     it("should do something specific", () => {
       // Test code
     });
   });
   ```

3. **Mocking**: Use the existing mocks in `__mocks__` directory or create new ones as needed
4. **Testing Library**: Use React Native Testing Library for component testing
   ```javascript
   import { render, fireEvent } from "@testing-library/react-native";
   ```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies and services
3. **Coverage**: Aim for high test coverage, especially for critical paths
4. **Readability**: Write clear test descriptions and maintainable test code
5. **Performance**: Keep tests fast and efficient

## Common Patterns

### Mocking Firebase

```javascript
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));
```

### Mocking Custom Hooks

```javascript
jest.mock("../hooks/useWeather", () => ({
  __esModule: true,
  default: () => ({
    weather: { temperature: 20 },
    loading: false,
  }),
}));
```

### Testing Async Code

```javascript
it("should handle async operations", async () => {
  await act(async () => {
    // Async test code
  });
});
```

## Troubleshooting

If you encounter issues:

1. Check that all required mocks are in place
2. Verify that async operations are properly handled
3. Ensure test environment is properly configured
4. Check for any missing dependencies in `package.json`

## Contributing

When adding new tests:

1. Follow the existing patterns and structure
2. Add appropriate mocks for new dependencies
3. Update this documentation if necessary
4. Ensure tests pass before submitting PRs
