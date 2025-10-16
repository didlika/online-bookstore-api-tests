# Use official Playwright image with Node.js and browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.56.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set default environment variables (can be overridden)
ENV BASE_URL=https://fakerestapi.azurewebsites.net/api/v1
ENV TEST_DIR=./api-tests
ENV REPORTER=html
ENV WORKERS=2

# Run tests when container starts - generate HTML report and preserve exit code
CMD npx playwright test --reporter=html; EXIT_CODE=$?; exit $EXIT_CODE
