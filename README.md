# Online Bookstore API Tests

Automated API testing suite for the Online Bookstore application using Playwright Test framework.

## 📋 Table of Contents

- [Overview](#-overview)
- [Prerequisites](#-prerequisites)
- [Project Setup](#-project-setup)
- [Running Tests](#-running-tests)
  - [Local Execution](#local-execution)
  - [Docker Execution](#docker-execution)
  - [CICD Execution](#cicd-execution)
- [Test Reports](#-test-reports)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Contributing](#-contributing)

## 🎯 Overview

This project contains comprehensive API tests for the Online Bookstore REST API, covering:

- **Authors API** - GET, POST, PUT, DELETE operations
- **Books API** - GET, POST, PUT, DELETE operations

### Test Coverage

- ✅ CRUD operations validation
- ✅ Schema validation
- ✅ Error handling and edge cases
- ✅ Boundary testing
- ✅ Field validation (nullable, max length, data types)
- ✅ Status code verification

## 📦 Prerequisites

### For Local Development:
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### For Docker:
- **Docker** (v20 or higher)
- **Docker Compose** (optional, v2 or higher)

### For CI/CD:
- GitHub account with Actions enabled
- GitHub Pages enabled (for report publishing)

## 🚀 Project Setup

### Local Setup

1. **Clone the repository:**
```bash
git clone https://github.com/didlika/online-bookstore-api-tests.git
cd online-bookstore-api-tests
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install Playwright browsers (if needed):**
```bash
npx playwright install
```

### Docker Setup

1. **Build the Docker image:**
```bash
docker build -t bookstore-api-tests:latest .
```

## 🧪 Running Tests

### Local Execution

#### Run all tests:
```bash
npm test
```

#### Run specific test file:
```bash
npx playwright test api/authors-get.spec.ts
```

#### Run tests with custom base URL:
```bash
BASE_URL="https://your-api.com/api/v1" npm test
```

#### Run specific test suites:
```bash
# Authors tests only
npx playwright test api/authors-*.spec.ts

# Books tests only
npx playwright test api/books-*.spec.ts

# GET tests only
npx playwright test api/*-get.spec.ts
```

### Docker Execution

#### Option 1: Using Docker Run (Basic)

**Run tests with default configuration:**
```bash
docker run --rm bookstore-api-tests:latest
```

**Run with custom base URL:**
```bash
docker run --rm \
  -e BASE_URL="https://your-api.com/api/v1" \
  bookstore-api-tests:latest 
```

**Run and save reports locally:**
```bash
docker run --rm \
  -e BASE_URL="https://fakerestapi.azurewebsites.net/api/v1" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/test-results:/app/test-results" \
  bookstore-api-tests:latest
```

#### Option 2: Using Docker Compose

**Run tests:**
```bash
docker-compose up
```

**Run with custom base URL:**
```bash
BASE_URL="https://your-api.com/api/v1" docker-compose up
```

**Clean up:**
```bash
docker-compose down
```

### CI/CD Execution

The project includes GitHub Actions workflow that automatically runs tests on:

- ✅ Every push to any branch
- ✅ Pull requests to `main` or `develop` branches
- ✅ Manual workflow dispatch

#### Trigger Manual Run:

1. Go to **Actions** tab in GitHub
2. Select **"API Tests CI/CD"** workflow
3. Click **"Run workflow"**
4. Optionally set custom **base URL**
5. Click **"Run workflow"** button

## 📊 Test Reports

### Viewing Reports Locally

After running tests locally, open the HTML report:

```bash
# macOS
open playwright-report/index.html

# Linux
xdg-open playwright-report/index.html

# Windows
start playwright-report/index.html
```

Or use Playwright's built-in server:
```bash
npx playwright show-report
```

### Viewing Reports from Docker

After running tests with volume mounts:
```bash
open playwright-report/index.html
```

### Viewing Reports from CI/CD

Reports are automatically published to GitHub Pages on each commit and accessible via:
[https://github.com/didlika/online-bookstore-api-tests/actions/workflows/automation-tests.yml](https://github.com/didlika/online-bookstore-api-tests/actions/workflows/automation-tests.yml)


### Report Features

The HTML report includes:
- ✅ Test results overview (passed/failed/skipped)
- ✅ Execution time and statistics
- ✅ Detailed test logs
- ✅ Request/response details
- ✅ Trace viewer for failed tests
- ✅ Filterable and searchable results

## 📁 Project Structure

```
online-bookstore-api-tests/
├── api-tests/                    # Test files
│   ├── authors/                  # Authors API tests
│   │   ├── authors-delete.spec.ts
│   │   ├── authors-get.spec.ts
│   │   ├── authors-post.spec.ts
│   │   └── authors-put.spec.ts
│   └── books/                    # Books API tests
│       ├── books-delete.spec.ts
│       ├── books-get.spec.ts
│       ├── books-post.spec.ts
│       └── books-put.spec.ts
├── utils/                        # Helper utilities
│   ├── apiRequests.ts            # API request wrapper
│   └── dataGenerator.ts          # Test data generators
├── fixtures/                     # Test fixtures and data
│   └── testConstants.ts          # Shared test constants
├── .github/
│   └── workflows/
│       └── automation-tests.yml  # CI/CD pipeline
├── playwright-report/            # Generated test reports
├── test-results/                 # Test execution artifacts
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Project dependencies
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker Compose configuration
├── run-tests.sh                  # Test execution script
├── .dockerignore                 # Docker build exclusions
├── DOCKER.md                     # Docker documentation
└── README.md                     # This file
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | API base URL for testing | `https://fakerestapi.azurewebsites.net/api/v1` |
| `CI` | Enable CI mode (retries, workers) | `false` (local), `true` (CI) |

### Playwright Configuration

Edit `playwright.config.ts` to customize:

- **Test directory:** Change `testDir`
- **Parallel execution:** Modify `fullyParallel`
- **Retries:** Adjust `retries` for CI/local
- **Workers:** Configure `workers` for parallel execution
- **Reporters:** Add/remove reporters (html, line, json, etc.)
- **Timeout:** Set global timeout values

### Docker Configuration

Edit `Dockerfile` to customize:
- Node.js/Playwright version
- Default environment variables
- Container behavior

## 🤝 Contributing

1. Create a feature branch
2. Add/modify tests
3. Run tests locally: `npm test`
4. Format code: `npm run format`
5. Commit changes with clear messages
6. Create a pull request
7. Wait for CI checks to pass
8. Review the test report in the PR comment

---

**Happy Testing! 🎭**
