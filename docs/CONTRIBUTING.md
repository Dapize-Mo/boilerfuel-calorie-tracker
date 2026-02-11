# Contributing Guide

Thank you for your interest in contributing to BoilerFuel! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive. We're built on Purdue's values of integrity and community.

## Getting Started

### 1. Set Up Development Environment

**Fork and clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/boilerfuel-calorie-tracker.git
cd boilerfuel-calorie-tracker
git remote add upstream https://github.com/Dapize-Mo/boilerfuel-calorie-tracker.git
```

**Follow local setup guide:**
See [SETUP_LOCAL.md](SETUP_LOCAL.md) for detailed instructions.

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
git checkout -b docs/update-readme
```

**Branch naming conventions:**
- `feature/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation updates
- `refactor/` — Code improvements
- `test/` — Test additions
- `perf/` — Performance improvements

## Development Workflow

### Before Starting

1. **Check existing issues** — Avoid duplicate work
2. **Create an issue** if one doesn't exist
3. **Assign yourself** or comment "I'll work on this"
4. **Read relevant documentation** — Especially `ARCHITECTURE.md`

### While Developing

1. **Keep commits small and focused**
   ```bash
   git add specific-file.js
   git commit -m "Add dark mode toggle to dashboard"
   ```

2. **Write descriptive commit messages**
   ```
   format: <type>(<scope>): <subject>
   
   example: feat(dashboard): add water intake tracking
   example: fix(admin): prevent duplicate food entries
   ```

3. **Run tests frequently**
   ```bash
   npm test                    # Frontend
   pytest backend/tests -v     # Backend
   npm run lint                # Check code style
   ```

4. **Update documentation** if API changes
   - Comments in code
   - Update relevant .md files
   - Update CHANGELOG.md

### Testing Requirements

**Backend changes** require tests:
```bash
# Add tests to backend/tests/
python -m pytest tests/ -v

# Target 80%+ coverage
pytest --cov=backend tests/
```

**Frontend changes** should include tests:
```bash
# Add tests to __tests__/
npm test -- --coverage
```

**Avoid test skips** (`.skip()`, `.only()`) in PRs.

## Pull Request Process

### 1. Before Opening PR

```bash
# Update main branch
git fetch upstream
git rebase upstream/main

# Ensure all tests pass
npm test
pytest backend/tests -v

# Run linters
npm run lint
flake8 backend/

# Build check
npm run build
```

### 2. Open the Pull Request

**Title format:**
```
[type] Brief description
[feat] Add dark mode
[fix] Fix food filter bug
[docs] Update deployment guide
```

**Description template:**
```markdown
## Description
Brief explanation of the change.

## Related Issue
Closes #123

## Changes
- Bullet point 1
- Bullet point 2

## Testing
How did you test this change?

## Screenshots (if applicable)
![image]

## Checklist
- [ ] Tests pass (`npm test`, `pytest`)
- [ ] Code follows style guide
- [ ] Updated documentation
- [ ] No console errors/warnings
- [ ] Tested on mobile and desktop
```

### 3. Address Feedback

- Be open to suggestions
- Ask clarifying questions if needed
- Update code based on feedback
- Mark conversations as resolved
- Push updates to same branch (auto-updated PR)

### 4. Merge!

Maintainers will merge when:
- ✓ Tests pass
- ✓ Code review approved
- ✓ Changes are sensible
- ✓ No conflicts with main

## Code Style

### Frontend (JavaScript/React)

**Style enforced by ESLint:**
```bash
npm run lint --fix  # Auto-fix issues
```

**Best practices:**
- Use functional components with hooks
- Props validation with PropTypes or TypeScript
- Extract components when >150 lines
- Use semantic HTML
- Avoid `any` type
- 2-space indentation

**Example:**
```jsx
// ✓ Good
function MealCard({ meal, onDelete }) {
  return (
    <div className="meal-card">
      <h3>{meal.name}</h3>
      <p>{meal.calories} cal</p>
      <button onClick={() => onDelete(meal.id)}>
        Delete
      </button>
    </div>
  );
}

