# Contributing to Deluthium Ecosystem Hub

Thank you for your interest in contributing to the Deluthium Ecosystem Hub! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/thetafunction/deluthium-Ecosystem-Hub/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Your environment (OS, Docker version, etc.)

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain why this would benefit the community

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/deluthium-Ecosystem-Hub.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Commit your changes**
   ```bash
   git commit -m "feat: add your feature description"
   ```
   
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then open a Pull Request on GitHub.

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for Portal development)
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/thetafunction/deluthium-Ecosystem-Hub.git
cd deluthium-Ecosystem-Hub

# Start services in development mode
docker-compose -f docker-compose.dev.yml up

# For Portal development
cd portal
npm install
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific adapter tests
cd docker/ccxt && npm test
cd docker/0x-adapter && npm test
```

## Directory Structure

```
deluthium-Ecosystem-Hub/
├── docker/           # Dockerfiles for each adapter
├── portal/           # Next.js frontend
├── api-monitor/      # Monitoring service
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript where possible
- Follow ESLint configuration
- Use Prettier for formatting

### Python

- Follow PEP 8
- Use type hints
- Format with Black

### Docker

- Use multi-stage builds
- Minimize image size
- Follow security best practices

## Documentation

- Update relevant docs when changing functionality
- Use clear, concise language
- Include code examples where helpful

## Questions?

Feel free to open an issue or reach out to the Deluthium team at [https://deluthium.ai](https://deluthium.ai).

Thank you for contributing!
