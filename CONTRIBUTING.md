# Contributing to Breez SDK MCP Server

We welcome contributions to the Breez SDK MCP Server! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/breez-sdk-mcp-server.git
   cd breez-sdk-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run in development mode:**
   ```bash
   npm run dev
   ```

## Code Style

- Use TypeScript for all code
- Follow existing code patterns and structure
- Use meaningful variable and function names
- Add JSDoc comments for public methods
- Keep functions focused and small

## Project Structure

```
src/
├── config/          # Configuration management
├── services/        # Business logic and SDK integration
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── server.ts        # MCP server implementation
└── index.ts         # Application entry point
```

## Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation if needed

3. **Test your changes:**
   ```bash
   npm run build
   npm run dev
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request**

## Commit Message Convention

We use conventional commits for consistent commit messages:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Pull Request Guidelines

- Provide a clear description of the changes
- Include the motivation for the changes
- List any breaking changes
- Reference related issues if applicable
- Ensure all checks pass

## Testing

Currently, the project uses manual testing. Future contributions for automated testing are welcome:

- Unit tests for individual components
- Integration tests for MCP tools
- End-to-end tests for complete workflows

## Security

- Never commit sensitive information (API keys, private keys, etc.)
- Use environment variables for configuration
- Follow security best practices for crypto operations
- Report security vulnerabilities privately

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for new public methods
- Update type definitions as needed
- Include examples for new features

## Questions?

If you have questions about contributing, please:

1. Check existing issues and discussions
2. Create a new issue for discussion
3. Reach out to maintainers

Thank you for contributing!