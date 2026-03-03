# Contributing to BoilerFuel

Thank you for your interest in contributing to BoilerFuel! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

This project and everyone participating in it is governed by respect, professionalism, and inclusivity. By participating, you are expected to uphold these values.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/boilerfuel-calorie-tracker.git
   cd boilerfuel-calorie-tracker
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/Dapize-Mo/boilerfuel-calorie-tracker.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- PostgreSQL 14+ (or SQLite for local development)
- Git

### Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and secrets

# Initialize database
createdb boilerfuel
psql boilerfuel < ../db/schema.sql
psql boilerfuel < ../db/seed.sql
psql boilerfuel < ../db/retail_menu_seed.sql

# Run backend server
flask --app app run --debug
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy and configure environment variables
cp .env.example .env.local
# Edit .env.local with your API URL and secrets

# Run development server
npm run dev
```

Visit http://localhost:3000 to see the app running.

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** — Fix issues reported in GitHub Issues
- **New features** — Add new functionality (discuss in an issue first)
- **Documentation** — Improve README, code comments, or guides
- **Tests** — Add or improve test coverage
- **Performance** — Optimize code for better performance
- **UI/UX** — Improve design, accessibility, or user experience
- **Refactoring** — Improve code quality and maintainability

### Before You Start

1. **Check existing issues** to see if your idea is already being worked on
2. **Open an issue** to discuss your proposed changes (for features or major refactors)
3. **Get feedback** from maintainers before investing significant time

## Pull Request Process

1. **Create a feature branch** from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [code style guidelines](#code-style-guidelines)

3. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add dark mode toggle to settings"
   git commit -m "fix: resolve mobile menu overflow issue"
   ```

   Use conventional commit prefixes:
   - `feat:` — New feature
   - `fix:` — Bug fix
   - `docs:` — Documentation changes
   - `style:` — Code formatting (no logic changes)
   - `refactor:` — Code restructuring (no behavior changes)
   - `test:` — Adding or updating tests
   - `chore:` — Maintenance tasks

4. **Test your changes**:
   ```bash
   # Backend tests
   pytest backend/tests -v

   # Frontend tests
   npm test

   # Manual testing
   # Test your changes in browser at different screen sizes
   ```

5. **Sync with upstream** before submitting:
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues (e.g., "Fixes #123")
   - Describe what you changed and why
   - Include screenshots for UI changes
   - List any breaking changes

8. **Respond to feedback** from code reviews
   - Make requested changes in new commits
   - Push updates to your branch (PR will update automatically)

## Code Style Guidelines

### General Principles

- **Write clear, readable code** — Prioritize clarity over cleverness
- **Follow existing patterns** — Match the style of surrounding code
- **Keep functions small** — Each function should do one thing well
- **Use descriptive names** — Variables and functions should be self-explanatory
- **Comment when necessary** — Explain *why*, not *what*

### Frontend (JavaScript/React)

- Use **functional components** with hooks (no class components)
- Prefer **const** over let when possible
- Use **template literals** for string interpolation
- Follow **React best practices**:
  - Extract reusable components
  - Use proper key props in lists
  - Memoize expensive computations with `useMemo`
  - Clean up side effects in `useEffect`
- **Accessibility**:
  - Use semantic HTML
  - Include ARIA labels where needed
  - Ensure keyboard navigation works
  - Test with screen readers when possible

### Backend (Python/Flask)

- Follow **PEP 8** style guidelines
- Use **type hints** where helpful
- Write **docstrings** for functions and classes
- Handle errors gracefully with proper status codes
- Validate input data
- Use environment variables for configuration

### CSS/Tailwind

- Use **Tailwind utility classes** when possible
- Follow the **mobile-first** approach
- Use **responsive breakpoints** (sm:, md:, lg:, xl:)
- Maintain **dark mode compatibility**
- Keep custom CSS minimal

## Testing

### Backend Tests

```bash
# Run all tests
pytest backend/tests -v

# Run specific test file
pytest backend/tests/test_foods.py -v

# Check test coverage
pytest backend/tests --cov=backend --cov-report=html
```

### Frontend Tests

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint
```

### Manual Testing Checklist

Before submitting a PR, test:
- ✅ Works on desktop (Chrome, Firefox, Safari)
- ✅ Works on mobile (responsive design)
- ✅ Works in dark mode and light mode
- ✅ No console errors
- ✅ Proper error handling for edge cases
- ✅ Accessibility (keyboard navigation, screen reader)

## Reporting Bugs

When reporting a bug, please include:

1. **Clear title** — Summarize the issue in one line
2. **Description** — What happened vs. what you expected
3. **Steps to reproduce**:
   - Step 1
   - Step 2
   - Step 3
4. **Environment**:
   - OS: (e.g., Windows 11, macOS 14.2)
   - Browser: (e.g., Chrome 120, Firefox 121)
   - Device: (e.g., Desktop, iPhone 14)
5. **Screenshots** — If applicable
6. **Console errors** — Any JavaScript/Python errors

## Suggesting Features

We love feature ideas! When suggesting a feature:

1. **Check existing issues** to avoid duplicates
2. **Explain the problem** you're trying to solve
3. **Describe your solution** in detail
4. **Consider alternatives** — Are there other approaches?
5. **Discuss impact** — Who benefits? Any downsides?

## Questions?

If you have questions about contributing:

- Open a [discussion](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/discussions)
- Check existing [issues](https://github.com/Dapize-Mo/boilerfuel-calorie-tracker/issues)
- Contact the maintainers

Thank you for contributing to BoilerFuel! 🚀
