# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-journey.spec.ts >> Admin Journey >> should display login page elements properly
- Location: __tests__\e2e\admin-journey.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder(/email/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByPlaceholder(/email/i)

```

```yaml
- text: Internal Server Error
```