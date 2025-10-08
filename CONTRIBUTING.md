## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes: `npm test && npm run test:e2e`
5. Format code: `npm run format`
6. Commit changes: `git commit -m 'feat: add your feature'`
7. Push to branch: `git push origin feature/your-feature-name`
8. Create a Pull Request

### Code Standards

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use Prettier for code formatting
- Document public APIs with JSDoc comments
- Follow conventional commit message format

### JSONata Development

When modifying JSONata expressions:

1. Validate syntax: `npm run prebuild`
2. Test with sample data in `assets/` directory
3. Update tests to cover new transformations
4. Document complex expressions with comments

## Testing

### Test Structure

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Test with coverage
npm run test -- --coverage

# Run specific test files
npm test -- handler.test.ts
```

### Test Categories

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Handler with mock Spark API
3. **JSONata Tests**: Expression validation and output verification

### Mock Server

Tests use a local mock server (`src/fixtures/server.ts`) to simulate Spark API responses:

```typescript
const localServer = new LocalServer();
await localServer.start(); // Starts on random port
// ... run tests
await localServer.stop();
```

## Developer Guide

### Development Tools

Other additional tools used in this project are:

- [TypeScript](https://www.typescriptlang.org/): for development and type checking
- [Jest](https://jestjs.io/): for running tests
- [Prettier](https://prettier.io/): for code formatting
- [JSONata](https://jsonata.org/): for data transformation
- [Rollup](https://rollupjs.org/): for bundling TypeScript into JavaScript

### Core Components

#### 1. Handler (`src/handler.ts`)

The main entry point that orchestrates the transformation pipeline:

- Compiles and executes request JSONata transform
- Makes HTTP requests to Spark API
- Processes response through response JSONata transform
- Handles errors and debugging information

#### 2. Utils (`src/utils.ts`)

Utility classes providing core functionality:

- **Utils**: JSONata compilation, HTTP requests, response formatting
- **Uri**: Service URI parsing and encoding
- **StringUtils**: String manipulation helpers
- **DateUtils**: Date parsing and validation
- **ExecuteMeta**: Metadata preparation for Spark requests

#### 3. Types (`src/types.ts`)

TypeScript type definitions for:

- `HandlerEvent`: complete event structure from Transform Document API
- `HandlerResponse`: structured response object with HTTP status, headers, and body
- `HttpResponse`: standardized response format
- `UriParams`: service URI components
- `MetadataParams`: execution metadata structure for Spark requests

#### 4. JSONata Transforms

- **Request Transform**: Extracts and maps insurance plan data fields
- **Response Transform**: Restructures Spark response into expected format

#### 5. Build System

- **Rollup**: Bundles TypeScript into optimized JavaScript
- **Scripts**: Validation, transform generation, and publishing utilities

### Data Flow

1. **Input**: Insurance plan data with coverage, benefits, and rate information
2. **Request Transform**: Maps ~100+ input fields to Spark-compatible format
3. **Spark Execution**: Processes data through rate engine calculations
4. **Response Transform**: Maps Spark outputs back to structured response
5. **Output**: Formatted response with rate cards, premiums, and calculated factors

### Key Design Patterns

- **Functional Programming**: heavy use of JSONata for data transformation
- **Error Handling**: structured error responses with debugging information
- **Modular Architecture**: clear separation of concerns between components

### API Reference

```typescript
async function handler(event: HandlerEvent): Promise<HandlerResponse>
```

**Parameters:**

- `event`: complete event object containing request, secrets, and context

**Returns:**

- `HandlerResponse`: structured response object with HTTP status, headers, and body

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed changes.
