# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer-journey.spec.ts >> Customer Journey >> should navigate to the homepage and view best sellers
- Location: __tests__\e2e\customer-journey.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /JD Store/
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    13 × unexpected value ""

```

```yaml
- text: Internal Server Error
```