// ✗ Avoid
const MealCard = (props) => {
  return (
    <div>
      {/* Lots of inline styles */}
      <p style={{ fontSize: '20px', color: 'blue' }}>
        {/* Logic here */}
```

### Backend (Python)

**Style enforced by Flake8:**
```bash
flake8 backend/      # Check
black backend/       # Auto-format (if installed)
```

**Best practices:**
- Type hints on function signatures
- Docstrings for all public functions
- PEP 8 compliance (4-space indent)
- Custom error classes for exceptions
- No broad `except Exception`

**Example:**
```python
# ✓ Good
def get_foods_by_dining_court(court: str) -> List[Food]:
    """
    Fetch foods for a specific dining court.
    
    Args:
        court: Dining court name (e.g., 'Earhart')
    
    Returns:
        List of Food objects
    
    Raises:
        ValidationError: If court name is empty
    """
    if not court:
        raise ValidationError("Court name required")
    
    return Food.query.filter_by(dining_court=court).all()

# ✗ Avoid
def get_foods(court):
    try:
        return Food.query.filter_by(dining_court=court).all()
    except:
        return []
```

## Documentation Standards

### Code Comments
- Explain WHY, not WHAT
- Use for complex logic
- Keep up-to-date during refactoring

```python
# ✓ Good
# Cache menus for 24h to reduce API calls to Purdue
menu_cache.set(key, data, ttl=86400)

# ✗ Avoid
# Set menu cache
menu_cache.set(key, data)
```

### Docstrings
- Module level
- Function/class level
- Google-style format

```python
def calculate_net_calories(consumed: int, burned: int) -> int:
    """
    Calculate net calories for the day.
    
    Args:
        consumed: Total calories consumed (int)
        burned: Total calories burned (int)
    
    Returns:
        Net calories consumed - burned (int)
    
    Example:
        >>> calculate_net_calories(2000, 500)
        1500
    """
    return consumed - burned
```

### README & Docs
- Clear and concise
- Code examples where helpful
- Keep updated with feature changes
- Link to related docs

## Reporting Issues

**Bug Report Template:**
```markdown
## Description
Clear explanation of the bug.

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen?

## Actual Behavior
What actually happens?

## Environment
- OS: Windows 10
- Browser: Chrome 120
- Python: 3.13

## Screenshots
[Attach if applicable]
```

**Feature Request Template:**
```markdown
## Description
Why would this feature be useful?

## Use Case
Who benefits and how?

## Proposed Solution
How should this work?

## Alternatives
Other approaches considered?
```

## Testing Guidelines

### Backend Testing

```python
# Use fixtures in conftest.py
def test_get_foods(client):
    response = client.get('/api/foods')
    assert response.status_code == 200
    assert len(response.json) > 0

# Test error cases too
def test_get_foods_invalid_filter(client):
    response = client.get('/api/foods?dining_court=NoExist')
    assert response.status_code in [200, 404]  # Expect empty/not found
```

### Frontend Testing

```jsx
// Use React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';

test('meal card displays calories', () => {
  const meal = { name: 'Pizza', calories: 350 };
  render(<MealCard meal={meal} />);
  
  expect(screen.getByText('Pizza')).toBeInTheDocument();
  expect(screen.getByText('350 cal')).toBeInTheDocument();
});

test('delete button calls onDelete', () => {
  const onDelete = jest.fn();
  const meal = { id: 1, name: 'Pizza' };
  render(<MealCard meal={meal} onDelete={onDelete} />);
  
  fireEvent.click(screen.getByText('Delete'));
  expect(onDelete).toHaveBeenCalledWith(1);
});
```

## Performance Considerations

### Frontend
- Use React.memo for expensive components
- Lazy load images (`loading="lazy"`)
- Code split large components
- Minimize bundle size (check with `npm run build`)

### Backend
- Use database indexes on filtered fields
- Batch operations where possible
- Cache expensive queries
- Add query logging to identify bottlenecks

## Accessibility (A11y)

All changes should maintain WCAG 2.1 AA compliance:

```jsx
// ✓ Good - Semantic HTML + ARIA
<button 
  aria-label="Delete meal" 
  onClick={() => deleteMeal(id)}
>
  <TrashIcon />
</button>

// ✗ Avoid - Non-semantic
<div onClick={() => deleteMeal(id)}>
  Delete
</div>
```

Test with:
```bash
# Use axe DevTools browser extension
# or npm install -D @axe-core/react
```

## Questions?

- Ask in GitHub Discussions
- Open an issue for clarification
- Comment on related issues
- Check docs/ directory first

---

**Happy contributing!** 🚀
