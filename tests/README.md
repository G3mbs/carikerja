# Tests

This directory contains all test files for the CariKerja project.

## Test Files

- `auto-fill.js` - Tests for auto-fill parameter functionality
- `database.js` - Database connection and functionality tests
- `enhanced-prompting.js` - Enhanced prompting system tests
- `final-fix.js` - Final integration tests

## Running Tests

```bash
# Run individual tests
node tests/auto-fill.js
node tests/database.js
node tests/enhanced-prompting.js
node tests/final-fix.js

# Make sure the development server is running
npm run dev
```

## Notes

- Tests require the development server to be running on localhost:3000
- Some tests require database setup to be completed
- Tests are designed for development environment only
